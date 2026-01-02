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

      // If we're in pin mode, don't let the demo site "use" the click (navigate, submit, etc.)
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

  // ----- Focus highlight state with visible marker -----
  let focusedEl = null;
  let focusRing = null;
  let focusMarker = null;

  function ensureFocusUI() {
    if (!focusRing) {
      focusRing = document.createElement("div");
      focusRing.id = "__pcd_focus_ring";
      focusRing.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 2147483646;
        border: 2px solid rgba(34, 211, 238, 0.95);
        box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.25), 0 0 16px rgba(34, 211, 238, 0.4);
        border-radius: 6px;
        transition: all 0.15s ease-out;
        width: 0; height: 0;
      `;
      document.documentElement.appendChild(focusRing);
    }
    if (!focusMarker) {
      focusMarker = document.createElement("div");
      focusMarker.id = "__pcd_focus_marker";
      focusMarker.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 2147483647;
        width: 24px;
        height: 24px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        font-family: system-ui, sans-serif;
        background: linear-gradient(135deg, rgba(34, 211, 238, 1), rgba(56, 189, 248, 1));
        color: #001520;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.9);
        transition: opacity 0.15s ease-out, transform 0.15s ease-out;
        opacity: 0;
        transform: scale(0.8);
      `;
      focusMarker.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
      document.documentElement.appendChild(focusMarker);
    }
  }

  function placeFocusUI() {
    if (!focusedEl || !focusRing || !focusMarker) return;
    const r = focusedEl.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;

    // Position ring around element with padding
    const pad = 4;
    focusRing.style.left = `${Math.max(0, r.left - pad)}px`;
    focusRing.style.top = `${Math.max(0, r.top - pad)}px`;
    focusRing.style.width = `${r.width + pad * 2}px`;
    focusRing.style.height = `${r.height + pad * 2}px`;

    // Position marker at top-left corner of element
    focusMarker.style.left = `${Math.max(4, r.left - 12)}px`;
    focusMarker.style.top = `${Math.max(4, r.top - 12)}px`;
  }

  function clearFocus() {
    focusedEl = null;
    if (focusRing) {
      focusRing.style.width = "0";
      focusRing.style.height = "0";
    }
    if (focusMarker) {
      focusMarker.style.opacity = "0";
      focusMarker.style.transform = "scale(0.8)";
    }
  }

  // Update focus UI position on scroll/resize
  window.addEventListener("scroll", () => placeFocusUI(), true);
  window.addEventListener("resize", () => placeFocusUI());

  function focusAnchor(anchorKey, selector) {
    clearFocus();
    
    let el = null;
    try {
      if (anchorKey) el = document.querySelector(`[data-pcd-anchor="${CSS.escape(anchorKey)}"]`);
      if (!el && selector) {
        try { el = document.querySelector(selector); } catch (_) {}
      }
    } catch (_) {}
    
    if (!el) return;
    
    focusedEl = el;
    ensureFocusUI();
    
    // Show and position the focus UI
    focusMarker.style.opacity = "1";
    focusMarker.style.transform = "scale(1)";
    placeFocusUI();
    
    // Scroll element into view smoothly
    el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    
    // Re-position after scroll animation
    setTimeout(() => placeFocusUI(), 350);
  }

  // ----- Parent messages: MODE + PING + GET_RECT + FOCUS -----
  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || typeof d !== "object") return;

    if (d.type === "PCD_MODE") {
      pinModeActive = d.mode === "pin";
      document.documentElement.style.cursor = pinModeActive ? "crosshair" : "";
      // Clear focus highlight when entering pin mode
      if (pinModeActive) clearFocus();
      return;
    }

    if (d.type === "PCD_PING") {
      send({ type: "PCD_PONG", ts: Date.now() });
      return;
    }

    if (d.type === "PCD_FOCUS") {
      focusAnchor(d.anchorKey, d.selector);
      return;
    }

    if (d.type === "PCD_CLEAR_FOCUS") {
      clearFocus();
      return;
    }

    if (d.type === "PCD_GET_RECT") {
      const { requestId, selector, id, anchorKey } = d;
      let el = null;

      try {
        // Priority 1: Look up by data-pcd-anchor (most reliable)
        if (anchorKey) el = document.querySelector(`[data-pcd-anchor="${anchorKey}"]`);
        // Priority 2: Look up by id if it's an anchor key format (pcd_...)
        if (!el && id && id.startsWith("pcd_")) {
          el = document.querySelector(`[data-pcd-anchor="${id}"]`);
        }
        // Priority 3: Look up by native HTML id
        if (!el && id) el = document.getElementById(id);
        // Priority 4: Fall back to selector
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
