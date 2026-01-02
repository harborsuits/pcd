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
