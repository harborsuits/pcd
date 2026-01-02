import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, MessageCircle, X, ExternalLink, Maximize2, Minimize2, ChevronRight, ChevronLeft, AlertTriangle, Target, ChevronUp, ChevronDown, Archive, ArchiveRestore } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PortalCommentCard } from "./PortalCommentCard";
import { toast } from "@/hooks/use-toast";
// Determine breakpoint from viewport width
function getBreakpoint(width: number): string {
  if (width < 640) return "sm";
  if (width < 768) return "md";
  if (width < 1024) return "lg";
  return "xl";
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
  status?: CommentStatus;
  resolution_note?: string | null;
  resolved_by?: string | null;
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
  text_offset?: number | null;
  text_context?: string | null;
  archived_at?: string | null;
}

function getEffectiveStatus(c: PrototypeComment): CommentStatus {
  if (c.status === "wont_do") return "wont_do";
  if (c.status === "resolved" || !!c.resolved_at) return "resolved";
  if (c.status === "in_progress") return "in_progress";
  return "open";
}

export interface Prototype {
  id: string;
  url: string;
  version_label: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// PostMessage types
interface IframeClickMessage {
  type: "PCD_CLICK";
  selector: string | null;
  id: string | null;
  anchorKey: string | null;
  rect: { left: number; top: number; width: number; height: number };
  scroll: { x: number; y: number };
  viewport: { w: number; h: number };
  textOffset?: number | null;
  textContext?: string | null;
  textHint?: string | null;
  ts: number;
}

interface IframeScrollMessage {
  type: "PCD_SCROLL";
  scroll: { x: number; y: number };
  viewport: { w: number; h: number };
}

interface IframeRectMessage {
  type: "PCD_RECT";
  requestId: string;
  rect: { left: number; top: number; width: number; height: number } | null;
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
  text_offset?: number | null;
  text_context?: string | null;
  pin_x: number;
  pin_y: number;
}

export type PinPositionResult = 
  | { kind: 'visible'; left: number; top: number }
  | { kind: 'offscreen'; direction: 'up' | 'down' | 'left' | 'right'; edgeLeft: number; edgeTop: number }
  | { kind: 'no-bridge' }
  | { kind: 'no-anchor' }
  | null;

interface PrototypeViewerProps {
  prototype: Prototype;
  comments: PrototypeComment[];
  token: string;
  onAddComment: (body: string, pinX: number, pinY: number, anchorData?: CommentAnchorData) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
  onUnresolveComment: (commentId: string) => Promise<void>;
  onMarkInProgress?: (commentId: string) => Promise<void>;
  onEditComment?: (commentId: string, newBody: string) => Promise<void>;
  onRepinComment?: (commentId: string, anchorData: CommentAnchorData) => Promise<void>;
  onArchiveComment?: (commentId: string) => Promise<void>;
  onUnarchiveComment?: (commentId: string) => Promise<void>;
  onRefresh: () => void;
}

export function PrototypeViewer({
  prototype,
  comments,
  token,
  onAddComment,
  onResolveComment,
  onUnresolveComment,
  onMarkInProgress,
  onEditComment,
  onRepinComment,
  onArchiveComment,
  onUnarchiveComment,
  onRefresh,
}: PrototypeViewerProps) {
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ anchorData: CommentAnchorData } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(true);
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [repinTargetId, setRepinTargetId] = useState<string | null>(null);
  const [clickFeedback, setClickFeedback] = useState<{ x: number; y: number } | null>(null);
  
  // Debug HUD state
  const PCD_DEBUG = typeof window !== "undefined" && 
    (new URLSearchParams(window.location.search).get("pcd_debug") === "1" ||
     window.localStorage?.getItem("pcd_debug") === "1");
  const [pcdHud, setPcdHud] = useState<{
    bridgeReady: boolean;
    acceptedOrigin: string | null;
    iframeOrigin: string | null;
    lastType: string | null;
    lastTs: number | null;
    lastSelector?: string | null;
    lastAnchorKey?: string | null;
    lastNote?: string | null;
  }>({
    bridgeReady: false,
    acceptedOrigin: null,
    iframeOrigin: null,
    lastType: null,
    lastTs: null,
  });
  const overlayRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Bridge state
  const [bridgeReady, setBridgeReady] = useState(false);
  const [iframeViewport, setIframeViewport] = useState<{ w: number; h: number; scrollX: number; scrollY: number } | null>(null);
  const lastIframeClick = useRef<IframeClickMessage | null>(null);
  
