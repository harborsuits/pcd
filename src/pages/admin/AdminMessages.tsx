import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Search, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Project {
  id: string;
  project_token: string;
  business_name: string;
  status: string;
  last_message?: {
    content: string;
    sender_type: string;
    created_at: string;
  };
  unread_count: number;
}

interface Message {
  content: string;
  sender_type: string;
  created_at: string;
  read_at: string | null;
}

export default function AdminMessages() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchMessages(selectedProject.project_token);
    }
  }, [selectedProject]);

  async function fetchProjects() {
    try {
      setLoading(true);
      
      // Fetch projects with their latest message
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, project_token, business_name, status")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });

      if (projectsError) {
        console.error("Projects fetch error:", projectsError);
        return;
      }

      // For each project, get latest message and unread count
      const projectsWithMessages = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { data: latestMessage } = await supabase
            .from("messages")
            .select("content, sender_type, created_at")
            .eq("project_id", project.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("project_id", project.id)
            .eq("sender_type", "client")
            .is("read_at", null);

          return {
            ...project,
            last_message: latestMessage || undefined,
            unread_count: unreadCount || 0,
          };
        })
      );

      setProjects(projectsWithMessages);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(projectToken: string) {
    try {
      setLoadingMessages(true);

      const { data: response, error } = await supabase.functions.invoke(
        `portal/${projectToken}?messages_limit=100`,
        { method: "GET" }
      );

      if (error || response?.error) {
        console.error("Messages fetch error:", error || response?.error);
        return;
      }

      setMessages(response.messages || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSendReply() {
    if (!selectedProject || !replyContent.trim()) return;

    if (!adminKey) {
      setShowKeyInput(true);
      toast({
        title: "Admin key required",
        description: "Please enter your admin key to send messages.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        `https://ararrbvhzaudfaxjwdrc.supabase.co/functions/v1/admin/messages/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({
            project_token: selectedProject.project_token,
            content: replyContent.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Failed to send",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
        return;
      }

      // Optimistically add message
      if (data.message) {
        setMessages((prev) => [
          {
            ...data.message,
            read_at: null,
          },
          ...prev,
        ]);
      }

      setReplyContent("");
      toast({
        title: "Message sent",
        description: "Your reply has been sent.",
      });

      // Refresh projects to update last message
      fetchProjects();
    } catch (err) {
      console.error("Send reply error:", err);
      toast({
        title: "Failed to send",
        description: "Network error",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function formatFullDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.business_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Messages</h2>
        {showKeyInput && (
          <div className="flex items-center gap-2">
            <Input
              type="password"
              placeholder="Admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-48"
            />
            <Button size="sm" onClick={() => setShowKeyInput(false)}>
              Save
            </Button>
          </div>
        )}
        {!showKeyInput && adminKey && (
          <Badge variant="outline" className="text-green-600">
            Admin key set
          </Badge>
        )}
        {!showKeyInput && !adminKey && (
          <Button variant="outline" size="sm" onClick={() => setShowKeyInput(true)}>
            Set Admin Key
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Inbox List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1">
                {["all", "lead", "active", "delivered"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="text-xs"
                  >
                    {status === "all" ? "All" : status}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              {filteredProjects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No projects found</p>
              ) : (
                <div className="divide-y">
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                        selectedProject?.id === project.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium truncate">{project.business_name}</span>
                        {project.unread_count > 0 && (
                          <Badge variant="default" className="ml-2 text-xs">
                            {project.unread_count}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                        {project.last_message && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(project.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      {project.last_message && (
                        <p className="text-sm text-muted-foreground truncate">
                          {project.last_message.sender_type === "admin" ? "You: " : ""}
                          {project.last_message.content}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Conversation View */}
        <Card className="lg:col-span-2 flex flex-col">
          {!selectedProject ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a project to view messages</p>
              </div>
            </div>
          ) : (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedProject.business_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Token: {selectedProject.project_token.slice(0, 12)}...
                    </p>
                  </div>
                  <Badge>{selectedProject.status}</Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 flex flex-col">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No messages yet</p>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg ${
                            msg.sender_type === "admin"
                              ? "bg-primary/10 border-l-4 border-primary ml-8"
                              : "bg-muted mr-8"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="text-xs">
                              {msg.sender_type === "admin" ? "You" : "Client"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFullDate(msg.created_at)}
                            </span>
                          </div>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Composer */}
                <div className="border-t p-4 space-y-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    disabled={sending}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSendReply}
                      disabled={sending || !replyContent.trim()}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
