import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PricingSection from "@/components/ui/pricing-section";

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-accent/5 text-foreground">
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
            Pricing & Services
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-2">
            Straightforward pricing for real businesses.
          </p>
          <p className="text-base text-muted-foreground/80 max-w-2xl mx-auto mb-3">
            Digital infrastructure, websites, and AI reception services designed for local businesses.
            Choose a bundle that matches your call volume, booking needs, and how much you want automated.
          </p>
          <p className="text-sm text-muted-foreground/70">
            Most clients start with a free demo — then choose a plan that fits.
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