  // Rect cache: commentId → element rect in iframe viewport coords
  const [rectCache, setRectCache] = useState<Record<string, { left: number; top: number; width: number; height: number } | null>>({});
  const pendingRectRequests = useRef<Map<string, (rect: { left: number; top: number; width: number; height: number } | null) => void>>(new Map());
  const rectRefreshRaf = useRef<number | null>(null);

  // Filter out archived comments from main views
  const activeComments = comments.filter((c) => !c.archived_at);
  const unresolvedComments = activeComments.filter((c) => !c.resolved_at && c.status !== 'resolved' && c.status !== 'wont_do');
  const resolvedComments = activeComments.filter((c) => c.resolved_at || c.status === 'resolved' || c.status === 'wont_do');

  // Get the actual iframe src origin (more reliable than prototype.url)
  const getIframeOrigin = useCallback(() => {
    try {
      const src = iframeRef.current?.src;
      return src ? new URL(src).origin : null;
    } catch {
      return null;
    }
  }, []);

  // PostMessage handler - THE ONLY way we communicate with the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const iframeOrigin = getIframeOrigin();
      
      // Accept from iframe origin OR if we don't have one yet, check against prototype.url
      const acceptedOrigin = iframeOrigin || (() => {
        try { return new URL(prototype.url).origin; } catch { return null; }
      })();

      // Update HUD with origin info
      if (PCD_DEBUG) {
        setPcdHud(s => ({
          ...s,
          iframeOrigin: iframeOrigin ?? null,
          acceptedOrigin: acceptedOrigin ?? null,
          lastNote: `recv origin=${event.origin}`,
        }));
      }
      
      if (!acceptedOrigin || event.origin !== acceptedOrigin) {
        // Log rejection for debugging
        if (PCD_DEBUG) {
          setPcdHud(s => ({
            ...s,
            lastType: "REJECTED",
            lastTs: Date.now(),
            lastNote: `rejected: got=${event.origin} expected=${acceptedOrigin}`,
          }));
        }
        return;
      }

      const data = event.data;
      if (!data || typeof data !== "object") return;
      
      // Only accept PCD messages (with marker or type prefix)
      if (!data.__pcd && !(typeof data.type === "string" && data.type.startsWith("PCD_"))) return;
      
      // Log all PCD messages for debugging
      console.log("[Bridge] Received:", data.type, data);

      // Update HUD with message info
      if (PCD_DEBUG) {
        setPcdHud(s => ({
          ...s,
          lastType: data.type ?? "NO_TYPE",
          lastTs: Date.now(),
          lastSelector: (data.selector ?? "").slice(0, 100),
          lastAnchorKey: data.anchorKey ?? null,
        }));
      }

