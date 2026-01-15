import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FolderOpen, Loader2, Clock,
  MessageSquare, ExternalLink, ChevronRight, Sparkles, Eye, ArrowRight,
  CheckCircle2, Circle, AlertCircle, Bell, LayoutGrid, List, Mail, ChevronDown,
  FileText, Palette, Camera, Brush, ImagePlus, Link2, Award, Image, Archive, ArchiveRestore, Trash2,
  Timer, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ProjectWorkSurface } from "./ProjectWorkSurface";
import { adminFetch } from "@/lib/adminFetch";
import { useOperatorContext } from "./OperatorLayout";
import { 
  StageBadge, 
  ServiceTypeBadge,
  PIPELINE_FILTERS, 
  SERVICE_TYPE_FILTERS,
  PipelineFilter, 
  ServiceTypeFilter,
  getNextStage, 
  STAGE_CONFIG, 
  PipelineStage,
  ServiceType 
} from "@/components/operator/StageBadge";
import { KanbanBoard, KanbanProject } from "@/components/operator/KanbanBoard";

interface PhaseBData {
  // Card 1: Brand & Identity
  logoStatus: "uploaded" | "create" | "";
  brandColors: string;
  colorPreference: "pick_for_me" | "custom" | "";

  // Card 2: Website Content
  businessDescription: string;
  services: string;
  serviceArea: string;
  differentiators: string;
  faq: string;
  primaryGoal: "book" | "quote" | "call" | "portfolio" | "learn" | "visit" | "";

  // Card 3: Photos & Proof
  photosPlan: "upload" | "generate" | "none" | "";
  photosUploaded: number;
  generatedPhotoSubjects: string;
  generatedPhotoStyle: "realistic" | "studio" | "lifestyle" | "minimal" | "";
  generatedPhotoNotes: string;
  placeholderOk: boolean;
  googleReviewsLink: string;
  certifications: string;
  hasBeforeAfter: "yes" | "coming_soon" | "no" | "";

  // Card 4: Style & Preferences
  vibe: "modern" | "classic" | "luxury" | "bold" | "minimal" | "cozy" | "";
  tone: "professional" | "friendly" | "direct" | "playful" | "";
  exampleSites: string;
  mustInclude: string;
  mustAvoid: string;

  // Legacy fields
  tagline: string;
  socialLinks: string;
  pages: string[];
  primaryCta: "call" | "book" | "form" | "quote" | "";
  features: string[];
  dislikes: string;
}

interface ProjectIntake {
  id: string;
  project_id: string;
  intake_json: Record<string, unknown>;
  intake_version: number;
  intake_status: 'draft' | 'submitted' | 'approved';
  phase_b_json: PhaseBData | null;
  phase_b_status: 'pending' | 'in_progress' | 'complete' | null;
  phase_b_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  business_name: string;
  business_slug: string;
  project_token: string;
  status: string;
  pipeline_stage: string | null;
  service_type: ServiceType;
  ai_trial_status: string | null;
  ulio_business_id: string | null;
  ulio_setup_url: string | null;
  source_demo_token: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  source: string;
  notes: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
  intake: ProjectIntake | null;
  unread_count: number;
  quote_count: number;
  has_claim: boolean;
  is_archived: boolean;
  // AI trial fields
  is_ai_trial: boolean;
  ai_trial_ends_at: string | null;
}

type ViewMode = "list" | "kanban";
type NudgeChannel = "portal" | "email" | "both";

