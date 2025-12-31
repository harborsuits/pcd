import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FolderOpen, Loader2, Clock,
  MessageSquare, ExternalLink, ChevronRight, Sparkles, Eye, ArrowRight,
  CheckCircle2, Circle, AlertCircle, Bell, LayoutGrid, List, Mail, ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ProjectWorkSurface } from "./ProjectWorkSurface";
import { adminFetch } from "@/lib/adminFetch";
import { useOperatorContext } from "./OperatorLayout";
import { StageBadge, PIPELINE_FILTERS, PipelineFilter, getNextStage, STAGE_CONFIG, PipelineStage } from "@/components/operator/StageBadge";
import { KanbanBoard, KanbanProject } from "@/components/operator/KanbanBoard";

interface PhaseBData {
  logoStatus: "uploaded" | "create" | "";
  brandColors: string;
  colorPreference: "pick_for_me" | "custom" | "";
  tone: "professional" | "friendly" | "bold" | "luxury" | "";
  photosUploaded: number;
  tagline: string;
  socialLinks: string;
  pages: string[];
  primaryCta: "call" | "book" | "form" | "quote" | "";
  features: string[];
  exampleSites: string;
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
}

type ViewMode = "list" | "kanban";
type NudgeChannel = "portal" | "email" | "both";

