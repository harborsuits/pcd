import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, Home, Settings2, ExternalLink, Activity, MessageCircle, FolderOpen, Globe, Phone, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkAdminRole } from "@/lib/adminFetch";
import { supabase } from "@/integrations/supabase/client";
import { AIReceptionistSetup } from "@/components/portal/AIReceptionistSetup";
import { SessionExpiredModal } from "@/components/portal/SessionExpiredModal";
import { useSessionExpiry, storeAuthReturnPath } from "@/hooks/useSessionExpiry";
import { useToast } from "@/hooks/use-toast";
import { UpdatesTab, MessagesTab, FilesTab, WebsiteTab, AIReceptionistTab } from "@/components/portal/workspace/tabs";
import type { Version } from "@/components/portal/workspace/VersionsList";
import { useAuthReady } from "@/hooks/useAuthReady";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface NeedsInfoItem {
  key: string;
  label: string;
  required?: boolean;
}

interface IntakeData {
  // Core fields from new simplified wizard
  businessName?: string;
  businessType?: string;
  primaryGoal?: string;
  sellType?: string;
  timeline?: string;
  deadlineDate?: string;
  readiness?: string;
  involvement?: string;
  serviceArea?: string;
  contactEmail?: string;
  contactPhone?: string;
  // Service type
  service_type?: 'website' | 'ai_receptionist' | 'both';
  // Legacy fields
  goals?: string[];
  assetsReadiness?: string;
  involvementPreference?: string;
  websiteStatus?: string;
  readinessAssets?: string[];
  notes?: string;
  // AI Receptionist fields
  business_phone?: string;
  business_hours?: string;
  services_offered?: string;
  escalation_number?: string;
  emergency_rules?: string;
  preferred_tone?: string;
  booking_link?: string;
  faqs?: string;
  call_handling?: string;
  after_hours_action?: string;
  text_handling?: string[];
  handoff_method?: string;
  team_names?: string;
  customer_faqs?: string;
  do_not_say?: string;
  guarantees_policies?: string;
  business_personality?: string[];
  lead_fields?: string[];
  qualified_lead_rules?: string;
  service_constraints?: string;
  service_area_rules?: string;
  pricing_guidance?: string;
  handoff_triggers?: string[];
}

interface ProjectInfo {
  id: string;
  businessName: string;
  intakeStatus: 'draft' | 'submitted' | 'approved' | null;
  pipelineStage: string;
  portalStage: string;
  status: 'lead' | 'contacted' | 'interested' | 'client' | 'completed' | 'archived' | null;
  intakeData: IntakeData | null;
  needsInfo: boolean;
  needsInfoItems: NeedsInfoItem[];
  needsInfoNote: string | null;
  aiStatus: 'intake_received' | 'review' | 'setup' | 'testing' | 'live' | 'paused' | null;
}

