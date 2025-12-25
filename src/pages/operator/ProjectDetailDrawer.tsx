import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Mail, Phone, MapPin, FileText, 
  MessageSquare, Send, Loader2, ExternalLink, Building2,
  Palette, Settings, CheckCircle, StickyNote, ListTodo, Trash2,
  Link, Plus, Eye
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

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  is_done: boolean;
  sort_order: number;
  created_at: string;
  completed_at: string | null;
}

interface Prototype {
  id: string;
  url: string;
  version_label: string | null;
  status: string;
  created_at: string;
  updated_at: string;
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
  const [newNote, setNewNote] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [activeTab, setActiveTab] = useState<"intake" | "messages" | "notes" | "checklist" | "prototype">("intake");
  const [clientTyping, setClientTyping] = useState(false);
  const [newPrototypeUrl, setNewPrototypeUrl] = useState("");
  const [newPrototypeVersion, setNewPrototypeVersion] = useState("");
  const queryClient = useQueryClient();
  const clientTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typing channel for real-time typing indicators
  const typingChannel = useMemo(() => {
    if (!project?.project_token) return null;
    return supabase.channel(`typing-${project.project_token}`);
  }, [project?.project_token]);

  // Subscribe to typing events from client
  useEffect(() => {
    if (!typingChannel || !open) return;

    typingChannel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.who !== "client") return;

        setClientTyping(!!payload.isTyping);

        // Auto-clear after 2s if no "false" arrives
        if (clientTypingTimeoutRef.current) clearTimeout(clientTypingTimeoutRef.current);
        clientTypingTimeoutRef.current = setTimeout(() => setClientTyping(false), 2000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [typingChannel, open]);

  // Emit typing event (debounced)
  const emitTyping = useCallback((isTyping: boolean) => {
    if (!typingChannel) return;
    typingChannel.send({
      type: "broadcast",
      event: "typing",
      payload: { who: "admin", isTyping, at: Date.now() },
    });
  }, [typingChannel]);

  const handleReplyChange = (value: string) => {
    setReplyContent(value);
    
    if (value.trim()) {
      emitTyping(true);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(false);
      }, 1200);
    }
  };

  // Reset state when project changes
  useEffect(() => {
    if (project) {
      setReplyContent("");
      setNewNote("");
      setNewChecklistItem("");
      setActiveTab(project.intake ? "intake" : "messages");
      setClientTyping(false);
    }
  }, [project?.id]);

  // Mark messages as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (token: string) => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/messages/mark-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ project_token: token }),
      });
      if (!res.ok) throw new Error("Failed to mark messages as read");
      return res.json();
    },
    onSuccess: () => {
      // Refresh counts in projects list and inbox
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-inbox"] });
    },
  });

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
    enabled: !!project && open,
    refetchInterval: 10000,
  });

  // Mark messages as read when messages tab is viewed (only if there are unread messages)
  useEffect(() => {
    if (!project || !open) return;
    if (activeTab !== "messages") return;
    if (markReadMutation.isPending) return;
    
    // Only call mark-read if there are actually unread client messages
    const hasUnreadClient = messagesData?.messages?.some(
      (m: Message) => m.sender_type === "client" && !m.read_at
    );
    if (!hasUnreadClient) return;

    markReadMutation.mutate(project.project_token);
  }, [project?.project_token, open, activeTab, messagesData?.messages]);

  // Fetch notes
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ["project-notes", project?.project_token],
    queryFn: async () => {
      if (!project) return { notes: [] };
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/notes/${project.project_token}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json() as Promise<{ notes: Note[] }>;
    },
    enabled: !!project && open,
  });

  // Fetch checklist
  const { data: checklistData, isLoading: checklistLoading } = useQuery({
    queryKey: ["project-checklist", project?.project_token],
    queryFn: async () => {
      if (!project) return { items: [] };
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/checklist/${project.project_token}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to fetch checklist");
      return res.json() as Promise<{ items: ChecklistItem[] }>;
    },
    enabled: !!project && open,
  });

  // Fetch prototypes
  const { data: prototypesData, isLoading: prototypesLoading } = useQuery({
    queryKey: ["project-prototypes", project?.project_token],
    queryFn: async () => {
      if (!project) return { prototypes: [] };
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/prototypes/${project.project_token}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to fetch prototypes");
      return res.json() as Promise<{ prototypes: Prototype[] }>;
    },
    enabled: !!project && open,
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

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!project) throw new Error("No project");
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/notes/${project.project_token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Note added");
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["project-notes", project?.project_token] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      if (!project) throw new Error("No project");
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/notes/${project.project_token}/${noteId}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to delete note");
    },
    onSuccess: () => {
      toast.success("Note deleted");
      queryClient.invalidateQueries({ queryKey: ["project-notes", project?.project_token] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Add checklist item mutation
  const addChecklistMutation = useMutation({
    mutationFn: async (label: string) => {
      if (!project) throw new Error("No project");
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/checklist/${project.project_token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error("Failed to add task");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Task added");
      setNewChecklistItem("");
      queryClient.invalidateQueries({ queryKey: ["project-checklist", project?.project_token] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Toggle checklist item mutation
  const toggleChecklistMutation = useMutation({
    mutationFn: async ({ itemId, is_done }: { itemId: string; is_done: boolean }) => {
      if (!project) throw new Error("No project");
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/checklist/${project.project_token}/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ is_done }),
      });
      if (!res.ok) throw new Error("Failed to update task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-checklist", project?.project_token] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete checklist item mutation
  const deleteChecklistMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!project) throw new Error("No project");
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/checklist/${project.project_token}/${itemId}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to delete task");
    },
    onSuccess: () => {
      toast.success("Task deleted");
      queryClient.invalidateQueries({ queryKey: ["project-checklist", project?.project_token] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Add default checklist mutation
  const addDefaultsMutation = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error("No project");
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/checklist/${project.project_token}/defaults`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to add defaults");
    },
    onSuccess: () => {
      toast.success("Default checklist added");
      queryClient.invalidateQueries({ queryKey: ["project-checklist", project?.project_token] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Add prototype mutation
  const addPrototypeMutation = useMutation({
    mutationFn: async ({ url, version_label }: { url: string; version_label?: string }) => {
      if (!project) throw new Error("No project");
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/prototypes/${project.project_token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ url, version_label, status: "sent" }),
      });
      if (!res.ok) throw new Error("Failed to add prototype");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Prototype added");
      setNewPrototypeUrl("");
      setNewPrototypeVersion("");
      queryClient.invalidateQueries({ queryKey: ["project-prototypes", project?.project_token] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update prototype status mutation
  const updatePrototypeMutation = useMutation({
    mutationFn: async ({ prototypeId, status }: { prototypeId: string; status: string }) => {
      if (!project) throw new Error("No project");
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/prototypes/${project.project_token}/${prototypeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update prototype");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Prototype updated");
      queryClient.invalidateQueries({ queryKey: ["project-prototypes", project?.project_token] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete prototype mutation
  const deletePrototypeMutation = useMutation({
    mutationFn: async (prototypeId: string) => {
      if (!project) throw new Error("No project");
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/prototypes/${project.project_token}/${prototypeId}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to delete prototype");
    },
    onSuccess: () => {
      toast.success("Prototype deleted");
      queryClient.invalidateQueries({ queryKey: ["project-prototypes", project?.project_token] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const messages = messagesData?.messages || [];
  const notes = notesData?.notes || [];
  const checklistItems = checklistData?.items || [];
  const prototypes = prototypesData?.prototypes || [];

  // Find last admin message index for read receipt display
  const lastAdminMsgIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_type === "admin") return i;
    }
    return -1;
  }, [messages]);

  if (!project) return null;
  const intake = project.intake?.intake_json || {};

  // Parse intake sections
  const basics = intake.basics as Record<string, unknown> | undefined;
  const style = intake.style as Record<string, unknown> | undefined;
  const functionality = intake.functionality as Record<string, unknown> | undefined;

  const completedCount = checklistItems.filter((i) => i.is_done).length;
  const totalCount = checklistItems.length;

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
        </div>

        {/* Tabs: Intake / Messages / Notes / Checklist */}
        <Tabs 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="flex-shrink-0 w-full grid grid-cols-5">
            <TabsTrigger value="intake" className="gap-1 text-xs px-1">
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">Intake</span>
              {project.intake && <CheckCircle className="h-2.5 w-2.5 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="prototype" className="gap-1 text-xs px-1">
              <Link className="h-3 w-3" />
              <span className="hidden sm:inline">Proto</span>
              {prototypes.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">{prototypes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-1 text-xs px-1">
              <MessageSquare className="h-3 w-3" />
              <span className="hidden sm:inline">Msgs</span>
              {messages.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">{messages.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1 text-xs px-1">
              <StickyNote className="h-3 w-3" />
              <span className="hidden sm:inline">Notes</span>
              {notes.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">{notes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-1 text-xs px-1">
              <ListTodo className="h-3 w-3" />
              <span className="hidden sm:inline">Tasks</span>
              {totalCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">{completedCount}/{totalCount}</Badge>
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
                  {messages.map((msg, index) => {
                    const isAdmin = msg.sender_type === "admin";
                    const isLastAdminMsg = isAdmin && index === lastAdminMsgIndex;
                    
                    const getStatus = () => {
                      if (msg.read_at) return `Seen ${format(new Date(msg.read_at), "h:mm a")}`;
                      return "Sent";
                    };
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[78%] rounded-2xl px-4 py-2 ${
                          isAdmin 
                            ? "bg-primary text-primary-foreground rounded-br-md" 
                            : "bg-muted rounded-bl-md"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <div className={`mt-1 flex items-center gap-2 text-[11px] ${
                            isAdmin ? "opacity-80 justify-end" : "text-muted-foreground justify-start"
                          }`}>
                            <span>{format(new Date(msg.created_at), "h:mm a")}</span>
                          </div>
                          {/* Read receipt for last admin message */}
                          {isLastAdminMsg && (
                            <div className={`mt-0.5 text-[11px] text-right ${
                              msg.read_at ? "text-green-500" : "opacity-70"
                            }`}>
                              {getStatus()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* Typing indicator */}
                  {clientTyping && (
                    <div className="p-3 rounded-lg bg-muted mr-8">
                      <span className="text-xs font-medium">Client</span>
                      <p className="text-sm text-muted-foreground animate-pulse">is typing…</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Reply Input */}
            <div className="flex-shrink-0 pt-4 border-t mt-4 space-y-2">
              <Textarea
                placeholder="Type a message..."
                value={replyContent}
                onChange={(e) => handleReplyChange(e.target.value)}
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

          {/* Notes Tab */}
          <TabsContent value="notes" className="flex-1 flex flex-col overflow-hidden mt-4">
            <ScrollArea className="flex-1 pr-4">
              {notesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <StickyNote className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No internal notes yet</p>
                  <p className="text-sm mt-1">Add notes the client won't see</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="border border-border rounded-lg p-3 group">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.created_at), "MMM d, h:mm a")}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          disabled={deleteNoteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Add Note Input */}
            <div className="flex-shrink-0 pt-4 border-t mt-4 space-y-2">
              <Textarea
                placeholder="Add internal note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[80px]"
              />
              <Button
                className="w-full"
                onClick={() => addNoteMutation.mutate(newNote)}
                disabled={!newNote.trim() || addNoteMutation.isPending}
              >
                {addNoteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <StickyNote className="h-4 w-4 mr-2" />
                )}
                Add Note
              </Button>
            </div>
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="flex-1 flex flex-col overflow-hidden mt-4">
            <ScrollArea className="flex-1 pr-4">
              {checklistLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : checklistItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No tasks yet</p>
                  <p className="text-sm mt-1 mb-4">Start with the default checklist</p>
                  <Button
                    onClick={() => addDefaultsMutation.mutate()}
                    disabled={addDefaultsMutation.isPending}
                    variant="outline"
                  >
                    {addDefaultsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ListTodo className="h-4 w-4 mr-2" />
                    )}
                    Add Default Checklist
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {checklistItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
                    >
                      <Checkbox
                        checked={item.is_done}
                        onCheckedChange={(checked) =>
                          toggleChecklistMutation.mutate({
                            itemId: item.id,
                            is_done: Boolean(checked),
                          })
                        }
                      />
                      <span
                        className={`flex-1 text-sm ${
                          item.is_done ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {item.label}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteChecklistMutation.mutate(item.id)}
                        disabled={deleteChecklistMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Add Task Input */}
            <div className="flex-shrink-0 pt-4 border-t mt-4 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newChecklistItem.trim()) {
                      addChecklistMutation.mutate(newChecklistItem);
                    }
                  }}
                  placeholder="New task..."
                  className="flex-1"
                />
                <Button
                  onClick={() => addChecklistMutation.mutate(newChecklistItem)}
                  disabled={!newChecklistItem.trim() || addChecklistMutation.isPending}
                >
                  {addChecklistMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
              {checklistItems.length > 0 && (
                <Button
                  onClick={() => addDefaultsMutation.mutate()}
                  disabled={addDefaultsMutation.isPending}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  + Add default items
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Prototype Tab */}
          <TabsContent value="prototype" className="flex-1 overflow-hidden mt-4">
            <div className="h-full flex flex-col">
              {/* Add new prototype form */}
              <div className="flex-shrink-0 space-y-2 mb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Prototype URL (Lovable, Figma, etc.)"
                    value={newPrototypeUrl}
                    onChange={(e) => setNewPrototypeUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Version (v1, v2...)"
                    value={newPrototypeVersion}
                    onChange={(e) => setNewPrototypeVersion(e.target.value)}
                    className="w-24"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (newPrototypeUrl.trim()) {
                      addPrototypeMutation.mutate({
                        url: newPrototypeUrl.trim(),
                        version_label: newPrototypeVersion.trim() || undefined,
                      });
                    }
                  }}
                  disabled={!newPrototypeUrl.trim() || addPrototypeMutation.isPending}
                  size="sm"
                  className="w-full"
                >
                  {addPrototypeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Prototype
                </Button>
              </div>

              {/* Prototypes list */}
              <ScrollArea className="flex-1">
                {prototypesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : prototypes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Link className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No prototypes yet</p>
                    <p className="text-sm mt-1">Add a URL to share with client</p>
                  </div>
                ) : (
                  <div className="space-y-3 pr-4">
                    {prototypes.map((proto) => (
                      <div
                        key={proto.id}
                        className="p-3 rounded-lg border border-border bg-card space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {proto.version_label && (
                                <Badge variant="secondary" className="text-xs">
                                  {proto.version_label}
                                </Badge>
                              )}
                              <Badge
                                variant={proto.status === "approved" ? "default" : "outline"}
                                className={
                                  proto.status === "approved"
                                    ? "bg-green-500/10 text-green-600 border-green-500/20 text-xs"
                                    : "text-xs"
                                }
                              >
                                {proto.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {proto.url}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Added {format(new Date(proto.created_at), "MMM d, h:mm a")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(proto.url, "_blank")}
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(proto.url);
                                toast.success("URL copied");
                              }}
                              title="Copy URL"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePrototypeMutation.mutate(proto.id)}
                              disabled={deletePrototypeMutation.isPending}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Status toggle */}
                        <div className="flex gap-1">
                          {["draft", "sent", "approved"].map((status) => (
                            <Button
                              key={status}
                              variant={proto.status === status ? "secondary" : "ghost"}
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={() => {
                                if (proto.status !== status) {
                                  updatePrototypeMutation.mutate({
                                    prototypeId: proto.id,
                                    status,
                                  });
                                }
                              }}
                              disabled={updatePrototypeMutation.isPending}
                            >
                              {status}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
