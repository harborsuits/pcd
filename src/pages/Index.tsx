import { Link } from "react-router-dom";
import { useMemo, lazy, Suspense, useState } from "react";
import { ArrowRight, MessageSquare, FolderOpen, Sparkles, Shield, Smartphone, CreditCard, LogIn, Globe, CalendarCheck, Zap, Bot, Clock, CheckCircle, Phone, Brain, Clock3, Calendar, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { GlowCard } from "@/components/ui/spotlight-card";
import { FeaturedDemosAccordion } from "@/components/ui/interactive-image-accordion";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { canUseWebGL } from "@/lib/webgl";
import HeroStatic from "@/components/HeroStatic";
import { Footer } from "@/components/ui/footer";
import { Typewriter } from "@/components/ui/typewriter-text";
import pcdLogo from "@/assets/pcd-logo.jpeg";
import { SEOHead } from "@/components/SEOHead";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Lazy load 3D component to isolate React Three Fiber from crashing the whole app
const Hero3DModel = lazy(() => import("@/components/Hero3DModel").then(m => ({ default: m.Hero3DModel })));
const exampleDemos = [
  {
    name: "Roofer",
    category: "Contractor",
    token: "test-acme-plumbing-2024",
    slug: "acme-plumbing",
  },
  {
    name: "Restaurant",
    category: "Local Dining",
    token: "test-acme-plumbing-2024",
    slug: "acme-plumbing",
  },
  {
    name: "Salon",
    category: "Personal Care",
    token: "test-acme-plumbing-2024",
    slug: "acme-plumbing",
  },
  {
    name: "Gallery",
    category: "Art & Culture",
    token: "test-acme-plumbing-2024",
    slug: "acme-plumbing",
  },
  {
    name: "Boutique",
    category: "Retail",
    token: "test-acme-plumbing-2024",
    slug: "acme-plumbing",
  },
];

const capabilities = [
  {
    icon: Globe,
    title: "Outdated Design",
    description: "Modern, clean look that builds trust instantly.",
  },
  {
    icon: FolderOpen,
    title: "Broken Contact Flow",
    description: "Clear paths to reach you — forms, calls, booking.",
  },
  {
    icon: CalendarCheck,
    title: "Missing Booking",
    description: "Online scheduling so customers don't have to chase you.",
  },
  {
    icon: CreditCard,
    title: "Weak Mobile Experience",
    description: "Sites that work perfectly on every phone and tablet.",
  },
  {
    icon: Zap,
    title: "Poor SEO",
    description: "Show up when customers search for what you do.",
  },
  {
    icon: Bot,
    title: "No Follow-Up",
    description: "Automated responses so leads don't go cold.",
  },
];

const Index = () => {
  const webglSupported = useMemo(() => canUseWebGL(), []);

  const HeroVisual = () => {
    if (!webglSupported) return <HeroStatic />;
    return (
      <ErrorBoundary fallback={<HeroStatic />}>
        <Suspense fallback={<HeroStatic />}>
          <Hero3DModel />
        </Suspense>
      </ErrorBoundary>
    );
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Pleasant Cove Design — We Fix Websites That Cost You Customers"
        description="We help small businesses fix outdated websites, broken contact flows, and confusing customer journeys. Get a free website review."
        path="/"
      />
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-lg md:text-xl font-bold tracking-tight text-foreground whitespace-nowrap">
            Pleasant Cove Design
          </Link>
          
          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/what-we-build">Services</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/pricing">Pricing</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="whitespace-nowrap">
              <Link to="/portal">Client Portal</Link>
            </Button>
          </nav>
          
          {/* Mobile nav */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                <Link 
                  to="/what-we-build" 
                  className="text-lg font-medium hover:text-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Services
                </Link>
                <Link 
                  to="/pricing" 
                  className="text-lg font-medium hover:text-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  to="/portal" 
                  className="text-lg font-medium hover:text-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Client Portal
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* 1️⃣ HERO - AI-forward, compact */}
      <section className="pt-12 md:pt-16 pb-10 md:pb-12 relative overflow-hidden">
        <div className="relative container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-2">
              Your website is losing you customers.
            </h1>
            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold italic text-accent mb-6">
              <Typewriter
                text={[
                  "Outdated design drives visitors away.",
                  "Broken contact forms lose leads.",
                  "Confusing navigation kills conversions.",
                  "Poor mobile experience costs you jobs.",
                ]}
                speed={60}
                deleteSpeed={30}
                delay={2500}
                loop={true}
                cursor="|"
              />
            </h2>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              We fix outdated websites, broken contact flows, and confusing customer journeys for small businesses — so you stop losing the customers you're already attracting.
            </p>
          </div>
        </div>
      </section>

      {/* 2️⃣ SERVICE CHOOSER - What do you need? */}
      <section className="py-12 md:py-16 border-t border-border bg-card/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
              What's hurting your business?
            </h2>
            <p className="text-muted-foreground">
              Pick what sounds familiar — we'll show you how to fix it.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Link to="/get-demo?service=website_refresh">
              <GlowCard
                customSize
                glowColor="teal"
                className="bg-card p-6 text-center hover:bg-card/90 transition-all cursor-pointer h-full"
              >
                <div className="p-3 rounded-xl bg-accent/10 w-fit mx-auto mb-4">
                  <Bot className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">Website Refresh</h3>
                <p className="text-sm text-muted-foreground">Your site looks outdated and customers don't trust it.</p>
              </GlowCard>
            </Link>
            
            <Link to="/get-demo?service=one_page">
              <GlowCard
                customSize
                glowColor="emerald"
                className="bg-card p-6 text-center hover:bg-card/90 transition-all cursor-pointer h-full"
              >
                <div className="p-3 rounded-xl bg-accent/10 w-fit mx-auto mb-4">
                  <Globe className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">One-Page Website</h3>
                <p className="text-sm text-muted-foreground">You need a simple, professional site that actually converts.</p>
              </GlowCard>
            </Link>
            
            <Link to="/get-demo?service=contact_fix">
              <GlowCard
                customSize
                glowColor="purple"
                className="bg-card p-6 text-center hover:bg-card/90 transition-all cursor-pointer h-full border-2 border-accent/30"
              >
                <div className="p-3 rounded-xl bg-accent/10 w-fit mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">Booking & Contact Fix</h3>
                <p className="text-sm text-muted-foreground">Customers can't easily reach you or book your services.</p>
                <span className="inline-block mt-3 text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Most Popular</span>
              </GlowCard>
            </Link>
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            Need something else? <Link to="/get-demo?service=other" className="text-accent hover:underline">Tell us what you're looking for →</Link>
          </p>
        </div>
      </section>

      {/* 3️⃣ SEE IT IN ACTION (DEMOS) - Proof */}
      <section id="demos" className="py-16 md:py-20 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3">
               See what we build for businesses like yours.
             </h2>
             <p className="text-muted-foreground">
               Click any demo to explore — no commitment, just a preview.
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <FeaturedDemosAccordion />
          </div>
        </div>
      </section>

      {/* 3️⃣ AI RECEPTIONIST - Explanation */}
      <section className="py-16 md:py-24 border-t border-border overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              Problems we find on every audit
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Most small business websites have the same issues. Here's what we look for — and fix.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid lg:grid-cols-1 gap-12 lg:gap-16 items-center">
            {/* VIDEO SECTION - hidden but preserved for future use
            <div className="space-y-6">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-accent/20 bg-black max-w-2xl mx-auto lg:mx-0">
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none z-10 rounded-2xl" />
                <iframe
                  src="https://www.youtube.com/embed/9A8WrDvIyQA"
                  title="AI Receptionist Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <div className="text-center lg:text-left">
                <Link to="/get-demo?service=review">
                  <Button size="lg" className="gap-2">
                    Get Your Free Review <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground mt-2">
                  No commitment. See what's costing you customers.
                </p>
              </div>
            </div>
            END VIDEO SECTION */}
            
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <GlowCard customSize glowColor="teal" className="p-5 bg-card/60">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Phone className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Missed calls & slow response</h4>
                    <p className="text-sm text-muted-foreground">67% of customers won't call back if they don't get a response within an hour.</p>
                  </div>
                </div>
              </GlowCard>
              
              <GlowCard customSize glowColor="teal" className="p-5 bg-card/60">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Brain className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Confusing navigation</h4>
                    <p className="text-sm text-muted-foreground">If visitors can't find your services in 5 seconds, they leave.</p>
                  </div>
                </div>
              </GlowCard>
              
              <GlowCard customSize glowColor="teal" className="p-5 bg-card/60">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Clock3 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">No mobile experience</h4>
                    <p className="text-sm text-muted-foreground">Over 60% of your traffic is mobile. If it's broken, you're losing jobs.</p>
                  </div>
                </div>
              </GlowCard>
              
              <GlowCard customSize glowColor="teal" className="p-5 bg-card/60">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Calendar className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">No clear next step</h4>
                    <p className="text-sm text-muted-foreground">No booking button, no contact form, no reason to stay.</p>
                  </div>
                </div>
              </GlowCard>
            </div>

            <div className="text-center mt-8">
              <Link to="/get-demo?service=review">
                <Button size="lg" className="gap-2">
                  Get Your Free Review <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-2">
                No commitment. See what's costing you customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4️⃣ WHAT WE BUILD - Infrastructure */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3">
              What we fix
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Common issues we solve for small businesses every week.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            {capabilities.map((cap) => (
              <GlowCard
                key={cap.title}
                customSize
                glowColor="emerald"
                className="bg-card/80 p-5 hover:bg-card transition-all"
              >
                <cap.icon className="h-6 w-6 text-accent mb-3" />
                <h3 className="font-medium text-foreground mb-1">{cap.title}</h3>
                <p className="text-sm text-muted-foreground">{cap.description}</p>
              </GlowCard>
            ))}
          </div>
          
          <div className="text-center">
            <Link to="/what-we-build">
              <Button variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground">
                See all our services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              From free review to live site — simple and stress-free.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { num: 1, title: "Free review", desc: "We audit your website and show you what's costing you customers." },
              { num: 2, title: "Fix plan", desc: "You get a clear list of what to fix and what it costs." },
              { num: 3, title: "We fix it", desc: "We handle everything — design, code, launch." },
              { num: 4, title: "You grow", desc: "More calls, more bookings, more customers." },
            ].map((step) => (
              <GlowCard
                key={step.num}
                customSize
                glowColor="emerald"
                className="bg-card/60 p-5 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center mx-auto mb-3">
                  {step.num}
                </div>
                <h4 className="font-medium text-foreground mb-1">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Find out what your website is costing you.
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Get a free website review — we'll show you exactly what to fix.
          </p>
          <Link to="/get-demo?service=review">
            <LiquidButton size="lg">
              Get My Free Review
            </LiquidButton>
          </Link>
        </div>
      </section>

      {/* Already a Client */}
      <section className="py-10 border-t border-border">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground mb-4">
            Already a client? <Link to="/portal" className="text-accent hover:underline">Log in to your portal</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer
        logo={<img src={pcdLogo} alt="Pleasant Cove Design" className="h-8 w-8 rounded" />}
        brandName="Pleasant Cove Design"
        socialLinks={[]}
        mainLinks={[
          { href: "/what-we-build", label: "Services" },
          { href: "/pricing", label: "Pricing" },
          { href: "/portal", label: "Client Portal" },
          { href: "mailto:hello@pleasantcove.design", label: "Contact" },
          { href: "/operator", label: "Operator" },
        ]}
        legalLinks={[
          { href: "/privacy", label: "Privacy" },
          { href: "/terms", label: "Terms" },
        ]}
        copyright={{
          text: `© ${new Date().getFullYear()} Pleasant Cove Design`,
          license: "All rights reserved",
        }}
      />
    </div>
  );
};

export default Index;
