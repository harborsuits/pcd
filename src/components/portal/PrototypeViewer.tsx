import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, MessageCircle, X, Check, ExternalLink, Maximize2, Minimize2, ChevronRight, ChevronLeft, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PortalCommentCard } from "./PortalCommentCard";

// Determine breakpoint from viewport width
function getBreakpoint(width: number): string {
  if (width < 640) return "sm";
  if (width < 768) return "md";
  if (width < 1024) return "lg";
  return "xl";
}

// Check if URL is same-origin
function isSameOrigin(url: string): boolean {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin === window.location.origin;
  } catch {
    return false;
  }
}

// Extract pathname from URL
function getPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.pathname;
  } catch {
    return null;
  }
}

export type CommentStatus = "open" | "in_progress" | "resolved" | "wont_do";

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
  // Status workflow fields
  status?: CommentStatus;
  resolution_note?: string | null;
  resolved_by?: string | null;
  // Anchor fields
  page_url?: string | null;
  page_path?: string | null;
  scroll_y?: number | null;
  viewport_w?: number | null;
  viewport_h?: number | null;
  breakpoint?: string | null;
  anchor_id?: string | null;
  anchor_selector?: string | null;
  x_pct?: number | null;
  y_pct?: number | null;
  text_hint?: string | null;
}

