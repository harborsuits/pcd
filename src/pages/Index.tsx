import { Link } from "react-router-dom";
import { useMemo } from "react";
import { ArrowRight, MessageSquare, FolderOpen, Sparkles, Shield, Smartphone, CreditCard, LogIn, Globe, CalendarCheck, Zap, Bot, Clock, CheckCircle, Phone, Brain, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { GlowCard } from "@/components/ui/spotlight-card";
import { FeaturedDemosAccordion } from "@/components/ui/interactive-image-accordion";
import { Hero3DModel } from "@/components/Hero3DModel";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { canUseWebGL } from "@/lib/webgl";
import HeroStatic from "@/components/HeroStatic";
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
        <Hero3DModel />
      </ErrorBoundary>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-emerald-100/60 text-foreground">
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
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <a href="#demos">Demos</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/portal">Client Portal</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero - Text first, then 3D carousel as proof */}
      <section className="py-16 md:py-20 relative overflow-hidden bg-emerald-50/50">
        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-emerald-400/25 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[620px] w-[620px] rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/0 via-emerald-50/40 to-emerald-100/50" />
        </div>
        
        <div className="relative container mx-auto px-6">
          {/* Hero Text - Centered */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              Websites with a
              <span className="block text-accent">built-in client portal.</span>
            </h1>
            
            <p className="text-base md:text-lg text-accent/80 font-medium mb-4">
              For modern service businesses that want fewer emails, fewer calls, and a cleaner way to work with clients.
            </p>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
              We build your site. You manage everything in one place — messaging, files, payments.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <a href="#demos">
                <LiquidButton size="lg">
                  Get a Demo
                </LiquidButton>
              </a>
              <Link to="/portal">
                <LiquidButton size="lg" className="group">
                  Client Portal
                </LiquidButton>
              </Link>
            </div>
            
            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                <span>Made for local businesses</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-accent" />
                <span>Portal + messaging</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-accent" />
                <span>Mobile-friendly</span>
              </div>
            </div>
          </div>
          
          {/* 3D Carousel - as proof gallery */}
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">Examples of branded client portals</p>
              <p className="text-xs text-accent">Different industries. Same system.</p>
            </div>
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* AI Receptionist Highlight Section */}
      <section className="py-20 md:py-28 border-t border-border bg-gradient-to-b from-emerald-50/30 via-background to-emerald-50/20 overflow-hidden">
        <div className="container mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Bot className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">AI-Powered Lead Handling</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Your AI Receptionist
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Never miss a lead — even when you're on a job, with a client, or after hours.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Video */}
            <div className="order-2 lg:order-1">
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
            
            {/* Right: Features + CTA */}
            <div className="order-1 lg:order-2 space-y-8">
              <p className="text-muted-foreground leading-relaxed text-lg">
                Our AI Receptionist answers calls, texts, and form submissions instantly, qualifies inquiries, and handles next steps automatically.
              </p>
              
              {/* Feature Cards */}
              <div className="space-y-4">
                <GlowCard customSize glowColor="teal" className="p-5 bg-card/60">
                  <div className="flex items-start gap-4">
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
                  <div className="flex items-start gap-4">
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
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Clock3 className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">24/7 Availability</h4>
                      <p className="text-sm text-muted-foreground">Schedules appointments or escalates priority inquiries automatically.</p>
                    </div>
                  </div>
                </GlowCard>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <a href="#demos">
                  <LiquidButton variant="teal" size="lg">
                    See How It Works
                  </LiquidButton>
                </a>
                <Link to="/get-demo">
                  <LiquidButton variant="teal" size="lg" className="group">
                    Add to My Project
                  </LiquidButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Build - Capabilities Grid */}
      <section className="py-16 border-t border-border bg-card">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3">
              What We Build
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything a local service business needs to look professional and run smoothly.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
        </div>
      </section>

      {/* Featured Demos */}
      <section id="demos" className="py-16 border-t border-border bg-secondary/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3">
              Featured Demos
            </h2>
            <p className="text-muted-foreground">
              Click any demo to explore — no commitment, just a preview.
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <FeaturedDemosAccordion />
          </div>
          
          <div className="text-center mt-10">
            <Link to="/get-demo">
              <LiquidButton size="lg">
                Request a Custom Demo
              </LiquidButton>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - 4 Steps */}
      <section className="py-16 border-t border-border bg-card">
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

      {/* Already a Client */}
      <section className="py-12 border-t border-border bg-secondary/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-2xl font-bold mb-2">
            Already a client?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Access your portal using the link we sent you, or log in below.
          </p>
          <Link to="/portal">
            <LiquidButton size="lg" className="group">
              <LogIn className="mr-2 h-4 w-4" />
              Log in to your portal
            </LiquidButton>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-serif text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pleasant Cove Design
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="mailto:hello@pleasantcove.design" className="hover:text-foreground transition-colors">
              Contact
            </a>
            <Link to="/operator" className="hover:text-foreground transition-colors opacity-50 hover:opacity-100">
              Operator
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
