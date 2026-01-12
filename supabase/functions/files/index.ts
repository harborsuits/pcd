import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const BUCKET_FILES = "project-files";
const BUCKET_MEDIA = "project-media";
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

// Unified file type for merged results
type UnifiedFile = {
  id: string;
  file_name: string;
  file_type: string;
  created_at: string;
  storage_path: string;
  description?: string | null;
  source: "upload" | "feedback";
  uploader_type?: string | null;
  comment_id?: string | null;
  signed_url?: string | null;
};

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

// Verify client owns the project via projects.owner_user_id
// deno-lint-ignore no-explicit-any
async function verifyClientOwnership(
  req: Request,
  supabase: any,
  projectId: string
): Promise<{ valid: boolean; userId?: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { valid: false };

  const jwt = authHeader.slice("Bearer ".length).trim();
  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data?.user) return { valid: false };

  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .select("owner_user_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectErr || !project) return { valid: false };

  if (project.owner_user_id === data.user.id) {
    return { valid: true, userId: data.user.id };
  }

  return { valid: false };
}

// Handle unified file listing (merges files + prototype_comment_media)
// deno-lint-ignore no-explicit-any
async function handleList(
  supabase: any,
  project: { id: string; project_token: string },
  token: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // 1) Fetch direct uploads from files table
    const { data: directFiles, error: filesErr } = await supabase
      .from("files")
      .select("id, file_name, file_type, description, storage_path, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (filesErr) {
      console.error("[Files] DB fetch error:", filesErr);
      return json(500, { error: "Failed to fetch files" }, corsHeaders);
    }

    // 2) Fetch feedback attachments from prototype_comment_media
    const { data: commentMedia, error: mediaErr } = await supabase
      .from("prototype_comment_media")
      .select("id, filename, mime_type, storage_path, created_at, comment_id, uploader_type")
      .eq("project_token", token)
      .order("created_at", { ascending: false });

    if (mediaErr) {
      console.error("[Files] Comment media fetch error:", mediaErr);
      return json(500, { error: "Failed to fetch comment media" }, corsHeaders);
    }

    // 3) Normalize and merge results
    const uploads: UnifiedFile[] = (directFiles ?? []).map((f: {
      id: string;
      file_name: string;
      file_type: string;
      description: string | null;
      storage_path: string;
      created_at: string;
    }) => ({
      id: f.id,
      file_name: f.file_name,
      file_type: f.file_type,
      description: f.description,
      storage_path: f.storage_path,
      created_at: f.created_at,
      source: "upload" as const,
      uploader_type: null,
      comment_id: null,
      signed_url: null,
    }));

    const feedback: UnifiedFile[] = (commentMedia ?? []).map((m: {
      id: string;
      filename: string;
      mime_type: string;
      storage_path: string;
      created_at: string;
      comment_id: string | null;
      uploader_type: string | null;
    }) => ({
      id: m.id,
      file_name: m.filename,
      file_type: m.mime_type,
      description: null,
      storage_path: m.storage_path,
      created_at: m.created_at,
      source: "feedback" as const,
      uploader_type: m.uploader_type,
      comment_id: m.comment_id,
      signed_url: null,
    }));

    // Merge and sort by created_at descending
    const merged = [...uploads, ...feedback].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 4) Generate signed URLs for all files
    const filesWithUrls = await Promise.all(
      merged.map(async (file) => {
        let signedUrl: string | null = null;

        if (file.source === "upload") {
          // Files from files table use project-files bucket
          const pathInBucket = file.storage_path.replace(`${BUCKET_FILES}/`, "");
          const { data: signedData, error: signErr } = await supabase.storage
            .from(BUCKET_FILES)
            .createSignedUrl(pathInBucket, SIGNED_URL_EXPIRY);

          if (!signErr && signedData) {
            signedUrl = signedData.signedUrl;
          } else {
            console.error(`[Files] Signed URL error for upload ${file.id}:`, signErr);
          }
        } else {
          // Feedback attachments use project-media bucket
          const { data: signedData, error: signErr } = await supabase.storage
            .from(BUCKET_MEDIA)
            .createSignedUrl(file.storage_path, SIGNED_URL_EXPIRY);

          if (!signErr && signedData) {
            signedUrl = signedData.signedUrl;
          } else {
            console.error(`[Files] Signed URL error for feedback ${file.id}:`, signErr);
          }
        }

        return {
          id: file.id,
          file_name: file.file_name,
          file_type: file.file_type,
          description: file.description,
          created_at: file.created_at,
          source: file.source,
          uploader_type: file.uploader_type,
          comment_id: file.comment_id,
          signed_url: signedUrl,
        };
      })
    );

    console.log(`[Files] Listed ${filesWithUrls.length} files for project ${token} (${uploads.length} uploads, ${feedback.length} feedback)`);
    return json(200, { files: filesWithUrls }, corsHeaders);
  } catch (e) {
    console.error("[Files] List error:", e);
    return json(500, { error: "Internal server error" }, corsHeaders);
  }
}

