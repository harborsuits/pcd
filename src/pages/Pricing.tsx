import { Link } from "react-router-dom";
import { ArrowRight, Check, Phone, Globe, Bot, Wrench, Layers, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-emerald-100/60 text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
            Pleasant Cove
          </Link>
          <nav className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/#demos">See a Demo</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/portal">Client Portal</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-20 relative overflow-hidden bg-emerald-50/50">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-emerald-400/25 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[620px] w-[620px] rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/0 via-emerald-50/40 to-emerald-100/50" />
        </div>
        <div className="relative container mx-auto px-6 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            Pricing & Services
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Digital infrastructure, websites & AI reception services for local businesses.
          </p>
        </div>
      </section>

      {/* I. Website Builds */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center">
              <Globe className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold">Website Builds</h2>
            <span className="text-sm text-muted-foreground">(One-Time)</span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <PricingCard
              title="Essential Website"
              price="$950 – $1,500"
              description="Professional foundation for your business"
              features={[
                "Up to 5 page professional website",
                "Mobile-friendly, fast loading",
                "Click-to-call & contact forms",
                "Google Maps embed",
                "Basic SEO setup",
                "Clean, modern layout",
                "Simple, reliable build stack"
              ]}
            />
            <PricingCard
              title="Growth Website"
              price="$1,500 – $2,500"
              description="Designed for businesses that want consistent inbound leads, not just an online presence."
              featured
              features={[
                "Everything in Essential",
                "Conversion-focused layout",
                "Booking or intake integration",
                "Lead capture flows",
                "Light animations or transitions",
                "CRM or lead tracking setup"
              ]}
            />
            <PricingCard
              title="Premium / Interactive"
              price="$3,000 – $5,000+"
              description="Maximum polish and custom experiences"
              features={[
                "Everything in Growth",
                "Advanced animations or interactions",
                "Custom user flows",
                "CRM pipelines & dashboards",
                "Higher design polish"
              ]}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-6 text-center">
            Note: Custom illustration, 3D assets, or heavy animation increase cost.<br />
            Final pricing depends on scope, integrations, and content readiness.
          </p>
        </div>
      </section>

      {/* II. Hosting & Website Care */}
      <section className="py-16 bg-secondary/30 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center">
              <Wrench className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold">Managed Hosting & Maintenance</h2>
            <span className="text-sm text-muted-foreground">(Monthly)</span>
          </div>
          
          <Card className="max-w-xl">
            <CardHeader>
            <CardTitle className="font-serif text-xl">Managed Hosting & Maintenance</CardTitle>
              <CardDescription className="text-lg font-semibold text-accent">$75 – $200 / month</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  "Secure hosting",
                  "Proactive monitoring & issue prevention",
                  "Backups & uptime monitoring",
                  "Technical maintenance",
                  "Minor content updates",
                  "One point of contact"
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* III. AI Receptionist Services */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold">AI Receptionist Services</h2>
            <span className="text-sm text-muted-foreground">(Monthly)</span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <PricingCard
              title="Tier 1 — AI Front Door"
              subtitle="Call Coverage"
              price="$500 – $650 / month"
              description="Never miss a call again"
              features={[
                "Answers incoming calls",
                "Captures caller name, reason, urgency",
                "Handles FAQs",
                "After-hours & overflow coverage",
                "Call summaries & emergency routing"
              ]}
            />
            <PricingCard
              title="Tier 2 — AI + Booking"
              price="$700 – $950 / month"
              description="Designed to turn calls into booked jobs automatically."
              featured
              features={[
                "Everything in Tier 1",
                "Appointment booking via phone",
                "Service selection & fixed pricing quotes",
                "Availability-based scheduling",
                "Confirmation texts/emails"
              ]}
            />
            <PricingCard
              title="Tier 3 — AI + CRM"
              price="$950 – $1,400 / month"
              description="Full operational intelligence"
              features={[
                "Everything in Tier 2",
                "CRM logging & lead tagging",
                "Follow-up workflows",
                "Priority routing & reporting"
              ]}
            />
          </div>
        </div>
      </section>

      {/* IV. Optional Managed Support */}
      <section className="py-16 bg-secondary/30 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold">Optional Managed Support</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">AI Updates & Tuning</CardTitle>
                <CardDescription className="text-lg font-semibold text-accent">$100 – $250 / month</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[
                    "Service & pricing updates",
                    "Staff availability changes",
                    "Seasonal messaging",
                    "Ongoing optimization"
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">Digital Operations Support</CardTitle>
                <CardDescription className="text-lg font-semibold text-accent">$150 – $350 / month</CardDescription>
              </CardHeader>
              <CardContent>
              <ul className="space-y-2">
                  {[
                    "Website changes",
                    "Form & funnel updates",
                    "Troubleshooting",
                    "Same-week turnaround on operational changes",
                    "Priority communication"
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* V. Bundled Systems */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold">Bundled Systems</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <BundleCard
              title="PCD Starter System"
              buildPrice="$950 – $1,500"
              monthlyPrice="$500 – $650 / month"
              features={[
                "Essential website",
                "Hosting",
                "AI Front Door",
                "Basic support"
              ]}
            />
            <BundleCard
              title="PCD Growth System"
              buildPrice="$1,500 – $2,500"
              monthlyPrice="$750 – $950 / month"
              featured
              features={[
                "Growth website",
                "Hosting",
                "AI Front Door + Booking",
                "CRM basics",
                "Support"
              ]}
            />
            <BundleCard
              title="PCD Full Operations"
              buildPrice="$3,000 – $5,000"
              monthlyPrice="$950 – $1,400 / month"
              features={[
                "Premium website",
                "Hosting",
                "AI + Booking + CRM",
                "Managed updates",
                "Priority support"
              ]}
            />
          </div>
        </div>
      </section>

      {/* VI. Pilot Option */}
      <section className="py-16 bg-secondary/30 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-lg flex items-center justify-center mx-auto mb-6">
              <Phone className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">Pilot Option</h2>
            <p className="text-muted-foreground mb-4">
              For select businesses, we offer a 7-day pilot with full functionality and real call traffic. 
              Clear conversion expectations discussed upfront.
            </p>
            <p className="text-sm text-muted-foreground/80 mb-6 italic">
              Pilot eligibility is limited and subject to capacity.
            </p>
            <Button asChild size="lg" className="group">
              <Link to="/get-demo">
                Request a Pilot
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Important Boundaries */}
      <section className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-serif text-lg font-bold mb-2">Important Boundaries</h3>
            <p className="text-sm text-muted-foreground">
              PCD does not replace employees, handle medical records, or claim enterprise compliance. 
              PCD provides coverage, responsiveness, and operational relief.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-50/50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            See what we can build for your business — no commitment, just a preview.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="group">
              <Link to="/get-demo">
                Get My Demo
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="mailto:hello@pleasantcove.design">Contact Us</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-serif text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pleasant Cove Design
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
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

interface PricingCardProps {
  title: string;
  subtitle?: string;
  price: string;
  description: string;
  features: string[];
  featured?: boolean;
}

const PricingCard = ({ title, subtitle, price, description, features, featured }: PricingCardProps) => (
  <Card className={`relative ${featured ? 'border-accent shadow-lg' : ''}`}>
    {featured && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-medium px-3 py-1 rounded-full">
        Popular
      </div>
    )}
    <CardHeader>
      <CardTitle className="font-serif text-xl">{title}</CardTitle>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      <CardDescription className="text-lg font-semibold text-accent">{price}</CardDescription>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

interface BundleCardProps {
  title: string;
  buildPrice: string;
  monthlyPrice: string;
  features: string[];
  featured?: boolean;
}

const BundleCard = ({ title, buildPrice, monthlyPrice, features, featured }: BundleCardProps) => (
  <Card className={`relative ${featured ? 'border-accent shadow-lg' : ''}`}>
    {featured && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-medium px-3 py-1 rounded-full">
        Most Value
      </div>
    )}
    <CardHeader>
      <CardTitle className="font-serif text-xl">{title}</CardTitle>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Build: <span className="font-medium text-foreground">{buildPrice}</span></p>
        <CardDescription className="text-lg font-semibold text-accent">{monthlyPrice}</CardDescription>
      </div>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export default Pricing;
