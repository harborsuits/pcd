import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Check, Bot, Globe, Package, Palette, Image, Search, HelpCircle, DollarSign, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/portal/ClientLayout";
import { cn } from "@/lib/utils";
import { getPricingTiersForService, RETAINER_ADDONS, ALACARTE_SERVICES, CARE_PLANS } from "@/lib/pricingMenu";
import { PricingSummary } from "@/components/intake/PricingSummary";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type ServiceType = "ai" | "website" | "both" | "other" | "";
type WebsiteGoal = "calls" | "quotes" | "bookings" | "info" | "";
type Timeline = "asap" | "2-4weeks" | "1-2months" | "unsure" | "";
type LogoStatus = "yes" | "no" | "refresh" | "";
type PhotoReadiness = "ready" | "some" | "none" | "";
type Tone = "friendly" | "professional" | "direct" | "";

// Map query param values to form values
const SERVICE_PARAM_MAP: Record<string, ServiceType> = {
  website: "website",
  ai_receptionist: "ai",
  ai: "ai",
  both: "both",
  other: "other",
};

interface FormData {
  // Basics
  businessName: string;
  yourName: string;
  email: string;
  phone: string;
  serviceType: ServiceType;
  
  // Website fields
  websiteGoal: WebsiteGoal;
  serviceArea: string;
  timeline: Timeline;
  logoStatus: LogoStatus;
  brandColors: string;
  servicesList: string;
  photoReadiness: PhotoReadiness;
  
  // AI Receptionist fields
  businessPhone: string;
  businessHours: string;
  servicesOffered: string;
  escalationNumber: string;
  emergencyRules: string;
  preferredTone: Tone;
  bookingLink: string;
  faqs: string;
  
  // Other/à la carte fields
  selectedServices: string[];
  customRequest: string;
  
  // Pricing
  pricingTier: string;
  pricingNotes: string;
  retainerAddons: string[];
  addonNotes: string;
  
