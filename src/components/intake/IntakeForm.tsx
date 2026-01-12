import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Globe, 
  Package, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  Building2,
  Phone,
  Clock,
  AlertTriangle,
  Target,
  MapPin,
  Calendar,
  Palette,
  Camera,
  Check,
  DollarSign,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getPricingTiersForService, 
  RETAINER_ADDONS,
  ALACARTE_SERVICES,
  CARE_PLANS,
  type ServiceType as PricingServiceType 
} from "@/lib/pricingMenu";
import { PricingSummary } from "./PricingSummary";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ServiceType = "ai" | "website" | "both" | "other" | null;

export interface IntakeFormData {
  // Service selection
  serviceType: ServiceType;
  
  // Shared basics
  businessName: string;
  yourName: string;
  email: string;
  phone: string;
  
  // AI Receptionist fields
  businessPhone: string;
  businessHours: string;
  servicesOffered: string;
  escalationNumber: string;
  emergencyRules: string;
  preferredTone: "friendly" | "professional" | "direct" | "";
  bookingLink: string;
  faqs: string;
  
  // Website fields
  websiteGoal: "calls" | "quotes" | "bookings" | "info" | "";
  serviceArea: string;
  timeline: "asap" | "2-4weeks" | "1-2months" | "unsure" | "";
  servicesList: string;
  logoStatus: "have" | "need" | "refresh" | "";
  brandColors: string;
  photoReadiness: "ready" | "some" | "none" | "";
  
  // Other (à la carte)
  selectedServices: string[];
  customRequest: string;
  
  // Pricing tier
  pricingTier: string;
  pricingNotes: string;
  
  // Retainer add-ons
  retainerAddons: string[];
  addonNotes: string;
  
  // À la carte add-ons and care plans
  alacarteAddons: string[];
  carePlan: string;
}

export const DEFAULT_INTAKE_DATA: IntakeFormData = {
  serviceType: null,
  businessName: "",
  yourName: "",
  email: "",
  phone: "",
  businessPhone: "",
  businessHours: "",
  servicesOffered: "",
  escalationNumber: "",
  emergencyRules: "",
  preferredTone: "",
  bookingLink: "",
  faqs: "",
  websiteGoal: "",
  serviceArea: "",
  timeline: "",
  servicesList: "",
  logoStatus: "",
  brandColors: "",
  photoReadiness: "",
  selectedServices: [],
  customRequest: "",
  pricingTier: "",
  pricingNotes: "",
  retainerAddons: [],
  addonNotes: "",
  alacarteAddons: [],
  carePlan: "",
};

