import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import type { CommentData } from "./FeedbackCard";

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

  if (!comment) return null;

  const isClient = comment.author_type === "client";
  const canEdit = isClient;
  const isResolved = comment.status === "resolved" || !!comment.resolved_at;
  const isInProgress = comment.status === "in_progress";
  const isNotRelevant = comment.is_relevant === false;
  const hasVersions = (comment.version_count ?? 1) > 1;
  const screenshotUrl = comment.screenshot_signed_url ||
    (comment.screenshot_path ? `${SUPABASE_URL}/storage/v1/object/public/project-media/${comment.screenshot_path}` : null);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Feedback Details</span>
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
            {/* Screenshot */}
            {screenshotUrl && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img
                  src={screenshotUrl}
                  alt="Screenshot"
                  className="w-full h-auto max-h-[50vh] object-contain"
                />
              </div>
            )}

            {/* Attachments */}
            {(hasAttachments || loadingAttachments) && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  Attached Files ({loadingAttachments ? "..." : attachments.length})
                </div>
                {loadingAttachments ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading attachments...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.signed_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative w-12 h-12 rounded-md border border-border overflow-hidden bg-muted/50 hover:border-primary/50 transition-colors"
                        title={att.filename}
                      >
                        {att.mime_type.startsWith("image/") && att.signed_url ? (
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

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-[10px]">Open</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comment body */}
            <div className="space-y-2">
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
                    {isClient ? "Client" : "Operator"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(comment.created_at)}
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
            </div>

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

            {/* Status actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
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
              ) : (
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