  // New: À la carte add-ons and care plans
  alacarteAddons: string[];
  carePlan: string;
}

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    yourName: "",
    email: "",
    phone: "",
    serviceType: "",
    websiteGoal: "",
    serviceArea: "",
    timeline: "",
    logoStatus: "",
    brandColors: "",
    servicesList: "",
    photoReadiness: "",
    businessPhone: "",
    businessHours: "",
    servicesOffered: "",
    escalationNumber: "",
    emergencyRules: "",
    preferredTone: "",
    bookingLink: "",
    faqs: "",
    selectedServices: [],
    customRequest: "",
    pricingTier: "",
    pricingNotes: "",
    retainerAddons: [],
    addonNotes: "",
    alacarteAddons: [],
    carePlan: "",
  });

  // Auth guard
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Please sign in",
          description: "You need to be logged in to start a new project.",
          variant: "destructive",
        });
        navigate("/portal", { replace: true });
        return;
      }
      
      // Pre-fill email from session
      setFormData(prev => ({
        ...prev,
        email: session.user.email || "",
      }));
      setAuthChecking(false);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && !authChecking) {
        navigate("/portal", { replace: true });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate, authChecking, toast]);

  // Pre-select service type from URL param and auto-advance
  useEffect(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam && SERVICE_PARAM_MAP[serviceParam]) {
      setFormData(prev => ({ ...prev, serviceType: SERVICE_PARAM_MAP[serviceParam] }));
      setCurrentStep(1);
    }
  }, [searchParams]);

  // Determine steps based on service type
  const getSteps = () => {
    const steps = [{ id: "choose", label: "Choose" }];
    
    if (!formData.serviceType) {
      return steps;
    }
    
    steps.push({ id: "basics", label: "Basics" });
    
    if (formData.serviceType === "website" || formData.serviceType === "both") {
      steps.push({ id: "website", label: "Website" });
      steps.push({ id: "brand", label: "Brand" });
    }
    
    if (formData.serviceType === "ai" || formData.serviceType === "both") {
      steps.push({ id: "ai", label: "AI Setup" });
    }
    
    if (formData.serviceType === "other") {
      steps.push({ id: "other", label: "Services" });
    }
    
    // Add pricing/addons for ai, website, both only
    if (formData.serviceType === "ai" || formData.serviceType === "website" || formData.serviceType === "both") {
      steps.push({ id: "pricing", label: "Pricing" });
      steps.push({ id: "addons", label: "Addons" });
    }
    
    return steps;
  };

  const steps = getSteps();
  const currentStepId = steps[currentStep]?.id;

  const canProceed = () => {
    switch (currentStepId) {
      case "choose":
        return !!formData.serviceType;
      case "basics":
        return formData.businessName.trim() && formData.email.trim() && formData.phone.trim();
      case "website":
        return !!formData.websiteGoal && formData.serviceArea.trim() && !!formData.timeline;
      case "brand":
        return !!formData.logoStatus && !!formData.photoReadiness;
      case "ai":
        return formData.businessPhone.trim() && formData.businessHours.trim() && 
               formData.servicesOffered.trim() && formData.escalationNumber.trim() && 
               formData.emergencyRules.trim() && !!formData.preferredTone;
      case "other":
        return formData.selectedServices.length > 0 || formData.customRequest.trim().length > 0;
      case "pricing":
        return !!formData.pricingTier;
      case "addons":
        return true; // Optional step
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/portal");
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to create a project.",
          variant: "destructive",
        });
        navigate("/portal");
        return;
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/create-project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          intake: {
            serviceType: formData.serviceType,
            businessName: formData.businessName.trim(),
            yourName: formData.yourName.trim(),
            contactEmail: formData.email.trim(),
            contactPhone: formData.phone.trim(),
            // Website fields
            websiteGoal: formData.websiteGoal || null,
            serviceArea: formData.serviceArea.trim() || null,
            timeline: formData.timeline || null,
            logoStatus: formData.logoStatus || null,
            brandColors: formData.brandColors.trim() || null,
            servicesList: formData.servicesList.trim() || null,
            photoReadiness: formData.photoReadiness || null,
            // AI fields
            businessPhone: formData.businessPhone.trim() || null,
            businessHours: formData.businessHours.trim() || null,
            servicesOffered: formData.servicesOffered.trim() || null,
            escalationNumber: formData.escalationNumber.trim() || null,
            emergencyRules: formData.emergencyRules.trim() || null,
            preferredTone: formData.preferredTone || null,
            bookingLink: formData.bookingLink.trim() || null,
            faqs: formData.faqs.trim() || null,
            // Other fields
            selectedServices: formData.selectedServices.length > 0 ? formData.selectedServices : null,
            customRequest: formData.customRequest.trim() || null,
            // Pricing fields
            pricingTier: formData.pricingTier || null,
            pricingNotes: formData.pricingNotes.trim() || null,
            retainerAddons: formData.retainerAddons.length > 0 ? formData.retainerAddons : null,
            addonNotes: formData.addonNotes.trim() || null,
            // New add-ons
            alacarteAddons: formData.alacarteAddons.length > 0 ? formData.alacarteAddons : null,
            carePlan: formData.carePlan || null,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      toast({
        title: getSuccessTitle(),
        description: getSuccessDescription(),
      });
      
      navigate(`/w/${data.project_token}`);
    } catch (err) {
      console.error("Create project error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us for help.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSuccessTitle = () => {
    if (formData.serviceType === "ai") return "You're set.";
    if (formData.serviceType === "website") return "Got it.";
    if (formData.serviceType === "other") return "Request received.";
    return "Perfect — we've got everything.";
  };

  const getSuccessDescription = () => {
    if (formData.serviceType === "ai") {
      return "We'll finalize your AI receptionist setup and follow up within 24–48 hours.";
    }
    if (formData.serviceType === "website") {
      return "We'll build your first preview and notify you when it's ready (usually 24–48 hours).";
    }
    if (formData.serviceType === "other") {
      return "We'll review your request and reach out within 24–48 hours to discuss next steps.";
    }
    return "We'll start your website + AI receptionist setup and update you within 24–48 hours.";
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const ServiceCard = ({ 
    value, 
    icon: Icon, 
    title, 
    description, 
    badge 
  }: { 
    value: ServiceType; 
    icon: typeof Bot; 
    title: string; 
    description: string;
    badge?: string;
  }) => (
    <button
      type="button"
      onClick={() => {
        updateField("serviceType", value);
        setCurrentStep(1);
      }}
      className={cn(
        "relative p-6 rounded-xl border-2 text-left transition-all duration-200",
        "hover:border-primary/50 hover:shadow-md",
        formData.serviceType === value 
          ? "border-primary bg-primary/5" 
          : "border-border bg-card"
      )}
    >
      <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      {badge && (
        <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
          {badge}
        </span>
      )}
    </button>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP RENDERERS (same as GetDemo)
  // ═══════════════════════════════════════════════════════════════════════════

  const renderChooseStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl font-bold mb-2">What are you looking for?</h2>
        <p className="text-muted-foreground">Choose your starting point — we'll handle the rest.</p>
      </div>
      
      <div className="grid gap-4">
        <ServiceCard
          value="ai"
          icon={Bot}
          title="AI Receptionist"
          description="Answer calls, texts & forms 24/7. Start capturing leads instantly."
        />
        <ServiceCard
          value="website"
          icon={Globe}
          title="Website"
          description="A fast, modern site that converts visitors into customers."
        />
        <ServiceCard
          value="both"
          icon={Package}
          title="Complete Growth System"
          description="Website + AI Receptionist — the complete lead-capture system."
          badge="Most Popular"
        />
      </div>
      
      <p className="text-center text-sm text-muted-foreground">
        Need something else?{" "}
        <button
          type="button"
          onClick={() => {
            updateField("serviceType", "other");
            setCurrentStep(1);
          }}
          className="text-primary hover:underline"
        >
          Tell us what you're looking for →
        </button>
      </p>
    </div>
  );

  const renderBasicsStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Business basics</h2>
        <p className="text-muted-foreground">Just enough to set things up and follow up with you.</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business name *</Label>
          <Input
            id="businessName"
            placeholder="e.g. Smith Plumbing"
            value={formData.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="yourName">Your name</Label>
          <Input
            id="yourName"
            placeholder="e.g. John Smith"
            value={formData.yourName}
            onChange={(e) => updateField("yourName", e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@smithplumbing.com"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Best phone number *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(207) 555-1234"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Where we can reach you (not necessarily the number customers call)
          </p>
        </div>
      </div>
    </div>
  );

  const renderWebsiteStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Website goals</h2>
        <p className="text-muted-foreground">A fast, modern site that converts visitors into customers.</p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-3">
          <Label>What do you want the site to do? *</Label>
          <RadioGroup
            value={formData.websiteGoal}
            onValueChange={(v: WebsiteGoal) => updateField("websiteGoal", v)}
            className="grid gap-2"
            disabled={isLoading}
          >
            {[
              { value: "calls", label: "Get calls" },
              { value: "quotes", label: "Get quote requests" },
              { value: "bookings", label: "Book appointments" },
              { value: "info", label: "Show services" },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                <RadioGroupItem value={opt.value} id={`goal-${opt.value}`} />
                <Label htmlFor={`goal-${opt.value}`} className="cursor-pointer font-normal flex-1">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceArea">Where do you serve customers? *</Label>
          <Input
            id="serviceArea"
            placeholder="e.g. Portland, ME and surrounding areas"
            value={formData.serviceArea}
            onChange={(e) => updateField("serviceArea", e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">City, county, or general area</p>
        </div>

        <div className="space-y-3">
          <Label>Timeline / urgency *</Label>
          <RadioGroup
            value={formData.timeline}
            onValueChange={(v: Timeline) => updateField("timeline", v)}
            className="grid gap-2"
            disabled={isLoading}
          >
            {[
              { value: "asap", label: "ASAP" },
              { value: "2-4weeks", label: "2–4 weeks" },
              { value: "1-2months", label: "1–2 months" },
              { value: "unsure", label: "Not sure" },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                <RadioGroupItem value={opt.value} id={`timeline-${opt.value}`} />
                <Label htmlFor={`timeline-${opt.value}`} className="cursor-pointer font-normal flex-1">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );

  const renderBrandStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Brand & content</h2>
        <p className="text-muted-foreground">Don't stress — "I don't have it yet" is totally fine.</p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-3">
          <Label>Do you have a logo? *</Label>
          <RadioGroup
            value={formData.logoStatus}
            onValueChange={(v: LogoStatus) => updateField("logoStatus", v)}
            className="grid gap-2"
            disabled={isLoading}
          >
            {[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "refresh", label: "Need a refresh" },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                <RadioGroupItem value={opt.value} id={`logo-${opt.value}`} />
                <Label htmlFor={`logo-${opt.value}`} className="cursor-pointer font-normal flex-1">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brandColors">Brand colors (if you have them)</Label>
          <Input
            id="brandColors"
            placeholder="e.g. Navy blue and gold, or #1a365d"
            value={formData.brandColors}
            onChange={(e) => updateField("brandColors", e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">Paste hex codes or describe them</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="servicesList">What services should be listed on the site?</Label>
          <Textarea
            id="servicesList"
            placeholder="e.g. Emergency plumbing, Water heater repair, Drain cleaning..."
            value={formData.servicesList}
            onChange={(e) => updateField("servicesList", e.target.value)}
            disabled={isLoading}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">Bullet list is fine</p>
        </div>

        <div className="space-y-3">
          <Label>Photos / content readiness *</Label>
          <RadioGroup
            value={formData.photoReadiness}
            onValueChange={(v: PhotoReadiness) => updateField("photoReadiness", v)}
            className="grid gap-2"
            disabled={isLoading}
          >
            {[
              { value: "ready", label: "Ready" },
              { value: "some", label: "Some" },
              { value: "none", label: "None yet" },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                <RadioGroupItem value={opt.value} id={`photo-${opt.value}`} />
                <Label htmlFor={`photo-${opt.value}`} className="cursor-pointer font-normal flex-1">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );

  const renderAIStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">AI Receptionist setup</h2>
        <p className="text-muted-foreground">This is the info we use to answer calls, texts, and form leads correctly.</p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="businessPhone">Main business phone number *</Label>
          <Input
            id="businessPhone"
            type="tel"
            placeholder="(207) 555-1234"
            value={formData.businessPhone}
            onChange={(e) => updateField("businessPhone", e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">The number customers already call</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessHours">Business hours *</Label>
          <Input
            id="businessHours"
            placeholder="e.g. Mon-Fri 8am-5pm, Sat 9am-12pm"
            value={formData.businessHours}
            onChange={(e) => updateField("businessHours", e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">When you want calls handled normally</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="servicesOffered">Services you offer *</Label>
          <Textarea
            id="servicesOffered"
            placeholder="e.g. Emergency plumbing, Water heater repair, Drain cleaning..."
            value={formData.servicesOffered}
            onChange={(e) => updateField("servicesOffered", e.target.value)}
            disabled={isLoading}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">A quick list is fine</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="escalationNumber">Escalation number *</Label>
          <Input
            id="escalationNumber"
            type="tel"
            placeholder="(207) 555-9999"
            value={formData.escalationNumber}
            onChange={(e) => updateField("escalationNumber", e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">Where emergencies / handoffs should go</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergencyRules">What counts as an emergency? *</Label>
          <Textarea
            id="emergencyRules"
            placeholder="e.g. Flooding, no heat, fire, gas leak, burst pipes..."
            value={formData.emergencyRules}
            onChange={(e) => updateField("emergencyRules", e.target.value)}
            disabled={isLoading}
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="space-y-3">
          <Label>Preferred tone *</Label>
          <RadioGroup
            value={formData.preferredTone}
            onValueChange={(v: Tone) => updateField("preferredTone", v)}
            className="grid grid-cols-3 gap-2"
            disabled={isLoading}
          >
            {[
              { value: "friendly", label: "Friendly" },
              { value: "professional", label: "Professional" },
              { value: "direct", label: "Direct" },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                <RadioGroupItem value={opt.value} id={`tone-${opt.value}`} />
                <Label htmlFor={`tone-${opt.value}`} className="cursor-pointer font-normal text-sm">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bookingLink">Calendar integration (optional)</Label>
          <Input
            id="bookingLink"
            type="url"
            placeholder="https://calendly.com/your-business"
            value={formData.bookingLink}
            onChange={(e) => updateField("bookingLink", e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">Calendly, Acuity, etc.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="faqs">Common questions & answers (optional)</Label>
          <Textarea
            id="faqs"
            placeholder="Paste anything customers ask a lot..."
            value={formData.faqs}
            onChange={(e) => updateField("faqs", e.target.value)}
            disabled={isLoading}
            rows={3}
            className="resize-none"
          />
        </div>
      </div>
    </div>
  );

  const A_LA_CARTE_SERVICES = [
    { id: "logo", label: "Logo & Branding", description: "Professional logo design or refresh", icon: Palette },
    { id: "photos", label: "Animated Photos / Videos", description: "Motion graphics and video content", icon: Image },
    { id: "seo", label: "SEO & Local Optimization", description: "Google rankings and local visibility", icon: Search },
  ];

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(s => s !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));
  };

  const renderOtherStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">What do you need?</h2>
        <p className="text-muted-foreground">Select any services you're interested in, or describe what you're looking for.</p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-3">
          <Label>À la carte services</Label>
          <div className="grid gap-3">
            {A_LA_CARTE_SERVICES.map((service) => {
              const Icon = service.icon;
              const isSelected = formData.selectedServices.includes(service.id);
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200",
                    "hover:border-primary/50 hover:shadow-md",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    isSelected ? "bg-primary/20" : "bg-secondary/50"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{service.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customRequest">Something specific or unique?</Label>
          <Textarea
            id="customRequest"
            placeholder="Tell us about any custom needs, integrations, or ideas you have in mind..."
            value={formData.customRequest}
            onChange={(e) => updateField("customRequest", e.target.value)}
            disabled={isLoading}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Examples: CRM integrations, custom booking flows, membership portals, etc.
          </p>
        </div>
      </div>
    </div>
  );

  // Get pricing tiers from shared module
  const pricingTiers = getPricingTiersForService(formData.serviceType);

  const renderPricingStep = () => {
    const serviceLabel = formData.serviceType === "ai" 
      ? "AI Receptionist" 
      : formData.serviceType === "website" 
        ? "Website" 
        : "Complete Growth System";

    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold mb-2">Choose your package</h2>
          <p className="text-muted-foreground">
            Select a {serviceLabel} that fits your needs. We'll finalize details on a quick call.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            We don't take bookings here — this helps us prepare for our conversation.
          </p>
        </div>

        <div className="space-y-4">
          {pricingTiers.map((tier) => {
            const isSelected = formData.pricingTier === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => updateField("pricingTier", tier.id)}
                disabled={isLoading}
                className={cn(
                  "relative w-full flex flex-col items-start gap-2 rounded-xl border-2 p-5 text-left transition-all hover:border-primary/50",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:bg-accent/50"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <h3 className="font-semibold text-lg text-foreground">{tier.label}</h3>
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}>
                    {tier.price}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
                
                {/* Show features if available */}
                {tier.features && tier.features.length > 0 && (
                  <ul className="mt-2 space-y-1.5 w-full">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pricingNotes">Budget or timing notes (optional)</Label>
          <Textarea
            id="pricingNotes"
            value={formData.pricingNotes}
            onChange={(e) => updateField("pricingNotes", e.target.value)}
            placeholder="Any budget constraints or timeline goals? Let us know..."
            disabled={isLoading}
            rows={2}
            className="resize-none"
          />
        </div>
      </div>
    );
  };

  const renderAddonsStep = () => (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Add-ons & ongoing support</h2>
        <p className="text-muted-foreground">
          Enhance your package with additional services. All optional.
        </p>
      </div>

      {/* Care Plans Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Website Care Plan</Label>
        <p className="text-sm text-muted-foreground -mt-1">
          Ongoing maintenance so your site doesn't rot.
        </p>
        <div className="grid gap-3">
          {CARE_PLANS.map((plan) => {
            const isSelected = formData.carePlan === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => updateField("carePlan", isSelected ? "" : plan.id)}
                disabled={isLoading}
                className={cn(
                  "flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/30"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{plan.label}</span>
                    <span className="text-sm font-medium text-primary">${plan.monthlyPrice}/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
                </div>
                {isSelected && <Check className="h-5 w-5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* À La Carte Services */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">À La Carte Services</Label>
        <p className="text-sm text-muted-foreground -mt-1">
          One-time services to enhance your project.
        </p>
        <div className="grid gap-2">
          {ALACARTE_SERVICES.map((service) => {
            const isChecked = formData.alacarteAddons.includes(service.id);
            return (
              <div
                key={service.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer",
                  isChecked
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/30"
                )}
                onClick={() => {
                  if (isChecked) {
                    updateField("alacarteAddons", formData.alacarteAddons.filter(id => id !== service.id));
                  } else {
                    updateField("alacarteAddons", [...formData.alacarteAddons, service.id]);
                  }
                }}
              >
                <Checkbox
                  id={service.id}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateField("alacarteAddons", [...formData.alacarteAddons, service.id]);
                    } else {
                      updateField("alacarteAddons", formData.alacarteAddons.filter(id => id !== service.id));
                    }
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={service.id} className="font-medium cursor-pointer text-sm">
                      {service.label}
                    </Label>
                    <span className="text-xs text-muted-foreground">{service.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Retainer Add-ons */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Monthly Retainers</Label>
        <p className="text-sm text-muted-foreground -mt-1">
          Ongoing support to keep things running smoothly.
        </p>
        <div className="grid gap-2">
          {RETAINER_ADDONS.map((addon) => {
            const isChecked = formData.retainerAddons.includes(addon.id);
            return (
              <div
                key={addon.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer",
                  isChecked
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/30"
                )}
                onClick={() => {
                  if (isChecked) {
                    updateField("retainerAddons", formData.retainerAddons.filter(id => id !== addon.id));
                  } else {
                    updateField("retainerAddons", [...formData.retainerAddons, addon.id]);
                  }
                }}
              >
                <Checkbox
                  id={addon.id}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateField("retainerAddons", [...formData.retainerAddons, addon.id]);
                    } else {
                      updateField("retainerAddons", formData.retainerAddons.filter(id => id !== addon.id));
                    }
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={addon.id} className="font-medium cursor-pointer text-sm">
                      {addon.label}
                    </Label>
                    <span className="text-xs text-muted-foreground">{addon.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{addon.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="addonNotes">Anything specific you want covered? (optional)</Label>
        <Textarea
          id="addonNotes"
          value={formData.addonNotes}
          onChange={(e) => updateField("addonNotes", e.target.value)}
          placeholder="Tell us what matters most..."
          disabled={isLoading}
          rows={2}
          className="resize-none"
        />
      </div>

      {/* Pricing Summary before submit */}
      <PricingSummary
        serviceType={formData.serviceType}
        pricingTier={formData.pricingTier}
        pricingNotes={formData.pricingNotes}
        retainerAddons={formData.retainerAddons}
        addonNotes={formData.addonNotes}
        className="mt-6"
      />
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStepId) {
      case "choose":
        return renderChooseStep();
      case "basics":
        return renderBasicsStep();
      case "website":
        return renderWebsiteStep();
      case "brand":
        return renderBrandStep();
      case "ai":
        return renderAIStep();
      case "other":
        return renderOtherStep();
      case "pricing":
        return renderPricingStep();
      case "addons":
        return renderAddonsStep();
      default:
        return renderChooseStep();
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  if (authChecking) {
    return (
      <ClientLayout title="Loading..." subtitle="">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout
      title={currentStep === 0 ? "Start a new project" : undefined}
      subtitle={currentStep === 0 ? "Choose your starting point — we'll handle the rest." : undefined}
    >
      {/* Progress indicator */}
      {formData.serviceType && steps.length > 1 && (
        <div className="mb-8">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors",
                  index < currentStep 
                    ? "bg-primary text-primary-foreground" 
                    : index === currentStep 
                      ? "bg-primary/20 text-primary border border-primary" 
                      : "bg-muted text-muted-foreground"
                )}>
                  {index < currentStep ? <Check className="w-3 h-3" /> : index + 1}
                </div>
                <span className={cn(
                  "ml-2 text-sm hidden sm:inline",
                  index === currentStep ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-8 h-px mx-3",
                    index < currentStep ? "bg-primary" : "bg-border"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto">
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isLoading}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : isLastStep ? (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Project
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </ClientLayout>
  );
}
