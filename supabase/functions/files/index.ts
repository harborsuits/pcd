import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const BUCKET = "project-files";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
];

const ALLOWED_ORIGINS: RegExp[] = [
  /^https:\/\/.*\.lovable\.dev$/,
  /^https:\/\/.*\.lovableproject\.com$/,
  /^https:\/\/.*\.squarespace\.com$/,
  /^https:\/\/.*\.squarespace-cdn\.com$/,
  /^https:\/\/(www\.)?pleasantcove\.design$/,
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  return ALLOWED_ORIGINS.some((re) => re.test(origin));
}

function corsHeadersFor(origin: string | null): Record<string, string> {
  if (!origin) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
    };
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(status: number, body: unknown, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function isValidToken(token: string): boolean {
  return /^[a-zA-Z0-9\-_]{12,128}$/.test(token.trim());
}

function safeFilename(name: string): string {
  return name.replace(/[^\w.\- ]+/g, "_").slice(0, 160);
}

function isAllowedContentType(ct: string): boolean {
  const base = ct.toLowerCase().split(";")[0].trim();
  return ALLOWED_CONTENT_TYPES.includes(base) || base.startsWith("image/");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (origin && !isAllowedOrigin(origin)) {
    const ch = corsHeadersFor(origin);
    return json(403, { error: "Origin not allowed" }, ch);
  }

  const corsHeaders = corsHeadersFor(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" }, corsHeaders);
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  
  // In Supabase edge functions, path is /files/:token/upload (not /functions/v1/files/...)
  // Handle both cases defensively
  let token: string;
  let action: string;
  
  if (parts[0] === "files" && parts.length >= 3) {
    // Direct path: /files/:token/upload
    token = parts[1];
    action = parts[2];
  } else {
    // Fallback: look for "files" in path
    const filesIndex = parts.indexOf("files");
    if (filesIndex === -1 || filesIndex + 2 >= parts.length) {
      console.log("[Files] 404 - path parts:", parts);
      return json(404, { error: "Not found" }, corsHeaders);
    }
    token = parts[filesIndex + 1];
    action = parts[filesIndex + 2];
  }

  if (!token || !isValidToken(token)) {
    console.log("[Files] Invalid token:", token);
    return json(400, { error: "Invalid token" }, corsHeaders);
  }
  
  if (action !== "upload") {
    console.log("[Files] Unknown action:", action);
    return json(404, { error: "Not found" }, corsHeaders);
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return json(400, { error: "Expected multipart/form-data" }, corsHeaders);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Resolve project by token
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("id, project_token")
    .eq("project_token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (projErr || !project) {
    console.error("[Files] Project lookup error:", projErr);
    return json(404, { error: "Project not found" }, corsHeaders);
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const description = (form.get("description") || "").toString().slice(0, 500);

    if (!(file instanceof File)) {
      return json(400, { error: "Missing file" }, corsHeaders);
    }

    if (file.size > MAX_SIZE) {
      return json(413, { error: "File too large (max 10MB)" }, corsHeaders);
    }

    const ct = file.type || "application/octet-stream";
    if (!isAllowedContentType(ct)) {
      return json(415, { error: "Unsupported file type" }, corsHeaders);
    }

    const originalName = safeFilename(file.name || "upload");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const random = crypto.randomUUID().slice(0, 8);
    const objectPath = `${token}/${stamp}-${random}-${originalName}`;

    console.log(`[Files] Uploading: ${objectPath} (${ct}, ${file.size} bytes)`);

    // Upload to storage
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, file, {
        contentType: ct,
        upsert: false,
      });

    if (upErr) {
      console.error("[Files] Storage upload error:", upErr);
      return json(500, { error: "Upload failed" }, corsHeaders);
    }

    // Insert DB record
    const storage_path = `${BUCKET}/${objectPath}`;

    const { data: created, error: insErr } = await supabase
      .from("files")
      .insert({
        project_id: project.id,
        project_token: project.project_token,
        file_name: originalName,
        file_type: ct,
        storage_path,
        description: description || null,
      })
      .select("id, file_name, file_type, description, created_at")
      .single();

    if (insErr || !created) {
      console.error("[Files] DB insert error:", insErr);
      // Cleanup uploaded file
      await supabase.storage.from(BUCKET).remove([objectPath]);
      return json(500, { error: "Failed to save file record" }, corsHeaders);
    }

    console.log(`[Files] Created file record: ${created.id}`);
    return json(200, { file: created }, corsHeaders);
  } catch (e) {
    console.error("[Files] Error:", e);
    return json(500, { error: "Internal server error" }, corsHeaders);
  }
});
