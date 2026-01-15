import { useState, useEffect, useCallback } from "react";
import { portalSupabase } from "@/integrations/supabase/portalClient";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Check,
  Clock,
  CircleDot,
  XCircle,
  Pencil,
  MinusCircle,
  ChevronDown,
  History,
  Send,
  X,
  Loader2,
  Paperclip,
  ExternalLink,
  CornerDownRight,
  MessageSquare,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { CommentData } from "./FeedbackCard";
import { reportError } from "@/lib/errorReporting";

interface Attachment {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  signed_url: string | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface CommentVersion {
  id: string;
  comment_id: string;
  version_number: number;
  author_type: string;
  body: string;
  screenshot_path?: string | null;
  screenshot_signed_url?: string | null;
  change_type: "original" | "edit" | "clarification" | "status_change";
  created_at: string;
}

interface FeedbackDetailModalProps {
  comment: CommentData | null;
  threadReplies?: CommentData[];
  open: boolean;
  onClose: () => void;
  token: string;
  onCommentUpdated: () => void;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getChangeTypeBadge(changeType: string) {
  switch (changeType) {
    case "original":
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          Original
        </Badge>
      );
    case "edit":
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
          Edit
        </Badge>
      );
    case "clarification":
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
          Clarification
        </Badge>
      );
    case "status_change":
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gray-50 text-gray-600 border-gray-200">
          Status
        </Badge>
      );
    default:
      return null;
  }
}

