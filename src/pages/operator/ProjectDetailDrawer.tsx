import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminFetch } from "@/lib/adminFetch";
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
  Link, Plus, Eye, MessageCirclePlus, X, MessageSquareDot,
  ChevronRight, ChevronLeft, Hammer, Bot, Power, AlertTriangle,
  Image as ImageIcon, Download, File, DollarSign
} from "lucide-react";
import { ServiceTypeBadge } from "@/components/operator/StageBadge";
import { IntakeSummary } from "@/components/intake/IntakeSummary";
import { BillingTab } from "@/components/operator/billing/BillingTab";
import { toast } from "sonner";
import { format } from "date-fns";

// SUPABASE_URL is still needed for files endpoint that uses different auth
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
  portal_stage?: string;
  service_type?: string;
  ai_trial_status?: string;
  ulio_business_id?: string | null;
  ulio_setup_url?: string | null;
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
  client_account_id?: string | null;
  client_account?: {
    id: string;
    stripe_customer_id: string | null;
  } | null;
}

const AI_STATUS_OPTIONS = [
  { value: "inactive", label: "Inactive", color: "text-muted-foreground" },
  { value: "setup_needed", label: "Setup Needed", color: "text-yellow-600" },
  { value: "trial", label: "Trial", color: "text-blue-600" },
  { value: "live", label: "Live", color: "text-green-600" },
  { value: "paused", label: "Paused", color: "text-orange-600" },
  { value: "canceled", label: "Canceled", color: "text-red-600" },
];

const PORTAL_STAGE_OPTIONS = [
  { value: "intake", label: "Intake" },
  { value: "build", label: "Build" },
  { value: "preview", label: "First Preview" },
  { value: "revisions", label: "Revisions" },
  { value: "final", label: "Final Approval" },
  { value: "launched", label: "Launched" },
];

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

interface PrototypeComment {
  id: string;
  source_message_id: string | null;
  body: string;
  pin_x: number | null;
  pin_y: number | null;
  resolved_at: string | null;
}

interface ProjectFile {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  description: string | null;
  created_at: string;
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
  const [activeTab, setActiveTab] = useState<"intake" | "messages" | "notes" | "checklist" | "prototype" | "ulio" | "billing">("intake");
  const [ulioBusinessId, setUlioBusinessId] = useState("");
  const [ulioSetupUrl, setUlioSetupUrl] = useState("");
  const [clientTyping, setClientTyping] = useState(false);
  const [newPrototypeUrl, setNewPrototypeUrl] = useState("");
  const [newPrototypeVersion, setNewPrototypeVersion] = useState("");
  // "Turn into comment" state
  const [pendingCommentMessage, setPendingCommentMessage] = useState<Message | null>(null);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
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

  // Ensure Stripe customer exists for billing readiness
  const ensureCustomerMutation = useMutation({
    mutationFn: async ({ projectToken, email, name, phone }: { 
      projectToken: string; 
      email: string; 
      name?: string; 
      phone?: string; 
    }) => {
      const res = await adminFetch("/billing/ensure-customer", {
        method: "POST",
        body: JSON.stringify({ 
          project_token: projectToken, 
          email, 
          name, 
          phone 
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to ensure customer");
      }
      return res.json();
    },
    onSuccess: (data) => {
      console.log("[Billing] Customer ready:", data);
    },
    onError: (error: Error) => {
      console.warn("[Billing] ensure-customer failed:", error.message);
    },
  });

  // Reset state when project changes + ensure billing customer
  useEffect(() => {
    if (project) {
      setReplyContent("");
      setNewNote("");
      setNewChecklistItem("");
      setActiveTab(project.intake ? "intake" : "messages");
      setClientTyping(false);
      
      // Ensure Stripe customer is ready for billing (only if we have an email)
      if (project.contact_email && !ensureCustomerMutation.isPending) {
        ensureCustomerMutation.mutate({
          projectToken: project.project_token,
          email: project.contact_email,
          name: project.contact_name || undefined,
          phone: project.contact_phone || undefined,
        });
      }
    }
  }, [project?.id]);

  // Mark messages as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await adminFetch("/admin/messages/mark-read", {
        method: "POST",
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
      const res = await adminFetch(`/messages/${project.project_token}`);
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
      const res = await adminFetch(`/admin/notes/${project.project_token}`);
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
      const res = await adminFetch(`/admin/checklist/${project.project_token}`);
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
      const res = await adminFetch(`/admin/prototypes/${project.project_token}`);
      if (!res.ok) throw new Error("Failed to fetch prototypes");
      return res.json() as Promise<{ prototypes: Prototype[] }>;
    },
    enabled: !!project && open,
  });

