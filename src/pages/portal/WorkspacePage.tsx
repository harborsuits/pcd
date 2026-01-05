import { useParams, Link } from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, CheckCircle2, Clock, Rocket, FileText, Upload, Image, Palette, MapPin, Phone, Calendar, ClipboardList, LucideIcon, Settings2, Home, ExternalLink } from "lucide-react";
import { ProjectWorkspace, type Version, type CommentData } from "@/components/portal/workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminKey } from "@/lib/adminFetch";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface NeedsInfoItem {
  key: string;
  label: string;
  required?: boolean;
}

interface IntakeData {
  businessName?: string;
  businessType?: string;
  primaryGoal?: string;
  timeline?: string;
  assetsReadiness?: string;
  involvementPreference?: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);

  // Check if user has operator access
  const isOperator = !!getAdminKey();

  // Fetch project info
  const fetchProjectInfo = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok && data.business) {
        setProjectInfo({
          id: data.business.id || "",
          businessName: data.business.name,
          intakeStatus: data.intake_status,
          pipelineStage: data.business.pipeline_stage || "new",
          portalStage: data.business.portal_stage || "intake",
          intakeData: data.intake_json || null,
          needsInfo: data.business.needs_info || false,
          needsInfoItems: data.business.needs_info_items || [],
          needsInfoNote: data.business.needs_info_note || null,
        });
      }
    } catch (err) {
      console.error("Fetch project info error:", err);
    }
  }, [token]);

  // Fetch prototypes (versions)
  const fetchVersions = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/prototypes`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/comments`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
      await Promise.all([fetchProjectInfo(), fetchVersions(), fetchComments()]);
      setLoading(false);
    };
    load();
  }, [fetchProjectInfo, fetchVersions, fetchComments]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || versions.length === 0) {
    // Show a "waiting for preview" state if no versions but project exists
    const config = getStatusConfig(projectInfo?.intakeStatus || "submitted");
    const Icon = config.Icon;

    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Status banner */}
        {projectInfo && (
          <div className="border-b border-border bg-muted/30 px-4 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={config.colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
                <span className="text-sm font-medium">{projectInfo.businessName}</span>
              </div>
              {isOperator && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                  <Settings2 className="h-3 w-3 mr-1" />
                  Operator
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            {error ? (
              <>
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h2 className="text-xl font-bold mb-2">{error}</h2>
                <p className="text-muted-foreground">
                  Please check your link and try again.
                </p>
              </>
            ) : (
              <>
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  {projectInfo?.intakeStatus === "approved" 
                    ? "We're Building Your Site" 
                    : "Your Preview is Coming Soon"}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {config.hint}
                </p>
                {projectInfo?.intakeStatus === "submitted" && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Intake submitted successfully
                  </div>
                )}
                {projectInfo?.intakeStatus === "approved" && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Intake approved — build in progress
                  </div>
                )}
              </>
            )}
          </div>
        </div>
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
          onRefreshProject={fetchProjectInfo}
        />
      </div>
    </div>
  );
}