/**
 * PCD Prototype Helper Script
 * 
 * This script enables cross-origin pin anchoring for prototype viewers.
 * Add this script to any prototype that will be embedded in a PCD portal.
 * 
 * Usage: Add <script src="/pcd-iframe-helper.js"></script> before </body>
 * Or copy this entire script into your prototype's index.html
 */
(function () {
  "use strict";

  // Prevent double-initialization
  if (window.__PCD_HELPER_INIT__) return;
  window.__PCD_HELPER_INIT__ = true;

  const send = (msg) => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, "*");
      }
    } catch (e) {
      // Silently fail if postMessage is blocked
    }
  };

  // Build a CSS selector for an element
  const buildSelector = (el) => {
    if (!el || !(el instanceof Element)) return null;
    
    // Prefer ID if available
    if (el.id) {
      return "#" + CSS.escape(el.id);
    }
    
    // Try data attributes
    const dataTestId = el.getAttribute("data-testid");
    if (dataTestId) {
      return `[data-testid="${CSS.escape(dataTestId)}"]`;
    }
    
    // Build a path-based selector as fallback
    const parts = [];
    let current = el;
    while (current && current !== document.body && parts.length < 5) {
      let part = current.tagName.toLowerCase();
      
      if (current.id) {
        part = "#" + CSS.escape(current.id);
        parts.unshift(part);
        break;
      }
      
      // Add class if helpful
      const classes = Array.from(current.classList)
        .filter(c => !c.startsWith("hover:") && !c.includes(":"))
        .slice(0, 2)
        .map(c => "." + CSS.escape(c))
        .join("");
      if (classes) {
        part += classes;
      }
      
      parts.unshift(part);
      current = current.parentElement;
    }
    
    return parts.length > 0 ? parts.join(" > ") : null;
  };

  // Extract text context around a click for re-anchoring
  const getTextContext = (el, clientX, clientY) => {
    if (!el) return { textOffset: null, textContext: null, textHint: null };
    
    // Get the visible text content
    const text = el.textContent || "";
    const trimmed = text.trim();
    
    if (!trimmed || trimmed.length < 3) {
      return { textOffset: null, textContext: null, textHint: null };
    }
    
    // Take first 50 chars as hint
    const textHint = trimmed.slice(0, 50);
    
    // Try to find the approximate character offset using Range
    try {
      const range = document.caretRangeFromPoint(clientX, clientY);
      if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
        const offset = range.startOffset;
        const fullText = range.startContainer.textContent || "";
        const start = Math.max(0, offset - 20);
        const end = Math.min(fullText.length, offset + 20);
        const context = fullText.slice(start, end);
        
        return {
          textOffset: offset,
          textContext: context,
          textHint
        };
      }
    } catch (e) {
      // caretRangeFromPoint not supported
    }
    
    return { textOffset: null, textContext: trimmed.slice(0, 40), textHint };
  };

  // Tell parent we're alive
  send({ type: "PCD_IFRAME_READY" });

  // Click capture
  window.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    const r = t.getBoundingClientRect();
    const selector = buildSelector(t);
    const id = t.id || null;
    const { textOffset, textContext, textHint } = getTextContext(t, e.clientX, e.clientY);

    send({
      type: "PCD_CLICK",
      selector,
      id,
      rect: { left: r.left, top: r.top, width: r.width, height: r.height },
      scroll: { x: window.scrollX, y: window.scrollY },
      viewport: { w: window.innerWidth, h: window.innerHeight },
      textOffset,
      textContext,
      textHint,
      ts: Date.now()
    });
  }, true);

  // Parent asks for element rect
  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || typeof d !== "object") return;

    if (d.type === "PCD_GET_RECT") {
      const { requestId, selector, id } = d;
      let el = null;

      try {
        if (id) el = document.getElementById(id);
        if (!el && selector) el = document.querySelector(selector);
      } catch (err) {
        // Invalid selector
      }

      if (!el) {
        send({ type: "PCD_RECT", requestId, rect: null });
        return;
      }

      const r = el.getBoundingClientRect();
      send({
        type: "PCD_RECT",
        requestId,
        rect: { left: r.left, top: r.top, width: r.width, height: r.height }
      });
    }
  });

  // Scroll updates (throttled)
  let rafId = 0;
  const sendScrollUpdate = () => {
    rafId = 0;
    send({
      type: "PCD_SCROLL",
      scroll: { x: window.scrollX, y: window.scrollY },
      viewport: { w: window.innerWidth, h: window.innerHeight }
    });
  };

  window.addEventListener("scroll", () => {
    if (rafId) return;
    rafId = requestAnimationFrame(sendScrollUpdate);
  }, { passive: true });

  // Also send on resize
  window.addEventListener("resize", () => {
    if (rafId) return;
    rafId = requestAnimationFrame(sendScrollUpdate);
  }, { passive: true });

  console.log("[PCD Helper] Prototype helper initialized");
})();
