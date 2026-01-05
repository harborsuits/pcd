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
  /^https?:\/\/(www\.)?pleasantcovedesign\.com$/,
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
  const markDeliveredIdx = pathParts.indexOf("mark-delivered");
  const prototypesIdx = pathParts.indexOf("prototypes");
  const commentsIdx = pathParts.indexOf("comments");
  const attachmentsIdx = pathParts.indexOf("attachments");
  const screenshotIdx = pathParts.indexOf("screenshot");
  const approveFinalIdx = pathParts.indexOf("approve-final");
  const milestonesIdx = pathParts.indexOf("milestones");
  const phaseBIdx = pathParts.indexOf("phase-b");
  const helpRequestIdx = pathParts.indexOf("help-request");
  
  if (reviewIdx > portalIdx && req.method === "POST") {
    const token = pathParts[portalIdx + 1];
    const itemId = pathParts[reviewIdx + 1];
    return handleReviewAction(req, token, itemId, corsHeaders);
  }
  
  // POST /portal/:token/mark-delivered - Mark admin messages as delivered
  if (markDeliveredIdx > portalIdx && req.method === "POST") {
    const token = pathParts[portalIdx + 1];
    return handleMarkDelivered(req, token, corsHeaders);
  }

  // GET /portal/:token/prototypes - Get prototypes for project
  if (prototypesIdx > portalIdx && req.method === "GET") {
    const token = pathParts[portalIdx + 1];
    return handleGetPrototypes(token, corsHeaders);
  }

  // Comment attachments: /portal/:token/comments/:commentId/attachments
  if (attachmentsIdx > commentsIdx && commentsIdx > portalIdx) {
    const token = pathParts[portalIdx + 1];
    const commentId = pathParts[commentsIdx + 1];
    
    if (req.method === "GET") {
      return handleGetCommentAttachments(token, commentId, corsHeaders);
    }
    if (req.method === "POST") {
      return handleUploadCommentAttachment(req, token, commentId, corsHeaders);
    }
  }

  // POST /portal/:token/screenshot - Upload a screenshot for feedback
  if (screenshotIdx > portalIdx && req.method === "POST") {
    const token = pathParts[portalIdx + 1];
    return handleScreenshotUpload(req, token, corsHeaders);
  }

  // GET /portal/:token/comments - Get comments for prototype
  // POST /portal/:token/comments - Create/update/resolve comments
  if (commentsIdx > portalIdx && attachmentsIdx === -1) {
    const token = pathParts[portalIdx + 1];
    if (req.method === "GET") {
      const prototypeId = new URL(req.url).searchParams.get("prototype_id");
      return handleGetComments(token, prototypeId, corsHeaders);
    }
    if (req.method === "POST") {
      return handleCommentAction(req, token, corsHeaders);
    }
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

  // POST /portal/:token/approve-final - Client approves final version
  if (approveFinalIdx > portalIdx && req.method === "POST") {
    const token = pathParts[portalIdx + 1];
    return handleApproveFinal(req, token, corsHeaders);
  }

  // GET /portal/:token/milestones - Get client-visible milestones
  if (milestonesIdx > portalIdx && req.method === "GET") {
    const token = pathParts[portalIdx + 1];
    return handleGetClientMilestones(token, corsHeaders);
  }

  // POST /portal/:token/phase-b - Save/complete Phase B intake
  if (phaseBIdx > portalIdx && req.method === "POST") {
    const token = pathParts[portalIdx + 1];
    return handlePhaseB(req, token, corsHeaders);
  }

  // GET /portal/:token/phase-b - Get Phase B intake data
  if (phaseBIdx > portalIdx && req.method === "GET") {
    const token = pathParts[portalIdx + 1];
    return handleGetPhaseB(token, corsHeaders);
  }

  // POST /portal/:token/help-request - Client requests help (call or chat)
  if (helpRequestIdx > portalIdx && req.method === "POST") {
    const token = pathParts[portalIdx + 1];
    return handleHelpRequest(req, token, corsHeaders);
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

    // Fetch project by token (exclude soft-deleted) - include owner_user_id for auth check
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, business_name, business_slug, status, project_token, final_approved_at, pipeline_stage, portal_stage, owner_user_id")
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

    // SECURITY: If project has an owner, verify the requesting user is the owner
    // But allow access with anon key for initial page load (auth check happens in frontend)
    if (project.owner_user_id) {
      const authHeader = req.headers.get("Authorization");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
      
      // Check if this is a user JWT (not anon key) and validate ownership
      if (authHeader?.startsWith("Bearer ")) {
        const jwt = authHeader.replace("Bearer ", "");
        
        // If it's NOT the anon key, it should be a user JWT - validate it
        if (jwt !== supabaseAnonKey) {
          const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

          if (authError || !user) {
            console.log("Invalid user JWT for owned project");
            return new Response(
              JSON.stringify({ error: "Invalid or expired token", requires_auth: true }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Check if user is the owner
          if (project.owner_user_id !== user.id) {
            console.log(`Access denied: user ${user.id} tried to access project owned by ${project.owner_user_id}`);
            return new Response(
              JSON.stringify({ error: "You don't have access to this portal" }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          console.log(`Auth verified: user ${user.id} owns project ${token.slice(0, 8)}...`);
        }
      }
      // If using anon key or no auth, mark that auth is required (frontend handles redirect)
      // We still return data so the frontend can show the auth page with business name
    }

    // Fetch intake status for roadmap and Phase B data
    const { data: intake, error: intakeError } = await supabase
      .from("project_intakes")
      .select("intake_status, phase_b_json, phase_b_status")
      .eq("project_id", project.id)
      .maybeSingle();

    if (intakeError) {
      console.error("Intake query error:", intakeError);
      // Non-fatal, continue without intake status
    }

    // We fetch in ascending order so messages display oldest → newest
    let messagesQuery = supabase
      .from("messages")
      .select("id, content, sender_type, created_at, read_at, delivered_at")
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
        final_approved_at: project.final_approved_at || null,
        pipeline_stage: project.pipeline_stage || "new",
        portal_stage: project.portal_stage || "intake",
      },
      intake_status: intake?.intake_status || null,
      phase_b_status: intake?.phase_b_status || "pending",
      phase_b_data: intake?.phase_b_json || null,
      messages: (messages || []).map((m) => ({
        id: m.id,
        content: m.content,
        sender_type: m.sender_type,
        created_at: m.created_at,
        read_at: m.read_at,
        delivered_at: m.delivered_at,
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

// POST /portal/:token/mark-delivered - Mark admin messages as delivered
async function handleMarkDelivered(
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get project by token
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

    // Parse optional message_ids from body
    let messageIds: string[] | undefined;
    try {
      const body = await req.json();
      messageIds = body.message_ids;
    } catch {
      // Body is optional
    }

    // Mark admin messages as delivered (client portal receives admin messages)
    let query = supabase
      .from("messages")
      .update({ delivered_at: new Date().toISOString() })
      .eq("project_id", project.id)
      .eq("sender_type", "admin")
      .is("delivered_at", null);

    if (Array.isArray(messageIds) && messageIds.length > 0) {
      query = query.in("id", messageIds);
    }

    const { error: updateError, count } = await query;

    if (updateError) {
      console.error("Mark delivered error:", updateError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Marked ${count ?? 0} messages as delivered for token: ${token.slice(0, 8)}...`);

    return new Response(
      JSON.stringify({ ok: true, marked_count: count ?? 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Mark delivered error:", error);
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

    // Save full structured intake into project_intakes table (v1) with status 'submitted'
    const { error: intakeError } = await supabase
      .from("project_intakes")
      .insert({
        project_id: project.id,
        owner_user_id: user.id,
        intake_version: 1,
        intake_status: 'submitted',
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

    // Create notification event for intake_submitted email
    await supabase.from("notification_events").insert({
      project_id: project.id,
      project_token: projectToken,
      event_type: "intake_submitted",
      payload: { business_name: intake.businessName, email: user.email },
    });

    // Send auto-welcome message with actionable upload guidance
    await supabase.from("messages").insert({
      project_id: project.id,
      project_token: projectToken,
      sender_type: "system",
      content: `Hey — I'm starting on ${intake.businessName} now!\n\nTo help me get your site looking perfect, please upload:\n• Your logo (PNG or SVG preferred)\n• 3-5 photos of your work or team\n• Any brand colors or fonts you use\n\nTap the 📎 button below to add files anytime.`,
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
async function handleGetPrototypes(
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

    // Fetch prototypes for this project
    const { data: prototypes, error } = await supabase
      .from("prototypes")
      .select("id, url, version_label, status, created_at, updated_at")
      .eq("project_token", token)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get prototypes error:", error);
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

// GET /portal/:token/comments - Get comments for prototype
async function handleGetComments(
  token: string,
  prototypeId: string | null,
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

    // Build query - clients should never see internal comments
    // IMPORTANT: Include all anchor/pin fields needed for pin persistence!
    let query = supabase
      .from("prototype_comments")
      .select(`
        id, prototype_id, author_type, body, pin_x, pin_y, 
        resolved_at, source_message_id, created_at, parent_comment_id, is_internal,
        status, archived_at,
        page_url, page_path, scroll_y, viewport_w, viewport_h, breakpoint,
        anchor_id, anchor_selector, x_pct, y_pct, text_hint, text_offset, text_context
      `)
      .eq("project_token", token)
      .eq("is_internal", false) // Filter out internal operator notes for clients
      .order("created_at", { ascending: true });

    if (prototypeId) {
      query = query.eq("prototype_id", prototypeId);
    }

    const { data: comments, error } = await query;

    if (error) {
      console.error("Get comments error:", error);
      return new Response(
        JSON.stringify({ error: "Database error" }),
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

// POST /portal/:token/screenshot - Upload a screenshot for feedback
async function handleScreenshotUpload(
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const prototypeId = formData.get("prototype_id") as string | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      return new Response(
        JSON.stringify({ error: "File must be an image" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate storage path
    const uuid = crypto.randomUUID();
    const ext = file.name.split(".").pop() || "png";
    const storagePath = prototypeId 
      ? `${token}/screenshots/${prototypeId}/${uuid}.${ext}`
      : `${token}/screenshots/${uuid}.${ext}`;

    // Upload to storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("project-media")
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Screenshot upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload screenshot" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Screenshot uploaded: ${storagePath}`);

    return new Response(
      JSON.stringify({ ok: true, path: storagePath }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Screenshot upload error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /portal/:token/comments - Create, resolve, or unresolve comment
async function handleCommentAction(
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

    const body = await req.json();
    const { 
      action, 
      comment_id, 
      prototype_id, 
      body: commentBody, 
      pin_x, 
      pin_y, 
      author_type, 
      source_message_id,
      // New anchor fields
      page_url,
      page_path,
      scroll_y,
      viewport_w,
      viewport_h,
      breakpoint,
      anchor_id,
      anchor_selector,
      x_pct,
      y_pct,
      text_hint,
      // Text-range anchoring
      text_offset,
      text_context,
      // Screenshot feedback fields
      screenshot_path,
      screenshot_w,
      screenshot_h,
    } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    if (action === "create") {
      if (!prototype_id || !commentBody) {
        return new Response(
          JSON.stringify({ error: "prototype_id and body are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Client comments are never internal
      const { data: comment, error: insertError } = await supabase
        .from("prototype_comments")
        .insert({
          prototype_id,
          project_token: token,
          author_type: author_type || "client",
          body: commentBody,
          pin_x: pin_x ?? null,
          pin_y: pin_y ?? null,
          source_message_id: source_message_id || null,
          is_internal: false, // Client comments are always visible
          parent_comment_id: body.parent_comment_id ?? null,
          // Anchor fields
          page_url: page_url ?? null,
          page_path: page_path ?? null,
          scroll_y: scroll_y ?? null,
          viewport_w: viewport_w ?? null,
          viewport_h: viewport_h ?? null,
          breakpoint: breakpoint ?? null,
          anchor_id: anchor_id ?? null,
          // SAFETY NET: Strip ephemeral anchor selectors at backend level
          anchor_selector: (typeof anchor_selector === "string" && !anchor_selector.includes("data-pcd-anchor"))
            ? anchor_selector
            : null,
          x_pct: x_pct ?? null,
          y_pct: y_pct ?? null,
          text_hint: text_hint ?? null,
          text_offset: text_offset ?? null,
          text_context: text_context ?? null,
          // Screenshot feedback fields
          screenshot_path: screenshot_path ?? null,
          screenshot_w: screenshot_w ?? null,
          screenshot_h: screenshot_h ?? null,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Create comment error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create comment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send Telegram notification for new comment
      const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");
      if (telegramBotToken && telegramChatId) {
        const msg = `💬 <b>New Prototype Comment</b>\n` +
          `• <b>From:</b> ${author_type || "client"}\n` +
          `• <b>Comment:</b> ${commentBody.slice(0, 100)}${commentBody.length > 100 ? "..." : ""}\n` +
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
        JSON.stringify({ ok: true, comment }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

if (action === "resolve" || action === "unresolve") {
      if (!comment_id) {
        return new Response(
          JSON.stringify({ error: "comment_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resolved_at = action === "resolve" ? new Date().toISOString() : null;
      const status = action === "resolve" ? "resolved" : "open";
      const resolved_by = action === "resolve" ? "Client" : null;

      const { error: updateError } = await supabase
        .from("prototype_comments")
        .update({ resolved_at, status, resolved_by })
        .eq("id", comment_id)
        .eq("project_token", token);

      if (updateError) {
        console.error("Update comment error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update comment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, resolved: action === "resolve" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Edit comment body (clients can only edit their own comments)
    if (action === "edit") {
      if (!comment_id || !commentBody) {
        return new Response(
          JSON.stringify({ error: "comment_id and body are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the comment belongs to this project and is a client comment
      const { data: existingComment, error: fetchError } = await supabase
        .from("prototype_comments")
        .select("id, author_type")
        .eq("id", comment_id)
        .eq("project_token", token)
        .maybeSingle();

      if (fetchError || !existingComment) {
        return new Response(
          JSON.stringify({ error: "Comment not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Only allow clients to edit their own comments
      if (existingComment.author_type !== "client") {
        return new Response(
          JSON.stringify({ error: "Can only edit your own comments" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: updatedComment, error: updateError } = await supabase
        .from("prototype_comments")
        .update({ body: commentBody })
        .eq("id", comment_id)
        .eq("project_token", token)
        .select()
        .single();

      if (updateError) {
        console.error("Edit comment error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to edit comment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, comment: updatedComment }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status workflow (open → in_progress → resolved / wont_do)
    if (action === "update_status") {
      if (!comment_id) {
        return new Response(
          JSON.stringify({ error: "comment_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { status: newStatus, resolution_note } = body;
      const validStatuses = ["open", "in_progress", "resolved", "wont_do"];
      
      if (!newStatus || !validStatuses.includes(newStatus)) {
        return new Response(
          JSON.stringify({ error: "Invalid status. Must be one of: open, in_progress, resolved, wont_do" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updateData: Record<string, unknown> = { status: newStatus };
      
      // Set resolved_at when status changes to resolved or wont_do
      if (newStatus === "resolved" || newStatus === "wont_do") {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = "client";
        if (resolution_note) {
          updateData.resolution_note = resolution_note;
        }
      } else {
        // Clear resolved fields when reopening
        updateData.resolved_at = null;
        updateData.resolved_by = null;
        updateData.resolution_note = null;
      }

      const { data: updatedComment, error: updateError } = await supabase
        .from("prototype_comments")
        .update(updateData)
        .eq("id", comment_id)
        .eq("project_token", token)
        .select()
        .single();

      if (updateError) {
        console.error("Update status error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update status" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, comment: updatedComment }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Re-pin a comment (update anchor fields for legacy or broken pins)
    if (action === "repin") {
      if (!comment_id) {
        return new Response(
          JSON.stringify({ error: "comment_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // SAFETY NET: Filter out ephemeral selectors before validation
      const safeAnchorSelector = (typeof anchor_selector === "string" && !anchor_selector.includes("data-pcd-anchor"))
        ? anchor_selector
        : null;
      
      // Require at least valid anchor_selector or anchor_id
      if (!safeAnchorSelector && !anchor_id) {
        return new Response(
          JSON.stringify({ error: "anchor_selector or anchor_id required for repin" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the comment belongs to this project
      const { data: existingComment, error: fetchError } = await supabase
        .from("prototype_comments")
        .select("id")
        .eq("id", comment_id)
        .eq("project_token", token)
        .maybeSingle();

      if (fetchError || !existingComment) {
        return new Response(
          JSON.stringify({ error: "Comment not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update anchor fields (use safeAnchorSelector from validation above)
      const repinData: Record<string, unknown> = {
        anchor_selector: safeAnchorSelector,
        anchor_id: anchor_id ?? null,
        x_pct: x_pct ?? null,
        y_pct: y_pct ?? null,
        pin_x: body.pin_x ?? null,
        pin_y: body.pin_y ?? null,
        page_path: page_path ?? null,
        page_url: page_url ?? null,
        breakpoint: breakpoint ?? null,
        scroll_y: scroll_y ?? null,
        viewport_w: viewport_w ?? null,
        viewport_h: viewport_h ?? null,
        text_hint: text_hint ?? null,
        text_offset: text_offset ?? null,
        text_context: text_context ?? null,
      };

      const { data: updatedComment, error: updateError } = await supabase
        .from("prototype_comments")
        .update(repinData)
        .eq("id", comment_id)
        .eq("project_token", token)
        .select()
        .single();

      if (updateError) {
        console.error("Repin comment error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to repin comment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Comment ${comment_id.slice(0, 8)} repinned with selector: ${anchor_selector}`);

      return new Response(
        JSON.stringify({ ok: true, comment: updatedComment }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Archive a comment
    if (action === "archive") {
      if (!comment_id) {
        return new Response(
          JSON.stringify({ error: "comment_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: updatedComment, error: updateError } = await supabase
        .from("prototype_comments")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", comment_id)
        .eq("project_token", token)
        .select()
        .single();

      if (updateError) {
        console.error("Archive comment error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to archive comment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Comment ${comment_id.slice(0, 8)} archived`);

      return new Response(
        JSON.stringify({ ok: true, comment: updatedComment }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unarchive a comment
    if (action === "unarchive") {
      if (!comment_id) {
        return new Response(
          JSON.stringify({ error: "comment_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: updatedComment, error: updateError } = await supabase
        .from("prototype_comments")
        .update({ archived_at: null })
        .eq("id", comment_id)
        .eq("project_token", token)
        .select()
        .single();

      if (updateError) {
        console.error("Unarchive comment error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to unarchive comment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Comment ${comment_id.slice(0, 8)} unarchived`);

      return new Response(
        JSON.stringify({ ok: true, comment: updatedComment }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch set page_url and page_path for multiple comments (reconciliation flow)
    // This is used to fix legacy pins that have missing/wrong page associations
    if (action === "set_page") {
      const { comment_ids, page_url: newPageUrl, page_path: newPagePath } = body;

      if (!Array.isArray(comment_ids) || comment_ids.length === 0) {
        return new Response(
          JSON.stringify({ error: "comment_ids array is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!newPageUrl) {
        return new Response(
          JSON.stringify({ error: "page_url is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify prototype_id is provided and valid
      if (!prototype_id) {
        return new Response(
          JSON.stringify({ error: "prototype_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update all specified comments' page fields
      const { error: updateError, count } = await supabase
        .from("prototype_comments")
        .update({ 
          page_url: newPageUrl, 
          page_path: newPagePath ?? null 
        })
        .in("id", comment_ids)
        .eq("project_token", token)
        .eq("prototype_id", prototype_id);

      if (updateError) {
        console.error("Set page error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update page associations" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[set_page] Updated ${count ?? comment_ids.length} comments to page: ${newPagePath}`);

      return new Response(
        JSON.stringify({ ok: true, updated: count ?? comment_ids.length }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Comment action error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /portal/:token/comments/:commentId/attachments - Get attachments for a comment
async function handleGetCommentAttachments(
  token: string,
  commentId: string,
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

// POST /portal/:token/comments/:commentId/attachments - Upload attachment for a comment
async function handleUploadCommentAttachment(
  req: Request,
  token: string,
  commentId: string,
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
        uploader_type: "client",
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

// POST /portal/:token/approve-final - Client approves final version
async function handleApproveFinal(
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project by token
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, business_name, final_approved_at")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already approved
    if (project.final_approved_at) {
      return new Response(
        JSON.stringify({ ok: true, already_approved: true, final_approved_at: project.final_approved_at }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const approvedAt = new Date().toISOString();

    // Update project with final_approved_at
    const { error: updateError } = await supabase
      .from("projects")
      .update({ final_approved_at: approvedAt })
      .eq("id", project.id);

    if (updateError) {
      console.error("Update project error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to approve" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification event for email
    await supabase
      .from("notification_events")
      .insert({
        project_id: project.id,
        project_token: token,
        event_type: "final_approved",
        payload: { business_name: project.business_name, approved_at: approvedAt },
      });

    console.log(`Project ${project.id} final approved by client`);

    // Send Telegram notification
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");
    if (telegramBotToken && telegramChatId) {
      const msg = `✅ <b>Final Approval</b>\n` +
        `• <b>Business:</b> ${project.business_name}\n` +
        `• Client approved the final version\n` +
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
      JSON.stringify({ ok: true, final_approved_at: approvedAt }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Approve final error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /portal/:token/milestones - Get client-visible milestones
async function handleGetClientMilestones(
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

    // Fetch project by token
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, status")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch only client-visible milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from("project_milestones")
      .select("id, label, description, is_done, completed_at, sort_order")
      .eq("project_token", token)
      .eq("is_client_visible", true)
      .order("sort_order", { ascending: true });

    if (milestonesError) {
      console.error("Milestones fetch error:", milestonesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch milestones" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Returning ${milestones?.length || 0} client-visible milestones for token ${token.slice(0, 8)}...`);

    return new Response(
      JSON.stringify({
        milestones: milestones || [],
        project_status: project.status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Get client milestones error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /portal/:token/phase-b - Save or complete Phase B intake
async function handlePhaseB(
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

    const body = await req.json();
    const { data: phaseBData, action } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, business_name, pipeline_stage")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get or create intake record
    const { data: existingIntake } = await supabase
      .from("project_intakes")
      .select("id")
      .eq("project_id", project.id)
      .maybeSingle();

    const isComplete = action === "complete";
    const phaseBStatus = isComplete ? "complete" : "in_progress";
    const completedAt = isComplete ? new Date().toISOString() : null;

    if (existingIntake) {
      // Update existing intake
      const updateData: Record<string, unknown> = {
        phase_b_json: phaseBData,
        phase_b_status: phaseBStatus,
        updated_at: new Date().toISOString(),
      };
      if (isComplete) {
        updateData.phase_b_completed_at = completedAt;
      }

      const { error: updateError } = await supabase
        .from("project_intakes")
        .update(updateData)
        .eq("id", existingIntake.id);

      if (updateError) {
        console.error("Update intake error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to save intake" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Create new intake
      const { error: insertError } = await supabase
        .from("project_intakes")
        .insert({
          project_id: project.id,
          phase_b_json: phaseBData,
          phase_b_status: phaseBStatus,
          phase_b_completed_at: completedAt,
          intake_status: "submitted",
        });

      if (insertError) {
        console.error("Insert intake error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create intake" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // If complete, advance pipeline stage and notify
    if (isComplete) {
      // Update pipeline stage to qualified (ready for design)
      await supabase
        .from("projects")
        .update({ pipeline_stage: "qualified" })
        .eq("id", project.id);

      // Post system message
      await supabase.from("messages").insert({
        project_id: project.id,
        project_token: token,
        sender_type: "system",
        content: `✅ Project setup complete! We now have everything needed to start your first draft.`,
      });

      // Create notification event
      await supabase.from("notification_events").insert({
        project_id: project.id,
        project_token: token,
        event_type: "phase_b_complete",
        payload: { business_name: project.business_name },
      });

      // Send Telegram notification
      const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");
      const baseUrl = Deno.env.get("PUBLIC_BASE_URL") || "https://pleasantcove.design";

      if (telegramBotToken && telegramChatId) {
        const t = encodeURIComponent(token);
        const operatorUrl = `${baseUrl}/operator?project=${t}`;

        try {
          const res = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: `📋 Phase B Complete\n\n• Business: ${project.business_name}\n• Client finished project setup\n• Ready to start Draft v1`,
              reply_markup: {
                inline_keyboard: [[
                  { text: "View Project →", url: operatorUrl },
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

      console.log(`Phase B complete for ${project.business_name} (${token.slice(0, 8)}...)`);
    } else {
      console.log(`Phase B saved for ${project.business_name} (${token.slice(0, 8)}...)`);
    }

    return new Response(
      JSON.stringify({ ok: true, status: phaseBStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Phase B error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /portal/:token/phase-b - Get Phase B intake data
async function handleGetPhaseB(
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

    // Fetch project
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

    // Get intake
    const { data: intake, error: intakeError } = await supabase
      .from("project_intakes")
      .select("phase_b_json, phase_b_status, phase_b_completed_at")
      .eq("project_id", project.id)
      .maybeSingle();

    if (intakeError) {
      console.error("Fetch intake error:", intakeError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch intake" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        data: intake?.phase_b_json || null,
        status: intake?.phase_b_status || "pending",
        completed_at: intake?.phase_b_completed_at || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Get Phase B error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /portal/:token/help-request - Client requests help (call or chat)
async function handleHelpRequest(
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

    const body = await req.json();
    const { type } = body; // "call" or "chat"

    if (!type || !["call", "chat"].includes(type)) {
      return new Response(
        JSON.stringify({ error: "Invalid request type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, business_name, contact_name, contact_phone, contact_email")
      .eq("project_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Post system message based on type
    const messageContent = type === "call"
      ? `📞 Client requested a quick call. Contact: ${project.contact_name || "—"} | ${project.contact_phone || project.contact_email || "—"}`
      : `💬 Client needs help with project setup and wants to chat.`;

    await supabase.from("messages").insert({
      project_id: project.id,
      project_token: token,
      sender_type: "system",
      content: messageContent,
    });

    // Create notification event
    await supabase.from("notification_events").insert({
      project_id: project.id,
      project_token: token,
      event_type: type === "call" ? "help_call_requested" : "help_chat_requested",
      payload: { business_name: project.business_name, type },
    });

    // Send Telegram notification
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");
    const baseUrl = Deno.env.get("PUBLIC_BASE_URL") || "https://pleasantcove.design";

    if (telegramBotToken && telegramChatId) {
      const t = encodeURIComponent(token);
      const operatorUrl = `${baseUrl}/operator?project=${t}`;

      const emoji = type === "call" ? "📞" : "💬";
      const action = type === "call" ? "requested a quick call" : "needs help (chat)";

      try {
        const res = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: `${emoji} Help Requested\n\n• Business: ${project.business_name}\n• Client ${action}\n• Contact: ${project.contact_name || "—"}`,
            reply_markup: {
              inline_keyboard: [[
                { text: "View Project →", url: operatorUrl },
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

    console.log(`Help request (${type}) from ${project.business_name} (${token.slice(0, 8)}...)`);

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Help request error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
