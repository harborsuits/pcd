import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

// Service role client for DB operations
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // pathParts: ["billing", "<action>"]
  const action = pathParts[1] || "";

  try {
    // Auth check: require operator/admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Check if user is admin/operator
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "operator"])
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: operator access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route to action
    if (action === "ensure-customer" && req.method === "POST") {
      return await handleEnsureCustomer(req);
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Billing function error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * ensure-customer: Create or retrieve Stripe customer, link to client_accounts and project
 * 
 * Input: { project_token, email, name?, phone? }
 * Output: { client_account_id, stripe_customer_id }
 */
async function handleEnsureCustomer(req: Request) {
  const body = await req.json();
  const { project_token, email, name, phone } = body;

  if (!project_token || !email) {
    return new Response(
      JSON.stringify({ error: "project_token and email are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  console.log(`[ensure-customer] project_token=${project_token}, email=${normalizedEmail}`);

  // 1. Look up client_accounts by email (case-insensitive)
  const { data: existingAccount, error: lookupError } = await supabaseAdmin
    .from("client_accounts")
    .select("*")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (lookupError) {
    console.error("Error looking up client_accounts:", lookupError);
    throw new Error("Failed to lookup client account");
  }

  let clientAccountId: string;
  let stripeCustomerId: string;

  if (existingAccount) {
    clientAccountId = existingAccount.id;

    if (existingAccount.stripe_customer_id) {
      // Already has Stripe customer
      stripeCustomerId = existingAccount.stripe_customer_id;
      console.log(`[ensure-customer] Found existing Stripe customer: ${stripeCustomerId}`);
    } else {
      // Has account but no Stripe customer - create one
      console.log(`[ensure-customer] Creating Stripe customer for existing account...`);
      const customer = await stripe.customers.create({
        email: normalizedEmail,
        name: name || existingAccount.name || undefined,
        phone: phone || existingAccount.phone || undefined,
        metadata: {
          client_account_id: clientAccountId,
          source: "lovable_billing",
        },
      });
      stripeCustomerId = customer.id;

      // Update client_accounts with stripe_customer_id
      const { error: updateError } = await supabaseAdmin
        .from("client_accounts")
        .update({ 
          stripe_customer_id: stripeCustomerId,
          name: name || existingAccount.name,
          phone: phone || existingAccount.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientAccountId);

      if (updateError) {
        console.error("Error updating client_accounts:", updateError);
        throw new Error("Failed to update client account with Stripe customer ID");
      }
      console.log(`[ensure-customer] Created Stripe customer: ${stripeCustomerId}`);
    }
  } else {
    // No account exists - create both
    console.log(`[ensure-customer] Creating new client account and Stripe customer...`);

    // Create Stripe customer first
    const customer = await stripe.customers.create({
      email: normalizedEmail,
      name: name || undefined,
      phone: phone || undefined,
      metadata: {
        source: "lovable_billing",
      },
    });
    stripeCustomerId = customer.id;

    // Create client_accounts row
    const { data: newAccount, error: insertError } = await supabaseAdmin
      .from("client_accounts")
      .insert({
        email: normalizedEmail,
        name: name || null,
        phone: phone || null,
        stripe_customer_id: stripeCustomerId,
      })
      .select()
      .single();

    if (insertError || !newAccount) {
      console.error("Error creating client_accounts:", insertError);
      // Try to cleanup Stripe customer if DB insert fails
      try {
        await stripe.customers.del(stripeCustomerId);
      } catch (e) {
        console.error("Failed to cleanup Stripe customer:", e);
      }
      throw new Error("Failed to create client account");
    }

    clientAccountId = newAccount.id;

    // Update Stripe customer metadata with client_account_id
    await stripe.customers.update(stripeCustomerId, {
      metadata: {
        client_account_id: clientAccountId,
        source: "lovable_billing",
      },
    });

    console.log(`[ensure-customer] Created account ${clientAccountId} with Stripe customer ${stripeCustomerId}`);
  }

  // 2. Link project to client_account if not already linked
  const { data: project, error: projectError } = await supabaseAdmin
    .from("projects")
    .select("id, client_account_id")
    .eq("project_token", project_token)
    .maybeSingle();

  if (projectError) {
    console.error("Error fetching project:", projectError);
    throw new Error("Failed to fetch project");
  }

  if (!project) {
    return new Response(
      JSON.stringify({ error: "Project not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!project.client_account_id) {
    const { error: linkError } = await supabaseAdmin
      .from("projects")
      .update({ 
        client_account_id: clientAccountId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id);

    if (linkError) {
      console.error("Error linking project to client_account:", linkError);
      throw new Error("Failed to link project to client account");
    }
    console.log(`[ensure-customer] Linked project ${project_token} to account ${clientAccountId}`);
  } else if (project.client_account_id !== clientAccountId) {
    console.log(`[ensure-customer] Project already linked to different account: ${project.client_account_id}`);
  }

  return new Response(
    JSON.stringify({
      client_account_id: clientAccountId,
      stripe_customer_id: stripeCustomerId,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
