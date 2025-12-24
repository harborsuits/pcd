import { Link } from "react-router-dom";
import { ArrowRight, Globe, FolderOpen, CalendarCheck, Zap, Bot, Puzzle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  {
    icon: Globe,
    title: "Websites",
    description: "Your public face. Fast, modern, and built to convert.",
    details: [
      "Marketing sites that explain what you do in seconds, not paragraphs",
      "Service pages designed to answer questions before the phone rings",
      "Simple landing pages for specific offers, locations, or campaigns",
      "Clean, SEO-ready foundations without bloated plugins",
    ],
  },
  {
    icon: FolderOpen,
    title: "Client Portals",
    description: "A private workspace for you and your clients.",
    details: [
      "One shared place for messages, files, approvals, and updates",
      "No more email threads, lost attachments, or 'did you see this?'",
      "Clients always know where to go — and what's next",
      "Built to scale from one project to many",
    ],
  },
  {
    icon: CalendarCheck,
    title: "Booking & Intake",
    description: "Structured information instead of back-and-forth.",
    details: [
      "Smart intake forms that gather the right info upfront",
      "Booking flows that respect your availability and rules",
      "Automatic routing based on service type or request",
      "You start projects with context, not confusion",
    ],
  },
  {
    icon: Zap,
    title: "Automations",
    description: "Small automations that remove friction — not replace you.",
    details: [
      "Automatic confirmations and status updates",
      "File upload reminders when something is missing",
      "Internal notifications so nothing slips through cracks",
      "Less manual admin, more focused work",
    ],
  },
  {
    icon: Bot,
    title: "AI Receptionist",
    badge: "Optional Add-on",
    description: "An assistant for first contact — not a replacement for you.",
    details: [
      "Answers common questions instantly",
      "Collects basic info before handing things off",
      "Helps reduce interruptions during focused work",
      "Always clearly identified as automated",
    ],
  },
  {
    icon: Puzzle,
    title: "Custom & Integrations",
    description: "Built around how you actually work.",
    details: [
      "Integrations with tools you already use",
      "Custom workflows for unique processes",
      "Room to grow as your business evolves",
      "The system adapts to your business — not the other way around",
    ],
  },
];

const WhatWeBuild = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
            Pleasant Cove
          </Link>
          <nav className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/pricing">Pricing</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/demos">Demos</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/portal">Client Portal</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-20 border-b border-border bg-secondary/20">
        <div className="container mx-auto px-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to home
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4">
            What We Build
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            A complete system for client-facing work. Everything you need to look professional and run smoothly — nothing you don't.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="space-y-16">
            {sections.map((section, index) => (
              <div 
                key={section.title}
                className="grid md:grid-cols-2 gap-8 items-start"
              >
                <div className={index % 2 === 1 ? "md:order-2" : ""}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <section.icon className="h-5 w-5 text-accent" />
                    </div>
                    <h2 className="font-serif text-2xl font-bold">{section.title}</h2>
                    {section.badge && (
                      <span className="text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded-full">
                        {section.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-lg mb-4">
                    {section.description}
                  </p>
                </div>
                <div className={`bg-card border border-border rounded-lg p-6 ${index % 2 === 1 ? "md:order-1" : ""}`}>
                  <ul className="space-y-3">
                    {section.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                        <span className="text-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border bg-accent/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">
            Ready to see it in action?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Explore our demos or request a custom preview for your business.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="group">
              <Link to="/get-demo">
                Get a Demo
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/demos">See Examples</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card mt-auto">
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

export default WhatWeBuild;
