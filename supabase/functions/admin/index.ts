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
  if (subPath.startsWith("notes/") && req.method === "GET") {
    const token = subPath.replace("notes/", "");
    return handleGetNotes(req, token);
  }

  // Route: POST /admin/notes/:token
  if (subPath.startsWith("notes/") && req.method === "POST") {
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

    // Fetch notes
    const { data: notes, error: notesError } = await supabase
      .from("admin_notes")
      .select("id, content, created_at, updated_at")
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

    // Insert note
    const { data: note, error: insertError } = await supabase
      .from("admin_notes")
      .insert({
        project_id: project.id,
        project_token: project.project_token,
        content: content,
      })
      .select("id, content, created_at, updated_at")
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

    console.log(`Updating note ${noteId} for token: ${token.slice(0, 8)}...`);

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

    // Update note
    const { data: note, error: updateError } = await supabase
      .from("admin_notes")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", noteId)
      .eq("project_id", project.id)
      .is("deleted_at", null)
      .select("id, content, created_at, updated_at")
      .single();

    if (updateError) {
      console.error("Note update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update note" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!note) {
      return new Response(
        JSON.stringify({ error: "Note not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Note updated successfully");

    return new Response(
      JSON.stringify({ ok: true, note }),
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

    // Soft delete note
    const { error: deleteError } = await supabase
      .from("admin_notes")
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
