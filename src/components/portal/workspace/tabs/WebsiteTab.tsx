import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Clock, ExternalLink, RefreshCw, Camera, Upload, Loader2, X, Send, Paperclip, Check, CircleDot, MessageCircle, CornerDownRight, MessageSquare, ChevronDown, WifiOff } from "lucide-react";
import { portalSupabase } from "@/integrations/supabase/portalClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { VersionsList, type Version } from "../VersionsList";
import { CropSelector } from "../CropSelector";
import { FeedbackDetailModal } from "../FeedbackDetailModal";
import { captureTabCropped, isTabCaptureSupported, type CaptureError } from "@/lib/tabCapture";
import { reportError } from "@/lib/errorReporting";

interface FeedbackComment {
  id: string;
  prototype_id: string;
  author_type: string;
  body: string;
  status: string;
  resolved_at: string | null;
  created_at: string;
  screenshot_path?: string | null;
  screenshot_signed_url?: string | null;
  crop_x?: number | null;
  crop_y?: number | null;
  crop_w?: number | null;
  crop_h?: number | null;
  edited_at?: string | null;
  is_relevant?: boolean;
  version_count?: number;
  // Threading fields
  parent_comment_id?: string | null;
  thread_root_id?: string | null;
  last_activity_at?: string | null;
  // Client confirmation fields
  client_confirmed_at?: string | null;
  client_confirmed_by?: string | null;
  // Computed by UI
  replies?: FeedbackComment[];
}
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface WebsiteTabProps {
  versions: Version[];
  intakeStatus: 'draft' | 'submitted' | 'approved' | null;
  hasVersions: boolean;
  selectedVersionId?: string;
  onSelectVersion?: (id: string) => void;
  token: string;
  onRefreshComments?: () => void;
}

interface CropSelection {
  x: number;
  y: number;
  w: number;
  h: number;
}

type FeedbackMode = 
  | { type: "preview" }
  | { type: "cropping"; fullImage: string; fullImageW: number; fullImageH: number }
  | { type: "compose"; fullImage: string; fullImageW: number; fullImageH: number; crop: CropSelection; croppedImage: string };

// Fallback polling interval when realtime is disconnected
const POLLING_INTERVAL_MS = 10000;

