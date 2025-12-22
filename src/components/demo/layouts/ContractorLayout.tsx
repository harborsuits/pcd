import { MapPin, Clock, Shield, Star, Phone, Wrench, CheckCircle, Quote } from "lucide-react";
import { industryImages, getInitials } from "../themes";
import { getTradeDisplayName, getTradeCTAText } from "@/lib/categoryServices";

interface LayoutProps {
  templateType: string;
  content: Record<string, unknown>;
  businessName: string;
  onQuoteClick: () => void;
}

export function ContractorLayout({ templateType, content, businessName, onQuoteClick }: LayoutProps) {
  const city = (content.city as string) || "your area";
  const state = (content.state as string) || "";
  const services = (content.services as string[]) || [];
  const phone = content.phone as string;
  const rating = (content.rating as number) || null;
  const reviewCount = (content.reviewCount as number) || null;
  const tagline = (content.tagline as string) || "";
  const heroImage = industryImages[templateType] || industryImages.default;
  const initials = getInitials(businessName);
  const locationString = state ? `${city}, ${state}` : city;
  const nearbyTowns = (content.nearbyTowns as string[]) || [];

  // Trade-aware content
  const tradeName = getTradeDisplayName(templateType);
  const isKnownTrade = templateType !== "default";
  const ctaText = getTradeCTAText(templateType);
  const heroSubheadline = isKnownTrade 
    ? `Professional ${tradeName} Services in ${locationString}`
    : `Professional Services in ${locationString}`;
  const servicesTitle = isKnownTrade ? `Our ${tradeName} Services` : "Our Services";
  const servicesSubtitle = isKnownTrade 
    ? `Professional ${tradeName.toLowerCase()} work done right the first time`
    : "Professional work done right the first time";

  return (
    <div className="pb-32">
      {/* Dark Hero - Bold, left-aligned, contractor feel */}
      <section className="relative bg-primary text-primary-foreground">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        </div>
        
        <div className="relative container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl">
            {/* Badges row at top */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 bg-primary-foreground/10 border border-primary-foreground/20 px-3 py-1 rounded-md text-sm">
                <Shield className="w-4 h-4" />
                Licensed & Insured
              </span>
              {rating && (
                <span className="inline-flex items-center gap-1.5 bg-primary-foreground/10 border border-primary-foreground/20 px-3 py-1 rounded-md text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {rating.toFixed(1)} Stars
                </span>
              )}
            </div>
            
            {/* Left-aligned heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3">
              {businessName}
            </h1>
            
            {/* Trade-aware subheadline */}
            <p className="text-xl text-accent font-semibold mb-4">
              {heroSubheadline}
            </p>
            
            {tagline && (
              <p className="text-lg text-primary-foreground/80 mb-6 max-w-2xl">
                {tagline}
              </p>
            )}
            
            {/* Location */}
            <div className="flex items-center gap-2 text-primary-foreground/70 mb-8">
              <MapPin className="w-5 h-5" />
              <span className="text-lg">Serving {locationString}</span>
            </div>
            
            {/* Dual CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onQuoteClick}
                className="px-8 py-4 bg-accent text-accent-foreground rounded-lg font-bold text-lg hover:bg-accent/90 transition-colors shadow-lg"
              >
                Get a Free Quote
              </button>
              {phone && (
                <a 
                  href={`tel:${phone}`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-foreground/10 border-2 border-primary-foreground/30 rounded-lg font-bold text-lg hover:bg-primary-foreground/20 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Call {phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-accent text-accent-foreground py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Same-Day Service
            </span>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              100% Satisfaction Guaranteed
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Upfront Pricing
            </span>
          </div>
        </div>
      </section>

      {/* Services - Card grid with icons */}
      {services.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground text-center mb-4">
              {servicesTitle}
            </h2>
            <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
              {servicesSubtitle}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {services.slice(0, 6).map((service, index) => (
                <div 
                  key={index}
                  className="bg-card border border-border rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Wrench className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg">{service}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonial Placeholder */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-extrabold text-foreground text-center mb-8">
              Trusted by Local Customers
            </h2>
            <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
              <Quote className="w-10 h-10 text-primary/30 mb-4" />
              <blockquote className="text-xl text-foreground mb-4">
                "We called {businessName} when we needed help fast. They showed up on time, did great work, and the price was fair. Highly recommend!"
              </blockquote>
              <cite className="text-muted-foreground not-italic flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                — {city} Homeowner
              </cite>
            </div>
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-extrabold text-foreground mb-4">
              Proudly Serving {city}
            </h2>
            {nearbyTowns.length > 0 && (
              <p className="text-muted-foreground mb-4">
                Plus {nearbyTowns.slice(0, 5).join(", ")} and surrounding areas
              </p>
            )}
            {phone && (
              <a 
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 text-primary font-bold text-lg hover:underline"
              >
                <Phone className="w-5 h-5" />
                Call us: {phone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us - Bold cards */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10">
            Why Choose {businessName}?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-primary-foreground/10 rounded-xl p-6 text-center">
              <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-accent-foreground" />
              </div>
              <h3 className="font-bold text-lg mb-2">Fast Response</h3>
              <p className="text-primary-foreground/70 text-sm">
                We show up when we say we will
              </p>
            </div>
            <div className="bg-primary-foreground/10 rounded-xl p-6 text-center">
              <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-accent-foreground" />
              </div>
              <h3 className="font-bold text-lg mb-2">Licensed & Insured</h3>
              <p className="text-primary-foreground/70 text-sm">
                Your peace of mind, guaranteed
              </p>
            </div>
            {rating ? (
              <div className="bg-primary-foreground/10 rounded-xl p-6 text-center">
                <div className="w-14 h-14 bg-yellow-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-7 h-7 text-yellow-900 fill-yellow-900" />
                </div>
                <h3 className="font-bold text-lg mb-2">{rating.toFixed(1)} Star Rating</h3>
                <p className="text-primary-foreground/70 text-sm">
                  {reviewCount ? `From ${reviewCount} reviews` : "Customer verified"}
                </p>
              </div>
            ) : (
              <div className="bg-primary-foreground/10 rounded-xl p-6 text-center">
                <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-accent-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2">Quality Work</h3>
                <p className="text-primary-foreground/70 text-sm">
                  Done right the first time
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">
            {ctaText.heading}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Fast response • Local service • No obligation
          </p>
          <button 
            onClick={onQuoteClick}
            className="px-10 py-4 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg"
          >
            {ctaText.button}
          </button>
        </div>
      </section>

      {/* Footer - Business name + location */}
      <footer className="text-center py-8 border-t border-border">
        <p className="text-sm text-foreground font-bold mb-1">
          © {businessName} — {locationString}
        </p>
        <p className="text-xs text-muted-foreground/60">
          This is a preview website generated for demonstration purposes.
        </p>
      </footer>
    </div>
  );
}