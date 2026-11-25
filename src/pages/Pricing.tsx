import { MarketingFooter } from "@/components/layout/MarketingFooter";
import PricingSection from "@/components/ui/pricing-section";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";

const Pricing = () => {
  return (
    <div className="pcd-shell min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Small Business Website Pricing | Pleasant Cove Design"
        description="Custom small-business websites from $3,500. Expanded websites, online stores, and business systems are scoped by proposal. Explore hosting, website care, and focused improvements."
        path="/pricing"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ]}
      />
      <MarketingHeader activePage="pricing" />

      <main className="flex-1">
        {/* Hero */}
        <section className="pt-10 pb-2 md:pt-14 md:pb-4 relative overflow-hidden">
          <div className="relative container mx-auto px-6 text-center">
            <h1 data-speakable className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              Small-business websites and custom projects
            </h1>
            <p data-speakable className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Get a website that explains what you do, shows your work, and makes it easy to reach you. We also plan
              larger sites, stores, and connected systems around what your team needs to manage.
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
