import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Home } from "lucide-react";

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
      {/* Demo Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
              <span className="text-sm">Home</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{data.business.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Demo Preview • {data.demo.template_type}
          </p>
        </div>
      </header>

      {/* Demo Content */}
      <main className="container mx-auto px-4 py-8">
        <DemoRenderer 
          templateType={data.demo.template_type} 
          content={data.demo.content} 
        />
      </main>

      {/* Demo CTA Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4">
        <div className="container mx-auto flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Like what you see? Let's talk.
          </p>
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
            Get Started
          </button>
        </div>
      </footer>
    </div>
  );
}

// Placeholder demo renderer - will be expanded with actual templates
function DemoRenderer({ 
  templateType, 
  content 
}: { 
  templateType: string; 
  content: Record<string, unknown>;
}) {
  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Template: {templateType}
        </h2>
        <pre className="bg-muted p-4 rounded text-sm overflow-auto text-muted-foreground">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    </div>
  );
}
