import { useState, useEffect } from "react";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2, CheckCircle2, LogIn, Smartphone } from "lucide-react";
import { InquiryContactLinks, InquiryLayout } from "@/components/intake/InquiryLayout";
import { ALACARTE_SERVICES } from "@/lib/pricingMenu";
import { TOWNS, VERTICALS } from "@/lib/localPages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { portalSupabase } from "@/integrations/supabase/portalClient";
import { NAP } from "@/lib/localPages";
import { ReviewRequestForm } from "@/components/intake/ReviewRequestForm";
import { SEOHead } from "@/components/SEOHead";
import { BrandMark } from "@/components/layout/BrandMark";
import { MarketingFooter } from "@/components/layout/MarketingFooter";

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

const SERVICE_OPTIONS: { value: ServiceType; title: string }[] = [
  { value: "demo", title: "See a demo site" },
  { value: "website", title: "A new website" },
  { value: "ai", title: "AI phone answering" },
  { value: "existing", title: "Help with my current site" },
  { value: "other", title: "Something else" },
];

/** These request types need a location so we can build the preview */
const NEEDS_LOCATION: ServiceType[] = ["demo", "website", "existing"];

const mapServiceType = (type: ServiceType): string => {
  if (type === "ai") return "ai_receptionist";
  if (type === "existing") return "website";
  return type || "other";
};

const normalizeExistingWebsite = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 500 || /\s/.test(trimmed)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const validHostname = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
      url.hostname,
    );
    if (!["http:", "https:"].includes(url.protocol) || !validHostname || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
};

const existingWebsiteSchema = z.object({
  website: z
    .string()
    .trim()
    .min(3, "Enter your current website.")
    .max(500, "Keep the website address under 500 characters.")
    .refine(
      (value) => normalizeExistingWebsite(value) !== null,
      "Enter a valid domain or full URL, such as yourbusiness.com.",
    ),
  email: z.string().trim().email("Enter a valid email address.").max(255, "Keep your email under 255 characters."),
  message: z
    .string()
    .trim()
    .min(2, "Tell me a little about what you’d like to change.")
    .max(2000, "Keep your message under 2,000 characters."),
});

type ExistingWebsiteField = keyof z.infer<typeof existingWebsiteSchema>;

