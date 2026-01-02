# Pinned Comments System — Standard Operating Procedure

> **Pleasant Cove Design (PCD) Internal Playbook**  
> Last updated: January 2026  
> Version: 1.0

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Mother Portal (PCD) Responsibilities](#2-mother-portal-pcd-responsibilities)
3. [Demo/Prototype Site Responsibilities](#3-demoprototype-site-responsibilities)
4. [Where the Helper Script MUST Live](#4-where-the-helper-script-must-live)
5. [Deployment Checklist (Production)](#5-deployment-checklist-production)
6. [Debugging Guide](#6-debugging-guide)
7. [Security and Reliability Notes](#7-security-and-reliability-notes)
8. [Golden Path: Adding a New Client Demo Site](#8-golden-path-adding-a-new-client-demo-site)

---

## 1. Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MOTHER PORTAL (PCD)                              │
│                    (pleasantcovedesign.com)                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │ Operator Portal │  │  Client Portal  │  │   PrototypeViewer       │  │
│  │    (Admin)      │  │  (Customer)     │  │   (Iframe Container)    │  │
│  └─────────────────┘  └─────────────────┘  └───────────┬─────────────┘  │
│                                                        │                 │
│  ┌─────────────────────────────────────────────────────┴───────────────┐ │
│  │                    Comment Sidebar + Pin Overlay                     │ │
│  │  - Renders pins on top of iframe                                     │ │
│  │  - Shows comment composer                                            │ │
│  │  - Manages pin/repin state                                           │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                          postMessage API                                 │
│                           (bidirectional)                                │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │         IFRAME BOUNDARY          │
                    │       (Cross-Origin Wall)        │
                    └────────────────┬────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────┐
│                         DEMO SITE (Client Prototype)                      │
│                    (e.g., client-demo.lovable.app)                        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    pcd-iframe-helper.js                              │ │
│  │  - Listens for PCD_MODE from parent                                  │ │
│  │  - Sends PCD_CLICK / PCD_HOVER / PCD_SCROLL upward                   │ │
│  │  - Responds to PCD_PING with PCD_PONG                                │ │
│  │  - Responds to PCD_GET_RECT with element positions                   │ │
│  │  - Stamps elements with data-pcd-anchor for stability                │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    Demo Site Content                                 │ │
│  │  (React app, static site, any web content)                           │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

### Why Cross-Origin Iframes Require Cooperation

**The Browser Security Model:**
- When an iframe loads content from a different origin (domain), the parent window **cannot access the iframe's DOM**.
- This is enforced by the browser's Same-Origin Policy.
- Example: `pleasantcovedesign.com` cannot read DOM elements inside `client-demo.lovable.app`.

**The Solution: postMessage Bridge**
- The iframe must **voluntarily send** click/hover/scroll events to the parent.
- The parent sends **mode commands** to the iframe (e.g., "enter pin mode").
- Both sides communicate via `window.postMessage()`.

**Data Flow:**

```
Parent → Iframe:
  PCD_MODE { mode: "pin" | "off" }     // Toggle pin mode
  PCD_PING { }                          // Health check
  PCD_GET_RECT { requestId, selector }  // Request element position

Iframe → Parent:
  PCD_IFRAME_READY { href, viewport }   // Helper initialized
  PCD_PONG { }                          // Health check response
  PCD_HOVER { selector, rect, ... }     // Element hovered
  PCD_CLICK { selector, rect, ... }     // Element clicked
  PCD_SCROLL { scroll, viewport }       // Scroll/resize update
  PCD_RECT { requestId, rect }          // Element position response
```

---

## 2. Mother Portal (PCD) Responsibilities

### 2.1 Iframe Rendering

The `PrototypeViewer` component renders the iframe with these requirements:

```tsx
<iframe
  ref={iframeRef}
  src={prototype.url}
  className="w-full h-full border-0"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
  allow="clipboard-read; clipboard-write"
/>
```

**Key attributes:**
- `sandbox`: Must include `allow-scripts` and `allow-same-origin` for postMessage to work
- `allow`: Optional, for clipboard access if needed

### 2.2 Pin Mode State Management

```tsx
// Pin mode: user is placing a new comment
const [isAddingComment, setIsAddingComment] = useState(false);

// Repin mode: user is moving an existing comment's pin
const [repinTargetId, setRepinTargetId] = useState<string | null>(null);

// Combined "pin mode active" check
const isPinMode = isAddingComment || repinTargetId !== null;
```

### 2.3 Sending Mode Changes to Iframe

When pin mode changes, notify the iframe:

```tsx
useEffect(() => {
  if (!bridgeReady) return;
  
  const isPinMode = isAddingComment || repinTargetId !== null;
  
  try {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "PCD_MODE", mode: isPinMode ? "pin" : "off" },
      "*" // Use specific origin in production
    );
  } catch (e) {
    console.warn("[Bridge] Failed to send mode:", e);
  }
}, [bridgeReady, isAddingComment, repinTargetId]);
```

### 2.4 Message Listener Setup

```tsx
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    const data = event.data;
    
    // Validate message structure
    if (!data || typeof data !== "object" || !data.__pcd) return;
    
    // Optional: Validate origin in production
    // if (!ALLOWED_ORIGINS.includes(event.origin)) return;
    
    switch (data.type) {
      case "PCD_IFRAME_READY":
        setBridgeReady(true);
        setBridgeHealth(prev => ({ ...prev, helperReady: true, lastReadyAt: Date.now() }));
        break;
        
      case "PCD_PONG":
        setBridgeHealth(prev => ({ ...prev, lastPongAt: Date.now() }));
        break;
        
      case "PCD_HOVER":
        if (isPinMode) {
          setHover({
            selector: data.selector,
            id: data.id,
            anchorKey: data.anchorKey,
            rect: data.rect,
            viewport: data.viewport,
            textHint: data.textHint,
          });
        }
        break;
        
      case "PCD_CLICK":
        if (isPinMode) {
          // Dispatch as custom event for handler
          window.dispatchEvent(
            new CustomEvent("pcd-iframe-click", { detail: data })
          );
        }
        break;
        
      case "PCD_SCROLL":
        setIframeViewport({
          w: data.viewport.w,
          h: data.viewport.h,
          scrollX: data.scroll.x,
          scrollY: data.scroll.y,
        });
        break;
        
      case "PCD_RECT":
        const resolver = pendingRectRequests.current.get(data.requestId);
        if (resolver) {
          resolver(data.rect);
          pendingRectRequests.current.delete(data.requestId);
        }
        break;
    }
  };
  
  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, [isPinMode]);
```

### 2.5 Coordinate Conversion

Convert iframe-relative coordinates to overlay coordinates:

```tsx
const iframeRectToOverlayRect = useCallback((
  r: { left: number; top: number; width: number; height: number } | null
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
```

### 2.6 Pin Data Structure

When storing a pin/comment, save these fields:

```typescript
interface CommentAnchorData {
  // Page context
  page_url: string;              // Full iframe URL
  page_path: string | null;      // Path portion (for SPA navigation)
  
  // Scroll/viewport at time of click
  scroll_y: number;              // scrollY when clicked
  viewport_w: number;            // Viewport width
  viewport_h: number;            // Viewport height
  breakpoint: string;            // "mobile" | "tablet" | "desktop"
  
  // Element anchor (for relocating the pin)
  anchor_id: string | null;      // Element ID if available
  anchor_selector: string | null; // CSS selector or data-pcd-anchor selector
  
  // Position as percentage of viewport
  x_pct: number;                 // 0-100, element center X
  y_pct: number;                 // 0-100, element center Y
  
  // Pin position as percentage of overlay
  pin_x: number;                 // 0-100, where pin appears
  pin_y: number;                 // 0-100, where pin appears
  
  // Context hints
  text_hint: string | null;      // First ~80 chars of element text
  text_offset: number | null;    // Character offset if text selection
  text_context: string | null;   // Longer text context (~240 chars)
}
```

### 2.7 Comment Creation Flow

```
1. User clicks "Add Comment" button
   → setIsAddingComment(true)
   → PCD_MODE { mode: "pin" } sent to iframe
   → Cursor changes to crosshair in iframe

2. User hovers over elements in iframe
   → Helper sends PCD_HOVER messages
   → Parent shows highlight overlay on hovered element

3. User clicks an element in iframe
   → Helper sends PCD_CLICK with full anchor data
   → Helper prevents default (no navigation)
   → Parent receives click, creates draft pin:
     setPendingPin({ anchorData: { ...clickData } })

4. Comment composer appears
   → User types comment text
   → User clicks "Submit"

5. onAddComment() called with:
   - commentText
   - pin_x, pin_y
   - anchorData (full object)
   → Saved to database
   → UI refreshes, pin appears on prototype
```

### 2.8 Repin Flow

```
1. User clicks "Repin" on existing comment
   → setRepinTargetId(comment.id)
   → PCD_MODE { mode: "pin" } sent to iframe

2. User clicks new location in iframe
   → Helper sends PCD_CLICK
   → Parent calls onRepinComment(commentId, newAnchorData)
   → Database updated
   → setRepinTargetId(null)
   → Pin moves to new location
```

### 2.9 Keeping Pins Stable (Rect Refresh)

Request updated element positions when needed:

```tsx
const requestRect = useCallback((
  commentId: string,
  selector: string | null,
  id: string | null
): Promise<{ left: number; top: number; width: number; height: number } | null> => {
  return new Promise((resolve) => {
    if (!bridgeReady || !iframeRef.current?.contentWindow) {
      resolve(null);
      return;
    }
    
    const requestId = `rect_${commentId}_${Date.now()}`;
    pendingRectRequests.current.set(requestId, resolve);
    
    iframeRef.current.contentWindow.postMessage(
      { type: "PCD_GET_RECT", requestId, selector, id },
      "*"
    );
    
    // Timeout after 2s
    setTimeout(() => {
      if (pendingRectRequests.current.has(requestId)) {
        pendingRectRequests.current.delete(requestId);
        resolve(null);
      }
    }, 2000);
  });
}, [bridgeReady]);

// Refresh all comment rects
const refreshRects = useCallback(async () => {
  for (const comment of comments) {
    const rect = await requestRect(
      comment.id,
      comment.anchor_selector,
      comment.anchor_id
    );
    setRectCache(prev => ({ ...prev, [comment.id]: rect }));
  }
}, [comments, requestRect]);
```

### 2.10 Message Type Reference

| Message Type | Direction | Payload |
|--------------|-----------|---------|
| `PCD_MODE` | Parent → Iframe | `{ mode: "pin" \| "off" }` |
| `PCD_PING` | Parent → Iframe | `{ }` |
| `PCD_GET_RECT` | Parent → Iframe | `{ requestId: string, selector: string?, id: string? }` |
| `PCD_IFRAME_READY` | Iframe → Parent | `{ href: string, viewport: { w, h }, ts: number }` |
| `PCD_PONG` | Iframe → Parent | `{ ts: number }` |
| `PCD_HOVER` | Iframe → Parent | See payload below |
| `PCD_CLICK` | Iframe → Parent | See payload below |
| `PCD_SCROLL` | Iframe → Parent | `{ scroll: { x, y }, viewport: { w, h }, ts }` |
| `PCD_RECT` | Iframe → Parent | `{ requestId: string, rect: {...} \| null, ts }` |

**PCD_HOVER / PCD_CLICK Payload:**
```typescript
{
  __pcd: true,              // Required marker
  type: "PCD_CLICK",        // or "PCD_HOVER"
  selector: string | null,  // CSS selector for element
  id: string | null,        // Element ID if available
  anchorKey: string | null, // data-pcd-anchor value (stable)
  rect: {
    left: number,           // Element position in viewport
    top: number,
    width: number,
    height: number,
  },
  viewport: {
    w: number,              // Viewport width
    h: number,              // Viewport height
  },
  scroll: {                 // Only in PCD_CLICK
    x: number,
    y: number,
  },
  textHint: string | null,  // Short text preview
  textContext: string | null, // Longer text context
  ts: number,               // Timestamp
}
```

---

## 3. Demo/Prototype Site Responsibilities

### 3.1 Required Files

Each demo site must include:

**File: `public/pcd-iframe-helper.js`**

```javascript
// public/pcd-iframe-helper.js
// Portable PCD Prototype Helper Script
// Drop this file into any demo/prototype project's public/ folder
// and add <script src="/pcd-iframe-helper.js"></script> to index.html
(() => {
  // Prevent double init
  if (window.__PCD_HELPER_INIT__) return;
  window.__PCD_HELPER_INIT__ = true;

  let pinModeActive = false;

  const send = (payload) => {
    try {
      window.parent?.postMessage({ __pcd: true, ...payload }, "*");
    } catch (e) {}
  };

  // ----- Stable anchor stamping -----
  const ensureAnchorStamp = (el) => {
    if (!(el instanceof Element)) return null;
    const existing = el.getAttribute("data-pcd-anchor");
    if (existing) return existing;
    const key = "pcd_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    el.setAttribute("data-pcd-anchor", key);
    return key;
  };

  // ----- Selector building (anchor-first) -----
  const buildSelector = (el, anchorKey) => {
    if (!el || !(el instanceof Element)) return null;
    if (anchorKey) return `[data-pcd-anchor="${anchorKey}"]`;
    if (el.id) return `#${CSS.escape(el.id)}`;
    // fallback: simple-ish path
    const parts = [];
    let cur = el;
    for (let i = 0; i < 4 && cur && cur instanceof Element; i++) {
      const tag = cur.tagName.toLowerCase();
      if (!tag) break;
      const cls = (cur.className && typeof cur.className === "string")
        ? cur.className.trim().split(/\s+/).slice(0, 2).map(c => `.${CSS.escape(c)}`).join("")
        : "";
      parts.unshift(`${tag}${cls}`);
      cur = cur.parentElement;
    }
    return parts.join(" > ") || null;
  };

  // ----- Text hint (best-effort, safe) -----
  const getTextContext = (el) => {
    if (!(el instanceof Element)) return { textHint: null, textContext: null };
    const txt = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ");
    const hint = txt ? txt.slice(0, 80) : el.tagName.toLowerCase();
    return { textHint: hint || null, textContext: txt ? txt.slice(0, 240) : null };
  };

  // ----- Click capture -----
  window.addEventListener(
    "click",
    (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;

      // If we're in pin mode, don't let the demo site "use" the click
      if (pinModeActive) {
        e.preventDefault();
        e.stopPropagation();
      }

      const anchorKey = ensureAnchorStamp(t);
      const rect = t.getBoundingClientRect();
      const selector = buildSelector(t, anchorKey);
      const { textHint, textContext } = getTextContext(t);

      send({
        type: "PCD_CLICK",
        selector,
        id: t.id || null,
        anchorKey,
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        viewport: { w: window.innerWidth, h: window.innerHeight },
        scroll: { x: window.scrollX, y: window.scrollY },
        textHint,
        textContext,
        ts: Date.now(),
      });
    },
    true
  );

  // ----- Hover capture (pin mode only, throttled) -----
  let lastHoverEl = null;
  let hoverRaf = 0;

  window.addEventListener(
    "mousemove",
    (e) => {
      if (!pinModeActive) return;

      const t = document.elementFromPoint(e.clientX, e.clientY);
      if (!(t instanceof Element) || t === lastHoverEl) return;
      lastHoverEl = t;

      if (hoverRaf) cancelAnimationFrame(hoverRaf);
      hoverRaf = requestAnimationFrame(() => {
        hoverRaf = 0;

        const anchorKey = ensureAnchorStamp(t);
        const rect = t.getBoundingClientRect();
        const selector = buildSelector(t, anchorKey);
        const { textHint, textContext } = getTextContext(t);

        send({
          type: "PCD_HOVER",
          selector,
          id: t.id || null,
          anchorKey,
          rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
          viewport: { w: window.innerWidth, h: window.innerHeight },
          textHint,
          textContext,
          ts: Date.now(),
        });
      });
    },
    { passive: true }
  );

  // ----- Keyboard shortcuts (only when not typing) -----
  window.addEventListener("keydown", (e) => {
    const target = e.target;
    const tag = target && target.tagName;
    const isTyping =
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      (target && target.isContentEditable);

    if (isTyping) return;

    const key = e.key;
    if (key === "Escape" || key.toLowerCase() === "c" || key.toLowerCase() === "p") {
      send({ type: "PCD_KEY", key, ts: Date.now() });
    }
  });

  // ----- Scroll/resize updates (throttled) -----
  let scrollRaf = 0;
  const sendScrollUpdate = () => {
    scrollRaf = 0;
    send({
      type: "PCD_SCROLL",
      scroll: { x: window.scrollX, y: window.scrollY },
      viewport: { w: window.innerWidth, h: window.innerHeight },
      ts: Date.now(),
    });
  };

  window.addEventListener("scroll", () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(sendScrollUpdate);
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(sendScrollUpdate);
  }, { passive: true });

  // ----- Parent messages: MODE + PING + GET_RECT -----
  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || typeof d !== "object") return;

    if (d.type === "PCD_MODE") {
      pinModeActive = d.mode === "pin";
      document.documentElement.style.cursor = pinModeActive ? "crosshair" : "";
      return;
    }

    if (d.type === "PCD_PING") {
      send({ type: "PCD_PONG", ts: Date.now() });
      return;
    }

    if (d.type === "PCD_GET_RECT") {
      const { requestId, selector, id } = d;
      let el = null;

      try {
        if (id) el = document.getElementById(id);
        if (!el && selector) {
          try { el = document.querySelector(selector); } catch (_) {}
        }
      } catch (_) {}

      if (!el) {
        send({ type: "PCD_RECT", requestId, rect: null, ts: Date.now() });
        return;
      }

      const r = el.getBoundingClientRect();
      send({
        type: "PCD_RECT",
        requestId,
        rect: { left: r.left, top: r.top, width: r.width, height: r.height },
        ts: Date.now(),
      });
    }
  });

  // ----- Boot signal -----
  send({
    type: "PCD_IFRAME_READY",
    href: location.href,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    ts: Date.now(),
  });

  console.log("[PCD Helper] Prototype helper initialized");
})();
```

**File: `index.html` (modification)**

Add this script tag before the closing `</body>` tag:

```html
<script defer src="/pcd-iframe-helper.js"></script>
```

### 3.2 What the Helper Does

| Feature | Description |
|---------|-------------|
| **PCD_IFRAME_READY** | Sent immediately when script loads; tells parent the bridge is ready |
| **PCD_MODE listener** | Receives mode changes from parent; toggles `pinModeActive` flag and cursor |
| **PCD_HOVER** | Sent on mousemove when in pin mode; includes element rect/selector |
| **PCD_CLICK** | Sent on click; includes full anchor data for pin creation |
| **preventDefault** | When in pin mode, clicks don't navigate or submit forms |
| **PCD_PING / PCD_PONG** | Health check; parent pings, helper responds |
| **PCD_GET_RECT** | Parent requests current position of an element by selector |
| **Anchor stamping** | Assigns `data-pcd-anchor="pcd_xxx"` to clicked/hovered elements |

### 3.3 Anchor Stamping Strategy

**Why we stamp elements:**
- CSS selectors can change (class names, DOM structure)
- IDs may not exist on all elements
- We need a stable way to find the element again later

**How it works:**
1. When an element is clicked/hovered, check if it has `data-pcd-anchor`
2. If not, generate a unique key: `pcd_${random}${timestamp}`
3. Set `el.setAttribute("data-pcd-anchor", key)`
4. Use `[data-pcd-anchor="pcd_xxx"]` as the primary selector

**Limitations:**
- Stamps are lost on page reload (the element gets a new anchor)
- Dynamic content (React re-renders) may remove the attribute
- Best-effort: we fall back to selector if anchor is gone

**Selector fallback hierarchy:**
1. `[data-pcd-anchor="..."]` (stamped anchor)
2. `#elementId` (if element has ID)
3. `tag.class1.class2 > tag.class1 > ...` (4-level path)

