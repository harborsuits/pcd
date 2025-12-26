import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, CreditCard, AlertCircle, Home, Download, Image as ImageIcon, Upload, Eye, X, LogOut, ChevronDown, Paperclip, Bell, BellOff, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { proxyMediaUrl, isImageType, getFileIcon } from "@/lib/media";
import { WelcomeScreen } from "@/components/portal/WelcomeScreen";
import { ReviewQueue } from "@/components/portal/ReviewQueue";
import { ProjectStatusBanner } from "@/components/portal/ProjectStatusBanner";
import { FloatingChatOrb } from "@/components/portal/FloatingChatOrb";
import { PrototypeViewer, type Prototype, type PrototypeComment } from "@/components/portal/PrototypeViewer";
import { ProjectRoadmap, computeRoadmapSteps } from "@/components/portal/ProjectRoadmap";
import { ClientFileUpload } from "@/components/portal/ClientFileUpload";
import { ClientProgressPanel } from "@/components/portal/ClientProgressPanel";
import { ClientLayout } from "@/components/portal/ClientLayout";
import { BrandCard } from "@/components/portal/BrandCard";

import { PortalAuthPage } from "./PortalAuthPage";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import type { User, Session } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface PortalMessage {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
  read_at: string | null;
  delivered_at: string | null;
}

interface PortalFile {
  id: string;
  file_name: string;
  file_type: string;
  description: string | null;
  created_at: string;
}

interface PortalPayment {
  amount_cents: number;
  payment_type: string;
  status: string;
  created_at: string;
}

interface ReviewItem {
  id: string;
  title: string;
  description: string | null;
  item_type: string;
  item_url: string | null;
  item_content: string | null;
  status: string;
  client_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PortalData {
  business: {
    name: string;
    slug: string;
    status: string;
    final_approved_at: string | null;
  };
  intake_status: 'draft' | 'submitted' | 'approved' | null;
  messages: PortalMessage[];
  files: PortalFile[];
  payments: PortalPayment[];
  review_items: ReviewItem[];
  pagination: {
    messages_limit: number;
    messages_before: string | null;
    has_more_messages: boolean;
  };
}

// Human-friendly status labels
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    lead: "New",
    contacted: "Getting Started",
    interested: "Getting Started",
    client: "In Progress",
    completed: "Complete",
    archived: "Archived",
  };
  return labels[status] || status;
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const label = getStatusLabel(status);
  const isComplete = status === "completed";
  const isActive = status === "client" || status === "interested";
  
  return (
    <Badge 
      variant={isComplete ? "default" : isActive ? "secondary" : "outline"}
      className={isComplete ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
    >
      {label}
    </Badge>
  );
}

