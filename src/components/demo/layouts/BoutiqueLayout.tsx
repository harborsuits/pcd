import { MapPin, Star, Phone, ArrowRight, Quote } from "lucide-react";
import { industryImages, getInitials } from "../themes";
import { getTradeDisplayName, getTradeCTAText } from "@/lib/categoryServices";

interface LayoutProps {
  templateType: string;
  content: Record<string, unknown>;
  businessName: string;
  onQuoteClick: () => void;
}

export function BoutiqueLayout({ templateType, content, businessName, onQuoteClick }: LayoutProps) {
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
    ? `${tradeName} Services in ${locationString}`
    : `Professional Services in ${locationString}`;

  return (
    <div className="pb-32">
      {/* Elegant Hero - Large imagery, serif-style heading, refined spacing */}
      <section className="relative min-h-[60vh] flex items-center">
        {/* Full background image with overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-2xl">
            {/* Refined location tag */}
            <div className="flex items-center gap-2 text-muted-foreground mb-6">
              <MapPin className="w-4 h-4" />
              <span className="text-sm tracking-wide uppercase">{locationString}</span>
            </div>
            
            {/* Elegant heading - using tracking and lighter weight */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal text-foreground mb-3 tracking-tight leading-tight">
              {businessName}
            </h1>
            
            {/* Trade-aware subheadline */}
            <p className="text-lg text-primary font-medium mb-6">
              {heroSubheadline}
            </p>
            
            {tagline && (
              <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
                {tagline}
              </p>
            )}
            
            {rating && (
              <div className="flex items-center gap-3 mb-8">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < Math.round(rating) ? 'fill-foreground text-foreground' : 'text-muted'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {reviewCount ? `${reviewCount} reviews` : "Verified"}
                </span>
              </div>
            )}
            
            {/* Refined CTA */}
            <button 
              onClick={onQuoteClick}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-full font-medium hover:bg-foreground/90 transition-colors"
            >
              Start a Project
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Services - Elegant list, not cards */}
      {services.length > 0 && (
        <section className="py-20 border-t border-border/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-6">
                {isKnownTrade ? `${tradeName} Services` : "Services"}
              </h2>
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
                {services.slice(0, 6).map((service, index) => (
                  <div 
                    key={index}
                    className="py-4 border-b border-border/30 flex items-center justify-between group cursor-default"
                  >
                    <span className="text-foreground text-lg">{service}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonial Placeholder */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-8">
              Client Testimonial
            </h2>
            <Quote className="w-10 h-10 text-primary/20 mx-auto mb-6" />
            <blockquote className="text-2xl font-normal text-foreground mb-6 leading-relaxed">
              "Working with {businessName} was a pleasure from start to finish. Professional, attentive, and the results exceeded our expectations."
            </blockquote>
            <cite className="text-muted-foreground not-italic">
              — Satisfied Client, {city}
            </cite>
          </div>
        </div>
      </section>

      {/* About / Trust section - Minimal, text-focused */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-normal text-foreground mb-6">
              Crafted with Care
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              At {businessName}, we believe in doing things right. Every project receives our 
              full attention, from the initial consultation to the final details.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <span>Licensed & Insured</span>
              <span>•</span>
              <span>Serving {city}</span>
              {nearbyTowns.length > 0 && (
                <>
                  <span>•</span>
                  <span>{nearbyTowns.slice(0, 2).join(" & ")}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact section - Refined */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
              Get in Touch
            </h2>
            <h3 className="text-3xl font-normal text-foreground mb-6">
              {ctaText.heading}
            </h3>
            <p className="text-muted-foreground mb-8">
              Fast response • Local service • No obligation
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={onQuoteClick}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-foreground text-background rounded-full font-medium hover:bg-foreground/90 transition-colors"
              >
                {ctaText.button}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              {phone && (
                <a 
                  href={`tel:${phone}`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border rounded-full text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Business name + location */}
      <footer className="text-center py-8 border-t border-border/30">
        <p className="text-sm text-foreground font-medium mb-1">
          © {businessName} — {locationString}
        </p>
        <p className="text-xs text-muted-foreground/60 tracking-wide">
          This is a preview website generated for demonstration purposes.
        </p>
      </footer>
    </div>
  );
}