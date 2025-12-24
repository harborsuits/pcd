import { Link } from "react-router-dom";
import { ArrowRight, Globe, FolderOpen, CalendarCheck, Zap, Bot, Puzzle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  {
    icon: Globe,
    title: "Websites",
    description: "Your public face. Fast, modern, mobile-first.",
    details: [
      "Marketing sites that load instantly",
      "Landing pages built to convert",
      "Content pages that are easy to update",
      "SEO-ready structure from day one",
    ],
  },
  {
    icon: FolderOpen,
    title: "Client Portals",
    description: "Your private workspace with clients.",
    details: [
      "Messaging without email chaos",
      "File sharing with version history",
      "Payment collection in one place",
      "Project progress clients can see",
    ],
  },
  {
    icon: CalendarCheck,
    title: "Booking & Intake",
    description: "Capture leads and schedule without back-and-forth.",
    details: [
      "Custom intake forms",
      "Calendar scheduling",
      "Smart routing to the right person",
      "Instant confirmations",
    ],
  },
  {
    icon: Zap,
    title: "Automations",
    description: "Let the system handle the repetitive stuff.",
    details: [
      "Follow-up sequences",
      "Appointment reminders",
      "Status update notifications",
      "Lead capture workflows",
    ],
  },
  {
    icon: Bot,
    title: "AI Receptionist",
    badge: "Optional Add-on",
    description: "For businesses that want fewer interruptions.",
    details: [
      "Auto-replies to common questions",
      "Missed call follow-ups",
      "Smart call routing",
      "Works alongside your personal touch",
    ],
  },
  {
    icon: Puzzle,
    title: "Custom & Integrations",
    description: "When you need something specific.",
    details: [
      "CRM connections",
      "API integrations",
      "Custom workflows",
      "Special business logic",
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
