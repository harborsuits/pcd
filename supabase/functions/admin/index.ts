import { createClient } from "npm:@supabase/supabase-js@2";

// Allowed origins for admin console
const ADMIN_ALLOWED_ORIGINS = [
  /^https?:\/\/.*\.lovable\.app$/,
  /^https?:\/\/.*\.lovableproject\.com$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/.*\.pleasantcove\.design$/,
  /^https?:\/\/(www\.)?pleasantcovedesign\.com$/,
];

function isAdminOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // Server-to-server calls
  return ADMIN_ALLOWED_ORIGINS.some(pattern => pattern.test(origin));
}

function getAdminCorsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  };
}

// Token validation: alphanumeric + hyphens/underscores, 12-128 chars
function isValidToken(token: string): boolean {
  return /^[a-zA-Z0-9\-_]{12,128}$/.test(token);
}

// Default CORS headers for handler functions (used when origin check already passed)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  
  // Check origin for CORS - reject disallowed origins  
  if (origin && !isAdminOriginAllowed(origin)) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Handle CORS preflight with origin-aware headers
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getAdminCorsHeaders(origin) });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Find "admin" in path and get remaining segments
  const adminIdx = pathParts.lastIndexOf("admin");
  const subPath = adminIdx >= 0 ? pathParts.slice(adminIdx + 1).join("/") : "";

  console.log(`Admin endpoint called: ${subPath}, method: ${req.method}`);

  // Route: GET /admin/inbox
  if (subPath === "inbox" && req.method === "GET") {
    return handleInbox(req);
  }

  // Route: POST /admin/messages/reply
  if (subPath === "messages/reply" && req.method === "POST") {
    return handleMessagesReply(req);
  }

  // Route: POST /admin/messages/mark-read
  if (subPath === "messages/mark-read" && req.method === "POST") {
    return handleMarkRead(req);
  }

  // Route: GET /admin/notes/:token
  if (subPath.match(/^notes\/[^\/]+$/) && req.method === "GET") {
    const token = subPath.replace("notes/", "");
    return handleGetNotes(req, token);
  }

  // Route: POST /admin/notes/:token
  if (subPath.match(/^notes\/[^\/]+$/) && req.method === "POST") {
    const token = subPath.replace("notes/", "");
    return handleCreateNote(req, token);
  }

  // Route: PATCH /admin/notes/:token/:noteId
  if (subPath.match(/^notes\/[^\/]+\/[^\/]+$/) && req.method === "PATCH") {
    const parts = subPath.split("/");
    const token = parts[1];
    const noteId = parts[2];
    return handleUpdateNote(req, token, noteId);
  }

  // Route: DELETE /admin/notes/:token/:noteId
  if (subPath.match(/^notes\/[^\/]+\/[^\/]+$/) && req.method === "DELETE") {
    const parts = subPath.split("/");
    const token = parts[1];
    const noteId = parts[2];
    return handleDeleteNote(req, token, noteId);
  }

  // Route: GET /admin/projects
  if (subPath === "projects" && req.method === "GET") {
    return handleProjects(req);
  }

  // Route: PATCH /admin/projects/:token/status
  if (subPath.match(/^projects\/[^\/]+\/status$/) && req.method === "PATCH") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handleUpdateProjectStatus(req, token);
  }

  // Route: PATCH /admin/projects/:token/stage - Update pipeline stage
  if (subPath.match(/^projects\/[^\/]+\/stage$/) && req.method === "PATCH") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handleUpdatePipelineStage(req, token);
  }

  // Route: PATCH /admin/projects/:token/portal-stage - Update portal stage (client-facing)
  if (subPath.match(/^projects\/[^\/]+\/portal-stage$/) && req.method === "PATCH") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handleUpdatePortalStage(req, token);
  }

  // Route: PATCH /admin/intake/:intakeId/approve
  if (subPath.match(/^intake\/[^\/]+\/approve$/) && req.method === "PATCH") {
    const parts = subPath.split("/");
    const intakeId = parts[1];
    return handleApproveIntake(req, intakeId);
  }

  // Route: POST /admin/projects/:token/launch-complete
  if (subPath.match(/^projects\/[^\/]+\/launch-complete$/) && req.method === "POST") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handleLaunchComplete(req, token);
  }

  // Route: POST /admin/projects/:token/nudge - Send reminder to client
  if (subPath.match(/^projects\/[^\/]+\/nudge$/) && req.method === "POST") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handleNudge(req, token);
  }

  // Route: POST /admin/notifications/test
  if (subPath === "notifications/test" && req.method === "POST") {
    return handleTestEmail(req);
  }

  // Route: GET /admin/checklist/:token
  if (subPath.match(/^checklist\/[^\/]+$/) && req.method === "GET") {
    const token = subPath.replace("checklist/", "");
    return handleGetChecklist(req, token);
  }

  // Route: POST /admin/checklist/:token
  if (subPath.match(/^checklist\/[^\/]+$/) && req.method === "POST") {
    const token = subPath.replace("checklist/", "");
    return handleCreateChecklistItem(req, token);
  }

  // Route: PATCH /admin/checklist/:token/:itemId
  if (subPath.match(/^checklist\/[^\/]+\/[^\/]+$/) && req.method === "PATCH") {
    const parts = subPath.split("/");
    const token = parts[1];
    const itemId = parts[2];
    return handleUpdateChecklistItem(req, token, itemId);
  }

  // Route: DELETE /admin/checklist/:token/:itemId
  if (subPath.match(/^checklist\/[^\/]+\/[^\/]+$/) && req.method === "DELETE") {
    const parts = subPath.split("/");
    const token = parts[1];
    const itemId = parts[2];
    return handleDeleteChecklistItem(req, token, itemId);
  }

  // Route: POST /admin/checklist/:token/defaults
  if (subPath.match(/^checklist\/[^\/]+\/defaults$/) && req.method === "POST") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handleAddDefaultChecklist(req, token);
  }

  // Route: GET /admin/prototypes/:token
  if (subPath.match(/^prototypes\/[^\/]+$/) && req.method === "GET") {
    const token = subPath.replace("prototypes/", "");
    return handleGetPrototypes(req, token);
  }

  // Route: POST /admin/prototypes/:token
  if (subPath.match(/^prototypes\/[^\/]+$/) && req.method === "POST") {
    const token = subPath.replace("prototypes/", "");
    return handleCreatePrototype(req, token);
  }

  // Route: PATCH /admin/prototypes/:token/:prototypeId
  if (subPath.match(/^prototypes\/[^\/]+\/[^\/]+$/) && req.method === "PATCH") {
    const parts = subPath.split("/");
    const token = parts[1];
    const prototypeId = parts[2];
    return handleUpdatePrototype(req, token, prototypeId);
  }

  // Route: DELETE /admin/prototypes/:token/:prototypeId
  if (subPath.match(/^prototypes\/[^\/]+\/[^\/]+$/) && req.method === "DELETE") {
    const parts = subPath.split("/");
    const token = parts[1];
    const prototypeId = parts[2];
    return handleDeletePrototype(req, token, prototypeId);
  }

  // Route: GET /admin/comments/:token
  if (subPath.match(/^comments\/[^\/]+$/) && req.method === "GET") {
    const token = subPath.replace("comments/", "");
    return handleGetComments(req, token);
  }

  // Route: POST /admin/comments/:token
  if (subPath.match(/^comments\/[^\/]+$/) && req.method === "POST") {
    const token = subPath.replace("comments/", "");
    return handleCreateComment(req, token);
  }

  // Route: PATCH /admin/comments/:token/:commentId
  if (subPath.match(/^comments\/[^\/]+\/[^\/]+$/) && req.method === "PATCH" && !subPath.includes("attachments")) {
    const parts = subPath.split("/");
    const token = parts[1];
    const commentId = parts[2];
    return handleUpdateComment(req, token, commentId);
  }

  // Route: GET /admin/comments/:token/:commentId/attachments
  if (subPath.match(/^comments\/[^\/]+\/[^\/]+\/attachments$/) && req.method === "GET") {
    const parts = subPath.split("/");
    const token = parts[1];
    const commentId = parts[2];
    return handleGetCommentAttachments(req, token, commentId);
  }

  // Route: POST /admin/comments/:token/:commentId/attachments
  if (subPath.match(/^comments\/[^\/]+\/[^\/]+\/attachments$/) && req.method === "POST") {
    const parts = subPath.split("/");
    const token = parts[1];
    const commentId = parts[2];
    return handleUploadCommentAttachment(req, token, commentId);
  }

  // Route: DELETE /admin/comments/:token/:commentId/attachments/:attachmentId
  if (subPath.match(/^comments\/[^\/]+\/[^\/]+\/attachments\/[^\/]+$/) && req.method === "DELETE") {
    const parts = subPath.split("/");
    const token = parts[1];
    const commentId = parts[2];
    const attachmentId = parts[4];
    return handleDeleteCommentAttachment(req, token, commentId, attachmentId);
  }

  // Route: GET /admin/media/:token
  if (subPath.match(/^media\/[^\/]+$/) && req.method === "GET") {
    const token = subPath.replace("media/", "");
    return handleGetMedia(req, token);
  }

  // Route: POST /admin/media/:token
  if (subPath.match(/^media\/[^\/]+$/) && req.method === "POST") {
    const token = subPath.replace("media/", "");
    return handleCreateMedia(req, token);
  }

  // Route: DELETE /admin/media/:token/:mediaId
  if (subPath.match(/^media\/[^\/]+\/[^\/]+$/) && req.method === "DELETE") {
    const parts = subPath.split("/");
    const token = parts[1];
    const mediaId = parts[2];
    return handleDeleteMedia(req, token, mediaId);
  }

  // Route: GET /admin/accounts - List all auth users with linked projects
  if (subPath === "accounts" && req.method === "GET") {
    return handleGetAccounts(req);
  }

  // Route: PATCH /admin/accounts/:userId - Update user email
  if (subPath.match(/^accounts\/[^\/]+$/) && req.method === "PATCH") {
    const userId = subPath.replace("accounts/", "");
    return handleUpdateAccount(req, userId);
  }

  // Route: DELETE /admin/accounts/:userId - Delete auth user
  if (subPath.match(/^accounts\/[^\/]+$/) && req.method === "DELETE") {
    const userId = subPath.replace("accounts/", "");
    return handleDeleteAccount(req, userId);
  }

  // Route: POST /admin/accounts/clear-test - Delete all non-operator test accounts
  if (subPath === "accounts/clear-test" && req.method === "POST") {
    return handleClearTestAccounts(req);
  }

  // Route: GET /admin/milestones/:token
  if (subPath.match(/^milestones\/[^\/]+$/) && req.method === "GET") {
    const token = subPath.replace("milestones/", "");
    return handleGetMilestones(req, token);
  }

  // Route: POST /admin/milestones/:token
  if (subPath.match(/^milestones\/[^\/]+$/) && req.method === "POST") {
    const token = subPath.replace("milestones/", "");
    return handleCreateMilestone(req, token);
  }

  // Route: POST /admin/milestones/:token/defaults
  if (subPath.match(/^milestones\/[^\/]+\/defaults$/) && req.method === "POST") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handleAddDefaultMilestones(req, token);
  }

  // Route: PATCH /admin/milestones/:token/:milestoneId
  if (subPath.match(/^milestones\/[^\/]+\/[^\/]+$/) && req.method === "PATCH" && !subPath.includes("notes")) {
    const parts = subPath.split("/");
    const token = parts[1];
    const milestoneId = parts[2];
    return handleUpdateMilestone(req, token, milestoneId);
  }

  // Route: DELETE /admin/milestones/:token/:milestoneId
  if (subPath.match(/^milestones\/[^\/]+\/[^\/]+$/) && req.method === "DELETE" && !subPath.includes("notes")) {
    const parts = subPath.split("/");
    const token = parts[1];
    const milestoneId = parts[2];
    return handleDeleteMilestone(req, token, milestoneId);
  }

  // Route: POST /admin/milestones/:token/:milestoneId/notes
  if (subPath.match(/^milestones\/[^\/]+\/[^\/]+\/notes$/) && req.method === "POST") {
    const parts = subPath.split("/");
    const token = parts[1];
    const milestoneId = parts[2];
    return handleAddMilestoneNote(req, token, milestoneId);
  }

  // Route: POST /admin/projects/:token/request-info
  if (subPath.match(/^projects\/[^\/]+\/request-info$/) && req.method === "POST") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handleRequestInfo(req, token);
  }

  // Route: DELETE /admin/projects/:token/request-info (clear request)
  if (subPath.match(/^projects\/[^\/]+\/request-info$/) && req.method === "DELETE") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handleClearRequestInfo(req, token);
  }

  // Route: GET /admin/discovery/:token
  if (subPath.match(/^discovery\/[^\/]+$/) && req.method === "GET") {
    const token = subPath.replace("discovery/", "");
    return handleGetDiscovery(req, token);
  }

  // Route: POST /admin/discovery/:token/seed
  if (subPath.match(/^discovery\/[^\/]+\/seed$/) && req.method === "POST") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handleSeedDiscovery(req, token);
  }

  // Route: PATCH /admin/discovery/:token/:key
  if (subPath.match(/^discovery\/[^\/]+\/[^\/]+$/) && req.method === "PATCH") {
    const parts = subPath.split("/");
    const token = parts[1];
    const key = parts[2];
    return handleToggleDiscoveryItem(req, token, key);
  }

  // Route: POST /admin/projects/:token/intake/approve
  if (subPath.match(/^projects\/[^\/]+\/intake\/approve$/) && req.method === "POST") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handleApproveIntakeByToken(req, token);
  }

  // Route: POST /admin/projects/:token/archive - Archive a project
  if (subPath.match(/^projects\/[^\/]+\/archive$/) && req.method === "POST") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handleArchiveProject(req, token);
  }

  // Route: POST /admin/projects/:token/unarchive - Unarchive a project
  if (subPath.match(/^projects\/[^\/]+\/unarchive$/) && req.method === "POST") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handleUnarchiveProject(req, token);
  }

  // Route: DELETE /admin/projects/:token/permanent - Permanently delete an archived project
  if (subPath.match(/^projects\/[^\/]+\/permanent$/) && req.method === "DELETE") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handlePermanentDeleteProject(req, token);
  }

  // Route: PATCH /admin/projects/:token/ai-status - Update AI receptionist status
  if (subPath.match(/^projects\/[^\/]+\/ai-status$/) && req.method === "PATCH") {
    const parts = subPath.split("/");
    const token = parts[1];
    return handleUpdateAIStatus(req, token);
  }

  // Route: POST /admin/bootstrap - Create first admin user (only works if no admins exist)
  if (subPath === "bootstrap" && req.method === "POST") {
    return handleBootstrap(req);
  }

  // Route: GET /admin/signed-url - Get signed URL for private bucket files
  if (subPath === "signed-url" && req.method === "GET") {
    return handleSignedUrl(req, url);
  }

  return new Response(
    JSON.stringify({ error: "Not found" }),
    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// Admin authentication context
interface AdminAuthContext {
  userId: string;
  email: string;
}

// Get Supabase client helper (service role for admin operations)
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Validate admin access via JWT and role check
async function validateAdminAuth(req: Request): Promise<{ error: Response | null; context: AdminAuthContext | null }> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("Missing or invalid Authorization header");
    return {
      error: new Response(
        JSON.stringify({ error: "Unauthorized", message: "Missing authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
      context: null
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  
  // Create client with user's auth header to validate JWT
  const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabaseWithAuth.auth.getClaims(token);

  if (claimsError || !claimsData?.claims) {
    console.log("Invalid JWT token:", claimsError?.message);
    return {
      error: new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
      context: null
    };
  }

  const userId = claimsData.claims.sub as string;
  const email = claimsData.claims.email as string || "unknown";

  // Check if user has admin role using service client
  const supabase = getSupabaseClient();
  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) {
    console.error("Role check error:", roleError);
    return {
      error: new Response(
        JSON.stringify({ error: "Server error", message: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
      context: null
    };
  }

  if (!roleData) {
    console.log(`User ${userId} (${email}) attempted admin access without admin role`);
    return {
      error: new Response(
        JSON.stringify({ error: "Forbidden", message: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
      context: null
    };
  }

  console.log(`Admin authenticated: ${email} (${userId})`);
  return { error: null, context: { userId, email } };
}

// Backward-compatible wrapper - returns Response | null like old validateAdminKey
async function validateAdminKey(req: Request): Promise<Response | null> {
  const { error } = await validateAdminAuth(req);
  return error;
}

// Log admin action for audit trail
async function logAdminAction(
  context: AdminAuthContext,
  action: string,
  resourceType?: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.from("admin_audit_log").insert({
      user_id: context.userId,
      user_email: context.email,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: metadata || {},
      ip_address: ipAddress,
    });
  } catch (err) {
    console.error("Failed to log admin action:", err);
    // Don't fail the request if audit logging fails
  }
}

// GET /admin/inbox - List projects with last message and unread count using RPC
async function handleInbox(req: Request): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  try {
    console.log("Fetching admin inbox via RPC...");

    const supabase = getSupabaseClient();

    // Use the efficient RPC function
    const { data: inboxData, error: rpcError } = await supabase.rpc("admin_inbox_v1");

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform to expected format
    const inbox = (inboxData || []).map((row: {
      project_token: string;
      business_name: string;
      status: string;
      last_message_content: string | null;
      last_message_sender_type: string | null;
      last_message_created_at: string | null;
      unread_count: number;
    }) => ({
      project_token: row.project_token,
      business_name: row.business_name,
      status: row.status,
      last_message: row.last_message_content ? {
        content: row.last_message_content,
        sender_type: row.last_message_sender_type,
        created_at: row.last_message_created_at,
      } : null,
      unread_count: Number(row.unread_count) || 0,
    }));

    console.log(`Inbox fetched: ${inbox.length} projects`);

    return new Response(
      JSON.stringify(inbox),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Inbox error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/messages/reply
async function handleMessagesReply(req: Request): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  try {
    // Parse request body
    let body: { project_token?: string; content?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { project_token, content } = body;

    if (!project_token || !isValidToken(project_token)) {
      return new Response(
        JSON.stringify({ error: "Valid project_token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedContent = content?.trim();
    if (!trimmedContent || trimmedContent.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message content required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (trimmedContent.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Message too long (max 5000 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin reply for token: ${project_token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Resolve project by token
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, project_token")
      .eq("project_token", project_token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError) {
      console.error("Project query error:", projectError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!project) {
      console.log("Project not found for token");
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert admin message - include id in response
    const { data: message, error: insertError } = await supabase
      .from("messages")
      .insert({
        project_id: project.id,
        project_token: project.project_token,
        sender_type: "admin",
        content: trimmedContent,
      })
      .select("id, sender_type, content, created_at, read_at")
      .single();

    if (insertError) {
      console.error("Message insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to send message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin message sent successfully");

    return new Response(
      JSON.stringify({
        ok: true,
        message: {
          id: message.id,
          sender_type: message.sender_type,
          content: message.content,
          created_at: message.created_at,
          read_at: message.read_at,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/messages/mark-read - Mark client messages as read
async function handleMarkRead(req: Request): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  try {
    let body: { project_token?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { project_token } = body;

    if (!project_token || !isValidToken(project_token)) {
      return new Response(
        JSON.stringify({ error: "Valid project_token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Marking messages as read for token: ${project_token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Resolve project by token
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", project_token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError) {
      console.error("Project query error:", projectError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update all unread client messages
    const { data: updated, error: updateError } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("project_id", project.id)
      .eq("sender_type", "client")
      .is("read_at", null)
      .select("id");

    if (updateError) {
      console.error("Mark read error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to mark messages as read" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markedCount = updated?.length || 0;
    console.log(`Marked ${markedCount} messages as read`);

    return new Response(
      JSON.stringify({ ok: true, marked_count: markedCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Mark read error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /admin/notes/:token - Get notes for a project
async function handleGetNotes(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Fetching notes for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch notes from operator_notes table
    const { data: notes, error: notesError } = await supabase
      .from("operator_notes")
      .select("id, content, created_by, created_at")
      .eq("project_id", project.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (notesError) {
      console.error("Notes fetch error:", notesError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ notes: notes || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Get notes error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/notes/:token - Create a note
async function handleCreateNote(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    let body: { content?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = body.content?.trim();
    if (!content || content.length === 0) {
      return new Response(
        JSON.stringify({ error: "Content required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (content.length > 10000) {
      return new Response(
        JSON.stringify({ error: "Content too long (max 10000 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating note for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, project_token")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert note into operator_notes table
    const { data: note, error: insertError } = await supabase
      .from("operator_notes")
      .insert({
        project_id: project.id,
        project_token: project.project_token,
        content: content,
      })
      .select("id, content, created_at")
      .single();

    if (insertError) {
      console.error("Note insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create note" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Note created successfully");

    return new Response(
      JSON.stringify({ ok: true, note }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Create note error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// PATCH /admin/notes/:token/:noteId - Update a note
async function handleUpdateNote(req: Request, token: string, noteId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    let body: { content?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = body.content?.trim();
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await supabase
      .from("operator_notes")
      .update({ content })
      .eq("id", noteId)
      .eq("project_id", project.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update note" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Update note error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// DELETE /admin/notes/:token/:noteId - Soft delete a note
async function handleDeleteNote(req: Request, token: string, noteId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Deleting note ${noteId} for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Soft delete note from operator_notes
    const { error: deleteError } = await supabase
      .from("operator_notes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", noteId)
      .eq("project_id", project.id)
      .is("deleted_at", null);

    if (deleteError) {
      console.error("Note delete error:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete note" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Note deleted successfully");

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Delete note error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /admin/checklist/:token - Get checklist items for a project
async function handleGetChecklist(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Fetching checklist for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: items, error: itemsError } = await supabase
      .from("project_checklist_items")
      .select("id, label, is_done, sort_order, created_at, completed_at")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      console.error("Checklist fetch error:", itemsError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ items: items || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Get checklist error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/checklist/:token - Create a checklist item
async function handleCreateChecklistItem(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    let body: { label?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const label = body.label?.trim();
    if (!label) {
      return new Response(
        JSON.stringify({ error: "Label required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating checklist item for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, project_token")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get max sort_order
    const { data: maxItem } = await supabase
      .from("project_checklist_items")
      .select("sort_order")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxItem?.sort_order ?? -1) + 1;

    const { data: item, error: insertError } = await supabase
      .from("project_checklist_items")
      .insert({
        project_id: project.id,
        project_token: project.project_token,
        label,
        sort_order: nextOrder,
      })
      .select("id, label, is_done, sort_order, created_at")
      .single();

    if (insertError) {
      console.error("Checklist insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create item" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, item }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Create checklist error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// PATCH /admin/checklist/:token/:itemId - Update a checklist item
async function handleUpdateChecklistItem(req: Request, token: string, itemId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    let body: { label?: string; is_done?: boolean };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updating checklist item ${itemId} for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updates: Record<string, unknown> = {};
    if (body.label !== undefined) updates.label = body.label.trim();
    if (body.is_done !== undefined) {
      updates.is_done = body.is_done;
      updates.completed_at = body.is_done ? new Date().toISOString() : null;
    }

    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ error: "No updates provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: item, error: updateError } = await supabase
      .from("project_checklist_items")
      .update(updates)
      .eq("id", itemId)
      .eq("project_id", project.id)
      .select("id, label, is_done, sort_order, created_at, completed_at")
      .single();

    if (updateError) {
      console.error("Checklist update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update item" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, item }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Update checklist error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// DELETE /admin/checklist/:token/:itemId - Delete a checklist item
async function handleDeleteChecklistItem(req: Request, token: string, itemId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Deleting checklist item ${itemId} for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: deleteError } = await supabase
      .from("project_checklist_items")
      .delete()
      .eq("id", itemId)
      .eq("project_id", project.id);

    if (deleteError) {
      console.error("Checklist delete error:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete item" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Delete checklist error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/checklist/:token/defaults - Add default checklist items
async function handleAddDefaultChecklist(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Adding default checklist for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, project_token")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const defaultItems = [
      "Intake received",
      "Confirm domain access",
      "Confirm primary CTA + routing",
      "Collect logo + brand colors",
      "Homepage draft",
      "\"What We Build\" confirmed",
      "Portal onboarding tested",
      "Messaging widget tested",
      "Mobile QA",
      "Publish + DNS cutover",
    ];

    // Get max sort_order
    const { data: maxItem } = await supabase
      .from("project_checklist_items")
      .select("sort_order")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextOrder = (maxItem?.sort_order ?? -1) + 1;

    const itemsToInsert = defaultItems.map((label) => ({
      project_id: project.id,
      project_token: project.project_token,
      label,
      sort_order: nextOrder++,
    }));

    const { data: items, error: insertError } = await supabase
      .from("project_checklist_items")
      .insert(itemsToInsert)
      .select("id, label, is_done, sort_order, created_at");

    if (insertError) {
      console.error("Default checklist insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to add defaults" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, items }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Add default checklist error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /admin/projects - List all projects with intake data
async function handleProjects(req: Request): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  try {
    // Check for includeArchived query param
    const url = new URL(req.url);
    const includeArchived = url.searchParams.get("includeArchived") === "true";
    
    console.log(`Fetching projects for operator (includeArchived: ${includeArchived})...`);

    const supabase = getSupabaseClient();

    // First, get all demo project IDs from leads table to exclude them
    const { data: demoLeads } = await supabase
      .from("leads")
      .select("demo_project_id")
      .not("demo_project_id", "is", null);
    
    const demoProjectIds = (demoLeads || [])
      .map((l: { demo_project_id: string | null }) => l.demo_project_id)
      .filter((id): id is string => id !== null);

    // Build query - conditionally filter archived
    // Exclude lead_engine_bulk projects (those are demo/outreach projects)
    let query = supabase
      .from("projects")
      .select(`
        id,
        business_name,
        business_slug,
        project_token,
        status,
        pipeline_stage,
        service_type,
        source_demo_token,
        contact_name,
        contact_phone,
        contact_email,
        address,
        city,
        state,
        zip,
        source,
        notes,
        owner_user_id,
        created_at,
        updated_at,
        deleted_at
      `)
      .neq("source", "lead_engine_bulk")
      .order("created_at", { ascending: false });
    
    // Only filter out archived if not including them
    if (!includeArchived) {
      query = query.is("deleted_at", null);
    }

    const { data: allProjects, error: projectsError } = await query;

    if (projectsError) {
      console.error("Projects fetch error:", projectsError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter out demo projects (those linked to leads)
    const projects = (allProjects || []).filter(
      (p: { id: string }) => !demoProjectIds.includes(p.id)
    );

    // Fetch intake data for all projects
    const projectIds = (projects || []).map((p: { id: string }) => p.id);
    let intakesMap: Record<string, unknown> = {};
    let unreadCountsMap: Record<string, number> = {};
    let quoteCountsMap: Record<string, number> = {};
    let hasClaimMap: Record<string, boolean> = {};
    
    if (projectIds.length > 0) {
      // Fetch intakes (including Phase B data)
      const { data: intakes, error: intakesError } = await supabase
        .from("project_intakes")
        .select("id, project_id, intake_json, intake_version, intake_status, phase_b_json, phase_b_status, phase_b_completed_at, created_at, updated_at")
        .in("project_id", projectIds);

      if (intakesError) {
        console.error("Intakes fetch error:", intakesError);
      } else {
        intakesMap = (intakes || []).reduce((acc: Record<string, unknown>, intake) => {
          acc[intake.project_id] = intake;
          return acc;
        }, {});
      }

      // Fetch all client messages to count unread and quote requests
      const { data: clientMessages, error: messagesError } = await supabase
        .from("messages")
        .select("project_id, content, read_at")
        .in("project_id", projectIds)
        .eq("sender_type", "client");

      if (messagesError) {
        console.error("Messages fetch error:", messagesError);
      } else {
        // Count unread messages and quote requests per project
        (clientMessages || []).forEach(msg => {
          // Unread count
          if (!msg.read_at) {
            unreadCountsMap[msg.project_id] = (unreadCountsMap[msg.project_id] || 0) + 1;
          }
          // Quote request count (tagged with [QUOTE_REQUEST] marker)
          if (msg.content?.includes("[QUOTE_REQUEST]")) {
            quoteCountsMap[msg.project_id] = (quoteCountsMap[msg.project_id] || 0) + 1;
          }
        });
      }

      // Check for design claims by looking for lead outreach events with "claimed" status
      const { data: claimEvents } = await supabase
        .from("lead_outreach_events")
        .select("lead_id, status, leads!inner(demo_project_id)")
        .eq("status", "claimed");
      
      if (claimEvents) {
        claimEvents.forEach((event) => {
          // leads is an array from the join, get the first one
          const leadData = event.leads as unknown as { demo_project_id: string }[];
          if (Array.isArray(leadData) && leadData[0]?.demo_project_id) {
            hasClaimMap[leadData[0].demo_project_id] = true;
          }
        });
      }
    }

    // Combine projects with their intakes, unread counts, and inquiry data
    const projectsWithIntakes = (projects || []).map((project: { id: string; status: string; deleted_at: string | null }) => ({
      ...project,
      intake: intakesMap[project.id] || null,
      unread_count: unreadCountsMap[project.id] || 0,
      quote_count: quoteCountsMap[project.id] || 0,
      has_claim: hasClaimMap[project.id] || project.status === "interested" || project.status === "client",
      is_archived: !!project.deleted_at,
    }));

    console.log(`Projects fetched: ${projectsWithIntakes.length}`);

    return new Response(
      JSON.stringify({ projects: projectsWithIntakes }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Projects fetch error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// PATCH /admin/projects/:token/status - Update project status
async function handleUpdateProjectStatus(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token format" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { status } = body;

    const validStatuses = ["lead", "contacted", "interested", "client", "completed", "archived"];
    if (!status || !validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status value" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updating project ${token} status to: ${status}`);

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("projects")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("project_token", token)
      .is("deleted_at", null)
      .select("id, project_token, status")
      .single();

    if (error) {
      console.error("Status update error:", error);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Project ${token} status updated to ${status}`);

    return new Response(
      JSON.stringify({ success: true, project: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Status update error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// PATCH /admin/projects/:token/stage - Update pipeline stage with audit trail
async function handleUpdatePipelineStage(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token format" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { stage } = body;

    // Pipeline stages matching StageBadge.tsx: new, discovery, build, preview, revisions, launch, live, closed
    const validStages = ["new", "discovery", "build", "preview", "revisions", "launch", "live", "closed"];
    if (!stage || !validStages.includes(stage)) {
      return new Response(
        JSON.stringify({ error: "Invalid stage value", validStages }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updating project ${token} pipeline_stage to: ${stage}`);

    const supabase = getSupabaseClient();

    // First get current stage and project info for audit message + notification
    const { data: currentProject, error: fetchError } = await supabase
      .from("projects")
      .select("id, project_token, pipeline_stage, business_name, contact_name, contact_phone, contact_email")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError || !currentProject) {
      console.error("Project fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const previousStage = currentProject.pipeline_stage || "new";

    // Don't update if same stage
    if (previousStage === stage) {
      return new Response(
        JSON.stringify({ success: true, project: currentProject, message: "No change" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the pipeline stage
    const { data, error } = await supabase
      .from("projects")
      .update({ pipeline_stage: stage, updated_at: new Date().toISOString() })
      .eq("project_token", token)
      .is("deleted_at", null)
      .select("id, project_token, pipeline_stage")
      .single();

    if (error) {
      console.error("Stage update error:", error);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert audit message for stage change
    const stageLabels: Record<string, string> = {
      new: "New",
      discovery: "Discovery",
      build: "Build",
      preview: "Preview",
      revisions: "Revisions",
      launch: "Launch",
      live: "Live",
      closed: "Closed",
    };

    const auditContent = `[SYSTEM] Pipeline stage changed: ${stageLabels[previousStage] || previousStage} → ${stageLabels[stage] || stage}`;

    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        project_id: currentProject.id,
        project_token: currentProject.project_token,
        sender_type: "system",
        content: auditContent,
      });

    if (messageError) {
      console.error("Audit message insert error:", messageError);
      // Don't fail the request, just log
    }

    console.log(`Project ${token} pipeline_stage updated: ${previousStage} → ${stage}`);

    // Send Telegram notification for high-signal stages only
    const notifyStages = ["launch", "live", "closed"];
    if (notifyStages.includes(stage)) {
      const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");
      const baseUrl = Deno.env.get("PUBLIC_BASE_URL") || "https://pleasantcovedesign.com";

      // Build contact info string
      const contactParts: string[] = [];
      if (currentProject.contact_name) contactParts.push(currentProject.contact_name);
      if (currentProject.contact_phone) contactParts.push(currentProject.contact_phone);
      if (currentProject.contact_email) contactParts.push(currentProject.contact_email);
      const contactInfo = contactParts.length > 0 ? contactParts.join(" • ") : "No contact info";

      // Build notification message (plain text - Telegram auto-linkifies)
      const stageEmoji = stage === "live" ? "🎉" : stage === "closed" ? "❌" : stage === "launch" ? "🚀" : "📋";
      const telegramText = 
        `${stageEmoji} Stage: ${stageLabels[previousStage] || previousStage} → ${stageLabels[stage] || stage}\n\n` +
        `Business: ${currentProject.business_name || "Unknown"}\n` +
        `Contact: ${contactInfo}`;

      // Build URLs for inline keyboard buttons (URL-encode token for safety)
      const t = encodeURIComponent(currentProject.project_token);
      const operatorUrl = `${baseUrl}/operator?project=${t}`;
      const portalUrl = `${baseUrl}/p/${t}`;

      // Prepare audit payload
      const notificationPayload = {
        channel: "telegram",
        stage_from: previousStage,
        stage_to: stage,
        business_name: currentProject.business_name,
        contact_info: contactInfo,
        operator_url: operatorUrl,
        portal_url: portalUrl,
      };

      let notificationStatus = "sent";
      let notificationError: string | null = null;

      if (telegramBotToken && telegramChatId) {
        try {
          const res = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: telegramText,
              disable_web_page_preview: true,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "Open Operator", url: operatorUrl },
                    { text: "View Portal", url: portalUrl },
                  ],
                ],
              },
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            console.error("Telegram sendMessage failed:", res.status, errText);
            notificationStatus = "failed";
            notificationError = `${res.status}: ${errText.slice(0, 200)}`;
          } else {
            console.log(`Telegram notification sent for stage change: ${stage}`);
          }
        } catch (telegramError) {
          console.error("Telegram notification error:", telegramError);
          notificationStatus = "failed";
          notificationError = telegramError instanceof Error ? telegramError.message : String(telegramError);
        }
      } else {
        notificationStatus = "skipped";
        notificationError = "Telegram credentials not configured";
        console.warn("Telegram notification skipped: missing credentials");
      }

      // Insert notification audit log
      try {
        await supabase.from("notification_events").insert({
          project_id: currentProject.id,
          project_token: currentProject.project_token,
          event_type: `pipeline_stage_${notificationStatus}`,
          payload: {
            ...notificationPayload,
            status: notificationStatus,
            error: notificationError,
          },
          sent_at: notificationStatus === "sent" ? new Date().toISOString() : null,
        });
      } catch (auditError) {
        console.error("Notification audit log error:", auditError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, project: data, previous_stage: previousStage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Stage update error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// PATCH /admin/projects/:token/portal-stage - Update portal stage (client-facing workflow)
async function handleUpdatePortalStage(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token format" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { stage, reason } = body;

    const validStages = ["intake", "build", "preview", "revisions", "final", "launched"];
    if (!stage || !validStages.includes(stage)) {
      return new Response(
        JSON.stringify({ error: "Invalid stage. Must be: intake, build, preview, revisions, final, or launched" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updating project ${token} portal_stage to: ${stage}`);

    const supabase = getSupabaseClient();

    // Get current project info
    const { data: currentProject, error: fetchError } = await supabase
      .from("projects")
      .select("id, project_token, portal_stage, business_name")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError || !currentProject) {
      console.error("Project fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const previousStage = currentProject.portal_stage || "intake";

    // Don't update if same stage
    if (previousStage === stage) {
      return new Response(
        JSON.stringify({ success: true, project: currentProject, message: "No change" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the portal stage
    const { data, error } = await supabase
      .from("projects")
      .update({ 
        portal_stage: stage, 
        portal_stage_changed_at: new Date().toISOString(),
        portal_stage_changed_by: "operator",
        updated_at: new Date().toISOString() 
      })
      .eq("project_token", token)
      .is("deleted_at", null)
      .select("id, project_token, portal_stage, portal_stage_changed_at")
      .single();

    if (error) {
      console.error("Portal stage update error:", error);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert audit message for stage change
    const stageLabels: Record<string, string> = {
      intake: "Intake",
      build: "Build",
      preview: "First Preview",
      revisions: "Revisions",
      final: "Final Approval",
      launched: "Launched",
    };

    let auditContent = `[SYSTEM] Portal stage: ${stageLabels[previousStage] || previousStage} → ${stageLabels[stage] || stage}`;
    if (reason) {
      auditContent += ` | Reason: ${reason}`;
    }

    await supabase.from("messages").insert({
      project_id: currentProject.id,
      project_token: currentProject.project_token,
      sender_type: "system",
      content: auditContent,
    });

    console.log(`Project ${token} portal_stage updated: ${previousStage} → ${stage}`);

    return new Response(
      JSON.stringify({ success: true, project: data, previous_stage: previousStage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Portal stage update error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/projects/:token/nudge - Send reminder to client
async function handleNudge(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token format" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Sending nudge to project: ${token}`);

    // Parse channels from request body
    let channels: string[] = ["portal"];
    try {
      const body = await req.json();
      if (Array.isArray(body.channels)) {
        channels = body.channels;
      }
    } catch {
      // Default to portal only
    }

    const wantsPortal = channels.includes("portal");
    const wantsEmail = channels.includes("email");

    const supabase = getSupabaseClient();

    // Get project info
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, project_token, business_name, contact_name, contact_email")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      console.error("Project fetch error:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Phase B progress to customize message
    const { data: intake } = await supabase
      .from("project_intakes")
      .select("phase_b_json, phase_b_status")
      .eq("project_id", project.id)
      .maybeSingle();

    // Calculate what's missing
    const phaseBData = intake?.phase_b_json as Record<string, unknown> | null;
    const missing: string[] = [];
    
    if (phaseBData) {
      if (phaseBData.logoStatus !== "uploaded" && phaseBData.logoStatus !== "create") missing.push("logo");
      if (!phaseBData.tone) missing.push("brand tone");
      if ((phaseBData.photosUploaded as number || 0) < 3) missing.push("3+ photos");
      if (!(phaseBData.pages as string[])?.length) missing.push("pages");
      if (!phaseBData.primaryCta) missing.push("primary CTA");
      if (!(phaseBData.exampleSites as string)?.trim()) missing.push("inspiration sites");
    } else {
      missing.push("logo", "photos", "pages", "inspiration sites");
    }

    // Create friendly reminder message for portal
    let messageContent = "👋 Quick reminder: ";
    if (missing.length === 0) {
      messageContent += "Your project setup is almost complete! Please review and submit when ready so we can start your first draft.";
    } else if (missing.length <= 3) {
      messageContent += `We just need ${missing.join(", ")} to start building your first draft. You can complete this anytime in your project setup above.`;
    } else {
      messageContent += "Please complete your project setup above so we can start your first draft. It only takes about 10 minutes!";
    }

    const channelsSent: string[] = [];
    const baseUrl = Deno.env.get("PUBLIC_BASE_URL") || "https://pleasantcove.design";

    // Send portal message
    if (wantsPortal) {
      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          project_id: project.id,
          project_token: token,
          sender_type: "admin",
          content: messageContent,
        });

      if (messageError) {
        console.error("Message insert error:", messageError);
      } else {
        channelsSent.push("portal");
      }
    }

    // Send email if requested and email exists
    if (wantsEmail && project.contact_email) {
      const emailResult = await sendNudgeEmail({
        to: project.contact_email,
        contactName: project.contact_name,
        businessName: project.business_name,
        portalUrl: `${baseUrl}/p/${encodeURIComponent(token)}`,
        missing,
      });

      if (emailResult.success) {
        channelsSent.push("email");
        // Log email notification event
        await supabase.from("notification_events").insert({
          project_id: project.id,
          project_token: token,
          event_type: "nudge_email_sent",
          payload: {
            to: project.contact_email,
            business_name: project.business_name,
            missing_items: missing,
          },
          sent_at: new Date().toISOString(),
        });
      } else {
        console.error("Email send failed:", emailResult.error);
        // Log failed attempt
        await supabase.from("notification_events").insert({
          project_id: project.id,
          project_token: token,
          event_type: "nudge_email_failed",
          payload: {
            to: project.contact_email,
            error: emailResult.error,
          },
        });
      }
    } else if (wantsEmail && !project.contact_email) {
      console.log("Email requested but no email on file for project");
    }

    // Create notification event for audit trail
    await supabase.from("notification_events").insert({
      project_id: project.id,
      project_token: token,
      event_type: "nudge_sent",
      payload: {
        business_name: project.business_name,
        missing_items: missing,
        message: messageContent,
        channels_requested: channels,
        channels_sent: channelsSent,
      },
      sent_at: new Date().toISOString(),
    });

    // Send Telegram notification
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");

    if (telegramBotToken && telegramChatId) {
      const t = encodeURIComponent(token);
      const portalUrl = `${baseUrl}/p/${t}`;

      try {
        const res = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: `🔔 Nudge Sent\n\n• Business: ${project.business_name}\n• Channels: ${channelsSent.join(", ") || "none"}\n• Missing: ${missing.length > 0 ? missing.join(", ") : "Almost complete!"}\n• Contact: ${project.contact_name || "—"}`,
            reply_markup: {
              inline_keyboard: [[
                { text: "View Portal →", url: portalUrl },
              ]],
            },
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("Telegram sendMessage failed:", res.status, text);
        }
      } catch (e) {
        console.error("Telegram notification failed:", e);
      }
    }

    console.log(`Nudge sent for ${project.business_name} (${token.slice(0, 8)}...) via ${channelsSent.join(", ")}`);

    return new Response(
      JSON.stringify({ success: true, message: "Nudge sent", channels_sent: channelsSent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Nudge error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Helper to send nudge email via Resend
async function sendNudgeEmail({
  to,
  contactName,
  businessName,
  portalUrl,
  missing,
}: {
  to: string;
  contactName: string | null;
  businessName: string;
  portalUrl: string;
  missing: string[];
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM");

  if (!apiKey || !from) {
    return { success: false, error: "Missing RESEND_API_KEY or EMAIL_FROM" };
  }

  const greeting = contactName ? `Hi ${contactName}` : "Hi there";
  const missingList = missing.length > 0 && missing.length <= 3
    ? `We just need your <strong>${missing.join(", ")}</strong> to get started.`
    : missing.length > 3
    ? "We just need a few more details to finalize your setup."
    : "Your setup is almost complete!";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a; margin-bottom: 16px;">${greeting},</h2>
      
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
        Quick heads up — we're ready to start your first draft for <strong>${businessName}</strong>!
      </p>
      
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
        ${missingList}
      </p>
      
      <div style="margin: 24px 0;">
        <a href="${portalUrl}" 
           style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Open Your Setup Checklist →
        </a>
      </div>
      
      <p style="color: #6a6a6a; font-size: 14px; line-height: 1.6;">
        If you'd rather, just reply to this email with your logo and a few photos of your work — we'll handle the rest.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      
      <p style="color: #9a9a9a; font-size: 12px;">
        — Pleasant Cove Design
      </p>
    </div>
  `;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `Quick step to start your first draft — ${businessName}`,
        html,
      }),
    });

    const data = await resp.json().catch(() => ({}));
    
    if (!resp.ok) {
      console.error("Resend API error:", resp.status, data);
      return { success: false, error: `Resend error ${resp.status}: ${JSON.stringify(data)}` };
    }

    console.log("Email sent successfully:", data);
    return { success: true };
  } catch (e) {
    console.error("Email send exception:", e);
    return { success: false, error: String(e) };
  }
}

// PATCH /admin/intake/:intakeId/approve - Approve an intake
async function handleApproveIntake(req: Request, intakeId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!intakeId) {
    return new Response(
      JSON.stringify({ error: "Intake ID required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Approving intake: ${intakeId}`);

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("project_intakes")
      .update({ intake_status: 'approved', updated_at: new Date().toISOString() })
      .eq("id", intakeId)
      .select("id, project_id, intake_status")
      .single();

    if (error) {
      console.error("Intake approval error:", error);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Intake not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get project info for notification
    const { data: project } = await supabase
      .from("projects")
      .select("id, project_token, business_name")
      .eq("id", data.project_id)
      .maybeSingle();

    // Create notification event for intake_approved email
    if (project) {
      await supabase.from("notification_events").insert({
        project_id: project.id,
        project_token: project.project_token,
        event_type: "intake_approved",
        payload: { business_name: project.business_name },
      });
    }

    console.log(`Intake ${intakeId} approved`);

    return new Response(
      JSON.stringify({ success: true, intake: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Intake approval error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}


async function handleGetPrototypes(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Fetching prototypes for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch prototypes
    const { data: prototypes, error: prototypesError } = await supabase
      .from("prototypes")
      .select("id, url, version_label, status, created_at, updated_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (prototypesError) {
      console.error("Prototypes fetch error:", prototypesError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ prototypes: prototypes || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Get prototypes error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/prototypes/:token - Create a prototype
async function handleCreatePrototype(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    let body: { url?: string; version_label?: string; status?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = body.url?.trim();
    if (!url || url.length === 0) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating prototype for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create prototype
    const { data: prototype, error: insertError } = await supabase
      .from("prototypes")
      .insert({
        project_id: project.id,
        project_token: token,
        url,
        version_label: body.version_label?.trim() || null,
        status: body.status || "draft",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Prototype insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create prototype" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification event for prototype_added email
    await supabase.from("notification_events").insert({
      project_id: project.id,
      project_token: token,
      event_type: "prototype_added",
      payload: { url, version_label: body.version_label || null },
    });

    console.log("Prototype created successfully");

    return new Response(
      JSON.stringify({ ok: true, prototype }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Create prototype error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// PATCH /admin/prototypes/:token/:prototypeId - Update a prototype
async function handleUpdatePrototype(req: Request, token: string, prototypeId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    let body: { url?: string; version_label?: string; status?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updating prototype ${prototypeId} for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Build update object
    const updates: Record<string, string | null> = {};
    if (body.url !== undefined) updates.url = body.url.trim();
    if (body.version_label !== undefined) updates.version_label = body.version_label?.trim() || null;
    if (body.status !== undefined) updates.status = body.status;

    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ error: "No fields to update" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update prototype
    const { data: prototype, error: updateError } = await supabase
      .from("prototypes")
      .update(updates)
      .eq("id", prototypeId)
      .eq("project_token", token)
      .select()
      .single();

    if (updateError) {
      console.error("Prototype update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update prototype" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Prototype updated successfully");

    return new Response(
      JSON.stringify({ ok: true, prototype }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Update prototype error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// DELETE /admin/prototypes/:token/:prototypeId - Delete a prototype
async function handleDeletePrototype(req: Request, token: string, prototypeId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Deleting prototype ${prototypeId} for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    const { error: deleteError } = await supabase
      .from("prototypes")
      .delete()
      .eq("id", prototypeId)
      .eq("project_token", token);

    if (deleteError) {
      console.error("Prototype delete error:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete prototype" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Prototype deleted successfully");

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Delete prototype error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /admin/comments/:token - Get comments for a project
async function handleGetComments(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Fetching comments for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    const { data: comments, error } = await supabase
      .from("prototype_comments")
      .select("*")
      .eq("project_token", token)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Comments fetch error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch comments" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ comments: comments || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Get comments error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/comments/:token - Create a comment (for "Turn into comment" feature)
async function handleCreateComment(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    let body: { 
      prototype_id: string; 
      body: string; 
      pin_x?: number; 
      pin_y?: number; 
      source_message_id?: string;
      parent_comment_id?: string;
      is_internal?: boolean;
    };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.prototype_id || !body.body) {
      return new Response(
        JSON.stringify({ error: "prototype_id and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating comment for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    const { data: comment, error: insertError } = await supabase
      .from("prototype_comments")
      .insert({
        prototype_id: body.prototype_id,
        project_token: token,
        author_type: "admin",
        body: body.body,
        pin_x: body.pin_x ?? null,
        pin_y: body.pin_y ?? null,
        source_message_id: body.source_message_id || null,
        parent_comment_id: body.parent_comment_id || null,
        is_internal: body.is_internal ?? false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Comment insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create comment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Comment created successfully");

    return new Response(
      JSON.stringify({ ok: true, comment }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Create comment error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// PATCH /admin/comments/:token/:commentId - Update a comment (resolve/unresolve)
async function handleUpdateComment(req: Request, token: string, commentId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    let body: { resolved?: boolean; status?: string; resolution_note?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updating comment ${commentId} for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {};
    
    // Handle legacy resolved boolean
    if (typeof body.resolved === "boolean") {
      updateData.resolved_at = body.resolved ? new Date().toISOString() : null;
      updateData.status = body.resolved ? "resolved" : "open";
      updateData.resolved_by = body.resolved ? "Operator" : null;
      if (!body.resolved) {
        updateData.resolution_note = null;
      }
    }
    
    // Handle new status workflow
    if (body.status) {
      const validStatuses = ["open", "in_progress", "resolved", "wont_do"];
      if (validStatuses.includes(body.status)) {
        updateData.status = body.status;
        
        // Set resolved_at when status changes to resolved or wont_do
        if (body.status === "resolved" || body.status === "wont_do") {
          updateData.resolved_at = new Date().toISOString();
          updateData.resolved_by = "Operator";
        } else if (body.status === "open" || body.status === "in_progress") {
          // Clear resolved fields when reopening or setting to in_progress
          updateData.resolved_at = null;
          updateData.resolved_by = null;
          updateData.resolution_note = null;
        }
      }
    }
    
    // Handle resolution note
    if (body.resolution_note !== undefined) {
      updateData.resolution_note = body.resolution_note;
    }

    const { data: comment, error: updateError } = await supabase
      .from("prototype_comments")
      .update(updateData)
      .eq("id", commentId)
      .eq("project_token", token)
      .select()
      .single();

    if (updateError) {
      console.error("Comment update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update comment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Comment updated successfully");

    return new Response(
      JSON.stringify({ ok: true, comment }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Update comment error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /admin/media/:token - List media for a project
async function handleGetMedia(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Fetching media for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch media items from project_media table
    const { data: media, error: mediaError } = await supabase
      .from("project_media")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (mediaError) {
      console.error("Media fetch error:", mediaError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch media" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also fetch files from files table (intake uploads)
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (filesError) {
      console.error("Files fetch error:", filesError);
      // Don't fail, just log - files table may not have data
    }

    // Generate signed URLs for each media item from project_media
    const mediaWithUrls = await Promise.all((media || []).map(async (item) => {
      const { data: signedData } = await supabase.storage
        .from("project-media")
        .createSignedUrl(item.storage_path, 3600); // 1 hour expiry

      return {
        ...item,
        signed_url: signedData?.signedUrl || null,
        source: "media" as const,
      };
    }));

    // Generate signed URLs for files from files table (stored in project-files bucket)
    const filesWithUrls = await Promise.all((files || []).map(async (file) => {
      // storage_path format is "project-files/token/timestamp-random-filename"
      // We need just "token/timestamp-random-filename" for the bucket
      const pathInBucket = file.storage_path.replace("project-files/", "");
      
      const { data: signedData } = await supabase.storage
        .from("project-files")
        .createSignedUrl(pathInBucket, 3600); // 1 hour expiry

      return {
        id: file.id,
        project_id: file.project_id,
        project_token: file.project_token,
        filename: file.file_name,
        mime_type: file.file_type,
        storage_path: file.storage_path,
        size_bytes: 0, // files table doesn't store size, we could add it later
        created_at: file.created_at,
        uploader_type: "client",
        description: file.description,
        signed_url: signedData?.signedUrl || null,
        source: "intake" as const,
      };
    }));

    // Combine both sources and sort by created_at
    const allMedia = [...mediaWithUrls, ...filesWithUrls].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log(`Found ${mediaWithUrls.length} media + ${filesWithUrls.length} intake files for project ${token.slice(0, 8)}...`);

    return new Response(
      JSON.stringify({ media: allMedia }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Get media error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/media/:token - Create a media record after upload
async function handleCreateMedia(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient();

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check content type for file upload
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      
      if (!file) {
        return new Response(
          JSON.stringify({ error: "No file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const filename = file.name;
      const mimeType = file.type || "application/octet-stream";
      const sizeBytes = file.size;

      // Generate storage path
      const storagePath = `${token}/${Date.now()}-${filename}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("project-media")
        .upload(storagePath, file, { contentType: mimeType });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return new Response(
          JSON.stringify({ error: "Failed to upload file" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create media record
      const { data: mediaRecord, error: insertError } = await supabase
        .from("project_media")
        .insert({
          project_token: token,
          project_id: project.id,
          uploader_type: "admin",
          storage_path: storagePath,
          filename,
          mime_type: mimeType,
          size_bytes: sizeBytes,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Media record insert error:", insertError);
        // Try to clean up the uploaded file
        await supabase.storage.from("project-media").remove([storagePath]);
        return new Response(
          JSON.stringify({ error: "Failed to create media record" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate signed URL
      const { data: signedData } = await supabase.storage
        .from("project-media")
        .createSignedUrl(storagePath, 3600);

      console.log("Media uploaded successfully");

      return new Response(
        JSON.stringify({ 
          ok: true, 
          media: { ...mediaRecord, signed_url: signedData?.signedUrl || null } 
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Handle JSON body (record creation only)
      let body: { storage_path: string; filename: string; mime_type: string; size_bytes: number };
      try {
        body = await req.json();
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid JSON body" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!body.storage_path || !body.filename || !body.mime_type) {
        return new Response(
          JSON.stringify({ error: "storage_path, filename, and mime_type are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: mediaRecord, error: insertError } = await supabase
        .from("project_media")
        .insert({
          project_token: token,
          project_id: project.id,
          uploader_type: "admin",
          storage_path: body.storage_path,
          filename: body.filename,
          mime_type: body.mime_type,
          size_bytes: body.size_bytes || 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Media record insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create media record" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, media: mediaRecord }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Create media error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// DELETE /admin/media/:token/:mediaId - Delete a media item
async function handleDeleteMedia(req: Request, token: string, mediaId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Deleting media ${mediaId} for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Get the media record first to get storage path
    const { data: media, error: fetchError } = await supabase
      .from("project_media")
      .select("storage_path")
      .eq("id", mediaId)
      .eq("project_token", token)
      .single();

    if (fetchError || !media) {
      return new Response(
        JSON.stringify({ error: "Media not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("project-media")
      .remove([media.storage_path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      // Continue to delete record anyway
    }

    // Delete record
    const { error: deleteError } = await supabase
      .from("project_media")
      .delete()
      .eq("id", mediaId)
      .eq("project_token", token);

    if (deleteError) {
      console.error("Media delete error:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete media" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Media deleted successfully");

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Delete media error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /admin/comments/:token/:commentId/attachments - Get attachments for a comment
async function handleGetCommentAttachments(req: Request, token: string, commentId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Fetching attachments for comment ${commentId}...`);

    const supabase = getSupabaseClient();

    // Verify comment belongs to project and get screenshot_path if exists
    const { data: comment, error: commentError } = await supabase
      .from("prototype_comments")
      .select("id, prototype_id, screenshot_path, screenshot_media_id, created_at")
      .eq("id", commentId)
      .eq("project_token", token)
      .maybeSingle();

    if (commentError || !comment) {
      return new Response(
        JSON.stringify({ error: "Comment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch attachments from prototype_comment_media
    const { data: attachments, error } = await supabase
      .from("prototype_comment_media")
      .select("id, filename, mime_type, size_bytes, uploader_type, created_at, storage_path")
      .eq("comment_id", commentId)
      .eq("project_token", token)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Get attachments error:", error);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate signed URLs for attachments
    const attachmentsWithUrls = await Promise.all((attachments || []).map(async (item) => {
      const { data: signedData } = await supabase.storage
        .from("project-media")
        .createSignedUrl(item.storage_path, 3600);

      return {
        id: item.id,
        filename: item.filename,
        mime_type: item.mime_type,
        size_bytes: item.size_bytes,
        uploader_type: item.uploader_type,
        created_at: item.created_at,
        signed_url: signedData?.signedUrl || null,
      };
    }));

    // Also include the legacy screenshot_path as an attachment if it exists
    // and there's no screenshot_media_id (meaning it's not already in prototype_comment_media)
    if (comment.screenshot_path && !comment.screenshot_media_id) {
      const { data: screenshotSignedData } = await supabase.storage
        .from("project-media")
        .createSignedUrl(comment.screenshot_path, 3600);
      
      // Extract filename from path
      const pathParts = comment.screenshot_path.split("/");
      const filename = pathParts[pathParts.length - 1] || "screenshot.png";
      
      // Add screenshot as first attachment
      attachmentsWithUrls.unshift({
        id: `screenshot-${commentId}`,
        filename: filename,
        mime_type: "image/png",
        size_bytes: 0, // Unknown for legacy screenshots
        uploader_type: "client",
        created_at: comment.created_at,
        signed_url: screenshotSignedData?.signedUrl || null,
      });
    }

    return new Response(
      JSON.stringify({ attachments: attachmentsWithUrls }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Get attachments error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/comments/:token/:commentId/attachments - Upload attachment for a comment
async function handleUploadCommentAttachment(req: Request, token: string, commentId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient();

    // Verify comment belongs to project and get prototype_id
    const { data: comment, error: commentError } = await supabase
      .from("prototype_comments")
      .select("id, prototype_id")
      .eq("id", commentId)
      .eq("project_token", token)
      .maybeSingle();

    if (commentError || !comment) {
      return new Response(
        JSON.stringify({ error: "Comment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const filename = file.name;
    const mimeType = file.type || "application/octet-stream";
    const sizeBytes = file.size;

    // Generate storage path
    const storagePath = `${token}/comments/${commentId}/${Date.now()}-${filename}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("project-media")
      .upload(storagePath, file, { contentType: mimeType });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create media record
    const { data: mediaRecord, error: insertError } = await supabase
      .from("prototype_comment_media")
      .insert({
        project_token: token,
        prototype_id: comment.prototype_id,
        comment_id: commentId,
        uploader_type: "admin",
        storage_path: storagePath,
        filename,
        mime_type: mimeType,
        size_bytes: sizeBytes,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Media record insert error:", insertError);
      // Clean up uploaded file
      await supabase.storage.from("project-media").remove([storagePath]);
      return new Response(
        JSON.stringify({ error: "Failed to create attachment record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate signed URL
    const { data: signedData } = await supabase.storage
      .from("project-media")
      .createSignedUrl(storagePath, 3600);

    console.log(`Attachment uploaded for comment ${commentId}`);

    return new Response(
      JSON.stringify({
        ok: true,
        attachment: {
          id: mediaRecord.id,
          filename: mediaRecord.filename,
          mime_type: mediaRecord.mime_type,
          size_bytes: mediaRecord.size_bytes,
          uploader_type: mediaRecord.uploader_type,
          created_at: mediaRecord.created_at,
          signed_url: signedData?.signedUrl || null,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Upload attachment error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// DELETE /admin/comments/:token/:commentId/attachments/:attachmentId - Delete an attachment
async function handleDeleteCommentAttachment(req: Request, token: string, commentId: string, attachmentId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Deleting attachment ${attachmentId} for comment ${commentId}...`);

    const supabase = getSupabaseClient();

    // Get the attachment record
    const { data: attachment, error: fetchError } = await supabase
      .from("prototype_comment_media")
      .select("storage_path")
      .eq("id", attachmentId)
      .eq("comment_id", commentId)
      .eq("project_token", token)
      .single();

    if (fetchError || !attachment) {
      return new Response(
        JSON.stringify({ error: "Attachment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("project-media")
      .remove([attachment.storage_path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
    }

    // Delete record
    const { error: deleteError } = await supabase
      .from("prototype_comment_media")
      .delete()
      .eq("id", attachmentId)
      .eq("project_token", token);

    if (deleteError) {
      console.error("Attachment delete error:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete attachment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Attachment deleted successfully");

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Delete attachment error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/projects/:token/launch-complete - Mark project as launched
async function handleLaunchComplete(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token format" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Marking project as launched: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Fetch project
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id, project_token, business_name, status")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) {
      console.error("Project fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update project status to completed
    const { error: updateError } = await supabase
      .from("projects")
      .update({ 
        status: "completed",
        updated_at: new Date().toISOString()
      })
      .eq("id", project.id);

    if (updateError) {
      console.error("Project update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update project" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert notification event
    const { error: eventError } = await supabase
      .from("notification_events")
      .insert({
        project_id: project.id,
        project_token: project.project_token,
        event_type: "launch_complete",
        payload: { marked_by: "operator" },
      });

    if (eventError) {
      console.error("Notification event error:", eventError);
      // Non-fatal, continue
    }

    // Send Telegram notification
    try {
      const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");

      if (telegramBotToken && telegramChatId) {
        const message = `🚀 *Launch Complete*\n\n*${project.business_name}* has been marked as launched!`;

        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: message,
            parse_mode: "Markdown",
          }),
        });
      }
    } catch (telegramError) {
      console.error("Telegram notification failed:", telegramError);
      // Non-fatal
    }

    console.log("Project marked as launched successfully");

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Launch complete error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/notifications/test - Send a test email
async function handleTestEmail(req: Request): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  try {
    let body: { project_token?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { project_token } = body;

    if (!project_token || !isValidToken(project_token)) {
      return new Response(
        JSON.stringify({ error: "Valid project_token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending test email for token: ${project_token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Get project with contact_email
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, project_token, business_name, contact_email")
      .eq("project_token", project_token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError) {
      console.error("Project query error:", projectError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!project.contact_email) {
      return new Response(
        JSON.stringify({ error: "Project has no contact_email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert test notification event
    const { data: eventData, error: eventError } = await supabase
      .from("notification_events")
      .insert({
        project_id: project.id,
        project_token: project.project_token,
        event_type: "test",
        payload: { test: true, timestamp: new Date().toISOString() },
      })
      .select("id")
      .single();

    if (eventError) {
      console.error("Event insert error:", eventError);
      return new Response(
        JSON.stringify({ error: "Failed to create test event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Now call the email worker to process this event
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    try {
      const workerRes = await fetch(`${supabaseUrl}/functions/v1/email-worker`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
      });

      const workerResult = await workerRes.json();
      console.log("Email worker result:", workerResult);

      return new Response(
        JSON.stringify({
          ok: true,
          event_id: eventData.id,
          email_to: project.contact_email,
          worker_result: workerResult,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (workerError) {
      console.error("Email worker call failed:", workerError);
      return new Response(
        JSON.stringify({
          ok: true,
          event_id: eventData.id,
          email_to: project.contact_email,
          worker_error: "Worker call failed, event created but email not sent",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Test email error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /admin/accounts - List all auth users with linked projects (excludes admin/operator accounts)
async function handleGetAccounts(req: Request): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  try {
    console.log("Fetching all client accounts with linked projects...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Fetch all admin/operator user IDs to exclude them
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "operator"]);

    if (rolesError) {
      console.error("Failed to fetch admin roles:", rolesError);
      // Continue anyway, just won't filter admins
    }

    const adminUserIds = new Set((adminRoles || []).map((r) => r.user_id));
    console.log(`Found ${adminUserIds.size} admin/operator users to exclude`);

    // Fetch all auth users using Admin API
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (usersError) {
      console.error("Failed to list users:", usersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter out admin/operator users - they shouldn't appear in client accounts list
    const users = (usersData?.users || []).filter((u) => !adminUserIds.has(u.id));
    console.log(`Found ${users.length} client users (after excluding admins)`);

    // Fetch all projects with owner_user_id set
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, project_token, business_name, status, contact_email, contact_phone, owner_user_id")
      .is("deleted_at", null);

    if (projectsError) {
      console.error("Failed to fetch projects:", projectsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch projects" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build accounts with linked projects
    const accountsWithProjects = users.map((user) => {
      const linkedProjects = (projects || []).filter((p) => p.owner_user_id === user.id);
      return {
        user: {
          id: user.id,
          email: user.email || "",
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at || null,
          email_confirmed_at: user.email_confirmed_at || null,
        },
        projects: linkedProjects.map((p) => ({
          id: p.id,
          project_token: p.project_token,
          business_name: p.business_name,
          status: p.status,
          contact_email: p.contact_email,
          contact_phone: p.contact_phone,
        })),
      };
    });

    console.log(`Returning ${accountsWithProjects.length} client accounts`);

    return new Response(
      JSON.stringify(accountsWithProjects),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Get accounts error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// PATCH /admin/accounts/:userId - Update user email
async function handleUpdateAccount(req: Request, userId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  try {
    let body: { email?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email } = body;

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updating account ${userId} with email: ${email}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Update auth user email
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      email: email.trim(),
    });

    if (updateError) {
      console.error("Failed to update user:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message || "Failed to update user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also update contact_email in linked projects
    const { error: projectsError } = await supabase
      .from("projects")
      .update({ contact_email: email.trim() })
      .eq("owner_user_id", userId);

    if (projectsError) {
      console.warn("Failed to update project contact emails:", projectsError);
      // Don't fail the request, just log
    }

    console.log(`Account ${userId} updated successfully`);

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Update account error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// DELETE /admin/accounts/:userId - Delete auth user (protected: cannot delete admins/operators)
async function handleDeleteAccount(req: Request, userId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  try {
    console.log(`Attempting to delete account ${userId}...`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // SECURITY: Check if this user is an admin or operator - prevent deletion
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "operator"]);

    if (rolesError) {
      console.error("Failed to check user roles:", rolesError);
      return new Response(
        JSON.stringify({ error: "Failed to verify account permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (userRoles && userRoles.length > 0) {
      console.warn(`Blocked deletion of admin/operator account ${userId}`);
      return new Response(
        JSON.stringify({ error: "Cannot delete admin or operator accounts. Remove their role first." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unlink projects from this user before deleting
    const { error: unlinkError } = await supabase
      .from("projects")
      .update({ owner_user_id: null })
      .eq("owner_user_id", userId);

    if (unlinkError) {
      console.warn("Failed to unlink projects:", unlinkError);
      // Continue with deletion anyway
    }

    // Delete auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Failed to delete user:", deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message || "Failed to delete user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Account ${userId} deleted successfully`);

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Delete account error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/accounts/clear-test - Delete all non-operator test accounts
async function handleClearTestAccounts(req: Request): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  try {
    console.log("Clearing test accounts...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get all users
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (listError) {
      console.error("Failed to list users:", listError);
      return new Response(
        JSON.stringify({ error: listError.message || "Failed to list users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const users = usersData?.users || [];
    
    // Filter out operator/admin emails (keep these safe)
    const safeEmails = ["pleasantcovedesign@gmail.com"];
    const usersToDelete = users.filter(u => !safeEmails.includes(u.email?.toLowerCase() || ""));

    console.log(`Found ${users.length} total users, ${usersToDelete.length} to delete`);

    let deleted = 0;
    const errors: string[] = [];

    for (const user of usersToDelete) {
      await supabase
        .from("projects")
        .update({ owner_user_id: null })
        .eq("owner_user_id", user.id);

      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        errors.push(`${user.email}: ${deleteError.message}`);
      } else {
        deleted++;
        console.log(`Deleted: ${user.email}`);
      }
    }

    await supabase
      .from("email_verifications")
      .delete()
      .is("project_token", null);

    console.log(`Cleared ${deleted} test accounts`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        deleted, 
        total: usersToDelete.length,
        errors: errors.length > 0 ? errors : undefined 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Clear test accounts error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// ==================== MILESTONES HANDLERS ====================

// Package-based milestone templates
const MILESTONE_TEMPLATES: Record<string, Array<{ label: string; description: string }>> = {
  starter: [
    { label: "Content received", description: "Client has provided logo and basic copy" },
    { label: "Design approved", description: "Single-page design reviewed and approved" },
    { label: "Development complete", description: "Site is built and ready for review" },
    { label: "Ready for launch", description: "All pre-launch checks passed" },
  ],
  growth: [
    { label: "Content received", description: "All copy, photos, and brand assets provided" },
    { label: "Design approved", description: "Homepage + key page designs approved" },
    { label: "Development complete", description: "Multi-page site built and tested" },
    { label: "SEO setup", description: "Meta tags, sitemap, and Google indexing configured" },
    { label: "Final revisions", description: "Client feedback incorporated" },
    { label: "Ready for launch", description: "All pre-launch checks passed" },
  ],
  full_ops: [
    { label: "Discovery call", description: "Initial strategy and requirements discussion" },
    { label: "Content received", description: "All copy, photos, video, and brand assets provided" },
    { label: "Design approved", description: "Full site design system approved" },
    { label: "Development complete", description: "Full site built with integrations" },
    { label: "SEO & analytics", description: "SEO, tracking, and analytics configured" },
    { label: "Integrations live", description: "Booking, payments, or CRM integrations tested" },
    { label: "Training complete", description: "Client trained on managing their site" },
    { label: "Final revisions", description: "All feedback addressed" },
    { label: "Ready for launch", description: "All pre-launch checks passed" },
  ],
};

// Legacy fallback
const DEFAULT_MILESTONE_ITEMS = MILESTONE_TEMPLATES.growth;

// GET /admin/milestones/:token
async function handleGetMilestones(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient();

    // Get project
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projErr || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get milestones with notes
    const { data: milestones, error: milestonesError } = await supabase
      .from("project_milestones")
      .select("*")
      .eq("project_token", token)
      .order("sort_order", { ascending: true });

    if (milestonesError) throw milestonesError;

    // Get notes for all milestones
    const milestoneIds = (milestones || []).map(m => m.id);
    let notes: any[] = [];
    
    if (milestoneIds.length > 0) {
      const { data: notesData, error: notesError } = await supabase
        .from("milestone_notes")
        .select("*")
        .in("milestone_id", milestoneIds)
        .order("created_at", { ascending: true });
      
      if (!notesError) {
        notes = notesData || [];
      }
    }

    // Attach notes to milestones
    const milestonesWithNotes = (milestones || []).map(m => ({
      ...m,
      notes: notes.filter(n => n.milestone_id === m.id),
    }));

    return new Response(
      JSON.stringify({ milestones: milestonesWithNotes }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Get milestones error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/milestones/:token
async function handleCreateMilestone(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { label, description } = body;

    if (!label || typeof label !== "string") {
      return new Response(
        JSON.stringify({ error: "Label required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // Get project
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projErr || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get max sort order
    const { data: maxData } = await supabase
      .from("project_milestones")
      .select("sort_order")
      .eq("project_token", token)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxData?.sort_order ?? -1) + 1;

    // Create milestone
    const { data: milestone, error: insertError } = await supabase
      .from("project_milestones")
      .insert({
        project_id: project.id,
        project_token: token,
        label: label.trim(),
        description: description?.trim() || null,
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ milestone }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Create milestone error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/milestones/:token/defaults
async function handleAddDefaultMilestones(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Parse optional package from body
    let packageType = "growth"; // default
    try {
      const body = await req.json();
      if (body.package && MILESTONE_TEMPLATES[body.package]) {
        packageType = body.package;
      }
    } catch {
      // No body or invalid JSON, use default
    }

    const template = MILESTONE_TEMPLATES[packageType] || MILESTONE_TEMPLATES.growth;
    console.log(`Adding ${packageType} milestone template (${template.length} items)`);

    const supabase = getSupabaseClient();

    // Get project
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projErr || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert milestones from template
    const inserts = template.map((item, idx) => ({
      project_id: project.id,
      project_token: token,
      label: item.label,
      description: item.description,
      sort_order: idx,
      is_client_visible: true,
    }));

    const { error: insertError } = await supabase
      .from("project_milestones")
      .insert(inserts);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ ok: true, package: packageType, count: template.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Add default milestones error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// PATCH /admin/milestones/:token/:milestoneId
async function handleUpdateMilestone(req: Request, token: string, milestoneId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { is_done, is_client_visible, label, description } = body;

    const supabase = getSupabaseClient();

    const updates: Record<string, unknown> = {};
    
    if (typeof is_done === "boolean") {
      updates.is_done = is_done;
      updates.completed_at = is_done ? new Date().toISOString() : null;
    }
    
    if (typeof is_client_visible === "boolean") {
      updates.is_client_visible = is_client_visible;
    }
    
    if (typeof label === "string") {
      updates.label = label.trim();
    }
    
    if (typeof description === "string") {
      updates.description = description.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid fields to update" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: milestone, error: updateError } = await supabase
      .from("project_milestones")
      .update(updates)
      .eq("id", milestoneId)
      .eq("project_token", token)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ milestone }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Update milestone error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// DELETE /admin/milestones/:token/:milestoneId
async function handleDeleteMilestone(req: Request, token: string, milestoneId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient();

    const { error: deleteError } = await supabase
      .from("project_milestones")
      .delete()
      .eq("id", milestoneId)
      .eq("project_token", token);

    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Delete milestone error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// =====================
// REQUEST INFO HANDLERS
// =====================

// POST /admin/projects/:token/request-info
async function handleRequestInfo(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { items, note } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Items array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    const { data: project, error: updateError } = await supabase
      .from("projects")
      .update({
        needs_info: true,
        needs_info_items: items,
        needs_info_note: note?.trim() || null,
      })
      .eq("project_token", token)
      .is("deleted_at", null)
      .select("id, business_name")
      .single();

    if (updateError) throw updateError;

    console.log(`Request info set for ${token}: ${items.length} items`);

    return new Response(
      JSON.stringify({ ok: true, project }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Request info error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// DELETE /admin/projects/:token/request-info
async function handleClearRequestInfo(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient();

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        needs_info: false,
        needs_info_items: [],
        needs_info_note: null,
      })
      .eq("project_token", token)
      .is("deleted_at", null);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Clear request info error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// =====================
// DISCOVERY HANDLERS
// =====================

const DEFAULT_DISCOVERY_ITEMS = [
  { key: "primary_cta", label: "Confirm primary goal + CTA" },
  { key: "logo_colors", label: "Collect logo + brand colors" },
  { key: "photos", label: "Collect photos" },
  { key: "services", label: "Confirm services list" },
  { key: "service_area", label: "Confirm service area" },
  { key: "contact", label: "Confirm contact info" },
  { key: "booking", label: "Booking link / scheduling decision" },
  { key: "ai_receptionist", label: "AI receptionist: yes/no + call routing" },
  { key: "tone", label: "Preferred tone (formal/casual)" },
  { key: "inspiration", label: "Competitors/inspiration noted" },
];

// GET /admin/discovery/:token
async function handleGetDiscovery(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient();

    const { data: items, error } = await supabase
      .from("project_discovery_checklist")
      .select("*")
      .eq("project_token", token)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return new Response(
      JSON.stringify({ items: items || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Get discovery error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/discovery/:token/seed
async function handleSeedDiscovery(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient();

    // Get project ID
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert default items (upsert to avoid duplicates)
    const itemsToInsert = DEFAULT_DISCOVERY_ITEMS.map((item) => ({
      project_id: project.id,
      project_token: token,
      key: item.key,
      label: item.label,
      checked: false,
    }));

    const { data: items, error: insertError } = await supabase
      .from("project_discovery_checklist")
      .upsert(itemsToInsert, { onConflict: "project_id,key" })
      .select();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ items }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Seed discovery error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// PATCH /admin/discovery/:token/:key
async function handleToggleDiscoveryItem(req: Request, token: string, key: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { checked } = body;

    if (typeof checked !== "boolean") {
      return new Response(
        JSON.stringify({ error: "Checked boolean required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    const { data: item, error: updateError } = await supabase
      .from("project_discovery_checklist")
      .update({
        checked,
        checked_at: checked ? new Date().toISOString() : null,
        checked_by: checked ? "operator" : null,
      })
      .eq("project_token", token)
      .eq("key", key)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ item }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Toggle discovery item error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/projects/:token/intake/approve
async function handleApproveIntakeByToken(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient();

    // Find intake by token
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update intake status
    const { data: intake, error: intakeError } = await supabase
      .from("project_intakes")
      .update({ intake_status: "approved" })
      .eq("project_id", project.id)
      .select()
      .single();

    if (intakeError) throw intakeError;

    // Also update project pipeline stage if it's still new
    await supabase
      .from("projects")
      .update({ pipeline_stage: "intake_approved" })
      .eq("id", project.id)
      .in("pipeline_stage", ["new", "quote_requested", "claimed"]);

    console.log(`Intake approved for token ${token}`);

    return new Response(
      JSON.stringify({ ok: true, intake }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Approve intake by token error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/milestones/:token/:milestoneId/notes
async function handleAddMilestoneNote(req: Request, token: string, milestoneId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { content, created_by } = body;

    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "Content required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // Verify milestone exists
    const { data: milestone, error: milestoneErr } = await supabase
      .from("project_milestones")
      .select("id")
      .eq("id", milestoneId)
      .eq("project_token", token)
      .maybeSingle();

    if (milestoneErr || !milestone) {
      return new Response(
        JSON.stringify({ error: "Milestone not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: note, error: insertError } = await supabase
      .from("milestone_notes")
      .insert({
        milestone_id: milestoneId,
        project_token: token,
        content: content.trim(),
        created_by: created_by?.trim() || "operator",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ note }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Add milestone note error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/projects/:token/archive - Archive a project (soft delete)
async function handleArchiveProject(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Archiving project: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    const { data: project, error: updateError } = await supabase
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("project_token", token)
      .is("deleted_at", null)
      .select("id, business_name")
      .single();

    if (updateError || !project) {
      console.error("Archive error:", updateError);
      return new Response(
        JSON.stringify({ error: "Project not found or already archived" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the event
    await supabase.from("project_events").insert({
      project_token: token,
      event_name: "archived",
      metadata: { business_name: project.business_name }
    });

    console.log(`Project archived: ${project.business_name}`);

    return new Response(
      JSON.stringify({ ok: true, message: "Moved to Archived" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Archive project error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/projects/:token/unarchive - Unarchive a project
async function handleUnarchiveProject(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Unarchiving project: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    const { data: project, error: updateError } = await supabase
      .from("projects")
      .update({ deleted_at: null })
      .eq("project_token", token)
      .not("deleted_at", "is", null)
      .select("id, business_name")
      .single();

    if (updateError || !project) {
      console.error("Unarchive error:", updateError);
      return new Response(
        JSON.stringify({ error: "Project not found or not archived" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the event
    await supabase.from("project_events").insert({
      project_token: token,
      event_name: "restored",
      metadata: { business_name: project.business_name }
    });

    console.log(`Project unarchived: ${project.business_name}`);

    return new Response(
      JSON.stringify({ ok: true, message: "Restored to active projects" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unarchive project error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// DELETE /admin/projects/:token/permanent - Permanently delete an archived project
async function handlePermanentDeleteProject(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Permanently deleting project: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // First verify the project exists and is archived
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id, business_name, deleted_at")
      .eq("project_token", token)
      .single();

    if (fetchError || !project) {
      console.error("Project not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only allow deletion of archived projects
    if (!project.deleted_at) {
      return new Response(
        JSON.stringify({ error: "Project must be archived before permanent deletion" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const projectId = project.id;

    // Delete all related records in order (respecting foreign keys)
    // 1. Delete prototype comment media
    await supabase.from("prototype_comment_media").delete().eq("project_token", token);
    
    // 2. Delete prototype comments
    await supabase.from("prototype_comments").delete().eq("project_token", token);
    
    // 3. Delete prototypes
    await supabase.from("prototypes").delete().eq("project_token", token);
    
    // 4. Delete milestone notes
    await supabase.from("milestone_notes").delete().eq("project_token", token);
    
    // 5. Delete milestones
    await supabase.from("project_milestones").delete().eq("project_token", token);
    
    // 6. Delete checklist items
    await supabase.from("project_checklist_items").delete().eq("project_token", token);
    
    // 7. Delete discovery checklist
    await supabase.from("project_discovery_checklist").delete().eq("project_token", token);
    
    // 8. Delete messages
    await supabase.from("messages").delete().eq("project_token", token);
    
    // 9. Delete files
    await supabase.from("files").delete().eq("project_token", token);
    
    // 10. Delete project media
    await supabase.from("project_media").delete().eq("project_token", token);
    
    // 11. Delete review items
    await supabase.from("review_items").delete().eq("project_token", token);
    
    // 12. Delete notifications
    await supabase.from("notification_events").delete().eq("project_token", token);
    
    // 13. Delete outreach events
    await supabase.from("outreach_events").delete().eq("project_token", token);
    
    // 14. Delete push subscriptions
    await supabase.from("push_subscriptions").delete().eq("project_token", token);
    
    // 15. Delete payments
    await supabase.from("payments").delete().eq("project_token", token);
    
    // 16. Delete operator notes
    await supabase.from("operator_notes").delete().eq("project_token", token);
    
    // 17. Delete admin notes
    await supabase.from("admin_notes").delete().eq("project_token", token);
    
    // 18. Delete demos
    await supabase.from("demos").delete().eq("project_token", token);
    
    // 19. Delete project intakes (by project_id)
    await supabase.from("project_intakes").delete().eq("project_id", projectId);
    
    // 20. Finally delete the project itself
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("project_token", token);

    if (deleteError) {
      console.error("Delete project error:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete project" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the event (using a special marker since project is now gone)
    await supabase.from("project_events").insert({
      project_token: token,
      event_name: "permanently_deleted",
      metadata: { business_name: project.business_name }
    });

    console.log(`Project permanently deleted: ${project.business_name}`);

    return new Response(
      JSON.stringify({ ok: true, message: "Project permanently deleted" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Permanent delete project error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// PATCH /admin/projects/:token/ai-status - Update AI receptionist status
async function handleUpdateAIStatus(req: Request, token: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token format" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { status } = body;

    const validStatuses = ["intake_received", "review", "setup", "testing", "live", "paused"];
    if (!status || !validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid AI status value. Valid values: " + validStatuses.join(", ") }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updating project ${token} ai_trial_status to: ${status}`);

    const supabase = getSupabaseClient();

    // Get current project info
    const { data: currentProject, error: fetchError } = await supabase
      .from("projects")
      .select("id, project_token, ai_trial_status, business_name")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError || !currentProject) {
      console.error("Project fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const previousStatus = currentProject.ai_trial_status || "intake_received";

    // Don't update if same status
    if (previousStatus === status) {
      return new Response(
        JSON.stringify({ success: true, project: currentProject, message: "No change" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the AI status
    const { data, error } = await supabase
      .from("projects")
      .update({ ai_trial_status: status, updated_at: new Date().toISOString() })
      .eq("project_token", token)
      .is("deleted_at", null)
      .select("id, project_token, ai_trial_status")
      .single();

    if (error) {
      console.error("AI status update error:", error);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert audit message for status change
    const statusLabels: Record<string, string> = {
      intake_received: "Intake Received",
      review: "Under Review",
      setup: "Setting Up",
      testing: "Testing",
      live: "Live",
      paused: "Paused",
    };

    const auditContent = `[SYSTEM] AI status changed: ${statusLabels[previousStatus] || previousStatus} → ${statusLabels[status] || status}`;

    await supabase
      .from("messages")
      .insert({
        project_id: currentProject.id,
        project_token: currentProject.project_token,
        sender_type: "system",
        content: auditContent,
      });

    console.log(`AI status updated for ${currentProject.business_name}: ${previousStatus} → ${status}`);

    return new Response(
      JSON.stringify({ success: true, project: data, previous_status: previousStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Update AI status error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /admin/bootstrap - Create first admin user (only works if no admins exist)
async function handleBootstrap(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { email, password }: { email?: string; password?: string } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // Check if any admins exist
    const { count, error: countError } = await supabase
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (countError) {
      console.error("Error checking admin count:", countError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((count || 0) > 0) {
      return new Response(
        JSON.stringify({ error: "Bootstrap disabled - admin users already exist" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user via admin API
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Grant admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userData.user.id,
        role: "admin",
      });

    if (roleError) {
      console.error("Error granting admin role:", roleError);
      // Try to clean up the user
      await supabase.auth.admin.deleteUser(userData.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to grant admin role" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Bootstrap complete: Admin user created for ${email}`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: "Admin user created successfully",
        email: email 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Bootstrap error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /admin/signed-url - Get signed URL for private bucket files
async function handleSignedUrl(req: Request, url: URL): Promise<Response> {
  const { error: authError, context } = await validateAdminAuth(req);
  if (authError) return authError;

  const bucket = url.searchParams.get("bucket");
  const path = url.searchParams.get("path");

  if (!bucket || !path) {
    return new Response(
      JSON.stringify({ error: "Missing bucket or path parameter" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60); // 1 hour expiry

    if (error) {
      console.error("Error creating signed URL:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create signed URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ signedUrl: data.signedUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Signed URL error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