// Handle download for a specific file (works for both tables)
// deno-lint-ignore no-explicit-any
async function handleDownload(
  supabase: any,
  project: { id: string; project_token: string },
  token: string,
  fileId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // 1) Try files table first
    const { data: fileRow, error: fileErr } = await supabase
      .from("files")
      .select("id, project_id, storage_path, file_name")
      .eq("id", fileId)
      .maybeSingle();

    if (fileErr && fileErr.code !== "PGRST116") {
      console.error("[Files] Download file lookup error:", fileErr);
    }

    if (fileRow?.id) {
      // Verify project ownership
      if (fileRow.project_id !== project.id) {
        return json(403, { error: "Forbidden" }, corsHeaders);
      }

      // Generate signed URL from project-files bucket
      const pathInBucket = fileRow.storage_path.replace(`${BUCKET_FILES}/`, "");
      const { data, error } = await supabase.storage
        .from(BUCKET_FILES)
        .createSignedUrl(pathInBucket, SIGNED_URL_EXPIRY);

      if (error) {
        console.error("[Files] Download signed URL error:", error);
        return json(500, { error: error.message }, corsHeaders);
      }

      console.log(`[Files] Download: ${fileRow.file_name} from ${BUCKET_FILES}`);
      return json(200, { url: data.signedUrl }, corsHeaders);
    }

    // 2) Try prototype_comment_media
    const { data: mediaRow, error: mediaErr } = await supabase
      .from("prototype_comment_media")
      .select("id, project_token, storage_path, filename")
      .eq("id", fileId)
      .maybeSingle();

    if (mediaErr && mediaErr.code !== "PGRST116") {
      console.error("[Files] Download media lookup error:", mediaErr);
    }

    if (!mediaRow?.id) {
      return json(404, { error: "File not found" }, corsHeaders);
    }

    // Verify project ownership via token
    if (mediaRow.project_token !== token) {
      return json(403, { error: "Forbidden" }, corsHeaders);
    }

    // Generate signed URL from project-media bucket
    const { data, error } = await supabase.storage
      .from(BUCKET_MEDIA)
      .createSignedUrl(mediaRow.storage_path, SIGNED_URL_EXPIRY);

    if (error) {
      console.error("[Files] Download media signed URL error:", error);
      return json(500, { error: error.message }, corsHeaders);
    }

    console.log(`[Files] Download: ${mediaRow.filename} from ${BUCKET_MEDIA}`);
    return json(200, { url: data.signedUrl }, corsHeaders);
  } catch (e) {
    console.error("[Files] Download error:", e);
    return json(500, { error: "Internal server error" }, corsHeaders);
  }
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
  
  // Find "files" in path
  const filesIndex = parts.indexOf("files");
  if (filesIndex === -1) {
    console.log("[Files] 404 - no 'files' in path:", parts);
    return json(404, { error: "Not found" }, corsHeaders);
  }

  const token = parts[filesIndex + 1];
  const third = parts[filesIndex + 2]; // "list" | "upload" | fileId
  const fourth = parts[filesIndex + 3]; // "download" | undefined

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

  // Handle DOWNLOAD: /files/:token/:fileId/download (GET)
  if (fourth === "download" && req.method === "GET") {
    const fileId = third;
    if (!fileId) {
      return json(400, { error: "Missing file ID" }, corsHeaders);
    }
    
    // Verify either operator OR client ownership
    const operatorAuth = await verifyOperatorAuth(req, supabase);
    const clientAuth = await verifyClientOwnership(req, supabase, project.id);

    if (!operatorAuth.valid && !clientAuth.valid) {
      console.log("[Files] Unauthorized download request");
      return json(401, { error: "Unauthorized" }, corsHeaders);
    }

    return await handleDownload(supabase, project, token, fileId, corsHeaders);
  }

  // Handle LIST action (GET) - returns unified files with signed URLs
  const action = third;
  if (action === "list" && req.method === "GET") {
    // Allow either:
    // 1) operator/admin via roles
    // 2) client who owns the project via projects.owner_user_id
    const operatorAuth = await verifyOperatorAuth(req, supabase);
    const clientAuth = await verifyClientOwnership(req, supabase, project.id);

    if (!operatorAuth.valid && !clientAuth.valid) {
      console.log("[Files] Unauthorized list request");
      return json(401, { error: "Unauthorized" }, corsHeaders);
    }

    const userId = operatorAuth.userId || clientAuth.userId;
    console.log(
      `[Files] Auth verified: ${operatorAuth.valid ? "operator" : "client"} ${userId}`
    );

    return await handleList(supabase, project, token, corsHeaders);
  }

  // Handle UPLOAD action (POST)
  if (action === "upload" && req.method === "POST") {
    // AUTH CHECK - require operator OR client ownership
    const operatorAuth = await verifyOperatorAuth(req, supabase);
    const clientAuth = await verifyClientOwnership(req, supabase, project.id);

    if (!operatorAuth.valid && !clientAuth.valid) {
      console.log("[Files] Unauthorized upload request");
      return json(401, { error: "Unauthorized" }, corsHeaders);
    }

    const uploadUserId = operatorAuth.userId || clientAuth.userId;
    console.log(`[Files] Upload auth verified: ${operatorAuth.valid ? "operator" : "client"} ${uploadUserId}`);

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
        .from(BUCKET_FILES)
        .upload(objectPath, file, {
          contentType: ct,
          upsert: false,
        });

      if (upErr) {
        console.error("[Files] Storage upload error:", upErr);
        return json(500, { error: "Upload failed" }, corsHeaders);
      }

      // Insert DB record
      const storage_path = `${BUCKET_FILES}/${objectPath}`;

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
        await supabase.storage.from(BUCKET_FILES).remove([objectPath]);
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
