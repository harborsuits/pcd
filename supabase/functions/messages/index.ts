import { createClient } from "npm:@supabase/supabase-js@2";

// Allowed origins for widget embedding
const ALLOWED_ORIGINS = [
  /^https?:\/\/.*\.lovable\.app$/,
  /^https?:\/\/.*\.lovableproject\.com$/,
  /^https?:\/\/.*\.squarespace\.com$/,
  /^https?:\/\/.*\.sqsp\.com$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/.*\.pleasantcove\.design$/,
];


function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Allow requests without origin (server-to-server, etc.)
  return ALLOWED_ORIGINS.some(pattern => pattern.test(origin));
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

// Token validation: alphanumeric + hyphens/underscores, 12-128 chars
function isValidToken(token: string): boolean {
  return /^[a-zA-Z0-9\-_]{12,128}$/.test(token);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  // Check origin for CORS - reject disallowed origins
  if (origin && !isAllowedOrigin(origin)) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Extract token and action from URL path
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const messagesIdx = pathParts.lastIndexOf("messages");
  
  // Get token and optional action (e.g., "mark-read")
  const token = messagesIdx >= 0 && messagesIdx < pathParts.length - 1
    ? pathParts[messagesIdx + 1]
    : null;
  const action = messagesIdx >= 0 && messagesIdx < pathParts.length - 2
    ? pathParts[messagesIdx + 2]
    : null;

  if (!token) {
    console.log("Missing token in request");
    return new Response(
      JSON.stringify({ error: "Token required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!isValidToken(token)) {
    console.log("Invalid token format");
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Route: POST /messages/:token/mark-read - Mark admin messages as read for portal
  if (action === "mark-read" && req.method === "POST") {
    return handlePortalMarkRead(token, corsHeaders);
  }

  // Route: GET /messages/:token - Fetch messages for operator (admin key required)
  if (req.method === "GET" && !action) {
    return handleGetMessages(req, token, corsHeaders);
  }

  // Route: POST /messages/:token - Send a message (client or admin)
  if (req.method === "POST" && !action) {
    return handleSendMessage(req, token, corsHeaders);
  }

  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// Get Supabase client helper
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Validate admin access via JWT and role check for operator endpoints
async function validateAdminKey(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("Missing or invalid Authorization header");
    return false;
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
    return false;
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
    return false;
  }

  if (!roleData) {
    console.log(`User ${userId} (${email}) attempted admin access without admin role`);
    return false;
  }

  console.log(`Admin authenticated: ${email} (${userId})`);
  return true;
}

// GET /messages/:token - Fetch messages for operator (admin key required)
async function handleGetMessages(
  req: Request,
  token: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Require admin auth for reading messages
    if (!await validateAdminKey(req)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching messages for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Resolve project by token
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
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

    // Fetch messages ordered oldest to newest
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id, content, sender_type, created_at, read_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true })
      .limit(200);

    if (messagesError) {
      console.error("Messages query error:", messagesError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetched ${messages?.length || 0} messages`);

    return new Response(
      JSON.stringify({ messages: messages || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Get messages error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /messages/:token - Send a client message
async function handleSendMessage(
  req: Request,
  token: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Parse request body
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
        JSON.stringify({ error: "Message content required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (content.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Message too long (max 5000 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Client message for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Resolve project by token
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, project_token")
      .eq("project_token", token)
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
        JSON.stringify({ error: "Portal not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert message - include id in response for deduplication
    const { data: message, error: insertError } = await supabase
      .from("messages")
      .insert({
        project_id: project.id,
        project_token: project.project_token,
        sender_type: "client",
        content: content,
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

    console.log("Client message sent successfully");

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

// POST /messages/:token/mark-read - Mark admin messages as read (portal side)
async function handlePortalMarkRead(
  token: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    console.log(`Portal marking admin messages as read for token: ${token.slice(0, 8)}...`);

    const supabase = getSupabaseClient();

    // Resolve project by token
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("project_token", token)
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
        JSON.stringify({ error: "Portal not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update all unread admin messages
    const { data: updated, error: updateError } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("project_id", project.id)
      .eq("sender_type", "admin")
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
    console.log(`Portal marked ${markedCount} admin messages as read`);

    return new Response(
      JSON.stringify({ ok: true, marked_count: markedCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Portal mark read error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