interface IntakeFormProps {
  initialServiceType?: ServiceType;
  onSubmit: (data: IntakeFormData) => Promise<void>;
  submitButtonText?: string;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE CARDS
// ═══════════════════════════════════════════════════════════════════════════

const SERVICE_OPTIONS = [
  {
    value: "ai" as const,
    label: "AI Receptionist",
    description: "Never miss a call. AI answers, books, and routes 24/7.",
    icon: Bot,
  },
  {
    value: "website" as const,
    label: "Website",
    description: "A fast, modern site that converts visitors into customers.",
    icon: Globe,
  },
  {
    value: "both" as const,
    label: "Complete Growth System",
    description: "Website + AI Receptionist working together.",
    icon: Package,
  },
  {
    value: "other" as const,
    label: "Something Else",
    description: "Logo, branding, SEO, or something custom.",
    icon: Sparkles,
  },
];

const A_LA_CARTE_OPTIONS = [
  { id: "logo", label: "Logo & Branding" },
  { id: "media", label: "Animated Photos / Videos" },
  { id: "seo", label: "SEO & Local Optimization" },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function IntakeForm({ 
  initialServiceType, 
  onSubmit, 
  submitButtonText = "Submit",
  className 
}: IntakeFormProps) {
  const [formData, setFormData] = useState<IntakeFormData>({
    ...DEFAULT_INTAKE_DATA,
    serviceType: initialServiceType || null,
  });
  const [currentStep, setCurrentStep] = useState(initialServiceType ? 1 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update service type if initialServiceType changes
  useEffect(() => {
    if (initialServiceType) {
      setFormData(prev => ({ ...prev, serviceType: initialServiceType }));
      setCurrentStep(1);
    }
  }, [initialServiceType]);

  const updateField = <K extends keyof IntakeFormData>(
    field: K,
    value: IntakeFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP CONFIGURATION
  // ─────────────────────────────────────────────────────────────────────────

  const getSteps = (): string[] => {
    const { serviceType } = formData;
    
    switch (serviceType) {
      case "ai":
        return ["choose", "basics", "ai", "pricing", "addons"];
      case "website":
        return ["choose", "basics", "website", "brand", "pricing", "addons"];
      case "both":
        return ["choose", "basics", "website", "brand", "ai", "pricing", "addons"];
      case "other":
        return ["choose", "basics", "other"];
      default:
        return ["choose"];
    }
  };

  const steps = getSteps();
  const currentStepName = steps[currentStep] || "choose";
  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // ─────────────────────────────────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────────────────────────────────

  const canProceed = (): boolean => {
    switch (currentStepName) {
      case "choose":
        return formData.serviceType !== null;
      case "basics":
        return !!(formData.businessName && formData.email && formData.phone);
      case "ai":
        return !!(
          formData.businessPhone &&
          formData.businessHours &&
          formData.servicesOffered &&
          formData.escalationNumber &&
          formData.emergencyRules &&
          formData.preferredTone
        );
      case "website":
        return !!(formData.websiteGoal && formData.serviceArea && formData.timeline);
      case "brand":
        return !!(formData.logoStatus && formData.photoReadiness);
      case "other":
        return !!(formData.selectedServices.length > 0 || formData.customRequest.trim());
      case "pricing":
        return !!formData.pricingTier;
      case "addons":
        return true; // Optional step, always can proceed
      default:
        return true;
    }
  };

  const isLastStep = currentStep === totalSteps - 1;

  // ─────────────────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (isLastStep) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP RENDERERS
  // ─────────────────────────────────────────────────────────────────────────

  const renderChooseStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Get started</h2>
        <p className="text-muted-foreground">
          Choose your starting point — we'll handle the rest.
        </p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {SERVICE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = formData.serviceType === option.value;
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField("serviceType", option.value)}
              className={cn(
                "relative flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all hover:border-primary/50",
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:bg-accent/50"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{option.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {option.description}
                </p>
              </div>
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderBasicsStep = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Business basics</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Just enough to set things up and follow up with you.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="businessName">Business name *</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
            placeholder="Your business name"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="yourName">Your name</Label>
          <Input
            id="yourName"
            value={formData.yourName}
            onChange={(e) => updateField("yourName", e.target.value)}
            placeholder="Optional but recommended"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="phone">Best phone number *</Label>
          <p className="text-xs text-muted-foreground mb-1.5">
            Where we can reach you (not necessarily the number customers call)
          </p>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>
    </div>
  );

  const renderAIStep = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">AI Receptionist setup</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          This is the info we use to answer calls, texts, and form leads correctly.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="businessPhone">
            <Phone className="inline h-4 w-4 mr-1.5" />
            Main business phone number *
          </Label>
          <p className="text-xs text-muted-foreground mb-1.5">
            The number customers already call
          </p>
          <Input
            id="businessPhone"
            type="tel"
            value={formData.businessPhone}
            onChange={(e) => updateField("businessPhone", e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <Label htmlFor="businessHours">
            <Clock className="inline h-4 w-4 mr-1.5" />
            Business hours *
          </Label>
          <p className="text-xs text-muted-foreground mb-1.5">
            When you want calls handled normally
          </p>
          <Input
            id="businessHours"
            value={formData.businessHours}
            onChange={(e) => updateField("businessHours", e.target.value)}
            placeholder="Mon–Fri 8am–6pm, Sat 9am–2pm"
          />
        </div>

        <div>
          <Label htmlFor="servicesOffered">Services you offer *</Label>
          <p className="text-xs text-muted-foreground mb-1.5">
            A quick list is fine
          </p>
          <Textarea
            id="servicesOffered"
            value={formData.servicesOffered}
            onChange={(e) => updateField("servicesOffered", e.target.value)}
            placeholder="Roof repairs, new installations, inspections..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="escalationNumber">
            <AlertTriangle className="inline h-4 w-4 mr-1.5" />
            Escalation number *
          </Label>
          <p className="text-xs text-muted-foreground mb-1.5">
            Where emergencies / handoffs should go
          </p>
          <Input
            id="escalationNumber"
            type="tel"
            value={formData.escalationNumber}
            onChange={(e) => updateField("escalationNumber", e.target.value)}
            placeholder="(555) 999-8888"
          />
        </div>

        <div>
          <Label htmlFor="emergencyRules">What counts as an emergency? *</Label>
          <p className="text-xs text-muted-foreground mb-1.5">
            Ex: flooding, no heat, fire, gas leak, etc.
          </p>
          <Textarea
            id="emergencyRules"
            value={formData.emergencyRules}
            onChange={(e) => updateField("emergencyRules", e.target.value)}
            placeholder="Active leaks, no hot water, electrical hazards..."
            rows={2}
          />
        </div>

        <div>
          <Label>Preferred tone *</Label>
          <RadioGroup
            value={formData.preferredTone}
            onValueChange={(value) => updateField("preferredTone", value as IntakeFormData["preferredTone"])}
            className="flex gap-4 mt-2"
          >
            {["friendly", "professional", "direct"].map((tone) => (
              <div key={tone} className="flex items-center space-x-2">
                <RadioGroupItem value={tone} id={`tone-${tone}`} />
                <Label htmlFor={`tone-${tone}`} className="capitalize cursor-pointer">
                  {tone}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="bookingLink">Calendar integration (optional)</Label>
          <p className="text-xs text-muted-foreground mb-1.5">
            Connect Calendly, Acuity, or Google Calendar. The AI books directly.
          </p>
          <Input
            id="bookingLink"
            type="url"
            value={formData.bookingLink}
            onChange={(e) => updateField("bookingLink", e.target.value)}
            placeholder="https://calendly.com/..."
          />
        </div>

        <div>
          <Label htmlFor="faqs">Common questions & answers (optional)</Label>
          <p className="text-xs text-muted-foreground mb-1.5">
            Paste anything customers ask a lot
          </p>
          <Textarea
            id="faqs"
            value={formData.faqs}
            onChange={(e) => updateField("faqs", e.target.value)}
            placeholder="Q: Do you offer free estimates? A: Yes, all estimates are free..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderWebsiteStep = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Website goals</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          A fast, modern site that converts visitors into customers.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>What do you want the site to do? *</Label>
          <RadioGroup
            value={formData.websiteGoal}
            onValueChange={(value) => updateField("websiteGoal", value as IntakeFormData["websiteGoal"])}
            className="grid gap-2 mt-2"
          >
            {[
              { value: "calls", label: "Get calls" },
              { value: "quotes", label: "Get quote requests" },
              { value: "bookings", label: "Book appointments" },
              { value: "info", label: "Show services" },
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`goal-${option.value}`} />
                <Label htmlFor={`goal-${option.value}`} className="cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="serviceArea">
            <MapPin className="inline h-4 w-4 mr-1.5" />
            Where do you serve customers? *
          </Label>
          <p className="text-xs text-muted-foreground mb-1.5">
            City, county, or general area
          </p>
          <Input
            id="serviceArea"
            value={formData.serviceArea}
            onChange={(e) => updateField("serviceArea", e.target.value)}
            placeholder="Greater Boston area, Cape Cod, etc."
          />
        </div>

        <div>
          <Label>
            <Calendar className="inline h-4 w-4 mr-1.5" />
            Timeline / urgency *
          </Label>
          <RadioGroup
            value={formData.timeline}
            onValueChange={(value) => updateField("timeline", value as IntakeFormData["timeline"])}
            className="grid gap-2 mt-2"
          >
            {[
              { value: "asap", label: "ASAP" },
              { value: "2-4weeks", label: "2–4 weeks" },
              { value: "1-2months", label: "1–2 months" },
              { value: "unsure", label: "Not sure" },
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`timeline-${option.value}`} />
                <Label htmlFor={`timeline-${option.value}`} className="cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );

  const renderBrandStep = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Brand & content</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Don't stress — "I don't have it yet" is totally fine.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Do you have a logo? *</Label>
          <RadioGroup
            value={formData.logoStatus}
            onValueChange={(value) => updateField("logoStatus", value as IntakeFormData["logoStatus"])}
            className="flex gap-4 mt-2"
          >
            {[
              { value: "have", label: "Yes" },
              { value: "need", label: "No" },
              { value: "refresh", label: "Need a refresh" },
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`logo-${option.value}`} />
                <Label htmlFor={`logo-${option.value}`} className="cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="brandColors">Brand colors (if you have them)</Label>
          <p className="text-xs text-muted-foreground mb-1.5">
            Paste hex codes or describe them
          </p>
          <Input
            id="brandColors"
            value={formData.brandColors}
            onChange={(e) => updateField("brandColors", e.target.value)}
            placeholder="#1a73e8 or 'navy blue and gold'"
          />
        </div>

        <div>
          <Label htmlFor="servicesList">What services should be listed on the site?</Label>
          <p className="text-xs text-muted-foreground mb-1.5">
            Bullet list is fine
          </p>
          <Textarea
            id="servicesList"
            value={formData.servicesList}
            onChange={(e) => updateField("servicesList", e.target.value)}
            placeholder="• Roof repairs&#10;• New installations&#10;• Inspections"
            rows={3}
          />
        </div>

        <div>
          <Label>
            <Camera className="inline h-4 w-4 mr-1.5" />
            Photos / content readiness *
          </Label>
          <RadioGroup
            value={formData.photoReadiness}
            onValueChange={(value) => updateField("photoReadiness", value as IntakeFormData["photoReadiness"])}
            className="flex gap-4 mt-2"
          >
            {[
              { value: "ready", label: "Ready" },
              { value: "some", label: "Some" },
              { value: "none", label: "None yet" },
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`photo-${option.value}`} />
                <Label htmlFor={`photo-${option.value}`} className="cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );

  const renderOtherStep = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">What are you looking for?</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Pick from our à la carte options or tell us what you need.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="mb-3 block">Select any that apply:</Label>
          <div className="space-y-3">
            {A_LA_CARTE_OPTIONS.map((option) => (
              <div key={option.id} className="flex items-center space-x-3">
                <Checkbox
                  id={option.id}
                  checked={formData.selectedServices.includes(option.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateField("selectedServices", [...formData.selectedServices, option.id]);
                    } else {
                      updateField(
                        "selectedServices",
                        formData.selectedServices.filter((s) => s !== option.id)
                      );
                    }
                  }}
                />
                <Label htmlFor={option.id} className="cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="customRequest">Something else? Tell us here:</Label>
          <Textarea
            id="customRequest"
            value={formData.customRequest}
            onChange={(e) => updateField("customRequest", e.target.value)}
            placeholder="Describe what you're looking for..."
            rows={4}
            className="mt-1.5"
          />
        </div>
      </div>
    </div>
  );

  // Get pricing tiers from shared module
  const pricingTiers = getPricingTiersForService(formData.serviceType);

  const renderPricingStep = () => {
    const tiers = pricingTiers;
    const serviceLabel = formData.serviceType === "ai" 
      ? "AI Receptionist" 
      : formData.serviceType === "website" 
        ? "Website" 
        : "Complete Growth System";

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Select your tier</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Choose a {serviceLabel} tier that fits your needs. We'll discuss details on our call.
          </p>
        </div>

        <div className="space-y-3">
          {tiers.map((tier) => {
            const isSelected = formData.pricingTier === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => updateField("pricingTier", tier.id)}
                className={cn(
                  "relative w-full flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all hover:border-primary/50",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:bg-accent/50"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <h3 className="font-semibold text-foreground">{tier.label}</h3>
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}>
                    {tier.price}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-4">
          <Label htmlFor="pricingNotes">Budget or timing notes (optional)</Label>
          <p className="text-xs text-muted-foreground mb-1.5">
            Comparing options? Let us know what you're aiming for.
          </p>
          <Textarea
            id="pricingNotes"
            value={formData.pricingNotes}
            onChange={(e) => updateField("pricingNotes", e.target.value)}
            placeholder="Any context that helps us scope this correctly..."
            rows={2}
          />
        </div>
      </div>
    );
  };

  const renderAddonsStep = () => (
    <div className="space-y-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Add-ons & ongoing support</h2>
        </div>
        <p className="text-muted-foreground text-sm">
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
                  id={`alacarte-${service.id}`}
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
                    <Label htmlFor={`alacarte-${service.id}`} className="font-medium cursor-pointer text-sm">
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

      <div className="pt-4">
        <Label htmlFor="addonNotes">Anything specific you want covered? (optional)</Label>
        <Textarea
          id="addonNotes"
          value={formData.addonNotes}
          onChange={(e) => updateField("addonNotes", e.target.value)}
          placeholder="Tell us what matters most..."
          rows={2}
          className="mt-1.5"
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
    switch (currentStepName) {
      case "choose":
        return renderChooseStep();
      case "basics":
        return renderBasicsStep();
      case "ai":
        return renderAIStep();
      case "website":
        return renderWebsiteStep();
      case "brand":
        return renderBrandStep();
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

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={cn("w-full max-w-xl mx-auto", className)}>
      {/* Progress bar */}
      {formData.serviceType && (
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Step content */}
      <div className="mb-8">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        {currentStep > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          type="button"
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
        >
          {isSubmitting ? (
            "Submitting..."
          ) : isLastStep ? (
            submitButtonText
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default IntakeForm;
