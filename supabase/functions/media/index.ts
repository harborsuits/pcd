// Media Proxy edge function - SECURE version
// GET /media/:file_id?token=<project_token> - serve file by ID (requires token)
// GET /media?url=<encoded> - proxy allowed external URLs

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Allowed content types
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
];

// Allowed external hosts for URL proxy mode
const ALLOWED_HOSTS: string[] = (() => {
  try {
    return [new URL(SUPABASE_URL).hostname];
  } catch {
    return [];
  }
})();

// Allowed origins for CORS
const ALLOWED_ORIGINS: RegExp[] = [
  /^https:\/\/.*\.lovable\.dev$/,
  /^https:\/\/.*\.lovableproject\.com$/,
  /^https:\/\/.*\.squarespace\.com$/,
  /^https:\/\/.*\.squarespace-cdn\.com$/,
  /^https:\/\/(www\.)?pleasantcove\.design$/,
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

// Frame ancestors for CSP (allows PDF iframe embedding)
const FRAME_ANCESTORS = [
  "https://*.lovable.dev",
  "https://*.lovableproject.com",
  "https://*.squarespace.com",
  "https://*.squarespace-cdn.com",
  "https://pleasantcove.design",
  "https://www.pleasantcove.design",
  "http://localhost:*",
  "http://127.0.0.1:*",
].join(" ");

// Max file size (10MB)
const MAX_SIZE = 10 * 1024 * 1024;

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Allow server-to-server / same-origin
  return ALLOWED_ORIGINS.some((re) => re.test(origin));
}

function corsHeadersFor(origin: string | null): Record<string, string> {
  // If no origin, it's typically server-to-server; allow "*"
  if (!origin) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Vary": "Origin",
    };
  }

  // Origin exists and is already allowed by the caller
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Vary": "Origin",
  };
}

function getSecurityHeaders(contentType: string, size: number, corsHeaders: Record<string, string>): Record<string, string> {
  const base = contentType.toLowerCase().split(";")[0].trim();
  
  return {
    ...corsHeaders,
    "Content-Type": base,
    "Content-Length": String(size),
    "Cache-Control": "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    // Allow iframe embedding for PDF previews from allowed origins
    // Do NOT set X-Frame-Options: DENY - it blocks iframe preview
    "Content-Security-Policy": `default-src 'none'; img-src 'self' data:; style-src 'none'; script-src 'none'; frame-ancestors ${FRAME_ANCESTORS}`,
  };
}

// Signed URL expiration time (1 hour in seconds)
const SIGNED_URL_EXPIRATION = 3600;

function errorResponse(status: number, message: string, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isAllowedContentType(contentType: string): boolean {
  const ct = contentType.toLowerCase().split(";")[0].trim();
  return ALLOWED_CONTENT_TYPES.some((allowed) => ct === allowed || ct.startsWith("image/"));
}

function isAllowedHost(url: URL): boolean {
  return ALLOWED_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith("." + host));
}

