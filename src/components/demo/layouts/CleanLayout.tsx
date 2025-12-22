import { MapPin, Clock, Shield, Star, Phone } from "lucide-react";
import { industryImages, getInitials } from "../themes";

interface LayoutProps {
  templateType: string;
  content: Record<string, unknown>;
  businessName: string;
  onQuoteClick: () => void;
}

export function CleanLayout({ templateType, content, businessName, onQuoteClick }: LayoutProps) {
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

  return (
    <div className="pb-32">
      {/* Clean Hero - White/light background, centered, minimal */}
      <section className="bg-gradient-to-b from-background via-muted/20 to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            {/* Small subtle logo */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center text-lg font-semibold">
                {initials}
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-foreground mb-4 tracking-tight">
              {businessName}
            </h1>
            
            {tagline && (
              <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
                {tagline}
              </p>
            )}
            
            {/* Minimal info row */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {locationString}
              </span>
              {rating && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {rating.toFixed(1)} {reviewCount && `(${reviewCount})`}
                </span>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                  <Phone className="w-4 h-4" />
                  {phone}
                </a>
              )}
            </div>
            
            <button 
              onClick={onQuoteClick}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              Get a Free Quote
            </button>
          </div>
        </div>
      </section>

      {/* Simple Services - horizontal scroll on mobile, clean grid on desktop */}
      {services.length > 0 && (
        <section className="py-12 border-t border-border/50">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-medium text-foreground text-center mb-8">Services</h2>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {services.slice(0, 6).map((service, index) => (
                <span 
                  key={index}
                  className="px-4 py-2 bg-muted/50 text-foreground rounded-full text-sm border border-border/50"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Location info - simple text block */}
      <section className="py-12 bg-muted/20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-xl font-medium text-foreground mb-3">
            Serving {city}
          </h2>
          {nearbyTowns.length > 0 && (
            <p className="text-muted-foreground">
              Also available in {nearbyTowns.slice(0, 4).join(", ")}
            </p>
          )}
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-medium text-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-6">
            Request a free, no-obligation quote today.
          </p>
          <button 
            onClick={onQuoteClick}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Request a Quote
          </button>
        </div>
      </section>

      {/* Footer notice */}
      <div className="text-center py-6">
        <p className="text-xs text-muted-foreground/60">
          Preview generated for {businessName}
        </p>
      </div>
    </div>
  );
}
