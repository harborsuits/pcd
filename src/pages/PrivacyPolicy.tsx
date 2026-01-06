import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-3xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground mb-8">
            <strong>Pleasant Cove Design</strong>
            <br />
            <em>Last updated: January 2026</em>
          </p>

          <p>
            Pleasant Cove Design ("Pleasant Cove," "we," "us," or "our") values your privacy and is committed to protecting the personal information of our clients, visitors, and users. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you visit our website, use our services, or interact with our software, including client portals, demo sites, intake forms, and AI-powered features.
          </p>
          <p>
            By using our website or services, you agree to the practices described in this Privacy Policy.
          </p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect information in the following ways:</p>

          <h3 className="text-xl font-medium mt-6 mb-3">A. Information You Provide Directly</h3>
          <p>You may provide personal or business information when you:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Fill out an intake or contact form</li>
            <li>Create or access a client portal account</li>
            <li>Communicate with us via email, phone, SMS, or chat</li>
            <li>Upload content such as logos, photos, brand assets, or written materials</li>
          </ul>
          <p className="mt-4">This information may include:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Name</li>
            <li>Business name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Service area and business details</li>
            <li>Uploaded files or media</li>
            <li>Login credentials (handled securely via third-party authentication providers)</li>
          </ul>

          <h3 className="text-xl font-medium mt-6 mb-3">B. Automatically Collected Information</h3>
          <p>When you visit our site or use our platform, we may automatically collect:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>IP address</li>
            <li>Browser type and device information</li>
            <li>Pages visited and actions taken</li>
            <li>Referring URLs</li>
            <li>Approximate location (city/state level)</li>
          </ul>
          <p className="mt-4">This data is used for security, analytics, and service improvement.</p>

          <h3 className="text-xl font-medium mt-6 mb-3">C. AI Receptionist & Communication Data</h3>
          <p>If you enable or interact with AI-powered features (such as call answering, SMS handling, or automated follow-ups):</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Calls, messages, and voicemails may be processed to deliver the service</li>
            <li>Message content may be analyzed to route, summarize, or respond appropriately</li>
            <li>We do <strong>not</strong> sell this data and do <strong>not</strong> use it to train public AI models</li>
          </ul>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Deliver and operate our services</li>
            <li>Build, design, and manage client websites</li>
            <li>Provide access to client portals and demos</li>
            <li>Respond to inquiries and support requests</li>
            <li>Send service-related communications</li>
            <li>Improve functionality, performance, and security</li>
            <li>Comply with legal and regulatory obligations</li>
          </ul>
          <p className="mt-4">We do <strong>not</strong> sell personal data.</p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Authentication & Third-Party Services</h2>
          <p>We may use trusted third-party services to operate our platform, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Authentication providers (e.g., email login, Google sign-in)</li>
            <li>Hosting and infrastructure providers</li>
            <li>Analytics and monitoring tools</li>
            <li>Communication providers (SMS, email, voice)</li>
          </ul>
          <p className="mt-4">
            These providers only receive information necessary to perform their function and are contractually obligated to protect it.
          </p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Sharing & Disclosure</h2>
          <p>We may share information only in the following circumstances:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>With service providers who assist in operating our platform</li>
            <li>To comply with legal obligations or lawful requests</li>
            <li>To protect our rights, users, or the integrity of our services</li>
            <li>As part of a business transfer (e.g., merger or acquisition)</li>
          </ul>
          <p className="mt-4">We do <strong>not</strong> share personal data for advertising resale purposes.</p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Retention</h2>
          <p>We retain personal and project data only as long as necessary to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide services</li>
            <li>Meet legal, accounting, or security requirements</li>
            <li>Resolve disputes or enforce agreements</li>
          </ul>
          <p className="mt-4">Clients may request deletion of their data, subject to legal or contractual obligations.</p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights & Choices</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Withdraw consent for certain communications</li>
          </ul>
          <p className="mt-4">Requests can be made by contacting us using the information below.</p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Security Measures</h2>
          <p>
            We implement reasonable administrative, technical, and physical safeguards to protect your information. However, no system is completely secure, and we cannot guarantee absolute security.
          </p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Cookies & Tracking</h2>
          <p>We may use cookies or similar technologies to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Maintain sessions</li>
            <li>Improve usability</li>
            <li>Analyze traffic patterns</li>
          </ul>
          <p className="mt-4">You can control cookies through your browser settings.</p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children.
          </p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised "Last updated" date. Continued use of our services after changes constitutes acceptance of the updated policy.
          </p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or our data practices, contact us at:</p>
          <p className="mt-4">
            <strong>Pleasant Cove Design</strong>
            <br />
            Email:{" "}
            <a
              href="mailto:support@pleasantcovedesign.com"
              className="text-primary hover:underline"
            >
              support@pleasantcovedesign.com
            </a>
            <br />
            Website:{" "}
            <a
              href="https://pleasantcovedesign.com"
              className="text-primary hover:underline"
            >
              https://pleasantcovedesign.com
            </a>
          </p>

          <hr className="my-8 border-border" />

          <p className="text-sm text-muted-foreground italic">
            This Privacy Policy is provided for transparency and trust and is intended to align with modern web, software, and AI-enabled service practices.
          </p>
        </article>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
