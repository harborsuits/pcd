import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, MessageCircle, X, ExternalLink, Maximize2, Minimize2, ChevronRight, ChevronLeft, AlertTriangle, Target, ChevronUp, ChevronDown, Archive, ArchiveRestore, Copy, Bug, FlaskConical } from "lucide-react";

// ============ Contract Test Helpers ============
function pcdAssert(condition: unknown, msg: string) {
  if (!condition) throw new Error(`[PCD Contract] ${msg}`);
}

interface ContractTestOpts {
  postToIframe: (msg: unknown) => void;
  getActiveAnchors: () => Array<{
    id: string;
    anchorKey?: string | null;
    selector?: string | null;
    textHint?: string | null;
  }>;
  waitForRects: (requestId: string, timeoutMs?: number) => Promise<Record<string, unknown>>;
}

async function runPcdRectContractTest(opts: ContractTestOpts) {
  const anchors = opts.getActiveAnchors().slice(0, 5);

  pcdAssert(anchors.length > 0, "No anchors available to test (need at least 1 pinned comment on this page).");

  const ids = anchors.map(a => a.id);
  pcdAssert(ids.every(Boolean), "Anchor entries must include id (comment.id).");
  pcdAssert(new Set(ids).size === ids.length, "Anchor ids must be unique.");

  const requestId = `pcd_contract_${Date.now()}`;

  opts.postToIframe({
    __pcd: true,
    type: "PCD_GET_RECTS",
    requestId,
    anchors: anchors.map(a => ({
      id: a.id,
      anchorKey: a.anchorKey ?? null,
      selector: a.selector ?? null,
      textHint: a.textHint ?? null,
    })),
  });

  const rects = await opts.waitForRects(requestId, 2500);

  pcdAssert(rects && typeof rects === "object", "PCD_RECTS.rects must be an object.");
  for (const a of anchors) {
    pcdAssert(
      Object.prototype.hasOwnProperty.call(rects, a.id),
      `Missing rect for id=${a.id}. (Expected rects keyed by comment.id)`
    );
    const r = rects[a.id] as { left?: number; top?: number } | null;
    if (r !== null) {
      pcdAssert(typeof r.left === "number", `rect.left must be number for id=${a.id}`);
      pcdAssert(typeof r.top === "number", `rect.top must be number for id=${a.id}`);
    }
  }

  return { ok: true, tested: anchors.length };
}

