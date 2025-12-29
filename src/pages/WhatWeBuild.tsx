import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import InteractiveBentoGallery from "@/components/ui/interactive-bento-gallery";
import { StaggerFeatureCarousel } from "@/components/ui/stagger-feature-carousel";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";
import websitesConvertVideo from "@/assets/videos/websites-convert.mp4";

const mediaItems = [
  {
    id: 1,
    type: "video" as const,
    title: "Websites that convert",
    desc: "Clean design, fast load, mobile-first.",
    url: websitesConvertVideo,
    span: "md:col-span-2 md:row-span-2 col-span-2 row-span-2",
  },
  {
    id: 2,
    type: "image" as const,
    title: "AI Front Door",
    desc: "Answer calls, capture info, route leads.",
    url: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1400&q=80",
    span: "md:col-span-2 md:row-span-1 col-span-1 row-span-1",
  },
  {
    id: 3,
    type: "image" as const,
    title: "Booking + Intake",
    desc: "Rules-based scheduling and forms.",
    url: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&q=80",
    span: "md:col-span-1 md:row-span-1 col-span-1 row-span-1",
  },
  {
    id: 4,
    type: "image" as const,
    title: "Client Portals",
    desc: "One shared place for approvals and updates.",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
    span: "md:col-span-1 md:row-span-1 col-span-1 row-span-1",
  },
  {
    id: 5,
    type: "image" as const,
    title: "Automations",
    desc: "Reminders, follow-ups, and workflows.",
    url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
    span: "md:col-span-2 md:row-span-1 col-span-1 row-span-1",
  },
  {
    id: 6,
    type: "image" as const,
    title: "Design systems",
    desc: "Consistent brand, consistent trust.",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
    span: "md:col-span-2 md:row-span-1 col-span-1 row-span-1",
  },
];


const WhatWeBuild = () => {
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

      {/* Back Link */}
      <div className="container mx-auto px-6 pt-8">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to home
        </Link>
      </div>

      {/* Bento Gallery Hero */}
      <InteractiveBentoGallery
        mediaItems={mediaItems}
        title="What We Build"
        description="A complete system for client-facing work. Everything you need to look professional and run smoothly — nothing you don't."
      />

      {/* Feature Carousel - What We Build */}
      <StaggerFeatureCarousel />

      {/* Testimonials */}
      <StaggerTestimonials />

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
