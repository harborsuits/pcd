import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, MessageCircle, X, Check, ExternalLink, Maximize2, Minimize2, ChevronRight, ChevronLeft, AlertTriangle, MapPin, EyeOff, ChevronUp, ChevronDown, Target } from "lucide-react";
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

// Enhanced pin position result with direction for offscreen pins
export type PinPositionResult = 
  | { kind: 'visible'; left: string; top: string }
  | { kind: 'offscreen'; direction: 'up' | 'down' | 'left' | 'right'; edgeLeft: string; edgeTop: string }
  | { kind: 'needs-repin' }
  | null;

interface PrototypeViewerProps {
  prototype: Prototype;
  comments: PrototypeComment[];
  token: string;
  onAddComment: (body: string, pinX: number, pinY: number, anchorData?: CommentAnchorData) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
  onUnresolveComment: (commentId: string) => Promise<void>;
  onEditComment?: (commentId: string, newBody: string) => Promise<void>;
  onRepinComment?: (commentId: string, anchorData: CommentAnchorData) => Promise<void>;
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
  onRepinComment,
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
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [anchorMismatch, setAnchorMismatch] = useState<string | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [repinTargetId, setRepinTargetId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pinUpdateKey, setPinUpdateKey] = useState(0);

  const unresolvedComments = comments.filter((c) => !c.resolved_at);
  const resolvedComments = comments.filter((c) => c.resolved_at);

  // Force pin recomputation
  const triggerPinUpdate = useCallback(() => {
    setPinUpdateKey(k => k + 1);
  }, []);

  // --- Hover highlight helpers (same-origin only) ---
  const clearHoverHighlight = useCallback(() => {
    if (!isSameOrigin(prototype.url)) return;
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    doc.querySelectorAll("[data-pcd-hover]").forEach((el) => {
      el.removeAttribute("data-pcd-hover");
    });
  }, [prototype.url]);