export function FeedbackDetailModal({
  comment,
  threadReplies = [],
  open,
  onClose,
  token,
  onCommentUpdated,
}: FeedbackDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState("");
  const [clarificationText, setClarificationText] = useState("");
  const [showClarification, setShowClarification] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [versions, setVersions] = useState<CommentVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Reply to thread state
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Fetch attachments for this comment
  const { data: attachmentsData, isLoading: loadingAttachments } = useQuery({
    queryKey: ["feedback-detail-attachments", token, comment?.id],
    queryFn: async () => {
      if (!comment?.id) return { attachments: [] };
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/comments/${comment.id}/attachments`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!res.ok) return { attachments: [] };
      return res.json() as Promise<{ attachments: Attachment[] }>;
    },
    enabled: open && !!comment?.id,
    staleTime: 30000,
  });

  const attachments = attachmentsData?.attachments || [];
  const hasAttachments = attachments.length > 0;

  // Reset state when modal opens with new comment
  useEffect(() => {
    if (comment) {
      setEditedBody(comment.body);
      setIsEditing(false);
      setClarificationText("");
      setShowClarification(false);
      setVersions([]);
      setHistoryOpen(false);
      // Reset reply state
      setReplyText("");
      setShowReplyInput(false);
      setReplyError(null);
    }
  }, [comment?.id]);

  // Fetch versions when history is opened
  const fetchVersions = useCallback(async () => {
    if (!comment || versions.length > 0) return;

    setLoadingVersions(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${token}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "get_versions",
          comment_id: comment.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error("Failed to fetch versions:", err);
    } finally {
      setLoadingVersions(false);
    }
  }, [comment?.id, token, versions.length]);

  useEffect(() => {
    if (historyOpen && comment && versions.length === 0) {
      fetchVersions();
    }
  }, [historyOpen, fetchVersions]);

  // API actions
  const handleSaveEdit = async () => {
    if (!comment || !editedBody.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${token}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "edit",
          comment_id: comment.id,
          body: editedBody.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Comment updated");
        setIsEditing(false);
        setVersions([]); // Clear to force refetch
        onCommentUpdated();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch (err) {
      toast.error("Failed to update comment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddClarification = async () => {
    if (!comment || !clarificationText.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${token}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "add_clarification",
          comment_id: comment.id,
          body: clarificationText.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Clarification added");
        setClarificationText("");
        setShowClarification(false);
        setVersions([]); // Clear to force refetch
        onCommentUpdated();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add clarification");
      }
    } catch (err) {
      toast.error("Failed to add clarification");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!comment) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${token}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "update_status",
          comment_id: comment.id,
          status: newStatus,
        }),
      });

      if (res.ok) {
        toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
        onCommentUpdated();
      }
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setIsSaving(false);
    }
  };

  // Client "Looks Good" confirmation (not resolution - just signals completion)
  const handleConfirmLooksGood = async () => {
    if (!comment) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${token}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "confirm",
          comment_id: comment.id,
        }),
      });

      if (res.ok) {
        toast.success("Thanks! We've noted your confirmation.");
        onCommentUpdated();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to confirm");
      }
    } catch (err) {
      toast.error("Failed to confirm");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkNotRelevant = async () => {
    if (!comment) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${token}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "mark_not_relevant",
          comment_id: comment.id,
        }),
      });

      if (res.ok) {
        toast.success("Marked as no longer relevant");
        onCommentUpdated();
        onClose();
      }
    } catch (err) {
      toast.error("Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreRelevant = async () => {
    if (!comment) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${token}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "restore_relevant",
          comment_id: comment.id,
        }),
      });

      if (res.ok) {
        toast.success("Restored");
        onCommentUpdated();
      }
    } catch (err) {
      toast.error("Failed to restore");
    } finally {
      setIsSaving(false);
    }
  };

  // Reply to thread handler - always replies to thread root
  const handleAddReply = async () => {
    if (!comment || !replyText.trim()) return;

    setIsReplying(true);
    setReplyError(null);
    
    // Store reply text for retry
    const replyContent = replyText.trim();
    
    try {
      const { data, error } = await portalSupabase.auth.getSession();
      const accessToken = data?.session?.access_token;

      if (error || !accessToken) {
        setReplyError("Please sign in again to reply.");
        reportError("No access token for reply", { action: 'handleAddReply', token, commentId: comment.id });
        return;
      }

      // Always reply to the thread root to prevent nesting issues
      const parentId = comment.thread_root_id ?? comment.id;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${token}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: "create",
          prototype_id: comment.prototype_id,
          body: replyContent,
          parent_comment_id: parentId,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const errorMsg = payload?.error || "Failed to create reply";
        setReplyError(errorMsg);
        reportError(`Reply failed: ${res.status} - ${errorMsg}`, { action: 'handleAddReply', token, commentId: comment.id });
        return;
      }

      toast.success("Reply added");
      setReplyText("");
      setShowReplyInput(false);
      setReplyError(null);
      onCommentUpdated?.();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to add reply";
      setReplyError(errorMessage);
      reportError(e instanceof Error ? e : String(e), { action: 'handleAddReply', token, commentId: comment.id });
    } finally {
      setIsReplying(false);
    }
  };
  
  // Retry handler for failed replies
  const handleRetryReply = () => {
    setReplyError(null);
    handleAddReply();
  };

  if (!comment) return null;

  // Determine if viewing as a client (all portal users are clients for now)
  const isViewingAsClient = true; // Portal users are clients - operators have separate dashboard
  const isClient = comment.author_type === "client";
  const canEdit = isClient;
  const isResolved = comment.status === "resolved" || !!comment.resolved_at;
  const isInProgress = comment.status === "in_progress";
  const isNotRelevant = comment.is_relevant === false;
  const isClientConfirmed = !!comment.client_confirmed_at;
  const hasVersions = (comment.version_count ?? 1) > 1;
  const hasReplies = threadReplies.length > 0;
  const screenshotUrl = comment.screenshot_signed_url ||
    (comment.screenshot_path ? `${SUPABASE_URL}/storage/v1/object/public/project-media/${comment.screenshot_path}` : null);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Feedback Thread</span>
            {hasReplies && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200">
                <MessageSquare className="h-2 w-2 mr-0.5" />
                {threadReplies.length} repl{threadReplies.length !== 1 ? 'ies' : 'y'}
              </Badge>
            )}
            {comment.edited_at && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                <Pencil className="h-2 w-2 mr-0.5" />
                Edited
              </Badge>
            )}
            {isNotRelevant && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border-gray-200">
                <MinusCircle className="h-2 w-2 mr-0.5" />
                Not Relevant
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 max-h-[calc(90vh-6rem)] overflow-y-auto pr-4">
          <div className="space-y-4">
            {/* ═══════════════ THREAD ANCHOR: Screenshot + Original Feedback ═══════════════ */}
            <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
              {/* Screenshot */}
              {screenshotUrl && (
                <div className="border-b border-border">
                  <img
                    src={screenshotUrl}
                    alt="Screenshot"
                    className="w-full h-auto max-h-[40vh] object-contain bg-muted/30"
                  />
                </div>
              )}

              {/* Original feedback */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isClient
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : "bg-violet-50 text-violet-700 border-violet-200"
                      }`}
                    >
                      {isClient ? "You" : "Operator"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(comment.created_at)}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-medium">
                      Original feedback
                    </span>
                  </div>

                  {canEdit && !isEditing && !isNotRelevant && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      className="min-h-[100px]"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={isSaving || !editedBody.trim()}
                      >
                        {isSaving ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Check className="h-3 w-3 mr-1" />
                        )}
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedBody(comment.body);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                )}

                {/* Attachments for original */}
                {(hasAttachments || loadingAttachments) && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="text-xs font-medium text-muted-foreground">
                      Attached files {loadingAttachments ? "" : `(${attachments.length})`}
                    </div>

                    {loadingAttachments ? (
                      <div className="text-sm text-muted-foreground">Loading...</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.signed_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-16"
                            title={att.filename}
                          >
                            <div className="relative w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted/50 hover:border-primary/50 transition-colors">
                              {att.mime_type?.startsWith("image/") && att.signed_url ? (
                                <img
                                  src={att.signed_url}
                                  alt={att.filename}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                  📎
                                </div>
                              )}

                              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-[10px] font-medium">Open</span>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ═══════════════ CONVERSATION TIMELINE: Replies ═══════════════ */}
            {hasReplies && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border" />
                  <span className="px-2">Thread ({threadReplies.length} repl{threadReplies.length !== 1 ? 'ies' : 'y'})</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-2 pl-3 border-l-2 border-border/50">
                  {threadReplies.map((reply) => {
                    const replyIsClient = reply.author_type === "client";
                    return (
                      <div
                        key={reply.id}
                        className="rounded-lg border border-border bg-background p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <CornerDownRight className="h-3 w-3 text-muted-foreground" />
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              replyIsClient
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : "bg-violet-50 text-violet-700 border-violet-200"
                            }`}
                          >
                            {replyIsClient ? "You" : "Operator"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(reply.created_at)}
                          </span>
                          {reply.edited_at && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-50 text-amber-600 border-amber-200">
                              Edited
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Reply to Thread */}
                <div className="space-y-2 pt-2">
                  {showReplyInput ? (
                    <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                      {/* Error state with retry */}
                      {replyError && (
                        <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                          <div className="flex items-center gap-1.5 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {replyError}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRetryReply}
                            disabled={isReplying}
                            className="h-6 text-xs px-2"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        </div>
                      )}
                      
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Reply to this thread..."
                        className="min-h-[80px]"
                        autoFocus
                      />

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={handleAddReply}
                          disabled={isReplying || !replyText.trim()}
                        >
                          {isReplying ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Send className="h-3 w-3 mr-1" />
                          )}
                          {isReplying ? 'Sending...' : 'Reply'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowReplyInput(false);
                            setReplyText("");
                            setReplyError(null);
                          }}
                          disabled={isReplying}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setShowReplyInput(true)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Reply to Thread
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Add clarification */}
            {canEdit && !isNotRelevant && (
              <div className="space-y-2">
                {showClarification ? (
                  <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground">
                      Add a clarification (this won't replace your original comment)
                    </p>
                    <Textarea
                      value={clarificationText}
                      onChange={(e) => setClarificationText(e.target.value)}
                      placeholder="I meant to say..."
                      className="min-h-[80px]"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleAddClarification}
                        disabled={isSaving || !clarificationText.trim()}
                      >
                        {isSaving ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Send className="h-3 w-3 mr-1" />
                        )}
                        Add Clarification
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowClarification(false);
                          setClarificationText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowClarification(true)}
                  >
                    + Add Clarification
                  </Button>
                )}
              </div>
            )}

            {/* Status actions - Different for clients vs operators */}
            <div className="flex flex-col gap-3 pt-3 border-t border-border">
              {/* Resolved status helper text */}
              {isResolved && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
                  <Check className="h-4 w-4" />
                  <span>This feedback has been completed.</span>
                  {!isViewingAsClient && (
                    <span className="text-xs text-green-600/80 ml-auto">
                      You can still reply below if needed.
                    </span>
                  )}
                </div>
              )}

              {/* Client confirmation status */}
              {isClientConfirmed && !isResolved && (
                <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-md px-3 py-2">
                  <Check className="h-4 w-4" />
                  <span>You confirmed this looks good. Waiting for operator to resolve.</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {isNotRelevant ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={handleRestoreRelevant}
                    disabled={isSaving}
                  >
                    Restore
                  </Button>
                ) : isViewingAsClient ? (
                  /* ═══════════════ CLIENT ACTIONS ═══════════════ */
                  <>
                    {/* "Looks Good" button - client confirms without resolving */}
                    {!isResolved && !isClientConfirmed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-green-600 hover:bg-green-50 border-green-200"
                        onClick={handleConfirmLooksGood}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Check className="h-3 w-3 mr-1" />
                        )}
                        Looks Good
                      </Button>
                    )}
                    {/* "No Longer Relevant" - client can mark their own feedback as not relevant */}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-500 hover:text-gray-700 ml-auto"
                        onClick={handleMarkNotRelevant}
                        disabled={isSaving}
                      >
                        <MinusCircle className="h-3 w-3 mr-1" />
                        No Longer Relevant
                      </Button>
                    )}
                  </>
                ) : (
                  /* ═══════════════ OPERATOR ACTIONS (kept for reference, not used in portal) ═══════════════ */
                  <>
                    {!isInProgress && !isResolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-blue-600 hover:bg-blue-50"
                        onClick={() => handleStatusChange("in_progress")}
                        disabled={isSaving}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Working
                      </Button>
                    )}
                    {!isResolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-green-600 hover:bg-green-50"
                        onClick={() => handleStatusChange("resolved")}
                        disabled={isSaving}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                    )}
                    {isResolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-orange-600 hover:bg-orange-50"
                        onClick={() => handleStatusChange("open")}
                        disabled={isSaving}
                      >
                        <CircleDot className="h-3 w-3 mr-1" />
                        Reopen
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-500 hover:text-gray-700 ml-auto"
                        onClick={handleMarkNotRelevant}
                        disabled={isSaving}
                      >
                        <MinusCircle className="h-3 w-3 mr-1" />
                        No Longer Relevant
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Version history */}
            {hasVersions && (
              <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <History className="h-3 w-3" />
                      Edit History ({comment.version_count} versions)
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${historyOpen ? "rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {loadingVersions ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    versions.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-lg border border-border bg-muted/20 space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">v{v.version_number}</span>
                          {getChangeTypeBadge(v.change_type)}
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(v.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {v.body}
                        </p>
                        {v.screenshot_signed_url && (
                          <img
                            src={v.screenshot_signed_url}
                            alt={`Version ${v.version_number}`}
                            className="w-32 h-auto rounded border border-border mt-1"
                          />
                        )}
                      </div>
                    ))
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
