import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, FolderOpen, Sparkles, Shield, Smartphone, CreditCard, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero3DModel } from "@/components/Hero3DModel";
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

  return (
    <div className="min-h-screen flex flex-col bg-emerald-100/60 text-foreground">
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
              <Link to="/portal">Client Portal</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero - with 3D model */}
      <section className="flex-1 py-16 md:py-24 relative overflow-hidden bg-emerald-50/50">
        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Radial brand glow blobs */}
          <div className="absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-emerald-400/25 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[620px] w-[620px] rounded-full bg-emerald-300/20 blur-3xl" />

          {/* Soft vertical wash */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/0 via-emerald-50/40 to-emerald-100/50" />

          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.08)_100%)]" />
        </div>
        <div className="relative container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text content */}
            <div className="order-2 lg:order-1">
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                Websites with a
                <span className="block text-accent">built-in client portal.</span>
              </h1>
              
              {/* Target audience subheadline */}
              <p className="text-base md:text-lg text-accent/80 font-medium mb-4">
                For local service businesses who want fewer calls, less email, and a clearer way to work with clients.
              </p>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-8">
                We build your site. You manage everything in one place — messaging, files, payments. No email chaos.
              </p>
              
              {/* 2-path CTAs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <Button asChild size="lg" className="group">
                  <a href="#demos">
                    See a Demo
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="group">
                  <Link to="/get-demo">
                    Get My Demo
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              {/* Proof row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  <span>Made for local businesses</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  <span>Messaging + files + payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-accent" />
                  <span>Mobile-friendly</span>
                </div>
              </div>
            </div>
            
            {/* Right: 3D Model */}
            <div className="order-1 lg:order-2">
              <Hero3DModel />
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

      {/* Portal Screenshot Strip */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
              Your portal, at a glance
            </h2>
            <p className="text-muted-foreground">
              Messages, files, and payments — all in one private space.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="aspect-[4/3] bg-card border border-border rounded-lg flex flex-col items-center justify-center p-4 hover:border-accent/30 transition-colors">
              <MessageSquare className="h-8 w-8 text-accent mb-2" />
              <span className="text-sm font-medium text-foreground">Messages</span>
              <span className="text-xs text-muted-foreground">Direct chat</span>
            </div>
            <div className="aspect-[4/3] bg-card border border-border rounded-lg flex flex-col items-center justify-center p-4 hover:border-accent/30 transition-colors">
              <FolderOpen className="h-8 w-8 text-accent mb-2" />
              <span className="text-sm font-medium text-foreground">Files</span>
              <span className="text-xs text-muted-foreground">Organized gallery</span>
            </div>
            <div className="aspect-[4/3] bg-card border border-border rounded-lg flex flex-col items-center justify-center p-4 hover:border-accent/30 transition-colors">
              <CreditCard className="h-8 w-8 text-accent mb-2" />
              <span className="text-sm font-medium text-foreground">Payments</span>
              <span className="text-xs text-muted-foreground">One-click invoices</span>
            </div>
          </div>
        </div>
      </section>

      {/* Client Portal Entry - simplified, no code needed */}
      <section id="portal" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Already a client?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Access your portal using the link we sent you, or log in below.
          </p>
          <Button asChild size="lg" variant="outline" className="group">
            <Link to="/portal">
              <LogIn className="mr-2 h-4 w-4" />
              Log in to your portal
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-6">
            Not a client yet?{" "}
            <Link to="/get-demo" className="text-accent hover:underline">
              Get a free demo
            </Link>
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
            <Link to="/operator" className="hover:text-foreground transition-colors opacity-50 hover:opacity-100">
              Operator
            </Link>
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
