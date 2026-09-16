import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Globe, Bot, Package, Wrench, MessageSquare, Phone } from "lucide-react";
import pcdLogo from "@/assets/pcd-logo.jpeg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { cn } from "@/lib/utils";
import { NAP } from "@/lib/localPages";
import { ReviewRequestForm } from "@/components/intake/ReviewRequestForm";

type ServiceType = "demo" | "website" | "ai" | "existing" | "other" | "";

/** Map legacy/query param values onto the short form's choices */
const SERVICE_PARAM_MAP: Record<string, ServiceType> = {
  demo: "demo",
  website: "website",
  ai_receptionist: "ai",
  ai: "ai",
  both: "website",
  existing: "existing",
  other: "other",
};

const SERVICE_OPTIONS: { value: ServiceType; icon: typeof Globe; title: string; description: string }[] = [
  { value: "demo", icon: Globe, title: "See a demo site", description: "An instant preview built for your business." },
  { value: "website", icon: Package, title: "A new website", description: "Designed and built for you." },
  { value: "ai", icon: Bot, title: "AI phone answering", description: "Calls answered and leads captured 24/7." },
  { value: "existing", icon: Wrench, title: "Help with my current site", description: "Fixes, updates, or a refresh." },
  { value: "other", icon: MessageSquare, title: "Something else", description: "Tell us what you have in mind." },
];

/** These request types need a location so we can build the preview */
const NEEDS_LOCATION: ServiceType[] = ["demo", "website", "existing"];

const mapServiceType = (type: ServiceType): string => {
  if (type === "ai") return "ai_receptionist";
  if (type === "existing") return "website";
  return type || "other";
};

