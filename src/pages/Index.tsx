import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, FolderOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
            Pleasant Cove
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link to="#work" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Work
            </Link>
            <Link to="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/p/test-acme-plumbing-2024" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Client Portal
            </Link>
          </nav>
          <Button asChild variant="default" size="sm">
            <Link to="/p/test-acme-plumbing-2024">
              Sign In
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col justify-center py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <p className="text-accent font-medium text-sm tracking-wide uppercase mb-4">
              Web Design Studio — Maine
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Websites that feel like
              <span className="block text-accent">home.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-8">
              We craft thoughtful, modern websites for small businesses across New England — 
              with built-in client portals, real-time messaging, and seamless file delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="group">
                <Link to="/d/test-acme-plumbing-2024/acme-plumbing">
                  See a Live Demo
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/p/test-acme-plumbing-2024">
                  Enter Your Portal
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="work" className="py-20 bg-secondary/50">
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

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to start your project?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            {"Let's"} build something beautiful together. Reach out and {"we'll"} set up your client portal.
          </p>
          <Button asChild size="lg">
            <a href="mailto:hello@pleasantcove.design">
              Get in Touch
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-serif text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pleasant Cove Design
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/admin/messages" className="hover:text-foreground transition-colors">
              Admin
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