---

## 4. Where the Helper Script MUST Live

### Definitive Rule

> **The helper script MUST be deployed inside the demo site's build.**  
> The Mother Portal cannot inject DOM logic into a cross-origin iframe.

### Examples

**Scenario 1: Demo site on Lovable**
```
Demo project: client-demo.lovable.app
Files needed:
  - public/pcd-iframe-helper.js  ← Add this file
  - index.html                   ← Add script tag
```

**Scenario 2: Demo site on external hosting**
```
Demo site: clientwebsite.com
Files needed:
  - /pcd-iframe-helper.js        ← Deploy to web root
  - index.html                   ← Add script tag
```

**Scenario 3: Static site generator (Next.js, Gatsby, etc.)**
```
Files needed:
  - public/pcd-iframe-helper.js  ← Add to public folder
  - pages/_document.js or similar ← Add script tag
```

### Edge Case: Same-Origin Demos

If the demo is same-origin (e.g., `pleasantcovedesign.com/demos/client`):
- The parent *could* theoretically access the iframe's DOM directly
- **We still use the helper** for consistency and maintainability
- This ensures all demos work the same way

### What the Mother Portal CANNOT Do

❌ Inject scripts into cross-origin iframes  
❌ Read DOM elements from cross-origin iframes  
❌ Attach event listeners to cross-origin iframe content  
❌ Modify styles inside cross-origin iframes  

