import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  Clock,
  CircleDot,
  XCircle,
  Image as ImageIcon,
  Pencil,
  MinusCircle,
  MessageSquare,
  Paperclip,
  CornerDownRight,
  Loader2,
  RefreshCw,
  Reply,
  Eye,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { isReplyComment } from "@/lib/threading";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type CommentStatus = "open" | "in_progress" | "resolved" | "wont_do";

interface Attachment {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  signed_url: string | null;
}

export interface CommentData {
  id: string;
  prototype_id: string;
  author_type: string;
  body: string;
  pin_x: number | null;
  pin_y: number | null;
  resolved_at: string | null;
  created_at: string;
  status?: CommentStatus;
  resolution_note?: string | null;
  resolved_by?: string | null;
  archived_at?: string | null;
  screenshot_path?: string | null;
  screenshot_media_id?: string | null;
  screenshot_w?: number | null;
  screenshot_h?: number | null;
  screenshot_full_path?: string | null;
  crop_x?: number | null;
  crop_y?: number | null;
  crop_w?: number | null;
  crop_h?: number | null;
  edited_at?: string | null;
  version_count?: number;
  is_relevant?: boolean;
  screenshot_signed_url?: string | null;
  parent_comment_id?: string | null;
  thread_root_id?: string | null;
  last_activity_at?: string | null;
  client_confirmed_at?: string | null;
  client_confirmed_by?: string | null;
  replies?: CommentData[];
  attachment_count?: number;
}

interface FeedbackCardProps {
  comment: CommentData;
  index: number;
  token: string;
  onClick?: (comment: CommentData) => void;
  isReply?: boolean;
}

