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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
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

      {/* 1️⃣ Hero - Simplified, one CTA */}
      <section className="pt-16 md:pt-20 pb-8 md:pb-12 relative overflow-hidden bg-gradient-to-b from-accent/10 via-background to-accent/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[620px] w-[620px] rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-background/40 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
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
            
            {/* Single dominant CTA */}
            <div>
              <Link to="/get-demo">
                <LiquidButton size="lg">
                  Get a Demo
                </LiquidButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2️⃣ AI Receptionist - The Hook */}
      <section className="pt-12 md:pt-16 pb-20 md:pb-28 bg-gradient-to-b from-accent/5 via-background to-accent/5 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Your AI Receptionist
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Never miss a lead — even when you're on a job, with a client, or after hours.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
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
            
            <div className="order-1 lg:order-2 space-y-8">
              <p className="text-muted-foreground leading-relaxed text-lg">
                Our AI Receptionist answers calls, texts, and form submissions instantly, qualifies inquiries, and handles next steps automatically.
              </p>
              
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
            </div>
          </div>
        </div>
      </section>

      {/* 3️⃣ Demos / Proof - Moved up */}
      <section id="demos" className="py-16 border-t border-border bg-card">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3">
              See It In Action
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

      {/* 4️⃣ Logos / Trust Row - Quiet Credibility */}
      <section className="py-10 border-t border-border bg-card/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <span>Made for local businesses</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              <span>Portal + messaging included</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-accent" />
              <span>Mobile-friendly</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-accent" />
              <span>No templates — custom built</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5️⃣ What We Build - Preview */}
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

      {/* 6️⃣ How It Works */}
      <section className="py-16 border-t border-border bg-secondary/20">
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

      {/* 7️⃣ Trust Strip - Compact */}
      <section className="py-6 border-t border-border bg-card/30">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* 8️⃣ Final CTA - Single, calm */}
      <section className="py-16 border-t border-border bg-gradient-to-b from-accent/5 to-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to see it for your business?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Get a personalized demo — no pressure, no commitment.
          </p>
          <Link to="/get-demo">
            <LiquidButton size="lg">
              Get Your Demo
            </LiquidButton>
          </Link>
        </div>
      </section>

      {/* Already a Client */}
      <section className="py-10 border-t border-border bg-card/50">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground mb-4">
            Already a client? <Link to="/portal" className="text-accent hover:underline">Log in to your portal</Link>
          </p>
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
