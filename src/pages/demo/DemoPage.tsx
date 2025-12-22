import { useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { themes, ThemeId } from "@/components/demo/themes";
import { ThemeSwitcher } from "@/components/demo/ThemeSwitcher";
import { QuoteModal } from "@/components/demo/QuoteModal";
import { ClaimDesignModal } from "@/components/demo/ClaimDesignModal";
import { StickyMobileCTA } from "@/components/demo/StickyMobileCTA";
import { CleanLayout, ContractorLayout, BoutiqueLayout } from "@/components/demo/layouts";

interface DemoData {
  business: {
    name: string;
    slug: string;
  };
  project_token: string;
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
  const [claimOpen, setClaimOpen] = useState(false);
  
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

      {/* Render different layouts based on theme */}
      {currentTheme === "classic" && (
        <CleanLayout
          templateType={data.demo.template_type}
          content={data.demo.content}
          businessName={data.business.name}
          onQuoteClick={() => setQuoteOpen(true)}
        />
      )}
      {currentTheme === "bold" && (
        <ContractorLayout
          templateType={data.demo.template_type}
          content={data.demo.content}
          businessName={data.business.name}
          onQuoteClick={() => setQuoteOpen(true)}
        />
      )}
      {currentTheme === "premium" && (
        <BoutiqueLayout
          templateType={data.demo.template_type}
          content={data.demo.content}
          businessName={data.business.name}
          onQuoteClick={() => setQuoteOpen(true)}
        />
      )}

      <QuoteModal 
        open={quoteOpen} 
        onOpenChange={setQuoteOpen}
        businessName={data.business.name}
      />

      <ClaimDesignModal
        open={claimOpen}
        onOpenChange={setClaimOpen}
        businessName={data.business.name}
        projectToken={data.project_token}
      />

      {/* Sticky Mobile CTA */}
      <StickyMobileCTA 
        phone={(data.demo.content as Record<string, unknown>).phone as string | undefined}
        onQuoteClick={() => setQuoteOpen(true)}
        onClaimClick={() => setClaimOpen(true)}
      />

      {/* Desktop Footer - hidden on mobile since we have sticky CTA */}
      <footer className="hidden sm:block fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Want this site live under your domain?</p>
            <p>We handle setup, hosting, everything. No obligation.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setQuoteOpen(true)}
              className="bg-secondary text-secondary-foreground px-5 py-2 rounded-md font-medium hover:bg-secondary/80 transition-colors whitespace-nowrap"
            >
              Get a Quote
            </button>
            <button 
              onClick={() => setClaimOpen(true)}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              Claim This Design
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
