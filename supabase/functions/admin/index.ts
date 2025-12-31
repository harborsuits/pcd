import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for admin console
const ADMIN_ALLOWED_ORIGINS = [
  /^https?:\/\/.*\.lovable\.app$/,
  /^https?:\/\/.*\.lovableproject\.com$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/.*\.pleasantcove\.design$/,
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

  return new Response(
    JSON.stringify({ error: "Not found" }),
    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// Validate admin key helper
function validateAdminKey(req: Request): Response | null {
  const adminKey = req.headers.get("x-admin-key");
  const expectedKey = Deno.env.get("ADMIN_KEY");

  if (!expectedKey) {
    console.error("ADMIN_KEY not configured");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!adminKey || adminKey !== expectedKey) {
    console.log("Invalid or missing admin key");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return null; // Valid
}

// Get Supabase client helper
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /admin/inbox - List projects with last message and unread count using RPC
async function handleInbox(req: Request): Promise<Response> {
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
  if (authError) return authError;

  try {
    console.log("Fetching all projects for operator...");

    const supabase = getSupabaseClient();

    // Fetch all projects with their intake data
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select(`
        id,
        business_name,
        business_slug,
        project_token,
        status,
        pipeline_stage,
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
        updated_at
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (projectsError) {
      console.error("Projects fetch error:", projectsError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch intake data for all projects
    const projectIds = (projects || []).map(p => p.id);
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
    const projectsWithIntakes = (projects || []).map(project => ({
      ...project,
      intake: intakesMap[project.id] || null,
      unread_count: unreadCountsMap[project.id] || 0,
      quote_count: quoteCountsMap[project.id] || 0,
      has_claim: hasClaimMap[project.id] || project.status === "interested" || project.status === "client",
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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

    const validStages = ["new", "demo_requested", "quote_requested", "claimed", "contacted", "qualified", "won", "lost"];
    if (!stage || !validStages.includes(stage)) {
      return new Response(
        JSON.stringify({ error: "Invalid stage value" }),
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
      demo_requested: "Demo Requested",
      quote_requested: "Quote Requested",
      claimed: "Claimed",
      contacted: "Contacted",
      qualified: "Qualified",
      won: "Won",
      lost: "Lost",
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
    const notifyStages = ["quote_requested", "claimed", "won", "lost"];
    if (notifyStages.includes(stage)) {
      const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");
      const baseUrl = Deno.env.get("PUBLIC_BASE_URL") || "https://ararrbvhzaudfaxjwdrc.lovableproject.com";

      // Build contact info string
      const contactParts: string[] = [];
      if (currentProject.contact_name) contactParts.push(currentProject.contact_name);
      if (currentProject.contact_phone) contactParts.push(currentProject.contact_phone);
      if (currentProject.contact_email) contactParts.push(currentProject.contact_email);
      const contactInfo = contactParts.length > 0 ? contactParts.join(" • ") : "No contact info";

      // Build notification message (plain text - Telegram auto-linkifies)
      const stageEmoji = stage === "won" ? "🎉" : stage === "lost" ? "❌" : stage === "claimed" ? "✅" : "📋";
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

// POST /admin/projects/:token/nudge - Send reminder to client
async function handleNudge(req: Request, token: string): Promise<Response> {
  const authError = validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token format" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Sending nudge to project: ${token}`);

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

    // Create friendly reminder message
    let messageContent = "👋 Quick reminder: ";
    if (missing.length === 0) {
      messageContent += "Your project setup is almost complete! Please review and submit when ready so we can start your first draft.";
    } else if (missing.length <= 3) {
      messageContent += `We just need ${missing.join(", ")} to start building your first draft. You can complete this anytime in your project setup above.`;
    } else {
      messageContent += "Please complete your project setup above so we can start your first draft. It only takes about 10 minutes!";
    }

    // Post the reminder message
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
      return new Response(
        JSON.stringify({ error: "Failed to send message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      },
      sent_at: new Date().toISOString(),
    });

    // Send Telegram notification
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");
    const baseUrl = Deno.env.get("PUBLIC_BASE_URL") || "https://pleasantcove.design";

    if (telegramBotToken && telegramChatId) {
      const t = encodeURIComponent(token);
      const portalUrl = `${baseUrl}/p/${t}`;

      try {
        const res = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: `🔔 Nudge Sent\n\n• Business: ${project.business_name}\n• Missing: ${missing.length > 0 ? missing.join(", ") : "Almost complete!"}\n• Contact: ${project.contact_name || "—"}`,
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

    console.log(`Nudge sent for ${project.business_name} (${token.slice(0, 8)}...)`);

    return new Response(
      JSON.stringify({ success: true, message: "Nudge sent" }),
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

// PATCH /admin/intake/:intakeId/approve - Approve an intake
async function handleApproveIntake(req: Request, intakeId: string): Promise<Response> {
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
  if (authError) return authError;

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    let body: { resolved?: boolean };
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

    const updateData: { resolved_at?: string | null } = {};
    if (typeof body.resolved === "boolean") {
      updateData.resolved_at = body.resolved ? new Date().toISOString() : null;
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
  const authError = validateAdminKey(req);
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

    // Fetch media items
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

    // Generate signed URLs for each media item
    const mediaWithUrls = await Promise.all((media || []).map(async (item) => {
      const { data: signedData } = await supabase.storage
        .from("project-media")
        .createSignedUrl(item.storage_path, 3600); // 1 hour expiry

      return {
        ...item,
        signed_url: signedData?.signedUrl || null,
      };
    }));

    return new Response(
      JSON.stringify({ media: mediaWithUrls }),
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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

    // Verify comment belongs to project
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

    // Fetch attachments
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

    // Generate signed URLs
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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

// GET /admin/accounts - List all auth users with linked projects
async function handleGetAccounts(req: Request): Promise<Response> {
  const authError = validateAdminKey(req);
  if (authError) return authError;

  try {
    console.log("Fetching all accounts with linked projects...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

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

    const users = usersData?.users || [];
    console.log(`Found ${users.length} auth users`);

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

    console.log(`Returning ${accountsWithProjects.length} accounts`);

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
  const authError = validateAdminKey(req);
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

// DELETE /admin/accounts/:userId - Delete auth user
async function handleDeleteAccount(req: Request, userId: string): Promise<Response> {
  const authError = validateAdminKey(req);
  if (authError) return authError;

  try {
    console.log(`Deleting account ${userId}...`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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
  const authError = validateAdminKey(req);
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

// POST /admin/milestones/:token/:milestoneId/notes
async function handleAddMilestoneNote(req: Request, token: string, milestoneId: string): Promise<Response> {
  const authError = validateAdminKey(req);
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
