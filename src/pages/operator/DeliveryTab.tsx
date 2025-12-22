import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Inbox, FolderOpen, Users, ExternalLink, Send, 
  Loader2, MessageSquare, Clock, CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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

interface Project {
  id: string;
  business_name: string;
  business_slug: string;
  project_token: string;
  status: string;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
}

export function DeliveryTab() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const queryClient = useQueryClient();

  // Fetch inbox
  const { data: inboxData, isLoading: inboxLoading } = useQuery({
    queryKey: ["admin-inbox"],
    queryFn: async () => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/inbox`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to fetch inbox");
      return res.json() as Promise<{ conversations: InboxItem[] }>;
    },
    refetchInterval: 30000,
  });

  // Fetch all projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/projects`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json() as Promise<{ projects: Project[] }>;
    },
    refetchInterval: 60000,
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({ projectToken, content }: { projectToken: string; content: string }) => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/messages/${projectToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ content, sender_type: "admin" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Reply sent");
      setReplyContent("");
      setSelectedProject(null);
      queryClient.invalidateQueries({ queryKey: ["admin-inbox"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const inbox = inboxData?.conversations || [];
  const projects = projectsData?.projects || [];
  const unreadCount = inbox.filter(i => i.unread_count > 0).length;

  const activeProjects = projects.filter(p => 
    ["interested", "client"].includes(p.status)
  );
  const leadProjects = projects.filter(p => 
    ["lead", "contacted"].includes(p.status)
  );

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return format(date, "h:mm a");
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return format(date, "EEEE");
    return format(date, "MMM d");
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" />
          {activeProjects.length} active
        </Badge>
        <Badge variant={unreadCount > 0 ? "default" : "outline"} className="gap-1">
          <MessageSquare className="h-3 w-3" />
          {unreadCount} unread
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inbox */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Inbox
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {inboxLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : inbox.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No messages yet
                </div>
              ) : (
                <div className="divide-y">
                  {inbox.map((item) => (
                    <div
                      key={item.project_id}
                      className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                        selectedProject === item.project_token ? "bg-muted" : ""
                      } ${item.unread_count > 0 ? "border-l-2 border-l-primary" : ""}`}
                      onClick={() => setSelectedProject(
                        selectedProject === item.project_token ? null : item.project_token
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{item.business_name}</span>
                            {item.unread_count > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {item.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {item.last_message_sender_type === "admin" && "You: "}
                            {item.last_message_content}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(item.last_message_created_at)}
                        </div>
                      </div>

                      {/* Reply form */}
                      {selectedProject === item.project_token && (
                        <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                          <Textarea
                            placeholder="Type your reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => sendReplyMutation.mutate({
                                projectToken: item.project_token,
                                content: replyContent,
                              })}
                              disabled={!replyContent.trim() || sendReplyMutation.isPending}
                            >
                              {sendReplyMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Send className="h-4 w-4 mr-1" />
                              )}
                              Send
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <a href={`/p/${item.project_token}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Open Portal
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="active">
              <div className="px-4">
                <TabsList className="w-full">
                  <TabsTrigger value="active" className="flex-1">
                    Active ({activeProjects.length})
                  </TabsTrigger>
                  <TabsTrigger value="leads" className="flex-1">
                    Leads ({leadProjects.length})
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="active" className="mt-0">
                <ScrollArea className="h-[340px]">
                  {projectsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : activeProjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No active projects
                    </div>
                  ) : (
                    <div className="divide-y">
                      {activeProjects.map((project) => (
                        <div key={project.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">{project.business_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {project.contact_phone || project.contact_email || "No contact"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={project.status === "client" ? "default" : "secondary"}>
                                {project.status}
                              </Badge>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={`/p/${project.project_token}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="leads" className="mt-0">
                <ScrollArea className="h-[340px]">
                  {projectsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : leadProjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No leads
                    </div>
                  ) : (
                    <div className="divide-y">
                      {leadProjects.map((project) => (
                        <div key={project.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">{project.business_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(project.created_at), "MMM d, yyyy")}
                              </div>
                            </div>
                            <Badge variant="outline">{project.status}</Badge>
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
      </div>
    </div>
  );
}