The helper is the **only** way to get click/hover data from cross-origin demos.

---

## 5. Deployment Checklist (Production)

### Pre-Deployment

- [ ] Helper script exists at `public/pcd-iframe-helper.js`
- [ ] `index.html` has `<script defer src="/pcd-iframe-helper.js"></script>`
- [ ] No syntax errors in helper script
- [ ] Demo site builds successfully

### Deployment

- [ ] Demo site published to production URL
- [ ] URL is accessible (no auth wall for iframe embedding)
- [ ] Prototype record created in Mother Portal database with correct URL

### Verification Steps

1. **Open demo site directly in browser**
   - Open DevTools Console
   - Should see: `[PCD Helper] Prototype helper initialized`

2. **Open Mother Portal with embedded demo**
   - Open DevTools Console on Mother Portal
   - Should see: `[Bridge] Received: PCD_IFRAME_READY {...}`

3. **Test pin mode**
   - Click "Add Comment" in Mother Portal
   - Hover over elements in demo → should see highlight
   - Should see: `[Bridge] Received: PCD_HOVER {...}`

4. **Test click to pin**
   - Click an element in demo
   - Should see: `[Bridge] Received: PCD_CLICK {...}`
   - Comment composer should open

5. **Test repin**
   - Click "Repin" on existing comment
   - Click new location
   - Pin should move

