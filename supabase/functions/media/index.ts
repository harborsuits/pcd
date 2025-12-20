// Media Proxy edge function
// GET /media/:file_id - serve file by ID from storage
// GET /media?url=<encoded> - proxy allowed external URLs

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Allowed external hosts (add your storage domains here)
const ALLOWED_HOSTS = [
  new URL(SUPABASE_URL).hostname, // Our Supabase storage
  "storage.googleapis.com",
  "lh3.googleusercontent.com",
];

// Max file size (10MB)
const MAX_SIZE = 10 * 1024 * 1024;

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Security headers for media responses
function getSecurityHeaders(contentType: string, size: number): Record<string, string> {
  return {
    ...corsHeaders,
    "Content-Type": contentType,
    "Content-Length": String(size),
    "Cache-Control": "public, max-age=3600, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'none'; script-src 'none';",
    "X-Frame-Options": "DENY",
  };
}

function errorResponse(status: number, message: string): Response {
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return errorResponse(405, "Method not allowed");
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Get file_id from path: /media/:file_id
  const fileId = pathParts.length >= 2 ? pathParts[pathParts.length - 1] : null;
  
  // Or get url from query: /media?url=<encoded>
  const proxyUrl = url.searchParams.get("url");

  console.log("[Media] Request:", { fileId, proxyUrl: proxyUrl?.slice(0, 50) });

  try {
    // Mode 1: Fetch file by ID from our database + storage
    if (fileId && fileId !== "media" && !proxyUrl) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Look up file record
      const { data: file, error: fileError } = await supabase
        .from("files")
        .select("storage_path, file_type, file_name")
        .eq("id", fileId)
        .single();

      if (fileError || !file) {
        console.error("[Media] File not found:", fileId, fileError);
        return errorResponse(404, "File not found");
      }

      // Check content type
      if (!isAllowedContentType(file.file_type)) {
        console.error("[Media] Disallowed content type:", file.file_type);
        return errorResponse(415, "Unsupported media type");
      }

      // Get file from storage
      // Assume storage_path is in format "bucket/path/to/file"
      const pathParts = file.storage_path.split("/");
      const bucket = pathParts[0];
      const filePath = pathParts.slice(1).join("/");

      const { data: fileData, error: storageError } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (storageError || !fileData) {
        console.error("[Media] Storage error:", storageError);
        return errorResponse(404, "File not found in storage");
      }

      // Check size
      if (fileData.size > MAX_SIZE) {
        return errorResponse(413, "File too large");
      }

      const arrayBuffer = await fileData.arrayBuffer();

      return new Response(arrayBuffer, {
        status: 200,
        headers: getSecurityHeaders(file.file_type, arrayBuffer.byteLength),
      });
    }

    // Mode 2: Proxy external URL
    if (proxyUrl) {
      let targetUrl: URL;
      try {
        targetUrl = new URL(proxyUrl);
      } catch {
        return errorResponse(400, "Invalid URL");
      }

      // Check protocol
      if (targetUrl.protocol !== "https:" && targetUrl.protocol !== "http:") {
        return errorResponse(400, "Invalid protocol");
      }

      // Check host allowlist
      if (!isAllowedHost(targetUrl)) {
        console.error("[Media] Host not allowed:", targetUrl.hostname);
        return errorResponse(403, "Host not allowed");
      }

      // Fetch the resource
      const response = await fetch(targetUrl.toString(), {
        headers: {
          "User-Agent": "PleasantCove-MediaProxy/1.0",
        },
      });

      if (!response.ok) {
        console.error("[Media] Upstream error:", response.status);
        return errorResponse(502, "Upstream error");
      }

      // Check content type
      const contentType = response.headers.get("content-type") || "";
      if (!isAllowedContentType(contentType)) {
        console.error("[Media] Disallowed content type:", contentType);
        return errorResponse(415, "Unsupported media type");
      }

      // Check size from header
      const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
      if (contentLength > MAX_SIZE) {
        return errorResponse(413, "File too large");
      }

      // Read body and check actual size
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_SIZE) {
        return errorResponse(413, "File too large");
      }

      return new Response(arrayBuffer, {
        status: 200,
        headers: getSecurityHeaders(contentType.split(";")[0].trim(), arrayBuffer.byteLength),
      });
    }

    return errorResponse(400, "Missing file_id or url parameter");
  } catch (err) {
    console.error("[Media] Error:", err);
    return errorResponse(500, "Internal server error");
  }
});