  const applyHoverHighlight = useCallback((comment: PrototypeComment | null) => {
    clearHoverHighlight();
    if (!comment) return;
    if (!isSameOrigin(prototype.url)) return;

    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;

      const el =
        (comment.anchor_selector ? doc.querySelector(comment.anchor_selector) : null) ||
        (comment.anchor_id ? doc.getElementById(comment.anchor_id) : null);

      if (el) {
        (el as HTMLElement).setAttribute("data-pcd-hover", "true");
      }
    } catch {
      // ignore
    }
  }, [prototype.url, clearHoverHighlight]);

  const ensureHoverStyle = useCallback(() => {
    if (!isSameOrigin(prototype.url)) return;
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    if (doc.getElementById("pcd-hover-style")) return;

    const style = doc.createElement("style");
    style.id = "pcd-hover-style";
    style.textContent = `
      [data-pcd-hover="true"]{
        outline: 3px solid rgba(99,102,241,0.9) !important;
        outline-offset: 2px !important;
        border-radius: 8px !important;
        box-shadow: 0 0 0 6px rgba(99,102,241,0.15) !important;
        transition: outline-color .08s ease;
      }
    `;
    doc.head.appendChild(style);
  }, [prototype.url]);

  // Apply hover highlight when hoveredCommentId changes
  useEffect(() => {
    const c = comments.find(x => x.id === hoveredCommentId) ?? null;
    applyHoverHighlight(c);
    return () => clearHoverHighlight();
  }, [hoveredCommentId, comments, applyHoverHighlight, clearHoverHighlight]);

  // Check if target is a typing input (don't steal keystrokes)
  const isTypingTarget = useCallback((t: EventTarget | null) => {
    const el = t as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      el.isContentEditable ||
      el.getAttribute("contenteditable") === "true"
    );
  }, []);

  // Track current iframe path for same-origin prototypes + set up scroll/resize listeners + SPA nav poll
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !isSameOrigin(prototype.url)) return;

    let iframeWin: Window | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let navTimer: number | null = null;
    let lastPath: string | null = null;

    const handleLoad = () => {
      try {
        const path = iframe.contentWindow?.location.pathname ?? null;
        setCurrentIframePath(path);
        iframeWin = iframe.contentWindow;
        lastPath = path;

        // Inject hover highlight style into iframe
        ensureHoverStyle();

        // Recompute pins on load
        triggerPinUpdate();

        // Listen for scroll inside iframe
        if (iframeWin) {
          iframeWin.addEventListener("scroll", triggerPinUpdate, { passive: true });
          
          // Listen for resize of iframe content
          if (iframe.contentDocument?.body) {
            resizeObserver = new ResizeObserver(triggerPinUpdate);
            resizeObserver.observe(iframe.contentDocument.body);
          }
        }

        // Start SPA navigation polling (catches pushState/replaceState)
        if (navTimer) window.clearInterval(navTimer);
        navTimer = window.setInterval(() => {
          try {
            const p = iframe.contentWindow?.location.pathname ?? null;
            if (p !== lastPath) {
              lastPath = p;
              setCurrentIframePath(p);
              triggerPinUpdate();
            }
          } catch {
            // cross-origin, ignore
          }
        }, 250);
      } catch {
        setCurrentIframePath(null);
      }
    };

    iframe.addEventListener("load", handleLoad);
    
    return () => {
      iframe.removeEventListener("load", handleLoad);
      if (iframeWin) {
        iframeWin.removeEventListener("scroll", triggerPinUpdate);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (navTimer) {
        window.clearInterval(navTimer);
      }
    };
  }, [prototype.url, iframeKey, triggerPinUpdate]);

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
    async (e: React.MouseEvent<HTMLDivElement>) => {
      const anchorData = captureAnchorData(e.clientX, e.clientY);
      if (!anchorData) return;

      // Handle repin mode
      if (repinTargetId && onRepinComment) {
        try {
          await onRepinComment(repinTargetId, anchorData);
          setRepinTargetId(null);
          triggerPinUpdate();
        } catch (err) {
          console.error("Failed to repin comment:", err);
        }
        return;
      }

      // Handle new comment mode
      if (!isAddingComment || !overlayRef.current) return;

      setPendingPin({
        x: anchorData.pin_x,
        y: anchorData.pin_y,
        anchorData,
      });
    },
    [isAddingComment, captureAnchorData, repinTargetId, onRepinComment, triggerPinUpdate]
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
    setHoveredCommentId(comment.id); // Also set hover for DOM highlight
    setAnchorMismatch(null);

    // Scroll sidebar card into view
    requestAnimationFrame(() => {
      const el = document.getElementById(`comment-card-${comment.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

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

  // Jump to comment's page (for sidebar "Jump to page" button)
  const jumpToCommentPage = useCallback((comment: PrototypeComment) => {
    if (!comment.page_path) return;
    if (!isSameOrigin(prototype.url)) return;

    const iframe = iframeRef.current;
    const win = iframe?.contentWindow;
    if (!iframe || !win) return;

    try {
      const currentPath = win.location.pathname;
      if (currentPath === comment.page_path) {
        // Already on that page: just recompute + focus
        setCurrentIframePath(currentPath);
        triggerPinUpdate();
        focusComment(comment);
        return;
      }

      // Navigate within same origin
      win.location.assign(comment.page_path);

      // After navigation, the iframe "load" handler + SPA poll will:
      // - setCurrentIframePath(...)
      // - triggerPinUpdate()
      // So we just remember what to focus when the page is ready.
      setFocusedCommentId(comment.id);
    } catch {
      // ignore cross-origin errors
    }
  }, [prototype.url, triggerPinUpdate, focusComment]);

  // Calculate pin position for a comment - always try DOM anchor first
  // Returns enhanced position result with direction for offscreen pins
  const getPinPosition = useCallback((comment: PrototypeComment): PinPositionResult => {
    const sameOrigin = isSameOrigin(prototype.url);
    
    // For same-origin iframes with anchor data, try to position precisely
    if (comment.anchor_selector && sameOrigin) {
      try {
        const iframe = iframeRef.current;
        const overlay = overlayRef.current;
        const iframeDoc = iframe?.contentDocument;
        const iframeWin = iframe?.contentWindow;
        
        if (iframe && overlay && iframeDoc && iframeWin) {
          const anchorEl = iframeDoc.querySelector(comment.anchor_selector);
          if (anchorEl) {
            // All rects are in parent window viewport coordinates
            const anchorRect = anchorEl.getBoundingClientRect(); // viewport coords inside iframe
            const overlayRect = overlay.getBoundingClientRect(); // parent viewport coords
            const iframeRect = iframe.getBoundingClientRect();   // parent viewport coords
            
            // Calculate position relative to anchor, fallback to center if no percentages
            const xPct = comment.x_pct ?? 50;
            const yPct = comment.y_pct ?? 50;
            
            // anchorRect is viewport-relative inside iframe
            // iframeRect gives us the iframe's position in parent viewport
            // absX/absY = position in parent window viewport coords
            const absX = iframeRect.left + anchorRect.left + (anchorRect.width * xPct / 100);
            const absY = iframeRect.top + anchorRect.top + (anchorRect.height * yPct / 100);
            
            // Convert to overlay-local pixels
            const localX = absX - overlayRect.left;
            const localY = absY - overlayRect.top;
            
            // Convert to overlay percentages
            const leftPct = (localX / overlayRect.width) * 100;
            const topPct = (localY / overlayRect.height) * 100;
            
            // If pin is offscreen, compute direction
            if (localX < 0 || localY < 0 || localX > overlayRect.width || localY > overlayRect.height) {
              // Determine primary direction (where the anchor is relative to viewport)
              let direction: 'up' | 'down' | 'left' | 'right';
              
              // Use anchor center to determine direction
              const anchorCenterY = anchorRect.top + anchorRect.height / 2;
              const anchorCenterX = anchorRect.left + anchorRect.width / 2;
              const viewportH = iframeWin.innerHeight;
              const viewportW = iframeWin.innerWidth;
              
              if (anchorCenterY < 0) {
                direction = 'up';
              } else if (anchorCenterY > viewportH) {
                direction = 'down';
              } else if (anchorCenterX < 0) {
                direction = 'left';
              } else {
                direction = 'right';
              }
              
              // Calculate edge position for the indicator
              // Clamp the position to be within the overlay
              const clampedLeftPct = Math.max(5, Math.min(95, leftPct));
              const clampedTopPct = Math.max(5, Math.min(95, topPct));
              
              let edgeLeft: string;
              let edgeTop: string;
              
              if (direction === 'up') {
                edgeLeft = `${clampedLeftPct}%`;
                edgeTop = '8px';
              } else if (direction === 'down') {
                edgeLeft = `${clampedLeftPct}%`;
                edgeTop = 'calc(100% - 24px)';
              } else if (direction === 'left') {
                edgeLeft = '8px';
                edgeTop = `${clampedTopPct}%`;
              } else {
                edgeLeft = 'calc(100% - 24px)';
                edgeTop = `${clampedTopPct}%`;
              }
              
              return { kind: 'offscreen', direction, edgeLeft, edgeTop };
            }
            
            return { kind: 'visible', left: `${leftPct}%`, top: `${topPct}%` };
          } else {
            // Anchor selector exists but element not found - needs re-pin
            return { kind: 'needs-repin' };
          }
        }
      } catch {
        // Fall through to fallback
      }
    }
    
    // For same-origin: require anchors - don't show floaty pins
    if (sameOrigin) {
      // No valid anchor for same-origin = needs re-pin
      return { kind: 'needs-repin' };
    }
    
    // Fallback to stored pin_x/pin_y only for cross-origin
    if (comment.pin_x != null && comment.pin_y != null) {
      return { kind: 'visible', left: `${comment.pin_x}%`, top: `${comment.pin_y}%` };
    }
    
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prototype.url, pinUpdateKey]);

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

  // Ordered visible comments for keyboard navigation (sorted by created_at)
  const orderedVisible = useMemo(() => {
    return [...visibleComments].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [visibleComments]);

  const focusedIndex = useMemo(() => {
    if (!focusedCommentId) return -1;
    return orderedVisible.findIndex(c => c.id === focusedCommentId);
  }, [orderedVisible, focusedCommentId]);

  const focusByIndex = useCallback((idx: number) => {
    const c = orderedVisible[idx];
    if (c) focusComment(c);
  }, [orderedVisible, focusComment]);

  // Keyboard shortcuts: J/K (nav), R (resolve), G (jump), Esc (cancel)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (!orderedVisible.length) return;

      const next = () => {
        const i = focusedIndex < 0 ? 0 : Math.min(orderedVisible.length - 1, focusedIndex + 1);
        focusByIndex(i);
      };
      const prev = () => {
        const i = focusedIndex < 0 ? 0 : Math.max(0, focusedIndex - 1);
        focusByIndex(i);
      };

      switch (e.key) {
        case "j":
        case "J":
          e.preventDefault();
          next();
          break;
        case "k":
        case "K":
          e.preventDefault();
          prev();
          break;
        case "r":
        case "R":
          e.preventDefault();
          if (focusedIndex < 0) return;
          {
            const c = orderedVisible[focusedIndex];
            if (!c) return;
            const isResolved = c.status === "resolved" || !!c.resolved_at;
            if (isResolved) onUnresolveComment(c.id);
            else onResolveComment(c.id);
          }
          break;
        case "g":
        case "G":
          e.preventDefault();
          if (focusedIndex < 0) return;
          {
            const c = orderedVisible[focusedIndex];
            const offPage = c.page_path && currentIframePath && c.page_path !== currentIframePath;
            if (offPage && isSameOrigin(prototype.url)) jumpToCommentPage(c);
          }
          break;
        case "?":
          e.preventDefault();
          setShowShortcutsHelp(v => !v);
          break;
        case "Escape":
          e.preventDefault();
          // First priority: cancel repin mode
          if (repinTargetId) {
            setRepinTargetId(null);
            return;
          }
          if (showShortcutsHelp) {
            setShowShortcutsHelp(false);
            return;
          }
          setHoveredCommentId(null);
          setFocusedCommentId(null);
          setIsAddingComment(false);
          setPendingPin(null);
          clearHoverHighlight();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    orderedVisible,
    focusedIndex,
    focusByIndex,
    focusComment,
    onResolveComment,
    onUnresolveComment,
    currentIframePath,
    prototype.url,
    jumpToCommentPage,
    clearHoverHighlight,
    isTypingTarget,
    showShortcutsHelp,
    repinTargetId,
  ]);

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcutsHelp(v => !v)}
            title="Keyboard shortcuts (?)"
          >
            ?
          </Button>
        </div>
      </div>

      {/* Comment mode instructions - flat, no rounded container */}
      {isAddingComment && !pendingPin && (
        <div className="flex items-center justify-center gap-2 px-3 py-2 border-b border-primary/20 bg-primary/5 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>Click anywhere on the prototype to drop a pin.</span>
          <button 
            onClick={() => setIsAddingComment(false)} 
            className="text-sm underline hover:text-foreground ml-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Re-pin mode instructions */}
      {repinTargetId && (
        <div className="flex items-center justify-center gap-2 px-3 py-2 border-b border-amber-500/20 bg-amber-500/10 text-sm text-amber-600">
          <Target className="h-4 w-4" />
          <span>Click the element this comment refers to…</span>
          <button 
            onClick={() => setRepinTargetId(null)} 
            className="text-sm underline hover:text-amber-700 ml-2"
          >
            Cancel
          </button>
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
            className={`absolute inset-0 ${isAddingComment || repinTargetId ? "cursor-crosshair" : "pointer-events-none"}`}
            onClick={handleOverlayClick}
          >
          {/* Existing comment pins - only show unresolved, visible ones with valid positions */}
            {visibleComments
              .filter(c => !c.resolved_at && (c.status !== 'resolved' && c.status !== 'wont_do'))
              .map((comment, idx) => {
                const position = getPinPosition(comment);
                if (!position) return null;
                
                // Handle offscreen arrows
                if (position.kind === 'offscreen') {
                  const ArrowIcon = position.direction === 'up' ? ChevronUp : 
                                    position.direction === 'down' ? ChevronDown :
                                    position.direction === 'left' ? ChevronLeft : ChevronRight;
                  return (
                    <div
                      key={`offscreen-${comment.id}`}
                      className="absolute w-6 h-6 rounded-full bg-muted border-2 border-primary flex items-center justify-center cursor-pointer pointer-events-auto hover:bg-primary hover:text-primary-foreground transition-colors"
                      style={{ left: position.edgeLeft, top: position.edgeTop }}
                      title={`Comment offscreen: ${comment.body.slice(0, 30)}... (click to scroll)`}
                      onClick={(e) => {
                        e.stopPropagation();
                        focusComment(comment);
                      }}
                    >
                      <ArrowIcon className="h-3 w-3" />
                    </div>
                  );
                }
                
                // Skip needs-repin (handled in sidebar)
                if (position.kind === 'needs-repin') return null;
                
                // Visible pin
                const isFocused = focusedCommentId === comment.id;
                const isHovered = hoveredCommentId === comment.id;
                const hasMismatch = anchorMismatch === comment.id;

                return (
                  <div
                    key={comment.id}
                    className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all hover:scale-110 pointer-events-auto ${
                      isFocused || isHovered
                        ? "ring-2 ring-primary ring-offset-2 scale-125"
                        : ""
                    } ${
                      hasMismatch
                        ? "bg-amber-500 text-white"
                        : "bg-primary text-primary-foreground shadow-lg"
                    }`}
                    style={{ left: position.left, top: position.top }}
                    title={`${comment.body}${comment.page_path ? ` (${comment.page_path})` : ""}\n\nJ/K: navigate • R: resolve • Esc: clear`}
                    onMouseEnter={() => setHoveredCommentId(comment.id)}
                    onMouseLeave={() => setHoveredCommentId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open comments sidebar and focus this comment
                      setShowCommentsSidebar(true);
                      setFocusedCommentId(comment.id);
                    }}
                  >
                    {hasMismatch ? <AlertTriangle className="h-3 w-3" /> : idx + 1}
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
          <CommentsSidebar
            comments={comments}
            token={token}
            focusedCommentId={focusedCommentId}
            hoveredCommentId={hoveredCommentId}
            currentIframePath={currentIframePath}
            isSameOrigin={isSameOrigin(prototype.url)}
            getPinStatus={getPinPosition}
            onFocusComment={focusComment}
            onHoverComment={setHoveredCommentId}
            onJumpToPage={jumpToCommentPage}
            onResolveComment={onResolveComment}
            onUnresolveComment={onUnresolveComment}
            onEditComment={onEditComment}
            onRepin={onRepinComment ? (id) => setRepinTargetId(id) : undefined}
          />
        )}
      </div>

      {/* Keyboard shortcuts help modal */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowShortcutsHelp(false)}
          />
          <div className="relative w-full sm:w-[420px] m-4 rounded-xl border border-border bg-background shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Keyboard shortcuts</div>
              <Button variant="ghost" size="sm" onClick={() => setShowShortcutsHelp(false)}>
                Close
              </Button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Next comment</div>
              <div><kbd className="px-2 py-0.5 rounded border border-border bg-muted text-xs">J</kbd></div>
              <div className="text-muted-foreground">Prev comment</div>
              <div><kbd className="px-2 py-0.5 rounded border border-border bg-muted text-xs">K</kbd></div>
              <div className="text-muted-foreground">Resolve / Reopen</div>
              <div><kbd className="px-2 py-0.5 rounded border border-border bg-muted text-xs">R</kbd></div>
              <div className="text-muted-foreground">Jump to page</div>
              <div><kbd className="px-2 py-0.5 rounded border border-border bg-muted text-xs">G</kbd></div>
              <div className="text-muted-foreground">Help</div>
              <div><kbd className="px-2 py-0.5 rounded border border-border bg-muted text-xs">?</kbd></div>
              <div className="text-muted-foreground">Cancel / Close</div>
              <div><kbd className="px-2 py-0.5 rounded border border-border bg-muted text-xs">Esc</kbd></div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              Shortcuts won't trigger while typing in inputs.
            </div>
          </div>
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

