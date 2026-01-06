import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Terms of Service</h1>
          <p className="text-lg text-muted-foreground"><strong>Pleasant Cove Design</strong></p>
          <p className="text-sm text-muted-foreground"><em>Last updated: January 2026</em></p>

          <p>
            These Terms of Service ("Terms") govern your access to and use of any website, software, platform, service, or automated system provided by Pleasant Cove Design ("Pleasant Cove," "we," "us," or "our"), including but not limited to websites we design or host, client portals, messaging systems, AI receptionist services, automation tools, and related features (collectively, the "Services").
          </p>

          <p>
            By accessing or using any of the Services, you ("Client," "you," or "your") agree to be bound by these Terms. If you do not agree, do not use the Services.
          </p>

          <hr />

          <h2>1. Scope of Services</h2>
          <p>
            Pleasant Cove Design provides website design, development, hosting assistance, automation tools, and AI-powered communication services, including but not limited to:
          </p>
          <ul>
            <li>Marketing and informational websites</li>
            <li>Client portals and dashboards</li>
            <li>Forms, messaging systems, and integrations</li>
            <li>AI receptionist and automated communication tools</li>
            <li>Ongoing maintenance, updates, and support (where applicable)</li>
          </ul>
          <p>
            Specific features, deliverables, timelines, and pricing may vary by project and are governed by your individual agreement, proposal, or order.
          </p>

          <hr />

          <h2>2. Client Responsibilities</h2>
          <p>You are solely responsible for:</p>
          <ul>
            <li>The accuracy, legality, and ownership of all content you provide</li>
            <li>Ensuring that any information, images, logos, phone numbers, or data you submit do not infringe third-party rights</li>
            <li>Obtaining any required permissions, licenses, or consents related to your business operations</li>
            <li>Ensuring compliance with all applicable laws, including advertising, consumer protection, privacy, and communications laws</li>
          </ul>
          <p>
            Pleasant Cove Design does not verify the legality or compliance of your business activities unless explicitly agreed in writing.
          </p>

          <hr />

          <h2>3. AI Receptionist & Automated Communications</h2>
          <p>If you enable or use any AI receptionist, automated messaging, call handling, or follow-up features:</p>
          <ul>
            <li>You acknowledge that communications may be handled or generated automatically</li>
            <li>You understand that AI responses are generated based on configured rules and available data</li>
            <li>You are responsible for ensuring that all automated communications comply with applicable laws, including but not limited to the TCPA, CAN-SPAM Act, and state-level regulations</li>
          </ul>
          <p>
            Pleasant Cove Design does <strong>not</strong> guarantee message delivery, accuracy of AI responses, booking outcomes, or conversion results.
          </p>
          <p>AI systems may be updated, modified, or discontinued at any time.</p>

          <hr />

          <h2>4. Consent, Calls, Texts, and Messaging Compliance</h2>
          <p>You are solely responsible for:</p>
          <ul>
            <li>Obtaining proper consent from customers or leads before initiating calls, texts, or messages</li>
            <li>Ensuring opt-in, opt-out, and disclosure requirements are met</li>
            <li>Managing customer preferences and honoring unsubscribe or "STOP" requests</li>
          </ul>
          <p>
            Pleasant Cove Design acts only as a service provider and is <strong>not</strong> the sender or initiator of communications for legal purposes.
          </p>

          <hr />

          <h2>5. Hosting, Availability, and Third-Party Services</h2>
          <p>
            The Services may rely on third-party providers (including hosting, telephony, messaging, analytics, and AI services).
          </p>
          <p>
            Pleasant Cove Design does not guarantee uninterrupted availability and is not responsible for outages, delays, or failures caused by third-party services, internet disruptions, or force majeure events.
          </p>

          <hr />

          <h2>6. Intellectual Property</h2>
          <p>Unless otherwise agreed in writing:</p>
          <ul>
            <li>You retain ownership of your business content and materials</li>
            <li>Pleasant Cove Design retains ownership of underlying code, systems, templates, workflows, and proprietary tools</li>
          </ul>
          <p>
            You are granted a limited, non-exclusive license to use the delivered website or services for your business purposes only.
          </p>
          <p>
            You may not copy, resell, reverse-engineer, or distribute Pleasant Cove Design systems without permission.
          </p>

          <hr />

          <h2>7. Payments, Fees, and Billing</h2>
          <p>
            Fees, payment schedules, and billing terms are governed by your specific agreement or invoice.
          </p>
          <p>
            Failure to pay may result in suspension or termination of services, including websites, portals, or AI systems.
          </p>
          <p>All fees are non-refundable unless otherwise stated in writing.</p>

          <hr />

          <h2>8. No Guarantees or Performance Promises</h2>
          <p>Pleasant Cove Design does not guarantee:</p>
          <ul>
            <li>Increased revenue, leads, or conversions</li>
            <li>Business success or specific outcomes</li>
            <li>Search engine rankings or advertising performance</li>
            <li>Accuracy or completeness of AI-generated content</li>
          </ul>
          <p>All Services are provided "as is" and "as available."</p>

          <hr />

          <h2>9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law:</p>
          <p>
            Pleasant Cove Design shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, lost data, or business interruption.
          </p>
          <p>
            Our total liability for any claim shall not exceed the amount paid by you to Pleasant Cove Design in the twelve (12) months preceding the claim.
          </p>

          <hr />

          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Pleasant Cove Design and its owners, employees, and partners from any claims, damages, losses, or expenses arising out of:
          </p>
          <ul>
            <li>Your use of the Services</li>
            <li>Your business operations or communications</li>
            <li>Content you provide or actions you take using the Services</li>
            <li>Violations of law or third-party rights</li>
          </ul>

          <hr />

          <h2>11. Termination</h2>
          <p>We may suspend or terminate access to the Services at any time for:</p>
          <ul>
            <li>Non-payment</li>
            <li>Violation of these Terms</li>
            <li>Illegal or abusive use</li>
            <li>Risk to system integrity or third parties</li>
          </ul>
          <p>Upon termination, your right to use the Services ceases immediately.</p>

          <hr />

          <h2>12. Modifications to Services or Terms</h2>
          <p>
            Pleasant Cove Design may update or modify the Services or these Terms at any time.
          </p>
          <p>Continued use after changes constitutes acceptance of the updated Terms.</p>

          <hr />

          <h2>13. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Maine, without regard to conflict of law principles.
          </p>
          <p>
            Any disputes shall be resolved in the courts located in Maine, unless otherwise required by law.
          </p>

          <hr />

          <h2>14. Contact Information</h2>
          <p>If you have questions about these Terms, contact:</p>
          <p>
            <strong>Pleasant Cove Design</strong><br />
            📧 <a href="mailto:support@pleasantcovedesign.com">support@pleasantcovedesign.com</a><br />
            🌐 <a href="https://pleasantcovedesign.com">https://pleasantcovedesign.com</a>
          </p>

          <hr />

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              See also: <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default TermsOfService;
