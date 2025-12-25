import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, MessageCircle, X, Check, ExternalLink, Maximize2, Minimize2, ChevronRight, ChevronLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PortalCommentCard } from "./PortalCommentCard";

export interface PrototypeComment {
  id: string;
  prototype_id: string;
  author_type: string;
  body: string;
  pin_x: number | null;
  pin_y: number | null;
  resolved_at: string | null;
  source_message_id: string | null;
  created_at: string;
}

export interface Prototype {
  id: string;
  url: string;
  version_label: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PrototypeViewerProps {
  prototype: Prototype;
  comments: PrototypeComment[];
  token: string;
  onAddComment: (body: string, pinX: number, pinY: number) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
  onUnresolveComment: (commentId: string) => Promise<void>;
  onRefresh: () => void;
}

export function PrototypeViewer({
  prototype,
  comments,
  token,
  onAddComment,
  onResolveComment,
  onUnresolveComment,
  onRefresh,
}: PrototypeViewerProps) {
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  const unresolvedComments = comments.filter((c) => !c.resolved_at);
  const resolvedComments = comments.filter((c) => c.resolved_at);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAddingComment || !overlayRef.current) return;

      const rect = overlayRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setPendingPin({ x, y });
    },
    [isAddingComment]
  );

  const handleSubmitComment = async () => {
    if (!pendingPin || !commentText.trim()) return;

    setSubmitting(true);
    try {
      await onAddComment(commentText.trim(), pendingPin.x, pendingPin.y);
      setPendingPin(null);
      setCommentText("");
      setIsAddingComment(false);
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelComment = () => {
    setPendingPin(null);
    setCommentText("");
    setIsAddingComment(false);
  };

  const handleRefresh = () => {
    setIframeKey((k) => k + 1);
    onRefresh();
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Prototype Preview</h2>
          {prototype.version_label && (
            <Badge variant="secondary" className="text-xs">
              {prototype.version_label}
            </Badge>
          )}
          <Badge
            variant={prototype.status === "approved" ? "default" : "outline"}
            className={prototype.status === "approved" ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
          >
            {prototype.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {unresolvedComments.length} open · {resolvedComments.length} resolved
          </span>
          <Button
            variant={isAddingComment ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAddingComment(!isAddingComment)}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            {isAddingComment ? "Cancel" : "Add Comment"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(prototype.url, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Comment mode instructions */}
      {isAddingComment && !pendingPin && (
        <div className="bg-primary/10 border-b border-primary/20 p-3 text-center text-sm">
          <MessageCircle className="h-4 w-4 inline mr-2" />
          Click anywhere on the prototype to place a comment pin
        </div>
      )}

      {/* Main content with sidebar */}
      <div className={`flex flex-1 ${isFullscreen ? "" : "min-h-[500px]"}`}>
        {/* Prototype iframe with overlay */}
        <div className="relative flex-1">
          <iframe
            key={iframeKey}
            src={prototype.url}
            className="w-full h-full border-0"
            style={{ minHeight: isFullscreen ? "calc(100vh - 120px)" : "500px" }}
            title="Prototype preview"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />

          {/* Pin overlay */}
          <div
            ref={overlayRef}
            className={`absolute inset-0 ${isAddingComment ? "cursor-crosshair" : "pointer-events-none"}`}
            onClick={handleOverlayClick}
          >
            {/* Existing comment pins */}
            {comments.map((comment, idx) => {
              if (comment.pin_x === null || comment.pin_y === null) return null;
              const isResolved = !!comment.resolved_at;

              return (
                <div
                  key={comment.id}
                  className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all hover:scale-110 ${
                    isResolved
                      ? "bg-muted text-muted-foreground border border-border"
                      : "bg-primary text-primary-foreground shadow-lg"
                  }`}
                  style={{ left: `${comment.pin_x}%`, top: `${comment.pin_y}%` }}
                  title={comment.body}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isResolved) {
                      onUnresolveComment(comment.id);
                    } else {
                      onResolveComment(comment.id);
                    }
                  }}
                >
                  {isResolved ? <Check className="h-3 w-3" /> : idx + 1}
                </div>
              );
            })}

            {/* Pending pin */}
            {pendingPin && (
              <div
                className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-pulse shadow-lg"
                style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
              >
                <MessageCircle className="h-3 w-3" />
              </div>
            )}
          </div>

          {/* Comment input popover */}
          {pendingPin && (
            <div
              className="absolute z-10 bg-card border border-border rounded-lg shadow-xl p-3 w-72"
              style={{
                left: `min(${pendingPin.x}%, calc(100% - 300px))`,
                top: `${pendingPin.y}%`,
                transform: "translate(10px, -50%)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Textarea
                placeholder="What's the feedback?"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="mb-2 text-sm"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submitting}
                >
                  {submitting ? "Saving..." : "Add Comment"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelComment}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Sidebar toggle */}
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 z-10 h-8 w-8 p-0"
            onClick={() => setShowCommentsSidebar(!showCommentsSidebar)}
          >
            {showCommentsSidebar ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Comments sidebar */}
        {showCommentsSidebar && (
          <div className="w-80 border-l border-border bg-muted/30 flex flex-col">
            <div className="p-3 border-b border-border">
              <h3 className="font-medium text-sm">Comments</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {unresolvedComments.length} open · {resolvedComments.length} resolved
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No comments yet. Click "Add Comment" to leave feedback.
                  </p>
                ) : (
                  comments.map((comment, idx) => (
                    <PortalCommentCard
                      key={comment.id}
                      token={token}
                      comment={comment}
                      index={idx}
                      onResolve={onResolveComment}
                      onUnresolve={onUnresolveComment}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}