export interface Prototype {
  id: string;
  url: string;
  version_label: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CommentAnchorData {
  page_url: string;
  page_path: string | null;
  scroll_y: number;
  viewport_w: number;
  viewport_h: number;
  breakpoint: string;
  anchor_id: string | null;
  anchor_selector: string | null;
  x_pct: number;
  y_pct: number;
  text_hint: string | null;
  // Fallback overlay coords
  pin_x: number;
  pin_y: number;
}

interface PrototypeViewerProps {
  prototype: Prototype;
  comments: PrototypeComment[];
  token: string;
  onAddComment: (body: string, pinX: number, pinY: number, anchorData?: CommentAnchorData) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
  onUnresolveComment: (commentId: string) => Promise<void>;
  onEditComment?: (commentId: string, newBody: string) => Promise<void>;
  onRefresh: () => void;
}

export function PrototypeViewer({
  prototype,
  comments,
  token,
  onAddComment,
  onResolveComment,
  onUnresolveComment,
  onEditComment,
  onRefresh,
}: PrototypeViewerProps) {
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number; anchorData?: CommentAnchorData } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(true);
  const [currentIframePath, setCurrentIframePath] = useState<string | null>(null);
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);
  const [anchorMismatch, setAnchorMismatch] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const unresolvedComments = comments.filter((c) => !c.resolved_at);
  const resolvedComments = comments.filter((c) => c.resolved_at);

  // Track current iframe path for same-origin prototypes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !isSameOrigin(prototype.url)) return;

    const handleLoad = () => {
      try {
        const path = iframe.contentWindow?.location.pathname ?? null;
        setCurrentIframePath(path);
      } catch {
        // Cross-origin, can't read
        setCurrentIframePath(null);
      }
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [prototype.url, iframeKey]);

  // Capture rich anchor data from click position
  const captureAnchorData = useCallback((clientX: number, clientY: number): CommentAnchorData | null => {
    const iframe = iframeRef.current;
    const overlay = overlayRef.current;
    if (!iframe || !overlay) return null;

    const overlayRect = overlay.getBoundingClientRect();
    const pin_x = ((clientX - overlayRect.left) / overlayRect.width) * 100;
    const pin_y = ((clientY - overlayRect.top) / overlayRect.height) * 100;

    const baseData: CommentAnchorData = {
      page_url: prototype.url,
      page_path: getPathFromUrl(prototype.url),
      scroll_y: 0,
      viewport_w: overlayRect.width,
      viewport_h: overlayRect.height,
      breakpoint: getBreakpoint(overlayRect.width),
      anchor_id: null,
      anchor_selector: null,
      x_pct: pin_x,
      y_pct: pin_y,
      text_hint: null,
      pin_x,
      pin_y,
    };

    // Try to get rich anchor data for same-origin iframes
    if (isSameOrigin(prototype.url)) {
      try {
        const iframeDoc = iframe.contentDocument;
        const iframeWin = iframe.contentWindow;
        if (!iframeDoc || !iframeWin) return baseData;

        // Update page path and scroll from iframe
        baseData.page_path = iframeWin.location.pathname;
        baseData.page_url = iframeWin.location.href;
        baseData.scroll_y = iframeWin.scrollY;

        // Get iframe rect to calculate position inside iframe
        const iframeRect = iframe.getBoundingClientRect();
        const xInIframe = clientX - iframeRect.left;
        const yInIframe = clientY - iframeRect.top + iframeWin.scrollY;

        // Find element at click position (accounting for scroll)
        const element = iframeDoc.elementFromPoint(
          clientX - iframeRect.left,
          clientY - iframeRect.top
        );

        if (element) {
          // Walk up to find closest anchor
          let anchorEl: Element | null = element;
          while (anchorEl && anchorEl !== iframeDoc.body) {
            const anchorAttr = anchorEl.getAttribute("data-comment-anchor");
            const id = anchorEl.id;
            
            if (anchorAttr) {
              baseData.anchor_id = anchorAttr;
              baseData.anchor_selector = `[data-comment-anchor="${anchorAttr}"]`;
              break;
            } else if (id) {
              baseData.anchor_id = id;
              baseData.anchor_selector = `#${id}`;
              break;
            }
            anchorEl = anchorEl.parentElement;
          }

          // If we found an anchor, calculate position relative to it
          if (baseData.anchor_selector && anchorEl) {
            const anchorRect = anchorEl.getBoundingClientRect();
            baseData.x_pct = ((xInIframe - anchorRect.left) / anchorRect.width) * 100;
            baseData.y_pct = ((yInIframe - anchorRect.top - iframeWin.scrollY) / anchorRect.height) * 100;
          }

          // Get text hint from nearby content
          const textContent = element.textContent?.trim().slice(0, 50);
          if (textContent) {
            baseData.text_hint = textContent;
          }
        }
      } catch (err) {
        console.warn("Could not capture anchor data from iframe:", err);
      }
    }

    return baseData;
  }, [prototype.url]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAddingComment || !overlayRef.current) return;

      const anchorData = captureAnchorData(e.clientX, e.clientY);
      if (!anchorData) return;

      setPendingPin({
        x: anchorData.pin_x,
        y: anchorData.pin_y,
        anchorData,
      });
    },
    [isAddingComment, captureAnchorData]
  );

  const handleSubmitComment = async () => {
    if (!pendingPin || !commentText.trim()) return;

    setSubmitting(true);
    try {
      await onAddComment(
        commentText.trim(),
        pendingPin.x,
        pendingPin.y,
        pendingPin.anchorData
      );
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
    setFocusedCommentId(null);
    setAnchorMismatch(null);
    onRefresh();
  };

  // Navigate iframe to comment's page and scroll to anchor
  const focusComment = useCallback(async (comment: PrototypeComment) => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setFocusedCommentId(comment.id);
    setAnchorMismatch(null);

    // If comment has a page path and iframe is same-origin
    if (comment.page_path && isSameOrigin(prototype.url)) {
      try {
        const currentPath = iframe.contentWindow?.location.pathname;
        
        // Navigate if not on the right page
        if (currentPath !== comment.page_path) {
          const targetUrl = new URL(comment.page_path, window.location.origin).href;
          iframe.src = targetUrl;
          
          // Wait for load
          await new Promise<void>((resolve) => {
            const handleLoad = () => {
              iframe.removeEventListener("load", handleLoad);
              resolve();
            };
            iframe.addEventListener("load", handleLoad);
          });
        }

        const iframeWin = iframe.contentWindow;
        const iframeDoc = iframe.contentDocument;
        if (!iframeWin || !iframeDoc) return;

        // Try to find anchor element
        if (comment.anchor_selector) {
          const anchorEl = iframeDoc.querySelector(comment.anchor_selector);
          if (anchorEl) {
            // Scroll anchor into view
            anchorEl.scrollIntoView({ behavior: "smooth", block: "center" });
            
            // Highlight briefly
            anchorEl.classList.add("comment-anchor-highlight");
            setTimeout(() => anchorEl.classList.remove("comment-anchor-highlight"), 2000);
          } else {
            // Anchor not found - show mismatch warning
            setAnchorMismatch(comment.id);
            
            // Fallback to scroll_y if available
            if (comment.scroll_y != null) {
              iframeWin.scrollTo({ top: comment.scroll_y, behavior: "smooth" });
            }
          }
        } else if (comment.scroll_y != null) {
          // No anchor, just scroll to saved position
          iframeWin.scrollTo({ top: comment.scroll_y, behavior: "smooth" });
        }
      } catch (err) {
        console.warn("Could not focus comment:", err);
      }
    }
  }, [prototype.url]);

  // Calculate pin position for a comment
  const getPinPosition = useCallback((comment: PrototypeComment): { left: string; top: string } | null => {
    // If this comment is focused and we have anchor data, try to position precisely
    if (focusedCommentId === comment.id && comment.anchor_selector && isSameOrigin(prototype.url)) {
      try {
        const iframe = iframeRef.current;
        const overlay = overlayRef.current;
        const iframeDoc = iframe?.contentDocument;
        const iframeWin = iframe?.contentWindow;
        
        if (iframe && overlay && iframeDoc && iframeWin) {
          const anchorEl = iframeDoc.querySelector(comment.anchor_selector);
          if (anchorEl && comment.x_pct != null && comment.y_pct != null) {
            const anchorRect = anchorEl.getBoundingClientRect();
            const overlayRect = overlay.getBoundingClientRect();
            const iframeRect = iframe.getBoundingClientRect();
            
            // Calculate absolute position within overlay
            const absX = iframeRect.left - overlayRect.left + anchorRect.left + (anchorRect.width * comment.x_pct / 100);
            const absY = iframeRect.top - overlayRect.top + anchorRect.top + (anchorRect.height * comment.y_pct / 100);
            
            const leftPct = (absX / overlayRect.width) * 100;
            const topPct = (absY / overlayRect.height) * 100;
            
            return { left: `${leftPct}%`, top: `${topPct}%` };
          }
        }
      } catch {
        // Fall through to fallback
      }
    }
    
    // Fallback to stored pin_x/pin_y
    if (comment.pin_x != null && comment.pin_y != null) {
      return { left: `${comment.pin_x}%`, top: `${comment.pin_y}%` };
    }
    
    return null;
  }, [focusedCommentId, prototype.url]);

  // Filter comments to show only those matching current iframe path
  const visibleComments = comments.filter((c) => {
    // If no page_path stored, always show (legacy comments)
    if (!c.page_path) return true;
    // If we can't determine current path, show all
    if (!currentIframePath) return true;
    // Match path
    return c.page_path === currentIframePath;
  });

  const hiddenCommentsCount = comments.length - visibleComments.length;

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
          {currentIframePath && (
            <Badge variant="outline" className="text-xs font-mono">
              {currentIframePath}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {unresolvedComments.length} open · {resolvedComments.length} resolved
            {hiddenCommentsCount > 0 && ` · ${hiddenCommentsCount} on other pages`}
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

      {/* Anchor mismatch warning */}
      {anchorMismatch && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-3 text-center text-sm text-amber-600">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          This comment's anchor element was not found. The site may have changed since the comment was added.
        </div>
      )}

      {/* Main content with sidebar */}
      <div className={`flex flex-1 ${isFullscreen ? "" : "min-h-[500px]"}`}>
        {/* Prototype iframe with overlay */}
        <div className="relative flex-1">
          <iframe
            ref={iframeRef}
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
            {/* Existing comment pins - only show visible ones */}
            {visibleComments.map((comment, idx) => {
              const position = getPinPosition(comment);
              if (!position) return null;
              
              const isResolved = !!comment.resolved_at;
              const isFocused = focusedCommentId === comment.id;
              const hasMismatch = anchorMismatch === comment.id;

              return (
                <div
                  key={comment.id}
                  className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all hover:scale-110 ${
                    isFocused
                      ? "ring-2 ring-primary ring-offset-2 scale-125"
                      : ""
                  } ${
                    hasMismatch
                      ? "bg-amber-500 text-white"
                      : isResolved
                      ? "bg-muted text-muted-foreground border border-border"
                      : "bg-primary text-primary-foreground shadow-lg"
                  }`}
                  style={position}
                  title={`${comment.body}${comment.page_path ? ` (${comment.page_path})` : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open comments sidebar and focus this comment
                    setShowCommentsSidebar(true);
                    setFocusedCommentId(comment.id);
                  }}
                >
                  {hasMismatch ? <AlertTriangle className="h-3 w-3" /> : isResolved ? <Check className="h-3 w-3" /> : idx + 1}
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
              {pendingPin.anchorData?.anchor_id && (
                <div className="mb-2 text-xs text-muted-foreground">
                  Anchored to: <code className="bg-muted px-1 rounded">{pendingPin.anchorData.anchor_id}</code>
                </div>
              )}
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
                    <div
                      key={comment.id}
                      className={`cursor-pointer transition-all ${
                        focusedCommentId === comment.id ? "ring-2 ring-primary rounded-lg" : ""
                      }`}
                      onClick={() => focusComment(comment)}
                    >
                      {/* Page badge */}
                      {comment.page_path && (
                        <div className="mb-1">
                          <Badge variant="outline" className="text-xs font-mono">
                            {comment.page_path}
                          </Badge>
                          {comment.breakpoint && (
                            <Badge variant="secondary" className="text-xs ml-1">
                              {comment.breakpoint}
                            </Badge>
                          )}
                        </div>
                      )}
                      <PortalCommentCard
                        token={token}
                        comment={comment}
                        index={idx}
                        onResolve={onResolveComment}
                        onUnresolve={onUnresolveComment}
                        onEdit={onEditComment}
                      />
                    </div>
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
