import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Deposit calculation: 50% of tier build cost midpoint
const TIER_DEPOSITS: Record<string, number> = {
  // Bundle tiers
  starter: 50000, // 50% of $1000 midpoint = $500
  growth: 100000, // 50% of $2000 midpoint = $1000
  full_ops: 162500, // 50% of $3250 midpoint = $1625
  // Website-only tiers
  website_essential: 37500, // 50% of $750 = $375
  website_growth: 75000, // 50% of $1500 = $750
  website_premium: 125000, // 50% of $2500 = $1250
  // AI-only tiers (no upfront build cost, so use first month)
  ai_front_door: 22500, // 50% of $450 = $225
  ai_booking: 35000, // 50% of $700 = $350
  ai_full: 47500, // 50% of $950 = $475
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_token, tier_id, email, business_name, success_url, cancel_url } = await req.json();

    if (!project_token) {
      return new Response(
        JSON.stringify({ error: "project_token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate deposit amount based on tier
    const depositCents = TIER_DEPOSITS[tier_id] || TIER_DEPOSITS.starter;
    console.log(`Creating deposit checkout for project ${project_token}, tier: ${tier_id}, amount: ${depositCents}`);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch project to verify it exists
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, business_name, contact_email, contact_name")
      .eq("project_token", project_token)
      .single();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerEmail = email || project.contact_email;
    const customerBusinessName = business_name || project.business_name;

    // Check if customer already exists in Stripe
    let customerId: string | undefined;
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    // Get origin for success/cancel URLs
    const origin = req.headers.get("origin") || "https://pcd.lovable.app";

    // Build default URLs (current behavior for IntakeWizard)
    const defaultSuccessUrl = `${origin}/create-password?token=${project_token}&email=${encodeURIComponent(customerEmail || "")}&name=${encodeURIComponent(project.contact_name || "")}&business=${encodeURIComponent(customerBusinessName || "")}&deposit=paid`;
    const defaultCancelUrl = `${origin}/create-password?token=${project_token}&email=${encodeURIComponent(customerEmail || "")}&name=${encodeURIComponent(project.contact_name || "")}&business=${encodeURIComponent(customerBusinessName || "")}&deposit=cancelled`;

    console.log(`Using success_url: ${success_url || 'default'}, cancel_url: ${cancel_url || 'default'}`);

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Project Deposit – ${customerBusinessName}`,
              description: "50% deposit to begin your project. Final payment due before launch.",
            },
            unit_amount: depositCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        project_token,
        tier_id: tier_id || "unknown",
        payment_type: "deposit",
      },
      success_url: success_url || defaultSuccessUrl,
      cancel_url: cancel_url || defaultCancelUrl,
    });

    console.log(`Checkout session created: ${session.id}`);

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error creating deposit checkout: ${message}`);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
