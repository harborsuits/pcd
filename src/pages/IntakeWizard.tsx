import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Globe, Bot, Package, Wrench, MessageSquare, Mail, UserPlus, LogIn, CheckCircle2 } from "lucide-react";
import pcdLogo from "@/assets/pcd-logo.jpeg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { portalSupabase } from "@/integrations/supabase/portalClient";
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

// Keep this component outside GetDemo so field updates never remount its children.
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

const GetDemo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [serviceType, setServiceType] = useState<ServiceType>("other");
  const [businessName, setBusinessName] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [yourName, setYourName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<{ projectToken: string | null; email: string; name: string; business: string } | null>(null);

  // ?service=review → the lightweight free-review form
  const isReviewMode = searchParams.get("service") === "review";

  // Keep old deep links working: ?service=, ?tier=, ?product=, ?trial=
  const tierParam = searchParams.get("tier");
  const productParam = searchParams.get("product");
  const isTrial = searchParams.get("trial") === "true";

  // An explicit deep link opens the inquiry with that service preselected
  const serviceParam = searchParams.get("service");
  const hasDeepLink = !!(serviceParam && SERVICE_PARAM_MAP[serviceParam]) || productParam === "pilot";

  // Controlled so React re-renders (typing) never collapse the form
  const [inquiryOpen, setInquiryOpen] = useState(hasDeepLink);
  const [optionalDetailsOpen, setOptionalDetailsOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await portalSupabase.auth.getSession();
      setIsLoggedIn(!!session);
      setAccessToken(session?.access_token ?? null);
    };
    checkAuth();

    const { data: { subscription } } = portalSupabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
      setAccessToken(session?.access_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (serviceParam && SERVICE_PARAM_MAP[serviceParam]) {
      setServiceType(SERVICE_PARAM_MAP[serviceParam]);
    } else if (productParam === "pilot") {
      setServiceType("ai");
    }
  }, [serviceParam, productParam]);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

  const locationRequired = NEEDS_LOCATION.includes(serviceType);

  const canSubmit =
    !!serviceType &&
    businessName.trim().length > 1 &&
    isValidEmail(email) &&
    notes.trim().length > 1 &&
    (!locationRequired || serviceArea.trim().length > 1);

  const handleSubmit = async () => {
    if (!canSubmit || isLoading) {
      setTouched({ businessName: true, email: true, serviceArea: true, notes: true });
      return;
    }

    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const { data, error } = await portalSupabase.functions.invoke("leads/request-demo", {
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

      // Guest inquiry: honest in-place receipt, optional account setup
      setReceipt({
        projectToken: data?.project_token ?? null,
        email: email.trim(),
        name: yourName.trim(),
        business: businessName.trim(),
      });
    } catch (err) {
      console.error("Inquiry error:", err);
      toast({
        title: "Something went wrong",
        description: `Please try again, or email ${NAP.email}.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const createPasswordHref = receipt?.projectToken
    ? `/create-password?${new URLSearchParams({
        token: receipt.projectToken,
        email: receipt.email,
        name: receipt.name,
        business: receipt.business,
      }).toString()}`
    : null;

  return (
    <Shell>
      <SEOHead
        title="Contact — Pleasant Cove Design"
        description="Email Ben directly, start with a client account, or send a short website inquiry. Pleasant Cove Design, Midcoast Maine."
        path="/get-demo"
      />

      <main className="flex-1 flex items-start justify-center py-10 md:py-14 px-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <img src={pcdLogo} alt="Pleasant Cove Design" className="w-12 h-12 rounded-full mb-4 mx-auto" />
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">Get in touch</h1>
            <p className="text-muted-foreground">
              The fastest way to reach me is email. Prefer to keep everything in one place? Start with a client account.
            </p>
          </div>

          {receipt ? (
            /* Honest in-place receipt after a guest inquiry */
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 text-center shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-accent mx-auto mb-4" aria-hidden="true" />
              <h2 className="font-serif text-2xl font-bold mb-3">Your inquiry has been saved.</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                I’ll review it and follow up using the email you provided.
              </p>
              {createPasswordHref && (
                <div className="border-t border-border pt-5">
                  <p className="text-sm text-muted-foreground mb-3">
                    Want to follow along? Create a password to track this project in your client portal — optional.
                  </p>
                  <Button asChild className="w-full">
                    <Link to={createPasswordHref}>Create my account <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </div>
              )}
              <Button asChild variant="ghost" className="mt-4">
                <Link to="/">Back to the homepage</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Primary contact options */}
              <div className="space-y-3 mb-6">
                <a
                  href={`mailto:${NAP.email}`}
                  className="flex items-start gap-3 p-4 rounded-xl border-2 border-primary bg-primary/5 text-left transition-all hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">Email Ben</p>
                    <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{NAP.email}</p>
                    <p className="text-sm text-muted-foreground">Opens your email app</p>
                  </div>
                </a>

                <Link
                  to="/portal?tab=signup"
                  className="flex items-start gap-3 p-4 rounded-xl border-2 border-border bg-card text-left transition-all hover:border-primary/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">Start with an account</p>
                    <p className="text-sm text-muted-foreground">Create a client account and tell me about your project from your portal.</p>
                  </div>
                </Link>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                  <a href={`sms:${NAP.phoneE164}`} className="inline-flex items-center gap-2 font-medium text-foreground hover:text-primary">
                    <MessageSquare className="w-4 h-4" />
                    Text Ben — {NAP.phone}
                  </a>
                  <Link to="/portal" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <LogIn className="w-4 h-4" />
                    Returning client? Log in
                  </Link>
                </div>
              </div>

              {/* Secondary: short website inquiry */}
              <details
                className="group rounded-2xl border border-border bg-card shadow-sm"
                open={inquiryOpen}
                onToggle={(e) => setInquiryOpen(e.currentTarget.open)}
              >
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 p-4 md:p-5 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring rounded-2xl">
                  <span>Prefer a short website inquiry?</span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
                </summary>

                <form
                  className="space-y-5 border-t border-border p-4 md:p-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                >
                  {/* Service picker: shown for deep links, otherwise optional */}
                  {hasDeepLink ? (
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
                  ) : null}

                  {/* Essentials */}
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business name *</Label>
                    <Input
                      id="businessName"
                      required
                      aria-invalid={!!touched.businessName && businessName.trim().length < 2}
                      aria-describedby={touched.businessName && businessName.trim().length < 2 ? "businessName-error" : undefined}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, businessName: true }))}
                      placeholder="e.g. Smith Plumbing"
                      autoComplete="organization"
                    />
                    {touched.businessName && businessName.trim().length < 2 && (
                      <p id="businessName-error" className="text-xs text-destructive">Please enter your business name.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      required
                      aria-invalid={!!touched.email && !isValidEmail(email)}
                      aria-describedby={touched.email && !isValidEmail(email) ? "email-error" : undefined}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      placeholder="john@smithplumbing.com"
                      autoComplete="email"
                    />
                    {touched.email && !isValidEmail(email) && (
                      <p id="email-error" className="text-xs text-destructive">Please enter a valid email address.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Message *</Label>
                    <Textarea
                      id="notes"
                      required
                      aria-invalid={!!touched.notes && notes.trim().length < 2}
                      aria-describedby={touched.notes && notes.trim().length < 2 ? "notes-error" : undefined}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, notes: true }))}
                      placeholder="What's not working, what you're hoping for, or when you'd like it done."
                      rows={3}
                    />
                    {touched.notes && notes.trim().length < 2 && (
                      <p id="notes-error" className="text-xs text-destructive">Please add a short message.</p>
                    )}
                  </div>

                  {/* City/town: contextual, required for demo/website/existing */}
                  {locationRequired && (
                    <div className="space-y-2">
                      <Label htmlFor="serviceArea">Where do you serve customers? *</Label>
                      <Input
                        id="serviceArea"
                        required
                        aria-invalid={!!touched.serviceArea && serviceArea.trim().length < 2}
                        aria-describedby={touched.serviceArea && serviceArea.trim().length < 2 ? "serviceArea-error" : undefined}
                        value={serviceArea}
                        onChange={(e) => setServiceArea(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, serviceArea: true }))}
                        placeholder="e.g. Damariscotta, ME"
                      />
                      {touched.serviceArea && serviceArea.trim().length < 2 && (
                        <p id="serviceArea-error" className="text-xs text-destructive">We need a town or area to build your preview.</p>
                      )}
                    </div>
                  )}

                  {/* Optional details */}
                  <details
                    className="group/inner rounded-xl border border-border bg-background/50"
                    open={optionalDetailsOpen}
                    onToggle={(e) => setOptionalDetailsOpen(e.currentTarget.open)}
                  >
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring rounded-xl">
                      <span>More details (optional)</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-open/inner:rotate-90" aria-hidden="true" />
                    </summary>
                    <div className="space-y-4 border-t border-border p-4">
                      {!hasDeepLink && (
                        <div className="space-y-2">
                          <Label htmlFor="serviceSelect">What is this about?</Label>
                          <select
                            id="serviceSelect"
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value as ServiceType)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            {SERVICE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.title}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="yourName">Your name</Label>
                          <Input
                            id="yourName"
                            value={yourName}
                            onChange={(e) => setYourName(e.target.value)}
                            placeholder="e.g. John Smith"
                            autoComplete="name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
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
                      {!locationRequired && (
                        <div className="space-y-2">
                          <Label htmlFor="serviceAreaOptional">Town or service area</Label>
                          <Input
                            id="serviceAreaOptional"
                            value={serviceArea}
                            onChange={(e) => setServiceArea(e.target.value)}
                            placeholder="e.g. Damariscotta, ME"
                          />
                        </div>
                      )}
                    </div>
                  </details>

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

                  <p className="text-center text-xs text-muted-foreground">
                    By submitting, you agree to receive follow-up communication. We won't share your info or send unwanted messages.
                  </p>
                </form>
              </details>

              {/* Free review alt path */}
              <button
                type="button"
                onClick={() => navigate("/get-demo?service=review")}
                className="mt-4 w-full rounded-xl border-2 border-dashed border-border bg-card p-4 text-left transition-all hover:border-primary/50"
              >
                <p className="text-sm font-medium">Not ready yet? Get a free review of your current site</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Drop your URL — we'll send honest feedback on what's costing you customers. No sales pressure.
                </p>
              </button>
            </>
          )}
        </div>
      </main>
    </Shell>
  );
};

export default GetDemo;