### Cache-Busting

If changes to helper aren't reflected:

1. **Hard refresh demo site**: Cmd+Shift+R / Ctrl+Shift+R
2. **Check Network tab**: Verify `pcd-iframe-helper.js` is loaded (not 404)
3. **Check version**: Add `console.log("[PCD Helper] v1.x")` to verify correct version

---

## 6. Debugging Guide

### 6.1 If Hover Works But Click Does Not

**Symptom:** Blue outline appears on hover, but clicking does nothing.

**Diagnostic steps:**

1. **Check iframe console for click log**
   ```
   Expected: [PCD Helper] sent PCD_CLICK {...}
   ```
   If missing → click handler not firing

2. **Check parent console for click message**
   ```
   Expected: [Bridge] Received: PCD_CLICK {...}
   ```
   If missing → message not reaching parent

3. **Check if click is prevented elsewhere**
   - Another script may be calling `e.stopPropagation()`
   - Check for overlay elements with `pointer-events: auto`

4. **Verify isPinMode is true when clicking**
   - Add: `console.log("[Bridge] isPinMode:", isAddingComment, repinTargetId)`

**Common causes:**

| Cause | Fix |
|-------|-----|
| Click handler not registered | Verify `addEventListener("click", ...)` is in helper |
| Parent not in pin mode | Check `isAddingComment` state |
| Overlay blocking clicks | Set `pointer-events: none` on overlay container |
| Message filtered by origin | Temporarily use `*` for origin, verify `__pcd` marker |
| Payload missing fields | Add null checks (`click.scroll?.y ?? 0`) |
| Handler not routing to composer | Verify `setPendingPin()` is called on click |

