import { MarketingFooter } from "@/components/layout/MarketingFooter";
import PricingSection from "@/components/ui/pricing-section";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";

const Pricing = () => {
  return (
    <div className="pcd-shell min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Small Business Website Pricing | Pleasant Cove Design"
        description="Clear starting prices for small business websites: online brochures from $1,500, custom sites from $3,500. Hosting $70/mo, website care $150/mo. AI billed by setup, management, and usage."
        path="/pricing"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
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
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-semibold text-accent mb-1">One-time build</p>
              <p className="text-sm text-muted-foreground">Design, content, and launch of the website or system itself. Paid once, you own it.</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-semibold text-accent mb-1">Ongoing monthly</p>
              <p className="text-sm text-muted-foreground">Website care keeps your site hosted, maintained, and updated. AI services are billed as setup, management, and actual usage.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Online brochure from $1,500 · Custom website from $3,500 · Hosting $70/mo · Website care $150/mo
          </p>

        </div>
      </section>


      {/* Main Pricing Section */}
      <PricingSection />
      </main>

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
};

export default Pricing;
