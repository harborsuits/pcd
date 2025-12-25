import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Mail, Phone, ExternalLink,
  MessageSquare, Send, Loader2, CheckCircle,
  StickyNote, Trash2, Plus, Eye, MessageCirclePlus,
  X, MessageSquareDot, Filter, Check, Circle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
  intake?: {
    project_id: string;
    intake_json: Record<string, unknown>;
    intake_version: number;
    created_at: string;
  } | null;
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

interface Prototype {
  id: string;
  url: string;
  version_label: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PrototypeComment {
  id: string;
  source_message_id: string | null;
  body: string;
  pin_x: number | null;
  pin_y: number | null;
  resolved_at: string | null;
  created_at: string;
  author_type: string;
}

const STATUS_OPTIONS = [
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "client", label: "Client" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

interface ProjectWorkSurfaceProps {
  project: Project;
  onBack: () => void;
  onStatusChange: () => void;
}

export function ProjectWorkSurface({ project, onBack, onStatusChange }: ProjectWorkSurfaceProps) {
  const [replyContent, setReplyContent] = useState("");
  const [newNote, setNewNote] = useState("");
  const [activePanel, setActivePanel] = useState<"comments" | "chat" | "notes">("comments");
  const [commentFilter, setCommentFilter] = useState<"open" | "resolved" | "all">("open");
  const [clientTyping, setClientTyping] = useState(false);
  const [newPrototypeUrl, setNewPrototypeUrl] = useState("");
  const [newPrototypeVersion, setNewPrototypeVersion] = useState("");
  const [pendingCommentMessage, setPendingCommentMessage] = useState<Message | null>(null);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [highlightedPinId, setHighlightedPinId] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const pinOverlayRef = useRef<HTMLDivElement>(null);
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
    if (!typingChannel) return;

    typingChannel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.who !== "client") return;
        setClientTyping(!!payload.isTyping);
        if (clientTypingTimeoutRef.current) clearTimeout(clientTypingTimeoutRef.current);
        clientTypingTimeoutRef.current = setTimeout(() => setClientTyping(false), 2000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [typingChannel]);

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
      typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1200);
    }
  };

  // Fetch messages
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["project-messages", project.project_token],
    queryFn: async () => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/messages/${project.project_token}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json() as Promise<{ messages: Message[] }>;
    },
    refetchInterval: 10000,
  });

  // Fetch notes
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ["project-notes", project.project_token],
    queryFn: async () => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/notes/${project.project_token}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json() as Promise<{ notes: Note[] }>;
    },
  });

  // Fetch prototypes
  const { data: prototypesData, isLoading: prototypesLoading } = useQuery({
    queryKey: ["project-prototypes", project.project_token],
    queryFn: async () => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/prototypes/${project.project_token}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to fetch prototypes");
      return res.json() as Promise<{ prototypes: Prototype[] }>;
    },
  });

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["project-comments", project.project_token],
    queryFn: async () => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/comments/${project.project_token}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json() as Promise<{ comments: PrototypeComment[] }>;
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/projects/${project.project_token}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
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
    onError: (error: Error) => toast.error(error.message),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/messages/${project.project_token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ content, sender_type: "admin" }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Message sent");
      setReplyContent("");
      queryClient.invalidateQueries({ queryKey: ["project-messages", project.project_token] });
      queryClient.invalidateQueries({ queryKey: ["admin-inbox"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/notes/${project.project_token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Note added");
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["project-notes", project.project_token] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/notes/${project.project_token}/${noteId}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to delete note");
    },
    onSuccess: () => {
      toast.success("Note deleted");
      queryClient.invalidateQueries({ queryKey: ["project-notes", project.project_token] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Add prototype mutation
  const addPrototypeMutation = useMutation({
    mutationFn: async ({ url, version_label }: { url: string; version_label?: string }) => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/prototypes/${project.project_token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ url, version_label, status: "sent" }),
      });
      if (!res.ok) throw new Error("Failed to add prototype");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Prototype added");
      setNewPrototypeUrl("");
      setNewPrototypeVersion("");
      queryClient.invalidateQueries({ queryKey: ["project-prototypes", project.project_token] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ prototypeId, body, pinX, pinY, sourceMessageId }: {
      prototypeId: string; body: string; pinX: number; pinY: number; sourceMessageId?: string;
    }) => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/comments/${project.project_token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ prototype_id: prototypeId, body, pin_x: pinX, pin_y: pinY, source_message_id: sourceMessageId }),
      });
      if (!res.ok) throw new Error("Failed to create comment");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Comment created");
      setPendingCommentMessage(null);
      setPendingPin(null);
      queryClient.invalidateQueries({ queryKey: ["project-comments", project.project_token] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Resolve comment mutation
  const resolveCommentMutation = useMutation({
    mutationFn: async ({ commentId, resolve }: { commentId: string; resolve: boolean }) => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/comments/${project.project_token}/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ resolved: resolve }),
      });
      if (!res.ok) throw new Error("Failed to update comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-comments", project.project_token] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const messages = messagesData?.messages || [];
  const notes = notesData?.notes || [];
  const prototypes = prototypesData?.prototypes || [];
  const comments = commentsData?.comments || [];
  const currentPrototype = prototypes[0];

  // Filter comments
  const filteredComments = useMemo(() => {
    if (commentFilter === "all") return comments;
    if (commentFilter === "open") return comments.filter(c => !c.resolved_at);
    return comments.filter(c => c.resolved_at);
  }, [comments, commentFilter]);

  const openCount = comments.filter(c => !c.resolved_at).length;
  const resolvedCount = comments.filter(c => c.resolved_at).length;

  // Set of message IDs that have been linked to comments
  const linkedMessageIds = useMemo(() => {
    const ids = new Set<string>();
    comments.forEach((c) => { if (c.source_message_id) ids.add(c.source_message_id); });
    return ids;
  }, [comments]);

  // Jump to pin highlight
  const handleJumpToPin = (comment: PrototypeComment) => {
    setHighlightedPinId(comment.id);
    setTimeout(() => setHighlightedPinId(null), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-border bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">{project.business_name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {project.contact_email && (
                <a href={`mailto:${project.contact_email}`} className="flex items-center gap-1 hover:text-primary">
                  <Mail className="h-3 w-3" /> {project.contact_email}
                </a>
              )}
              {project.contact_phone && (
                <a href={`tel:${project.contact_phone}`} className="flex items-center gap-1 hover:text-primary">
                  <Phone className="h-3 w-3" /> {project.contact_phone}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={project.status} onValueChange={(v) => updateStatusMutation.mutate(v)} disabled={updateStatusMutation.isPending}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => window.open(`/p/${project.project_token}`, "_blank")}>
            <ExternalLink className="h-4 w-4 mr-1" /> Portal
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Prototype Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          {/* Prototype controls */}
          <div className="flex-shrink-0 p-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <Input
              placeholder="Prototype URL..."
              value={newPrototypeUrl}
              onChange={(e) => setNewPrototypeUrl(e.target.value)}
              className="flex-1 h-8 text-sm"
            />
            <Input
              placeholder="v1"
              value={newPrototypeVersion}
              onChange={(e) => setNewPrototypeVersion(e.target.value)}
              className="w-16 h-8 text-sm"
            />
            <Button
              size="sm"
              onClick={() => {
                if (newPrototypeUrl.trim()) {
                  addPrototypeMutation.mutate({ url: newPrototypeUrl.trim(), version_label: newPrototypeVersion.trim() || undefined });
                }
              }}
              disabled={!newPrototypeUrl.trim() || addPrototypeMutation.isPending}
            >
              {addPrototypeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
            {currentPrototype && (
              <>
                <div className="h-4 w-px bg-border" />
                <Badge variant="secondary" className="text-xs">{currentPrototype.version_label || "v1"}</Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIframeKey(k => k + 1)} title="Refresh">
                  <Eye className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Turn into comment banner */}
          {pendingCommentMessage && (
            <div className="flex-shrink-0 bg-primary/10 border-b border-primary/20 p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCirclePlus className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Pin this message as a comment</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">"{pendingCommentMessage.content}"</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pendingPin && currentPrototype && (
                  <Button
                    size="sm"
                    onClick={() => {
                      createCommentMutation.mutate({
                        prototypeId: currentPrototype.id,
                        body: pendingCommentMessage.content,
                        pinX: pendingPin.x,
                        pinY: pendingPin.y,
                        sourceMessageId: pendingCommentMessage.id,
                      });
                    }}
                    disabled={createCommentMutation.isPending}
                  >
                    {createCommentMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                    Create
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPendingCommentMessage(null); setPendingPin(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Prototype iframe with pins */}
          <div className="flex-1 relative bg-muted/20 overflow-hidden">
            {prototypesLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !currentPrototype ? (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No prototype yet</p>
                  <p className="text-sm">Add a URL above to get started</p>
                </div>
              </div>
            ) : (
              <>
                <iframe
                  key={iframeKey}
                  src={currentPrototype.url}
                  className="absolute inset-0 w-full h-full border-0"
                  title="Prototype"
                />
                {/* Pin overlay */}
                <div
                  ref={pinOverlayRef}
                  className={`absolute inset-0 ${pendingCommentMessage ? "cursor-crosshair bg-primary/5" : ""}`}
                  onClick={(e) => {
                    if (!pendingCommentMessage) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setPendingPin({ x, y });
                  }}
                >
                  {/* Existing pins */}
                  {comments.filter(c => c.pin_x !== null && c.pin_y !== null).map((comment, idx) => (
                    <div
                      key={comment.id}
                      className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer transition-all ${
                        comment.resolved_at 
                          ? "bg-muted text-muted-foreground border border-border" 
                          : "bg-primary text-primary-foreground"
                      } ${highlightedPinId === comment.id ? "ring-4 ring-primary/50 scale-125" : ""}`}
                      style={{ left: `${comment.pin_x}%`, top: `${comment.pin_y}%` }}
                      onClick={(e) => { e.stopPropagation(); handleJumpToPin(comment); }}
                      title={comment.body}
                    >
                      {idx + 1}
                    </div>
                  ))}
                  {/* Pending pin */}
                  {pendingPin && (
                    <div
                      className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg animate-pulse"
                      style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
                    >
                      <MessageCirclePlus className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Sidebar Panel */}
        <div className="w-[400px] flex flex-col bg-card overflow-hidden">
          <Tabs value={activePanel} onValueChange={(v) => setActivePanel(v as typeof activePanel)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="flex-shrink-0 w-full grid grid-cols-3 p-1 m-2 mb-0">
              <TabsTrigger value="comments" className="text-xs gap-1">
                <MessageCirclePlus className="h-3 w-3" />
                Comments
                {openCount > 0 && <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1">{openCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-xs gap-1">
                <MessageSquare className="h-3 w-3" />
                Chat
                {messages.length > 0 && <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1">{messages.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-xs gap-1">
                <StickyNote className="h-3 w-3" />
                Notes
              </TabsTrigger>
            </TabsList>

            {/* Comments Triage */}
            <TabsContent value="comments" className="flex-1 flex flex-col overflow-hidden m-0 p-2">
              {/* Filter buttons */}
              <div className="flex-shrink-0 flex items-center gap-1 mb-2">
                <Button
                  variant={commentFilter === "open" ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setCommentFilter("open")}
                >
                  <Circle className="h-3 w-3 mr-1" /> Open ({openCount})
                </Button>
                <Button
                  variant={commentFilter === "resolved" ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setCommentFilter("resolved")}
                >
                  <CheckCircle className="h-3 w-3 mr-1" /> Resolved ({resolvedCount})
                </Button>
                <Button
                  variant={commentFilter === "all" ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setCommentFilter("all")}
                >
                  <Filter className="h-3 w-3 mr-1" /> All
                </Button>
              </div>

              <ScrollArea className="flex-1">
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredComments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCirclePlus className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No {commentFilter} comments</p>
                  </div>
                ) : (
                  <div className="space-y-2 pr-2">
                    {filteredComments.map((comment, idx) => (
                      <div
                        key={comment.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          highlightedPinId === comment.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                        }`}
                        onClick={() => handleJumpToPin(comment)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                              comment.resolved_at ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm line-clamp-2">{comment.body}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {comment.author_type === "client" ? "Client" : "Admin"} • {format(new Date(comment.created_at), "MMM d, h:mm a")}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              resolveCommentMutation.mutate({ commentId: comment.id, resolve: !comment.resolved_at });
                            }}
                            disabled={resolveCommentMutation.isPending}
                            title={comment.resolved_at ? "Reopen" : "Resolve"}
                          >
                            {comment.resolved_at ? <Circle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Chat */}
            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 p-2">
              <ScrollArea className="flex-1">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 pr-2">
                    {messages.map((msg) => {
                      const isAdmin = msg.sender_type === "admin";
                      const isLinkedToComment = linkedMessageIds.has(msg.id);
                      return (
                        <div key={msg.id} className={`flex group ${isAdmin ? "justify-end" : "justify-start"}`}>
                          <div className="flex items-start gap-1 max-w-[85%]">
                            {!isAdmin && prototypes.length > 0 && !isLinkedToComment && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
                                title="Turn into comment"
                                onClick={() => { setPendingCommentMessage(msg); }}
                              >
                                <MessageCirclePlus className="h-3 w-3" />
                              </Button>
                            )}
                            {!isAdmin && isLinkedToComment && (
                              <div className="h-5 w-5 flex items-center justify-center flex-shrink-0 mt-1">
                                <MessageSquareDot className="h-3 w-3 text-primary" />
                              </div>
                            )}
                            <div className={`rounded-xl px-3 py-2 text-sm ${
                              isAdmin ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${isAdmin ? "opacity-70" : "text-muted-foreground"}`}>
                                {format(new Date(msg.created_at), "h:mm a")}
                                {isLinkedToComment && <span className="text-primary ml-1">• Pinned</span>}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {clientTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground animate-pulse">
                          typing...
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Reply input */}
              <div className="flex-shrink-0 pt-2 border-t border-border mt-2 space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => handleReplyChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && replyContent.trim()) {
                      e.preventDefault();
                      sendMessageMutation.mutate(replyContent);
                    }
                  }}
                  placeholder="Send a message..."
                  className="min-h-[60px] resize-none text-sm"
                />
                <Button
                  className="w-full"
                  onClick={() => sendMessageMutation.mutate(replyContent)}
                  disabled={!replyContent.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Send
                </Button>
              </div>
            </TabsContent>

            {/* Notes */}
            <TabsContent value="notes" className="flex-1 flex flex-col overflow-hidden m-0 p-2">
              <ScrollArea className="flex-1">
                {notesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <StickyNote className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No notes yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 pr-2">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 rounded-lg border border-border bg-muted/30 group">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[10px] text-muted-foreground">{format(new Date(note.created_at), "MMM d, h:mm a")}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            disabled={deleteNoteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Add note input */}
              <div className="flex-shrink-0 pt-2 border-t border-border mt-2 space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="min-h-[60px] resize-none text-sm"
                />
                <Button
                  className="w-full"
                  onClick={() => addNoteMutation.mutate(newNote)}
                  disabled={!newNote.trim() || addNoteMutation.isPending}
                  size="sm"
                >
                  {addNoteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Note
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
