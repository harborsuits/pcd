import { useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { MapPin, Clock, Shield, Star, Phone } from "lucide-react";
import { themes, ThemeId, industryImages, getInitials } from "@/components/demo/themes";
import { ThemeSwitcher } from "@/components/demo/ThemeSwitcher";
import { QuoteModal } from "@/components/demo/QuoteModal";
import { ServiceAreaBlock } from "@/components/demo/ServiceAreaBlock";
import { ReviewsPreview } from "@/components/demo/ReviewsPreview";
import { WorkGallery } from "@/components/demo/WorkGallery";
import { StickyMobileCTA } from "@/components/demo/StickyMobileCTA";

interface DemoData {
  business: {
    name: string;
    slug: string;
  };
  demo: {
    template_type: string;
    content: Record<string, unknown>;
  };
}

type LoadingState = "idle" | "loading" | "success" | "not-found" | "error";

export default function DemoPage() {
  const { token, slug } = useParams<{ token: string; slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<LoadingState>("idle");
  const [data, setData] = useState<DemoData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [quoteOpen, setQuoteOpen] = useState(false);
  
  const themeParam = searchParams.get("style") as ThemeId | null;
  const currentTheme = themeParam && themes[themeParam] ? themeParam : "classic";

  const handleThemeChange = (theme: ThemeId) => {
    setSearchParams({ style: theme });
  };

  useEffect(() => {
    if (!token) {
      setState("not-found");
      return;
    }

    const fetchDemo = async () => {
      setState("loading");
      setErrorMessage("");

      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!baseUrl) {
        setErrorMessage("Missing VITE_SUPABASE_URL");
        setState("error");
        return;
      }

      try {
        const url = new URL(`${baseUrl}/functions/v1/demo/${token}`);
        if (slug) {
          url.searchParams.set("slug", slug);
        }

        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const res = await fetch(url.toString(), {
          headers: anonKey
            ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
            : undefined,
        });

        if (res.status === 404) {
          setState("not-found");
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to load demo: ${res.status}`);
        }

        const json: DemoData = await res.json();

        if (slug && json.business.slug !== slug) {
          setState("not-found");
          return;
        }

        setData(json);
        setState("success");
      } catch (err) {
        console.error("Demo fetch error:", err);
        setErrorMessage(err instanceof Error ? err.message : "Unknown error");
        setState("error");
      }
    };

    fetchDemo();
  }, [token, slug]);

  if (state === "loading" || state === "idle") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading demo...</p>
        </div>
      </div>
    );
  }

  if (state === "not-found") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
          <p className="text-muted-foreground">Demo not found</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
          <p className="text-muted-foreground">{errorMessage || "Please try again later"}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const theme = themes[currentTheme];

  return (
    <div className="min-h-screen bg-background">
      <ThemeSwitcher currentTheme={currentTheme} onThemeChange={handleThemeChange} />
      
      {/* Preview Explanation Strip */}
      <div className="bg-accent/10 border-b border-accent/20">
        <div className="container mx-auto px-4 py-2 text-center">
          <p className="text-sm text-foreground/70">
            This is a preview website built specifically for <span className="font-medium text-foreground">{data.business.name}</span>.
            <span className="hidden sm:inline"> You are not committed to anything.</span>
          </p>
        </div>
      </div>

      <DemoRenderer 
        templateType={data.demo.template_type} 
        content={data.demo.content}
        businessName={data.business.name}
        theme={theme}
        onQuoteClick={() => setQuoteOpen(true)}
      />

      <QuoteModal 
        open={quoteOpen} 
        onOpenChange={setQuoteOpen}
        businessName={data.business.name}
      />

      {/* Sticky Mobile CTA */}
      <StickyMobileCTA 
        phone={(data.demo.content as Record<string, unknown>).phone as string | undefined}
        onQuoteClick={() => setQuoteOpen(true)}
      />

      {/* Desktop Footer - hidden on mobile since we have sticky CTA */}
      <footer className="hidden sm:block fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Interested in using this site?</p>
            <p>We handle setup & hosting. No obligation to proceed.</p>
          </div>
          <button 
            onClick={() => setQuoteOpen(true)}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            Talk About Using This Site
          </button>
        </div>
      </footer>
    </div>
  );
}

function DemoRenderer({ 
  templateType, 
  content,
  businessName,
  theme,
  onQuoteClick,
}: { 
  templateType: string; 
  content: Record<string, unknown>;
  businessName: string;
  theme: typeof themes.classic;
  onQuoteClick: () => void;
}) {
  const city = (content.city as string) || "your area";
  const state = (content.state as string) || "";
  const services = (content.services as string[]) || getDefaultServices(templateType);
  const phone = content.phone as string;
  const rating = (content.rating as number) || null;
  const reviewCount = (content.reviewCount as number) || null;
  const tagline = (content.tagline as string) || getDefaultTagline(templateType, city);
  const heroImage = industryImages[templateType] || industryImages.default;
  const initials = getInitials(businessName);
  const locationString = state ? `${city}, ${state}` : city;
  const nearbyTowns = (content.nearbyTowns as string[]) || [];
  const photoReferences = (content.photoReferences as string[]) || [];

  return (
    <div className="pb-32">
      {/* Hero Section with Visual */}
      <section className={`relative ${theme.heroBg} ${theme.sectionPadding} overflow-hidden`}>
        {theme.heroOverlay && <div className={theme.heroOverlay} />}
        
        {/* Background Image (subtle) */}
        <div 
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo Lockup */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                {initials}
              </div>
            </div>
            
            <h1 className={`text-4xl md:text-5xl lg:text-6xl ${theme.headingWeight} ${theme.heroText} mb-4`}>
              {businessName}
            </h1>
            <p className={`text-xl md:text-2xl ${theme.heroSubtext} mb-8 max-w-2xl mx-auto`}>
              {tagline}
            </p>
            
            {/* Proof Chips Row */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              {rating && (
                <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-border/50">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                  {reviewCount && (
                    <span className="text-muted-foreground text-sm">({reviewCount})</span>
                  )}
                  <span className="text-xs text-muted-foreground/70">Google</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-border/50">
                <MapPin className="w-4 h-4 text-accent" />
                <span className="text-sm text-foreground">{locationString}</span>
              </div>
              {phone && (
                <a 
                  href={`tel:${phone}`}
                  className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <Phone className="w-4 h-4 text-accent" />
                  <span className="text-sm text-foreground">{phone}</span>
                </a>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={onQuoteClick}
                className={`px-8 py-4 rounded-lg font-semibold transition-all text-lg ${theme.buttonPrimary}`}
              >
                Get a Free Quote
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Local Proof Bar */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 text-accent" />
              <span>{templateType === "plumber" || templateType === "electrician" || templateType === "hvac" ? "Emergency calls welcome" : "Fast response times"}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4 text-accent" />
              <span>Licensed & Insured</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-accent" />
              <span>Upfront estimates</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className={`${theme.sectionPadding}`}>
        <div className="container mx-auto px-4">
          <h2 className={`text-2xl md:text-3xl ${theme.headingWeight} text-foreground text-center mb-2`}>
            Popular Services
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            Common requests we see for businesses like {businessName}
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {services.slice(0, 6).map((service, index) => (
              <div 
                key={index}
                className={`${theme.cardBg} border ${theme.cardBorder} ${theme.cardRadius} p-6 text-center transition-all ${theme.cardHover}`}
              >
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-accent text-xl">✓</span>
                </div>
                <h3 className={`font-semibold text-foreground ${theme.bodySize}`}>{service}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Area Block */}
      <ServiceAreaBlock 
        city={city} 
        state={state} 
        nearbyTowns={nearbyTowns}
      />

      {/* Work Gallery */}
      <WorkGallery 
        templateType={templateType} 
        businessName={businessName}
        photoReferences={photoReferences}
      />

      {/* Reviews Preview */}
      <ReviewsPreview 
        rating={rating}
        reviewCount={reviewCount}
        businessName={businessName}
        templateType={templateType}
      />

      {/* Social Proof / Trust Section */}
      <section className={`${theme.sectionBg} ${theme.sectionPadding}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className={`text-2xl ${theme.headingWeight} text-foreground text-center mb-8`}>
              Why Choose {businessName}?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Rating card - only show if we have real rating */}
              {rating ? (
                <div className="text-center">
                  <div className="w-14 h-14 bg-yellow-400/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Star className="w-7 h-7 text-yellow-500 fill-yellow-500" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{rating.toFixed(1)} Google Rating</h3>
                  <p className="text-muted-foreground text-sm">
                    {reviewCount ? `From ${reviewCount} verified reviews` : "Verified customer reviews"}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Licensed & Insured</h3>
                  <p className="text-muted-foreground text-sm">
                    Full coverage for your peace of mind.
                  </p>
                </div>
              )}
              <div className="text-center">
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Serving {city}</h3>
                <p className="text-muted-foreground text-sm">
                  {nearbyTowns.length > 0 ? `Plus ${nearbyTowns.slice(0, 2).join(", ")} and nearby areas` : "And surrounding communities"}
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {templateType === "plumber" || templateType === "electrician" ? "Emergency Available" : "Quick Response"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {templateType === "plumber" || templateType === "electrician" 
                    ? "Same-day service when you need it most" 
                    : "We prioritize getting to you fast"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className={`${theme.sectionPadding}`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className={`text-2xl md:text-3xl ${theme.headingWeight} text-foreground mb-4`}>
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Get a free quote from {businessName} today. No obligation, no pressure.
          </p>
          <button 
            onClick={onQuoteClick}
            className={`px-10 py-4 rounded-lg font-semibold transition-all text-lg ${theme.buttonPrimary}`}
          >
            Request a Free Quote
          </button>
        </div>
      </section>

      {/* Generated Notice - extra bottom padding on mobile for sticky CTA */}
      <div className="text-center py-8 pb-24 sm:pb-8">
        <p className="text-xs text-muted-foreground/60">
          Preview generated using publicly available business information for {businessName}.
        </p>
      </div>
    </div>
  );
}

function getDefaultServices(templateType: string): string[] {
  const serviceMap: Record<string, string[]> = {
    plumber: ["Emergency Plumbing", "Drain Cleaning", "Water Heaters", "Pipe Repair", "Leak Detection", "Bathroom Remodel"],
    roofer: ["Roof Repairs", "New Installation", "Storm Damage", "Gutter Services", "Inspections", "Metal Roofing"],
    electrician: ["Electrical Repairs", "Panel Upgrades", "Lighting", "Wiring", "Safety Inspections", "Generators"],
    hvac: ["AC Repair", "Heating Service", "Installation", "Maintenance", "Air Quality", "Emergency Service"],
    restaurant: ["Dine-In", "Takeout", "Catering", "Private Events", "Online Orders", "Delivery"],
    default: ["Professional Service", "Quality Work", "Satisfaction Guaranteed", "Competitive Pricing", "Fast Response", "Expert Team"]
  };
  return serviceMap[templateType] || serviceMap.default;
}

function getDefaultTagline(templateType: string, city: string): string {
  const taglineMap: Record<string, string> = {
    plumber: `Professional plumbing services for ${city} homes and businesses`,
    roofer: `Trusted roofing solutions protecting ${city} properties`,
    electrician: `Reliable electrical services for ${city} residential and commercial`,
    hvac: `Keeping ${city} comfortable year-round`,
    restaurant: `Delicious food served fresh in ${city}`,
    default: `Quality service you can trust in ${city}`
  };
  return taglineMap[templateType] || taglineMap.default;
}