export default function WorkspacePage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [activeTab, setActiveTab] = useState("updates");
  
  // AI Trial modal state
  const [showAITrialModal, setShowAITrialModal] = useState(false);

  // Session expiry monitoring and auth modal
  const { showAuthModal, setShowAuthModal } = useSessionExpiry();

  // Server-verified operator status (NOT localStorage-based)
  const [isOperator, setIsOperator] = useState(false);
  const [operatorCheckDone, setOperatorCheckDone] = useState(false);
  
  // Get session from single source of truth
  const { hydrated, session: authSession } = useAuthReady();
  
  // Determine service type and what tabs to show
  const serviceType = projectInfo?.intakeData?.service_type || 'website';
  const includesWebsite = serviceType === 'website' || serviceType === 'both';
  const includesAI = serviceType === 'ai_receptionist' || serviceType === 'both';
  const hasVersions = versions.length > 0;
  
  // Server-side operator verification - uses session from useAuthReady
  const verifyOperatorStatus = useCallback(async () => {
    if (!token) {
      setOperatorCheckDone(true);
      return;
    }
    
    // Use session from useAuthReady - NO getSession() call
    if (!authSession?.access_token || !authSession?.user?.id) {
      setIsOperator(false);
      setOperatorCheckDone(true);
      return;
    }
    
    // Check admin role - pass user ID directly
    const isAdmin = await checkAdminRole(authSession.user.id);
    if (!isAdmin) {
      setIsOperator(false);
      setOperatorCheckDone(true);
      return;
    }
    
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/whoami`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${authSession.access_token}`,
          },
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        setIsOperator(data.is_operator === true);
      } else {
        setIsOperator(false);
      }
    } catch (err) {
      console.error("Operator verification failed:", err);
      setIsOperator(false);
    } finally {
      setOperatorCheckDone(true);
    }
  }, [token, authSession]);
  
  // Handle ai_trial query param
  useEffect(() => {
    if (searchParams.get("ai_trial") === "start") {
      setShowAITrialModal(true);
      navigate(`/w/${token}`, { replace: true });
    }
  }, [searchParams, token, navigate]);

  // Fetch project info
  const fetchProjectInfo = useCallback(async () => {
    if (!token) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || SUPABASE_ANON_KEY;
      
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await res.json();
      
      // Handle 401 with requires_auth - redirect to login
      if (res.status === 401 && data.requires_auth) {
        storeAuthReturnPath(`/w/${token}`);
        // If no session at all, redirect directly to portal login
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          navigate("/portal", { replace: true });
          return;
        }
        // If session exists but is invalid/expired, show modal
        setShowAuthModal(true);
        return;
      }
      
      if (res.ok && data.business) {
        const rawIntake = data.intake_json || {};
        setProjectInfo({
          id: data.business.id || "",
          businessName: data.business.name,
          intakeStatus: data.intake_status,
          pipelineStage: data.business.pipeline_stage || "new",
          portalStage: data.business.portal_stage || "intake",
          status: data.business.status || null,
          intakeData: rawIntake,
          needsInfo: data.business.needs_info || false,
          needsInfoItems: data.business.needs_info_items || [],
          needsInfoNote: data.business.needs_info_note || null,
          aiStatus: data.business.ai_trial_status || null,
        });
      }
    } catch (err) {
      console.error("Fetch project info error:", err);
    }
  }, [token, setShowAuthModal]);

  // Fetch prototypes (versions)
  const fetchVersions = useCallback(async () => {
    if (!token) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || SUPABASE_ANON_KEY;
      
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/prototypes`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok && data.prototypes) {
        setVersions(data.prototypes);
      } else {
        setError(data.error || "Failed to load versions");
      }
    } catch (err) {
      console.error("Fetch versions error:", err);
      setError("Failed to load workspace");
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([
        fetchProjectInfo(), 
        fetchVersions(), 
        verifyOperatorStatus(),
      ]);
      setLoading(false);
    };
    load();
  }, [fetchProjectInfo, fetchVersions, verifyOperatorStatus]);

  // Request change handler
  const handleRequestChange = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || SUPABASE_ANON_KEY;
      
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/help-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ 
            type: "change_request",
            message: "Client requested a change" 
          }),
        }
      );
      
      if (res.ok) {
        toast({
          title: "Request sent!",
          description: "We'll reach out to confirm details.",
        });
      } else {
        toast({
          title: "Request noted",
          description: "Reply to any email from us or we'll reach out.",
        });
      }
    } catch (err) {
      toast({
        title: "Request noted",
        description: "Reply to any email from us or we'll reach out.",
      });
    }
  };

  // Wait for auth hydration, loading AND operator check to complete
  if (!hydrated || loading || !operatorCheckDone) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">{error}</h2>
          <p className="text-muted-foreground">
            Please check your link and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to={isOperator ? "/operator" : "/portal?list=true"}>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{isOperator ? "Operator" : "My Projects"}</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span className="text-sm font-semibold">{projectInfo?.businessName}</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {serviceType === 'both' ? 'Website + AI' : 
               serviceType === 'ai_receptionist' ? 'AI Receptionist' : 'Website'}
            </Badge>
            {isOperator && (
              <>
                <Link to={`/c/${token}`} target="_blank">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                    <ExternalLink className="h-3 w-3" />
                    Client View
                  </Button>
                </Link>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                  <Settings2 className="h-3 w-3 mr-1" />
                  Operator
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content with tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        {/* Tab navigation */}
        <div className="border-b border-border px-4 bg-muted/30 flex-shrink-0">
          <TabsList className="h-11 bg-transparent p-0 gap-1">
            <TabsTrigger 
              value="updates" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Updates</span>
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger 
              value="files" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Files</span>
            </TabsTrigger>
            {includesWebsite && (
              <TabsTrigger 
                value="website" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Website</span>
                {hasVersions && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-500/10 text-green-600 rounded">
                    {versions.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {includesAI && (
              <TabsTrigger 
                value="ai" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">AI Receptionist</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0">
          <TabsContent value="updates" className="h-full m-0">
            <UpdatesTab
              projectStatus={projectInfo?.status || null}
              intakeStatus={projectInfo?.intakeStatus || null}
              portalStage={projectInfo?.portalStage || 'intake'}
              serviceType={serviceType}
              aiStatus={projectInfo?.aiStatus || null}
              hasVersions={hasVersions}
              businessName={projectInfo?.businessName || ''}
              needsInfo={projectInfo?.needsInfo}
              needsInfoItems={projectInfo?.needsInfoItems}
              needsInfoNote={projectInfo?.needsInfoNote}
              onRequestChange={handleRequestChange}
              onUploadFiles={() => setActiveTab('files')}
            />
          </TabsContent>
          
          <TabsContent value="messages" className="h-full m-0">
            <MessagesTab 
              token={token!} 
              businessName={projectInfo?.businessName || ''} 
            />
          </TabsContent>
          
          <TabsContent value="files" className="h-full m-0">
            <FilesTab token={token!} />
          </TabsContent>
          
          {includesWebsite && (
            <TabsContent value="website" className="h-full m-0">
              <WebsiteTab
                versions={versions}
                intakeStatus={projectInfo?.intakeStatus || null}
                hasVersions={hasVersions}
                token={token!}
              />
            </TabsContent>
          )}
          
          {includesAI && (
            <TabsContent value="ai" className="h-full m-0">
              <AIReceptionistTab
                aiStatus={projectInfo?.aiStatus || null}
                intakeData={projectInfo?.intakeData}
                onRequestChange={handleRequestChange}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>

      {/* AI Receptionist Setup Wizard (for trial offer) */}
      <AIReceptionistSetup
        open={showAITrialModal}
        onClose={() => setShowAITrialModal(false)}
        onComplete={async (data) => {
          try {
            const res = await fetch(
              `${SUPABASE_URL}/functions/v1/portal/${token}/ai-trial`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({ action: "setup_complete", setupData: data }),
              }
            );
            if (!res.ok) {
              console.error("AI trial setup failed:", await res.text());
            }
          } catch (err) {
            console.error("AI trial setup error:", err);
          }
        }}
        businessName={projectInfo?.businessName || "your business"}
      />

      {/* Session Expired Modal */}
      <SessionExpiredModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
      />
    </div>
  );
}
