import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PricingSection from "@/components/ui/pricing-section";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Small Business Website Pricing | Pleasant Cove Design"
        description="Clear starting prices for small business websites: online brochures from $1,500, custom sites from $3,500. Website care from $150/mo. AI billed by setup, management, and usage."
        path="/pricing"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ]}
        faq={[
          {
            question: "How much does a small business website cost?",
            answer:
              "Pleasant Cove Design starts at $1,500 for a simple one-page online brochure, $3,500 for a custom business website, and $6,000 for expanded sites and online stores. Larger projects and custom business systems are quoted individually. Your final price depends on design, content, functionality, integrations, and support, and you receive a fixed proposal with clear deliverables before work begins.",
          },
          {
            question: "What is included in the $1,500 online brochure?",
            answer:
              "One straightforward page using your supplied business information, logo, and photos: a brief introduction, a service overview, a small selection of images, phone, email and location details, a mobile-friendly layout, and basic technical SEO. Extra pages, booking systems, custom forms, integrations, and extensive copywriting are quoted separately.",
          },
          {
            question: "What does the monthly care plan cover?",
            answer:
              "Website Care starts at $150/mo and covers standard hosting within your proposal allowance, uptime monitoring, recoverable backups, routine maintenance, scheduled checks of key contact features, up to 30 minutes of minor content edits per month, and business-hours support. Managed Website Care starts at $275/mo with up to 90 minutes total of minor edits per month, priority scheduling, and a quarterly performance review.",
          },
          {
            question: "How is the AI receptionist billed?",
            answer:
              "AI services are billed in three parts: a one-time setup and implementation fee, a monthly management fee based on scope, and usage billed at the rates agreed in your proposal — call minutes for the receptionist, messages for messaging, or defined workflow runs for automations. There is no flat monthly fee that includes unlimited AI activity.",
          },
          {
            question: "What happens if my business uses more than expected?",
            answer:
              "Additional usage is billed at the rates agreed before your service starts. Your proposal explains any included allowance, additional usage charges, and available spending controls, so you can choose an arrangement that fits your business.",
          },
          {
            question: "Are there long-term contracts?",
            answer:
              "No. The build is a one-time project fee and care plans are month-to-month with no minimum term. You can cancel any time and keep your site.",
          },
        ]}

      />
      <MarketingHeader activePage="pricing" />

      <main className="flex-1">
      {/* Hero */}
      <section className="pt-12 pb-6 md:pt-16 md:pb-8 relative overflow-hidden">
        <div className="relative container mx-auto px-6 text-center">
          <h1 data-speakable className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            Practical starting points. Pricing built around your project.
          </h1>
          <p data-speakable className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-4">
            From a simple online brochure to a complete website or connected business system, we scope the work around what your business needs.
          </p>
          <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-4 mb-6 text-left">
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <p className="text-sm font-semibold text-accent mb-1">One-time build</p>
              <p className="text-sm text-muted-foreground">Design, content, and launch of the website or system itself. Paid once, you own it.</p>
            </div>
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <p className="text-sm font-semibold text-accent mb-1">Ongoing monthly</p>
              <p className="text-sm text-muted-foreground">Website care keeps your site hosted, maintained, and updated. AI services are billed as setup, management, and actual usage.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground/70">
            Online brochure from $1,500 · Custom website from $3,500 · Website care from $150/mo
          </p>

        </div>
      </section>


      {/* Main Pricing Section */}
      <PricingSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-serif text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pleasant Cove Design
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/midcoast-maine" className="hover:text-foreground transition-colors">
              Midcoast Maine
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <a href="mailto:hello@pleasantcove.design" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
