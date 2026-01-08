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
  Trash2, Plus, Eye, MessageCirclePlus,
  X, MessageSquareDot, Filter, Check, Circle,
  ImageIcon, FileIcon, Upload, Download, Copy, Link2, Building2, Rocket, Target, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CommentCard } from "@/components/operator/CommentCard";
import { DataFreshnessPill } from "@/components/operator/DataFreshnessPill";
import { IntakeOverviewPanel } from "@/components/operator/IntakeOverviewPanel";

import { LaunchChecklist } from "@/components/operator/LaunchChecklist";
import { DeliverablesMilestones } from "@/components/operator/DeliverablesMilestones";
import { adminFetch, AdminAuthError } from "@/lib/adminFetch";
import { StageBadge, STAGE_CONFIG, getNextStage, getValidTargetStages, PipelineStage, isSystemMessage, parseSystemMessage } from "@/components/operator/StageBadge";

interface PhaseBData {
  logoStatus?: "uploaded" | "create" | "" | null;
  brandColors?: string | null;
  colorPreference?: "pick_for_me" | "custom" | "" | null;
  businessDescription?: string | null;
  services?: string | null;
  serviceArea?: string | null;
  differentiators?: string | null;
  faq?: string | null;
  primaryGoal?: "book" | "quote" | "call" | "portfolio" | "learn" | "visit" | "" | null;
  photosPlan?: "upload" | "generate" | "none" | "" | null;
  photosUploaded?: number | null;
  generatedPhotoSubjects?: string | null;
  generatedPhotoStyle?: "realistic" | "studio" | "lifestyle" | "minimal" | "" | null;
  generatedPhotoNotes?: string | null;
  placeholderOk?: boolean | null;
  googleReviewsLink?: string | null;
  certifications?: string | null;
  hasBeforeAfter?: "yes" | "coming_soon" | "no" | "" | null;
  vibe?: "modern" | "classic" | "luxury" | "bold" | "minimal" | "cozy" | "" | null;
  tone?: "professional" | "friendly" | "direct" | "playful" | "" | null;
  exampleSites?: string | null;
  mustInclude?: string | null;
  mustAvoid?: string | null;
}

interface Project {
  id: string;
  business_name: string;
  business_slug: string;
  project_token: string;
  status: string;
  pipeline_stage?: string | null;
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
    id: string;
    project_id: string;
    intake_json: Record<string, unknown>;
    intake_version: number;
    intake_status: 'draft' | 'submitted' | 'approved';
    phase_b_json?: PhaseBData | null;
    phase_b_status?: 'pending' | 'in_progress' | 'complete' | null;
    phase_b_completed_at?: string | null;
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
  prototype_id: string;
  source_message_id: string | null;
  body: string;
  pin_x: number | null;
  pin_y: number | null;
  resolved_at: string | null;
  created_at: string;
  author_type: string;
  // Anchor fields
  page_url?: string | null;
  page_path?: string | null;
  scroll_y?: number | null;
  viewport_w?: number | null;
  viewport_h?: number | null;
  breakpoint?: string | null;
  anchor_id?: string | null;
  anchor_selector?: string | null;
  x_pct?: number | null;
  y_pct?: number | null;
  text_hint?: string | null;
}

interface MediaItem {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploader_type: string;
  created_at: string;
  signed_url: string | null;
  source?: "media" | "intake";
  description?: string | null;
}


interface ProjectWorkSurfaceProps {
  project: Project;
  onBack: () => void;
  onStatusChange: () => void;
}

