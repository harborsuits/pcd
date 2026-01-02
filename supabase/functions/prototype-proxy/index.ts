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

// Rewrite relative URLs in HTML to go through our proxy
function rewriteUrls(html: string, baseUrl: string, proxyBaseUrl: string): string {
  const base = new URL(baseUrl);
  
  // Inject a <base> tag so relative URLs resolve correctly
  // Also inject our pin helper script
  const baseTag = `<base href="${base.origin}${base.pathname.replace(/\/[^\/]*$/, '/')}">`;
  
  // Script to enable parent-to-iframe communication for pin anchoring
  const helperScript = `
<script>
(function() {
  // Pin anchoring helper - enables same-origin DOM access for parent
  window.__PCD_PROTOTYPE_READY = true;
  
  // Notify parent that prototype is ready
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'PCD_PROTOTYPE_READY', origin: window.location.origin }, '*');
  }
  
  // Listen for pin queries from parent
  window.addEventListener('message', function(e) {
    if (e.data?.type === 'PCD_GET_ELEMENT_RECT') {
      const { selector, id, requestId } = e.data;
      let rect = null;
      try {
        const el = selector ? document.querySelector(selector) : (id ? document.getElementById(id) : null);
        if (el) {
          const r = el.getBoundingClientRect();
          rect = { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, left: r.left };
        }
      } catch (err) {
        console.warn('[PCD] Element query error:', err);
      }
      e.source?.postMessage({ type: 'PCD_ELEMENT_RECT', requestId, rect }, '*');
    }
    
    if (e.data?.type === 'PCD_GET_SCROLL') {
      const requestId = e.data.requestId;
      e.source?.postMessage({ 
        type: 'PCD_SCROLL', 
        requestId, 
        scrollX: window.scrollX, 
        scrollY: window.scrollY,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight
      }, '*');
    }
  });
  
  // Report scroll changes to parent
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
      if (window.parent !== window) {
        window.parent.postMessage({ 
          type: 'PCD_SCROLL_UPDATE', 
          scrollX: window.scrollX, 
          scrollY: window.scrollY 
        }, '*');
      }
    }, 50);
  }, { passive: true });
})();
</script>
`;

  // Insert base tag and helper script after <head>
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>${baseTag}${helperScript}`);
  } else if (html.includes('<HEAD>')) {
    html = html.replace('<HEAD>', `<HEAD>${baseTag}${helperScript}`);
  } else {
    // No head tag, prepend
    html = `${baseTag}${helperScript}${html}`;
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
    const isAssetRequest = pathParts[proxyIdx + 2] === "asset";
    
    if (!isValidToken(token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[prototype-proxy] Request for token: ${token.slice(0, 8)}..., asset: ${isAssetRequest}`);

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
    console.log(`[prototype-proxy] Proxying: ${prototypeUrl}`);

    // Handle asset proxy requests
    if (isAssetRequest) {
      const assetUrl = url.searchParams.get("url");
      if (!assetUrl) {
        return new Response(
          JSON.stringify({ error: "Asset URL required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Resolve relative URLs against prototype base
      const resolvedUrl = new URL(assetUrl, prototypeUrl).href;
      console.log(`[prototype-proxy] Fetching asset: ${resolvedUrl}`);

      const assetResp = await fetch(resolvedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PrototypeProxy/1.0)",
          "Accept": "*/*",
        },
      });

      if (!assetResp.ok) {
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

    // Fetch the prototype HTML
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
    
    // Get the proxy base URL for asset rewrites
    const proxyBaseUrl = `${url.origin}/functions/v1/prototype-proxy/${token}`;
    
    // Rewrite URLs and inject helper script
    html = rewriteUrls(html, prototypeUrl, proxyBaseUrl);

    console.log(`[prototype-proxy] Successfully proxied ${html.length} bytes`);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
        // Allow iframe embedding from same origin
        "X-Frame-Options": "SAMEORIGIN",
      },
    });

  } catch (error) {
    console.error("[prototype-proxy] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
