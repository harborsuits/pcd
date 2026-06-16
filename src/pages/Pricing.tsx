import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PricingSection from "@/components/ui/pricing-section";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Pricing & Services"
        description="Straightforward pricing for website refreshes, one-page builds, and booking flow fixes for small businesses. No retainers, no surprises."
        path="/pricing"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ]}
        faq={[
          {
            question: "How much does a small business website cost?",
            answer:
              "Most small-business websites from Pleasant Cove Design land between $1,500 and $6,500 for the one-time build, depending on page count, features, and whether AI or booking is included. After launch, you choose either a month-to-month care plan ($125–$175/mo) to keep the site healthy, or a full bundle ($395–$895/mo) that adds AI, booking, and ongoing improvements.",
          },
          {
            question: "Are there long-term contracts?",
            answer:
              "No. The build is a one-time project fee, and every monthly plan — care or bundle — is month-to-month with no minimum term. You can cancel any time and keep your site.",
          },
          {
            question: "What's included in the monthly care plan?",
            answer:
              "Care plans start at $125/mo and cover hosting, SSL, security and software updates, daily backups, uptime monitoring, and a set amount of small content changes each month. The $175/mo Growth tier adds priority change requests and a monthly performance review.",
          },
          {
            question: "Do you offer free quotes or website reviews?",
            answer:
              "Yes. Pleasant Cove Design offers a free website review that walks through your current site and names the specific issues costing you customers, with a clear fix plan and no obligation to hire us afterwards.",
          },
        ]}

      />
      <MarketingHeader activePage="pricing" />

      {/* Hero */}
      <section className="pt-12 pb-6 md:pt-16 md:pb-8 relative overflow-hidden">
        <div className="relative container mx-auto px-6 text-center">
          <h1 data-speakable className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            Simple pricing for small businesses
          </h1>
          <p data-speakable className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-4">
            Two parts: a one-time build to launch your site or system, and a small monthly plan that keeps it running and improving.
          </p>
          <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-4 mb-6 text-left">
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <p className="text-sm font-semibold text-accent mb-1">One-time build</p>
              <p className="text-sm text-muted-foreground">Designing, building, and launching your website or system. Paid once.</p>
            </div>
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <p className="text-sm font-semibold text-accent mb-1">Monthly plan</p>
              <p className="text-sm text-muted-foreground">Hosting, updates, small changes, and — on bundles — AI, booking, and ongoing tuning. Cancel anytime.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground/70">
            Care plans from $125/mo · Full bundles from $395/mo · À la carte services available
          </p>

        </div>
      </section>

      {/* Main Pricing Section */}
      <PricingSection />


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