export function ProjectWorkSurface({ project, onBack, onStatusChange }: ProjectWorkSurfaceProps) {
  const [replyContent, setReplyContent] = useState("");
  const [activePanel, setActivePanel] = useState<"overview" | "milestones" | "comments" | "chat" | "media" | "launch">("overview");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Alt+R keyboard shortcut to refresh project data
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "r") {
        const el = document.activeElement as HTMLElement | null;
        const isTyping =
          el?.tagName === "INPUT" ||
          el?.tagName === "TEXTAREA" ||
          el?.getAttribute("contenteditable") === "true";
        if (isTyping) return;

        e.preventDefault();
        queryClient.invalidateQueries({ queryKey: ["project-messages", project.project_token] });
        queryClient.invalidateQueries({ queryKey: ["project-comments", project.project_token] });
        queryClient.invalidateQueries({ queryKey: ["project-media", project.project_token] });
        queryClient.invalidateQueries({ queryKey: ["project-prototypes", project.project_token] });
        toast.success("Project data refreshed");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [queryClient, project.project_token]);

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
      const res = await adminFetch(`/messages/${project.project_token}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json() as Promise<{ messages: Message[] }>;
    },
    refetchInterval: 10000,
  });

  // Fetch media
  const { data: mediaData, isLoading: mediaLoading } = useQuery({
    queryKey: ["project-media", project.project_token],
    queryFn: async () => {
      const res = await adminFetch(`/admin/media/${project.project_token}`);
      if (!res.ok) throw new Error("Failed to fetch media");
      return res.json() as Promise<{ media: MediaItem[] }>;
    },
  });

  // Fetch prototypes
  const { data: prototypesData, isLoading: prototypesLoading } = useQuery({
    queryKey: ["project-prototypes", project.project_token],
    queryFn: async () => {
      const res = await adminFetch(`/admin/prototypes/${project.project_token}`);
      if (!res.ok) throw new Error("Failed to fetch prototypes");
      return res.json() as Promise<{ prototypes: Prototype[] }>;
    },
  });

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["project-comments", project.project_token],
    queryFn: async () => {
      const res = await adminFetch(`/admin/comments/${project.project_token}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json() as Promise<{ comments: PrototypeComment[] }>;
    },
  });

  // Update pipeline stage mutation
  const updateStageMutation = useMutation({
    mutationFn: async (newStage: PipelineStage) => {
      const res = await adminFetch(`/admin/projects/${project.project_token}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error("Failed to update stage");
      return res.json();
    },
    onSuccess: (_, newStage) => {
      const stageLabel = STAGE_CONFIG[newStage]?.label || newStage;
      toast.success(`Stage updated to ${stageLabel}`);
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      onStatusChange();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Approve intake mutation
  const approveIntakeMut = useMutation({
    mutationFn: async (intakeId: string) => {
      const res = await adminFetch(`/admin/intake/${intakeId}/approve`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to approve intake");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Intake approved");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      onStatusChange();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await adminFetch(`/messages/${project.project_token}`, {
        method: "POST",
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

  // Upload media mutation
  const uploadMediaMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await adminFetch(`/admin/media/${project.project_token}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload media");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Media uploaded");
      queryClient.invalidateQueries({ queryKey: ["project-media", project.project_token] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const res = await adminFetch(`/admin/media/${project.project_token}/${mediaId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete media");
    },
    onSuccess: () => {
      toast.success("Media deleted");
      queryClient.invalidateQueries({ queryKey: ["project-media", project.project_token] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Add prototype mutation
  const addPrototypeMutation = useMutation({
    mutationFn: async ({ url, version_label }: { url: string; version_label?: string }) => {
      const res = await adminFetch(`/admin/prototypes/${project.project_token}`, {
        method: "POST",
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
      const res = await adminFetch(`/admin/comments/${project.project_token}`, {
        method: "POST",
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
      const res = await adminFetch(`/admin/comments/${project.project_token}/${commentId}`, {
        method: "PATCH",
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
  const media = mediaData?.media || [];
  const prototypes = prototypesData?.prototypes || [];
  const comments = commentsData?.comments || [];
  const currentPrototype = prototypes[0];

  // File upload handlers
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      uploadMediaMutation.mutate(file);
    });
  }, [uploadMediaMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const copyMediaLink = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }, []);

  const isImageMime = (mimeType: string) => mimeType.startsWith("image/");
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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

  // Map message ID to comment for quick lookup
  const messageToComment = useMemo(() => {
    const map = new Map<string, PrototypeComment>();
    comments.forEach((c) => { if (c.source_message_id) map.set(c.source_message_id, c); });
    return map;
  }, [comments]);

  // Jump to pin highlight
  const handleJumpToPin = (comment: PrototypeComment) => {
    setHighlightedPinId(comment.id);
    setTimeout(() => setHighlightedPinId(null), 2000);
  };

  // Jump from pinned message to comment
  const handleJumpFromMessage = (messageId: string) => {
    const comment = messageToComment.get(messageId);
    if (!comment) return;
    
    // Switch to comments panel
    setActivePanel("comments");
    // If comment is resolved but we're filtering to "open", switch to "all"
    if (comment.resolved_at && commentFilter === "open") {
      setCommentFilter("all");
    }
    // Highlight the pin
    handleJumpToPin(comment);
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
          <DataFreshnessPill
            staleAfterSeconds={30}
            queryKeys={[
              ["project-messages", project.project_token],
              ["project-comments", project.project_token],
              ["project-media", project.project_token],
              ["project-prototypes", project.project_token],
            ]}
          />
          
          {/* Pipeline Stage with Advance button */}
          <div className="flex items-center gap-1">
            <StageBadge stage={project.pipeline_stage} />
            {getNextStage(project.pipeline_stage) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                disabled={updateStageMutation.isPending}
                onClick={() => {
                  const next = getNextStage(project.pipeline_stage);
                  if (next) updateStageMutation.mutate(next);
                }}
              >
                <ArrowRight className="h-3 w-3" />
                {STAGE_CONFIG[getNextStage(project.pipeline_stage)!]?.label}
              </Button>
            )}
            {/* Move to dropdown for override */}
            <Select 
              value={project.pipeline_stage || "new"} 
              onValueChange={(v) => updateStageMutation.mutate(v as PipelineStage)} 
              disabled={updateStageMutation.isPending}
            >
              <SelectTrigger className="w-8 h-6 px-1 border-0 bg-transparent">
                <span className="sr-only">Move to...</span>
              </SelectTrigger>
              <SelectContent>
                {getValidTargetStages(project.pipeline_stage).map(stage => (
                  <SelectItem key={stage} value={stage}>
                    {STAGE_CONFIG[stage]?.label || stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
                {/* Pin overlay - pointer-events-none by default so iframe is interactive, enabled when placing pins */}
                <div
                  ref={pinOverlayRef}
                  className={`absolute inset-0 ${pendingCommentMessage ? "cursor-crosshair bg-primary/5 pointer-events-auto" : "pointer-events-none"}`}
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
                      className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer transition-all pointer-events-auto ${
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
        <div className="min-w-0 w-[480px] h-full flex flex-col bg-card">
          <Tabs value={activePanel} onValueChange={(v) => setActivePanel(v as typeof activePanel)} className="h-full min-h-0 flex flex-col">
            <div className="relative flex-shrink-0 mx-2 mt-2 mb-0">
              <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap flex gap-1 rounded-lg bg-muted/50 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TabsTrigger value="overview" className="flex-none text-xs gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Building2 className="h-3 w-3 flex-shrink-0" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="milestones" className="flex-none text-xs gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Target className="h-3 w-3 flex-shrink-0" />
                  Milestones
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex-none text-xs gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <MessageCirclePlus className="h-3 w-3 flex-shrink-0" />
                  Comments
                  {openCount > 0 && <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1">{openCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex-none text-xs gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <MessageSquare className="h-3 w-3 flex-shrink-0" />
                  Chat
                  {messages.length > 0 && <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1">{messages.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="media" className="flex-none text-xs gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <ImageIcon className="h-3 w-3 flex-shrink-0" />
                  Media
                  {media.length > 0 && <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1">{media.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="launch" className="flex-none text-xs gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Rocket className="h-3 w-3 flex-shrink-0" />
                  Launch
                </TabsTrigger>
              </TabsList>
              {/* Scroll hint gradient */}
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-card to-transparent" />
            </div>

            {/* Content wrapper - must fill remaining height */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {/* Overview / Intake + Phase B */}
              <TabsContent value="overview" className="h-full overflow-auto data-[state=inactive]:hidden m-0">
                <div className="divide-y divide-border">
                  {/* Phase 1A - Initial Intake */}
                  <IntakeOverviewPanel 
                    intake={project.intake?.intake_json as Record<string, unknown> | null} 
                    intakeCreatedAt={project.intake?.created_at}
                    intakeStatus={project.intake?.intake_status}
                    onApproveIntake={project.intake?.id ? () => approveIntakeMut.mutate(project.intake!.id) : undefined}
                    isApproving={approveIntakeMut.isPending}
                  />
                </div>
              </TabsContent>

              {/* Milestones */}
              <TabsContent value="milestones" className="h-full overflow-auto data-[state=inactive]:hidden m-0">
                <DeliverablesMilestones 
                  projectToken={project.project_token} 
                  projectStatus={project.status}
                />
              </TabsContent>

              {/* Comments Triage */}
              <TabsContent value="comments" className="h-full flex flex-col data-[state=inactive]:hidden m-0 p-2">
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

                <ScrollArea className="flex-1 min-h-0">
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
                        <CommentCard
                          key={comment.id}
                          comment={comment}
                          index={idx}
                          projectToken={project.project_token}
                          isHighlighted={highlightedPinId === comment.id}
                          onJumpToPin={handleJumpToPin}
                          onResolveToggle={(commentId, resolve) => 
                            resolveCommentMutation.mutate({ commentId, resolve })
                          }
                          isResolving={resolveCommentMutation.isPending}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Chat */}
              <TabsContent value="chat" className="h-full flex flex-col data-[state=inactive]:hidden m-0 p-2">
                <ScrollArea className="flex-1 min-h-0">
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
                        const isSystem = isSystemMessage(msg.content);
                        const isLinkedToComment = linkedMessageIds.has(msg.id);
                        
                        // Render system messages differently
                        if (isSystem) {
                          const parsed = parseSystemMessage(msg.content);
                          return (
                            <div key={msg.id} className="flex justify-center">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border/50 rounded-full text-xs text-muted-foreground">
                                <ArrowRight className="h-3 w-3" />
                                {parsed.type === "stage_change" ? (
                                  <span>
                                    Stage: <span className="font-medium">{STAGE_CONFIG[parsed.from as PipelineStage]?.label || parsed.from}</span>
                                    {" → "}
                                    <span className="font-medium">{STAGE_CONFIG[parsed.to as PipelineStage]?.label || parsed.to}</span>
                                  </span>
                                ) : (
                                  <span>{parsed.text}</span>
                                )}
                                <span className="opacity-60">•</span>
                                <span className="opacity-60">{format(new Date(msg.created_at), "MMM d, h:mm a")}</span>
                              </div>
                            </div>
                          );
                        }
                        
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 flex-shrink-0 mt-1"
                                  title="Jump to pinned comment"
                                  onClick={() => handleJumpFromMessage(msg.id)}
                                >
                                  <MessageSquareDot className="h-3 w-3 text-primary" />
                                </Button>
                              )}
                              <div 
                                className={`rounded-xl px-3 py-2 text-sm ${
                                  isAdmin ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                                } ${isLinkedToComment && !isAdmin ? "cursor-pointer hover:ring-1 hover:ring-primary/30" : ""}`}
                                onClick={isLinkedToComment && !isAdmin ? () => handleJumpFromMessage(msg.id) : undefined}
                              >
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <p className={`text-[10px] mt-1 ${isAdmin ? "opacity-70" : "text-muted-foreground"}`}>
                                  {format(new Date(msg.created_at), "h:mm a")}
                                  {isLinkedToComment && (
                                    <span className="text-primary ml-1 hover:underline">• Pinned ↗</span>
                                  )}
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

              {/* Media */}
              <TabsContent value="media" className="h-full flex flex-col data-[state=inactive]:hidden m-0 p-2">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                
                {/* Upload area */}
                <div
                  className={`flex-shrink-0 mb-2 border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                    isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {uploadMediaMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                      <Upload className="h-5 w-5" />
                      <span>Drop files or click to upload</span>
                    </div>
                  )}
                </div>

                <ScrollArea className="flex-1 min-h-0">
                  {mediaLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : media.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No media yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pr-2">
                      {media.map((item) => (
                        <div key={item.id} className="border border-border rounded-lg overflow-hidden group">
                          {/* Preview */}
                          <div className="aspect-square bg-muted/50 relative">
                            {isImageMime(item.mime_type) && item.signed_url ? (
                              <img 
                                src={item.signed_url} 
                                alt={item.filename}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileIcon className="h-10 w-10 text-muted-foreground" />
                              </div>
                            )}
                            {/* Actions overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              {item.signed_url && (
                                <>
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => window.open(item.signed_url!, "_blank")}
                                    title="Open"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => copyMediaLink(item.signed_url!)}
                                    title="Copy link"
                                  >
                                    <Link2 className="h-3 w-3" />
                                  </Button>
                                  <a href={item.signed_url} download={item.filename}>
                                    <Button
                                      variant="secondary"
                                      size="icon"
                                      className="h-7 w-7"
                                      title="Download"
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </a>
                                </>
                              )}
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => deleteMediaMutation.mutate(item.id)}
                                disabled={deleteMediaMutation.isPending}
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {/* Info */}
                          <div className="p-2">
                            <p className="text-xs font-medium truncate" title={item.filename}>{item.filename}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                {item.source === "intake" ? (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[9px] font-medium">
                                    Intake
                                  </span>
                                ) : (
                                  <span>{item.uploader_type === "client" ? "Client" : "Admin"}</span>
                                )}
                              </span>
                              <span>{formatFileSize(item.size_bytes)}</span>
                            </p>
                            {item.description && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={item.description}>
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Launch Checklist */}
              <TabsContent value="launch" className="h-full overflow-auto data-[state=inactive]:hidden m-0">
                <LaunchChecklist 
                  projectToken={project.project_token} 
                  projectStatus={project.status}
                  onLaunchComplete={() => queryClient.invalidateQueries({ queryKey: ["admin-projects"] })}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
