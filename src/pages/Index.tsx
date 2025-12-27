import { Link } from "react-router-dom";
import { useMemo } from "react";
import { ArrowRight, MessageSquare, FolderOpen, Sparkles, Shield, Smartphone, CreditCard, LogIn, Globe, CalendarCheck, Zap, Bot, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
              <Button asChild size="lg" className="group">
                <a href="#demos">
                  Get a Demo
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/portal">
                  Client Portal
                </Link>
              </Button>
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
      <section className="py-16 border-t border-border bg-emerald-50/30">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            {/* Left: Copy + CTA */}
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium text-accent uppercase tracking-wide mb-2">
                  Lead Handling & Follow-Ups
                </p>
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                  AI Receptionist
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Automatically respond to missed calls, texts, and form submissions — qualify leads, answer common questions, and route serious inquiries without interrupting your day.
                </p>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Instant responses to calls, texts, and form submissions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Smart qualifying questions before you ever pick up</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Seamless handoff to booking links or a real person</span>
                </li>
              </ul>
              
              <p className="text-sm text-muted-foreground">
                Works especially well for service businesses that miss calls during the day.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <a href="#demos">
                    See How It Works
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/get-demo">Add to My Project</Link>
                </Button>
              </div>
            </div>
            
            {/* Right: Video */}
            <div className="relative">
              <div className="aspect-video border border-border rounded-xl shadow-lg overflow-hidden">
                <iframe
                  src="https://www.youtube.com/embed/9A8WrDvIyQA"
                  title="AI Receptionist Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
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
              <div
                key={cap.title}
                className="bg-secondary/30 border border-border rounded-lg p-5 hover:border-accent/30 hover:bg-secondary/50 transition-all"
              >
                <cap.icon className="h-6 w-6 text-accent mb-3" />
                <h3 className="font-medium text-foreground mb-1">{cap.title}</h3>
                <p className="text-sm text-muted-foreground">{cap.description}</p>
              </div>
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
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {exampleDemos.map((project) => (
              <Link
                key={project.name}
                to={`/d/${project.token}/${project.slug}`}
                className="group block bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-accent/30 transition-all"
              >
                <div className="aspect-[4/3] bg-secondary/50 flex items-center justify-center">
                  <span className="font-serif text-3xl text-muted-foreground/40 group-hover:text-accent transition-colors">
                    {project.name.charAt(0)}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-medium text-accent uppercase tracking-wide mb-1">
                    {project.category}
                  </p>
                  <h3 className="font-serif text-lg font-bold group-hover:text-accent transition-colors">
                    {project.name}
                  </h3>
                  <span className="inline-flex items-center mt-3 text-sm text-muted-foreground group-hover:text-accent">
                    View Demo
                    <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link to="/get-demo">
                Request a Custom Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h4 className="font-medium text-foreground mb-1">Quick call</h4>
              <p className="text-sm text-muted-foreground">15 minutes to understand your business.</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h4 className="font-medium text-foreground mb-1">We build</h4>
              <p className="text-sm text-muted-foreground">Custom site + portal, no templates.</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h4 className="font-medium text-foreground mb-1">You review</h4>
              <p className="text-sm text-muted-foreground">Preview, feedback, approve — in your portal.</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center mx-auto mb-3">
                4
              </div>
              <h4 className="font-medium text-foreground mb-1">Go live</h4>
              <p className="text-sm text-muted-foreground">Launch + ongoing support included.</p>
            </div>
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
          <Button asChild variant="outline">
            <Link to="/portal">
              <LogIn className="mr-2 h-4 w-4" />
              Log in to your portal
            </Link>
          </Button>
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
