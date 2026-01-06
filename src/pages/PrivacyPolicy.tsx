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
            This Privacy Policy explains how personal information is collected, used, disclosed, and protected when you visit or interact with a website built or powered by Pleasant Cove Design ("Pleasant Cove," "we," "us," or "our"), including any automated communication tools such as our AI receptionist, messaging systems, and contact forms.
          </p>

          <p className="mt-4">This policy applies to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Websites designed, hosted, or managed by Pleasant Cove Design</li>
            <li>AI-powered call answering, SMS, chat, and lead handling tools</li>
            <li>Visitors, customers, and users interacting with those websites or communication systems</li>
            <li>Client portals, demo sites, intake forms, and AI-powered features</li>
          </ul>

          <p className="mt-4">
            By using our website or services, you agree to the practices described in this Privacy Policy.
          </p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p>Depending on how you interact with the website or communication tools, we may collect:</p>

          <h3 className="text-xl font-medium mt-6 mb-3">A. Information You Provide Directly</h3>
          <p>You may provide personal or business information when you:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Fill out an intake or contact form</li>
            <li>Create or access a client portal account</li>
            <li>Communicate with us via email, phone, SMS, or chat</li>
            <li>Upload content such as logos, photos, brand assets, or written materials</li>
            <li>Share information during phone calls or text conversations</li>
          </ul>
          <p className="mt-4">This information may include:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Name and business name</li>
            <li>Email address and phone number</li>
            <li>Business or service-related inquiries</li>
            <li>Service area and business details</li>
            <li>Messages, form submissions, or chat content</li>
            <li>Uploaded files or media</li>
            <li>Login credentials (handled securely via third-party authentication providers)</li>
          </ul>

          <h3 className="text-xl font-medium mt-6 mb-3">B. Automatically Collected Information</h3>
          <p>When you visit our site or use our platform, we may automatically collect:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>IP address and approximate location (city/state level)</li>
            <li>Device type, browser, and operating system</li>
            <li>Pages visited, time spent, and interaction data</li>
            <li>Referring URLs and traffic sources</li>
          </ul>
          <p className="mt-4">This data is used for security, analytics, and service improvement.</p>

          <h3 className="text-xl font-medium mt-6 mb-3">C. Call, Text, and Messaging Data</h3>
          <p>When interacting with AI-powered features such as call answering, SMS handling, or automated follow-ups:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Call metadata (time, duration, caller number)</li>
            <li>Message content (SMS, chat, voicemail)</li>
            <li>Transcripts generated from calls or voice messages</li>
            <li>Recordings where legally permitted</li>
            <li>Message content may be analyzed to route, summarize, or respond appropriately</li>
          </ul>
          <p className="mt-4">
            We do <strong>not</strong> sell this data and do <strong>not</strong> use it to train public AI models.
          </p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Deliver and operate our services</li>
            <li>Respond to inquiries and service requests</li>
            <li>Route calls, messages, and leads appropriately</li>
            <li>Provide automated responses and follow-ups</li>
            <li>Build, design, and manage client websites</li>
            <li>Provide access to client portals and demos</li>
            <li>Improve website performance, functionality, and user experience</li>
            <li>Support client operations and customer communication</li>
            <li>Monitor system reliability, security, and abuse prevention</li>
            <li>Comply with legal and regulatory obligations</li>
          </ul>
          <p className="mt-4">We do <strong>not</strong> sell personal data.</p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. AI & Automated Communication Disclosure</h2>
          <p>Some websites use AI-powered tools to assist with:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Answering phone calls</li>
            <li>Responding to text messages or chats</li>
            <li>Collecting lead details and scheduling requests</li>
          </ul>
          <p className="mt-4">
            These systems may operate automatically based on predefined instructions set by the business. Interactions may be reviewed by the business owner or their authorized operators.
          </p>
          <p className="mt-4">By interacting with these systems, you acknowledge that:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Responses may be automated</li>
            <li>Messages and calls may be recorded or transcribed where permitted by law</li>
            <li>Information provided may be stored to fulfill service requests</li>
          </ul>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Text Messaging & TCPA Compliance</h2>
          <p>If you provide your phone number:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>You consent to receive calls or texts related to your inquiry</li>
            <li>Message frequency may vary</li>
            <li>Standard message and data rates may apply</li>
            <li>Consent is not a condition of purchase</li>
          </ul>
          <p className="mt-4">
            You may opt out of text messages at any time by replying <strong>STOP</strong>.
          </p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Authentication & Third-Party Services</h2>
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

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Sharing & Disclosure</h2>
          <p>We may share information only in the following circumstances:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>With the business you are contacting</li>
            <li>With service providers who assist in operating our platform</li>
            <li>Service providers supporting hosting, analytics, communications, or infrastructure</li>
            <li>To comply with legal obligations or lawful requests</li>
            <li>To protect our rights, users, or the integrity of our services</li>
            <li>As part of a business transfer (e.g., merger or acquisition)</li>
          </ul>
          <p className="mt-4">
            All service providers are required to maintain appropriate data protection safeguards. We do <strong>not</strong> share personal data for advertising resale purposes.
          </p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Data Storage & Retention</h2>
          <p>
            We implement reasonable administrative, technical, and physical safeguards to protect personal information. However, no system can be guaranteed 100% secure.
          </p>
          <p className="mt-4">We retain personal and project data only as long as necessary to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide services</li>
            <li>Meet legal, accounting, or security requirements</li>
            <li>Resolve disputes or enforce agreements</li>
          </ul>
          <p className="mt-4">Clients may request deletion of their data, subject to legal or contractual obligations.</p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Your Rights & Choices</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Request access to your personal information</li>
            <li>Request correction or deletion of your data</li>
            <li>Withdraw consent for certain communications</li>
            <li>Object to certain processing activities</li>
          </ul>
          <p className="mt-4">
            Requests can be directed to the business you contacted or to Pleasant Cove Design using the information below.
          </p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Cookies & Tracking Technologies</h2>
          <p>Websites may use cookies or similar technologies to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Enable core functionality</li>
            <li>Maintain sessions</li>
            <li>Analyze traffic and performance</li>
            <li>Improve user experience</li>
          </ul>
          <p className="mt-4">You can manage cookie preferences through your browser settings.</p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children.
          </p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Role of Pleasant Cove Design</h2>
          <p>Pleasant Cove Design acts as:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>A <strong>service provider / processor</strong> for client websites and AI tools</li>
            <li>Not the end business receiving inquiries unless explicitly stated</li>
          </ul>
          <p className="mt-4">Each business is responsible for how they use the tools provided.</p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised "Last updated" date. Continued use of our services after changes constitutes acceptance of the updated policy.
          </p>

          <hr className="my-8 border-border" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact Us</h2>
          <p>For privacy-related questions, contact:</p>
          <p className="mt-4">
            <strong>Pleasant Cove Design</strong>
            <br />
            📧 Email:{" "}
            <a
              href="mailto:privacy@pleasantcovedesign.com"
              className="text-primary hover:underline"
            >
              privacy@pleasantcovedesign.com
            </a>
            <br />
            🌐 Website:{" "}
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
