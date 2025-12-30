import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FolderOpen, Loader2, Clock, FileText, 
  MessageSquare, ExternalLink, ChevronRight, Sparkles, Eye, ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ProjectWorkSurface } from "./ProjectWorkSurface";
import { adminFetch } from "@/lib/adminFetch";
import { useOperatorContext } from "./OperatorLayout";
import { StageBadge, PIPELINE_FILTERS, PipelineFilter, getNextStage, STAGE_CONFIG, PipelineStage } from "@/components/operator/StageBadge";

interface ProjectIntake {
  id: string;
  project_id: string;
  intake_json: Record<string, unknown>;
  intake_version: number;
  intake_status: 'draft' | 'submitted' | 'approved';
  created_at: string;
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

export function ProjectsTab() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>("all");
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

  // Handle advance to next stage
  const handleAdvanceStage = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const nextStage = getNextStage(project.pipeline_stage);
    if (nextStage) {
      advanceStageMutation.mutate({ token: project.project_token, stage: nextStage });
    }
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
          <Badge variant="outline">{projects.length} total</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Pipeline filter tabs - horizontal scroll on mobile */}
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
                        {project.intake && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <FileText className="h-3 w-3" />
                            Intake
                          </span>
                        )}
                        {project.contact_phone && (
                          <span className="truncate max-w-[120px] sm:max-w-[150px]">
                            {project.contact_phone}
                          </span>
                        )}
                      </div>
                      
                      {/* Row 4: Email - own row on mobile for readability */}
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
      </CardContent>
    </Card>
  );
}
