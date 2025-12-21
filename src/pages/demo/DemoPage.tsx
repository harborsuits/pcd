import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

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
  const [state, setState] = useState<LoadingState>("idle");
  const [data, setData] = useState<DemoData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  console.log("✅ DemoPage mounted", { token, slug, href: window.location.href });

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
        
        // Pass slug for server-side validation
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

        // Client-side canonical slug check (belt + suspenders)
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

  // Loading state
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

  // Not found state
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

  // Error state
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

  // Success state - render demo
  if (!data) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Content - Full width, no debug header */}
      <main className="container mx-auto px-4 py-8">
        <DemoRenderer 
          templateType={data.demo.template_type} 
          content={data.demo.content}
          businessName={data.business.name}
        />
      </main>

      {/* Ownership CTA Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            This could be your live website in 24 hours.
          </p>
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
            Claim This Design
          </button>
        </div>
      </footer>
    </div>
  );
}

// Lead-aware demo renderer - creates personalized landing page
function DemoRenderer({ 
  templateType, 
  content,
  businessName 
}: { 
  templateType: string; 
  content: Record<string, unknown>;
  businessName: string;
}) {
  // Extract personalization data from content
  const city = (content.city as string) || "your area";
  const services = (content.services as string[]) || getDefaultServices(templateType);
  const phone = content.phone as string;
  const tagline = (content.tagline as string) || getDefaultTagline(templateType, city);

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          {businessName}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {tagline}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors text-lg">
            Request a Quote
          </button>
          {phone && (
            <a 
              href={`tel:${phone}`}
              className="border border-border text-foreground px-8 py-3 rounded-md font-semibold hover:bg-muted transition-colors text-lg"
            >
              Call {phone}
            </a>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section>
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">
          Our Services
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div 
              key={index}
              className="bg-card border border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-xl">✓</span>
              </div>
              <h3 className="font-semibold text-foreground">{service}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Strip */}
      <section className="bg-muted/50 rounded-lg p-8 text-center">
        <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
          <span>✓ Locally Owned & Operated</span>
          <span>✓ Serving {city} & Surrounding Areas</span>
          <span>✓ Licensed & Insured</span>
        </div>
      </section>

      {/* Generated Notice */}
      <p className="text-center text-sm text-muted-foreground">
        This preview was generated for {businessName} based on public business data.
      </p>
    </div>
  );
}

// Helper functions for default content
function getDefaultServices(templateType: string): string[] {
  const serviceMap: Record<string, string[]> = {
    plumber: ["Emergency Repairs", "Drain Cleaning", "Water Heater Service", "Pipe Installation", "Leak Detection", "Bathroom Remodeling"],
    roofer: ["Roof Repairs", "New Installations", "Storm Damage", "Gutter Services", "Inspections", "Metal Roofing"],
    electrician: ["Electrical Repairs", "Panel Upgrades", "Lighting Installation", "Wiring Services", "Safety Inspections", "Generator Install"],
    hvac: ["AC Repair", "Heating Service", "Installation", "Maintenance", "Indoor Air Quality", "Emergency Service"],
    restaurant: ["Dine-In", "Takeout", "Catering", "Private Events", "Online Ordering", "Delivery"],
    default: ["Professional Service", "Quality Work", "Customer Satisfaction", "Competitive Pricing", "Fast Response", "Expert Team"]
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
