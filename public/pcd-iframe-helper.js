// public/pcd-iframe-helper.js
// Portable PCD Prototype Helper Script
// Drop this file into any demo/prototype project's public/ folder
// and add <script src="/pcd-iframe-helper.js"></script> to index.html
(() => {
  // Prevent double init
  if (window.__PCD_HELPER_INIT__) return;
  window.__PCD_HELPER_INIT__ = true;
  window.__PCD_HELPER_VERSION__ = "2026-01-02-ORIGIN-1";

  let pinModeActive = false;
  let focusLocked = false; // When true, clicks cannot clear focus

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

      // If focus is locked (comment selected), prevent all clicks from affecting the demo
      // This ensures the focus marker persists until Mother explicitly clears it
      if (focusLocked) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // If we're in pin mode, don't let the demo site "use" the click (navigate, submit, etc.)
      if (pinModeActive) {
        e.preventDefault();
        e.stopPropagation();
        
        // Show immediate visual feedback - cyan border on clicked element
        focusedEl = t;
        focusLocked = true; // Lock so subsequent clicks don't clear it
        ensureFocusUI();
        focusMarker.style.opacity = "1";
        focusMarker.style.transform = "scale(1)";
        placeFocusUI();
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
        click: { x: e.clientX, y: e.clientY },  // Actual click point in viewport coords
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
      // Priority 1: data-pcd-anchor attribute (current format)
      if (anchorKey) el = document.querySelector(`[data-pcd-anchor="${CSS.escape(anchorKey)}"]`);
      
      // Priority 2: Try as native HTML id (for backwards compatibility with old anchor format)
      if (!el && anchorKey) {
        try { el = document.getElementById(anchorKey); } catch (_) {}
      }
      
      // Priority 3: Try data-anchor attribute (alternate format some helpers use)
      if (!el && anchorKey) {
        try { el = document.querySelector(`[data-anchor="${CSS.escape(anchorKey)}"]`); } catch (_) {}
      }
      
      // Priority 4: Use selector as fallback
      if (!el && selector) {
        try { el = document.querySelector(selector); } catch (_) {}
      }
    } catch (_) {}
    
    if (!el) {
      console.log("[PCD Helper] Could not find element for focus:", { anchorKey, selector });
      return;
    }
    
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
      focusLocked = d.lock === true; // Lock focus when Mother says so
      focusAnchor(d.anchorKey, d.selector);
      return;
    }

    if (d.type === "PCD_CLEAR_FOCUS") {
      focusLocked = false; // Unlock on clear
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
    // ================================
    // PERSISTENT MULTI-COMMENT BORDERS
    // ================================
    if (d.type === "PCD_HIGHLIGHTS_SET") {
      __pcdSetHighlights(d.items || []);
      return;
    }

    if (d.type === "PCD_HIGHLIGHTS_CLEAR") {
      // Clear all and stop loop
      for (const k of __pcdHighlights.activeKeys) __pcdHideHighlight(k);
      __pcdHighlights.activeKeys = new Set();
      __pcdStopHighlightLoopIfEmpty();
      return;
    }
  });

  // ================================
  // PERSISTENT MULTI-COMMENT BORDERS
  // ================================
  // Stores highlight boxes keyed by anchorKey
  const __pcdHighlights = {
    items: new Map(), // anchorKey -> { box, badge }
    activeKeys: new Set(),
    raf: null,
  };

  function __pcdEnsureHighlightUI(anchorKey) {
    if (__pcdHighlights.items.has(anchorKey)) return __pcdHighlights.items.get(anchorKey);

    const box = document.createElement("div");
    box.style.position = "fixed";
    box.style.zIndex = "2147483646";
    box.style.pointerEvents = "none";
    box.style.border = "2px solid #00E5FF";
    box.style.borderRadius = "8px";
    box.style.boxShadow = "0 0 0 2px rgba(0,229,255,0.18)";
    box.style.display = "none";
    document.documentElement.appendChild(box);

    const badge = document.createElement("div");
    badge.style.position = "fixed";
    badge.style.top = "0";
    badge.style.left = "0";
    badge.style.zIndex = "2147483647";
    badge.style.pointerEvents = "none";
    badge.style.display = "none";
    badge.style.fontFamily = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    badge.style.fontSize = "11px";
    badge.style.padding = "4px 7px";
    badge.style.borderRadius = "999px";
    badge.style.background = "rgba(0,0,0,0.75)";
    badge.style.color = "white";
    badge.style.border = "1px solid rgba(0,229,255,0.65)";
    badge.style.boxShadow = "0 0 12px rgba(0,229,255,0.35)";
    badge.textContent = "";
    document.documentElement.appendChild(badge);

    const entry = { box, badge };
    __pcdHighlights.items.set(anchorKey, entry);
    return entry;
  }

  function __pcdHideHighlight(anchorKey) {
    const entry = __pcdHighlights.items.get(anchorKey);
    if (!entry) return;
    entry.box.style.display = "none";
    entry.badge.style.display = "none";
  }

  function __pcdFindByAnchorMulti(anchorKey) {
    if (!anchorKey) return null;
    try {
      const safe = (window.CSS && CSS.escape) ? CSS.escape(String(anchorKey)) : String(anchorKey);
      return document.querySelector(`[data-pcd-anchor="${safe}"]`);
    } catch {
      return null;
    }
  }

  function __pcdUpdateAllHighlights() {
    for (const anchorKey of __pcdHighlights.activeKeys) {
      const entry = __pcdHighlights.items.get(anchorKey);
      if (!entry) continue;

      const el = __pcdFindByAnchorMulti(anchorKey);
      if (!el) {
        __pcdHideHighlight(anchorKey);
        continue;
      }

      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) {
        __pcdHideHighlight(anchorKey);
        continue;
      }

      entry.box.style.display = "block";
      entry.box.style.top = `${Math.max(0, r.top)}px`;
      entry.box.style.left = `${Math.max(0, r.left)}px`;
      entry.box.style.width = `${Math.max(0, r.width)}px`;
      entry.box.style.height = `${Math.max(0, r.height)}px`;

      // badge at top-left corner of the box, offset slightly outside
      if (entry.badge.textContent) {
        entry.badge.style.display = "block";
        entry.badge.style.top = `${Math.max(0, r.top - 12)}px`;
        entry.badge.style.left = `${Math.max(0, r.left - 8)}px`;
      } else {
        entry.badge.style.display = "none";
      }
    }

    __pcdHighlights.raf = requestAnimationFrame(__pcdUpdateAllHighlights);
  }

  function __pcdStartHighlightLoop() {
    if (__pcdHighlights.raf) return;
    __pcdHighlights.raf = requestAnimationFrame(__pcdUpdateAllHighlights);
  }

  function __pcdStopHighlightLoopIfEmpty() {
    if (__pcdHighlights.activeKeys.size > 0) return;
    if (__pcdHighlights.raf) cancelAnimationFrame(__pcdHighlights.raf);
    __pcdHighlights.raf = null;
  }

  function __pcdSetHighlights(items) {
    const nextKeys = new Set();

    for (const it of Array.isArray(items) ? items : []) {
      const anchorKey = it?.anchorKey;
      if (!anchorKey) continue;
      nextKeys.add(anchorKey);

      const entry = __pcdEnsureHighlightUI(anchorKey);
      entry.badge.textContent = it?.label ? String(it.label) : "";
    }

    // Hide highlights not in the new set
    for (const existingKey of Array.from(__pcdHighlights.activeKeys)) {
      if (!nextKeys.has(existingKey)) {
        __pcdHideHighlight(existingKey);
      }
    }

    __pcdHighlights.activeKeys = nextKeys;

    if (__pcdHighlights.activeKeys.size > 0) __pcdStartHighlightLoop();
    else __pcdStopHighlightLoopIfEmpty();
  }

  // ----- Boot signal -----
  send({
    type: "PCD_IFRAME_READY",
    href: location.href,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    ts: Date.now(),
  });

  console.log("[PCD Helper] Prototype helper initialized with multi-highlight support");
})();
