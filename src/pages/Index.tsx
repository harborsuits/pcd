import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, FolderOpen, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const featuredWork = [
  {
    name: "Acme Plumbing",
    category: "Service Business",
    token: "test-acme-plumbing-2024",
    slug: "acme-plumbing",
  },
  {
    name: "Harbor Electric",
    category: "Coastal Trades",
    token: "test-acme-plumbing-2024",
    slug: "acme-plumbing",
  },
  {
    name: "Tide & Table",
    category: "Local Restaurant",
    token: "test-acme-plumbing-2024",
    slug: "acme-plumbing",
  },
];

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
            <a href="#work" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Work
            </a>
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
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
            {/* Proof element */}
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-6">
              <MapPin className="h-4 w-4 text-accent" />
              <span>Boothbay Harbor, Maine</span>
              <span className="mx-2 text-border">·</span>
              <span>Websites + portals + messaging in one system</span>
            </div>
            
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Websites with a
              <span className="block text-accent">built-in client portal.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-8">
              A calmer way to build a website. Real-time messaging, file delivery, and live previews — 
              no scattered emails or Dropbox links.
            </p>
            
            {/* Asymmetrical CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="group">
                <Link to="/d/test-acme-plumbing-2024/acme-plumbing">
                  See a Live Demo
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground">
                <Link to="/p/test-acme-plumbing-2024">
                  Enter Your Portal
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Work Section */}
      <section id="work" className="py-20 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">
                Recent work
              </h2>
              <p className="text-muted-foreground">
                Live sites with client portals built in.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredWork.map((project) => (
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
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                    View demo
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </p>
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