### 6.2 If Screen Goes White / App Crashes

**Symptom:** Entire app crashes with white screen.

**Previous cause:** React 19 + @react-three/fiber version mismatch

**Error signature:**
```
Cannot read properties of undefined (reading 'ReactCurrentOwner')
```

**Solution applied:**
```tsx
// Lazy load 3D components to isolate crashes
const Hero3DModel = lazy(() => 
  import("@/components/Hero3DModel").then(m => ({ default: m.Hero3DModel }))
);

// Wrap in Suspense + ErrorBoundary
<ErrorBoundary fallback={<HeroStatic />}>
  <Suspense fallback={<HeroStatic />}>
    <Hero3DModel />
  </Suspense>
</ErrorBoundary>
```

**Prevention:**
- Always lazy-load heavy/problematic dependencies
- Use ErrorBoundary around risky components
- Keep React, react-three-fiber, and three versions aligned

### 6.3 Quick Console Diagnostics

Add to helper for debugging:
```javascript
console.log("[PCD Helper] CLICK", { anchorKey, selector, rect });
```

Add to parent for debugging:
```javascript
console.log("[Bridge] Received:", data.type, data);
```

### 6.4 Debug URL Parameter

Add `?pcd_debug=1` to the portal URL to enable:
- Visual HUD showing bridge status
- Message logging
- Rect cache visualization

