import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Circle, MessageCircle, RotateCcw } from "lucide-react";
import type { PrototypeComment } from "./PrototypeViewer";

interface CommentsSidebarProps {
  comments: PrototypeComment[];
  onResolveComment: (commentId: string) => Promise<void>;
  onUnresolveComment: (commentId: string) => Promise<void>;
}

export function CommentsSidebar({
  comments,
  onResolveComment,
  onUnresolveComment,
}: CommentsSidebarProps) {
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const filteredComments = comments.filter((c) => {
    if (filter === "open") return !c.resolved_at;
    if (filter === "resolved") return !!c.resolved_at;
    return true;
  });

  const openCount = comments.filter((c) => !c.resolved_at).length;
  const resolvedCount = comments.filter((c) => c.resolved_at).length;

  const handleResolve = async (commentId: string, isResolved: boolean) => {
    setResolvingId(commentId);
    try {
      if (isResolved) {
        await onUnresolveComment(commentId);
      } else {
        await onResolveComment(commentId);
      }
    } finally {
      setResolvingId(null);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Comments</h3>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          <Button
            variant={filter === "open" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("open")}
            className="flex-1"
          >
            <Circle className="h-3 w-3 mr-1" />
            Open
            {openCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {openCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === "resolved" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("resolved")}
            className="flex-1"
          >
            <Check className="h-3 w-3 mr-1" />
            Resolved
            {resolvedCount > 0 && (
              <Badge variant="outline" className="ml-1 text-xs">
                {resolvedCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredComments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {filter === "open"
                ? "No open comments"
                : filter === "resolved"
                ? "No resolved comments"
                : "No comments yet"}
            </p>
            {filter === "open" && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Click "Add Comment" to pin feedback
              </p>
            )}
          </div>
        ) : (
          filteredComments.map((comment, idx) => {
            const isResolved = !!comment.resolved_at;
            const isResolving = resolvingId === comment.id;

            return (
              <div
                key={comment.id}
                className={`p-3 rounded-lg border transition-colors ${
                  isResolved
                    ? "bg-muted/30 border-border/50"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Pin number */}
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isResolved
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {isResolved ? <Check className="h-3 w-3" /> : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Author and time */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium capitalize">
                        {comment.author_type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(comment.created_at)}
                      </span>
                    </div>

                    {/* Body */}
                    <p
                      className={`text-sm ${
                        isResolved ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {comment.body}
                    </p>

                    {/* Resolve button */}
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleResolve(comment.id, isResolved)}
                        disabled={isResolving}
                      >
                        {isResolving ? (
                          "..."
                        ) : isResolved ? (
                          <>
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reopen
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Resolve
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