      switch (data.type) {
        case "PCD_IFRAME_READY":
          console.log("[Bridge] Helper ready");
          setBridgeReady(true);
          if (PCD_DEBUG) {
            setPcdHud(s => ({ ...s, bridgeReady: true }));
          }
          break;

        case "PCD_CLICK": {
          const msg = data as IframeClickMessage;
          console.log("[Bridge] Click:", msg.selector, msg.anchorKey);
          lastIframeClick.current = msg;
          // Dispatch custom event so handleIframeClick can pick it up
          window.dispatchEvent(new CustomEvent("pcd-iframe-click", { detail: msg }));
          break;
        }

        case "PCD_SCROLL": {
          const msg = data as IframeScrollMessage;
          setIframeViewport({
            w: msg.viewport.w,
            h: msg.viewport.h,
            scrollX: msg.scroll.x,
            scrollY: msg.scroll.y,
          });
          break;
        }

        case "PCD_RECT": {
          const msg = data as IframeRectMessage;
          const resolver = pendingRectRequests.current.get(msg.requestId);
          if (resolver) {
            resolver(msg.rect);
            pendingRectRequests.current.delete(msg.requestId);
          }
          break;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [prototype.url, PCD_DEBUG, getIframeOrigin]);

  // Request element rect from iframe
  const requestRect = useCallback((selector: string | null, id: string | null): Promise<{ left: number; top: number; width: number; height: number } | null> => {
    return new Promise((resolve) => {
      if (!bridgeReady || !iframeRef.current?.contentWindow || (!selector && !id)) {
        resolve(null);
        return;
      }

      const requestId = `rect-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      pendingRectRequests.current.set(requestId, resolve);

      setTimeout(() => {
        if (pendingRectRequests.current.has(requestId)) {
          pendingRectRequests.current.delete(requestId);
          resolve(null);
        }
      }, 500);

      try {
        const protoOrigin = new URL(prototype.url).origin;
        iframeRef.current.contentWindow.postMessage(
          { type: "PCD_GET_RECT", requestId, selector, id },
          protoOrigin
        );
      } catch {
        resolve(null);
      }
    });
  }, [bridgeReady, prototype.url]);

  // Refresh all comment rects from iframe
  const refreshRects = useCallback(async () => {
    if (!bridgeReady) return;
    
    const anchored = unresolvedComments.filter(c => c.anchor_selector || c.anchor_id);
    
    for (const c of anchored) {
      const rect = await requestRect(c.anchor_selector ?? null, c.anchor_id ?? null);
      setRectCache(prev => {
        if (!rect && !prev[c.id]) return prev;
        if (rect && prev[c.id] && 
            rect.left === prev[c.id]!.left && 
            rect.top === prev[c.id]!.top) {
          return prev;
        }
        return { ...prev, [c.id]: rect };
      });
    }
  }, [bridgeReady, unresolvedComments, requestRect]);

  // Refresh rects on viewport change (scroll/resize)
  useEffect(() => {
    if (!bridgeReady) return;
    
    if (rectRefreshRaf.current) {
      cancelAnimationFrame(rectRefreshRaf.current);
    }
    rectRefreshRaf.current = requestAnimationFrame(() => {
      rectRefreshRaf.current = null;
      refreshRects();
    });
  }, [iframeViewport, bridgeReady, refreshRects]);

  // Initial rect refresh when bridge becomes ready
  useEffect(() => {
    if (bridgeReady) {
      refreshRects();
    }
  }, [bridgeReady, refreshRects]);

  // Reset bridge state on iframe reload
  useEffect(() => {
    setBridgeReady(false);
    setRectCache({});
    lastIframeClick.current = null;
  }, [iframeKey]);

  // Send pin mode to iframe (changes cursor to crosshair inside iframe)
  useEffect(() => {
    if (!bridgeReady || !iframeRef.current?.contentWindow) return;
    
    const isPinMode = isAddingComment || !!repinTargetId;
    try {
      // Use "*" for bulletproof delivery - origin filtering happens on receive
      iframeRef.current.contentWindow.postMessage(
        { type: "PCD_MODE", mode: isPinMode ? "pin" : "off" },
        "*"
      );
      console.log("[Bridge] Sent PCD_MODE:", isPinMode ? "pin" : "off");
    } catch (e) {
      console.warn("[Bridge] Failed to send mode:", e);
    }
  }, [bridgeReady, isAddingComment, repinTargetId]);

  // Calculate pin position - ONLY from rectCache
  const getPinPosition = useCallback((comment: PrototypeComment): PinPositionResult => {
    if (!bridgeReady) {
      return { kind: 'no-bridge' };
    }
    
    if (!comment.anchor_selector && !comment.anchor_id) {
      return { kind: 'no-anchor' };
    }
    
    const rect = rectCache[comment.id];
    if (!rect) {
      return { kind: 'no-anchor' };
    }
    
    const iframeEl = iframeRef.current;
    const overlayEl = overlayRef.current;
    if (!iframeEl || !overlayEl) return null;
    
    const iframeRect = iframeEl.getBoundingClientRect();
    const overlayRect = overlayEl.getBoundingClientRect();
    const viewportW = iframeRect.width;
    const viewportH = iframeRect.height;
    
    // iframe→overlay offset
    const offsetX = iframeRect.left - overlayRect.left;
    const offsetY = iframeRect.top - overlayRect.top;
    
    // rect is in iframe viewport coords
    const pinCenterX = rect.left + rect.width / 2;
    const pinCenterY = rect.top + rect.height / 2;
    
    // Check offscreen
    const isOffscreen = pinCenterX < 0 || pinCenterY < 0 || 
                       pinCenterX > viewportW || pinCenterY > viewportH;
    
    if (isOffscreen) {
      let direction: 'up' | 'down' | 'left' | 'right';
      if (pinCenterY < 0) direction = 'up';
      else if (pinCenterY > viewportH) direction = 'down';
      else if (pinCenterX < 0) direction = 'left';
      else direction = 'right';
      
      let edgeLeft: number, edgeTop: number;
      if (direction === 'up') {
        edgeLeft = offsetX + Math.max(16, Math.min(viewportW - 16, pinCenterX));
        edgeTop = offsetY + 16;
      } else if (direction === 'down') {
        edgeLeft = offsetX + Math.max(16, Math.min(viewportW - 16, pinCenterX));
        edgeTop = offsetY + viewportH - 16;
      } else if (direction === 'left') {
        edgeLeft = offsetX + 16;
        edgeTop = offsetY + Math.max(16, Math.min(viewportH - 16, pinCenterY));
      } else {
        edgeLeft = offsetX + viewportW - 16;
        edgeTop = offsetY + Math.max(16, Math.min(viewportH - 16, pinCenterY));
      }
      
      return { kind: 'offscreen', direction, edgeLeft, edgeTop };
    }
    
    return { 
      kind: 'visible', 
      left: offsetX + pinCenterX, 
      top: offsetY + pinCenterY 
    };
  }, [bridgeReady, rectCache]);

  // Handle iframe click via postMessage bridge
  const handleIframeClick = useCallback(async (click: IframeClickMessage) => {
    // Must have anchor
    if (!click.selector && !click.anchorKey && !click.id) {
      console.warn("[Bridge] Click has no anchor data");
      return;
    }

    const iframeEl = iframeRef.current;
    const overlayEl = overlayRef.current;
    if (!iframeEl || !overlayEl) return;
    
    const iframeRect = iframeEl.getBoundingClientRect();
    const overlayRect = overlayEl.getBoundingClientRect();
    
    // Convert iframe-relative click coords to overlay percentage
    const clickX = iframeRect.left + click.rect.left + click.rect.width / 2;
    const clickY = iframeRect.top + click.rect.top + click.rect.height / 2;
    const pin_x = ((clickX - overlayRect.left) / overlayRect.width) * 100;
    const pin_y = ((clickY - overlayRect.top) / overlayRect.height) * 100;

    const anchorData: CommentAnchorData = {
      page_url: prototype.url,
      page_path: null,
      scroll_y: click.scroll.y,
      viewport_w: click.viewport.w,
      viewport_h: click.viewport.h,
      breakpoint: getBreakpoint(click.viewport.w),
      anchor_id: click.id,
      anchor_selector: click.selector,
      x_pct: click.rect.width > 0 
        ? ((click.rect.left + click.rect.width / 2) / click.viewport.w) * 100 
        : 50,
      y_pct: click.rect.height > 0 
        ? ((click.rect.top + click.rect.height / 2) / click.viewport.h) * 100 
        : 50,
      text_hint: click.textHint ?? null,
      text_offset: click.textOffset ?? null,
      text_context: click.textContext ?? null,
      pin_x,
      pin_y,
    };

    // Clear click data
    lastIframeClick.current = null;

    // Handle repin
    if (repinTargetId && onRepinComment) {
      try {
        await onRepinComment(repinTargetId, anchorData);
        setRepinTargetId(null);
        toast({
          title: "Pin updated",
          description: "This comment is now anchored to the new element.",
        });
        // Refresh rects after repin
        setTimeout(() => refreshRects(), 100);
      } catch (err) {
        console.error("Failed to repin:", err);
        toast({
          title: "Repin failed",
          description: "Could not update the pin location.",
          variant: "destructive",
        });
      }
      return;
    }

    // Handle new comment
    if (!isAddingComment) return;
    setPendingPin({ anchorData });
  }, [prototype.url, isAddingComment, repinTargetId, onRepinComment, refreshRects]);

  // Listen for iframe clicks via custom event
  useEffect(() => {
    if (!isAddingComment && !repinTargetId) return;
    
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<IframeClickMessage>).detail;
      
      // Show click feedback
      const iframeEl = iframeRef.current;
      if (iframeEl) {
        const iframeRect = iframeEl.getBoundingClientRect();
        const clickX = iframeRect.left + msg.rect.left + msg.rect.width / 2;
        const clickY = iframeRect.top + msg.rect.top + msg.rect.height / 2;
        setClickFeedback({ x: clickX, y: clickY });
        setTimeout(() => setClickFeedback(null), 600);
      }
      
      handleIframeClick(msg);
    };
    
    window.addEventListener("pcd-iframe-click", handler);
    return () => window.removeEventListener("pcd-iframe-click", handler);
  }, [isAddingComment, repinTargetId, handleIframeClick]);

  // Keyboard shortcuts: ESC to cancel, C to start comment mode
  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null) => {
      const n = el as HTMLElement | null;
      if (!n) return false;
      const tag = n.tagName?.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        n.isContentEditable === true ||
        n.closest?.("[contenteditable='true']") != null
      );
    };

    const handler = (e: KeyboardEvent) => {
      // ESC to cancel pin mode
      if (e.key === "Escape") {
        const wasActive = isAddingComment || repinTargetId;
        if (wasActive) {
          setIsAddingComment(false);
          setRepinTargetId(null);
          setPendingPin(null);
          toast({
            title: "Pin mode cancelled",
            description: "No changes were made.",
          });
        }
        return;
      }

      // Don't hijack shortcuts while typing
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // C = add comment mode
      if (e.key.toLowerCase() === "c" && bridgeReady) {
        if (!isAddingComment && !repinTargetId) {
          setIsAddingComment(true);
          setPendingPin(null);
          toast({
            title: "Add comment mode",
            description: "Click on the prototype to place a pin.",
          });
        }
      }
    };
    
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAddingComment, repinTargetId, bridgeReady]);

  const handleSubmitComment = async () => {
    if (!pendingPin || !commentText.trim()) return;
    
    setSubmitting(true);
    try {
      await onAddComment(
        commentText.trim(),
        pendingPin.anchorData.pin_x,
        pendingPin.anchorData.pin_y,
        pendingPin.anchorData
      );
      setCommentText("");
      setPendingPin(null);
      setIsAddingComment(false);
      toast({
        title: "Comment added",
        description: "Your feedback has been saved.",
      });
      // Refresh rects after adding comment
      setTimeout(() => refreshRects(), 100);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelComment = () => {
    setPendingPin(null);
    setCommentText("");
  };

  const handleRefresh = () => {
    setBridgeReady(false);
    setRectCache({});
    setIframeKey((k) => k + 1);
    onRefresh();
  };

  const focusComment = useCallback((comment: PrototypeComment) => {
    setFocusedCommentId(comment.id);
    setHoveredCommentId(comment.id);
    
    // Scroll sidebar card into view
    requestAnimationFrame(() => {
      const el = document.getElementById(`comment-card-${comment.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  // Render pin based on position result
  const renderPin = (comment: PrototypeComment, index: number) => {
    const position = getPinPosition(comment);
    if (!position) return null;
    
    const status = getEffectiveStatus(comment);
    const isFocused = focusedCommentId === comment.id;
    const isHovered = hoveredCommentId === comment.id;
    
    // No bridge - show nothing (pins don't work without helper)
    if (position.kind === 'no-bridge') {
      return null;
    }
    
    // No anchor - don't show a drifting pin
    if (position.kind === 'no-anchor') {
      return null;
    }
    
    // Offscreen arrow
    if (position.kind === 'offscreen') {
      const ArrowIcon = position.direction === 'up' ? ChevronUp : 
                        position.direction === 'down' ? ChevronDown :
                        position.direction === 'left' ? ChevronLeft : ChevronRight;
      return (
        <div
          key={`offscreen-${comment.id}`}
          className="absolute pointer-events-auto"
          style={{ 
            left: position.edgeLeft, 
            top: position.edgeTop,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-transform border-2 border-white ${
              status === 'in_progress' ? 'bg-amber-500 text-black' : 'bg-primary text-primary-foreground'
            }`}
            title={`Scroll to: ${comment.body.slice(0, 30)}...`}
            onClick={(e) => {
              e.stopPropagation();
              focusComment(comment);
            }}
          >
            <ArrowIcon className="h-3 w-3" />
          </div>
        </div>
      );
    }
    
    // Visible pin
    return (
      <div
        key={comment.id}
        className="absolute pointer-events-auto"
        style={{ 
          left: position.left, 
          top: position.top,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-transform ${
            status === 'in_progress' 
              ? 'bg-amber-500 text-black shadow-[0_0_0_4px_rgba(245,158,11,0.2)]' 
              : 'bg-primary text-primary-foreground shadow-[0_0_0_4px_rgba(59,130,246,0.18)]'
          } ${isFocused || isHovered ? 'scale-125 ring-2 ring-primary/50' : ''}`}
          title={comment.body}
          onMouseEnter={() => setHoveredCommentId(comment.id)}
          onMouseLeave={() => setHoveredCommentId(null)}
          onClick={(e) => {
            e.stopPropagation();
            setShowCommentsSidebar(true);
            focusComment(comment);
          }}
        >
          {index + 1}
        </div>
      </div>
    );
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
          {/* Bridge status */}
          <Badge 
            variant="outline" 
            className={`text-xs ${
              bridgeReady 
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
            }`}
            title={bridgeReady ? "Helper script connected - pins anchor to elements" : "Waiting for helper script..."}
          >
            {bridgeReady ? "📡 Bridge Connected" : "⏳ Waiting for bridge..."}
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
            disabled={!bridgeReady}
            title={!bridgeReady ? "Waiting for helper script to load..." : undefined}
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

      {/* Bridge not ready warning */}
      {!bridgeReady && (
        <div className="flex items-center justify-center gap-2 px-3 py-2 border-b border-amber-500/20 bg-amber-500/10 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          <span>Waiting for helper script. Make sure <code className="bg-amber-100 px-1 rounded">pcd-iframe-helper.js</code> is added to the prototype.</span>
        </div>
      )}

      {/* Comment mode instructions */}
      {isAddingComment && !pendingPin && bridgeReady && (
        <div className="flex items-center justify-center gap-2 px-3 py-2 border-b border-primary/20 bg-primary/5 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span>Click anywhere on the prototype to drop a pin.</span>
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">ESC</kbd>
          <span className="text-muted-foreground/60">to cancel</span>
        </div>
      )}

      {/* Repin mode instructions */}
      {repinTargetId && bridgeReady && (
        <div className="flex items-center justify-center gap-2 px-3 py-2 border-b border-amber-500/20 bg-amber-500/10 text-sm text-amber-600">
          <Target className="h-4 w-4" />
          <span>Click the element this comment refers to…</span>
          <kbd className="px-1.5 py-0.5 text-xs bg-amber-100 rounded border border-amber-300">ESC</kbd>
          <span className="text-amber-500">to cancel</span>
        </div>
      )}

      {/* Main content */}
      <div className={`flex flex-1 ${isFullscreen ? "" : "min-h-[500px]"}`}>
        {/* Iframe + overlay */}
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

          {/* Click overlay for pin placement - always pointer-events-none to let clicks through to iframe */}
          <div
            ref={overlayRef}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Visual hint when in comment mode */}
            {(isAddingComment || repinTargetId) && bridgeReady && (
              <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary/30 flex items-center justify-center">
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse">
                  {repinTargetId ? "Click to repin comment..." : "Click to place pin..."}
                </div>
              </div>
            )}

            {/* Pins - rendered in overlay using rectCache positions */}
            {unresolvedComments.map((comment, idx) => renderPin(comment, idx))}

            {/* Pending pin indicator */}
            {pendingPin && (
              <div
                className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-pulse shadow-lg pointer-events-none"
                style={{ left: `${pendingPin.anchorData.pin_x}%`, top: `${pendingPin.anchorData.pin_y}%` }}
              >
                <MessageCircle className="h-3 w-3" />
              </div>
            )}

            {/* Click feedback ripple */}
            {clickFeedback && (
              <div
                className="fixed w-8 h-8 rounded-full bg-primary/50 animate-ping pointer-events-none"
                style={{ 
                  left: clickFeedback.x, 
                  top: clickFeedback.y,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            )}
          </div>

          {/* Comment input popover */}
          {pendingPin && (
            <div
              className="absolute z-10 bg-card border border-border rounded-lg shadow-xl p-3 w-72"
              style={{
                left: `min(${pendingPin.anchorData.pin_x}%, calc(100% - 300px))`,
                top: `${pendingPin.anchorData.pin_y}%`,
                transform: "translate(10px, -50%)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {pendingPin.anchorData.anchor_selector && (
                <div className="mb-2 text-xs text-muted-foreground truncate">
                  Anchored to: <code className="bg-muted px-1 rounded">{pendingPin.anchorData.anchor_selector.slice(0, 40)}</code>
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
          <CommentsSidebar
            comments={comments}
            token={token}
            focusedCommentId={focusedCommentId}
            hoveredCommentId={hoveredCommentId}
            bridgeReady={bridgeReady}
            getPinStatus={getPinPosition}
            onFocusComment={focusComment}
            onHoverComment={setHoveredCommentId}
            onResolveComment={onResolveComment}
            onUnresolveComment={onUnresolveComment}
            onMarkInProgress={onMarkInProgress}
            onEditComment={onEditComment}
            onRepin={onRepinComment ? (id) => setRepinTargetId(id) : undefined}
            onArchiveComment={onArchiveComment}
            onUnarchiveComment={onUnarchiveComment}
          />
        )}
      </div>

      {/* Debug HUD - activate with ?pcd_debug=1 */}
      {PCD_DEBUG && (
        <div
          style={{
            position: "fixed",
            bottom: 10,
            right: 10,
            zIndex: 999999,
            background: "rgba(0,0,0,.85)",
            color: "#0f0",
            padding: "10px 12px",
            borderRadius: 10,
            maxWidth: 420,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: 12,
            lineHeight: 1.35,
            whiteSpace: "pre-wrap",
            pointerEvents: "none",
          }}
        >
          {"[PCD parent]\n" + JSON.stringify({
            bridgeReady,
            mode: isAddingComment ? "add" : repinTargetId ? "repin" : "off",
            ...pcdHud,
          }, null, 2)}
        </div>
      )}
    </div>
  );
}

// Filter chip component
function FilterChip({ 
  label, 
  count, 
  active, 
  onClick 
}: { 
  label: string; 
  count: number; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded-full transition-colors ${
        active 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label} {count > 0 && <span className="ml-0.5 opacity-70">({count})</span>}
    </button>
  );
}

// Comments sidebar
function CommentsSidebar({
  comments,
  token,
  focusedCommentId,
  hoveredCommentId,
  bridgeReady,
  getPinStatus,
  onFocusComment,
  onHoverComment,
  onResolveComment,
  onUnresolveComment,
  onMarkInProgress,
  onEditComment,
  onRepin,
  onArchiveComment,
  onUnarchiveComment,
}: {
  comments: PrototypeComment[];
  token: string;
  focusedCommentId: string | null;
  hoveredCommentId: string | null;
  bridgeReady: boolean;
  getPinStatus: (comment: PrototypeComment) => PinPositionResult;
  onFocusComment: (comment: PrototypeComment) => void;
  onHoverComment: (id: string | null) => void;
  onResolveComment: (commentId: string) => Promise<void>;
  onUnresolveComment: (commentId: string) => Promise<void>;
  onMarkInProgress?: (commentId: string) => Promise<void>;
  onEditComment?: (commentId: string, newBody: string) => Promise<void>;
  onRepin?: (commentId: string) => void;
  onArchiveComment?: (commentId: string) => Promise<void>;
  onUnarchiveComment?: (commentId: string) => Promise<void>;
}) {
  const [filter, setFilter] = useState<CommentStatus | 'all' | 'archived'>('all');
  
  // Split active vs archived
  const activeComments = comments.filter(c => !c.archived_at);
  const archivedComments = comments.filter(c => !!c.archived_at);
  
  const counts = {
    all: activeComments.length,
    open: activeComments.filter(c => (!c.status || c.status === 'open') && !c.resolved_at).length,
    in_progress: activeComments.filter(c => c.status === 'in_progress').length,
    resolved: activeComments.filter(c => c.status === 'resolved' || !!c.resolved_at).length,
    wont_do: activeComments.filter(c => c.status === 'wont_do').length,
    archived: archivedComments.length,
  };
  
  const filteredComments = filter === 'archived'
    ? archivedComments
    : filter === 'all' 
      ? activeComments 
      : activeComments.filter(c => {
          if (filter === 'open') return (!c.status || c.status === 'open') && !c.resolved_at;
          if (filter === 'resolved') return c.status === 'resolved' || !!c.resolved_at;
          return c.status === filter;
        });
  
  return (
    <div className="w-80 border-l border-border bg-muted/30 flex flex-col">
      <div className="p-2 border-b border-border">
        <div className="flex flex-wrap gap-1">
          <FilterChip label="All" count={counts.all} active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterChip label="Open" count={counts.open} active={filter === 'open'} onClick={() => setFilter('open')} />
          <FilterChip label="In progress" count={counts.in_progress} active={filter === 'in_progress'} onClick={() => setFilter('in_progress')} />
          <FilterChip label="Resolved" count={counts.resolved} active={filter === 'resolved'} onClick={() => setFilter('resolved')} />
          {counts.archived > 0 && (
            <FilterChip label="Archived" count={counts.archived} active={filter === 'archived'} onClick={() => setFilter('archived')} />
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {filteredComments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {filter === 'archived' ? 'No archived comments.' : 'No comments yet. Click "Add Comment" to leave feedback.'}
            </p>
          ) : (
            filteredComments.map((comment, idx) => {
              const pinStatus = getPinStatus(comment);
              const needsAnchor = pinStatus?.kind === 'no-anchor';
              const isResolved = comment.status === 'resolved' || !!comment.resolved_at || comment.status === 'wont_do';
              const isArchived = !!comment.archived_at;
              
              return (
                <div
                  id={`comment-card-${comment.id}`}
                  key={comment.id}
                  className={`cursor-pointer transition-all ${
                    focusedCommentId === comment.id || hoveredCommentId === comment.id
                      ? "ring-2 ring-primary rounded-lg"
                      : ""
                  } ${isArchived ? "opacity-60" : ""}`}
                  onMouseEnter={() => onHoverComment(comment.id)}
                  onMouseLeave={() => onHoverComment(null)}
                  onClick={() => onFocusComment(comment)}
                >
                  {/* Archived badge */}
                  {isArchived && (
                    <div className="mb-1 flex items-center gap-1">
                      <Badge variant="outline" className="text-xs bg-gray-500/10 text-gray-600 border-gray-500/30">
                        <Archive className="h-3 w-3 mr-1" />
                        Archived
                      </Badge>
                      {onUnarchiveComment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[10px] text-gray-600 hover:text-gray-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnarchiveComment(comment.id);
                          }}
                        >
                          <ArchiveRestore className="h-3 w-3 mr-0.5" />
                          Unarchive
                        </Button>
                      )}
                    </div>
                  )}
                  {/* Needs anchor badge + repin button */}
                  {!isArchived && !isResolved && needsAnchor && (
                    <div className="mb-1 flex items-center gap-1">
                      <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        No pin
                      </Badge>
                      {onRepin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[10px] text-amber-600 hover:text-amber-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRepin(comment.id);
                          }}
                        >
                          <Target className="h-3 w-3 mr-0.5" />
                          Add pin
                        </Button>
                      )}
                    </div>
                  )}
                  {/* Move pin button for pinned comments */}
                  {!isArchived && !isResolved && !needsAnchor && onRepin && (
                    <div className="mb-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRepin(comment.id);
                        }}
                      >
                        <Target className="h-3 w-3 mr-0.5" />
                        Move pin
                      </Button>
                    </div>
                  )}
                  <PortalCommentCard
                    token={token}
                    comment={comment}
                    index={idx}
                    onResolve={onResolveComment}
                    onUnresolve={onUnresolveComment}
                    onMarkInProgress={onMarkInProgress}
                    onEdit={onEditComment}
                    onArchive={onArchiveComment}
                  />
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
