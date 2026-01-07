import { Link } from "react-router-dom";
import { useMemo, lazy, Suspense } from "react";
import { ArrowRight, MessageSquare, FolderOpen, Sparkles, Shield, Smartphone, CreditCard, LogIn, Globe, CalendarCheck, Zap, Bot, Clock, CheckCircle, Phone, Brain, Clock3, Calendar } from "lucide-react";
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
    title: "Websites",
    description: "Fast, modern, mobile-first — built to convert.",
  },
  {
    icon: FolderOpen,
    title: "Client Portal",
    description: "Messages, files, approvals — all in one place.",
  },
  {
    icon: CalendarCheck,
    title: "Booking + Intake",
    description: "Forms, scheduling, and smart routing.",
  },
  {
    icon: CreditCard,
    title: "Payments",
    description: "Invoices, deposits, and payment links.",
  },
  {
    icon: Zap,
    title: "Automations",
    description: "Follow-ups, reminders, and lead capture.",
  },
  {
    icon: Bot,
    title: "AI Receptionist",
    description: "Smart lead handling and follow-ups.",
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

  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Pleasant Cove Design — Web Design Studio"
        description="Modern New England web design studio helping owner-operated businesses turn missed calls and inquiries into booked clients with smart, automated websites."
        path="/"
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
              <Link to="/pricing">Pricing</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/portal">Client Portal</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* 1️⃣ HERO - AI-forward, compact */}
      <section className="pt-12 md:pt-16 pb-10 md:pb-12 relative overflow-hidden">
        <div className="relative container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-2">
              Never miss a lead again.
            </h1>
            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold italic text-accent mb-6">
              <Typewriter
                text={[
                  "With leads captured, qualified, and followed up automatically.",
                  "With missed calls turned into booked jobs.",
                  "With instant replies to every call and text.",
                  "With systems that convert visitors into customers.",
                ]}
                speed={60}
                deleteSpeed={30}
                delay={2500}
                loop={true}
                cursor="|"
              />
            </h2>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              We design custom websites for service businesses and power them with an AI receptionist that answers calls, texts, and forms automatically.
            </p>
          </div>
        </div>
      </section>

      {/* 2️⃣ SERVICE CHOOSER - What do you need? */}
      <section className="py-12 md:py-16 border-t border-border bg-card/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
              What are you looking for?
            </h2>
            <p className="text-muted-foreground">
              Choose your starting point — we'll handle the rest.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Link to="/get-demo?service=ai_receptionist">
              <GlowCard
                customSize
                glowColor="teal"
                className="bg-card p-6 text-center hover:bg-card/90 transition-all cursor-pointer h-full"
              >
                <div className="p-3 rounded-xl bg-accent/10 w-fit mx-auto mb-4">
                  <Bot className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">AI Receptionist</h3>
                <p className="text-sm text-muted-foreground">Answer calls, texts & forms 24/7. Start capturing leads instantly.</p>
              </GlowCard>
            </Link>
            
            <Link to="/get-demo?service=website">
              <GlowCard
                customSize
                glowColor="emerald"
                className="bg-card p-6 text-center hover:bg-card/90 transition-all cursor-pointer h-full"
              >
                <div className="p-3 rounded-xl bg-accent/10 w-fit mx-auto mb-4">
                  <Globe className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">Website</h3>
                <p className="text-sm text-muted-foreground">A fast, modern site that converts visitors into customers.</p>
              </GlowCard>
            </Link>
            
            <Link to="/get-demo?service=both">
              <GlowCard
                customSize
                glowColor="purple"
                className="bg-card p-6 text-center hover:bg-card/90 transition-all cursor-pointer h-full border-2 border-accent/30"
              >
                <div className="p-3 rounded-xl bg-accent/10 w-fit mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">Full Package</h3>
                <p className="text-sm text-muted-foreground">Website + AI Receptionist — the complete lead-capture system.</p>
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
              Real websites. Smarter lead handling.
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
              Your AI Front Desk
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Answers calls, texts, and forms instantly. Qualifies leads. Handles next steps automatically — 24/7.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-accent/20">
                <iframe
                  src="https://www.youtube.com/embed/9A8WrDvIyQA"
                  title="AI Receptionist Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <GlowCard customSize glowColor="teal" className="p-5 bg-card/60">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Phone className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Instant Response</h4>
                    <p className="text-sm text-muted-foreground">Responds to missed calls, texts, and forms in seconds — not hours.</p>
                  </div>
                </div>
              </GlowCard>
              
              <GlowCard customSize glowColor="teal" className="p-5 bg-card/60">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Brain className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Smart Qualification</h4>
                    <p className="text-sm text-muted-foreground">Asks the right questions so you only deal with serious leads.</p>
                  </div>
                </div>
              </GlowCard>
              
              <GlowCard customSize glowColor="teal" className="p-5 bg-card/60">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Clock3 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">24/7 Availability</h4>
                    <p className="text-sm text-muted-foreground">Schedules appointments or escalates priority inquiries automatically.</p>
                  </div>
                </div>
              </GlowCard>
              
              {/* Roadmap teaser */}
              <GlowCard customSize glowColor="teal" className="p-5 bg-card/40 border-dashed">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-muted-foreground">Appointment Booking</h4>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Coming Soon</span>
                    </div>
                    <p className="text-sm text-muted-foreground/80">Book directly into your existing CRM — or one we build for you.</p>
                  </div>
                </div>
              </GlowCard>
            </div>
          </div>
        </div>
      </section>

      {/* 4️⃣ WHAT WE BUILD - Infrastructure */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3">
              What We Build
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything a local service business needs to look professional and run smoothly.
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
                See Everything We Build
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
              From first call to live site — simple and stress-free.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { num: 1, title: "Quick call", desc: "15 minutes to understand your business." },
              { num: 2, title: "We build", desc: "Custom site + portal, no templates." },
              { num: 3, title: "You review", desc: "Preview, feedback, approve — in your portal." },
              { num: 4, title: "Go live", desc: "Launch + ongoing support included." },
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
            Ready to see it for your business?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Get a personalized website demo — no pressure, no commitment.
          </p>
          <Link to="/get-demo?service=demo">
            <LiquidButton size="lg">
              See a Demo
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
          { href: "/what-we-build", label: "What We Build" },
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
