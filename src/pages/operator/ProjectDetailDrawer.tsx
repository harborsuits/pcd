import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Mail, Phone, MapPin, Calendar, FileText, 
  MessageSquare, Send, Loader2, ExternalLink, Building2,
  Palette, Settings, CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
}

interface Message {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
  read_at: string | null;
}

const STATUS_OPTIONS = [
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "client", label: "Client" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

interface ProjectDetailDrawerProps {
  project: Project | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: () => void;
}

export function ProjectDetailDrawer({ project, open, onClose, onStatusChange }: ProjectDetailDrawerProps) {
  const [replyContent, setReplyContent] = useState("");
  const [activeTab, setActiveTab] = useState<"intake" | "messages">("intake");
  const queryClient = useQueryClient();

  // Reset state when project changes
  useEffect(() => {
    if (project) {
      setReplyContent("");
      setActiveTab(project.intake ? "intake" : "messages");
    }
  }, [project?.id]);

  // Fetch messages for this project
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["project-messages", project?.project_token],
    queryFn: async () => {
      if (!project) return { messages: [] };
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/messages/${project.project_token}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json() as Promise<{ messages: Message[] }>;
    },
    enabled: !!project,
    refetchInterval: 10000,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!project) throw new Error("No project");
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/projects/${project.project_token}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-key": adminKey 
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      onStatusChange();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!project) throw new Error("No project");
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/messages/${project.project_token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ content, sender_type: "admin" }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Message sent");
      setReplyContent("");
      queryClient.invalidateQueries({ queryKey: ["project-messages", project?.project_token] });
      queryClient.invalidateQueries({ queryKey: ["admin-inbox"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!project) return null;

  const messages = messagesData?.messages || [];
  const intake = project.intake?.intake_json || {};

  // Parse intake sections
  const basics = intake.basics as Record<string, unknown> | undefined;
  const style = intake.style as Record<string, unknown> | undefined;
  const functionality = intake.functionality as Record<string, unknown> | undefined;

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{project.business_name}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Created {format(new Date(project.created_at), "MMM d, yyyy")}
              </p>
            </div>
            <Select 
              value={project.status} 
              onValueChange={(v) => updateStatusMutation.mutate(v)}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SheetHeader>

        {/* Contact Info */}
        <div className="flex-shrink-0 py-4 border-b space-y-2">
          {project.contact_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{project.contact_name}</span>
            </div>
          )}
          {project.contact_email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${project.contact_email}`} className="text-primary hover:underline">
                {project.contact_email}
              </a>
            </div>
          )}
          {project.contact_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${project.contact_phone}`} className="text-primary hover:underline">
                {project.contact_phone}
              </a>
            </div>
          )}
          {(project.city || project.state) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{[project.city, project.state].filter(Boolean).join(", ")}</span>
            </div>
          )}
          <div className="pt-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/p/${project.project_token}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Client Portal
              </a>
            </Button>
          </div>
        </div>

        {/* Tabs: Intake / Messages */}
        <Tabs 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="flex-shrink-0 w-full">
            <TabsTrigger value="intake" className="flex-1 gap-2">
              <FileText className="h-4 w-4" />
              Intake
              {project.intake && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-1 gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
              {messages.length > 0 && (
                <Badge variant="secondary" className="text-xs">{messages.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Intake Tab */}
          <TabsContent value="intake" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full pr-4">
              {!project.intake ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No intake data yet</p>
                  <p className="text-sm mt-1">Client hasn't completed the wizard</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basics */}
                  {basics && Object.keys(basics).length > 0 && (
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4" />
                        Business Basics
                      </h4>
                      <div className="space-y-2 pl-6">
                        {Object.entries(basics).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>{" "}
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Style */}
                  {style && Object.keys(style).length > 0 && (
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Palette className="h-4 w-4" />
                        Style Preferences
                      </h4>
                      <div className="space-y-2 pl-6">
                        {Object.entries(style).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>{" "}
                            <span>
                              {Array.isArray(value) ? value.join(", ") : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Functionality */}
                  {functionality && Object.keys(functionality).length > 0 && (
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Settings className="h-4 w-4" />
                        Functionality
                      </h4>
                      <div className="space-y-2 pl-6">
                        {Object.entries(functionality).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>{" "}
                            <span>
                              {Array.isArray(value) ? value.join(", ") : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw JSON fallback if no structured sections */}
                  {!basics && !style && !functionality && (
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                      {JSON.stringify(intake, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="flex-1 flex flex-col overflow-hidden mt-4">
            <ScrollArea className="flex-1 pr-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-1">Start the conversation below</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.sender_type === "admin"
                          ? "bg-primary/10 ml-8"
                          : "bg-muted mr-8"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">
                          {msg.sender_type === "admin" ? "You" : "Client"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Reply Input */}
            <div className="flex-shrink-0 pt-4 border-t mt-4 space-y-2">
              <Textarea
                placeholder="Type a message..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <Button
                className="w-full"
                onClick={() => sendMessageMutation.mutate(replyContent)}
                disabled={!replyContent.trim() || sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Message
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