// ============ Pin Debug State Type ============
type PinDebugState = {
  bridgeReady: boolean;
  currentPageKey: string;
  lastIframeUrl?: string;
  lastPageChangeAt?: number;
  lastHighlightsSent?: { count: number; at: number };
  lastRectsRequested?: { count: number; requestId: string; at: number };
  lastRectsReceived?: { keys: number; requestId: string; at: number };
  rectCacheKeys: number;
  pinnedOnPage: number;
  pinnedTotal: number;
  lastError?: string;
};
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PortalCommentCard } from "./PortalCommentCard";
import { toast } from "@/hooks/use-toast";
// Normalize page URL to a consistent key for matching
// Uses pathname + search + hash only, strips trailing slash
function normalizePageKey(url: string | null | undefined): string {
  if (!url) return "/";
  try {
    const u = new URL(url, "http://dummy.local");
    const path = (u.pathname || "/").replace(/\/+$/, "") || "/";
    return `${path}${u.search || ""}${u.hash || ""}`;
  } catch {
    // If it's already a path or invalid, just clean it up
    const s = (url || "/").trim();
    return (s.replace(/\/+$/, "") || "/");
  }
}

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
  click?: { x: number; y: number };  // Actual click point in viewport coords
  scroll: { x: number; y: number };
  viewport: { w: number; h: number };
  textOffset?: number | null;
  textContext?: string | null;
  textHint?: string | null;
  url?: string;  // Current page URL from helper (for page-specific pins)
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
  // Store normalized (0-1) coords so pins survive layout changes (sidebar open/close)
  const [pendingPin, setPendingPin] = useState<{ anchorData: CommentAnchorData; normPos: { nx: number; ny: number } } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  
  // Direct prototype URL - proxy approach has infrastructure issues
  const iframeSrc = prototype.url;
  
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(true);
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  // Sticky selection: persists until user explicitly selects another comment
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [repinTargetId, setRepinTargetId] = useState<string | null>(null);
  const [clickFeedback, setClickFeedback] = useState<{ x: number; y: number } | null>(null);
  const [showDebugDrawer, setShowDebugDrawer] = useState(false);
  
  // Hover state for pin preview tooltip
  type HoverPayload = {
    selector: string | null;
    id?: string | null;
    anchorKey?: string | null;
    rect?: { left: number; top: number; width: number; height: number } | null;
    viewport?: { w: number; h: number } | null;
    textHint?: string | null;
    textContext?: string | null;
    ts?: number;
  };
  const [hover, setHover] = useState<HoverPayload | null>(null);
  
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

  // Bridge state with health monitoring
  const [bridgeReady, setBridgeReady] = useState(false);
  const [bridgeHealth, setBridgeHealth] = useState({
    helperReady: false,
    lastReadyAt: 0,
    lastPongAt: 0,
  });
  const [iframeViewport, setIframeViewport] = useState<{ w: number; h: number; scrollX: number; scrollY: number } | null>(null);
  const lastIframeClick = useRef<IframeClickMessage | null>(null);
  
  // Track current iframe page URL for filtering comments by page
  // Initialize with prototype base URL so pins filter correctly even without bridge
  const [currentIframePage, setCurrentIframePage] = useState<string | null>(() => {
    try {
      const u = new URL(prototype.url);
      return u.pathname + u.search + u.hash || "/";
    } catch {
      return "/";
    }
  });
  
  // Rect cache: commentId → element rect in iframe viewport coords
  const [rectCache, setRectCache] = useState<Record<string, { left: number; top: number; width: number; height: number } | null>>({});
  const pendingRectRequests = useRef<Map<string, (rect: { left: number; top: number; width: number; height: number } | null) => void>>(new Map());
  
  // Contract test: pending rects promises for awaiting responses
  const pendingRectsPromisesRef = useRef<Map<string, {
    resolve: (rects: Record<string, unknown>) => void;
    reject: (err: unknown) => void;
    t: number;
  }>>(new Map());
  
  // Ref to hold current activeHighlightItems for use in message handler (avoids dependency issues)
  const activeHighlightItemsRef = useRef<Array<{ id: string; anchorKey: string | null; selector: string | null; textHint: string | null }>>([]);
  
  // Throttle scroll-based rect requests to avoid flooding the bridge
  const lastScrollRectRequestRef = useRef<number>(0);
  
  // Pin debug observability state
  const [pinDebug, setPinDebug] = useState<PinDebugState>(() => ({
    bridgeReady: false,
    currentPageKey: "",
    rectCacheKeys: 0,
    pinnedOnPage: 0,
    pinnedTotal: 0,
  }));
  const rectRefreshRaf = useRef<number | null>(null);
  
  // Derived bridge status
  const bridgeAlive = bridgeHealth.helperReady && (Date.now() - bridgeHealth.lastPongAt) < 3000;

  // Filter out archived comments from main views
  const activeComments = comments.filter((c) => !c.archived_at);
  
  // Normalized current page key for filtering
  const currentPageKey = useMemo(() => normalizePageKey(currentIframePage), [currentIframePage]);
  
  // Filter comments by current page using normalized keys
  // CRITICAL: Only filter if we're receiving reliable page change events from bridge
  // Otherwise, show ALL comments to avoid pins "disappearing" or showing on wrong pages
  const basePrototypeKey = useMemo(() => normalizePageKey(prototype?.url || ""), [prototype?.url]);
  
  // Track if we've received a real page change from bridge (not just initialization)
  const [hasReceivedPageChange, setHasReceivedPageChange] = useState(false);
  
  const pageComments = useMemo(() => {
    // If bridge isn't sending page changes, show ALL comments
    // This is safer than filtering incorrectly
    if (!hasReceivedPageChange || !bridgeReady) {
      return activeComments;
    }
    
    return activeComments.filter((comment) => {
      const commentKey = normalizePageKey(comment.page_url || "");
      
      // Legacy comment: no page_url OR page_url is exactly the base prototype URL (no path)
      // These are pins created before page tracking was fixed
      const isLegacyComment = !comment.page_url || 
        !commentKey || 
        commentKey === "/" ||
        commentKey === basePrototypeKey;
      
      if (isLegacyComment) {
        // Legacy comments: show on ALL pages until they're reconciled
        // This prevents pins from "disappearing" when navigating
        return true;
      }
      
      // Normal comment: match by page key
      return commentKey === currentPageKey;
    });
  }, [activeComments, currentPageKey, basePrototypeKey, hasReceivedPageChange, bridgeReady]);
  
  // Debug toggle: show ALL pins regardless of page (for troubleshooting)
  const [showAllPinsDebug, setShowAllPinsDebug] = useState(false);
  
  // Use debug toggle to bypass page filtering
  const visibleComments = showAllPinsDebug ? activeComments : pageComments;
  
  const unresolvedComments = visibleComments.filter((c) => !c.resolved_at && c.status !== 'resolved' && c.status !== 'wont_do');
  const resolvedComments = visibleComments.filter((c) => c.resolved_at || c.status === 'resolved' || c.status === 'wont_do');

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
      
      // Accept from iframe origin OR if we don't have one yet, check against iframeSrc
      const acceptedOrigin = iframeOrigin || (() => {
        try { return new URL(iframeSrc).origin; } catch { return null; }
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
        case "PCD_HELPER_READY":  // Helper sends this (not PCD_IFRAME_READY)
        case "PCD_IFRAME_READY":  // Keep for backwards compatibility
          console.log("[Bridge] Helper ready, page:", data.url, "→ normalized:", normalizePageKey(data.url));
          setBridgeReady(true);
          setBridgeHealth(s => ({ ...s, helperReady: true, lastReadyAt: Date.now() }));
          // Capture the current page URL from the iframe (store raw, normalize on filter)
          if (data.url) {
            setCurrentIframePage(data.url);
            setHasReceivedPageChange(true);  // Mark as receiving page info
          }
          if (PCD_DEBUG) {
            setPcdHud(s => ({ ...s, bridgeReady: true }));
          }
          // Update pin debug observability
          setPinDebug(d => ({
            ...d,
            bridgeReady: true,
            lastIframeUrl: data.url ?? undefined,
          }));
          break;

        case "PCD_CLICK": {
          // Demo sites may send page URL as "url", "page", or "href" - check all
          const clickPage = 
            (typeof (data as any).url === "string" ? (data as any).url : "") ||
            (typeof (data as any).page === "string" ? (data as any).page : "") ||
            (typeof (data as any).href === "string" ? (data as any).href : "");
          
          // Build a proper typed message with url included
          const msg: IframeClickMessage = {
            ...(data as IframeClickMessage),
            url: clickPage || undefined,  // Ensure url is set
          };
          
          console.log("[Bridge] Click:", msg.selector, msg.anchorKey, "page:", clickPage);
          lastIframeClick.current = msg;
          
          // Update current page from click - makes page tracking robust
          if (clickPage) {
            setCurrentIframePage(clickPage);
            setHasReceivedPageChange(true);
          }
          
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
          // CRITICAL: Request fresh rects on scroll so pins re-anchor to elements' NEW positions
          // Throttle to max once per 100ms to avoid flooding the bridge
          const now = Date.now();
          if (now - lastScrollRectRequestRef.current >= 100) {
            lastScrollRectRequestRef.current = now;
            const items = activeHighlightItemsRef.current;
            if (iframeRef.current?.contentWindow && items.length > 0) {
              const anchors = items.map(item => ({
                id: item.id,
                anchorKey: item.anchorKey,
                selector: item.selector,
                textHint: item.textHint,
              }));
              iframeRef.current.contentWindow.postMessage(
                { __pcd: true, type: "PCD_GET_RECTS", requestId: `scroll-${now}`, anchors },
                "*"
              );
            }
          }
          break;
        }

        case "PCD_PAGE_CHANGE": {
          // User navigated to a different page in the iframe
          const newPageKey = normalizePageKey(data.url);
          console.log("[Bridge] Page changed:", data.url, "→ normalized:", newPageKey);
          if (data.url) {
            setCurrentIframePage(data.url);
            // Mark that we're receiving reliable page changes from bridge
            setHasReceivedPageChange(true);
            // Clear rect cache since elements on new page are different
            setRectCache({});
            // Clear any pending pin since it was for the previous page
            setPendingPin(null);
            setCommentText("");
            // CRITICAL: Clear repin mode to prevent accidentally repinning comments to new page
            setRepinTargetId(null);
            // Also clear adding comment mode
            setIsAddingComment(false);
            // Update pin debug observability
            setPinDebug(d => ({
              ...d,
              lastPageChangeAt: Date.now(),
              currentPageKey: newPageKey,
              rectCacheKeys: 0,
            }));
          }
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

        case "PCD_RECTS": {
          // Batch rect response - update rectCache with all rects (keyed by comment ID)
          const requestId = data.requestId as string | undefined;
          const rects = data.rects as Record<string, { left: number; top: number; width: number; height: number } | null>;
          const rectKeys = Object.keys(rects || {}).length;
          console.log("[Bridge] Received PCD_RECTS:", rectKeys, "rects", requestId ? `(rid=${requestId})` : "");
          
          // Resolve waiting contract tests (if any)
          if (requestId && pendingRectsPromisesRef.current.has(requestId)) {
            const pending = pendingRectsPromisesRef.current.get(requestId);
            pendingRectsPromisesRef.current.delete(requestId);
            pending?.resolve(rects || {});
          }
          
          // Update pin debug observability
          setPinDebug(d => ({
            ...d,
            lastRectsReceived: { keys: rectKeys, requestId: requestId || "batch", at: Date.now() },
          }));
          
          if (rects) {
            // Filter out null rects before merging
            const validRects: typeof rects = {};
            for (const [key, val] of Object.entries(rects)) {
              if (val) validRects[key] = val;
            }
            setRectCache(prev => {
              const merged = { ...prev, ...validRects };
              // Update rectCacheKeys after merge
              setPinDebug(d => ({ ...d, rectCacheKeys: Object.keys(merged).length }));
              return merged;
            });
          }
          break;
        }

        case "PCD_HOVER": {
          // Only care when user is trying to place/re-pin
          if (!isAddingComment && !repinTargetId) return;
          setHover({
            selector: data.selector ?? null,
            id: data.id ?? null,
            anchorKey: data.anchorKey ?? null,
            rect: data.rect ?? null,
            viewport: data.viewport ?? null,
            textHint: data.textHint ?? null,
            textContext: data.textContext ?? null,
            ts: data.ts ?? Date.now(),
          });
          break;
        }

        case "PCD_KEY": {
          const key = String(data.key || "");
          
          // Keyboard shortcuts controlled from inside iframe
          if (key === "Escape") {
            setIsAddingComment(false);
            setRepinTargetId(null);
            setHover(null);
            toast({ title: "Cancelled" });
            return;
          }

          if (key.toLowerCase() === "c") {
            setRepinTargetId(null);
            setIsAddingComment(true);
            toast({ title: "Click the site to place a comment" });
            return;
          }

          if (key.toLowerCase() === "p") {
            if (isAddingComment || repinTargetId) {
              setIsAddingComment(false);
              setRepinTargetId(null);
              setHover(null);
              toast({ title: "Pin mode off" });
            } else {
              setIsAddingComment(true);
              toast({ title: "Pin mode on", description: "Click the site to place a comment" });
            }
            return;
          }
          break;
        }

        case "PCD_PONG": {
          // Bridge health check response - if we get pong, bridge is definitely alive
          console.log("[Bridge] Pong received");
          setBridgeHealth(s => ({ ...s, helperReady: true, lastPongAt: Date.now() }));
          // CRITICAL: If we receive a pong, the bridge IS working - set it ready!
          // This handles cases where PCD_HELPER_READY was missed (race condition, SPA nav, etc.)
          if (!bridgeReady) {
            console.log("[Bridge] Setting bridgeReady=true from PONG (was false)");
            setBridgeReady(true);
            setPinDebug(d => ({ ...d, bridgeReady: true }));
          }
          // Also capture page URL from pong if available
          if (data.url && !currentIframePage) {
            setCurrentIframePage(data.url);
            setHasReceivedPageChange(true);
          }
          break;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [iframeSrc, PCD_DEBUG, getIframeOrigin, bridgeReady, currentIframePage]);

  // Request element rect from iframe (multi-strategy lookup with textHint fallback)
  const requestRect = useCallback((selector: string | null, anchorId: string | null, textHint?: string | null): Promise<{ left: number; top: number; width: number; height: number } | null> => {
    return new Promise((resolve) => {
      if (!bridgeReady || !iframeRef.current?.contentWindow || (!selector && !anchorId && !textHint)) {
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
          { 
            type: "PCD_GET_RECT", 
            requestId, 
            selector, 
            // Pass anchor_id as both 'id' and 'anchorKey' for compatibility
            id: anchorId,
            anchorKey: anchorId,
            // Pass textHint for text-based fallback lookup
            textHint: textHint ?? null,
          },
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
    
    const anchored = unresolvedComments.filter(c => c.anchor_selector || c.anchor_id || c.text_hint);
    
    for (const c of anchored) {
      // Pass textHint for multi-strategy fallback lookup
      const rect = await requestRect(c.anchor_selector ?? null, c.anchor_id ?? null, c.text_hint ?? null);
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
    setBridgeHealth({ helperReady: false, lastReadyAt: 0, lastPongAt: 0 });
    setRectCache({});
    lastIframeClick.current = null;
  }, [iframeKey]);

  // Ping loop for bridge health monitoring
  useEffect(() => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;

    const id = window.setInterval(() => {
      try { w.postMessage({ type: "PCD_PING" }, "*"); } catch {}
    }, 1500);

    return () => window.clearInterval(id);
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

  // Build list of "active" comments that should show persistent cyan borders
  // Open/In-progress = highlighted, Resolved/Archived = not highlighted
  // IMPORTANT: Only show highlights for comments that pass current visibility filter
  // Include selector for fallback (anchor attributes are lost on page reload)
  // Include textHint for BugHerd-grade text-based element lookup fallback
  const activeHighlightItems = useMemo(() => {
    return visibleComments
      .filter((c) => {
        const status = getEffectiveStatus(c);
        return (status === "open" || status === "in_progress") && !c.archived_at;
      })
      .filter((c) => !!c.anchor_id || !!c.anchor_selector) // must be pinned (check both)
      .map((c, idx) => ({
        id: c.id, // comment ID for mapping rects back
        anchorKey: c.anchor_id,
        selector: c.anchor_selector, // semantic or structural selector
        textHint: c.text_hint, // for text-based fallback lookup
        label: String(idx + 1), // numbering badge
      }));
  }, [visibleComments]);
  
  // Keep ref in sync with activeHighlightItems so scroll handler can access current list
  useEffect(() => {
    activeHighlightItemsRef.current = activeHighlightItems;
  }, [activeHighlightItems]);

  // Contract test helper: await rects by requestId
  const awaitRects = useCallback((requestId: string, timeoutMs = 2500): Promise<Record<string, unknown>> => {
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const t = window.setTimeout(() => {
        pendingRectsPromisesRef.current.delete(requestId);
        reject(new Error(`[PCD Contract] Timeout waiting for PCD_RECTS requestId=${requestId}`));
      }, timeoutMs);

      pendingRectsPromisesRef.current.set(requestId, {
        resolve: (rects) => { window.clearTimeout(t); resolve(rects); },
        reject: (err) => { window.clearTimeout(t); reject(err); },
        t: Date.now(),
      });
    });
  }, []);

  // Helper to post message to iframe
  const postToIframe = useCallback((msg: unknown) => {
    if (!iframeRef.current?.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(msg, "*");
    } catch (e) {
      console.warn("[Bridge] Failed to postMessage:", e);
    }
  }, []);

  // SYNC PINS routine: runs on page change and bridge ready
  // 1. Re-send highlights list for current page
  // 2. Request fresh rects for all anchors (batch request)
  // This is what makes pins "reappear" after navigating back to a page
  useEffect(() => {
    if (!bridgeReady || !iframeRef.current?.contentWindow) return;

    // Wait for iframe helper script to fully initialize after page load
    // 300ms gives enough time for the helper script to settle + re-stamp elements
    const timer = setTimeout(() => {
      try {
        const win = iframeRef.current?.contentWindow;
        if (!win) return;
        
        // Step 1: Send highlight items
        win.postMessage(
          { __pcd: true, type: "PCD_HIGHLIGHTS_SET", items: activeHighlightItems },
          "*"
        );
        console.log("[Bridge] Sent PCD_HIGHLIGHTS_SET:", activeHighlightItems.length, "items for page:", currentPageKey);
        
        // Update pin debug: highlights sent
        setPinDebug(d => ({
          ...d,
          lastHighlightsSent: { count: activeHighlightItems.length, at: Date.now() },
          pinnedOnPage: activeHighlightItems.length,
          pinnedTotal: comments.filter(c => !!c.anchor_selector || !!c.anchor_id).length,
          currentPageKey,
        }));
        
        // Step 2: Request batch rects for all anchored comments on this page
        // Include textHint for text-based fallback lookup, and ID for mapping back
        const anchors = activeHighlightItems.map(item => ({
          id: item.id, // comment ID - will be echoed back for cache keying
          anchorKey: item.anchorKey,
          selector: item.selector,
          textHint: item.textHint, // for BugHerd-grade text-based reacquisition
        }));
        
        if (anchors.length > 0) {
          const requestId = `batch-${Date.now()}`;
          win.postMessage(
            { __pcd: true, type: "PCD_GET_RECTS", requestId, anchors },
            "*"
          );
          console.log("[Bridge] Sent PCD_GET_RECTS for", anchors.length, "anchors");
          
          // Update pin debug: rects requested
          setPinDebug(d => ({
            ...d,
            lastRectsRequested: { count: anchors.length, requestId, at: Date.now() },
          }));
        }
      } catch (e) {
        console.warn("[Bridge] Failed to sync pins:", e);
        setPinDebug(d => ({ ...d, lastError: String(e) }));
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [bridgeReady, activeHighlightItems, currentPageKey, comments]);

  // Clear hover when leaving pin mode
  useEffect(() => {
    if (!isAddingComment && !repinTargetId) setHover(null);
  }, [isAddingComment, repinTargetId]);

  // Send PCD_FOCUS to iframe when a comment is selected (sticky selection)
  // Uses selectedCommentId which only changes when user clicks a different comment
  useEffect(() => {
    if (!bridgeReady || !iframeRef.current?.contentWindow) return;
    
    // Only clear focus when no comment is selected
    if (!selectedCommentId) {
      try {
        iframeRef.current.contentWindow.postMessage({ type: "PCD_CLEAR_FOCUS" }, "*");
      } catch {}
      return;
    }
    
    const selected = comments.find(c => c.id === selectedCommentId);
    
    // If selected comment lacks anchor, do nothing (keep previous focus visible)
    if (!selected?.anchor_id && !selected?.anchor_selector) return;
    
    // Focus the element in iframe with lock: true to prevent clicks from clearing it
    // Include textHint for BugHerd-grade text-based fallback lookup
    try {
      iframeRef.current.contentWindow.postMessage(
        { 
          type: "PCD_FOCUS", 
          anchorKey: selected.anchor_id,
          selector: selected.anchor_selector,
          textHint: selected.text_hint, // for text-based reacquisition
          lock: true // 🔐 Focus is locked until explicitly cleared
        },
        "*"
      );
    } catch {}
  }, [bridgeReady, selectedCommentId, comments]);

  // Escape key clears selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedCommentId) {
        setSelectedCommentId(null);
        setFocusedCommentId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCommentId]);

  // Helper: convert iframe-viewport rect → overlay coords
  const iframeRectToOverlayRect = useCallback((
    r: { left: number; top: number; width: number; height: number } | null | undefined
  ) => {
    if (!iframeRef.current || !r) return null;
    const ib = iframeRef.current.getBoundingClientRect();
    return {
      left: ib.left + r.left,
      top: ib.top + r.top,
      width: r.width,
      height: r.height,
    };
  }, []);

  // Calculate pin position - uses anchor element's current position + click offset within element
  // Falls back to stored pin_x/pin_y percentages when bridge isn't available
  const getPinPosition = useCallback((comment: PrototypeComment): PinPositionResult => {
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
    
    // If we have bridge + rect cache, use element-anchored positioning
    if (bridgeReady && (comment.anchor_selector || comment.anchor_id)) {
      const rect = rectCache[comment.id];
      if (rect) {
        // Pin position strategy:
        // - We use the element's CURRENT rect (which updates as user scrolls via rectCache refresh)
        // - For pins with x_pct/y_pct, we calculate offset within the element
        // - This way, pins stay anchored to their element as the page scrolls
        let pinCenterX: number;
        let pinCenterY: number;
        
        if (comment.x_pct != null && comment.y_pct != null) {
          // x_pct/y_pct are percentages within the element (0-100)
          // Use element's current rect + offset within element
          pinCenterX = rect.left + (comment.x_pct / 100) * rect.width;
          pinCenterY = rect.top + (comment.y_pct / 100) * rect.height;
        } else {
          // Fallback: use element center
          pinCenterX = rect.left + rect.width / 2;
          pinCenterY = rect.top + rect.height / 2;
        }
        
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
      }
    }
    
    // FALLBACK: Use stored pin_x/pin_y percentages
    // These are DOCUMENT-relative percentages (where in the full page the click was)
    // We need to account for current scroll position to anchor pins to content
    if (comment.pin_x != null && comment.pin_y != null) {
      // Get current scroll position from iframeViewport (updated via PCD_SCROLL messages)
      const currentScrollY = iframeViewport?.scrollY ?? 0;
      const storedScrollY = comment.scroll_y ?? 0;
      const storedViewportH = comment.viewport_h ?? viewportH;
      
      // pin_y was saved as a % of the document at the time of pinning
      // When user scrolls, we need to offset the pin by the scroll delta
      const scrollDelta = currentScrollY - storedScrollY;
      
      // Convert pin_y from document % to current viewport position
      // Original: pinCenterY = pin_y% of storedViewportH, relative to storedScrollY
      // Now we need to adjust for how much user has scrolled since
      const pinCenterX = (comment.pin_x / 100) * viewportW;
      const pinDocumentY = (comment.pin_y / 100) * storedViewportH + storedScrollY;
      const pinCenterY = pinDocumentY - currentScrollY;
      
      // Check if offscreen due to scrolling
      const isOffscreen = pinCenterY < 0 || pinCenterY > viewportH;
      
      if (isOffscreen) {
        const direction = pinCenterY < 0 ? 'up' : 'down';
        let edgeLeft: number, edgeTop: number;
        if (direction === 'up') {
          edgeLeft = offsetX + Math.max(16, Math.min(viewportW - 16, pinCenterX));
          edgeTop = offsetY + 16;
        } else {
          edgeLeft = offsetX + Math.max(16, Math.min(viewportW - 16, pinCenterX));
          edgeTop = offsetY + viewportH - 16;
        }
        return { kind: 'offscreen', direction, edgeLeft, edgeTop };
      }
      
      return { 
        kind: 'visible', 
        left: offsetX + pinCenterX, 
        top: offsetY + pinCenterY 
      };
    }
    
    // No position data available
    return { kind: 'no-anchor' };
  }, [bridgeReady, rectCache, iframeViewport]);

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
    
    const overlayRect = overlayEl.getBoundingClientRect();
    
    // Use actual click point if available, fallback to element center
    const pixelX = click.click?.x ?? (click.rect.left + click.rect.width / 2);
    const pixelY = click.click?.y ?? (click.rect.top + click.rect.height / 2);
    
    // Store NORMALIZED (0-1) coords so they survive layout changes
    const nx = pixelX / overlayRect.width;
    const ny = pixelY / overlayRect.height;
    
    // Convert to % for DB persistence
    const pin_x = nx * 100;
    const pin_y = ny * 100;
    
    console.log('[PCD Pin] Position:', { 
      rectLeft: click.rect.left, rectTop: click.rect.top,
      pixelX, pixelY, nx, ny,
      pin_x, pin_y,
      overlayW: overlayRect.width, overlayH: overlayRect.height,
    });

    // Use page URL from click message (most accurate), fall back to tracked state, then prototype base
    // The click message includes the exact URL at the moment of click
    const actualPageUrl = click.url || currentIframePage || prototype.url;
    console.log('[PCD Pin] Page URL:', actualPageUrl, '(from click.url:', click.url, ', currentIframePage:', currentIframePage, ')');
    
    const anchorData: CommentAnchorData = {
      page_url: actualPageUrl,
      page_path: normalizePageKey(actualPageUrl),
      scroll_y: click.scroll?.y ?? 0,
      viewport_w: click.viewport?.w ?? window.innerWidth,
      viewport_h: click.viewport?.h ?? window.innerHeight,
      breakpoint: getBreakpoint(click.viewport?.w ?? window.innerWidth),
      // Use anchorKey (the stable data-pcd-anchor stamp) for anchor_id
      anchor_id: click.anchorKey ?? click.id,
      anchor_selector: click.selector,
      // x_pct/y_pct: percentage WITHIN the element (so pin stays anchored as element moves)
      x_pct: ((click.click?.x ?? (click.rect.left + click.rect.width / 2)) - click.rect.left) / click.rect.width * 100,
      y_pct: ((click.click?.y ?? (click.rect.top + click.rect.height / 2)) - click.rect.top) / click.rect.height * 100,
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
    setPendingPin({ anchorData, normPos: { nx, ny } });
  }, [prototype.url, currentIframePage, isAddingComment, repinTargetId, onRepinComment, refreshRects]);

  // Listen for iframe clicks via custom event
  useEffect(() => {
    if (!isAddingComment && !repinTargetId) return;
    
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<IframeClickMessage>).detail;
      
      // Show click feedback
      const iframeEl = iframeRef.current;
      if (iframeEl) {
        const iframeRect = iframeEl.getBoundingClientRect();
        const clickX = iframeRect.left + (msg.click?.x ?? (msg.rect.left + msg.rect.width / 2));
        const clickY = iframeRect.top + (msg.click?.y ?? (msg.rect.top + msg.rect.height / 2));
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

  // Fix existing pins by reconciling them to the current page
  // This uses the bridge to detect which pins' anchors exist on this page
  const [reconciling, setReconciling] = useState(false);
  
  const fixExistingPinPageAssociations = useCallback(async () => {
    if (!bridgeReady) {
      toast({ title: "Bridge not ready", description: "Cannot reconcile pages without the helper script.", variant: "destructive" });
      return;
    }
    if (!currentIframePage) {
      toast({ title: "No current page", description: "Cannot determine current iframe page.", variant: "destructive" });
      return;
    }
    if (!iframeRef.current?.contentWindow) {
      toast({ title: "No iframe", variant: "destructive" });
      return;
    }

    const baseKey = normalizePageKey(prototype.url);
    const currentKey = normalizePageKey(currentIframePage);

    // Find candidates: comments with bad/missing page info
    // "bad" means: page_path is null OR page_url equals base prototype URL OR page_path equals base key
    const candidates = comments.filter(c => {
      const commentKey = normalizePageKey(c.page_url || c.page_path || "");
      // Must have an anchor to be reconcilable
      if (!c.anchor_selector && !c.anchor_id && !c.text_hint) return false;
      // Check if page info is missing or equals the base prototype URL
      return !commentKey || commentKey === baseKey || !c.page_path;
    });

    if (candidates.length === 0) {
      toast({ title: "No pins to reconcile", description: "All anchored pins on this project already have page associations." });
      return;
    }

    setReconciling(true);
    
    try {
      // Build anchors list for PCD_GET_RECTS
      const anchors = candidates.map(c => ({
        id: c.id,
        anchorKey: c.anchor_id ?? null,
        selector: c.anchor_selector ?? null,
        textHint: c.text_hint ?? null,
      }));

      // Send PCD_GET_RECTS request
      const requestId = `reconcile-${Date.now()}`;
      iframeRef.current.contentWindow.postMessage(
        { __pcd: true, type: "PCD_GET_RECTS", requestId, anchors },
        "*"
      );

      console.log(`[Reconcile] Sent PCD_GET_RECTS for ${anchors.length} candidates, requestId=${requestId}`);

      // Wait for response
      const rects = await awaitRects(requestId, 5000) as Record<string, { left: number; top: number; width: number; height: number } | null>;

      // Find which candidates have non-null rects (i.e., their anchors exist on this page)
      const resolvedHereIds = candidates
        .filter(c => rects[c.id] != null)
        .map(c => c.id);

      console.log(`[Reconcile] Found ${resolvedHereIds.length} pins on this page out of ${candidates.length} candidates`);

      if (resolvedHereIds.length === 0) {
        toast({ title: "No pins found on this page", description: `Checked ${candidates.length} candidates, none have anchors visible here.` });
        return;
      }

      // Call backend to update page fields
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal/${token}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "set_page",
            prototype_id: prototype.id,
            comment_ids: resolvedHereIds,
            page_url: currentIframePage,
            page_path: currentKey,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update page associations");
      }

      const result = await response.json();
      console.log(`[Reconcile] Updated ${result.updated} comments to page: ${currentKey}`);

      toast({ 
        title: "Pins reconciled!", 
        description: `${resolvedHereIds.length} pin(s) associated with "${currentKey}"` 
      });

      // Refresh comments to reflect changes
      onRefresh();

    } catch (e) {
      console.error("[Reconcile] Error:", e);
      toast({ 
        title: "Reconciliation failed", 
        description: e instanceof Error ? e.message : "Unknown error", 
        variant: "destructive" 
      });
    } finally {
      setReconciling(false);
    }
  }, [bridgeReady, currentIframePage, prototype.url, prototype.id, comments, token, awaitRects, onRefresh]);

  const focusComment = useCallback((comment: PrototypeComment) => {
    setFocusedCommentId(comment.id);
    setHoveredCommentId(comment.id);
    // Set sticky selection - this is what drives PCD_FOCUS
    setSelectedCommentId(comment.id);
    
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
    const isSelected = isFocused || isHovered;
    
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
            } ${isSelected ? 'scale-125 ring-2 ring-primary/50' : ''}`}
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
    
    // Visible pin - enhanced when selected
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
        {/* Selected state: larger icon with glow + element badge */}
        {isSelected ? (
          <div className="relative">
            {/* Pulsing ring effect */}
            <div className="absolute inset-0 w-10 h-10 -ml-2 -mt-2 rounded-full bg-primary/20 animate-ping" />
            {/* Main selected icon */}
            <div
              className={`relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                status === 'in_progress' 
                  ? 'bg-amber-500 text-black ring-4 ring-amber-400/40' 
                  : 'bg-primary text-primary-foreground ring-4 ring-primary/40'
              } shadow-lg`}
              title={comment.body}
              onMouseEnter={() => setHoveredCommentId(comment.id)}
              onMouseLeave={() => setHoveredCommentId(null)}
              onClick={(e) => {
                e.stopPropagation();
                setShowCommentsSidebar(true);
                focusComment(comment);
              }}
            >
              <MessageCircle className="h-5 w-5" />
            </div>
            {/* Element badge - shows what this comment refers to */}
            {comment.text_hint && (
              <div
                className="absolute left-12 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs bg-background/95 border border-border shadow-lg whitespace-nowrap max-w-48 truncate flex items-center gap-1.5 pointer-events-none"
              >
                <Target className="h-3 w-3 shrink-0 text-primary" />
                <span className="truncate">{comment.text_hint}</span>
              </div>
            )}
          </div>
        ) : (
          /* Default pin state */
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-transform ${
              status === 'in_progress' 
                ? 'bg-amber-500 text-black shadow-[0_0_0_4px_rgba(245,158,11,0.2)]' 
                : 'bg-primary text-primary-foreground shadow-[0_0_0_4px_rgba(59,130,246,0.18)]'
            }`}
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
        )}
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
          {/* Bridge status - 3 states: green (alive), yellow (ready but stale), red (not connected) */}
          <Badge 
            variant="outline" 
            className={`text-xs ${
              bridgeAlive 
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : bridgeHealth.helperReady
                  ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                  : "bg-red-500/10 text-red-600 border-red-500/20"
            }`}
            title={
              bridgeAlive 
                ? "Bridge active - helper script connected and responding" 
                : bridgeHealth.helperReady
                  ? "Bridge stale - helper loaded but not responding (iframe may have navigated)"
                  : "No bridge - helper script not installed in the prototype"
            }
          >
            {bridgeAlive ? "🟢 Bridge Active" : bridgeHealth.helperReady ? "🟡 Bridge Stale" : "🔴 No Bridge"}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDebugDrawer(!showDebugDrawer)}
            title="Toggle bridge debug drawer"
          >
            <Bug className="h-4 w-4" />
          </Button>
          {/* Contract Test Button (DEV only) */}
          {import.meta.env.DEV && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={!bridgeReady || activeHighlightItems.length === 0}
              title={!bridgeReady ? "Bridge not ready" : activeHighlightItems.length === 0 ? "No pinned comments on this page" : "Run pin contract test"}
              onClick={async () => {
                try {
                  const result = await runPcdRectContractTest({
                    postToIframe,
                    getActiveAnchors: () => activeHighlightItems.map(i => ({
                      id: i.id,
                      anchorKey: i.anchorKey,
                      selector: i.selector,
                      textHint: i.textHint,
                    })),
                    waitForRects: awaitRects,
                  });
                  console.info("[PCD Contract] PASS", result);
                  toast({ title: `✓ Contract PASS (tested ${result.tested})`, description: "Parent↔iframe protocol is working correctly" });
                } catch (e: unknown) {
                  console.error("[PCD Contract] FAIL", e);
                  const msg = e instanceof Error ? e.message : String(e);
                  toast({ title: "✗ Contract FAIL", description: msg, variant: "destructive" });
                  setPinDebug(d => ({ ...d, lastError: msg }));
                }
              }}
            >
              <FlaskConical className="h-3 w-3 mr-1" />
              Test
            </Button>
          )}
        </div>
        {/* Current page debug pill */}
        {currentIframePage && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-muted/50 rounded text-xs text-muted-foreground font-mono truncate max-w-[200px]" title={`Raw: ${currentIframePage}\nNormalized: ${currentPageKey}`}>
            📍 {currentPageKey}
          </div>
        )}
      </div>

      {/* Bridge not ready warning with copy helper button */}
      {!bridgeReady && (
        <div className="flex items-center justify-center gap-2 px-3 py-2 border-b border-amber-500/20 bg-amber-500/10 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          <span>Waiting for helper script. Make sure <code className="bg-amber-100 px-1 rounded">pcd-iframe-helper.js</code> is added to the prototype.</span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs border-amber-500/30 text-amber-700 hover:bg-amber-100"
            onClick={async () => {
              const snippet = `<script src="/pcd-iframe-helper.js"></script>`;
              await navigator.clipboard.writeText(snippet);
              toast({ title: "Copied!", description: "Add this to your prototype's index.html" });
            }}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy Script Tag
          </Button>
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
            src={iframeSrc}
            className="w-full h-full border-0"
            style={{ minHeight: isFullscreen ? "calc(100vh - 120px)" : "500px" }}
            title="Prototype preview"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            onLoad={() => {
              // Fallback page detection: when iframe loads a new page, try to detect URL
              // This works for full page navigations (not SPA-style navigations)
              try {
                const iframe = iframeRef.current;
                if (iframe?.contentWindow?.location?.href) {
                  const newUrl = iframe.contentWindow.location.href;
                  const newPath = normalizePageKey(newUrl);
                  console.log("[Iframe] Load detected, path:", newPath);
                  setCurrentIframePage(newUrl);
                  // Clear rect cache for new page
                  setRectCache({});
                }
              } catch {
                // Cross-origin - can't access URL, but we know page changed
                // Reset to root as fallback
                console.log("[Iframe] Load detected (cross-origin), resetting to /");
                setCurrentIframePage("/");
                setRectCache({});
              }
            }}
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

            {/* Pending pin indicator - compute pixels at render time from normalized coords */}
            {pendingPin && overlayRef.current && (() => {
              const rect = overlayRef.current!.getBoundingClientRect();
              const x = pendingPin.normPos.nx * rect.width;
              const y = pendingPin.normPos.ny * rect.height;
              return (
                <div
                  className="absolute w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-pulse shadow-lg pointer-events-none"
                  style={{ 
                    left: x, 
                    top: y,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <MessageCircle className="h-3 w-3" />
                </div>
              );
            })()}

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

            {/* Hover outline + tooltip for pin preview */}
            {(() => {
              const hoverOverlayRect = iframeRectToOverlayRect(hover?.rect ?? null);
              const hoverLabel = (hover?.textHint || hover?.selector || "element").slice(0, 80);
              
              if (!(isAddingComment || repinTargetId) || !hoverOverlayRect) return null;
              
              return (
                <>
                  {/* Hover outline */}
                  <div
                    style={{
                      position: "fixed",
                      left: hoverOverlayRect.left,
                      top: hoverOverlayRect.top,
                      width: hoverOverlayRect.width,
                      height: hoverOverlayRect.height,
                      border: "2px solid rgba(56, 189, 248, 0.9)",
                      borderRadius: 8,
                      boxShadow: "0 0 0 2px rgba(56, 189, 248, 0.18)",
                      pointerEvents: "none",
                      zIndex: 999999,
                    }}
                  />

                  {/* Tooltip */}
                  <div
                    style={{
                      position: "fixed",
                      left: hoverOverlayRect.left + 8,
                      top: Math.max(8, hoverOverlayRect.top - 48),
                      pointerEvents: "none",
                      zIndex: 1000000,
                    }}
                    className="rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
                  >
                    <div className="font-medium">
                      {repinTargetId ? "Re-pin to:" : "Pin to:"} {hoverLabel}
                    </div>
                    <div className="text-muted-foreground">
                      {repinTargetId ? "Click to attach to this element" : "Click to place comment here"} · ESC to cancel
                    </div>
                  </div>
                </>
              );
            })()}
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
            repinTargetId={repinTargetId}
            bridgeReady={bridgeReady}
            getPinStatus={getPinPosition}
            onFocusComment={focusComment}
            onHoverComment={setHoveredCommentId}
            onResolveComment={onResolveComment}
            onUnresolveComment={onUnresolveComment}
            onMarkInProgress={onMarkInProgress}
            onEditComment={onEditComment}
            onRepin={onRepinComment ? (id) => {
              setRepinTargetId(id);
              toast({
                title: "Repin mode active",
                description: "Click on the element this comment refers to",
              });
            } : undefined}
            onCancelRepin={() => setRepinTargetId(null)}
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

      {/* Bridge Debug Drawer */}
      {showDebugDrawer && (
        <div className="fixed bottom-4 right-4 w-80 bg-card border border-border rounded-lg shadow-xl z-50 text-xs">
          <div className="flex items-center justify-between p-2 border-b border-border bg-muted/50 rounded-t-lg">
            <span className="font-semibold flex items-center gap-1">
              <Bug className="h-3 w-3" /> Bridge Debug
            </span>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setShowDebugDrawer(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="p-3 space-y-2 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Helper Ready:</span>
              <span className={bridgeHealth.helperReady ? "text-green-600" : "text-red-600"}>
                {bridgeHealth.helperReady ? "✓ Yes" : "✗ No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bridge Alive:</span>
              <span className={bridgeAlive ? "text-green-600" : "text-yellow-600"}>
                {bridgeAlive ? "✓ Yes" : "✗ Stale"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Ready:</span>
              <span>{bridgeHealth.lastReadyAt ? new Date(bridgeHealth.lastReadyAt).toLocaleTimeString() : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Pong:</span>
              <span>{bridgeHealth.lastPongAt ? new Date(bridgeHealth.lastPongAt).toLocaleTimeString() : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pong Age:</span>
              <span>{bridgeHealth.lastPongAt ? `${Math.round((Date.now() - bridgeHealth.lastPongAt) / 1000)}s ago` : "—"}</span>
            </div>
            {PCD_DEBUG && pcdHud.lastType && (
              <>
                <hr className="border-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Msg:</span>
                  <span className="text-primary">{pcdHud.lastType}</span>
                </div>
                {pcdHud.lastSelector && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Selector:</span>
                    <span className="break-all text-[9px] bg-muted p-1 rounded">{pcdHud.lastSelector}</span>
                  </div>
                )}
                {pcdHud.lastNote && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Note:</span>
                    <span className="break-all text-[9px] bg-muted p-1 rounded">{pcdHud.lastNote}</span>
                  </div>
                )}
              </>
            )}
            <hr className="border-border" />
            
            {/* Pin Debug Observability HUD */}
            <details className="group">
              <summary className="cursor-pointer select-none font-medium text-[10px] flex items-center gap-1">
                <FlaskConical className="h-2.5 w-2.5" />
                Pin Debug HUD
              </summary>
              <div className="mt-2 grid gap-1.5 pl-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">bridgeReady:</span>
                  <span className={pinDebug.bridgeReady ? "text-green-600" : "text-red-600"}>{String(pinDebug.bridgeReady)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">currentPageKey:</span>
                  <span className="truncate max-w-[150px]" title={pinDebug.currentPageKey}>{pinDebug.currentPageKey || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">lastIframeUrl:</span>
                  <span className="truncate max-w-[150px]" title={pinDebug.lastIframeUrl}>{pinDebug.lastIframeUrl?.split('/').pop() || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">pinnedOnPage / Total:</span>
                  <span>{pinDebug.pinnedOnPage} / {pinDebug.pinnedTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">rectCacheKeys:</span>
                  <span>{pinDebug.rectCacheKeys}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">lastHighlightsSent:</span>
                  <span>{pinDebug.lastHighlightsSent ? `${pinDebug.lastHighlightsSent.count} @ ${new Date(pinDebug.lastHighlightsSent.at).toLocaleTimeString()}` : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">lastRectsRequested:</span>
                  <span>{pinDebug.lastRectsRequested ? `${pinDebug.lastRectsRequested.count} (${pinDebug.lastRectsRequested.requestId.slice(0, 12)}...)` : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">lastRectsReceived:</span>
                  <span>{pinDebug.lastRectsReceived ? `${pinDebug.lastRectsReceived.keys} (${pinDebug.lastRectsReceived.requestId.slice(0, 12)}...)` : "-"}</span>
                </div>
                {pinDebug.lastError && (
                  <div className="text-red-600 break-all mt-1">
                    <span className="text-muted-foreground">lastError: </span>
                    {pinDebug.lastError.slice(0, 100)}
                  </div>
                )}
              </div>
            </details>
            
            <hr className="border-border" />
            
            {/* Debug: Show All Pins Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Show all pins (debug)</span>
              <Button
                variant={showAllPinsDebug ? "default" : "outline"}
                size="sm"
                className="h-5 text-[9px] px-2"
                onClick={() => setShowAllPinsDebug(!showAllPinsDebug)}
              >
                {showAllPinsDebug ? "ON" : "OFF"}
              </Button>
            </div>
            {showAllPinsDebug && (
              <p className="text-[9px] text-amber-600 leading-tight">
                ⚠️ Showing ALL pins regardless of page. Turn off to see normal filtering.
              </p>
            )}
            
            <hr className="border-border" />
            
            {/* Page Reconciliation Button */}
            <div className="space-y-2">
              <div className="text-[10px] text-muted-foreground">
                Current page: <span className="font-semibold text-foreground">{currentPageKey}</span>
              </div>
              <Button
                variant="default"
                size="sm"
                className="w-full h-7 text-[10px]"
                onClick={fixExistingPinPageAssociations}
                disabled={!bridgeReady || reconciling}
              >
                {reconciling ? (
                  <>
                    <RefreshCw className="h-2.5 w-2.5 mr-1 animate-spin" />
                    Reconciling...
                  </>
                ) : (
                  <>
                    <Target className="h-2.5 w-2.5 mr-1" />
                    Assign Visible Pins to This Page
                  </>
                )}
              </Button>
              <p className="text-[9px] text-muted-foreground leading-tight">
                Updates pins whose anchors are found on this page: sets page_url &amp; page_key to current route.
              </p>
            </div>
            
            <hr className="border-border" />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-6 text-[10px]"
                onClick={async () => {
                  const snippet = `<script src="/pcd-iframe-helper.js"></script>`;
                  await navigator.clipboard.writeText(snippet);
                  toast({ title: "Copied script tag!" });
                }}
              >
                <Copy className="h-2.5 w-2.5 mr-1" />
                Script Tag
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-6 text-[10px]"
                onClick={() => {
                  window.open("/pcd-iframe-helper.js", "_blank");
                }}
              >
                View Full Script
              </Button>
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

// Comments sidebar
function CommentsSidebar({
  comments,
  token,
  focusedCommentId,
  hoveredCommentId,
  repinTargetId,
  bridgeReady,
  getPinStatus,
  onFocusComment,
  onHoverComment,
  onResolveComment,
  onUnresolveComment,
  onMarkInProgress,
  onEditComment,
  onRepin,
  onCancelRepin,
  onArchiveComment,
  onUnarchiveComment,
}: {
  comments: PrototypeComment[];
  token: string;
  focusedCommentId: string | null;
  hoveredCommentId: string | null;
  repinTargetId: string | null;
  bridgeReady: boolean;
  getPinStatus: (comment: PrototypeComment) => PinPositionResult;
  onFocusComment: (comment: PrototypeComment) => void;
  onHoverComment: (id: string | null) => void;
  onResolveComment: (commentId: string) => Promise<void>;
  onUnresolveComment: (commentId: string) => Promise<void>;
  onMarkInProgress?: (commentId: string) => Promise<void>;
  onEditComment?: (commentId: string, newBody: string) => Promise<void>;
  onRepin?: (commentId: string) => void;
  onCancelRepin?: () => void;
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
              // Check if comment actually HAS pin data saved (anchor_selector or anchor_id)
              // This is independent of whether we can currently display it (current page, bridge status)
              const hasPinData = !!(comment.anchor_selector || comment.anchor_id);
              const isResolved = comment.status === 'resolved' || !!comment.resolved_at || comment.status === 'wont_do';
              const isArchived = !!comment.archived_at;
              const isRepinning = repinTargetId === comment.id;
              
              return (
                <div
                  id={`comment-card-${comment.id}`}
                  key={comment.id}
                  className={`cursor-pointer transition-all ${
                    isRepinning
                      ? "ring-2 ring-amber-500 rounded-lg bg-amber-500/5"
                      : focusedCommentId === comment.id || hoveredCommentId === comment.id
                        ? "ring-2 ring-primary rounded-lg"
                        : ""
                  } ${isArchived ? "opacity-60" : ""}`}
                  onMouseEnter={() => onHoverComment(comment.id)}
                  onMouseLeave={() => onHoverComment(null)}
                  // Use onMouseDownCapture to ensure selection happens before any button handlers
                  onMouseDownCapture={() => onFocusComment(comment)}
                >
                  {/* Repinning indicator */}
                  {isRepinning && (
                    <div className="mb-1 flex items-center gap-1 p-2 rounded-t-lg bg-amber-500/10 border-b border-amber-500/20">
                      <Target className="h-4 w-4 text-amber-600 animate-pulse" />
                      <span className="text-xs text-amber-700 font-medium flex-1">
                        Click an element in the preview...
                      </span>
                      {onCancelRepin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[10px] text-amber-600 hover:text-amber-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelRepin();
                          }}
                        >
                          <X className="h-3 w-3 mr-0.5" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                  {/* Archived badge */}
                  {isArchived && !isRepinning && (
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
                  {!isArchived && !isResolved && !isRepinning && !hasPinData && (
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
                  {!isArchived && !isResolved && !isRepinning && hasPinData && onRepin && (
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
