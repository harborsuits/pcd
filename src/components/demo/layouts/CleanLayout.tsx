import { MapPin, Star, Phone, Quote, Camera } from "lucide-react";
import { getHeroImage, getGalleryImagesForBusiness, getInitials } from "../themes";
import { getTradeDisplayName, getTradeCTAText, isKnownTrade } from "@/lib/categoryServices";
import { getTradeIcon } from "@/lib/tradeIcons";
import { getStableTestimonials } from "@/lib/testimonials";

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
  const heroImage = getHeroImage(templateType, businessName);
  const galleryImages = getGalleryImagesForBusiness({
    templateType,
    businessName,
    city,
    count: 3,
  });
  const initials = getInitials(businessName);
  const locationString = state ? `${city}, ${state}` : city;
  const nearbyTowns = (content.nearbyTowns as string[]) || [];

  // Trade-aware content
  const tradeName = getTradeDisplayName(templateType);
  const knownTrade = isKnownTrade(templateType);
  const ctaText = getTradeCTAText(templateType);
  const heroSubheadline = knownTrade 
    ? `Professional ${tradeName} Services in ${locationString}`
    : `Professional Services in ${locationString}`;
  const servicesTitle = knownTrade ? `Our ${tradeName} Services` : "Our Services";
  const testimonials = getStableTestimonials({ businessName, city, templateType, count: 1 });
  const TradeIcon = getTradeIcon(templateType);

  return (
    <div className="pb-32">
      {/* Clean Hero - White/light background, centered, minimal */}
      <section className="bg-gradient-to-b from-background via-muted/20 to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            {/* Small subtle logo with trade icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <TradeIcon className="w-7 h-7" />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-foreground mb-3 tracking-tight">
              {businessName}
            </h1>
            
            {/* Trade-aware subheadline */}
            <p className="text-lg text-primary font-medium mb-4">
              {heroSubheadline}
            </p>
            
            {tagline && (
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
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
              {ctaText.button}
            </button>
          </div>
        </div>
      </section>

      {/* Simple Services - horizontal scroll on mobile, clean grid on desktop */}
      {services.length > 0 && (
        <section className="py-12 border-t border-border/50">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-medium text-foreground text-center mb-8">{servicesTitle}</h2>
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

      {/* Gallery / Recent Work - Trade-specific */}
      <section className="py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-medium text-foreground">
                  {knownTrade ? `Recent ${tradeName} Work` : "Recent Work"}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground hidden md:block">
                {knownTrade ? "Photos representative of typical projects" : "Sample project photos"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {galleryImages.map((src, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-border/50 bg-muted/30">
                  <img
                    src={src}
                    alt={knownTrade ? `${tradeName} project photo ${i + 1}` : `Project photo ${i + 1}`}
                    className="h-44 w-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial - Social Proof */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-6">
              Trusted by Local Customers
            </h2>
            {testimonials.map((t, i) => (
              <div key={i} className="relative">
                <Quote className="w-8 h-8 text-primary/20 mx-auto mb-4" />
                <blockquote className="text-lg text-foreground italic mb-4">
                  {t.quote}
                </blockquote>
                <cite className="text-sm text-muted-foreground not-italic">
                  {t.author}
                </cite>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location info - simple text block */}
      <section className="py-12 border-t border-border/50">
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
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-medium text-foreground mb-4">
            {ctaText.heading}
          </h2>
          <p className="text-muted-foreground mb-6">
            Fast response • Local service • No obligation
          </p>
          <button 
            onClick={onQuoteClick}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            {ctaText.button}
          </button>
        </div>
      </section>

      {/* Footer - Business name + location */}
      <footer className="text-center py-8 border-t border-border/50">
        <p className="text-sm text-foreground font-medium mb-1">
          © {businessName} — {locationString}
        </p>
        <p className="text-xs text-muted-foreground/60">
          This is a preview website generated for demonstration purposes.
        </p>
      </footer>
    </div>
  );
}