function getEffectiveStatus(c: CommentData): CommentStatus {
  if (c.status === "wont_do") return "wont_do";
  if (c.status === "resolved" || c.resolved_at) return "resolved";
  if (c.status === "in_progress") return "in_progress";
  return "open";
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function FeedbackCard({
  comment,
  index,
  token,
  onClick,
  isReply: isReplyProp,
}: FeedbackCardProps) {
  const isMobile = useIsMobile();

  // Derive isReply from comment data, fallback to prop for backward compat
  const derivedIsReply = isReplyComment(comment);
  const isReplyFinal = isReplyProp ?? derivedIsReply;

  const status = getEffectiveStatus(comment);
  const isResolved = status === "resolved" || status === "wont_do";
  const hasScreenshot =
    !!comment.screenshot_path || !!comment.screenshot_signed_url;
  const isEdited = !!comment.edited_at;
  const isNotRelevant = comment.is_relevant === false;
  const hasReplies = (comment.replies?.length ?? 0) > 0;

  const [screenshotError, setScreenshotError] = useState(false);
  const [refreshedUrl, setRefreshedUrl] = useState<string | null>(null);
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const [attachmentErrors, setAttachmentErrors] = useState<
    Record<string, boolean>
  >({});
  const [refreshedAttachmentUrls, setRefreshedAttachmentUrls] = useState<
    Record<string, string>
  >({});
  const [showAllAttachments, setShowAllAttachments] = useState(false);

  const {
    data: attachmentsData,
    isLoading: loadingAttachments,
    refetch: refetchAttachments,
  } = useQuery({
    queryKey: ["portal-comment-attachments", token, comment.id],
    queryFn: async () => {
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
    staleTime: 30000,
  });

  const attachments = attachmentsData?.attachments || [];
  const hasAttachments = attachments.length > 0;
  const displayedAttachments = showAllAttachments
    ? attachments
    : attachments.slice(0, 3);
  const hiddenCount = attachments.length - 3;

  const handleScreenshotError = useCallback(async () => {
    if (refreshAttempted) return;
    setRefreshAttempted(true);
    setScreenshotError(true);

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/comments?prototype_id=${comment.prototype_id}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const refreshedComment = data.comments?.find(
          (c: CommentData) => c.id === comment.id
        );
        if (refreshedComment?.screenshot_signed_url) {
          setRefreshedUrl(refreshedComment.screenshot_signed_url);
          setScreenshotError(false);
        }
      }
    } catch (err) {
      console.error("[FeedbackCard] Failed to refresh signed URL:", err);
    }
  }, [token, comment.prototype_id, comment.id, refreshAttempted]);

  const handleAttachmentError = useCallback(
    async (attachmentId: string) => {
      if (attachmentErrors[attachmentId]) return;

      setAttachmentErrors((prev) => ({ ...prev, [attachmentId]: true }));

      try {
        const result = await refetchAttachments();
        if (result.data?.attachments) {
          const refreshedAtt = result.data.attachments.find(
            (a) => a.id === attachmentId
          );
          if (refreshedAtt?.signed_url) {
            setRefreshedAttachmentUrls((prev) => ({
              ...prev,
              [attachmentId]: refreshedAtt.signed_url!,
            }));
            setAttachmentErrors((prev) => ({ ...prev, [attachmentId]: false }));
          }
        }
      } catch (err) {
        console.error("[FeedbackCard] Failed to refresh attachment URL:", err);
      }
    },
    [attachmentErrors, refetchAttachments]
  );

  const getStatusBadge = () => {
    switch (status) {
      case "in_progress":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
          >
            <Clock className="h-2.5 w-2.5 mr-0.5" />
            In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
          >
            <Check className="h-2.5 w-2.5 mr-0.5" />
            Resolved
          </Badge>
        );
      case "wont_do":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700"
          >
            <XCircle className="h-2.5 w-2.5 mr-0.5" />
            Won't Do
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700"
          >
            <CircleDot className="h-2.5 w-2.5 mr-0.5" />
            Open
          </Badge>
        );
    }
  };

  const getRoleBadge = () => {
    if (
      comment.author_type === "operator" ||
      comment.author_type === "admin"
    ) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700"
        >
          Operator
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-[10px] px-1.5 py-0 bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700"
      >
        Client
      </Badge>
    );
  };

  const screenshotUrl =
    refreshedUrl ||
    comment.screenshot_signed_url ||
    (comment.screenshot_path
      ? `${SUPABASE_URL}/storage/v1/object/public/project-media/${comment.screenshot_path}`
      : null);

  // Root comment styling: stronger visual weight
  // Reply styling: lighter, timeline-style
  if (isReplyFinal) {
    // ========== REPLY CARD (Lighter Style) ==========
    return (
      <div className="ml-4 pl-3 border-l-2 border-muted py-2 group">
        <div
          onClick={() => onClick?.(comment)}
          className={`cursor-pointer rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50 ${
            isNotRelevant ? "opacity-60" : ""
          }`}
        >
          {/* Compact header: author + time inline */}
          <div className="flex items-center gap-2 mb-1">
            <CornerDownRight className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {comment.author_type === "client" ? "Client" : "Operator"} •{" "}
              {formatTime(comment.created_at)}
            </span>
            {isEdited && (
              <span title="Edited">
                <Pencil className="h-2 w-2 text-amber-500" />
              </span>
            )}
          </div>

          {/* Body - compact */}
          <p
            className={`text-sm line-clamp-2 ${
              isResolved || isNotRelevant
                ? "text-muted-foreground line-through"
                : ""
            }`}
          >
            {comment.body}
          </p>

          {/* Minimal attachment indicator */}
          {hasAttachments && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
              <Paperclip className="h-2.5 w-2.5" />
              {attachments.length} file{attachments.length !== 1 ? "s" : ""}
            </div>
          )}

          {/* Hover-only action (Reply) - hidden on mobile, always visible there */}
          <div
            className={`mt-1.5 ${
              isMobile
                ? "flex items-center gap-1"
                : "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(comment);
              }}
              aria-label="Reply to this comment"
            >
              <Reply className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ========== ROOT CARD (Heavier Style) ==========
  return (
    <div className="mb-4">
      <div
        onClick={() => onClick?.(comment)}
        className={`p-3 rounded-lg border-l-4 border transition-colors cursor-pointer ${
          isNotRelevant
            ? "bg-muted/30 border-l-muted border-border/30 opacity-60"
            : isResolved
            ? "bg-muted/50 border-l-muted border-border/50"
            : "bg-card border-l-primary border-border hover:border-primary/50 hover:bg-accent/30"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {/* Larger index badge for root */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isResolved || isNotRelevant
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isResolved ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </div>

            {/* Type indicator */}
            {hasScreenshot ? (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 gap-0.5"
              >
                <ImageIcon className="h-2.5 w-2.5" />
                {comment.crop_w ? "Snip" : "Screenshot"}
              </Badge>
            ) : comment.pin_x !== null && comment.pin_y !== null ? (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 gap-0.5 text-muted-foreground"
              >
                📍 Pinned
              </Badge>
            ) : null}
          </div>

          <span className="text-[10px] text-muted-foreground">
            {formatTime(comment.created_at)}
          </span>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {getRoleBadge()}
          {getStatusBadge()}

          {loadingAttachments ? (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700"
            >
              <Loader2 className="h-2 w-2 mr-0.5 animate-spin" />
              Loading...
            </Badge>
          ) : (
            hasAttachments && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700"
              >
                <Paperclip className="h-2 w-2 mr-0.5" />
                {attachments.length} file{attachments.length !== 1 ? "s" : ""}
              </Badge>
            )
          )}

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

          {isEdited && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
            >
              <Pencil className="h-2 w-2 mr-0.5" />
              Edited
            </Badge>
          )}

          {isNotRelevant && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
            >
              <MinusCircle className="h-2 w-2 mr-0.5" />
              Not Relevant
            </Badge>
          )}
        </div>

        {/* Body */}
        <p
          className={`text-sm mb-2 line-clamp-2 ${
            isResolved || isNotRelevant ? "text-muted-foreground" : ""
          }`}
        >
          {comment.body}
        </p>

        {/* Screenshot - 1 large preview */}
        {screenshotUrl && (
          <div className="relative w-full rounded-md overflow-hidden border border-border mb-2">
            {screenshotError && refreshAttempted && !refreshedUrl ? (
              <div className="w-full h-20 flex items-center justify-center bg-muted/50 text-muted-foreground text-xs gap-1">
                <RefreshCw className="h-3 w-3" />
                Image unavailable
              </div>
            ) : (
              <img
                src={screenshotUrl}
                alt="Screenshot"
                className="w-full h-auto object-cover max-h-20"
                onError={handleScreenshotError}
              />
            )}
          </div>
        )}

        {/* Attachments - collapsed by default with "View all" */}
        {hasAttachments && (
          <div className="mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {displayedAttachments.map((att) => {
                const attUrl =
                  refreshedAttachmentUrls[att.id] || att.signed_url;
                const hasError =
                  attachmentErrors[att.id] && !refreshedAttachmentUrls[att.id];

                return (
                  <div
                    key={att.id}
                    className="relative w-10 h-10 rounded-md border border-border overflow-hidden bg-muted/50"
                    title={att.filename}
                  >
                    {att.mime_type.startsWith("image/") &&
                    attUrl &&
                    !hasError ? (
                      <img
                        src={attUrl}
                        alt={att.filename}
                        className="w-full h-full object-cover"
                        onError={() => handleAttachmentError(att.id)}
                      />
                    ) : hasError ? (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">
                        <RefreshCw className="h-2.5 w-2.5" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">
                        📎
                      </div>
                    )}
                  </div>
                );
              })}

              {!showAllAttachments && hiddenCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllAttachments(true);
                  }}
                  aria-label={`View all ${attachments.length} attachments`}
                >
                  <Eye className="h-3 w-3 mr-1" />+{hiddenCount} more
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Click to view hint */}
        <div className="text-[10px] text-muted-foreground text-center pt-1">
          Click to view details
        </div>
      </div>

      {/* Render nested replies with lighter styling */}
      {hasReplies && (
        <div className="mt-1">
          {comment.replies!.map((reply, replyIdx) => (
            <FeedbackCard
              key={reply.id}
              comment={reply}
              index={replyIdx}
              token={token}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
