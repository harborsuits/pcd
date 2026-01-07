import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotificationEvent = {
  id: string;
  project_id: string;
  project_token: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

function requireSecret(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing secret: ${name}`);
  return v;
}

async function sendResendEmail(args: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = requireSecret("RESEND_API_KEY");
  const from = requireSecret("EMAIL_FROM");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error: ${res.status} ${text}`);
  }

  return res.json();
}

function renderEmail(event: NotificationEvent, appUrl: string, businessName: string) {
  const token = event.project_token;
  // Use /w/ (workspace) route instead of /p/ (old portal redirect)
  const portalLink = `${appUrl}/w/${token}`;
  const payload = event.payload as Record<string, unknown>;
  const contactName = (payload?.contact_name as string) || "";
  const serviceType = (payload?.service_type as string) || "";

  const baseStyle = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      h1 { color: #111; font-size: 24px; margin-bottom: 20px; }
      p { margin-bottom: 16px; color: #555; }
      .cta { display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 14px; }
      .highlight { background: #f8f8f8; border-radius: 8px; padding: 16px; margin: 20px 0; }
    </style>
  `;

  // Greeting with name if available
  const greeting = contactName ? `Hi ${contactName},` : "Hi there,";

  switch (event.event_type) {
    case "portal_ready": {
      // Determine what was submitted based on service_type
      let serviceDescription = "your project";
      let nextSteps = "We'll review your submission and be in touch soon.";
      
      if (serviceType === "ai_receptionist") {
        serviceDescription = "your AI receptionist setup";
        nextSteps = "We're configuring your AI based on your answers. You'll get a notification when testing begins (usually 24–48 hours).";
      } else if (serviceType === "both") {
        serviceDescription = "your website + AI receptionist bundle";
        nextSteps = "We'll start on your website design and configure your AI receptionist. You'll hear from us soon with updates on both.";
      } else if (serviceType === "website") {
        serviceDescription = "your website project";
        nextSteps = "We'll review your submission and start working on your first preview. You'll get an email when it's ready.";
      }

      return {
        subject: `Your portal is ready — ${businessName} 🎉`,
        html: `
          <!DOCTYPE html><html><head>${baseStyle}</head><body>
            <div class="container">
              <h1>Your portal is ready</h1>
              <p>${greeting}</p>
              <p>Thanks for submitting ${serviceDescription} for <strong>${businessName}</strong>. Your client portal is now set up and ready to use.</p>
              <div class="highlight">
                <p style="margin-bottom: 8px;"><strong>What happens next:</strong></p>
                <p style="margin: 0;">${nextSteps}</p>
              </div>
              <p>You can check your status, view your submitted info, and request changes anytime in your portal:</p>
              <a href="${portalLink}" class="cta">Open your portal</a>
              <p style="margin-top: 24px; font-size: 14px; color: #888;">Bookmark this link — it's your home base for this project.</p>
              <div class="footer">Pleasant Cove Design</div>
            </div>
          </body></html>
        `,
      };
    }

    case "intake_submitted":
      return {
        subject: `We received your project intake for ${businessName} ✅`,
        html: `
          <!DOCTYPE html><html><head>${baseStyle}</head><body>
            <div class="container">
              <h1>Intake received</h1>
              <p>${greeting}</p>
              <p>Thanks — we received your intake for <strong>${businessName}</strong> and we're reviewing it now.</p>
              <p>We'll reach out soon with next steps.</p>
              <a href="${portalLink}" class="cta">Open your project portal</a>
              <div class="footer">Pleasant Cove Design</div>
            </div>
          </body></html>
        `,
      };

    case "intake_approved":
      return {
        subject: `Your intake is approved — we're starting your preview 🎉`,
        html: `
          <!DOCTYPE html><html><head>${baseStyle}</head><body>
            <div class="container">
              <h1>Intake approved</h1>
              <p>${greeting}</p>
              <p>Great news! We reviewed your intake for <strong>${businessName}</strong> and we're moving into the first preview.</p>
              <p>You'll receive another email when your first preview is ready to review.</p>
              <a href="${portalLink}" class="cta">Open your project portal</a>
              <div class="footer">Pleasant Cove Design</div>
            </div>
          </body></html>
        `,
      };

    case "prototype_added":
      return {
        subject: `Your first preview is ready 👀`,
        html: `
          <!DOCTYPE html><html><head>${baseStyle}</head><body>
            <div class="container">
              <h1>Your preview is ready</h1>
              <p>${greeting}</p>
              <p>We posted a preview for <strong>${businessName}</strong>. You can review it and leave feedback directly in the portal.</p>
              <p>Click anywhere on the preview to add comments, and we'll address them in the next revision.</p>
              <a href="${portalLink}" class="cta">View preview in your portal</a>
              <div class="footer">Pleasant Cove Design</div>
            </div>
          </body></html>
        `,
      };

    case "final_approved":
      return {
        subject: `Final approved ✅ We're preparing launch`,
        html: `
          <!DOCTYPE html><html><head>${baseStyle}</head><body>
            <div class="container">
              <h1>Final approved</h1>
              <p>${greeting}</p>
              <p>Thanks for approving the final version of <strong>${businessName}</strong>. We're now preparing launch.</p>
              <p>You'll receive one more email when your site goes live.</p>
              <a href="${portalLink}" class="cta">Open your project portal</a>
              <div class="footer">Pleasant Cove Design</div>
            </div>
          </body></html>
        `,
      };

    case "launch_complete":
      return {
        subject: `Your site is live 🚀`,
        html: `
          <!DOCTYPE html><html><head>${baseStyle}</head><body>
            <div class="container">
              <h1>Launch complete</h1>
              <p>${greeting}</p>
              <p>Congratulations! <strong>${businessName}</strong> has been launched and is now live.</p>
              <p>If you need anything, just reply to this email or reach out through your portal.</p>
              <a href="${portalLink}" class="cta">Open your project portal</a>
              <div class="footer">Pleasant Cove Design</div>
            </div>
          </body></html>
        `,
      };

    case "ai_status_changed": {
      const newStatus = (payload?.new_status as string) || "";
      let statusMessage = "Your AI receptionist status has been updated.";
      
      if (newStatus === "review") {
        statusMessage = "We're reviewing your AI receptionist configuration.";
      } else if (newStatus === "setup") {
        statusMessage = "We're setting up your AI receptionist now.";
      } else if (newStatus === "testing") {
        statusMessage = "Your AI receptionist is in testing. We're making test calls to ensure everything works perfectly.";
      } else if (newStatus === "live") {
        statusMessage = "Great news! Your AI receptionist is now live and answering calls.";
      } else if (newStatus === "paused") {
        statusMessage = "Your AI receptionist has been paused. Check your portal for details.";
      }

      return {
        subject: newStatus === "live" 
          ? `Your AI receptionist is live! 🎉 — ${businessName}` 
          : `AI receptionist update — ${businessName}`,
        html: `
          <!DOCTYPE html><html><head>${baseStyle}</head><body>
            <div class="container">
              <h1>${newStatus === "live" ? "You're live!" : "Status update"}</h1>
              <p>${greeting}</p>
              <p>${statusMessage}</p>
              <a href="${portalLink}" class="cta">View in your portal</a>
              <div class="footer">Pleasant Cove Design</div>
            </div>
          </body></html>
        `,
      };
    }

    default:
      return {
        subject: `Project update for ${businessName}`,
        html: `
          <!DOCTYPE html><html><head>${baseStyle}</head><body>
            <div class="container">
              <h1>Project update</h1>
              <p>${greeting}</p>
              <p>You have a new update for <strong>${businessName}</strong> in your project portal.</p>
              <a href="${portalLink}" class="cta">Open portal</a>
              <div class="footer">Pleasant Cove Design</div>
            </div>
          </body></html>
        `,
      };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = requireSecret("SUPABASE_URL");
    const serviceKey = requireSecret("SUPABASE_SERVICE_ROLE_KEY");
    const appUrl = Deno.env.get("PUBLIC_BASE_URL") ?? "https://pleasantcove.design";

    const supabase = createClient(supabaseUrl, serviceKey);

    console.log("Email worker started - fetching unsent events...");

    // Grab a batch of unsent events
    const { data: events, error } = await supabase
      .from("notification_events")
      .select("id, project_id, project_token, event_type, payload, created_at")
      .is("sent_at", null)
      .order("created_at", { ascending: true })
      .limit(25);

    if (error) {
      console.error("Failed to fetch events:", error);
      throw error;
    }

    console.log(`Found ${events?.length || 0} unsent events`);

    const sent: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const ev of (events ?? []) as NotificationEvent[]) {
      try {
        // Resolve recipient email from projects.contact_email
        const { data: project, error: projErr } = await supabase
          .from("projects")
          .select("id, business_name, contact_email")
          .eq("id", ev.project_id)
          .maybeSingle();

        if (projErr || !project) {
          throw new Error("Project not found");
        }

        const to = project.contact_email;
        if (!to) {
          console.log(`Skipping event ${ev.id} - no contact_email on project`);
          // Mark as sent to avoid retrying (no email = nothing to do)
          await supabase
            .from("notification_events")
            .update({ sent_at: new Date().toISOString() })
            .eq("id", ev.id);
          continue;
        }

        const { subject, html } = renderEmail(ev, appUrl, project.business_name);

        console.log(`Sending email to ${to}: ${subject}`);
        await sendResendEmail({ to, subject, html });

        await supabase
          .from("notification_events")
          .update({ sent_at: new Date().toISOString() })
          .eq("id", ev.id);

        sent.push(ev.id);
        console.log(`Email sent successfully for event ${ev.id}`);
      } catch (e) {
        const errorMsg = String((e as Error)?.message ?? e);
        console.error(`Failed to process event ${ev.id}:`, errorMsg);
        failed.push({ id: ev.id, error: errorMsg });
      }
    }

    console.log(`Email worker complete: ${sent.length} sent, ${failed.length} failed`);

    return new Response(JSON.stringify({ ok: true, sent, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const errorMsg = String((e as Error)?.message ?? e);
    console.error("Email worker error:", errorMsg);
    return new Response(JSON.stringify({ ok: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
