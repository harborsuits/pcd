import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
};

// Token validation: alphanumeric + hyphens/underscores, 12-128 chars
function isValidToken(token: string): boolean {
  return /^[a-zA-Z0-9\-_]{12,128}$/.test(token);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
        contact_name,
        contact_phone,
        contact_email,
        address,
        city,
        state,
        zip,
        source,
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
    
    if (projectIds.length > 0) {
      // Fetch intakes (including id and intake_status)
      const { data: intakes, error: intakesError } = await supabase
        .from("project_intakes")
        .select("id, project_id, intake_json, intake_version, intake_status, created_at")
        .in("project_id", projectIds);

      if (intakesError) {
        console.error("Intakes fetch error:", intakesError);
      } else {
        intakesMap = (intakes || []).reduce((acc: Record<string, unknown>, intake) => {
          acc[intake.project_id] = intake;
          return acc;
        }, {});
      }

      // Fetch unread client messages count per project
      const { data: unreadCounts, error: unreadError } = await supabase
        .from("messages")
        .select("project_id")
        .in("project_id", projectIds)
        .eq("sender_type", "client")
        .is("read_at", null);

      if (unreadError) {
        console.error("Unread counts fetch error:", unreadError);
      } else {
        // Count messages per project
        (unreadCounts || []).forEach(msg => {
          unreadCountsMap[msg.project_id] = (unreadCountsMap[msg.project_id] || 0) + 1;
        });
      }
    }

    // Combine projects with their intakes and unread counts
    const projectsWithIntakes = (projects || []).map(project => ({
      ...project,
      intake: intakesMap[project.id] || null,
      unread_count: unreadCountsMap[project.id] || 0,
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
