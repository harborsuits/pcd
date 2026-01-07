import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, CircleDot, XCircle, Image as ImageIcon } from "lucide-react";

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
}

interface FeedbackCardProps {
  comment: CommentData;
  index: number;
  token: string;
  onResolve: (id: string) => void;
  onUnresolve: (id: string) => void;
  onMarkInProgress: (id: string) => void;
  onViewScreenshot: (comment: CommentData) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
  onResolve,
  onUnresolve,
  onMarkInProgress,
  onViewScreenshot,
}: FeedbackCardProps) {
  const status = getEffectiveStatus(comment);
  const isResolved = status === "resolved" || status === "wont_do";
  const isInProgress = status === "in_progress";
  const hasScreenshot = !!comment.screenshot_path;
  const isClient = comment.author_type === "client";

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

  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        isResolved
          ? "bg-muted/50 border-border/50"
          : "bg-card border-border hover:border-primary/50"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {/* Index badge */}
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              isResolved
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {isResolved ? <Check className="h-3 w-3" /> : index + 1}
          </div>
          
          {/* Type indicator */}
          {hasScreenshot ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
              <ImageIcon className="h-2.5 w-2.5" />
              Screenshot
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
      </div>

      {/* Body */}
      <p className={`text-sm mb-2 line-clamp-3 ${isResolved ? "text-muted-foreground" : ""}`}>
        {comment.body}
      </p>

      {/* Screenshot thumbnail */}
      {hasScreenshot && (
        <button
          onClick={() => onViewScreenshot(comment)}
          className="relative group w-full max-w-[160px] rounded-md overflow-hidden border border-border hover:border-primary transition-colors mb-2"
        >
          <img
            src={`${SUPABASE_URL}/storage/v1/object/public/project-media/${comment.screenshot_path}`}
            alt="Screenshot"
            className="w-full h-auto object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-medium">View</span>
          </div>
          {/* Pin marker on thumbnail */}
          {comment.pin_x !== null && comment.pin_y !== null && (
            <div
              className="absolute w-2.5 h-2.5 bg-primary rounded-full border border-white shadow"
              style={{
                left: `${comment.pin_x}%`,
                top: `${comment.pin_y}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}
        </button>
      )}

      {/* Resolution note */}
      {comment.resolution_note && (
        <div className="mb-2 p-2 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-0.5">Resolution:</p>
          <p className="text-xs text-green-600 dark:text-green-300">{comment.resolution_note}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1">
        {isResolved ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
            onClick={() => onUnresolve(comment.id)}
          >
            Reopen
          </Button>
        ) : (
          <>
            {!isInProgress && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => onMarkInProgress(comment.id)}
              >
                <Clock className="h-3 w-3 mr-1" />
                Working
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
              onClick={() => onResolve(comment.id)}
            >
              <Check className="h-3 w-3 mr-1" />
              Resolve
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
