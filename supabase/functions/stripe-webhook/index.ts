import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  console.log(`Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice paid: ${invoice.id}`);

        // Update all line items with this invoice ID to paid
        const { error } = await supabaseAdmin
          .from("project_line_items")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("stripe_invoice_id", invoice.id);

        if (error) {
          console.error("Failed to update line items:", error);
        } else {
          console.log(`Updated line items for invoice ${invoice.id} to paid`);
        }

        // Also record the payment in the payments table
        if (invoice.metadata?.project_token) {
          const { data: project } = await supabaseAdmin
            .from("projects")
            .select("id")
            .eq("project_token", invoice.metadata.project_token)
            .single();

          if (project) {
            await supabaseAdmin.from("payments").insert({
              project_id: project.id,
              project_token: invoice.metadata.project_token,
              amount_cents: invoice.amount_paid,
              payment_type: "invoice",
              status: "paid",
              stripe_invoice_id: invoice.id,
              stripe_payment_intent_id: typeof invoice.payment_intent === "string" 
                ? invoice.payment_intent 
                : invoice.payment_intent?.id || null,
              stripe_event_id: event.id,
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice payment failed: ${invoice.id}`);

        // Update line items with a note about the failure
        const { error } = await supabaseAdmin
          .from("project_line_items")
          .update({
            notes: `Payment failed on ${new Date().toISOString()}`,
          })
          .eq("stripe_invoice_id", invoice.id);

        if (error) {
          console.error("Failed to update line items:", error);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription ${event.type}: ${subscription.id}`);

        // Update line items with this subscription ID
        const { error } = await supabaseAdmin
          .from("project_line_items")
          .update({
            stripe_subscription_id: subscription.id,
            status: subscription.status === "active" ? "paid" : "invoiced",
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Failed to update subscription line items:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription cancelled: ${subscription.id}`);

        const { error } = await supabaseAdmin
          .from("project_line_items")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Failed to update cancelled subscription:", error);
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout session completed: ${session.id}`);

        // Handle deposit payments
        if (session.metadata?.payment_type === "deposit" && session.metadata?.project_token) {
          console.log(`Deposit payment completed for project: ${session.metadata.project_token}`);
          
          const { error: depositError } = await supabaseAdmin
            .from("projects")
            .update({ deposit_status: "paid" })
            .eq("project_token", session.metadata.project_token);

          if (depositError) {
            console.error("Failed to update deposit status:", depositError);
          } else {
            console.log(`Updated deposit_status to 'paid' for project ${session.metadata.project_token}`);
          }

          // Also record in payments table
          const { data: project } = await supabaseAdmin
            .from("projects")
            .select("id")
            .eq("project_token", session.metadata.project_token)
            .single();

          if (project) {
            await supabaseAdmin.from("payments").insert({
              project_id: project.id,
              project_token: session.metadata.project_token,
              amount_cents: session.amount_total || 0,
              payment_type: "deposit",
              status: "paid",
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id: typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
              stripe_event_id: event.id,
            });
          }
        }

        // Handle regular line item payments
        if (session.metadata?.project_token && session.payment_intent && session.metadata?.payment_type !== "deposit") {
          const { error } = await supabaseAdmin
            .from("project_line_items")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("stripe_payment_intent_id", session.payment_intent);

          if (error) {
            console.error("Failed to update checkout line items:", error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error processing webhook: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