  // Fetch comments (to track which messages have been linked)
  const { data: commentsData } = useQuery({
    queryKey: ["project-comments", project?.project_token],
    queryFn: async () => {
      if (!project) return { comments: [] };
      const res = await adminFetch(`/admin/comments/${project.project_token}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json() as Promise<{ comments: PrototypeComment[] }>;
    },
    enabled: !!project && open,
  });

  // Fetch project files with signed URLs via edge function
  const { data: filesData, isLoading: filesLoading } = useQuery({
    queryKey: ["project-files", project?.project_token],
    queryFn: async () => {
      if (!project?.project_token) return [];
      
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn("No session for files list");
        return [];
      }
      
      const res = await fetch(`${SUPABASE_URL}/functions/v1/files/${project.project_token}/list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Files list error:", err);
        return [];
      }
      
      const { files } = await res.json();
      return files as (ProjectFile & { signed_url: string | null })[];
    },
    enabled: !!project?.project_token && open,
    staleTime: 5 * 60 * 1000, // 5 minutes - signed URLs last 1 hour
  });

  const projectFiles = filesData || [];

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!project) throw new Error("No project");
      const res = await adminFetch(`/admin/projects/${project.project_token}/status`, {
        method: "PATCH",
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

  // Update portal stage mutation
  const updatePortalStageMutation = useMutation({
    mutationFn: async ({ stage, reason }: { stage: string; reason?: string }) => {
      if (!project) throw new Error("No project");
      const res = await adminFetch(`/admin/projects/${project.project_token}/portal-stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage, reason }),
      });
      if (!res.ok) throw new Error("Failed to update portal stage");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Portal stage updated");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      onStatusChange();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update AI trial status mutation
  const updateAiStatusMutation = useMutation({
    mutationFn: async ({ status, ulioBusinessId, ulioSetupUrl }: { status: string; ulioBusinessId?: string; ulioSetupUrl?: string }) => {
      if (!project) throw new Error("No project");
      const res = await adminFetch(`/admin/projects/${project.project_token}/ai-status`, {
        method: "PATCH",
        body: JSON.stringify({ 
          ai_trial_status: status,
          ulio_business_id: ulioBusinessId,
          ulio_setup_url: ulioSetupUrl,
        }),
      });
      if (!res.ok) throw new Error("Failed to update AI status");
      return res.json();
    },
    onSuccess: () => {
      toast.success("AI status updated");
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
      const res = await adminFetch(`/admin/notes/${project.project_token}`, {
        method: "POST",
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
      const res = await adminFetch(`/admin/notes/${project.project_token}/${noteId}`, {
        method: "DELETE",
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
      const res = await adminFetch(`/admin/checklist/${project.project_token}`, {
        method: "POST",
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
      const res = await adminFetch(`/admin/checklist/${project.project_token}/${itemId}`, {
        method: "PATCH",
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
      const res = await adminFetch(`/admin/checklist/${project.project_token}/${itemId}`, {
        method: "DELETE",
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
      const res = await adminFetch(`/admin/checklist/${project.project_token}/defaults`, {
        method: "POST",
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
      const res = await adminFetch(`/admin/prototypes/${project.project_token}/${prototypeId}`, {
        method: "PATCH",
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
      const res = await adminFetch(`/admin/prototypes/${project.project_token}/${prototypeId}`, {
        method: "DELETE",
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

  // Create comment mutation (for "Turn into comment" feature)
  const createCommentMutation = useMutation({
    mutationFn: async ({ prototypeId, body, pinX, pinY, sourceMessageId }: { 
      prototypeId: string; 
      body: string; 
      pinX: number; 
      pinY: number; 
      sourceMessageId: string;
    }) => {
      if (!project) throw new Error("No project");
      const res = await adminFetch(`/admin/comments/${project.project_token}`, {
        method: "POST",
        body: JSON.stringify({
          prototype_id: prototypeId,
          body,
          pin_x: pinX,
          pin_y: pinY,
          source_message_id: sourceMessageId,
        }),
      });
      if (!res.ok) throw new Error("Failed to create comment");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Comment created from message");
      setPendingCommentMessage(null);
      setPendingPin(null);
      queryClient.invalidateQueries({ queryKey: ["project-comments", project?.project_token] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const messages = messagesData?.messages || [];
  const notes = notesData?.notes || [];
  const checklistItems = checklistData?.items || [];
  const prototypes = prototypesData?.prototypes || [];
  const comments = commentsData?.comments || [];

  // Set of message IDs that have been linked to comments
  const linkedMessageIds = useMemo(() => {
    const ids = new Set<string>();
    comments.forEach((c) => {
      if (c.source_message_id) ids.add(c.source_message_id);
    });
    return ids;
  }, [comments]);

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
              <SheetTitle className="text-xl flex items-center gap-2">
                {project.business_name}
                <ServiceTypeBadge serviceType={project.service_type} />
              </SheetTitle>
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

        {/* Portal Stage Control */}
        <div className="flex-shrink-0 py-3 border-b">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Hammer className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Portal Stage:</span>
            </div>
            <div className="flex items-center gap-1">
              <Select 
                value={project.portal_stage || "intake"} 
                onValueChange={(v) => updatePortalStageMutation.mutate({ stage: v })}
                disabled={updatePortalStageMutation.isPending}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PORTAL_STAGE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Quick advance/back buttons */}
              {project.portal_stage && project.portal_stage !== "launched" && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  title="Advance stage"
                  disabled={updatePortalStageMutation.isPending}
                  onClick={() => {
                    const currentIdx = PORTAL_STAGE_OPTIONS.findIndex(o => o.value === project.portal_stage);
                    if (currentIdx < PORTAL_STAGE_OPTIONS.length - 1) {
                      updatePortalStageMutation.mutate({ stage: PORTAL_STAGE_OPTIONS[currentIdx + 1].value });
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              {project.portal_stage && project.portal_stage !== "intake" && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  title="Move back"
                  disabled={updatePortalStageMutation.isPending}
                  onClick={() => {
                    const currentIdx = PORTAL_STAGE_OPTIONS.findIndex(o => o.value === project.portal_stage);
                    if (currentIdx > 0) {
                      const reason = prompt("Reason for moving back (optional):");
                      updatePortalStageMutation.mutate({ 
                        stage: PORTAL_STAGE_OPTIONS[currentIdx - 1].value,
                        reason: reason || undefined
                      });
                    }
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

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
          <TabsList className="flex-shrink-0 w-full grid grid-cols-7">
            <TabsTrigger value="intake" className="gap-1 text-xs px-1">
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">Intake</span>
              {project.intake && <CheckCircle className="h-2.5 w-2.5 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="ulio" className="gap-1 text-xs px-1">
              <Bot className="h-3 w-3" />
              <span className="hidden sm:inline">AI</span>
              {(project.service_type === "ai_receptionist" || project.service_type === "both") && (
                <Badge 
                  variant="secondary" 
                  className={`text-[10px] px-1 py-0 ${
                    project.ai_trial_status === "live" ? "bg-green-500/10 text-green-600" :
                    project.ai_trial_status === "paused" ? "bg-orange-500/10 text-orange-600" :
                    ""
                  }`}
                >
                  {project.ai_trial_status || "–"}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="prototype" className="gap-1 text-xs px-1">
              <Link className="h-3 w-3" />
              <span className="hidden sm:inline">Proto</span>
              {prototypes.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">{prototypes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-1 text-xs px-1">
              <DollarSign className="h-3 w-3" />
              <span className="hidden sm:inline">Billing</span>
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
                <IntakeSummary
                  serviceType={project.service_type}
                  intake={intake}
                  basics={{
                    businessName: project.business_name,
                    yourName: project.contact_name || undefined,
                    email: project.contact_email || undefined,
                    phone: project.contact_phone || undefined,
                  }}
                />
              )}

              {/* Uploaded Files Section */}
              {projectFiles.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium flex items-center gap-2 text-sm mb-3">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Uploaded Files ({projectFiles.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {projectFiles.map((file) => {
                      const isImage = file.file_type.startsWith("image/");
                      const isPdf = file.file_type === "application/pdf";
                      // Extract category from description if present (format: "[Category] filename")
                      const categoryMatch = file.description?.match(/^\[([^\]]+)\]/);
                      const category = categoryMatch?.[1];
                      
                      // Use signed URL from edge function
                      const fileUrl = (file as { signed_url?: string | null }).signed_url;
                      
                      if (!fileUrl) {
                        // No signed URL available - show disabled state
                        return (
                          <div
                            key={file.id}
                            className="border rounded-lg p-2 opacity-50 flex items-center gap-2"
                          >
                            <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center flex-shrink-0">
                              {isImage ? (
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              ) : isPdf ? (
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <File className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{file.file_name}</p>
                              <p className="text-[10px] text-muted-foreground">Unavailable</p>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <a
                          key={file.id}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group border rounded-lg p-2 hover:border-primary/50 transition-colors flex items-center gap-2"
                        >
                          <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {isImage ? (
                              <img 
                                src={fileUrl} 
                                alt={file.file_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to icon if image fails to load
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            {isImage ? (
                              <ImageIcon className="h-5 w-5 text-muted-foreground hidden" />
                            ) : isPdf ? (
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <File className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate group-hover:text-primary">
                              {file.file_name}
                            </p>
                            {category && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 mt-0.5">
                                {category}
                              </Badge>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(file.created_at), "MMM d")}
                            </p>
                          </div>
                          <Download className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Loading state for files */}
              {filesLoading && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading files...
                  </div>
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
                    const isLinkedToComment = linkedMessageIds.has(msg.id);
                    
                    const getStatus = () => {
                      if (msg.read_at) return `Seen ${format(new Date(msg.read_at), "h:mm a")}`;
                      return "Sent";
                    };
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex group ${isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        <div className="flex items-start gap-1">
                          {/* Turn into comment button - only for client messages when prototypes exist & not already linked */}
                          {!isAdmin && prototypes.length > 0 && !isLinkedToComment && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
                              title="Turn into comment"
                              onClick={() => {
                                setPendingCommentMessage(msg);
                                setActiveTab("prototype");
                              }}
                            >
                              <MessageCirclePlus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {/* Linked to comment indicator */}
                          {!isAdmin && isLinkedToComment && (
                            <div 
                              className="h-6 w-6 flex items-center justify-center flex-shrink-0 mt-1"
                              title="Linked to prototype comment"
                            >
                              <MessageSquareDot className="h-3.5 w-3.5 text-primary" />
                            </div>
                          )}
                          <div className={`max-w-[78%] rounded-2xl px-4 py-2 ${
                            isAdmin 
                              ? "bg-primary text-primary-foreground rounded-br-md" 
                              : isLinkedToComment
                                ? "bg-muted rounded-bl-md ring-1 ring-primary/30"
                                : "bg-muted rounded-bl-md"
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <div className={`mt-1 flex items-center gap-2 text-[11px] ${
                              isAdmin ? "opacity-80 justify-end" : "text-muted-foreground justify-start"
                            }`}>
                              <span>{format(new Date(msg.created_at), "h:mm a")}</span>
                              {isLinkedToComment && (
                                <span className="text-primary">• Pinned</span>
                              )}
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

          {/* Billing Tab */}
          <TabsContent value="billing" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full pr-4">
              <BillingTab
                projectId={project.id}
                projectToken={project.project_token}
                clientAccountId={project.client_account_id || null}
                stripeCustomerId={project.client_account?.stripe_customer_id || null}
                contactEmail={project.contact_email}
                contactName={project.contact_name}
              />
            </ScrollArea>
          </TabsContent>

          {/* Prototype Tab */}
          <TabsContent value="prototype" className="flex-1 overflow-hidden mt-4">
            <div className="h-full flex flex-col">
              {/* Pin picker mode banner */}
              {pendingCommentMessage && (
                <div className="flex-shrink-0 bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-3">
                    <MessageCirclePlus className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Turn message into comment</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        "{pendingCommentMessage.content}"
                      </p>
                      {prototypes.length > 0 && !pendingPin && (
                        <p className="text-xs text-primary mt-2">
                          Click on the prototype preview below to place a pin
                        </p>
                      )}
                      {pendingPin && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              if (prototypes[0] && pendingPin) {
                                createCommentMutation.mutate({
                                  prototypeId: prototypes[0].id,
                                  body: pendingCommentMessage.content,
                                  pinX: pendingPin.x,
                                  pinY: pendingPin.y,
                                  sourceMessageId: pendingCommentMessage.id,
                                });
                              }
                            }}
                            disabled={createCommentMutation.isPending}
                          >
                            {createCommentMutation.isPending ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            Create Comment
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPendingPin(null)}
                          >
                            Move Pin
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => {
                        setPendingCommentMessage(null);
                        setPendingPin(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Prototype preview with pin picker (only when in pin mode and has prototypes) */}
              {pendingCommentMessage && prototypes.length > 0 && (
                <div className="flex-shrink-0 mb-4 relative rounded-lg overflow-hidden border border-border">
                  <iframe
                    src={prototypes[0].url}
                    className="w-full h-48 border-0 pointer-events-none"
                    title="Prototype preview for pinning"
                  />
                  {/* Pin overlay */}
                  <div
                    ref={pinOverlayRef}
                    className="absolute inset-0 cursor-crosshair bg-transparent hover:bg-primary/5 transition-colors"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setPendingPin({ x, y });
                    }}
                  >
                    {/* Show pending pin */}
                    {pendingPin && (
                      <div
                        className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg animate-pulse"
                        style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
                      >
                        <MessageCirclePlus className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Add new prototype form - hide when in pin mode */}
              {!pendingCommentMessage && (
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
              )}

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
                    {pendingCommentMessage && (
                      <p className="text-xs text-destructive mt-2">
                        Add a prototype first to pin the comment
                      </p>
                    )}
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

          {/* Ulio / AI Receptionist Tab */}
          <TabsContent value="ulio" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                {/* Service Type */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Service Type</div>
                  <div className="font-medium capitalize">
                    {project.service_type === "both" ? "Website + AI Receptionist" : 
                     project.service_type === "ai_receptionist" ? "AI Receptionist Only" : 
                     "Website Only"}
                  </div>
                </div>

                {(project.service_type === "ai_receptionist" || project.service_type === "both") ? (
                  <>
                    {/* AI Status */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        AI Status
                      </label>
                      <Select
                        value={project.ai_trial_status || "inactive"}
                        onValueChange={(v) => updateAiStatusMutation.mutate({ status: v })}
                        disabled={updateAiStatusMutation.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className={opt.color}>{opt.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Kill Switch */}
                    {(project.ai_trial_status === "live" || project.ai_trial_status === "trial") && (
                      <Button
                        variant="destructive"
                        className="w-full gap-2"
                        onClick={() => {
                          if (confirm("Pause AI receptionist for this client?")) {
                            updateAiStatusMutation.mutate({ status: "paused" });
                          }
                        }}
                        disabled={updateAiStatusMutation.isPending}
                      >
                        <Power className="h-4 w-4" />
                        Kill Switch (Pause AI)
                      </Button>
                    )}

                    {/* Ulio Setup URL */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ulio Setup URL</label>
                      <Input
                        placeholder="https://app.ulio.io/partner/businesses/..."
                        defaultValue={project.ulio_setup_url || ""}
                        onBlur={(e) => {
                          if (e.target.value !== project.ulio_setup_url) {
                            updateAiStatusMutation.mutate({ 
                              status: project.ai_trial_status || "inactive",
                              ulioSetupUrl: e.target.value 
                            });
                          }
                        }}
                      />
                    </div>

                    {/* Open Ulio Button */}
                    {project.ulio_setup_url && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => window.open(project.ulio_setup_url!, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Ulio Dashboard
                      </Button>
                    )}

                    {/* Ulio Business ID */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Ulio Business ID</label>
                      <Input
                        placeholder="UUID from Ulio"
                        defaultValue={project.ulio_business_id || ""}
                        onBlur={(e) => {
                          if (e.target.value !== project.ulio_business_id) {
                            updateAiStatusMutation.mutate({ 
                              status: project.ai_trial_status || "inactive",
                              ulioBusinessId: e.target.value 
                            });
                          }
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>AI Receptionist not included</p>
                    <p className="text-sm mt-1">Client selected website only</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
