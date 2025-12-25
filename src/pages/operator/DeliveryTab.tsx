import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Inbox, Users, 
  Loader2, MessageSquare, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { ProjectDetailDrawer } from "./ProjectDetailDrawer";
import { adminFetch } from "@/lib/adminFetch";

interface InboxItem {
  project_id: string;
  project_token: string;
  business_name: string;
  status: string;
  last_message_content: string;
  last_message_sender_type: string;
  last_message_created_at: string;
  unread_count: number;
}

interface ProjectIntake {
  project_id: string;
  intake_json: Record<string, unknown>;
  intake_version: number;
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

export function DeliveryTab() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const queryClient = useQueryClient();

  // Fetch inbox
  const { data: inboxData, isLoading: inboxLoading, refetch: refetchInbox } = useQuery({
    queryKey: ["admin-inbox"],
    queryFn: async () => {
      const res = await adminFetch("/admin/inbox");
      if (!res.ok) throw new Error("Failed to fetch inbox");
      const data = await res.json();
      return (data || []).map((item: {
        project_id?: string;
        project_token: string;
        business_name: string;
        status: string;
        last_message?: { content: string; sender_type: string; created_at: string } | null;
        unread_count: number;
      }) => ({
        project_id: item.project_id || item.project_token,
        project_token: item.project_token,
        business_name: item.business_name,
        status: item.status,
        last_message_content: item.last_message?.content || "",
        last_message_sender_type: item.last_message?.sender_type || "",
        last_message_created_at: item.last_message?.created_at || "",
        unread_count: item.unread_count || 0,
      })) as InboxItem[];
    },
    refetchInterval: 15000,
  });

  // Fetch all projects (to get full project data for drawer)
  const { data: projectsData } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const res = await adminFetch("/admin/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json() as Promise<{ projects: Project[] }>;
    },
    refetchInterval: 60000,
  });

  const inbox = inboxData || [];
  const projects = projectsData?.projects || [];
  const unreadCount = inbox.filter(i => i.unread_count > 0).length;
  
  // Find project by token for drawer
  const findProject = (token: string): Project | null => {
    return projects.find(p => p.project_token === token) || null;
  };

  const handleOpenProject = (token: string) => {
    const project = findProject(token);
    if (project) {
      setSelectedProject(project);
    }
  };

  function formatDate(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return format(date, "h:mm a");
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return format(date, "EEEE");
    return format(date, "MMM d");
  }

  return (
    <>
      {/* Stats */}
      <div className="flex items-center gap-4 mb-6">
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" />
          {inbox.length} conversations
        </Badge>
        <Badge variant={unreadCount > 0 ? "default" : "outline"} className="gap-1">
          <MessageSquare className="h-3 w-3" />
          {unreadCount} unread
        </Badge>
      </div>

      {/* Inbox */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Message Inbox
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {inboxLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : inbox.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Inbox className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm mt-1">Client messages will appear here</p>
              </div>
            ) : (
              <div className="divide-y">
                {inbox.map((item) => (
                  <div
                    key={item.project_id}
                    className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors group ${
                      item.unread_count > 0 ? "border-l-2 border-l-primary bg-primary/5" : ""
                    }`}
                    onClick={() => handleOpenProject(item.project_token)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">
                            {item.business_name}
                          </span>
                          {item.unread_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {item.unread_count} new
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.last_message_sender_type === "admin" && (
                            <span className="text-primary">You: </span>
                          )}
                          {item.last_message_content || "No messages"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(item.last_message_created_at)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Project Detail Drawer */}
      <ProjectDetailDrawer
        project={selectedProject}
        open={!!selectedProject}
        onClose={() => {
          setSelectedProject(null);
          refetchInbox();
        }}
        onStatusChange={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
          refetchInbox();
        }}
      />
    </>
  );
}
