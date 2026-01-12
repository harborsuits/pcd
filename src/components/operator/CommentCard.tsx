import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Loader2,
  FileIcon,
  ExternalLink,
  Paperclip,
  X,
  Upload,
  Reply,
  RotateCcw,
  Send,
  Lock,
  MessageSquare,
  CornerDownRight,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { adminFetch } from "@/lib/adminFetch";
import { useIsMobile } from "@/hooks/use-mobile";
import { isReplyComment } from "@/lib/threading";

type CommentStatus = "open" | "in_progress" | "resolved" | "wont_do";

export interface PrototypeComment {
  id: string;
  source_message_id: string | null;
  body: string;
  pin_x: number | null;
  pin_y: number | null;
  resolved_at: string | null;
  created_at: string;
  author_type: string;
  prototype_id?: string;
  parent_comment_id?: string | null;
  thread_root_id?: string | null;
  is_internal?: boolean;
  status?: CommentStatus;
  resolution_note?: string | null;
  resolved_by?: string | null;
  screenshot_path?: string | null;
  screenshot_w?: number | null;
  screenshot_h?: number | null;
  screenshot_full_path?: string | null;
  crop_x?: number | null;
  crop_y?: number | null;
  crop_w?: number | null;
  crop_h?: number | null;
  replies?: PrototypeComment[];
}

interface Attachment {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploader_type: string;
  created_at: string;
  signed_url: string | null;
}

interface CommentCardProps {
  comment: PrototypeComment;
  index: number;
  projectToken: string;
  isHighlighted: boolean;
  onJumpToPin: (comment: PrototypeComment) => void;
  onResolveToggle: (commentId: string, resolve: boolean) => void;
  onStatusChange?: (
    commentId: string,
    status: CommentStatus,
    resolutionNote?: string
  ) => void;
  isResolving: boolean;
  onReplyAdded?: () => void;
  isReply?: boolean;
}