---

## 7. Security and Reliability Notes

### 7.1 postMessage Origin Handling

**Development (current):**
```javascript
window.parent?.postMessage({ __pcd: true, ...payload }, "*");
```

**Production (recommended):**
```javascript
const ALLOWED_PARENT_ORIGIN = "https://pleasantcovedesign.com";
window.parent?.postMessage({ __pcd: true, ...payload }, ALLOWED_PARENT_ORIGIN);
```

**Parent-side origin validation:**
```javascript
const ALLOWED_ORIGINS = [
  "https://client1.lovable.app",
  "https://client2.lovable.app",
  // Add each demo origin
];

const handleMessage = (event: MessageEvent) => {
  if (!ALLOWED_ORIGINS.includes(event.origin)) {
    console.warn("[Bridge] Rejected message from:", event.origin);
    return;
  }
  // ... handle message
};
```

### 7.2 Message Validation

Always validate incoming messages:

```javascript
// Required checks
if (!data || typeof data !== "object") return;
if (!data.__pcd) return;  // Must have PCD marker
if (!["PCD_CLICK", "PCD_HOVER", ...].includes(data.type)) return;
```

### 7.3 Never Trust User Input

- Sanitize `textHint` and `textContext` before displaying
- Don't use `selector` in `eval()` or similar
- Validate `requestId` format before using

