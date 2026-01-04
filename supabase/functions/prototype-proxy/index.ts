import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Prototype Proxy Function
 * 
 * This function proxies prototype pages to be served from the same origin as the main app.
 * This enables full DOM access for content-anchored pins (same-origin policy compliance).
 * 
 * Routes:
 *   GET /prototype-proxy/:token - Fetch and proxy the prototype HTML with injected helper scripts
 *   GET /prototype-proxy/:token/asset?url=... - Proxy static assets (CSS, JS, images)
 */

const ALLOWED_ORIGINS = [
  /^https?:\/\/.*\.lovable\.app$/,
  /^https?:\/\/.*\.lovableproject\.com$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  return ALLOWED_ORIGINS.some(pattern => pattern.test(origin));
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}

function isValidToken(token: string): boolean {
  return /^[a-zA-Z0-9\-_]{12,128}$/.test(token);
}

// Rewrite HTML to route all assets through the proxy
function rewriteUrls(html: string, prototypeUrl: string, proxyBaseUrl: string): string {
  const prototypeOrigin = new URL(prototypeUrl).origin;
  
  // CRITICAL: Rewrite absolute paths like /assets/index.js to go through proxy
  // We use simpler regex that matches src="/..." or href="/..." anywhere in a tag
  // This handles Vite's output: <script type="module" crossorigin src="/assets/...">
  
  // Rewrite all src="/..." attributes (works for script, img, etc)
  html = html.replace(
    /\ssrc=(["'])\/([^"']+)\1/gi,
    ` src=$1${proxyBaseUrl}$2$1`
  );
  
  // Rewrite all href="/..." attributes (works for link, a, etc)
  html = html.replace(
    /\shref=(["'])\/([^"']+)\1/gi,
    ` href=$1${proxyBaseUrl}$2$1`
  );
  
  // Full PCD helper script for click capture, pin mode, and element queries
  const helperScript = `
<script>
(function() {
  // Prevent double init
  if (window.__PCD_HELPER_INIT__) return;
  window.__PCD_HELPER_INIT__ = true;
  window.__PCD_PROTOTYPE_READY = true;
  window.__PCD_PROTOTYPE_ORIGIN = "${prototypeOrigin}";

  let pinModeActive = false;
  let focusLocked = false;

  const send = (payload) => {
    try {
      window.parent?.postMessage({ __pcd: true, ...payload }, "*");
    } catch (e) {}
  };

  // Stable anchor stamping
  const ensureAnchorStamp = (el) => {
    if (!(el instanceof Element)) return null;
    const existing = el.getAttribute("data-pcd-anchor");
    if (existing) return existing;
    const key = "pcd_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    el.setAttribute("data-pcd-anchor", key);
    return key;
  };

  // =====================================================
  // MULTI-STRATEGY SELECTOR BUILDING (BugHerd-grade)
  // =====================================================
  
  // Build a semantic selector (ID, data-testid, aria-label, href)
  const buildSemanticSelector = (el) => {
    if (!el || !(el instanceof Element)) return null;
    
    // Priority 1: Stable ID
    if (el.id && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(el.id)) {
      return \`#\${CSS.escape(el.id)}\`;
    }
    
    // Priority 2: data-testid
    const testId = el.getAttribute("data-testid");
    if (testId) return \`[data-testid="\${CSS.escape(testId)}"]\`;
    
    // Priority 3: aria-label on interactive elements
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel && ariaLabel.length < 60) {
      const tag = el.tagName.toLowerCase();
      return \`\${tag}[aria-label="\${CSS.escape(ariaLabel)}"]\`;
    }
    
    // Priority 4: href for links
    if (el.tagName === "A" && el.href) {
      try {
        const path = new URL(el.href).pathname;
        return \`a[href="\${CSS.escape(path)}"]\`;
      } catch {}
    }
    
    return null;
  };
  
  // Build structural selector (nth-of-type path)
  const buildStructuralSelector = (el) => {
    if (!el || !(el instanceof Element)) return null;
    
    const parts = [];
    let cur = el;
    while (cur && cur instanceof Element && cur !== document.body && cur !== document.documentElement) {
      const tag = cur.tagName.toLowerCase();
      if (!tag) break;
      
      let index = 1;
      let sibling = cur.previousElementSibling;
      while (sibling) {
        if (sibling.tagName.toLowerCase() === tag) index++;
        sibling = sibling.previousElementSibling;
      }
      
      if (cur.id && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(cur.id)) {
        parts.unshift(\`#\${CSS.escape(cur.id)}\`);
        break;
      }
      
      parts.unshift(\`\${tag}:nth-of-type(\${index})\`);
      cur = cur.parentElement;
      
      if (parts.length >= 8) break;
    }
    
    return parts.join(" > ") || null;
  };
  
  // Combined: returns best selector (semantic first, then structural)
  const buildSelector = (el) => {
    return buildSemanticSelector(el) || buildStructuralSelector(el);
  };

  // Text hint
  const getTextContext = (el) => {
    if (!(el instanceof Element)) return { textHint: null, textContext: null };
    const txt = (el.innerText || el.textContent || "").trim().replace(/\\s+/g, " ");
    const hint = txt ? txt.slice(0, 80) : el.tagName.toLowerCase();
    return { textHint: hint || null, textContext: txt ? txt.slice(0, 240) : null };
  };

  // =====================================================
  // MULTI-STRATEGY ELEMENT FINDING (BugHerd-grade reacquisition)
  // =====================================================
  const __pcdFindElementMulti = (anchorKey, selector, textHint) => {
    // Strategy 1: Try data-pcd-anchor if still present (fast path for same session)
    if (anchorKey) {
      try {
        const el = document.querySelector('[data-pcd-anchor="' + anchorKey + '"]');
        if (el) {
          return { el, method: "anchor-attr" };
        }
      } catch {}
    }
    
    // Strategy 2: Try semantic/structural selector
    if (selector && !selector.startsWith("[data-pcd-anchor=")) {
      try {
        const el = document.querySelector(selector);
        if (el) {
          // Re-stamp with anchor for future fast lookups
          ensureAnchorStamp(el);
          return { el, method: "selector" };
        }
      } catch {}
    }
    
    // Strategy 3: Text hint search (last resort)
    if (textHint && textHint.length >= 3 && textHint.length < 80) {
      const normalized = textHint.trim().replace(/\\s+/g, " ").toLowerCase();
      const clickables = document.querySelectorAll("a, button, [role=button], input[type=submit]");
      for (const c of clickables) {
        const cText = (c.textContent || "").trim().replace(/\\s+/g, " ").toLowerCase();
        if (cText === normalized || cText.includes(normalized)) {
          ensureAnchorStamp(c);
          return { el: c, method: "text-hint" };
        }
      }
      // Broader search
      const all = document.querySelectorAll("*");
      for (const c of all) {
        if (c.children.length > 3) continue;
        const cText = (c.textContent || "").trim().replace(/\\s+/g, " ").toLowerCase();
        if (cText === normalized) {
          ensureAnchorStamp(c);
          return { el: c, method: "text-hint-broad" };
        }
      }
    }
    
    return { el: null, method: null };
  };
  
  // Get rect for an element using multi-strategy
  const __pcdGetRectMulti = (anchorKey, selector, textHint) => {
    const { el, method } = __pcdFindElementMulti(anchorKey, selector, textHint);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  };

  // Click capture
  window.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    if (focusLocked) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (pinModeActive) {
      e.preventDefault();
      e.stopPropagation();
      focusLocked = true;
    }

    const anchorKey = ensureAnchorStamp(t);
    const rect = t.getBoundingClientRect();
    const selector = buildSelector(t);
    const { textHint, textContext } = getTextContext(t);

    send({
      type: "PCD_CLICK",
      selector,
      id: t.id || null,
      anchorKey,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      click: { x: e.clientX, y: e.clientY },
      viewport: { w: window.innerWidth, h: window.innerHeight },
      scroll: { x: window.scrollX, y: window.scrollY },
      textHint,
      textContext,
      ts: Date.now(),
    });
  }, true);

  // Message handling from parent
  window.addEventListener("message", (e) => {
    const data = e.data;
    if (!data) return;

    if (data.type === "PCD_MODE") {
      // Accept both "mode" and "pinMode" for compatibility
      pinModeActive = data.mode === "pin" || !!data.pinMode;
      document.body.style.cursor = pinModeActive ? "crosshair" : "";
      if (!pinModeActive) focusLocked = false;
    }

    if (data.type === "PCD_CLEAR_FOCUS") {
      focusLocked = false;
    }

    if (data.type === "PCD_PING") {
      send({ type: "PCD_PONG", ts: Date.now() });
    }

    // Single rect request - uses multi-strategy lookup
    if (data.type === "PCD_GET_RECT" || data.type === "PCD_GET_ELEMENT_RECT") {
      const { selector, anchorKey, textHint, requestId } = data;
      const rect = __pcdGetRectMulti(anchorKey, selector, textHint);
      send({ type: "PCD_RECT", requestId, rect, ts: Date.now() });
    }
    
    // Batch rect request - for syncing all pins on page
    if (data.type === "PCD_GET_RECTS") {
      const { requestId, anchors } = data;
      const rects = {};
      for (const a of (anchors || [])) {
        const rect = __pcdGetRectMulti(a.anchorKey, a.selector, a.textHint);
        // Use comment ID as key (or fallback to anchorKey/selector)
        const key = a.id || a.anchorKey || a.selector;
        rects[key] = rect;
      }
      send({ type: "PCD_RECTS", requestId, rects, ts: Date.now() });
    }
    
    // Focus/highlight a specific element
    if (data.type === "PCD_FOCUS") {
      const { anchorKey, selector, textHint } = data;
      const { el } = __pcdFindElementMulti(anchorKey, selector, textHint);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Flash highlight effect
        const orig = el.style.outline;
        el.style.outline = "3px solid #00d4ff";
        setTimeout(() => { el.style.outline = orig; }, 1500);
      }
    }
    
    // Highlight markers (pins) for open comments
    if (data.type === "PCD_HIGHLIGHTS_SET") {
      // This is handled by the overlay system in public/pcd-iframe-helper.js
      // The proxy just ensures the message format is compatible
    }
  });

  // Scroll reporting
  let scrollTimeout;
  window.addEventListener("scroll", () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      send({
        type: "PCD_SCROLL",
        viewport: { w: window.innerWidth, h: window.innerHeight },
        scroll: { x: window.scrollX, y: window.scrollY },
        ts: Date.now(),
      });
    }, 50);
  }, { passive: true });

  // Track page navigation (for SPAs that use history API)
  let lastHref = location.href;
  const emitPageChange = () => {
    const href = location.href;
    if (href === lastHref) return;
    lastHref = href;
    send({ type: "PCD_PAGE_CHANGE", url: href, ts: Date.now() });
  };
  
  // Intercept pushState/replaceState - use microtask so URL is updated
  const origPushState = history.pushState;
  const origReplaceState = history.replaceState;
  history.pushState = function(...args) {
    const result = origPushState.apply(this, args);
    Promise.resolve().then(emitPageChange);
    return result;
  };
  history.replaceState = function(...args) {
    const result = origReplaceState.apply(this, args);
    Promise.resolve().then(emitPageChange);
    return result;
  };
  
  window.addEventListener("popstate", () => Promise.resolve().then(emitPageChange));
  window.addEventListener("hashchange", () => Promise.resolve().then(emitPageChange));
  
  // Emit initial page on load
  setTimeout(() => { lastHref = location.href; send({ type: "PCD_PAGE_CHANGE", url: location.href, ts: Date.now() }); }, 0);

  // Notify parent ready
  send({ type: "PCD_IFRAME_READY", url: location.href, viewport: { w: window.innerWidth, h: window.innerHeight }, ts: Date.now() });
})();
</script>
`;

  // Insert helper script after <head> (no base tag needed since we rewrite URLs directly)
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>${helperScript}`);
  } else if (html.includes('<HEAD>')) {
    html = html.replace('<HEAD>', `<HEAD>${helperScript}`);
  } else {
    html = `${helperScript}${html}`;
  }
  
  return html;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (origin && !isAllowedOrigin(origin)) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Find token in path: /prototype-proxy/:token or /functions/v1/prototype-proxy/:token
    const proxyIdx = pathParts.indexOf("prototype-proxy");
    if (proxyIdx === -1 || proxyIdx >= pathParts.length - 1) {
      return new Response(
        JSON.stringify({ error: "Token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const token = pathParts[proxyIdx + 1];
    // Everything after the token is the asset path
    const assetPath = "/" + pathParts.slice(proxyIdx + 2).join("/");
    const isAssetRequest = assetPath !== "/";
    
    if (!isValidToken(token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[prototype-proxy] Request for token: ${token.slice(0, 8)}..., path: ${assetPath}`);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get project and prototype
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      console.error("[prototype-proxy] Project not found:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: prototype, error: protoError } = await supabase
      .from("prototypes")
      .select("url")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (protoError || !prototype) {
      console.error("[prototype-proxy] Prototype not found:", protoError);
      return new Response(
        JSON.stringify({ error: "Prototype not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prototypeUrl = prototype.url;
    const prototypeBase = new URL(prototypeUrl);

    // Handle asset/path requests (anything after /:token/)
    if (isAssetRequest) {
      // Resolve the path against the prototype base
      const resolvedUrl = new URL(assetPath + url.search, prototypeBase.origin).href;
      console.log(`[prototype-proxy] Fetching asset: ${resolvedUrl}`);

      const assetResp = await fetch(resolvedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PrototypeProxy/1.0)",
          "Accept": "*/*",
        },
      });

      if (!assetResp.ok) {
        console.error(`[prototype-proxy] Asset fetch failed: ${assetResp.status} for ${resolvedUrl}`);
        return new Response(
          JSON.stringify({ error: "Asset fetch failed" }),
          { status: assetResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const contentType = assetResp.headers.get("content-type") || "application/octet-stream";
      const body = await assetResp.arrayBuffer();

      return new Response(body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Fetch the prototype HTML (root page)
    console.log(`[prototype-proxy] Proxying HTML: ${prototypeUrl}`);
    const protoResp = await fetch(prototypeUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PrototypeProxy/1.0)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!protoResp.ok) {
      console.error(`[prototype-proxy] Fetch failed: ${protoResp.status}`);
      return new Response(
        JSON.stringify({ error: "Failed to fetch prototype" }),
        { status: protoResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let html = await protoResp.text();
    
    // Get the proxy base URL - this is where assets should be fetched from
    const proxyBaseUrl = `${url.origin}/functions/v1/prototype-proxy/${token}/`;
    
    // Rewrite URLs and inject helper script
    html = rewriteUrls(html, prototypeUrl, proxyBaseUrl);

    console.log(`[prototype-proxy] Successfully proxied ${html.length} bytes`);

    // CRITICAL: Return clean headers that allow iframe embedding AND script execution
    // We must NOT forward any CSP/frame-blocking headers from the upstream response
    // These headers are explicitly stripped:
    // - content-security-policy (blocks inline scripts like our helper)
    // - content-security-policy-report-only (same issue)
    // - x-frame-options (blocks embedding)
    // - frame-options (legacy)
    // - permissions-policy (can restrict features)
    // - x-content-type-options (can cause issues)
    // Create headers explicitly - do NOT spread corsHeaders which could interfere
    const responseHeaders = new Headers();
    responseHeaders.set("Access-Control-Allow-Origin", origin || "*");
    responseHeaders.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    // CRITICAL: Content-Type MUST be text/html for browser to parse
    responseHeaders.set("Content-Type", "text/html; charset=utf-8");
    responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
    responseHeaders.set("Pragma", "no-cache");
    responseHeaders.set("Expires", "0");
    // Allow iframe embedding
    responseHeaders.set("X-Frame-Options", "ALLOWALL");
    // Permissive CSP to allow our injected helper script
    responseHeaders.set("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';");
    
    return new Response(html, { status: 200, headers: responseHeaders });

  } catch (error) {
    console.error("[prototype-proxy] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