const ExistingWebsiteInquiry = ({
  accessToken,
  tier,
  product,
  isTrial,
}: {
  accessToken: string | null;
  tier: string | null;
  product: string | null;
  isTrial: boolean;
}) => {
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState<Record<ExistingWebsiteField, boolean>>({
    website: false,
    email: false,
    message: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const parsed = existingWebsiteSchema.safeParse({ website, email, message });
  const fieldError = (field: ExistingWebsiteField) => {
    if (parsed.success || !touched[field]) return undefined;
    return parsed.error.flatten().fieldErrors[field]?.[0];
  };
  const websiteError = fieldError("website");
  const emailError = fieldError("email");
  const messageError = fieldError("message");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ website: true, email: true, message: true });
    setSubmitError("");
    if (!parsed.success || isLoading) return;

    setIsLoading(true);
    try {
      const normalizedWebsite = normalizeExistingWebsite(parsed.data.website);
      if (!normalizedWebsite) throw new Error("Invalid website");
      const headers: Record<string, string> = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      const { data, error } = await portalSupabase.functions.invoke("leads/request-demo", {
        headers,
        body: {
          city: null,
          phone: "",
          email: parsed.data.email,
          your_name: null,
          service_type: "website",
          inquiry_type: "existing",
          website: normalizedWebsite,
          existing_site_url: normalizedWebsite,
          custom_request: parsed.data.message,
          tier,
          product_type: product,
          is_trial: isTrial,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(typeof data.error === "string" ? data.error : "Submission failed");
      setSubmitted(true);
    } catch {
      setSubmitError(
        `We couldn’t send your inquiry. Your entries are still here — please try again, or email ${NAP.email}.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <InquiryLayout
      title="Get help with your website"
      introduction="Send me your site and tell me what you’d like to change. I’ll take a look and follow up by email about next steps."
      seoTitle="Help With Your Website — Pleasant Cove Design"
      seoDescription="Send Ben your current website and a short note about what you’d like to fix or improve. Pleasant Cove Design, Midcoast Maine."
      formTitle={submitted ? undefined : "Tell me about your site"}
      secondary={
        <>
          <p className="text-muted-foreground leading-relaxed">
            Unsure what needs fixing?{" "}
            <Link to="/get-demo?service=review" className="font-medium text-foreground underline underline-offset-4">
              Get a free website review.
            </Link>
          </p>
          <InquiryContactLinks />
        </>
      }
    >
      {submitted ? (
        <div className="py-6 text-center" role="status">
          <CheckCircle2 className="w-10 h-10 text-accent mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-serif text-2xl font-bold mb-3">Thank you</h2>
          <p className="text-muted-foreground leading-relaxed">
            Thanks, I got your inquiry. I’ll take a look at your site and follow up by email.
          </p>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="existingWebsite">Current website</Label>
            <Input
              id="existingWebsite"
              required
              aria-required="true"
              aria-invalid={!!websiteError}
              aria-describedby={websiteError ? "existingWebsite-error" : undefined}
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, website: true }))}
              placeholder="yourbusiness.com"
              autoComplete="url"
              inputMode="url"
              maxLength={500}
            />
            {websiteError && (
              <p id="existingWebsite-error" className="text-sm text-destructive">
                {websiteError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="existingEmail">Your email</Label>
            <Input
              id="existingEmail"
              required
              aria-required="true"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "existingEmail-error" : undefined}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, email: true }))}
              placeholder="you@yourbusiness.com"
              autoComplete="email"
              maxLength={255}
            />
            {emailError && (
              <p id="existingEmail-error" className="text-sm text-destructive">
                {emailError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="existingMessage">What would you like to fix or improve?</Label>
            <Textarea
              id="existingMessage"
              required
              aria-required="true"
              aria-invalid={!!messageError}
              aria-describedby={`existingMessage-help${messageError ? " existingMessage-error" : ""}`}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, message: true }))}
              rows={5}
              maxLength={2000}
            />
            <p id="existingMessage-help" className="text-sm text-muted-foreground leading-relaxed">
              A sentence or two is plenty. Think contact forms, adding pages, or making the site easier to use.
            </p>
            {messageError && (
              <p id="existingMessage-error" className="text-sm text-destructive">
                {messageError}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full h-12 text-base">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send website inquiry"
            )}
          </Button>
          {submitError && (
            <p role="alert" className="text-sm text-destructive leading-relaxed">
              {submitError}
            </p>
          )}
        </form>
      )}
    </InquiryLayout>
  );
};

function WebsiteReviewPage({ contextNote }: { contextNote?: string }) {
  return (
    <div className="pcd-shell flex min-h-screen flex-col bg-[#fbfaf6] text-[#172f37]">
      <SEOHead
        title="Free Website Review — Pleasant Cove Design"
        description="Get a personal website review from Ben at Pleasant Cove Design, with a short video and practical recommendations for what to fix first."
        path="/get-demo"
      />
      <header className="border-b border-[#d8e3df] bg-[#fffcf7]">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-1 sm:px-8"
        >
          <Link to="/" aria-label="Pleasant Cove Design home">
            <BrandMark compact />
          </Link>
          <Link
            to="/portal"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[#455f65] hover:text-[#172f37]"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Client login
          </Link>
        </nav>
      </header>

      <main className="flex-1 bg-[radial-gradient(ellipse_at_top_left,_#dfede8,_transparent_66%)]">
        <div className="mx-auto grid max-w-6xl items-start gap-6 px-5 pb-8 pt-7 sm:gap-8 sm:px-8 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.93fr)] lg:gap-x-16 lg:gap-y-8 lg:pb-11 lg:pt-14">
          <div className="lg:col-start-1 lg:row-start-1 lg:pt-2">
            <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[#25564e] sm:mb-4">
              <span className="h-2 w-2 rounded-full bg-[#3a7569]" aria-hidden="true" />
              Free website review
            </p>
            <h1 className="max-w-[13ch] text-balance font-serif text-[clamp(2.35rem,7.5vw,4.1rem)] font-medium leading-[1.03] tracking-[-0.047em]">
              Find out what to fix on your website.
            </h1>
            <p className="mt-3 max-w-[43ch] text-base leading-relaxed text-[#3e5960] sm:mt-5 sm:text-lg">
              I’ll check how your site works on a phone and how easily customers can reach you. You’ll get a short video
              walkthrough and written notes on what I’d fix first.
            </p>
          </div>

          <section
            aria-labelledby="review-heading"
            className="rounded-2xl border border-[#d8e3df] bg-white p-5 shadow-[0_16px_45px_-26px_#193c3b55] sm:p-8 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            <ReviewRequestForm contextNote={contextNote} />
          </section>

          <aside
            aria-labelledby="sample-review-heading"
            className="rounded-2xl bg-[#17383a] px-5 py-5 text-[#f2f9f5] sm:px-6 lg:col-start-1 lg:row-start-2"
          >
            <h2 id="sample-review-heading" className="flex items-center gap-3 text-sm font-semibold text-[#c9e5da]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#5e837a] bg-[#264c4c]">
                <Smartphone className="h-4 w-4" aria-hidden="true" />
              </span>
              What a review finding looks like
            </h2>
            <p className="mt-3 font-serif text-xl font-medium leading-snug sm:text-2xl">
              “Your quote link is hard to find on a phone.”
            </p>
            <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-[#c9dfd8] sm:text-base">
              Put a “Request a quote” button beside your phone number near the top of the page.
            </p>
          </aside>

          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[#d8e3df] pt-4 text-sm text-[#455f65] lg:col-span-2">
            <p>
              Need something else?{" "}
              <Link to="/get-demo" className="font-semibold text-[#25564e] underline underline-offset-4">
                Send a general inquiry
              </Link>
              .
            </p>
            <InquiryContactLinks />
          </div>
        </div>
      </main>
      <MarketingFooter compact />
    </div>
  );
}

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
  const [submitError, setSubmitError] = useState("");
  const [receipt, setReceipt] = useState<{
    projectToken: string | null;
    email: string;
    name: string;
    business: string;
  } | null>(null);

  // ?service=review → the lightweight free-review form
  const isReviewMode = searchParams.get("service") === "review";

  // Keep old deep links working: ?service=, ?tier=, ?product=, ?trial=
  const tierParam = searchParams.get("tier");
  const productParam = searchParams.get("product");
  const isTrial = searchParams.get("trial") === "true";
  const serviceParam = searchParams.get("service");
  const requestedService = ALACARTE_SERVICES.find((service) => service.id === searchParams.get("request"));
  const reviewTown = TOWNS.find((town) => town.slug === searchParams.get("town"));
  const reviewVertical = VERTICALS.find((vertical) => vertical.slug === searchParams.get("industry"));
  const reviewContext =
    [reviewTown ? `Town: ${reviewTown.name}, ME` : "", reviewVertical ? `Industry: ${reviewVertical.name}` : ""]
      .filter(Boolean)
      .join("\n") || undefined;

  const [optionalDetailsOpen, setOptionalDetailsOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await portalSupabase.auth.getSession();
      setIsLoggedIn(!!session);
      setAccessToken(session?.access_token ?? null);
    };
    checkAuth();

    const {
      data: { subscription },
    } = portalSupabase.auth.onAuthStateChange((_, session) => {
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

  useEffect(() => {
    if (!requestedService) return;
    setServiceType("other");
    setNotes((current) => current || `I’m interested in ${requestedService.label}.`);
  }, [requestedService]);

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

    setSubmitError("");
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
    } catch {
      setSubmitError(
        `We couldn’t send your inquiry. Your entries are still here — please try again, or email ${NAP.email}.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isReviewMode) {
    return <WebsiteReviewPage contextNote={reviewContext} />;
  }

  if (serviceParam === "existing") {
    return (
      <ExistingWebsiteInquiry accessToken={accessToken} tier={tierParam} product={productParam} isTrial={isTrial} />
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
    <InquiryLayout
      title={requestedService ? `Ask about ${requestedService.label}` : "How can I help?"}
      introduction="Tell me what your business needs. A few details are enough to start, and I’ll follow up by email about next steps."
      seoTitle="Contact — Pleasant Cove Design"
      seoDescription="Send Ben a short inquiry about your website, business tools, or ongoing care. Pleasant Cove Design, Midcoast Maine."
      formTitle={receipt ? undefined : "Start with a short inquiry"}
      secondary={
        <>
          <p className="text-muted-foreground leading-relaxed">
            Unsure what needs fixing?{" "}
            <Link to="/get-demo?service=review" className="font-medium text-foreground underline underline-offset-4">
              Get a free website review.
            </Link>
          </p>
          <InquiryContactLinks />
          <p className="text-muted-foreground leading-relaxed">
            Prefer to keep everything in one place?{" "}
            <Link to="/portal?tab=signup" className="font-medium text-foreground underline underline-offset-4">
              Start with a client account.
            </Link>
          </p>
        </>
      }
    >
      {receipt ? (
        <div className="py-6 text-center" role="status">
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
                <Link to={createPasswordHref}>
                  Create my account <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
          <Button asChild variant="ghost" className="mt-4">
            <Link to="/">Back to the homepage</Link>
          </Button>
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="serviceSelect">What is this about?</Label>
            <select
              id="serviceSelect"
              value={serviceType}
              onChange={(event) => setServiceType(event.target.value as ServiceType)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {SERVICE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessName">Business name *</Label>
            <Input
              id="businessName"
              required
              aria-required="true"
              aria-invalid={!!touched.businessName && businessName.trim().length < 2}
              aria-describedby={
                touched.businessName && businessName.trim().length < 2 ? "businessName-error" : undefined
              }
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, businessName: true }))}
              placeholder="e.g. Smith Plumbing"
              autoComplete="organization"
              maxLength={120}
            />
            {touched.businessName && businessName.trim().length < 2 && (
              <p id="businessName-error" className="text-sm text-destructive">
                Please enter your business name.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              required
              aria-required="true"
              aria-invalid={!!touched.email && !isValidEmail(email)}
              aria-describedby={touched.email && !isValidEmail(email) ? "email-error" : undefined}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, email: true }))}
              placeholder="john@smithplumbing.com"
              autoComplete="email"
              maxLength={255}
            />
            {touched.email && !isValidEmail(email) && (
              <p id="email-error" className="text-sm text-destructive">
                Please enter a valid email address.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Message *</Label>
            <Textarea
              id="notes"
              required
              aria-required="true"
              aria-invalid={!!touched.notes && notes.trim().length < 2}
              aria-describedby={touched.notes && notes.trim().length < 2 ? "notes-error" : undefined}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, notes: true }))}
              placeholder="What’s not working, what you’re hoping for, or when you’d like it done."
              rows={4}
              maxLength={2000}
            />
            {touched.notes && notes.trim().length < 2 && (
              <p id="notes-error" className="text-sm text-destructive">
                Please add a short message.
              </p>
            )}
          </div>

          {locationRequired && (
            <div className="space-y-2">
              <Label htmlFor="serviceArea">Where do you serve customers? *</Label>
              <Input
                id="serviceArea"
                required
                aria-required="true"
                aria-invalid={!!touched.serviceArea && serviceArea.trim().length < 2}
                aria-describedby={
                  touched.serviceArea && serviceArea.trim().length < 2 ? "serviceArea-error" : undefined
                }
                value={serviceArea}
                onChange={(event) => setServiceArea(event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, serviceArea: true }))}
                placeholder="e.g. Damariscotta, ME"
                maxLength={120}
              />
              {touched.serviceArea && serviceArea.trim().length < 2 && (
                <p id="serviceArea-error" className="text-sm text-destructive">
                  We need a town or area to build your preview.
                </p>
              )}
            </div>
          )}

          <details
            className="group rounded-xl border border-border bg-background/50"
            open={optionalDetailsOpen}
            onToggle={(event) => setOptionalDetailsOpen(event.currentTarget.open)}
          >
            <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring rounded-xl">
              <span>More details (optional)</span>
              <ArrowRight
                className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-90"
                aria-hidden="true"
              />
            </summary>
            <div className="space-y-4 border-t border-border p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="yourName">Your name</Label>
                  <Input
                    id="yourName"
                    value={yourName}
                    onChange={(event) => setYourName(event.target.value)}
                    placeholder="e.g. John Smith"
                    autoComplete="name"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="(207) 555-1234"
                    autoComplete="tel"
                    maxLength={50}
                  />
                </div>
              </div>
              {!locationRequired && (
                <div className="space-y-2">
                  <Label htmlFor="serviceAreaOptional">Town or service area</Label>
                  <Input
                    id="serviceAreaOptional"
                    value={serviceArea}
                    onChange={(event) => setServiceArea(event.target.value)}
                    placeholder="e.g. Damariscotta, ME"
                    maxLength={120}
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
                {serviceType === "demo" ? "Build my preview" : "Send inquiry"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          {submitError && (
            <p role="alert" className="text-sm text-destructive leading-relaxed">
              {submitError}
            </p>
          )}
          <p className="text-center text-xs text-muted-foreground">
            By submitting, you agree to receive follow-up communication. We won’t share your info or send unwanted
            messages.
          </p>
        </form>
      )}
    </InquiryLayout>
  );
};

export default GetDemo;