// Phase B Details Modal Component
function PhaseBModal({ 
  project, 
  open, 
  onOpenChange 
}: { 
  project: Project | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  if (!project) return null;
  
  const data = project.intake?.phase_b_json;
  const phaseBStatus = project.intake?.phase_b_status;
  
  const renderValue = (value: string | number | boolean | null | undefined, fallback = "Not provided") => {
    if (value === null || value === undefined || value === "") return <span className="text-muted-foreground italic">{fallback}</span>;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value;
  };

  const getGoalLabel = (goal?: string) => {
    const labels: Record<string, string> = {
      book: "Get bookings/appointments",
      quote: "Get quote requests",
      call: "Get phone calls",
      portfolio: "Showcase portfolio",
      learn: "Educate visitors",
      visit: "Drive store visits"
    };
    return goal ? labels[goal] || goal : null;
  };

  const getVibeLabel = (vibe?: string) => {
    const labels: Record<string, string> = {
      modern: "Modern & Clean",
      classic: "Classic & Timeless",
      luxury: "High-End & Luxury",
      bold: "Bold & Striking",
      minimal: "Minimal & Simple",
      cozy: "Warm & Cozy"
    };
    return vibe ? labels[vibe] || vibe : null;
  };

  const getToneLabel = (tone?: string) => {
    const labels: Record<string, string> = {
      professional: "Professional & Polished",
      friendly: "Warm & Approachable",
      direct: "Straightforward & Clear",
      playful: "Fun & Energetic"
    };
    return tone ? labels[tone] || tone : null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Phase B Details: {project.business_name}
          </DialogTitle>
        </DialogHeader>
        
        {!data ? (
          <div className="py-8 text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No Phase B data submitted yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {phaseBStatus === "complete" ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                </Badge>
              ) : phaseBStatus === "in_progress" ? (
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  <Circle className="h-3 w-3 mr-1" /> In Progress
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <AlertCircle className="h-3 w-3 mr-1" /> Pending
                </Badge>
              )}
            </div>

            {/* Card 1: Brand & Identity */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm border-b pb-2">
                <Palette className="h-4 w-4 text-primary" />
                Brand & Identity
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs mb-1">Logo Status</div>
                  <div>{data.logoStatus === "uploaded" ? "✅ Uploaded" : data.logoStatus === "create" ? "🎨 Create for me" : renderValue(null)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs mb-1">Color Preference</div>
                  <div>{data.colorPreference === "pick_for_me" ? "🎯 Pick for me" : data.colorPreference === "custom" ? "🖌️ Custom colors" : renderValue(null)}</div>
                </div>
                {data.colorPreference === "custom" && data.brandColors && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground text-xs mb-1">Brand Colors</div>
                    <div className="bg-muted/50 rounded p-2">{data.brandColors}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Website Content */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm border-b pb-2">
                <FileText className="h-4 w-4 text-primary" />
                Website Content
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs mb-1">Primary Goal</div>
                  <div>{getGoalLabel(data.primaryGoal) || renderValue(null)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs mb-1">Business Description</div>
                  <div className="bg-muted/50 rounded p-2 whitespace-pre-wrap">{renderValue(data.businessDescription)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs mb-1">Services</div>
                  <div className="bg-muted/50 rounded p-2 whitespace-pre-wrap">{renderValue(data.services)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Service Area</div>
                    <div>{renderValue(data.serviceArea)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Has FAQ</div>
                    <div>{data.faq?.trim() ? "Yes" : "No"}</div>
                  </div>
                </div>
                {data.differentiators && (
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Differentiators</div>
                    <div className="bg-muted/50 rounded p-2 whitespace-pre-wrap">{data.differentiators}</div>
                  </div>
                )}
                {data.faq && (
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">FAQ Content</div>
                    <div className="bg-muted/50 rounded p-2 whitespace-pre-wrap max-h-32 overflow-y-auto">{data.faq}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Photos & Proof */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm border-b pb-2">
                <Camera className="h-4 w-4 text-primary" />
                Photos & Proof
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Photos Plan</div>
                    <div className="flex items-center gap-1">
                      {data.photosPlan === "upload" && <><Image className="h-3 w-3" /> Upload ({data.photosUploaded || 0} uploaded)</>}
                      {data.photosPlan === "generate" && <><ImagePlus className="h-3 w-3 text-violet-600" /> Generate with AI</>}
                      {data.photosPlan === "none" && <><Circle className="h-3 w-3" /> Use placeholders</>}
                      {!data.photosPlan && renderValue(null)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Before/After</div>
                    <div>{data.hasBeforeAfter === "yes" ? "✅ Yes" : data.hasBeforeAfter === "coming_soon" ? "🔜 Coming soon" : data.hasBeforeAfter === "no" ? "No" : renderValue(null)}</div>
                  </div>
                </div>

                {/* AI Generation Brief (if plan = generate) */}
                {data.photosPlan === "generate" && (
                  <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-3 space-y-2">
                    <div className="font-medium text-violet-700 dark:text-violet-300 text-xs flex items-center gap-1">
                      <ImagePlus className="h-3 w-3" /> AI Generation Brief
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">Photo Subjects</div>
                      <div className="bg-white dark:bg-background rounded p-2">{renderValue(data.generatedPhotoSubjects)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">Style</div>
                        <div>{data.generatedPhotoStyle || renderValue(null)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">Additional Notes</div>
                        <div>{renderValue(data.generatedPhotoNotes)}</div>
                      </div>
                    </div>
                    {/* Generate Images Button */}
                    {data.generatedPhotoSubjects && data.generatedPhotoStyle && (
                      <Button 
                        size="sm" 
                        className="mt-2 gap-1"
                        onClick={() => toast.info("Image generation coming soon!")}
                      >
                        <Sparkles className="h-3 w-3" />
                        Generate 6 Images
                      </Button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                      <Link2 className="h-3 w-3" /> Google Reviews Link
                    </div>
                    {data.googleReviewsLink ? (
                      <a href={data.googleReviewsLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                        {data.googleReviewsLink}
                      </a>
                    ) : renderValue(null)}
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                      <Award className="h-3 w-3" /> Certifications
                    </div>
                    <div>{renderValue(data.certifications)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Style & Preferences */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm border-b pb-2">
                <Brush className="h-4 w-4 text-primary" />
                Style & Preferences
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Vibe</div>
                    <div>{getVibeLabel(data.vibe) || renderValue(null)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Tone</div>
                    <div>{getToneLabel(data.tone) || renderValue(null)}</div>
                  </div>
                </div>
                {data.exampleSites && (
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Example Sites</div>
                    <div className="bg-muted/50 rounded p-2 whitespace-pre-wrap">{data.exampleSites}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1 text-green-600">Must Include</div>
                    <div className="bg-green-50 dark:bg-green-950/30 rounded p-2">{renderValue(data.mustInclude)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1 text-red-600">Must Avoid</div>
                    <div className="bg-red-50 dark:bg-red-950/30 rounded p-2">{renderValue(data.mustAvoid)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ProjectsTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);
  
  // Read pipeline filter from URL
  const pipelineFromUrl = searchParams.get("pipeline");
  const initialPipeline: PipelineFilter = PIPELINE_FILTERS.some(f => f.value === pipelineFromUrl)
    ? (pipelineFromUrl as PipelineFilter)
    : "all";
  const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>(initialPipeline);
  
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceTypeFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { setCurrentProjectToken, setCurrentProjectName, registerCloseProject } = useOperatorContext();
  const queryClient = useQueryClient();
  
  // Sync URL → state when URL changes (browser back/forward)
  useEffect(() => {
    const urlPipeline = searchParams.get("pipeline");
    if (urlPipeline && PIPELINE_FILTERS.some(f => f.value === urlPipeline) && urlPipeline !== pipelineFilter) {
      setPipelineFilter(urlPipeline as PipelineFilter);
    }
  }, [searchParams]);
  
  // Sync state → URL when pipeline changes
  useEffect(() => {
    const currentPipeline = searchParams.get("pipeline");
    if (currentPipeline !== pipelineFilter) {
      const newParams = new URLSearchParams(searchParams);
      if (pipelineFilter === "all") {
        newParams.delete("pipeline");
      } else {
        newParams.set("pipeline", pipelineFilter);
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [pipelineFilter]);

  // Sync selected project to context for global shortcuts
  useEffect(() => {
    setCurrentProjectToken(selectedProject?.project_token ?? null);
    setCurrentProjectName(selectedProject?.business_name ?? null);
    registerCloseProject(() => setSelectedProject(null));
    
    return () => {
      setCurrentProjectToken(null);
      setCurrentProjectName(null);
      registerCloseProject(() => {});
    };
  }, [selectedProject, setCurrentProjectToken, setCurrentProjectName, registerCloseProject]);

  // Fetch all projects with intake data - always include archived for proper filtering
  const { data: projectsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      console.log("[ProjectsTab] Fetching projects...");
      const res = await adminFetch("/admin/projects?includeArchived=true");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("[ProjectsTab] Fetch failed:", res.status, errorData);
        throw new Error(errorData.message || "Failed to fetch projects");
      }
      const data = await res.json() as { projects: Project[] };
      console.log("[ProjectsTab] Fetched", data.projects?.length, "projects");
      return data;
    },
    refetchInterval: 15000, // 15 second refresh
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes("Admin key invalid") || 
          error?.message?.includes("authentication") ||
          error?.message?.includes("Session expired")) return false;
      return failureCount < 3;
    },
  });

  const projects = projectsData?.projects || [];

  // Sync selectedProject with latest data from query to pick up intake status changes
  useEffect(() => {
    if (selectedProject && projects.length > 0) {
      const updated = projects.find(p => p.id === selectedProject.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedProject)) {
        setSelectedProject(updated);
      }
    }
  }, [projects, selectedProject]);

  // Mutation to advance pipeline stage
  const advanceStageMutation = useMutation({
    mutationFn: async ({ token, stage }: { token: string; stage: PipelineStage }) => {
      const res = await adminFetch(`/admin/projects/${token}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Failed to update stage");
      return res.json();
    },
    onSuccess: (_, variables) => {
      const stageLabel = STAGE_CONFIG[variables.stage]?.label || variables.stage;
      toast.success(`Moved to ${stageLabel}`);
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Mutation to nudge client
  const nudgeMutation = useMutation({
    mutationFn: async ({ token, channels }: { token: string; channels: NudgeChannel[] }) => {
      const res = await adminFetch(`/admin/projects/${token}/nudge`, {
        method: "POST",
        body: JSON.stringify({ channels }),
      });
      if (!res.ok) throw new Error("Failed to send nudge");
      return res.json();
    },
    onSuccess: (data) => {
      const sent = data.channels_sent || ["portal"];
      const channelLabels = sent.map((c: string) => c === "portal" ? "Portal" : "Email").join(" + ");
      toast.success(`Reminder sent via ${channelLabels}`);
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Mutation to archive a project
  const archiveMutation = useMutation({
    mutationFn: async ({ token, unarchive }: { token: string; unarchive?: boolean }) => {
      const endpoint = unarchive 
        ? `/admin/projects/${token}/unarchive` 
        : `/admin/projects/${token}/archive`;
      const res = await adminFetch(endpoint, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Handle "already archived" or "not archived" gracefully
        if (res.status === 404) {
          throw new Error(unarchive 
            ? "Project not found or not archived" 
            : "Project not found or already archived");
        }
        throw new Error(data.error || "Failed to update archive status");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      const message = variables.unarchive ? "Restored to active projects" : "Moved to Archived";
      toast.success(message);
      // Hard refetch to sync UI
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
      // Hard refetch to sync UI state in case of stale data
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
  });

  // Mutation to permanently delete an archived project
  const deleteMutation = useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      const res = await adminFetch(`/admin/projects/${token}/permanent`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete project");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Project permanently deleted");
      setDeleteConfirmProject(null);
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Handle archive/unarchive
  const handleArchive = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    archiveMutation.mutate({ token: project.project_token, unarchive: project.is_archived });
  };

  // Handle permanent delete (only for archived projects)
  const handleDelete = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setDeleteConfirmProject(project);
  };

  const confirmDelete = () => {
    if (deleteConfirmProject) {
      deleteMutation.mutate({ token: deleteConfirmProject.project_token });
    }
  };

  const handleAdvanceStage = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const nextStage = getNextStage(project.pipeline_stage);
    if (nextStage) {
      advanceStageMutation.mutate({ token: project.project_token, stage: nextStage });
    }
  };

  // Handle nudge client with channel selection
  const handleNudge = (e: React.MouseEvent, project: Project, channel: NudgeChannel = "portal") => {
    e.stopPropagation();
    const channels: NudgeChannel[] = channel === "both" ? ["portal", "email"] : [channel];
    nudgeMutation.mutate({ token: project.project_token, channels });
  };

  // Handle stage change from Kanban
  const handleKanbanStageChange = async (token: string, newStage: PipelineStage) => {
    advanceStageMutation.mutate({ token, stage: newStage });
  };

  // Open work surface by token (for Kanban)
  const handleOpenWorkSurface = (token: string) => {
    const project = projects.find(p => p.project_token === token);
    if (project) setSelectedProject(project);
  };

  // Open portal in new tab
  const handleOpenPortal = (token: string) => {
    window.open(`/p/${token}`, "_blank");
  };

  // Calculate Phase B progress from intake data
  const getPhaseBProgress = (intake: ProjectIntake | null): { completed: number; total: number; missing: string[]; photosPlan?: string } => {
    if (!intake || !intake.phase_b_json) {
      return { completed: 0, total: 4, missing: ["Brand", "Content", "Photos", "Style"] };
    }
    
    const data = intake.phase_b_json;
    const missing: string[] = [];
    let completed = 0;

    // Card 1: Brand & Identity (logo + colors)
    const hasLogo = data.logoStatus === "uploaded" || data.logoStatus === "create";
    const hasColors = data.colorPreference === "pick_for_me" || (data.colorPreference === "custom" && data.brandColors?.trim());
    if (hasLogo && hasColors) {
      completed++;
    } else {
      missing.push("Brand");
    }

    // Card 2: Website Content (description + services + goal)
    const hasContent = data.businessDescription?.trim() && data.services?.trim() && data.primaryGoal;
    if (hasContent) {
      completed++;
    } else {
      missing.push("Content");
    }

    // Card 3: Photos & Proof (based on photosPlan)
    let photosComplete = false;
    if (data.photosPlan === "upload") {
      photosComplete = (data.photosUploaded || 0) >= 3;
    } else if (data.photosPlan === "generate") {
      photosComplete = !!(data.generatedPhotoSubjects?.trim() && data.generatedPhotoStyle);
    } else if (data.photosPlan === "none") {
      photosComplete = data.placeholderOk === true;
    }
    if (photosComplete) {
      completed++;
    } else {
      missing.push("Photos");
    }

    // Card 4: Style & Preferences (vibe + tone)
    if (data.vibe && data.tone) {
      completed++;
    } else {
      missing.push("Style");
    }

    return { completed, total: 4, missing, photosPlan: data.photosPlan };
  };

  // Map projects to Kanban format
  const kanbanProjects: KanbanProject[] = useMemo(() => {
    return projects.map(p => ({
      id: p.id,
      token: p.project_token,
      business_name: p.business_name,
      contact_name: p.contact_name,
      contact_email: p.contact_email,
      pipeline_stage: (p.pipeline_stage || "new") as PipelineStage,
      service_type: (p.service_type || "website") as ServiceType,
      phase_b_status: p.intake?.phase_b_status,
      phase_b_progress: getPhaseBProgress(p.intake),
    }));
  }, [projects]);

  // Check if project needs a nudge (incomplete intake)
  const needsNudge = (project: Project): boolean => {
    const intakeStatus = project.intake?.intake_status;
    return intakeStatus !== "approved" && 
      ["new", "discovery", "build"].includes(project.pipeline_stage || "new");
  };

  // Filter projects by pipeline stage and service type
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Handle "archived" as a special filter
      if (pipelineFilter === "archived") {
        const matchesServiceType = serviceTypeFilter === "all" || 
          p.service_type === serviceTypeFilter ||
          (serviceTypeFilter === "ai_receptionist" && p.service_type === "ai") ||
          (serviceTypeFilter === "ai_trial" && p.is_ai_trial);
        return p.is_archived && matchesServiceType;
      }
      // For non-archived filters, exclude archived projects
      if (p.is_archived) return false;
      const matchesPipeline = pipelineFilter === "all" || p.pipeline_stage === pipelineFilter;
      // Handle both "ai" and "ai_receptionist" values for the AI filter, plus ai_trial filter
      const matchesServiceType = serviceTypeFilter === "all" || 
        p.service_type === serviceTypeFilter ||
        (serviceTypeFilter === "ai_receptionist" && p.service_type === "ai") ||
        (serviceTypeFilter === "ai_trial" && p.is_ai_trial);
      return matchesPipeline && matchesServiceType;
    });
  }, [projects, pipelineFilter, serviceTypeFilter]);

  // Count by pipeline stage for tab badges (exclude archived from stage counts)
  const stageCounts = useMemo(() => {
    const activeProjects = projects.filter(p => !p.is_archived);
    const archivedCount = projects.filter(p => p.is_archived).length;
    const counts: Record<string, number> = { all: activeProjects.length, archived: archivedCount };
    activeProjects.forEach(p => {
      const stage = p.pipeline_stage || "new";
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return counts;
  }, [projects]);

  // Count by service type for filter badges
  const serviceTypeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length };
    projects.forEach(p => {
      const type = p.service_type || "website";
      counts[type] = (counts[type] || 0) + 1;
      // Count AI trials separately
      if (p.is_ai_trial) {
        counts["ai_trial"] = (counts["ai_trial"] || 0) + 1;
      }
    });
    return counts;
  }, [projects]);

  // Helper to calculate trial days remaining
  const getTrialDaysRemaining = (endsAt: string | null): { text: string; isExpired: boolean } => {
    if (!endsAt) return { text: "", isExpired: false };
    
    const end = new Date(endsAt);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { text: "Trial Expired", isExpired: true };
    if (diffDays === 1) return { text: "1 day left", isExpired: false };
    return { text: `${diffDays} days left`, isExpired: false };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return format(date, "EEEE");
    return format(date, "MMM d");
  };

  // Show full-page work surface when a project is selected
  if (selectedProject) {
    return (
      <ProjectWorkSurface
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onStatusChange={() => refetch()}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Projects
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2 rounded-r-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2 rounded-l-none"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Badge variant="outline">{projects.length} total</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Filters row */}
        {viewMode === "list" && (
          <div className="border-b">
            {/* Service type filter + Archive toggle */}
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Type:</span>
                {SERVICE_TYPE_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={serviceTypeFilter === filter.value ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setServiceTypeFilter(filter.value)}
                  >
                    {filter.label}
                    {serviceTypeCounts[filter.value] > 0 && filter.value !== "all" && (
                      <span className="ml-1 text-muted-foreground">
                        ({serviceTypeCounts[filter.value]})
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Pipeline stage tabs */}
            <div className="overflow-x-auto scrollbar-hide">
              <Tabs value={pipelineFilter} onValueChange={(v) => setPipelineFilter(v as PipelineFilter)}>
                <TabsList className="inline-flex justify-start h-auto p-0 bg-transparent min-w-max px-4">
                  {PIPELINE_FILTERS.map((filter) => (
                    <TabsTrigger
                      key={filter.value}
                      value={filter.value}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-sm whitespace-nowrap"
                    >
                      {filter.label}
                      {stageCounts[filter.value] > 0 && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          ({stageCounts[filter.value]})
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        )}

        {/* Kanban View */}
        {viewMode === "kanban" ? (
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 text-destructive opacity-70" />
                <p className="text-destructive mb-2">Failed to load projects</p>
                <p className="text-sm mb-4">{error?.message || "Unknown error"}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            ) : (
              <KanbanBoard
                projects={kanbanProjects}
                onStageChange={handleKanbanStageChange}
                onOpenWorkSurface={handleOpenWorkSurface}
                onOpenPortal={handleOpenPortal}
              />
            )}
          </div>
        ) : (
          /* List View */
          <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 text-destructive opacity-70" />
              <p className="text-destructive mb-2">Failed to load projects</p>
              <p className="text-sm mb-4">{error?.message || "Unknown error"}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No {pipelineFilter === "all" ? "" : pipelineFilter.replace("_", " ")} projects</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-3 sm:p-4 hover:bg-muted/50 cursor-pointer transition-colors group"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Row 1: Name + location + type + stage */}
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm sm:text-base truncate max-w-[180px] sm:max-w-none">
                          {project.business_name}
                        </span>
                        {project.city && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {project.city}{project.state ? `, ${project.state}` : ""}
                          </span>
                        )}
                        <ServiceTypeBadge serviceType={project.service_type} showIcon={true} />
                        {/* AI Trial Badge */}
                        {project.is_ai_trial && (() => {
                          const trialInfo = getTrialDaysRemaining(project.ai_trial_ends_at);
                          return (
                            <Badge 
                              variant="outline" 
                              className={`text-xs gap-1 ${trialInfo.isExpired 
                                ? 'bg-red-500/10 text-red-600 border-red-200' 
                                : 'bg-amber-500/10 text-amber-600 border-amber-200'}`}
                            >
                              {trialInfo.isExpired ? (
                                <AlertTriangle className="h-3 w-3" />
                              ) : (
                                <Timer className="h-3 w-3" />
                              )}
                              {trialInfo.text}
                            </Badge>
                          );
                        })()}
                        <StageBadge stage={project.pipeline_stage} />
                        {project.is_archived && (
                          <Badge variant="outline" className="text-xs gap-1 text-muted-foreground border-muted-foreground/50">
                            <Archive className="h-3 w-3" />
                            Archived
                          </Badge>
                        )}
                      </div>
                      
                      {/* Demo badge removed - source=request_demo just indicates acquisition channel, not project type */}
                      
                      {/* Row 2: Status & Meta */}
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(project.created_at)}
                        </span>
                        {project.unread_count > 0 && (
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <MessageSquare className="h-3 w-3" />
                            {project.unread_count}
                          </span>
                        )}
                      </div>
                      
                      {/* Row 3: Intake Status */}
                      {(() => {
                        const intakeStatus = project.intake?.intake_status;
                        
                        if (intakeStatus === "approved") {
                          return (
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                              <span className="flex items-center gap-1 text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-3 w-3" />
                                Intake Approved
                              </span>
                            </div>
                          );
                        }
                        
                        if (intakeStatus === "submitted") {
                          return (
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                              <span className="flex items-center gap-1 text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                <Clock className="h-3 w-3" />
                                Intake Submitted
                              </span>
                            </div>
                          );
                        }
                        
                        // Show pending state for projects in early stages
                        if (["new", "quote_requested", "claimed"].includes(project.pipeline_stage || "new")) {
                          return (
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                              <span className="flex items-center gap-1 text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                <AlertCircle className="h-3 w-3" />
                                Awaiting Intake
                              </span>
                            </div>
                          );
                        }
                        
                        return null;
                      })()}
                      
                      {/* Row 4: Contact Info - compact inline display */}
                      {(project.contact_name || project.contact_email || project.contact_phone) && (
                        <div className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-2.5 py-1.5 space-y-0.5">
                          {project.contact_name && (
                            <div className="font-medium text-foreground/80">{project.contact_name}</div>
                          )}
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            {project.contact_email && (
                              <span className="truncate max-w-[200px]">{project.contact_email}</span>
                            )}
                            {project.contact_phone && (
                              <span>{project.contact_phone}</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Row 5: Notes preview - only if notes exist and aren't just contact info */}
                      {project.notes && !project.notes.toLowerCase().includes('contact:') && (
                        <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 whitespace-pre-line line-clamp-2">
                          {project.notes}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions - reordered: Workspace first, Archive last */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 flex-wrap justify-end max-w-[50%] sm:max-w-none overflow-hidden">
                      {/* 1. Workspace button - Opens operator work surface */}
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-1 text-xs h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="hidden sm:inline">Workspace</span>
                      </Button>
                      
                      {/* Preview Demo removed - source is acquisition channel, not demo indicator */}
                      
                      {/* 4. Advance stage button */}
                      {getNextStage(project.pipeline_stage) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs h-7 px-2"
                          disabled={advanceStageMutation.isPending}
                          onClick={(e) => handleAdvanceStage(e, project)}
                        >
                          <ArrowRight className="h-3 w-3" />
                          <span className="hidden sm:inline">
                            {STAGE_CONFIG[getNextStage(project.pipeline_stage)!]?.label}
                          </span>
                        </Button>
                      )}
                      
                      {/* 5. Nudge dropdown - show when Phase B incomplete */}
                      {needsNudge(project) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs h-7 px-2 text-amber-600 border-amber-300 hover:bg-amber-50"
                              disabled={nudgeMutation.isPending}
                            >
                              <Bell className="h-3 w-3" />
                              <span className="hidden sm:inline">Nudge</span>
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleNudge(e as any, project, "portal")}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Portal Message
                            </DropdownMenuItem>
                            {project.contact_email && (
                              <DropdownMenuItem onClick={(e) => handleNudge(e as any, project, "email")}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                            )}
                            {project.contact_email && (
                              <DropdownMenuItem onClick={(e) => handleNudge(e as any, project, "both")}>
                                <Bell className="h-4 w-4 mr-2" />
                                Both (Portal + Email)
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      
                      {/* 6. Archive/Unarchive button - LAST (destructive) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1 text-xs h-7 px-2 ${project.is_archived ? 'text-green-600 hover:bg-green-50' : 'text-muted-foreground hover:text-destructive'}`}
                        disabled={archiveMutation.isPending}
                        onClick={(e) => handleArchive(e, project)}
                        title={project.is_archived ? "Restore project" : "Archive project"}
                      >
                        {project.is_archived ? (
                          <>
                            <ArchiveRestore className="h-3 w-3" />
                            <span className="hidden sm:inline">Restore</span>
                          </>
                        ) : (
                          <>
                            <Archive className="h-3 w-3" />
                          </>
                        )}
                      </Button>
                      
                      {/* Permanent delete button - only for archived projects */}
                      {project.is_archived && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs h-7 px-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          disabled={deleteMutation.isPending}
                          onClick={(e) => handleDelete(e, project)}
                          title="Permanently delete project"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </ScrollArea>
        )}
      </CardContent>
      

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmProject} onOpenChange={(open) => !open && setDeleteConfirmProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteConfirmProject?.business_name}</strong> and all associated data including messages, files, prototypes, and comments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