// Comments sidebar with filter chips
function CommentsSidebar({
  comments,
  token,
  focusedCommentId,
  hoveredCommentId,
  currentIframePath,
  isSameOrigin,
  getPinStatus,
  onFocusComment,
  onHoverComment,
  onJumpToPage,
  onResolveComment,
  onUnresolveComment,
  onEditComment,
  onRepin,
}: {
  comments: PrototypeComment[];
  token: string;
  focusedCommentId: string | null;
  hoveredCommentId: string | null;
  currentIframePath: string | null;
  isSameOrigin: boolean;
  getPinStatus: (comment: PrototypeComment) => PinPositionResult;
  onFocusComment: (comment: PrototypeComment) => void;
  onHoverComment: (id: string | null) => void;
  onJumpToPage: (comment: PrototypeComment) => void;
  onResolveComment: (commentId: string) => Promise<void>;
  onUnresolveComment: (commentId: string) => Promise<void>;
  onEditComment?: (commentId: string, newBody: string) => Promise<void>;
  onRepin?: (commentId: string) => void;
}) {
  const [filter, setFilter] = useState<CommentStatus | 'all'>('all');
  const [onlyCurrentPage, setOnlyCurrentPage] = useState(true);
  
  // Count comments by status
  const counts = {
    all: comments.length,
    open: comments.filter(c => !c.status || c.status === 'open').length,
    in_progress: comments.filter(c => c.status === 'in_progress').length,
    resolved: comments.filter(c => c.status === 'resolved' || c.resolved_at).length,
    wont_do: comments.filter(c => c.status === 'wont_do').length,
  };
  
  // Filter comments by status
  const statusFiltered = filter === 'all' 
    ? comments 
    : comments.filter(c => {
        if (filter === 'open') return !c.status || c.status === 'open';
        if (filter === 'resolved') return c.status === 'resolved' || c.resolved_at;
        return c.status === filter;
      });
  
  // Filter by current page
  const filteredComments = statusFiltered.filter((c) => {
    if (!onlyCurrentPage) return true;
    if (!isSameOrigin || !currentIframePath) return true;
    if (!c.page_path) return true;
    return c.page_path === currentIframePath;
  });

  const otherPageCount = statusFiltered.length - filteredComments.length;
  
  return (
    <div className="w-80 border-l border-border bg-muted/30 flex flex-col">
      {/* Header with shortcuts hint */}
      <div className="p-2 border-b border-border space-y-2">
        <div className="flex flex-wrap gap-1">
          <FilterChip label="All" count={counts.all} active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterChip label="Open" count={counts.open} active={filter === 'open'} onClick={() => setFilter('open')} />
          <FilterChip label="In progress" count={counts.in_progress} active={filter === 'in_progress'} onClick={() => setFilter('in_progress')} />
          <FilterChip label="Resolved" count={counts.resolved} active={filter === 'resolved'} onClick={() => setFilter('resolved')} />
          <FilterChip label="Won't do" count={counts.wont_do} active={filter === 'wont_do'} onClick={() => setFilter('wont_do')} />
          {isSameOrigin && currentIframePath && (
            <button
              onClick={() => setOnlyCurrentPage(v => !v)}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                onlyCurrentPage 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              This page
            </button>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground">
          <kbd className="px-1 py-0.5 rounded border border-border bg-muted">J</kbd>/<kbd className="px-1 py-0.5 rounded border border-border bg-muted">K</kbd> navigate · <kbd className="px-1 py-0.5 rounded border border-border bg-muted">R</kbd> resolve · <kbd className="px-1 py-0.5 rounded border border-border bg-muted">G</kbd> jump · <kbd className="px-1 py-0.5 rounded border border-border bg-muted">?</kbd> help
        </div>
      </div>
      
      {/* Off-page hint */}
      {onlyCurrentPage && otherPageCount > 0 && (
        <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 border-b border-border">
          {otherPageCount} comment{otherPageCount > 1 ? 's' : ''} on other pages — 
          <button 
            onClick={() => setOnlyCurrentPage(false)} 
            className="text-primary hover:underline ml-1"
          >
            show all
          </button>
        </div>
      )}
      
      <ScrollArea className="flex-1 bg-transparent">
        <div className="p-3 space-y-3">
          {filteredComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No comments yet. Click "Add Comment" to leave feedback.
                  </p>
          ) : (
            filteredComments.map((comment, idx) => {
              const isOnDifferentPage = comment.page_path && currentIframePath && comment.page_path !== currentIframePath;
              const pinStatus = getPinStatus(comment);
              const isOffscreen = pinStatus?.kind === 'offscreen';
              const needsRepin = pinStatus?.kind === 'needs-repin';
              const isResolved = comment.status === 'resolved' || !!comment.resolved_at || comment.status === 'wont_do';
              
              return (
                <div
                  id={`comment-card-${comment.id}`}
                  key={comment.id}
                  className={`cursor-pointer transition-all ${
                    focusedCommentId === comment.id || hoveredCommentId === comment.id
                      ? "ring-2 ring-primary rounded-lg"
                      : ""
                  }`}
                  onMouseEnter={() => onHoverComment(comment.id)}
                  onMouseLeave={() => onHoverComment(null)}
                  onClick={() => onFocusComment(comment)}
                >
                  {/* Status badges (needs-repin, offscreen) + repin button */}
                  {!isResolved && (needsRepin || isOffscreen) && (
                    <div className="mb-1 flex items-center gap-1">
                      {needsRepin && (
                        <>
                          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                            <MapPin className="h-3 w-3 mr-1" />
                            Needs re-pin
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
                              Re-pin
                            </Button>
                          )}
                        </>
                      )}
                      {isOffscreen && !needsRepin && (
                        <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Offscreen
                        </Badge>
                      )}
                    </div>
                  )}
                  {/* Page badge + Jump to page button */}
                  {comment.page_path && (
                    <div className="mb-1 flex items-center gap-1 flex-wrap">
                      <Badge variant="outline" className="text-xs font-mono">
                        {comment.page_path}
                      </Badge>
                      {comment.breakpoint && (
                        <Badge variant="secondary" className="text-xs">
                          {comment.breakpoint}
                        </Badge>
                      )}
                      {isOnDifferentPage && isSameOrigin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[10px] text-primary hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onJumpToPage(comment);
                          }}
                        >
                          Jump to page
                        </Button>
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
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
