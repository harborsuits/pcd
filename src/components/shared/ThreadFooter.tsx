import { Button } from "@/components/ui/button";
import { Reply, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ThreadStatus = "open" | "in_progress" | "resolved" | "wont_do";

interface ThreadFooterProps {
  replyCount: number;
  lastActivityAt: string | null;
  status: ThreadStatus;
  onAddReply?: () => void;
  showDivider?: boolean;
}

function formatLastActivity(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

function getStatusLabel(status: ThreadStatus): string {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "resolved":
      return "Resolved";
    case "wont_do":
      return "Won't Do";
    default:
      return "Open";
  }
}

export function ThreadFooter({
  replyCount,
  lastActivityAt,
  status,
  onAddReply,
  showDivider = true,
}: ThreadFooterProps) {
  const lastActivity = formatLastActivity(lastActivityAt);
  const statusLabel = getStatusLabel(status);

  return (
    <div className="ml-4 pl-3 border-l-2 border-muted">
      {/* Thread status line */}
      <div className="flex items-center gap-2 pt-2 text-[10px] text-muted-foreground">
        {replyCount > 0 && (
          <>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-2.5 w-2.5" />
              {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </span>
            <span>•</span>
          </>
        )}
        {lastActivity && (
          <>
            <span>last activity {lastActivity}</span>
            <span>•</span>
          </>
        )}
        <span
          className={
            status === "resolved"
              ? "text-green-600 dark:text-green-400"
              : status === "in_progress"
              ? "text-blue-600 dark:text-blue-400"
              : status === "wont_do"
              ? "text-muted-foreground"
              : "text-orange-600 dark:text-orange-400"
          }
        >
          {statusLabel}
        </span>
      </div>

      {/* Add reply button */}
      {onAddReply && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground mt-1 -ml-2"
          onClick={onAddReply}
        >
          <Reply className="h-3 w-3 mr-1" />
          Add reply...
        </Button>
      )}

      {/* Thread separator */}
      {showDivider && <div className="border-b border-border/50 mt-3 -ml-3" />}
    </div>
  );
}