const GetDemo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [serviceType, setServiceType] = useState<ServiceType>("");
  const [businessName, setBusinessName] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [yourName, setYourName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // ?service=review → the lightweight free-review form
  const isReviewMode = searchParams.get("service") === "review";

  // Keep old deep links working: ?service=, ?tier=, ?product=, ?trial=
  const tierParam = searchParams.get("tier");
  const productParam = searchParams.get("product");
  const isTrial = searchParams.get("trial") === "true";

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setAccessToken(session?.access_token ?? null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
      setAccessToken(session?.access_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam && SERVICE_PARAM_MAP[serviceParam]) {
      setServiceType(SERVICE_PARAM_MAP[serviceParam]);
    } else if (productParam === "pilot") {
      setServiceType("ai");
    }
  }, [searchParams, productParam]);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

  const locationRequired = NEEDS_LOCATION.includes(serviceType);

  const canSubmit =
    !!serviceType &&
    businessName.trim().length > 1 &&
    isValidEmail(email) &&
    (!locationRequired || serviceArea.trim().length > 1);

  const handleSubmit = async () => {
    if (!canSubmit || isLoading) {
      setTouched({ businessName: true, email: true, serviceArea: true });
      return;
    }

    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const { data, error } = await supabase.functions.invoke("leads/request-demo", {
        headers,
        body: {
          business_name: businessName.trim(),
          city: serviceArea.trim() || null,
          phone: phone.trim(),
          email: email.trim(),
          your_name: yourName.trim() || null,
          service_type: mapServiceType(serviceType),
          tier: tierParam || null,
          product_type: productParam || null,
          is_trial: isTrial,
          custom_request: notes.trim() || null,
        },
      });

      if (error) throw error;

      if (data?.demo_url) {
        toast({ title: "Demo ready!", description: "Taking you to your preview..." });
        navigate(data.demo_url);
        return;
      }

      if (data?.project_token && isLoggedIn) {
        toast({ title: "Got it — thanks!", description: "Here's your project space." });
        navigate(`/w/${data.project_token}`);
        return;
      }

      if (data?.project_token && email) {
        toast({ title: "Got it — thanks!", description: "Let's set up your account so you can follow along." });
        const params = new URLSearchParams({
          token: data.project_token,
          email: email.trim(),
          name: yourName.trim(),
          business: businessName.trim(),
        });
        navigate(`/create-password?${params.toString()}`);
        return;
      }

      if (data?.project_token) {
        navigate(`/p/${data.project_token}`);
        return;
      }

      toast({ title: "Request received", description: "We'll be in touch shortly." });
      navigate("/");
    } catch (err) {
      console.error("Inquiry error:", err);
      toast({
        title: "Something went wrong",
        description: `Please try again, or call us at ${NAP.phone}.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
            Pleasant Cove Design
          </Link>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>
      {children}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Pleasant Cove Design</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );

  if (isReviewMode) {
    return (
      <Shell>
        <SEOHead
          title="Free Website Review — Pleasant Cove Design"
          description="Drop your website URL and we'll send back honest, specific feedback on what may be costing you conversions — free, no sales pressure."
          path="/get-demo"
        />
        <main className="flex-1 container mx-auto px-6 py-10 md:py-14">
          <div className="max-w-xl mx-auto bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
            <ReviewRequestForm />
          </div>
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      <SEOHead
        title="Get Started"
        description="Tell us about your business in under a minute. No obligation, no spam — we'll follow up with a clear next step."
        path="/get-demo"
      />

      <main className="flex-1 flex items-start justify-center py-12 px-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <img src={pcdLogo} alt="Pleasant Cove Design" className="w-12 h-12 rounded-full mb-4 mx-auto" />
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">Let's talk about your business</h1>
            <p className="text-muted-foreground">
              Takes about a minute. No commitment, and we'll follow up with a clear next step.
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {/* 1. What do you need */}
            <div className="space-y-3">
              <Label>What are you after? *</Label>
              <div className="grid gap-2">
                {SERVICE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = serviceType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setServiceType(option.value)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 hover:border-primary/50",
                        selected ? "border-primary bg-primary/5" : "border-border bg-card"
                      )}
                    >
                      <div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{option.title}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Business name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">Business name *</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, businessName: true }))}
                placeholder="e.g. Smith Plumbing"
                autoComplete="organization"
              />
              {touched.businessName && businessName.trim().length < 2 && (
                <p className="text-xs text-destructive">Please enter your business name.</p>
              )}
            </div>

            {/* 3. Service area */}
            <div className="space-y-2">
              <Label htmlFor="serviceArea">
                Where do you serve customers?{locationRequired ? " *" : " (optional)"}
              </Label>
              <Input
                id="serviceArea"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, serviceArea: true }))}
                placeholder="e.g. Damariscotta, ME"
              />
              {touched.serviceArea && locationRequired && serviceArea.trim().length < 2 && (
                <p className="text-xs text-destructive">We need a town or area to build your preview.</p>
              )}
            </div>

            {/* 4-6. Contact */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="yourName">Your name (optional)</Label>
                <Input
                  id="yourName"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  placeholder="e.g. John Smith"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(207) 555-1234"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="john@smithplumbing.com"
                autoComplete="email"
              />
              {touched.email && !isValidEmail(email) && (
                <p className="text-xs text-destructive">Please enter a valid email address.</p>
              )}
            </div>

            {/* 7. Free text */}
            <div className="space-y-2">
              <Label htmlFor="notes">Anything you want us to know? (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What's not working, what you're hoping for, or when you'd like it done."
                rows={3}
              />
            </div>

            <Button type="submit" disabled={!canSubmit || isLoading} className="w-full h-12 text-base">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  {serviceType === "demo" ? "Build my preview" : "Send it"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Rather just talk? */}
          <div className="mt-6 rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Rather just talk?{" "}
              <a href={`tel:${NAP.phoneE164}`} className="font-medium text-foreground hover:text-primary inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {NAP.phone}
              </a>
            </p>
          </div>

          {/* Free review alt path */}
          <button
            type="button"
            onClick={() => navigate("/get-demo?service=review")}
            className="mt-3 w-full rounded-xl border-2 border-dashed border-border bg-card p-4 text-left transition-all hover:border-primary/50"
          >
            <p className="text-sm font-medium">Not ready yet? Get a free review of your current site</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drop your URL — we'll send honest feedback on what's costing you customers. No sales pressure.
            </p>
          </button>

          <p className="text-center text-xs text-muted-foreground mt-8">
            By submitting, you agree to receive follow-up communication.
            <br />
            We won't share your info or send unwanted messages.
          </p>
        </div>
      </main>
    </Shell>
  );
};

export default GetDemo;
