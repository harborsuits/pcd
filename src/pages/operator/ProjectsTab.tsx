import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FolderOpen, Loader2, Clock, CheckCircle, FileText, 
  MessageSquare, ExternalLink, ChevronRight 
} from "lucide-react";
import { format } from "date-fns";
import { ProjectWorkSurface } from "./ProjectWorkSurface";
import { adminFetch } from "@/lib/adminFetch";
import { useOperatorContext } from "./OperatorLayout";

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
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  source: string;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
  intake: ProjectIntake | null;
  unread_count: number;
}

const STATUS_COLORS: Record<string, string> = {
  lead: "bg-muted text-muted-foreground",
  contacted: "bg-blue-500/10 text-blue-600",
  interested: "bg-amber-500/10 text-amber-600",
  client: "bg-green-500/10 text-green-600",
  completed: "bg-purple-500/10 text-purple-600",
  archived: "bg-gray-500/10 text-gray-600",
};

export function ProjectsTab() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<"new" | "active" | "completed">("new");
  const { setCurrentProjectToken, setCurrentProjectName, registerCloseProject } = useOperatorContext();

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

  // Categorize projects
  const newProjects = projects.filter(p => ["lead", "contacted"].includes(p.status));
  const activeProjects = projects.filter(p => ["interested", "client"].includes(p.status));
  const completedProjects = projects.filter(p => ["completed", "archived"].includes(p.status));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return format(date, "EEEE");
    return format(date, "MMM d");
  };

  const getDisplayProjects = () => {
    switch (activeTab) {
      case "new": return newProjects;
      case "active": return activeProjects;
      case "completed": return completedProjects;
      default: return projects;
    }
  };

  const displayProjects = getDisplayProjects();

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
          <div className="flex gap-2">
            <Badge variant="outline">{projects.length} total</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <div className="px-4 border-b">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="new" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                New ({newProjects.length})
              </TabsTrigger>
              <TabsTrigger 
                value="active"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                Active ({activeProjects.length})
              </TabsTrigger>
              <TabsTrigger 
                value="completed"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                Completed ({completedProjects.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-[calc(100vh-280px)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : displayProjects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No {activeTab} projects</p>
                </div>
              ) : (
                <div className="divide-y">
                  {displayProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 hover:bg-muted/50 cursor-pointer transition-colors group"
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">
                              {project.business_name}
                            </span>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${STATUS_COLORS[project.status] || ""}`}
                            >
                              {project.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(project.created_at)}
                            </span>
                            {project.unread_count > 0 && (
                              <span className="flex items-center gap-1 text-primary font-medium">
                                <MessageSquare className="h-3 w-3" />
                                {project.unread_count} unread
                              </span>
                            )}
                            {project.intake && (
                              <span className="flex items-center gap-1 text-green-600">
                                <FileText className="h-3 w-3" />
                                Intake
                              </span>
                            )}
                            {project.contact_email && (
                              <span className="truncate max-w-[200px]">
                                {project.contact_email}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
