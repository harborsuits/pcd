import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const BUCKET = "project-files";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour

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
  /^https:\/\/(www\.)?pleasantcovedesign\.com$/,
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Vary": "Origin",
    };
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

// Verify admin/operator role from auth token
// deno-lint-ignore no-explicit-any
async function verifyOperatorAuth(req: Request, supabase: any): Promise<{ valid: boolean; userId?: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false };
  }

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) {
    return { valid: false };
  }

  // Check if user has admin or operator role
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);

  const hasPermission = (roles as { role: string }[] | null)?.some(
    (r) => r.role === "admin" || r.role === "operator"
  );
  
  return { valid: !!hasPermission, userId: data.user.id };
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

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  
  // Parse path: /files/:token/:action
  let token: string;
  let action: string;
  
  if (parts[0] === "files" && parts.length >= 3) {
    token = parts[1];
    action = parts[2];
  } else {
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

  // Handle LIST action (GET) - returns files with signed URLs
  if (action === "list" && req.method === "GET") {
    // Verify operator/admin auth for listing files
    const auth = await verifyOperatorAuth(req, supabase);
    if (!auth.valid) {
      console.log("[Files] Unauthorized list request");
      return json(401, { error: "Unauthorized" }, corsHeaders);
    }

    try {
      // Fetch files from DB
      const { data: files, error: filesErr } = await supabase
        .from("files")
        .select("id, file_name, file_type, description, storage_path, created_at")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false });

      if (filesErr) {
        console.error("[Files] DB fetch error:", filesErr);
        return json(500, { error: "Failed to fetch files" }, corsHeaders);
      }

      // Generate signed URLs for each file
      const filesWithUrls = await Promise.all(
        (files || []).map(async (file) => {
          // storage_path is "project-files/token/timestamp-random-filename"
          // We need just the path within the bucket: "token/timestamp-random-filename"
          const pathInBucket = file.storage_path.replace(`${BUCKET}/`, "");
          
          const { data: signedData, error: signErr } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(pathInBucket, SIGNED_URL_EXPIRY);

          if (signErr) {
            console.error(`[Files] Signed URL error for ${file.id}:`, signErr);
            return { ...file, signed_url: null };
          }

          return {
            id: file.id,
            file_name: file.file_name,
            file_type: file.file_type,
            description: file.description,
            created_at: file.created_at,
            signed_url: signedData.signedUrl,
          };
        })
      );

      console.log(`[Files] Listed ${filesWithUrls.length} files for project ${token}`);
      return json(200, { files: filesWithUrls }, corsHeaders);
    } catch (e) {
      console.error("[Files] List error:", e);
      return json(500, { error: "Internal server error" }, corsHeaders);
    }
  }

  // Handle UPLOAD action (POST)
  if (action === "upload" && req.method === "POST") {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return json(400, { error: "Expected multipart/form-data" }, corsHeaders);
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
      console.error("[Files] Upload error:", e);
      return json(500, { error: "Internal server error" }, corsHeaders);
    }
  }

  console.log("[Files] Unknown action:", action, "method:", req.method);
  return json(404, { error: "Not found" }, corsHeaders);
});
