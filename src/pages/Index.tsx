import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, FolderOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const exampleDemos = [
  {
    name: "Roofer",
    category: "Service Business",
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

const Index = () => {
  const [portalCode, setPortalCode] = useState("");

  const handlePortalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (portalCode.trim()) {
      window.location.href = `/p/${portalCode.trim()}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header - minimal, two clear actions */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
            Pleasant Cove
          </Link>
          <nav className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <a href="#demos">See a Demo</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="#portal">Client Portal</a>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero - teaches navigation */}
      <section className="flex-1 flex flex-col justify-center py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Websites with a
              <span className="block text-accent">built-in client portal.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-8">
              We build your site. You manage everything in one place — messaging, files, payments. No email chaos.
            </p>
            
            {/* Clear routing CTAs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button asChild size="lg" className="group">
                <a href="#demos">
                  See a Live Demo
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <a 
                href="#portal" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Already a client? Enter your portal →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - 3 steps */}
      <section className="py-12 border-t border-border bg-secondary/30">
        <div className="container mx-auto px-6">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-6">How it works</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-sm">1</span>
              <div>
                <p className="font-medium text-foreground">We build your site</p>
                <p className="text-sm text-muted-foreground mt-1">Custom design, no templates.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-sm">2</span>
              <div>
                <p className="font-medium text-foreground">You get a private portal</p>
                <p className="text-sm text-muted-foreground mt-1">Message us, view files, track progress.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-sm">3</span>
              <div>
                <p className="font-medium text-foreground">No email chaos</p>
                <p className="text-sm text-muted-foreground mt-1">Everything in one place, forever.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example Demos - safer framing */}
      <section id="demos" className="py-20 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">
                Example Demos
              </h2>
              <p className="text-muted-foreground">
                Click any demo to explore — no commitment, just a preview.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {exampleDemos.map((project) => (
              <Link
                key={project.name}
                to={`/d/${project.token}/${project.slug}`}
                className="group block bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-accent/30 transition-all"
              >
                <div className="aspect-[4/3] bg-secondary/50 flex items-center justify-center">
                  <span className="font-serif text-2xl text-muted-foreground/50 group-hover:text-accent transition-colors">
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
                  <Button variant="ghost" size="sm" className="mt-3 px-0 text-muted-foreground group-hover:text-accent">
                    View Demo
                    <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="about" className="py-20 bg-secondary/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Everything in one place
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No more scattered emails, Dropbox links, or missed updates. 
              Your project lives in a single, beautiful space.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="Real-Time Messaging"
              description="Chat directly with your designer. Questions, feedback, approvals — all in one thread."
            />
            <FeatureCard
              icon={<FolderOpen className="h-6 w-6" />}
              title="File Delivery"
              description="Receive your designs, assets, and documents in an organized gallery. Download anytime."
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Live Previews"
              description="See your website come together in real-time. Review, comment, and approve — before launch."
            />
          </div>
        </div>
      </section>

      {/* Client Portal Entry */}
      <section id="portal" className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Client Portal
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Already working with us? Enter your portal code to access your project.
          </p>
          <form onSubmit={handlePortalSubmit} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
            <Input
              type="text"
              placeholder="Enter your portal code"
              value={portalCode}
              onChange={(e) => setPortalCode(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!portalCode.trim()}>
              Enter Portal
            </Button>
          </form>
          <p className="text-sm text-muted-foreground mt-6">
            Not a client yet?{" "}
            <a href="mailto:hello@pleasantcove.design" className="text-accent hover:underline">
              Get in touch
            </a>
          </p>
        </div>
      </section>

      {/* Footer - Admin hidden */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-serif text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pleasant Cove Design
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="mailto:hello@pleasantcove.design" className="hover:text-foreground transition-colors">
              Contact
            </a>
            {/* Admin tucked behind subtle route - type /admin/messages to access */}
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
    <div className="w-12 h-12 bg-accent/10 text-accent rounded-lg flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="font-serif text-xl font-bold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </div>
);

export default Index;