export function WebsiteTab({
  versions,
  intakeStatus,
  hasVersions,
  selectedVersionId,
  onSelectVersion,
  token,
  onRefreshComments,
}: WebsiteTabProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>(
    versions[0]?.id
  );
  const [iframeKey, setIframeKey] = useState(0);
  const [mode, setMode] = useState<FeedbackMode>({ type: "preview" });
  const [isCapturing, setIsCapturing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  // Realtime connection status tracking
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Detail modal state
  const [selectedComment, setSelectedComment] = useState<FeedbackComment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  const selectedId = selectedVersionId ?? internalSelectedId;
  const handleSelect = onSelectVersion ?? setInternalSelectedId;
  
  const selectedVersion = versions.find(v => v.id === selectedId);
  const canTabCapture = isTabCaptureSupported();

  // Group comments into threads by thread_root_id
  const threadedComments = useMemo(() => {
    // Find root comments (where there's no parent_comment_id)
    const rootComments = comments.filter(c => !c.parent_comment_id);
    
    // Build map: thread_root_id -> [replies] with proper typing
    const replyMap = new Map<string, FeedbackComment[]>();
    comments.forEach(c => {
      if (!c.parent_comment_id) return;
      
      const threadId = c.thread_root_id ?? c.parent_comment_id;
      if (!threadId) return;
      
      const list = replyMap.get(threadId) ?? [];
      list.push(c);
      replyMap.set(threadId, list);
    });
    
    // Sort replies chronologically (oldest first)
    replyMap.forEach(list => list.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ));
    
    // Attach replies to root comments
    return rootComments
      .map(root => ({
        ...root,
        replies: replyMap.get(root.thread_root_id ?? root.id) ?? [],
      }))
      .sort((a, b) => {
        // Sort by last_activity_at or created_at descending (most recent first)
        const aTime = new Date(a.last_activity_at ?? a.created_at).getTime();
        const bTime = new Date(b.last_activity_at ?? b.created_at).getTime();
        return bTime - aTime;
      });
  }, [comments]);

  // Helper to get the latest reply preview
  const getLatestReply = (thread: FeedbackComment) => {
    if (!thread.replies?.length) return null;
    return thread.replies[thread.replies.length - 1];
  };

  // Fetch comments for the selected prototype
  const fetchComments = useCallback(async () => {
    if (!selectedId) return;
    setIsLoadingComments(true);
    try {
      // Get auth token for authenticated requests
      const { data: { session } } = await portalSupabase.auth.getSession();
      const authToken = session?.access_token || SUPABASE_ANON_KEY;
      
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/comments?prototype_id=${selectedId}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      } else {
        reportError(`Failed to fetch comments: ${res.status}`, { action: 'fetchComments', token, prototypeId: selectedId });
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      reportError(err instanceof Error ? err : String(err), { action: 'fetchComments', token, prototypeId: selectedId });
    } finally {
      setIsLoadingComments(false);
    }
  }, [selectedId, token]);

  // Fetch comments when prototype selection changes
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Start/stop fallback polling based on realtime connection status
  useEffect(() => {
    if (!isRealtimeConnected && selectedId) {
      console.log('[WebsiteTab] Realtime disconnected, starting fallback polling');
      pollingIntervalRef.current = setInterval(() => {
        fetchComments();
      }, POLLING_INTERVAL_MS);
    } else if (pollingIntervalRef.current) {
      console.log('[WebsiteTab] Realtime connected, stopping polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isRealtimeConnected, selectedId, fetchComments]);

  // Refetch on tab focus (catches missed updates during background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedId) {
        console.log('[WebsiteTab] Tab focused, refetching comments');
        fetchComments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedId, fetchComments]);

  // Realtime subscription for comments (token-scoped for security)
  useEffect(() => {
    if (!token) return;

    const channel = portalSupabase
      .channel(`rt-comments-client-${token}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prototype_comments',
          filter: `project_token=eq.${token}`, // Token-scoped for security
        },
        (payload) => {
          console.log('[Client WebsiteTab] Comment realtime:', payload.eventType);
          // Only process if it matches the selected prototype
          const newComment = payload.new as FeedbackComment | undefined;
          if (newComment && selectedId && newComment.prototype_id === selectedId) {
            fetchComments();
            onRefreshComments?.();
          }
        }
      )
      .subscribe((status) => {
        console.log('[WebsiteTab] Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsRealtimeConnected(false);
        }
      });

    return () => {
      portalSupabase.removeChannel(channel);
    };
  }, [token, selectedId, fetchComments, onRefreshComments]);

  // Capture screenshot using browser tab capture (auto-crops to preview area)
  const handleCaptureScreenshot = useCallback(async () => {
    if (!canTabCapture) {
      toast.error("Screen capture not supported. Please upload a screenshot.");
      return;
    }

    setIsCapturing(true);
    try {
      // Pass the preview container ref to auto-crop to just the iframe area
      const result = await captureTabCropped(previewContainerRef.current ?? undefined);
      // Go straight to cropping mode
      setMode({
        type: "cropping",
        fullImage: result.dataUrl,
        fullImageW: result.width,
        fullImageH: result.height,
      });
    } catch (err) {
      const captureErr = err as CaptureError;
      if (captureErr.type === "cancelled") {
        return;
      }
      console.error("Screenshot capture failed:", captureErr);
      toast.error(captureErr.message || "Screenshot capture failed. Please upload instead.");
    } finally {
      setIsCapturing(false);
    }
  }, [canTabCapture]);

  // Handle file upload for screenshot
  const handleUploadScreenshot = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Go to cropping mode with uploaded image
        setMode({
          type: "cropping",
          fullImage: e.target?.result as string,
          fullImageW: img.naturalWidth,
          fullImageH: img.naturalHeight,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleUploadScreenshot(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle crop selection confirmed
  const handleCropConfirm = useCallback((selection: CropSelection, croppedDataUrl: string) => {
    if (mode.type !== "cropping") return;
    setMode({
      type: "compose",
      fullImage: mode.fullImage,
      fullImageW: mode.fullImageW,
      fullImageH: mode.fullImageH,
      crop: selection,
      croppedImage: croppedDataUrl,
    });
  }, [mode]);

  // Handle attachment selection
  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    if (attachInputRef.current) attachInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Upload screenshot to storage
  const uploadScreenshot = async (blob: Blob, prototypeId?: string): Promise<{ mediaId: string; path: string }> => {
    const formData = new FormData();
    formData.append("file", blob, `screenshot-${Date.now()}.png`);
    if (prototypeId) {
      formData.append("prototype_id", prototypeId);
    }

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/portal/${token}/screenshot`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData,
      }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || "Failed to upload screenshot");
    }
    const data = await res.json();
    return { mediaId: data.media_id, path: data.path };
  };

  // Submit feedback with snip (cropped region)
  const handleSubmitFeedback = async () => {
    if (mode.type !== "compose" || !commentText.trim() || !selectedVersion) return;

    setIsSubmitting(true);
    try {
      // Upload the cropped image (this becomes the main screenshot_path)
      const croppedResponse = await fetch(mode.croppedImage);
      const croppedBlob = await croppedResponse.blob();
      const { mediaId, path } = await uploadScreenshot(croppedBlob, selectedVersion.id);

      // Optionally upload full screenshot for context
      const fullResponse = await fetch(mode.fullImage);
      const fullBlob = await fullResponse.blob();
      const fullUpload = await uploadScreenshot(fullBlob, selectedVersion.id);

      // Upload attachment files and collect media IDs
      const attachmentMediaIds: string[] = [];
      if (attachments.length > 0) {
        for (const attachFile of attachments) {
          const formData = new FormData();
          formData.append("file", attachFile, attachFile.name);
          formData.append("prototype_id", selectedVersion.id);
          
          const attachRes = await fetch(
            `${SUPABASE_URL}/functions/v1/portal/${token}/screenshot`,
            {
              method: "POST",
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
              body: formData,
            }
          );
          
          if (attachRes.ok) {
            const attachData = await attachRes.json();
            if (attachData.media_id) {
              attachmentMediaIds.push(attachData.media_id);
            }
          }
        }
      }

      // Create comment with cropped screenshot + crop coordinates + attachments
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: "create",
            prototype_id: selectedVersion.id,
            body: commentText.trim(),
            author_type: "client",
            // Cropped image is the main screenshot
            screenshot_media_id: mediaId,
            screenshot_path: path,
            screenshot_w: Math.round(mode.crop.w * mode.fullImageW),
            screenshot_h: Math.round(mode.crop.h * mode.fullImageH),
            // Store full screenshot and crop coordinates
            screenshot_full_path: fullUpload.path,
            crop_x: mode.crop.x,
            crop_y: mode.crop.y,
            crop_w: mode.crop.w,
            crop_h: mode.crop.h,
            // Attachments
            attachment_media_ids: attachmentMediaIds.length > 0 ? attachmentMediaIds : undefined,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to create comment");

      toast.success("Feedback submitted!");
      setMode({ type: "preview" });
      setCommentText("");
      setAttachments([]);
      fetchComments(); // Refresh comments list
      onRefreshComments?.();
    } catch (err) {
      console.error("Submit feedback failed:", err);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exitScreenshotMode = () => {
    setMode({ type: "preview" });
    setCommentText("");
    setAttachments([]);
  };

  // No versions yet - show waiting state
  if (!hasVersions) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-serif text-xl font-bold mb-2">
          Your first preview is being built
        </h2>
        <p className="text-muted-foreground max-w-md mb-4">
          We're working on your website. You'll see the first preview here once it's ready — usually within 24–48 hours.
        </p>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
          {intakeStatus === 'approved' ? 'Build in progress' : 'Under review'}
        </Badge>
      </div>
    );
  }

  // Has versions - show version selector + preview
  return (
    <div className="h-full flex flex-col">
      {/* Guidance banner for clients */}
      <div className="px-4 py-3 bg-primary/5 border-b border-primary/20">
        <p className="text-sm text-center text-muted-foreground">
          <span className="font-medium text-foreground">How it works:</span>{" "}
          Pick a version to preview → Capture a screenshot + leave comments → We'll respond in Messages
        </p>
      </div>
      
      <div className="flex-1 flex min-h-0">
        {/* Left: Version list + feedback items */}
        <div className="w-56 border-r border-border flex-shrink-0 flex flex-col min-h-0">
          <VersionsList
            versions={versions}
            selectedId={selectedId ?? null}
            onSelect={handleSelect}
          />
          
          {/* Feedback section */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-border">
            <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold">Feedback</h4>
                {comments.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {comments.length}
                  </Badge>
                )}
              </div>
              {isLoadingComments && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {/* Pending feedback mini card (when composing) */}
                {mode.type === "compose" && (
                  <div className="rounded-md border-2 border-dashed border-primary/50 bg-primary/5 overflow-hidden">
                    <div className="relative aspect-video">
                      <img
                        src={mode.croppedImage}
                        alt="Your selection"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute top-1 right-1">
                        <Badge className="text-[8px] h-4 px-1 bg-primary">Draft</Badge>
                      </div>
                      <div className="absolute bottom-1 left-1 right-1">
                        <span className="text-[9px] text-white font-medium truncate block">
                          {commentText.trim() ? commentText.slice(0, 25) + (commentText.length > 25 ? '...' : '') : 'Writing...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Thread cards - open threads */}
                {threadedComments.filter(thread => !thread.resolved_at).map((thread) => {
                  const latestReply = getLatestReply(thread);
                  const replyCount = thread.replies?.length ?? 0;
                  const statusIcon = thread.status === "in_progress" 
                    ? <Clock className="h-2.5 w-2.5 text-blue-500" />
                    : thread.status === "resolved" 
                    ? <Check className="h-2.5 w-2.5 text-green-500" />
                    : <CircleDot className="h-2.5 w-2.5 text-orange-500" />;
                  
                  return (
                    <div
                      key={thread.id}
                      onClick={() => {
                        setSelectedComment(thread);
                        setShowDetailModal(true);
                      }}
                      className="rounded-md border border-border bg-background overflow-hidden hover:border-primary/40 transition-colors cursor-pointer group"
                    >
                      {/* Screenshot thumbnail */}
                      {thread.screenshot_signed_url ? (
                        <div className="relative aspect-video bg-muted">
                          <img
                            src={thread.screenshot_signed_url}
                            alt="Feedback"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          {/* Status + reply count badges */}
                          <div className="absolute top-1 right-1 flex items-center gap-1">
                            {statusIcon}
                            {replyCount > 0 && (
                              <Badge className="text-[8px] h-4 px-1 bg-indigo-600/90 border-0">
                                <MessageSquare className="h-2 w-2 mr-0.5" />
                                {replyCount}
                              </Badge>
                            )}
                          </div>
                          {/* Original feedback preview */}
                          <div className="absolute bottom-1 left-1 right-1">
                            <span className="text-[9px] text-white/95 font-medium truncate block">
                              {thread.body.slice(0, 35)}{thread.body.length > 35 ? '...' : ''}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2">
                          <div className="flex items-start gap-1.5">
                            {statusIcon}
                            <p className="text-[10px] text-foreground leading-tight line-clamp-2 flex-1">
                              {thread.body}
                            </p>
                            {replyCount > 0 && (
                              <Badge variant="outline" className="text-[8px] h-4 px-1 bg-indigo-50 text-indigo-600 border-indigo-200 flex-shrink-0">
                                <MessageSquare className="h-2 w-2 mr-0.5" />
                                {replyCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Footer with author + status */}
                      <div className="px-2 py-1 border-t border-border bg-muted/30 flex items-center justify-between">
                        <span className="text-[9px] text-muted-foreground">
                          {thread.author_type === "client" ? "You" : "Operator"}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-[8px] h-4 px-1 ${
                            thread.status === "in_progress" 
                              ? "bg-blue-50 text-blue-700 border-blue-200" 
                              : "bg-orange-50 text-orange-700 border-orange-200"
                          }`}
                        >
                          {thread.status === "in_progress" ? "Working" : "Open"}
                        </Badge>
                      </div>
                      
                      {/* Latest reply preview (if has replies) */}
                      {latestReply && (
                        <div className="px-2 py-1.5 border-t border-dashed border-border/60 bg-muted/20">
                          <div className="flex items-center gap-1 text-[9px] text-muted-foreground mb-0.5">
                            <CornerDownRight className="h-2 w-2" />
                            <span className="font-medium">
                              {latestReply.author_type === "client" ? "You" : "Operator"}
                            </span>
                            <span>replied</span>
                          </div>
                          <p className="text-[9px] text-foreground/80 line-clamp-1">
                            {latestReply.body}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Resolved threads (collapsible with muted cards) */}
                {threadedComments.filter(thread => thread.resolved_at).length > 0 && (
                  <details className="pt-2 border-t border-border group">
                    <summary className="flex items-center gap-1.5 cursor-pointer list-none select-none hover:text-foreground text-muted-foreground transition-colors">
                      <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="text-[10px]">
                        Resolved ({threadedComments.filter(thread => thread.resolved_at).length})
                      </span>
                    </summary>
                    <div className="mt-2 space-y-2">
                      {threadedComments.filter(thread => thread.resolved_at).map((thread) => {
                        const replyCount = thread.replies?.length ?? 0;
                        return (
                          <div
                            key={thread.id}
                            onClick={() => {
                              setSelectedComment(thread);
                              setShowDetailModal(true);
                            }}
                            className="rounded-md border border-border/50 bg-muted/30 overflow-hidden hover:border-border transition-colors cursor-pointer opacity-70 hover:opacity-100"
                          >
                            {/* Screenshot thumbnail (muted) */}
                            {thread.screenshot_signed_url ? (
                              <div className="relative aspect-video bg-muted grayscale-[30%]">
                                <img
                                  src={thread.screenshot_signed_url}
                                  alt="Resolved feedback"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                <div className="absolute top-1 right-1">
                                  <Check className="h-3 w-3 text-green-400" />
                                </div>
                                <div className="absolute bottom-1 left-1 right-1">
                                  <span className="text-[9px] text-white/80 truncate block line-through">
                                    {thread.body.slice(0, 35)}{thread.body.length > 35 ? '...' : ''}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="p-2">
                                <div className="flex items-start gap-1.5">
                                  <Check className="h-2.5 w-2.5 text-green-500 flex-shrink-0" />
                                  <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2 flex-1 line-through">
                                    {thread.body}
                                  </p>
                                  {replyCount > 0 && (
                                    <Badge variant="outline" className="text-[8px] h-4 px-1 bg-gray-50 text-gray-500 border-gray-200 flex-shrink-0">
                                      {replyCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="px-2 py-1 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                              <span className="text-[9px] text-muted-foreground/70">
                                {thread.author_type === "client" ? "You" : "Operator"}
                              </span>
                              <Badge variant="outline" className="text-[8px] h-4 px-1 bg-green-50/50 text-green-600 border-green-200/50">
                                Resolved
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                )}

                {/* Empty state */}
                {threadedComments.length === 0 && mode.type !== "compose" && !isLoadingComments && (
                  <div className="py-6 text-center">
                    <MessageCircle className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-[10px] text-muted-foreground">No feedback yet</p>
                    <p className="text-[9px] text-muted-foreground/70 mt-0.5">
                      Use "Capture Feedback" to add your first
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        
        {/* Right: Preview or Screenshot mode */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedVersion && (
            <>
              {/* Preview header with feedback tools */}
              <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  {mode.type !== "preview" ? (
                    <>
                      <span className="text-sm font-medium text-primary">
                        {mode.type === "cropping" ? "Select Area" : "Add Comment"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={exitScreenshotMode}
                        className="h-7 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <div>
                        <h3 className="font-medium text-sm">Preview</h3>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {selectedVersion.url}
                        </p>
                      </div>
                      <div className="h-6 w-px bg-border" />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCaptureScreenshot}
                              disabled={isCapturing}
                              className="h-8 text-xs gap-1.5"
                            >
                              {isCapturing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Camera className="h-3.5 w-3.5" />
                              )}
                              Capture Feedback
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs max-w-[220px]">
                            Take a screenshot and select the area you want changed
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="h-8 text-xs gap-1.5"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              Upload
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            Upload a screenshot to leave feedback
                          </TooltipContent>
                        </Tooltip>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </TooltipProvider>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {mode.type === "preview" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIframeKey(k => k + 1)}
                        title="Refresh preview"
                        className="h-8 w-8"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedVersion.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in new tab
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Content area */}
              <div ref={previewContainerRef} className="flex-1 bg-muted/20 overflow-hidden">
                {mode.type === "cropping" ? (
                  /* Crop selector for snip-first feedback */
                  <CropSelector
                    imageDataUrl={mode.fullImage}
                    onConfirm={handleCropConfirm}
                    onCancel={exitScreenshotMode}
                  />
                ) : (
                  /* Live preview iframe */
                  <iframe
                    key={iframeKey}
                    src={selectedVersion.url}
                    className="w-full h-full border-0"
                    title="Website preview"
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom: Comment composer when crop is selected */}
      {mode.type === "compose" && (
        <div className="flex-shrink-0 p-4 border-t border-border bg-background">
          {/* Cropped preview */}
          <div className="mb-3 flex items-start gap-3">
            <div className="relative inline-block rounded-lg overflow-hidden border border-border flex-shrink-0 bg-muted">
              <img
                src={mode.croppedImage}
                alt="Selected area"
                className="h-20 w-auto object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Selected area to change:</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setMode({ 
                  type: "cropping", 
                  fullImage: mode.fullImage, 
                  fullImageW: mode.fullImageW, 
                  fullImageH: mode.fullImageH 
                })}
              >
                Re-select area
              </Button>
            </div>
          </div>

          {/* Comment input */}
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="What would you like changed? (e.g., 'Replace this logo with...' or 'Make this text larger')"
            className="min-h-[80px] resize-none mb-3"
            autoFocus
          />

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="relative group flex items-center gap-2 px-2 py-1 rounded bg-muted text-xs"
                >
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={attachInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleAttachmentSelect}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => attachInputRef.current?.click()}
              >
                <Paperclip className="h-3.5 w-3.5" />
                Attach file (e.g., new logo)
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={exitScreenshotMode}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmitFeedback}
                disabled={!commentText.trim() || isSubmitting}
                className="gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Submit Feedback
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback thread modal */}
      <FeedbackDetailModal
        comment={selectedComment as any}
        threadReplies={(selectedComment?.replies ?? []) as any}
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedComment(null);
        }}
        token={token}
        onCommentUpdated={fetchComments}
      />
    </div>
  );
}
