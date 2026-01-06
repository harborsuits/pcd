import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, CheckCircle2, Clock, Rocket, FileText, Upload, Image, Palette, MapPin, Phone, Calendar, ClipboardList, LucideIcon, Settings2, Home, ExternalLink } from "lucide-react";
import { ProjectWorkspace, type Version, type CommentData } from "@/components/portal/workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminKey } from "@/lib/adminFetch";
import { supabase } from "@/integrations/supabase/client";
import { AIReceptionistSetup } from "@/components/portal/AIReceptionistSetup";
import { SessionExpiredModal } from "@/components/portal/SessionExpiredModal";
import { useSessionExpiry, storeAuthReturnPath } from "@/hooks/useSessionExpiry";


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
  // Legacy fields
  goals?: string[];
  assetsReadiness?: string;
  involvementPreference?: string;
  websiteStatus?: string;
  readinessAssets?: string[];
  notes?: string;
}

interface PhaseBData {
  logoStatus?: "uploaded" | "create" | "help" | "" | null;
  brandColors?: string | null;
  colorPreference?: "pick_for_me" | "custom" | "" | null;
  businessDescription?: string | null;
  services?: string | null;
  serviceArea?: string | null;
  differentiators?: string | null;
  faq?: string | null;
  primaryGoal?: "book" | "quote" | "call" | "portfolio" | "learn" | "visit" | "" | null;
  photosPlan?: "upload" | "generate" | "none" | "help" | "" | null;
  photosUploaded?: number | null;
  generatedPhotoSubjects?: string | null;
  generatedPhotoStyle?: "realistic" | "studio" | "lifestyle" | "minimal" | "" | null;
  generatedPhotoNotes?: string | null;
  placeholderOk?: boolean | null;
  googleReviewsLink?: string | null;
  certifications?: string | null;
  hasBeforeAfter?: "yes" | "coming_soon" | "no" | "" | null;
  vibe?: "modern" | "classic" | "luxury" | "bold" | "minimal" | "cozy" | "" | null;
  tone?: "professional" | "friendly" | "direct" | "playful" | "" | null;
  exampleSites?: string | null;
  mustInclude?: string | null;
  mustAvoid?: string | null;
  contentNeedsHelp?: boolean;
  styleNeedsHelp?: boolean;
}

interface ProjectInfo {
  id: string;
  businessName: string;
  intakeStatus: 'draft' | 'submitted' | 'approved' | null;
  pipelineStage: string;
  portalStage: string;
  intakeData: IntakeData | null;
  needsInfo: boolean;
  needsInfoItems: NeedsInfoItem[];
  needsInfoNote: string | null;
  phaseBStatus: 'pending' | 'in_progress' | 'complete' | null;
  phaseBData: PhaseBData | null;
}

// Status banner configuration
function getStatusConfig(status: string | null) {
  switch (status) {
    case "submitted":
      return {
        label: "Intake Under Review",
        Icon: Clock,
        colorClass: "bg-amber-500/10 text-amber-600 border-amber-200",
        hint: "We're reviewing your intake. You'll be notified when we start building.",
      };
    case "approved":
      return {
        label: "In Progress",
        Icon: Rocket,
        colorClass: "bg-primary/10 text-primary border-primary/20",
        hint: "Your project is approved and we're building your site.",
      };
    case "draft":
      return {
        label: "Intake Incomplete",
        Icon: FileText,
        colorClass: "bg-muted text-muted-foreground border-border",
        hint: "Please complete your intake to move forward.",
      };
    default:
      return {
        label: "Intake Under Review",
        Icon: Clock,
        colorClass: "bg-amber-500/10 text-amber-600 border-amber-200",
        hint: "We're reviewing your intake. You'll be notified when we start building.",
      };
  }
}

