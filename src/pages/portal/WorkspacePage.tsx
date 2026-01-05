import { useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, CheckCircle2, Clock, Rocket, FileText, Eye, EyeOff, ExternalLink } from "lucide-react";
import { ProjectWorkspace, type Version, type CommentData } from "@/components/portal/workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OperatorPanel } from "@/components/portal/workspace/OperatorPanel";
import { getAdminKey } from "@/lib/adminFetch";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
  const [operatorMode, setOperatorMode] = useState(false);
  
  // Check if user has operator access (has admin key)
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
              {/* Operator toggle */}
              {isOperator && (
                <Button
                  variant={operatorMode ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setOperatorMode(!operatorMode)}
                  className="gap-1"
                >
                  {operatorMode ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span className="hidden sm:inline">
                    {operatorMode ? "Exit Operator" : "Operator"}
                  </span>
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex">
          {/* Main content */}
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

          {/* Operator panel */}
          {isOperator && operatorMode && projectInfo && (
            <div className="w-72 border-l border-border flex-shrink-0">
              <OperatorPanel
                token={token!}
                projectId={projectInfo.id}
                intakeStatus={projectInfo.intakeStatus}
                pipelineStage={projectInfo.pipelineStage}
                portalStage={projectInfo.portalStage}
                intakeData={projectInfo.intakeData}
                onRefresh={fetchProjectInfo}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render status banner + workspace when versions exist
  const config = getStatusConfig(projectInfo?.intakeStatus || "approved");
  const Icon = config.Icon;

  return (
    <div className="h-screen flex flex-col">
      {/* Status banner */}
      {projectInfo && (
        <div className="border-b border-border bg-muted/30 px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
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
              {/* Operator toggle */}
              {isOperator && (
                <Button
                  variant={operatorMode ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setOperatorMode(!operatorMode)}
                  className="gap-1"
                >
                  {operatorMode ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span className="hidden sm:inline">
                    {operatorMode ? "Exit Operator" : "Operator"}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Workspace + Operator Panel */}
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0">
          <ProjectWorkspace
            token={token!}
            versions={versions}
            comments={comments}
            onRefreshComments={fetchComments}
          />
        </div>

        {/* Operator panel */}
        {isOperator && operatorMode && projectInfo && (
          <div className="w-72 border-l border-border flex-shrink-0">
            <OperatorPanel
              token={token!}
              projectId={projectInfo.id}
              intakeStatus={projectInfo.intakeStatus}
              pipelineStage={projectInfo.pipelineStage}
              portalStage={projectInfo.portalStage}
              intakeData={projectInfo.intakeData}
              onRefresh={fetchProjectInfo}
            />
          </div>
        )}
      </div>
    </div>
  );
}
