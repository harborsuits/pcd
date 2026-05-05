import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PricingSection from "@/components/ui/pricing-section";
import { SEOHead } from "@/components/SEOHead";

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Pricing & Services"
        description="Straightforward pricing for website refreshes, one-page builds, and booking flow fixes for small businesses. No retainers, no surprises."
        path="/pricing"
      />
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
            Pleasant Cove Design
          </Link>
          <nav className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/what-we-build">What We Build</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/#demos">See a Demo</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/portal">Client Portal</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-12 pb-6 md:pt-16 md:pb-8 relative overflow-hidden">
        <div className="relative container mx-auto px-6 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            Simple pricing for small businesses
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-4">
            Two phases, no surprises:
          </p>
          <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-4 mb-6 text-left">
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <p className="text-sm font-semibold text-accent mb-1">Phase 1 — Build</p>
              <p className="text-sm text-muted-foreground">A one-time fee to design, build, and launch your site.</p>
            </div>
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <p className="text-sm font-semibold text-accent mb-1">Phase 2 — Keep it running</p>
              <p className="text-sm text-muted-foreground">A small monthly care plan for hosting, updates, and small changes.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground/70">
            Optional add-ons: booking, local SEO, AI receptionist. Most clients start with a free website review.
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