export default function WorkspacePage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  
  // AI Trial modal state
  const [showAITrialModal, setShowAITrialModal] = useState(false);

  // Session expiry monitoring and auth modal
  const { showAuthModal, setShowAuthModal } = useSessionExpiry();

  // Server-verified operator status (NOT localStorage-based)
  const [isOperator, setIsOperator] = useState(false);
  const [operatorCheckDone, setOperatorCheckDone] = useState(false);
  
  // Server-side operator verification
  const verifyOperatorStatus = useCallback(async () => {
    if (!token) {
      setOperatorCheckDone(true);
      return;
    }
    
    const adminKey = getAdminKey();
    if (!adminKey) {
      // No admin key in storage, definitely not an operator
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
            "x-admin-key": adminKey,
          },
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        setIsOperator(data.is_operator === true);
      } else {
        // Invalid or unauthorized, not an operator
        setIsOperator(false);
      }
    } catch (err) {
      console.error("Operator verification failed:", err);
      setIsOperator(false);
    } finally {
      setOperatorCheckDone(true);
    }
  }, [token]);
  
  // Handle ai_trial query param
  useEffect(() => {
    if (searchParams.get("ai_trial") === "start") {
      setShowAITrialModal(true);
      // Remove the query param from URL without reload
      navigate(`/w/${token}`, { replace: true });
    }
  }, [searchParams, token, navigate]);

  // Fetch project info
  const fetchProjectInfo = useCallback(async () => {
    if (!token) return;

    try {
      // Get user session for auth
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
      
      // Handle 401 with requires_auth - show re-login modal
      if (res.status === 401 && data.requires_auth) {
        storeAuthReturnPath(`/w/${token}`);
        setShowAuthModal(true);
        return;
      }
      
      if (res.ok && data.business) {
        // Map intake_json from API to intakeData (can be the full intake object)
        const rawIntake = data.intake_json || {};
        setProjectInfo({
          id: data.business.id || "",
          businessName: data.business.name,
          intakeStatus: data.intake_status,
          pipelineStage: data.business.pipeline_stage || "new",
          portalStage: data.business.portal_stage || "intake",
          intakeData: rawIntake,
          needsInfo: data.business.needs_info || false,
          needsInfoItems: data.business.needs_info_items || [],
          needsInfoNote: data.business.needs_info_note || null,
          phaseBStatus: data.phase_b_status || null,
          phaseBData: data.phase_b_data || null,
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

  // Fetch all comments
  const fetchComments = useCallback(async () => {
    if (!token) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || SUPABASE_ANON_KEY;
      
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/comments`,
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
      if (res.ok && data.comments) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error("Fetch comments error:", err);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([
        fetchProjectInfo(), 
        fetchVersions(), 
        fetchComments(),
        verifyOperatorStatus(),
      ]);
      setLoading(false);
    };
    load();
  }, [fetchProjectInfo, fetchVersions, fetchComments, verifyOperatorStatus]);

  // Wait for both loading AND operator check to complete
  if (loading || !operatorCheckDone) {
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

  // Client Portal Home - shown when no versions exist yet (post-intake)
  // Only show this client-facing screen if NOT an operator
  if (versions.length === 0 && !isOperator) {
    const config = getStatusConfig(projectInfo?.intakeStatus || "submitted");
    const Icon = config.Icon;

    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Header with back navigation */}
        <div className="border-b border-border bg-card/80 backdrop-blur-sm px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <Link 
              to="/portal" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Pleasant Cove Design</span>
            </Link>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={config.colorClass}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
              <span className="text-sm font-medium">{projectInfo?.businessName}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 py-12">
            {/* Success confirmation card */}
            <div className="bg-card border border-border rounded-xl p-6 text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 text-green-600 mb-5">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <h2 className="font-serif text-2xl font-bold mb-2">
                We've got what we need
              </h2>
              <p className="text-muted-foreground mb-6">
                We're reviewing your intake and preparing next steps.
                <br />
                <span className="text-foreground/80">Nothing else needed from you right now.</span>
              </p>

              {/* What happens next */}
              <div className="bg-muted/40 rounded-lg p-4 text-left text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">What happens next:</span>{" "}
                  We'll have your first preview ready within 24–48 hours. You'll get a notification when it's time to review.
                </p>
              </div>

              {projectInfo?.intakeStatus === "submitted" && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Intake submitted successfully
                </div>
              )}
              {projectInfo?.intakeStatus === "approved" && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Intake approved — build in progress
                </div>
              )}
            </div>


            {/* AI Receptionist Trial Offer */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground mb-2">
                    While we're setting things up…
                  </p>
                  <h3 className="font-medium mb-1">
                    Try our AI receptionist free for a week
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    It answers calls, captures leads, and follows up automatically — no setup stress, no commitment.
                  </p>
                  
                  <Button 
                    onClick={() => setShowAITrialModal(true)}
                    className="w-full"
                    size="sm"
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    Try it free for a week
                  </Button>
                  
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Totally optional. If you don't like it, we'll turn it off.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              Questions? Just reply to any email from us.
            </p>
          </div>
        </div>

        {/* AI Receptionist Setup Wizard */}
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

  // Render status banner + workspace when versions exist
  const config = getStatusConfig(projectInfo?.intakeStatus || "approved");
  const Icon = config.Icon;

  // Icon mapping for info items
  const INFO_ICONS: Record<string, LucideIcon> = {
    logo: Palette,
    photos: Image,
    services: ClipboardList,
    service_area: MapPin,
    contact: Phone,
    booking: Calendar,
    brand_colors: Palette,
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Status banner */}
      {projectInfo && (
        <div className="border-b border-border bg-muted/30 px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
              <div className="h-4 w-px bg-border" />
              <Badge variant="outline" className={config.colorClass}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
              <span className="text-sm font-medium">{projectInfo.businessName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {versions.length} version{versions.length !== 1 ? "s" : ""} available
              </span>
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
      )}

      {/* Action Needed Banner (client-facing) */}
      {projectInfo?.needsInfo && projectInfo.needsInfoItems.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-amber-800 dark:text-amber-300">Action Needed</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                  {projectInfo.needsInfoNote || "We need a couple things before we can continue building."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {projectInfo.needsInfoItems.map((item) => {
                    const ItemIcon = INFO_ICONS[item.key] || Upload;
                    return (
                      <div
                        key={item.key}
                        className="flex items-center gap-2 bg-white dark:bg-background border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <ItemIcon className="h-3.5 w-3.5 text-amber-600" />
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workspace (3-column layout with operator tab integrated) */}
      <div className="flex-1 min-h-0">
        <ProjectWorkspace
          token={token!}
          versions={versions}
          comments={comments}
          onRefreshComments={fetchComments}
          projectId={projectInfo?.id}
          intakeStatus={projectInfo?.intakeStatus}
          pipelineStage={projectInfo?.pipelineStage}
          portalStage={projectInfo?.portalStage}
          intakeData={projectInfo?.intakeData}
          phaseBStatus={projectInfo?.phaseBStatus}
          phaseBData={projectInfo?.phaseBData}
          onRefreshProject={fetchProjectInfo}
        />
      </div>

      {/* AI Receptionist Setup Wizard */}
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