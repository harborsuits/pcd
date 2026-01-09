import { Badge } from "@/components/ui/badge";
import { Check, Clock, CircleDot, XCircle, Image as ImageIcon, Pencil, MinusCircle, MessageSquare, Paperclip, CornerDownRight } from "lucide-react";

export type CommentStatus = "open" | "in_progress" | "resolved" | "wont_do";

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
  // Snip-first crop fields
  screenshot_full_path?: string | null;
  crop_x?: number | null;
  crop_y?: number | null;
  crop_w?: number | null;
  crop_h?: number | null;
  // Versioning fields
  edited_at?: string | null;
  version_count?: number;
  is_relevant?: boolean;
  // Signed URL from backend
  screenshot_signed_url?: string | null;
  // Threading
  parent_comment_id?: string | null;
  // Nested replies (populated by parent component)
  replies?: CommentData[];
  // Attachment count (populated by parent component)
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
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today at ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${time}`;
}

export function FeedbackCard({
  comment,
  index,
  token,
  onClick,
  isReply = false,
}: FeedbackCardProps) {
  const status = getEffectiveStatus(comment);
  const isResolved = status === "resolved" || status === "wont_do";
  const hasScreenshot = !!comment.screenshot_path || !!comment.screenshot_signed_url;
  const isEdited = !!comment.edited_at;
  const isNotRelevant = comment.is_relevant === false;
  const hasReplies = (comment.replies?.length ?? 0) > 0;
  const hasAttachments = (comment.attachment_count ?? 0) > 0;

  const getStatusBadge = () => {
    switch (status) {
      case "in_progress":
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
            <Clock className="h-2.5 w-2.5 mr-0.5" />
            In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
            <Check className="h-2.5 w-2.5 mr-0.5" />
            Resolved
          </Badge>
        );
      case "wont_do":
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700">
            <XCircle className="h-2.5 w-2.5 mr-0.5" />
            Won't Do
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700">
            <CircleDot className="h-2.5 w-2.5 mr-0.5" />
            Open
          </Badge>
        );
    }
  };

  const getRoleBadge = () => {
    if (comment.author_type === "operator" || comment.author_type === "admin") {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700">
          Operator
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700">
        Client
      </Badge>
    );
  };

  // Get screenshot URL - prefer signed URL, fallback to public URL
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const screenshotUrl = comment.screenshot_signed_url || 
    (comment.screenshot_path ? `${SUPABASE_URL}/storage/v1/object/public/project-media/${comment.screenshot_path}` : null);

  return (
    <div className={isReply ? "ml-4 pl-3 border-l-2 border-border/50" : ""}>
      <div
        onClick={() => onClick?.(comment)}
        className={`p-3 rounded-lg border transition-colors cursor-pointer ${
          isNotRelevant
            ? "bg-muted/30 border-border/30 opacity-60"
            : isResolved
            ? "bg-muted/50 border-border/50"
            : "bg-card border-border hover:border-primary/50 hover:bg-accent/50"
        }`}
      >
        {/* Reply indicator */}
        {isReply && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
            <CornerDownRight className="h-2.5 w-2.5" />
            Reply
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {/* Index badge - hide for replies */}
            {!isReply && (
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  isResolved || isNotRelevant
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {isResolved ? <Check className="h-3 w-3" /> : index + 1}
              </div>
            )}
            
            {/* Type indicator */}
            {hasScreenshot ? (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                <ImageIcon className="h-2.5 w-2.5" />
                {comment.crop_w ? "Snip" : "Screenshot"}
              </Badge>
            ) : (comment.pin_x !== null && comment.pin_y !== null) ? (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 text-muted-foreground">
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
          
          {/* Attachment badge */}
          {hasAttachments && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">
              <Paperclip className="h-2 w-2 mr-0.5" />
              {comment.attachment_count} file{comment.attachment_count !== 1 ? 's' : ''}
            </Badge>
          )}
          
          {/* Reply count badge */}
          {hasReplies && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700">
              <MessageSquare className="h-2 w-2 mr-0.5" />
              {comment.replies!.length} repl{comment.replies!.length !== 1 ? 'ies' : 'y'}
            </Badge>
          )}
          
          {/* Edited badge */}
          {isEdited && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
              <Pencil className="h-2 w-2 mr-0.5" />
              Edited
            </Badge>
          )}
          
          {/* Not relevant badge */}
          {isNotRelevant && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
              <MinusCircle className="h-2 w-2 mr-0.5" />
              Not Relevant
            </Badge>
          )}
        </div>

        {/* Body - truncated preview */}
        <p className={`text-sm mb-2 line-clamp-2 ${isResolved || isNotRelevant ? "text-muted-foreground" : ""}`}>
          {comment.body}
        </p>

        {/* Screenshot thumbnail - compact preview */}
        {screenshotUrl && (
          <div className="relative w-full rounded-md overflow-hidden border border-border mb-2">
            <img
              src={screenshotUrl}
              alt="Screenshot"
              className="w-full h-auto object-cover max-h-20"
            />
          </div>
        )}

        {/* Click to view hint */}
        <div className="text-[10px] text-muted-foreground text-center pt-1">
          Click to view details
        </div>
      </div>
      
      {/* Render nested replies */}
      {hasReplies && (
        <div className="mt-2 space-y-2">
          {comment.replies!.map((reply, replyIdx) => (
            <FeedbackCard
              key={reply.id}
              comment={reply}
              index={replyIdx}
              token={token}
              onClick={onClick}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