export function CommentCard({
  comment,
  index,
  projectToken,
  isHighlighted,
  onJumpToPin,
  onResolveToggle,
  isResolving,
  onReplyAdded,
  isReply: isReplyProp,
}: CommentCardProps) {
  const isMobile = useIsMobile();

  // Derive isReply from comment data, fallback to prop for backward compat
  const derivedIsReply = isReplyComment(comment);
  const isReplyFinal = isReplyProp ?? derivedIsReply;

  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showAllAttachments, setShowAllAttachments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const hasReplies = (comment.replies?.length ?? 0) > 0;

  const { data: attachmentsData, isLoading: attachmentsLoading } = useQuery({
    queryKey: ["comment-attachments", projectToken, comment.id],
    queryFn: async () => {
      const res = await adminFetch(
        `/admin/comments/${projectToken}/${comment.id}/attachments`
      );
      if (!res.ok) throw new Error("Failed to fetch attachments");
      return res.json() as Promise<{ attachments: Attachment[] }>;
    },
  });

  const { data: screenshotUrl } = useQuery({
    queryKey: ["comment-screenshot", comment.screenshot_path],
    queryFn: async () => {
      const res = await adminFetch(
        `/admin/signed-url?bucket=project-media&path=${encodeURIComponent(
          comment.screenshot_path!
        )}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data.signedUrl as string;
    },
    enabled: !!comment.screenshot_path,
    staleTime: 50 * 60 * 1000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await adminFetch(
        `/admin/comments/${projectToken}/${comment.id}/attachments`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!res.ok) throw new Error("Failed to upload attachment");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Attachment uploaded");
      queryClient.invalidateQueries({
        queryKey: ["comment-attachments", projectToken, comment.id],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const res = await adminFetch(
        `/admin/comments/${projectToken}/${comment.id}/attachments/${attachmentId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to delete attachment");
    },
    onSuccess: () => {
      toast.success("Attachment deleted");
      queryClient.invalidateQueries({
        queryKey: ["comment-attachments", projectToken, comment.id],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const replyMutation = useMutation({
    mutationFn: async ({
      body,
      isInternal,
    }: {
      body: string;
      isInternal: boolean;
    }) => {
      const res = await adminFetch(`/admin/comments/${projectToken}`, {
        method: "POST",
        body: JSON.stringify({
          prototype_id: comment.prototype_id,
          body,
          pin_x: comment.pin_x,
          pin_y: comment.pin_y,
          author_type: "admin",
          parent_comment_id: comment.id,
          is_internal: isInternal,
        }),
      });
      if (!res.ok) throw new Error("Failed to add reply");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Reply added");
      setReplyText("");
      setShowReply(false);
      queryClient.invalidateQueries({
        queryKey: ["project-comments", projectToken],
      });
      onReplyAdded?.();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const attachments = attachmentsData?.attachments || [];
  const displayedAttachments = showAllAttachments
    ? attachments
    : attachments.slice(0, 2);
  const hiddenCount = attachments.length - 2;
  const isImageMime = (mimeType: string) => mimeType.startsWith("image/");
  const isResolved = !!comment.resolved_at;
  const isInternal = !!comment.is_internal;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => uploadMutation.mutate(file));
  };

  const [makeInternal, setMakeInternal] = useState(isResolved);

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    replyMutation.mutate({ body: replyText.trim(), isInternal: makeInternal });
  };

  // ========== REPLY CARD (Lighter Style) ==========
  if (isReplyFinal) {
    return (
      <div className="ml-4 pl-3 border-l-2 border-muted py-2 group">
        <div
          className={`rounded-md px-2 py-1.5 transition-colors ${
            isHighlighted
              ? "bg-primary/10"
              : "hover:bg-muted/50"
          } ${isResolved ? "opacity-70" : ""} ${
            isInternal
              ? "border-l-2 border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-900/10"
              : ""
          }`}
        >
          {/* Internal badge */}
          {isInternal && (
            <div className="mb-1.5">
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
                Internal Note
              </span>
            </div>
          )}

          {/* Compact header: reply indicator + author + time */}
          <div
            className="flex items-center gap-2 mb-1 cursor-pointer"
            onClick={() => onJumpToPin(comment)}
          >
            <CornerDownRight className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {comment.author_type === "client" ? "Client" : "Operator"} •{" "}
              {format(new Date(comment.created_at), "MMM d, h:mm a")}
            </span>
            {/* Inline attachment badge */}
            {attachments.length > 0 && (
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
              >
                <Paperclip className="h-2 w-2 mr-0.5" />
                {attachments.length}
              </Badge>
            )}
          </div>

          {/* Body - compact */}
          <p
            className={`text-sm line-clamp-2 cursor-pointer ${
              isResolved ? "line-through text-muted-foreground" : ""
            }`}
            onClick={() => onJumpToPin(comment)}
          >
            {comment.body}
          </p>

          {/* Hover-only actions for replies (or always visible on mobile) */}
          <div
            className={`mt-1.5 flex items-center gap-1 ${
              isMobile
                ? ""
                : "opacity-0 group-hover:opacity-100 transition-opacity"
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                setShowReply(!showReply);
              }}
              aria-label="Reply"
            >
              <Reply className="h-2.5 w-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                onResolveToggle(comment.id, !isResolved);
              }}
              disabled={isResolving}
              aria-label={isResolved ? "Reopen" : "Resolve"}
            >
              {isResolved ? (
                <RotateCcw className="h-2.5 w-2.5" />
              ) : (
                <CheckCircle className="h-2.5 w-2.5" />
              )}
            </Button>
          </div>

          {/* Reply input */}
          {showReply && (
            <div
              className="mt-2 pt-2 border-t border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <Textarea
                placeholder={
                  isResolved ? "Add a note..." : "Reply to this comment..."
                }
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[50px] text-sm resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSubmitReply();
                  }
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-1.5">
                  <Checkbox
                    id={`internal-reply-${comment.id}`}
                    checked={makeInternal}
                    onCheckedChange={(checked) => setMakeInternal(!!checked)}
                  />
                  <Label
                    htmlFor={`internal-reply-${comment.id}`}
                    className="text-[9px] text-muted-foreground cursor-pointer flex items-center gap-1"
                  >
                    <Lock className="h-2 w-2" />
                    Internal
                  </Label>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => {
                      setShowReply(false);
                      setReplyText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className={`h-6 text-[10px] ${
                      makeInternal ? "bg-yellow-600 hover:bg-yellow-700" : ""
                    }`}
                    onClick={handleSubmitReply}
                    disabled={!replyText.trim() || replyMutation.isPending}
                  >
                    {replyMutation.isPending ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : makeInternal ? (
                      <Lock className="h-2.5 w-2.5" />
                    ) : (
                      <Send className="h-2.5 w-2.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== ROOT CARD (Heavier Style) ==========
  return (
    <div className="mb-4">
      <div
        className={`p-3 rounded-lg border-l-4 border transition-colors ${
          isHighlighted
            ? "border-l-primary border-primary bg-primary/5"
            : "border-l-primary border-border hover:bg-muted/50"
        } ${isResolved ? "opacity-70 border-l-muted" : ""} ${
          isInternal
            ? "border-dashed border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-900/10"
            : ""
        }`}
      >
        {/* Internal badge */}
        {isInternal && (
          <div className="mb-2 flex items-center gap-1">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
              Internal Note
            </span>
          </div>
        )}

        {/* Header row */}
        <div
          className="flex items-start justify-between gap-2 cursor-pointer"
          onClick={() => onJumpToPin(comment)}
        >
          <div className="flex items-start gap-2 min-w-0">
            {/* Larger numbered badge for root */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isResolved
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {index + 1}
            </div>
            <div className="min-w-0">
              <p
                className={`text-sm line-clamp-2 ${
                  isResolved ? "line-through text-muted-foreground" : ""
                }`}
              >
                {comment.body}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-[10px] text-muted-foreground">
                  {comment.author_type === "client" ? "Client" : "Operator"} •{" "}
                  {format(new Date(comment.created_at), "MMM d, h:mm a")}
                </p>
                {/* Inline attachment count badge */}
                {attachments.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700"
                  >
                    <Paperclip className="h-2 w-2 mr-0.5" />
                    {attachments.length} file
                    {attachments.length !== 1 ? "s" : ""}
                  </Badge>
                )}
                {/* Reply count badge */}
                {hasReplies && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700"
                  >
                    <MessageSquare className="h-2 w-2 mr-0.5" />
                    {comment.replies!.length}{" "}
                    {comment.replies!.length !== 1 ? "replies" : "reply"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Full action set for root - always visible */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setShowReply(!showReply);
              }}
              aria-label="Reply"
            >
              <Reply className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              aria-label="Add files"
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onResolveToggle(comment.id, !isResolved);
              }}
              disabled={isResolving}
              aria-label={isResolved ? "Reopen" : "Resolve"}
            >
              {isResolved ? (
                <RotateCcw className="h-3 w-3" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Screenshot preview */}
        {comment.screenshot_path && screenshotUrl && (
          <div className="mt-2 rounded-md overflow-hidden border border-border bg-muted/30">
            <a
              href={screenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={screenshotUrl}
                alt="Screenshot"
                className="w-full max-h-32 object-contain bg-background"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </a>
          </div>
        )}

        {/* Reply input */}
        {showReply && (
          <div
            className="mt-2 pt-2 border-t border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <Textarea
              placeholder={
                isResolved ? "Add a note..." : "Reply to this comment..."
              }
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmitReply();
                }
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center space-x-1.5">
                  <Checkbox
                    id={`internal-${comment.id}`}
                    checked={makeInternal}
                    onCheckedChange={(checked) => setMakeInternal(!!checked)}
                  />
                  <Label
                    htmlFor={`internal-${comment.id}`}
                    className="text-[10px] text-muted-foreground cursor-pointer flex items-center gap-1"
                  >
                    <Lock className="h-2.5 w-2.5" />
                    Internal only
                  </Label>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setShowReply(false);
                    setReplyText("");
                    setMakeInternal(isResolved);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className={`h-7 text-xs ${
                    makeInternal ? "bg-yellow-600 hover:bg-yellow-700" : ""
                  }`}
                  onClick={handleSubmitReply}
                  disabled={!replyText.trim() || replyMutation.isPending}
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : makeInternal ? (
                    <Lock className="h-3 w-3 mr-1" />
                  ) : (
                    <Send className="h-3 w-3 mr-1" />
                  )}
                  {makeInternal ? "Add Note" : "Reply"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Attachments - collapsed by default with "View all" */}
        {(attachments.length > 0 || attachmentsLoading) && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            {attachmentsLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading attachments...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 items-center">
                {displayedAttachments.map((att) => (
                  <div key={att.id} className="group w-16">
                    <div className="relative w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted/50">
                      {isImageMime(att.mime_type) && att.signed_url ? (
                        <img
                          src={att.signed_url}
                          alt={att.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {att.signed_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-white hover:bg-white/20"
                            onClick={() => window.open(att.signed_url!, "_blank")}
                            aria-label="Open attachment"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-white hover:bg-white/20"
                          onClick={() => deleteMutation.mutate(att.id)}
                          disabled={deleteMutation.isPending}
                          aria-label="Delete attachment"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div
                      className="mt-1 text-[10px] text-muted-foreground truncate"
                      title={att.filename}
                    >
                      {att.filename}
                    </div>
                  </div>
                ))}

                {/* View all button */}
                {!showAllAttachments && hiddenCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-16 px-3 text-xs"
                    onClick={() => setShowAllAttachments(true)}
                    aria-label={`View all ${attachments.length} attachments`}
                  >
                    <Eye className="h-3 w-3 mr-1" />+{hiddenCount} more
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render nested replies with lighter styling */}
      {hasReplies && (
        <div className="mt-1">
          {comment.replies!.map((reply, replyIdx) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              index={replyIdx}
              projectToken={projectToken}
              isHighlighted={false}
              onJumpToPin={onJumpToPin}
              onResolveToggle={onResolveToggle}
              isResolving={isResolving}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
