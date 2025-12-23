import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Check for review-item action: POST /portal/:token/review/:itemId
  const portalIdx = pathParts.lastIndexOf("portal");
  const reviewIdx = pathParts.indexOf("review");
  const checkAuthIdx = pathParts.indexOf("check-auth");
  const linkOwnerIdx = pathParts.indexOf("link-owner");
  const verifyOwnerIdx = pathParts.indexOf("verify-owner");
  const createProjectIdx = pathParts.indexOf("create-project");
  const myProjectsIdx = pathParts.indexOf("my-projects");
  
  if (reviewIdx > portalIdx && req.method === "POST") {
    const token = pathParts[portalIdx + 1];
    const itemId = pathParts[reviewIdx + 1];
    return handleReviewAction(req, token, itemId, corsHeaders);
  }
  
  // GET /portal/:token/check-auth - Check if portal requires authentication
  if (checkAuthIdx > portalIdx && req.method === "GET") {
    const token = pathParts[portalIdx + 1];
    return handleCheckAuth(token, corsHeaders);
  }
  
  // POST /portal/:token/link-owner - Link user to project
  if (linkOwnerIdx > portalIdx && req.method === "POST") {
    const token = pathParts[portalIdx + 1];
    return handleLinkOwner(req, token, corsHeaders);
  }
  
  // POST /portal/:token/verify-owner - Verify user owns project
  if (verifyOwnerIdx > portalIdx && req.method === "POST") {
    const token = pathParts[portalIdx + 1];
    return handleVerifyOwner(req, token, corsHeaders);
  }
  
  // GET /portal/my-projects - Get all projects owned by the logged-in user
  if (myProjectsIdx > portalIdx && req.method === "GET") {
    return handleMyProjects(req, corsHeaders);
  }

  // POST /portal/create-project - Create a new project from onboarding intake
  if (createProjectIdx > portalIdx && req.method === "POST") {
    return handleCreateProject(req, corsHeaders);
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Extract token from URL path: /portal/:token or /functions/v1/portal/:token
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Find "portal" in path and get the next segment as token
    const portalIdx = pathParts.lastIndexOf("portal");
    const token = portalIdx >= 0 && portalIdx < pathParts.length - 1 
      ? pathParts[portalIdx + 1] 
      : pathParts[pathParts.length - 1];

    // Pagination params
    const messagesLimit = Math.min(
      parseInt(url.searchParams.get("messages_limit") || "50", 10),
      100 // Cap at 100
    );
    const messagesBefore = url.searchParams.get("messages_before"); // ISO timestamp cursor

    // Validate messages_before if provided
    if (messagesBefore) {
      const parsedDate = new Date(messagesBefore);
      if (isNaN(parsedDate.getTime())) {
        console.log("Invalid messages_before timestamp");
        return new Response(
          JSON.stringify({ error: "Invalid messages_before" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!token || token === "portal") {
      console.log("Missing token in request");
      return new Response(
        JSON.stringify({ error: "Token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Token sanity check
    if (!isValidToken(token)) {
      console.log("Invalid token format");
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching portal for token: ${token.slice(0, 8)}...`);

    // Initialize Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project by token (exclude soft-deleted)
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, business_name, business_slug, status, project_token")
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

    // Fetch messages (paginated, oldest first for proper ordering) - include id for deduplication
    // We fetch in ascending order so messages display oldest → newest
    let messagesQuery = supabase
      .from("messages")
      .select("id, content, sender_type, created_at, read_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true })
      .limit(messagesLimit + 1);

    if (messagesBefore) {
      messagesQuery = messagesQuery.lt("created_at", messagesBefore);
    }

    const { data: rawMessages, error: messagesError } = await messagesQuery;

    if (messagesError) {
      console.error("Messages query error:", messagesError);
      // Non-fatal: continue with empty messages
    }

    // Check if there are more messages and slice to limit
    const hasMoreMessages = (rawMessages || []).length > messagesLimit;
    const messages = hasMoreMessages ? (rawMessages || []).slice(0, messagesLimit) : (rawMessages || []);

    // Fetch files (include id for media proxy)
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("id, file_name, file_type, description, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (filesError) {
      console.error("Files query error:", filesError);
      // Non-fatal: continue with empty files
    }

    // Fetch payments (history, no internal IDs)
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount_cents, payment_type, status, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (paymentsError) {
      console.error("Payments query error:", paymentsError);
      // Non-fatal: continue with empty payments
    }

    // Fetch review items
    const { data: reviewItems, error: reviewItemsError } = await supabase
      .from("review_items")
      .select("id, title, description, item_type, item_url, item_content, status, client_notes, created_at, updated_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (reviewItemsError) {
      console.error("Review items query error:", reviewItemsError);
      // Non-fatal: continue with empty review items
    }

    // Clean response - include id for deduplication
    const response = {
      business: {
        name: project.business_name,
        slug: project.business_slug,
        status: project.status,
      },
      messages: (messages || []).map((m) => ({
        id: m.id,
        content: m.content,
        sender_type: m.sender_type,
        created_at: m.created_at,
        read_at: m.read_at,
      })),
      files: (files || []).map((f) => ({
        id: f.id,
        file_name: f.file_name,
        file_type: f.file_type,
        description: f.description,
        created_at: f.created_at,
      })),
      payments: (payments || []).map((p) => ({
        amount_cents: p.amount_cents,
        payment_type: p.payment_type,
        status: p.status,
        created_at: p.created_at,
      })),
      review_items: (reviewItems || []).map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        item_type: r.item_type,
        item_url: r.item_url,
        item_content: r.item_content,
        status: r.status,
        client_notes: r.client_notes,
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
      pagination: {
        messages_limit: messagesLimit,
        messages_before: messagesBefore,
        has_more_messages: hasMoreMessages,
      },
    };

    console.log(`Portal fetched successfully for: ${project.business_name}`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Handle review item approval/changes request
async function handleReviewAction(
  req: Request, 
  token: string, 
  itemId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    if (!token || !isValidToken(token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!itemId) {
      return new Response(
        JSON.stringify({ error: "Item ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, notes } = body;

    if (!action || !["approve", "request_changes"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "action must be 'approve' or 'request_changes'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the item belongs to the project with this token
    const { data: item, error: itemError } = await supabase
      .from("review_items")
      .select("id, project_token, title")
      .eq("id", itemId)
      .eq("project_token", token)
      .maybeSingle();

    if (itemError || !item) {
      console.error("Review item not found:", itemError);
      return new Response(
        JSON.stringify({ error: "Item not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the item status
    const newStatus = action === "approve" ? "approved" : "changes_requested";
    const { error: updateError } = await supabase
      .from("review_items")
      .update({
        status: newStatus,
        client_notes: action === "request_changes" ? (notes || null) : null,
      })
      .eq("id", itemId);

    if (updateError) {
      console.error("Update review item error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update item" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Review item ${itemId} updated to ${newStatus}`);

    // Send Telegram notification
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");
    if (telegramBotToken && telegramChatId) {
      const emoji = action === "approve" ? "✅" : "🔄";
      const msg = `${emoji} <b>Review Update</b>\n` +
        `• <b>Item:</b> ${item.title}\n` +
        `• <b>Action:</b> ${action === "approve" ? "Approved" : "Changes Requested"}\n` +
        (notes ? `• <b>Notes:</b> ${notes}\n` : "") +
        `• <b>Token:</b> <code>${token.slice(0, 12)}...</code>`;
      
      try {
        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: msg,
            parse_mode: "HTML",
          }),
        });
      } catch (e) {
        console.error("Telegram notification failed:", e);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, status: newStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Review action error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Check if portal requires authentication (has owner_user_id set)
async function handleCheckAuth(
  token: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    if (!token || !isValidToken(token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: project, error } = await supabase
      .from("projects")
      .select("business_name, owner_user_id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !project) {
      return new Response(
        JSON.stringify({ error: "Portal not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If owner_user_id is set, auth is required
    const requiresAuth = !!project.owner_user_id;

    return new Response(
      JSON.stringify({
        requires_auth: requiresAuth,
        business_name: project.business_name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Link a user to a project (set owner_user_id) - extracts user from JWT
async function handleLinkOwner(
  req: Request,
  token: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    if (!token || !isValidToken(token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only link if not already owned
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id, owner_user_id, business_name")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already owned by someone else, reject
    if (project.owner_user_id && project.owner_user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Project already claimed by another user" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Link the user
    await supabase
      .from("projects")
      .update({ owner_user_id: user.id })
      .eq("id", project.id);

    console.log(`Linked user ${user.id} to project ${project.business_name}`);

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Link owner error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Verify user owns the project - ONLY CHECKS, does NOT auto-link
// Use link-owner to explicitly link an unclaimed project
async function handleVerifyOwner(
  req: Request,
  token: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    if (!token || !isValidToken(token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id, owner_user_id")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError || !project) {
      return new Response(
        JSON.stringify({ ok: false, error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If not claimed, user does NOT own it - they must use link-owner or claim-with-auth
    if (!project.owner_user_id) {
      return new Response(
        JSON.stringify({ ok: false, unclaimed: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is the owner
    const isOwner = project.owner_user_id === user.id;

    return new Response(
      JSON.stringify({ ok: isOwner }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify owner error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /portal/my-projects - Get all projects owned by the logged-in user
async function handleMyProjects(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Extract user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all projects owned by this user
    const { data: projects, error: fetchError } = await supabase
      .from("projects")
      .select("project_token, business_name, status")
      .eq("owner_user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Fetch projects error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ projects: projects || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("My projects error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Generate a random project token
function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Generate a URL-friendly slug from business name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

// POST /portal/create-project - Create a new project from onboarding intake
async function handleCreateProject(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Extract user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse intake data
    const body = await req.json();
    const { intake } = body;

    if (!intake || !intake.businessName) {
      return new Response(
        JSON.stringify({ error: "Business name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate project token and slug
    const projectToken = generateToken();
    const businessSlug = slugify(intake.businessName);

    // Create the project with lightweight notes summary
    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        project_token: projectToken,
        business_name: intake.businessName,
        business_slug: businessSlug,
        owner_user_id: user.id,
        contact_email: user.email,
        status: "lead",
        source: "onboarding",
        notes: JSON.stringify({
          intake_summary: {
            businessType: intake.businessType,
            mainGoal: intake.mainGoal,
            styleVibe: intake.styleVibe,
            colorPreset: intake.colorPreset,
            selectedDemo: intake.selectedDemo,
          },
          createdAt: new Date().toISOString(),
        }),
      })
      .select("id, project_token, business_name")
      .single();

    if (insertError) {
      console.error("Create project error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create project" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Created project ${project.business_name} for user ${user.id}`);

    // Save full structured intake into project_intakes table (v1)
    const { error: intakeError } = await supabase
      .from("project_intakes")
      .insert({
        project_id: project.id,
        owner_user_id: user.id,
        intake_version: 1,
        intake_json: {
          ...intake,
          createdAt: new Date().toISOString(),
          source: "onboarding",
        },
      });

    if (intakeError) {
      console.error("Failed to insert project_intakes:", intakeError);
      // Don't hard-fail the project creation — but log it loudly
    }

    // Send auto-welcome message
    await supabase.from("messages").insert({
      project_id: project.id,
      project_token: projectToken,
      sender_type: "system",
      content: `Hey — I've got everything I need to start on ${intake.businessName}. I'll send a first version soon. You can upload logos or photos anytime here.`,
    });

    // Send Telegram notification
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");
    if (telegramBotToken && telegramChatId) {
      const msg = `🆕 <b>New Project Created</b>\n` +
        `• <b>Business:</b> ${intake.businessName}\n` +
        `• <b>Type:</b> ${intake.businessType || "—"}\n` +
        `• <b>Goal:</b> ${intake.mainGoal || "—"}\n` +
        `• <b>Style:</b> ${intake.styleVibe || "—"}\n` +
        `• <b>Features:</b> ${(intake.functionality || []).join(", ") || "—"}\n` +
        `• <b>Email:</b> ${user.email}\n` +
        `• <b>Token:</b> <code>${projectToken}</code>`;

      try {
        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: msg,
            parse_mode: "HTML",
          }),
        });
      } catch (e) {
        console.error("Telegram notification failed:", e);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        project_token: projectToken,
        business_name: project.business_name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Create project error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