export default function PortalPage() {
  const { token } = useParams<{ token: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [businessName, setBusinessName] = useState<string>("");
  const [requiresAuth, setRequiresAuth] = useState<boolean | null>(null);
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<{ name: string; status: 'pending' | 'uploading' | 'done' | 'error'; error?: string }[]>([]);
  const [uploadDesc, setUploadDesc] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; name: string } | null>(null);
  const [imgPreview, setImgPreview] = useState<{ url: string; name: string } | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [teamTyping, setTeamTyping] = useState(false);
  const [showFilesPanel, setShowFilesPanel] = useState(false);
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);
  const [prototypeComments, setPrototypeComments] = useState<PrototypeComment[]>([]);
  const [approvingFinal, setApprovingFinal] = useState(false);
  
  const originalTitle = useRef(document.title);
  const markReadInFlight = useRef(false);
  const markDeliveredInFlight = useRef(false);
  const clearQueueTimeoutRef = useRef<number | null>(null);
  const teamTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Push notifications
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, isLoading: pushLoading, subscribe: subscribePush, unsubscribe: unsubscribePush } = usePushNotifications(token);

  // Compute unread count (admin messages without read_at)
  const unreadCount = useMemo(() => {
    if (!data?.messages) return 0;
    return data.messages.filter(m => m.sender_type === "admin" && !m.read_at).length;
  }, [data?.messages]);

  const playNotify = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.03;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 90);
    } catch {}
  }, []);
  
  // Unlock audio on first user interaction
  useEffect(() => {
    const unlock = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        ctx.resume().finally(() => ctx.close());
      } catch {}
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  // Check auth status
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthChecking(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if this portal requires auth
  useEffect(() => {
    if (!token) return;
    
    const checkPortalAuth = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/portal/${token}/check-auth`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        
        const data = await res.json();
        setRequiresAuth(data.requires_auth ?? false);
        setBusinessName(data.business_name ?? "");
        
        if (!data.requires_auth) {
          fetchPortalData(token);
          markAdminMessagesAsRead(token);
          markAdminMessagesAsDelivered(token);
        }
      } catch (err) {
        console.error("Portal auth check error:", err);
        setRequiresAuth(false);
      }
    };
    
    checkPortalAuth();
  }, [token]);

  // Fetch portal data when auth is confirmed
  useEffect(() => {
    if (!token || requiresAuth === null) return;
    
    if (requiresAuth && user) {
      fetchPortalData(token);
      markAdminMessagesAsRead(token);
      markAdminMessagesAsDelivered(token);
    }
  }, [token, requiresAuth, user]);

  // Fetch prototypes and comments when portal data is loaded
  useEffect(() => {
    if (!token || !data) return;
    fetchPrototypes(token);
  }, [token, data]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out", description: "You've been signed out." });
  };

  const handleAuthSuccess = () => {
    if (token) {
      fetchPortalData(token);
      markAdminMessagesAsRead(token);
      markAdminMessagesAsDelivered(token);
    }
  };

  async function fetchPrototypes(portalToken: string) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${portalToken}/prototypes`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      const response = await res.json();
      if (res.ok && response.prototypes) {
        setPrototypes(response.prototypes);
        // Fetch comments for the first (latest) prototype
        if (response.prototypes.length > 0) {
          fetchComments(portalToken, response.prototypes[0].id);
        }
      }
    } catch (err) {
      console.error("Fetch prototypes error:", err);
    }
  }

  async function fetchComments(portalToken: string, prototypeId?: string) {
    try {
      const url = prototypeId
        ? `${SUPABASE_URL}/functions/v1/portal/${portalToken}/comments?prototype_id=${prototypeId}`
        : `${SUPABASE_URL}/functions/v1/portal/${portalToken}/comments`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      const response = await res.json();
      if (res.ok && response.comments) {
        setPrototypeComments(response.comments);
      }
    } catch (err) {
      console.error("Fetch comments error:", err);
    }
  }

  async function handleAddComment(body: string, pinX: number, pinY: number) {
    if (!token || prototypes.length === 0) return;

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/portal/${token}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "create",
          prototype_id: prototypes[0].id,
          body,
          pin_x: pinX,
          pin_y: pinY,
          author_type: "client",
        }),
      }
    );

    const response = await res.json();
    if (res.ok && response.comment) {
      setPrototypeComments((prev) => [...prev, response.comment]);
      toast({ title: "Comment added", description: "Your feedback has been saved." });
    }
  }

  async function handleResolveComment(commentId: string) {
    if (!token) return;

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/portal/${token}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "resolve",
          comment_id: commentId,
        }),
      }
    );

    if (res.ok) {
      setPrototypeComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, resolved_at: new Date().toISOString() } : c
        )
      );
    }
  }

  async function handleUnresolveComment(commentId: string) {
    if (!token) return;

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/portal/${token}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "unresolve",
          comment_id: commentId,
        }),
      }
    );

    if (res.ok) {
      setPrototypeComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, resolved_at: null } : c))
      );
    }
  }

  function handleRefreshPrototype() {
    if (token) {
      fetchPrototypes(token);
    }
  }

  // Handle client final approval
  async function handleApproveFinal() {
    if (!token || approvingFinal) return;
    
    setApprovingFinal(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/approve-final`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      const response = await res.json();
      if (res.ok && response.ok) {
        toast({ 
          title: "Final version approved!", 
          description: "Thank you for your approval. We'll proceed with launch preparations." 
        });
        // Update local state
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            business: {
              ...prev.business,
              final_approved_at: response.final_approved_at,
            },
          };
        });
      } else {
        toast({ 
          title: "Approval failed", 
          description: response.error || "Please try again.",
          variant: "destructive" 
        });
      }
    } catch (err) {
      console.error("Approve final error:", err);
      toast({ title: "Error", description: "Could not approve. Please try again.", variant: "destructive" });
    } finally {
      setApprovingFinal(false);
    }
  }

  // Real-time subscription for new messages and read receipt updates
  useEffect(() => {
    if (!token || !data) return;

    console.log("📡 Setting up realtime subscription for portal:", token.slice(0, 8) + "...");

    const channel = supabase
      .channel(`portal-messages-${token}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_token=eq.${token}`,
        },
        (payload) => {
          console.log("📨 New message received:", payload);
          const newMsg = payload.new as {
            id: string;
            content: string;
            sender_type: string;
            created_at: string;
            read_at: string | null;
          };

          setData((prev) => {
            if (!prev) return prev;

            const exists = prev.messages.some((m) => m.id === newMsg.id);
            if (exists) {
              console.log("⚠️ Duplicate message ignored");
              return prev;
            }

            console.log("✅ Adding new message to state");
            
            if (newMsg.sender_type === "admin") {
              playNotify();
              toast({
                title: "New message from Team",
                description: newMsg.content.slice(0, 50) + (newMsg.content.length > 50 ? "..." : ""),
              });
              const businessName = data?.business?.name || "Portal";
              document.title = `(1) New message — ${businessName}`;
              setTimeout(() => {
                document.title = originalTitle.current;
              }, 5000);
              markAdminMessagesAsRead(token);
            }

            return {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: newMsg.id,
                  content: newMsg.content,
                  sender_type: newMsg.sender_type,
                  created_at: newMsg.created_at,
                  read_at: newMsg.read_at,
                  delivered_at: newMsg.sender_type === "admin" ? new Date().toISOString() : null,
                },
              ],
            };
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `project_token=eq.${token}`,
        },
        (payload) => {
          console.log("📖 Message updated (read receipt):", payload);
          const updatedMsg = payload.new as {
            id: string;
            read_at: string | null;
          };

          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === updatedMsg.id ? { ...m, read_at: updatedMsg.read_at } : m
              ),
            };
          });
        }
      )
      .subscribe((status) => {
        console.log("📡 Portal subscription status:", status);
      });

    return () => {
      console.log("🔌 Cleaning up portal realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [token, data?.business.name]);

  // Typing indicator channel
  const typingChannel = useMemo(() => {
    if (!token) return null;
    return supabase.channel(`typing-${token}`);
  }, [token]);

  // Subscribe to typing events
  useEffect(() => {
    if (!typingChannel) return;

    typingChannel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.who !== "admin") return;

        setTeamTyping(!!payload.isTyping);

        if (teamTypingTimeoutRef.current) clearTimeout(teamTypingTimeoutRef.current);
        teamTypingTimeoutRef.current = setTimeout(() => setTeamTyping(false), 2000);
      })
      .subscribe((status) => {
        console.log("📡 Typing channel status:", status);
      });

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
      payload: { who: "client", isTyping, at: Date.now() },
    });
  }, [typingChannel]);

  const handleTyping = useCallback((value: string) => {
    if (value.trim()) {
      emitTyping(true);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(false);
      }, 1200);
    }
  }, [emitTyping]);

  async function fetchPortalData(portalToken: string, messagesBefore?: string) {
    try {
      if (!messagesBefore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({ messages_limit: "50" });
      if (messagesBefore) {
        params.set("messages_before", messagesBefore);
      }

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${portalToken}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      const response = await res.json();

      if (!res.ok) {
        console.error("Portal fetch error:", response.error);
        setError("Portal not found");
        return;
      }

      if (response?.error) {
        console.error("Portal API error:", response.error);
        setError(response.error);
        return;
      }

      if (messagesBefore) {
        setData((prev) => {
          if (!prev) return response;
          return {
            ...response,
            messages: [...response.messages, ...prev.messages],
          };
        });
      } else {
        setData(response);
        
        const isFirstVisit = !localStorage.getItem(`portal_visited_${portalToken}`);
        if (isFirstVisit && response.messages.length === 0 && response.files.length === 0) {
          setShowWelcome(true);
          localStorage.setItem(`portal_visited_${portalToken}`, "true");
        }
      }
    } catch (err) {
      console.error("Portal fetch exception:", err);
      setError("Failed to load portal");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  async function markAdminMessagesAsRead(portalToken: string) {
    if (markReadInFlight.current) return;
    markReadInFlight.current = true;

    try {
      console.log("📖 Marking admin messages as read...");
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/messages/${portalToken}/mark-read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      const response = await res.json();

      if (!res.ok) {
        console.error("Mark read error:", response.error);
        return;
      }

      if (response?.marked_count > 0) {
        console.log(`Marked ${response.marked_count} admin messages as read`);
      }
    } catch (err) {
      console.error("Mark read exception:", err);
    } finally {
      markReadInFlight.current = false;
    }
  }

  async function markAdminMessagesAsDelivered(portalToken: string) {
    if (markDeliveredInFlight.current) return;
    markDeliveredInFlight.current = true;

    try {
      console.log("📬 Marking admin messages as delivered...");
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${portalToken}/mark-delivered`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      const response = await res.json();

      if (!res.ok) {
        console.error("Mark delivered error:", response.error);
        return;
      }

      if (response?.marked_count > 0) {
        console.log(`Marked ${response.marked_count} admin messages as delivered`);
      }
    } catch (err) {
      console.error("Mark delivered exception:", err);
    } finally {
      markDeliveredInFlight.current = false;
    }
  }

  function handleLoadOlderMessages() {
    if (!token || !data || data.messages.length === 0) return;
    const oldestMessage = data.messages[0];
    fetchPortalData(token, oldestMessage.created_at);
  }

  async function handleSendMessage(content: string) {
    if (!token || !content.trim()) return;

    setSending(true);
    setSendError(null);

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/messages/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ content: content.trim() }),
        }
      );

      const response = await res.json();

      if (!res.ok) {
        console.error("Send message error:", response.error);
        setSendError("Failed to send message");
        return;
      }

      if (response?.error) {
        console.error("Send message API error:", response.error);
        setSendError(response.error);
        return;
      }

      toast({
        title: "Message sent",
        description: "Your message has been delivered.",
      });

      if (response?.message) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: response.message.id,
                content: response.message.content,
                sender_type: response.message.sender_type,
                created_at: response.message.created_at,
                read_at: response.message.read_at,
                delivered_at: null,
              },
            ],
          };
        });
      }
    } catch (err) {
      console.error("Send message exception:", err);
      setSendError("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function handleFileUpload(file: File): Promise<boolean> {
    if (!token) return false;

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (uploadDesc.trim()) fd.append("description", uploadDesc.trim());

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/files/${encodeURIComponent(token)}/upload`,
        {
          method: "POST",
          body: fd,
        }
      );

      const response = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Upload error:", response.error);
        throw new Error(response.error || "Upload failed");
      }

      if (response?.file) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            files: [response.file, ...prev.files],
          };
        });
      }

      return true;
    } catch (err: any) {
      console.error("Upload exception:", err);
      throw err;
    }
  }

  async function handleMultiFileUpload(files: FileList | File[]) {
    if (!token || files.length === 0) return;
    
    const fileArray = Array.from(files);
    
    setUploadQueue(fileArray.map(f => ({ name: f.name, status: 'pending' })));
    setUploading(true);

    let successCount = 0;
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      
      setUploadQueue(prev => prev.map((item, idx) => 
        idx === i ? { ...item, status: 'uploading' } : item
      ));

      try {
        await handleFileUpload(file);
        successCount++;
        
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'done' } : item
        ));
      } catch (err: any) {
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'error', error: err.message } : item
        ));
      }
    }

    if (successCount > 0) {
      toast({
        title: successCount === fileArray.length 
          ? `${successCount} file${successCount > 1 ? 's' : ''} uploaded`
          : `${successCount}/${fileArray.length} files uploaded`,
        description: successCount < fileArray.length 
          ? "Some files failed to upload" 
          : undefined,
      });
    } else {
      toast({
        title: "Upload failed",
        description: `All ${fileArray.length} file(s) failed to upload.`,
        variant: "destructive",
      });
    }

    setUploadDesc("");
    setUploading(false);
    
    if (clearQueueTimeoutRef.current) {
      window.clearTimeout(clearQueueTimeoutRef.current);
    }
    clearQueueTimeoutRef.current = window.setTimeout(() => {
      setUploadQueue([]);
      clearQueueTimeoutRef.current = null;
    }, 3000);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragging(true);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (uploading) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleMultiFileUpload(files);
    }
  }

  function isPdf(fileType: string): boolean {
    return fileType.toLowerCase() === "application/pdf";
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatCurrency(cents: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  }

  // Show loading while checking auth
  if (authChecking || requiresAuth === null) {
    return (
      <ClientLayout maxWidth="md" centered>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ClientLayout>
    );
  }

  // If auth is required and user is not logged in, show auth page
  if (requiresAuth && !user) {
    return (
      <PortalAuthPage
        projectToken={token!}
        businessName={businessName || "Project"}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  if (loading) {
    return (
      <ClientLayout maxWidth="md" centered>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ClientLayout>
    );
  }

  if (error || !data) {
    return (
      <ClientLayout maxWidth="md" centered>
        <BrandCard className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="font-serif text-xl font-bold mb-2">Portal Not Found</h2>
          <p className="text-muted-foreground">{error || "Invalid or expired portal link"}</p>
        </BrandCard>
      </ClientLayout>
    );
  }

  // Handler for when a review item is updated
  const handleReviewItemUpdated = (itemId: string, newStatus: string, notes?: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        review_items: prev.review_items.map((item) =>
          item.id === itemId
            ? { ...item, status: newStatus, client_notes: notes || item.client_notes }
            : item
        ),
      };
    });
  };

  return (
    <ClientLayout
      title={
        <div className="flex items-center gap-3">
          <span>{data.business.name}</span>
          <StatusBadge status={data.business.status} />
        </div>
      }
      subtitle="Your Project Workspace"
      maxWidth="4xl"
      rightSlot={
        <div className="flex items-center gap-2">
          {user && (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/portal">My Portals</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </Button>
            </>
          )}
          {pushSupported && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (pushSubscribed) {
                  const ok = await unsubscribePush();
                  if (ok) toast({ title: "Notifications disabled" });
                } else {
                  const ok = await subscribePush();
                  if (ok) {
                    toast({ title: "Notifications enabled", description: "You'll be notified when you receive a message." });
                  } else {
                    toast({ title: "Could not enable notifications", description: "Please allow notifications in your browser settings.", variant: "destructive" });
                  }
                }
              }}
              disabled={pushLoading}
              title={pushSubscribed ? "Disable notifications" : "Enable notifications"}
            >
              {pushLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : pushSubscribed ? (
                <Bell className="h-4 w-4 text-accent" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      }
    >
      {/* Welcome Screen */}
      {showWelcome && data && (
        <WelcomeScreen 
          businessName={data.business.name} 
          onDismiss={() => setShowWelcome(false)} 
        />
      )}

      {/* Main Content */}
      <div className="space-y-6 pb-24">

        {/* Project Roadmap */}
        <BrandCard variant="muted">
          <ProjectRoadmap 
            steps={computeRoadmapSteps({
              intakeStatus: data.intake_status ?? undefined,
              hasPrototype: prototypes.length > 0,
              openCommentsCount: prototypeComments.filter(c => !c.resolved_at).length,
              resolvedCommentsCount: prototypeComments.filter(c => c.resolved_at).length,
              projectStatus: data.business.status,
              prototypeUrl: prototypes[0]?.url,
              finalApprovedAt: data.business.final_approved_at,
              onApproveFinal: handleApproveFinal,
            })}
          />
        </BrandCard>

        {/* Client Progress Panel */}
        <BrandCard>
          <ClientProgressPanel token={token!} />
        </BrandCard>

        {/* Prototype Viewer */}
        {prototypes.length > 0 && (
          <BrandCard noPadding>
            <PrototypeViewer
              prototype={prototypes[0]}
              comments={prototypeComments}
              token={token!}
              onAddComment={handleAddComment}
              onResolveComment={handleResolveComment}
              onUnresolveComment={handleUnresolveComment}
              onRefresh={handleRefreshPrototype}
            />
          </BrandCard>
        )}

        {/* Review Queue - Show above files if there are pending items */}
        {data.review_items && data.review_items.length > 0 && (
          <BrandCard>
            <ReviewQueue 
              items={data.review_items} 
              token={token!} 
              onItemUpdated={handleReviewItemUpdated}
            />
          </BrandCard>
        )}

        {/* Files Section - Categorized Upload */}
        <BrandCard>
          <ClientFileUpload
            token={token!}
            files={data.files}
            onFileUploaded={(file) => {
              setData((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  files: [file, ...prev.files],
                };
              });
            }}
            onPreviewImage={(url, name) => setImgPreview({ url, name })}
            onPreviewPdf={(url, name) => setPdfPreview({ url, name })}
          />
        </BrandCard>

        {/* Payments Section - Show if there are payments */}
        {data.payments.length > 0 && (
          <BrandCard>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-serif font-bold">Payments</h2>
              <Badge variant="secondary" className="text-xs">
                {data.payments.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {data.payments.map((payment, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{formatCurrency(payment.amount_cents)}</p>
                    <p className="text-xs text-muted-foreground">{payment.payment_type}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        payment.status === "completed"
                          ? "default"
                          : payment.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {payment.status}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </BrandCard>
        )}
      </div>

      {/* Floating Chat Orb */}
      <FloatingChatOrb
        messages={data.messages}
        onSendMessage={handleSendMessage}
        sending={sending}
        sendError={sendError}
        teamTyping={teamTyping}
        onTyping={handleTyping}
        hasMoreMessages={data.pagination.has_more_messages}
        loadingMore={loadingMore}
        onLoadMore={handleLoadOlderMessages}
        unreadCount={unreadCount}
      />

      {/* PDF Preview Modal */}
      {pdfPreview && (
        <div 
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPdfPreview(null)}
        >
          <div 
            className="bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold truncate">{pdfPreview.name}</h3>
              <button
                onClick={() => setPdfPreview(null)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 p-4">
              <iframe
                src={pdfPreview.url}
                title={pdfPreview.name}
                className="w-full h-[70vh] rounded border border-border"
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {imgPreview && (
        <div 
          className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setImgPreview(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 bg-card/80 backdrop-blur-sm rounded-t-lg border border-border">
              <h3 className="font-semibold truncate text-sm">{imgPreview.name}</h3>
              <button
                onClick={() => setImgPreview(null)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 bg-card/50 rounded-b-lg border border-t-0 border-border p-2">
              <img
                src={imgPreview.url}
                alt={imgPreview.name}
                className="max-w-full max-h-[75vh] object-contain mx-auto rounded"
              />
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}