export function ProjectsTab() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { setCurrentProjectToken, setCurrentProjectName, registerCloseProject } = useOperatorContext();
  const queryClient = useQueryClient();

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

  // Fetch all projects with intake data
  const { data: projectsData, isLoading, refetch } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const res = await adminFetch("/admin/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json() as Promise<{ projects: Project[] }>;
    },
    refetchInterval: 15000, // 15 second refresh
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes("Admin key invalid")) return false;
      return failureCount < 3;
    },
  });

  const projects = projectsData?.projects || [];

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

  // Handle advance to next stage
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

  // Map projects to Kanban format
  const kanbanProjects: KanbanProject[] = useMemo(() => {
    return projects.map(p => ({
      id: p.id,
      token: p.project_token,
      business_name: p.business_name,
      contact_name: p.contact_name,
      contact_email: p.contact_email,
      pipeline_stage: (p.pipeline_stage || "new") as PipelineStage,
      phase_b_status: p.intake?.phase_b_status,
      phase_b_progress: getPhaseBProgress(p.intake),
    }));
  }, [projects]);

  // Check if project needs a nudge (Phase B incomplete)
  const needsNudge = (project: Project): boolean => {
    const status = project.intake?.phase_b_status;
    return status !== "complete" && 
      ["new", "quote_requested", "claimed", "contacted"].includes(project.pipeline_stage || "new");
  };

  // Filter projects by pipeline stage
  const filteredProjects = useMemo(() => {
    if (pipelineFilter === "all") return projects;
    return projects.filter(p => p.pipeline_stage === pipelineFilter);
  }, [projects, pipelineFilter]);

  // Count by pipeline stage for tab badges
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length };
    projects.forEach(p => {
      const stage = p.pipeline_stage || "new";
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return counts;
  }, [projects]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return format(date, "EEEE");
    return format(date, "MMM d");
  };

  // Calculate Phase B progress from intake data
  const getPhaseBProgress = (intake: ProjectIntake | null): { completed: number; total: number; missing: string[] } => {
    if (!intake || !intake.phase_b_json) {
      return { completed: 0, total: 4, missing: ["Brand", "Photos", "Structure", "Inspiration"] };
    }
    
    const data = intake.phase_b_json;
    const missing: string[] = [];
    let completed = 0;

    // Card 1: Brand & Identity
    if ((data.logoStatus === "uploaded" || data.logoStatus === "create") && data.tone) {
      completed++;
    } else {
      missing.push("Brand");
    }

    // Card 2: Content & Proof (need 3+ photos)
    if ((data.photosUploaded || 0) >= 3) {
      completed++;
    } else {
      missing.push("Photos");
    }

    // Card 3: Structure & Features
    if ((data.pages?.length || 0) >= 1 && data.primaryCta) {
      completed++;
    } else {
      missing.push("Structure");
    }

    // Card 4: Inspiration
    if (data.exampleSites?.trim()) {
      completed++;
    } else {
      missing.push("Inspiration");
    }

    return { completed, total: 4, missing };
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
        {/* Pipeline filter tabs - only shown in list view */}
        {viewMode === "list" && (
          <div className="border-b overflow-x-auto scrollbar-hide">
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
        )}

        {/* Kanban View */}
        {viewMode === "kanban" ? (
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
          <ScrollArea className="h-[calc(100vh-280px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
                      {/* Row 1: Name + location + stage */}
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm sm:text-base truncate max-w-[180px] sm:max-w-none">
                          {project.business_name}
                        </span>
                        {project.city && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {project.city}{project.state ? `, ${project.state}` : ""}
                          </span>
                        )}
                        <StageBadge stage={project.pipeline_stage} />
                      </div>
                      
                      {/* Row 2: Demo request badge (mobile: own row) */}
                      {project.source === "request_demo" && (
                        <div className="mb-1.5">
                          <Badge variant="outline" className="text-xs gap-1">
                            <Sparkles className="h-3 w-3" />
                            Demo Request
                          </Badge>
                        </div>
                      )}
                      
                      {/* Row 3: Meta info - simplified on mobile */}
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
                        {project.contact_phone && (
                          <span className="truncate max-w-[120px] sm:max-w-[150px]">
                            {project.contact_phone}
                          </span>
                        )}
                      </div>
                      
                      {/* Row 4: Phase B Progress */}
                      {(() => {
                        const progress = getPhaseBProgress(project.intake);
                        const phaseBStatus = project.intake?.phase_b_status;
                        
                        if (phaseBStatus === "complete") {
                          return (
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                              <span className="flex items-center gap-1 text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-3 w-3" />
                                Setup Complete
                              </span>
                            </div>
                          );
                        }
                        
                        if (phaseBStatus === "in_progress" || (project.intake && progress.completed > 0)) {
                          return (
                            <div className="mt-1.5 flex items-center gap-2 text-xs">
                              <span className="flex items-center gap-1 text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                <Circle className="h-3 w-3" />
                                Setup: {progress.completed}/4
                              </span>
                              {progress.missing.length > 0 && progress.missing.length < 4 && (
                                <span className="text-muted-foreground hidden sm:inline">
                                  Missing: {progress.missing.join(", ")}
                                </span>
                              )}
                            </div>
                          );
                        }
                        
                        // Show pending state for projects in early stages
                        if (["new", "quote_requested", "claimed"].includes(project.pipeline_stage || "new")) {
                          return (
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                              <span className="flex items-center gap-1 text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                <AlertCircle className="h-3 w-3" />
                                Awaiting Setup
                              </span>
                            </div>
                          );
                        }
                        
                        return null;
                      })()}
                      
                      {/* Row 5: Email - own row on mobile for readability */}
                      {project.contact_email && (
                        <div className="mt-1 text-xs sm:text-sm text-muted-foreground truncate">
                          {project.contact_email}
                        </div>
                      )}
                      
                      {/* Notes preview */}
                      {project.notes && (
                        <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 whitespace-pre-line line-clamp-2">
                          {project.notes}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions - simplified on mobile */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      {/* Nudge dropdown - show when Phase B incomplete */}
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
                      {/* Advance stage button */}
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
                      {/* Preview demo button - hidden on mobile, shown on hover */}
                      {project.source === "request_demo" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 hidden sm:flex"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/d/${project.project_token}/${project.business_slug}`, "_blank");
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden md:inline">Preview Demo</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/p/${project.project_token}`, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
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
    </Card>
  );
}