// Validate project token format
function isValidToken(token: string | null): token is string {
  if (!token) return false;
  return /^[a-zA-Z0-9\-_]{12,128}$/.test(token.trim());
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  
  // Strict CORS check - return CORS headers even on 403 so browsers can read the error
  if (origin && !isAllowedOrigin(origin)) {
    console.error("[Media] Origin not allowed:", origin);
    const blockedCors = corsHeadersFor(origin);
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { ...blockedCors, "Content-Type": "application/json" },
    });
  }
  
  const corsHeaders = corsHeadersFor(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return errorResponse(405, "Method not allowed", corsHeaders);
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Get file_id from path: /media/:file_id
  const fileId = pathParts.length >= 2 ? pathParts[pathParts.length - 1] : null;
  
  // Or get url from query: /media?url=<encoded>
  const proxyUrl = url.searchParams.get("url");
  
  // Get token from query for file ID mode
  const token = url.searchParams.get("token")?.trim() || null;

  console.log("[Media] Request:", { 
    fileId: fileId?.slice(0, 8), 
    proxyUrl: proxyUrl?.slice(0, 50),
    hasToken: !!token,
  });

  try {
    // Mode 1: Fetch file by ID from our database + storage (REQUIRES TOKEN)
    // Returns a short-lived signed URL for enhanced security
    if (fileId && fileId !== "media" && !proxyUrl) {
      // Require valid token for file ID mode
      if (!isValidToken(token)) {
        console.error("[Media] Missing or invalid token for file:", fileId);
        return errorResponse(401, "Missing or invalid token", corsHeaders);
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Look up file record AND verify it belongs to the project token
      const { data: file, error: fileError } = await supabase
        .from("files")
        .select(`
          storage_path, 
          file_type, 
          file_name, 
          project_id,
          projects!inner(project_token)
        `)
        .eq("id", fileId)
        .eq("projects.project_token", token)
        .maybeSingle();

      if (fileError || !file) {
        console.error("[Media] File not found or token mismatch:", fileId, fileError);
        return errorResponse(404, "File not found", corsHeaders);
      }

      // Check content type
      if (!isAllowedContentType(file.file_type)) {
        console.error("[Media] Disallowed content type:", file.file_type);
        return errorResponse(415, "Unsupported media type", corsHeaders);
      }

      // Get file from storage
      // Assume storage_path is in format "bucket/path/to/file"
      const storageParts = file.storage_path.split("/");
      const bucket = storageParts[0];
      const filePath = storageParts.slice(1).join("/");

      // Check if client wants a signed URL (for enhanced security) or direct content
      const wantSignedUrl = url.searchParams.get("signed") === "true";
      
      if (wantSignedUrl) {
        // Generate a short-lived signed URL (1 hour expiration)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, SIGNED_URL_EXPIRATION);

        if (signedUrlError || !signedUrlData?.signedUrl) {
          console.error("[Media] Signed URL error:", signedUrlError);
          return errorResponse(500, "Failed to generate signed URL", corsHeaders);
        }

        // Return the signed URL as JSON
        return new Response(
          JSON.stringify({
            signedUrl: signedUrlData.signedUrl,
            expiresIn: SIGNED_URL_EXPIRATION,
            fileName: file.file_name,
            fileType: file.file_type,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Cache-Control": "no-store", // Don't cache signed URL responses
            },
          }
        );
      }

      // Direct content mode (backward compatible)
      const { data: fileData, error: storageError } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (storageError || !fileData) {
        console.error("[Media] Storage error:", storageError);
        return errorResponse(404, "File not found in storage", corsHeaders);
      }

      // Check size
      if (fileData.size > MAX_SIZE) {
        return errorResponse(413, "File too large", corsHeaders);
      }

      const arrayBuffer = await fileData.arrayBuffer();

      return new Response(arrayBuffer, {
        status: 200,
        headers: getSecurityHeaders(file.file_type, arrayBuffer.byteLength, corsHeaders),
      });
    }

    // Mode 2: Proxy external URL (no token required, but host must be allowed)
    if (proxyUrl) {
      let targetUrl: URL;
      try {
        targetUrl = new URL(proxyUrl);
      } catch {
        return errorResponse(400, "Invalid URL", corsHeaders);
      }

      // HTTPS only
      if (targetUrl.protocol !== "https:") {
        console.error("[Media] HTTPS required, got:", targetUrl.protocol);
        return errorResponse(400, "HTTPS required", corsHeaders);
      }

      // Check host allowlist
      if (!isAllowedHost(targetUrl)) {
        console.error("[Media] Host not allowed:", targetUrl.hostname);
        return errorResponse(403, "Host not allowed", corsHeaders);
      }

      // Fetch the resource (don't auto-follow redirects)
      const response = await fetch(targetUrl.toString(), {
        redirect: "manual",
        headers: {
          "User-Agent": "PleasantCove-MediaProxy/1.0",
        },
      });

      // Handle redirects carefully
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          return errorResponse(502, "Upstream redirect missing location", corsHeaders);
        }
        
        const redirectUrl = new URL(location, targetUrl);
        if (!isAllowedHost(redirectUrl)) {
          console.error("[Media] Redirect host not allowed:", redirectUrl.hostname);
          return errorResponse(403, "Redirect host not allowed", corsHeaders);
        }
        
        // Follow the redirect once
        const redirectResponse = await fetch(redirectUrl.toString(), {
          redirect: "manual",
          headers: { "User-Agent": "PleasantCove-MediaProxy/1.0" },
        });
        
        if (!redirectResponse.ok) {
          return errorResponse(502, "Upstream error after redirect", corsHeaders);
        }
        
        const contentType = redirectResponse.headers.get("content-type") || "";
        if (!isAllowedContentType(contentType)) {
          return errorResponse(415, "Unsupported media type", corsHeaders);
        }
        
        const arrayBuffer = await redirectResponse.arrayBuffer();
        if (arrayBuffer.byteLength > MAX_SIZE) {
          return errorResponse(413, "File too large", corsHeaders);
        }
        
        return new Response(arrayBuffer, {
          status: 200,
          headers: getSecurityHeaders(contentType.split(";")[0].trim(), arrayBuffer.byteLength, corsHeaders),
        });
      }

      if (!response.ok) {
        console.error("[Media] Upstream error:", response.status);
        return errorResponse(502, "Upstream error", corsHeaders);
      }

      // Check content type
      const contentType = response.headers.get("content-type") || "";
      if (!isAllowedContentType(contentType)) {
        console.error("[Media] Disallowed content type:", contentType);
        return errorResponse(415, "Unsupported media type", corsHeaders);
      }

      // Check size from header
      const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
      if (contentLength > MAX_SIZE) {
        return errorResponse(413, "File too large", corsHeaders);
      }

      // Read body and check actual size
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_SIZE) {
        return errorResponse(413, "File too large", corsHeaders);
      }

      return new Response(arrayBuffer, {
        status: 200,
        headers: getSecurityHeaders(contentType.split(";")[0].trim(), arrayBuffer.byteLength, corsHeaders),
      });
    }

    return errorResponse(400, "Missing file_id or url parameter", corsHeaders);
  } catch (err) {
    console.error("[Media] Error:", err);
    return errorResponse(500, "Internal server error", corsHeaders);
  }
});