---

## 8. Golden Path: Adding a New Client Demo Site

Follow these steps exactly to add a new client demo with pinned comments support.

### Step 1: Create the Demo Site

Create a new Lovable project for the client demo, or use an existing site.

### Step 2: Add the Helper Script

Create file: `public/pcd-iframe-helper.js`

Copy the complete helper script from [Section 3.1](#31-required-files).

### Step 3: Add Script Tag to index.html

Edit `index.html` and add before `</body>`:

```html
<script defer src="/pcd-iframe-helper.js"></script>
```

### Step 4: Verify Helper Loads Locally

1. Run the demo site locally
2. Open DevTools Console
3. Confirm you see: `[PCD Helper] Prototype helper initialized`

### Step 5: Publish the Demo Site

Deploy the demo site to production (e.g., `client-demo.lovable.app`).

### Step 6: Verify Helper in Production

1. Open the published demo URL directly
2. Open DevTools Console
3. Confirm: `[PCD Helper] Prototype helper initialized`
4. Check Network tab: `pcd-iframe-helper.js` returns 200

### Step 7: Add Prototype to Mother Portal

In the Mother Portal database, create a prototype record:

```sql
INSERT INTO prototypes (project_id, project_token, url, status)
VALUES ('...', '...', 'https://client-demo.lovable.app', 'sent');
```

Or use the admin UI to add the prototype URL.

### Step 8: Open Portal with Embedded Demo

Navigate to the client portal page that embeds this prototype.

### Step 9: Verify Bridge Connection

1. Open DevTools on Mother Portal
2. Look for: `[Bridge] Received: PCD_IFRAME_READY`
3. Look for: `[Bridge] Bridge ready, helper confirmed`

### Step 10: Test Hover Highlighting

1. Click "Add Comment" to enter pin mode
2. Hover over elements in the demo iframe
3. Verify: Blue outline appears around elements
4. Verify console: `[Bridge] Received: PCD_HOVER`

### Step 11: Test Pin Placement

1. While in pin mode, click an element
2. Verify: Click feedback animation appears
3. Verify: Comment composer opens
4. Verify console: `[Bridge] Received: PCD_CLICK`

### Step 12: Submit a Test Comment

1. Type a test comment
2. Click "Submit"
3. Verify: Comment appears in sidebar
4. Verify: Pin appears on prototype

### Step 13: Test Repin

1. Click "Repin" on the test comment
2. Click a different element
3. Verify: Pin moves to new location
4. Verify: Toast confirms "Pin updated"

### Step 14: Verify Persistence

1. Refresh the page
2. Verify: Comment still exists
3. Verify: Pin appears in correct location (or shows "offscreen" indicator)

### Step 15: Clean Up

1. Delete test comment if desired
2. Document the demo URL in project notes
3. Notify client that prototype is ready for review

---

## Appendix: File Locations Summary

| File | Location | Purpose |
|------|----------|---------|
| `pcd-iframe-helper.js` | Demo site: `public/` | Bridge script for iframe |
| `PrototypeViewer.tsx` | Mother: `src/components/portal/` | Iframe container + pin UI |
| `PortalCommentCard.tsx` | Mother: `src/components/portal/` | Comment card component |
| `CommentCard.tsx` | Mother: `src/components/operator/` | Admin comment view |
| `prototype_comments` | Database table | Comment storage |
| `prototypes` | Database table | Prototype URL storage |

---

## Appendix: Troubleshooting Quick Reference

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| No hover highlight | Helper not loaded | Check script tag in index.html |
| Hover works, click fails | preventDefault not set | Update helper with pin mode check |
| White screen | React/fiber mismatch | Lazy load 3D components |
| "undefined" errors | Missing null checks | Add `?.` and `?? default` |
| Pins in wrong position | Coordinate conversion | Check iframe rect offset |
| Messages not received | Origin filtering | Temporarily use `*`, add logs |
| Stale script | Caching | Hard refresh, check version |

---

*End of Standard Operating Procedure*
