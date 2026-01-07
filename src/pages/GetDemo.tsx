import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Check, Bot, Globe, Package, Palette, Image, Search, HelpCircle } from "lucide-react";
import pcdLogo from "@/assets/pcd-logo.jpeg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { cn } from "@/lib/utils";

type ServiceType = "demo" | "ai" | "website" | "both" | "other" | "";
type WebsiteGoal = "calls" | "quotes" | "bookings" | "info" | "";
type Timeline = "asap" | "2-4weeks" | "1-2months" | "unsure" | "";
type LogoStatus = "yes" | "no" | "refresh" | "";
type PhotoReadiness = "ready" | "some" | "none" | "";
type Tone = "friendly" | "professional" | "direct" | "";

// Map query param values to form values
const SERVICE_PARAM_MAP: Record<string, ServiceType> = {
  demo: "demo",
  website: "website",
  ai_receptionist: "ai",
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
}

const GetDemo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
  });

  // Track if service came from URL param (skip choose step)
  const [skipChoose, setSkipChoose] = useState(false);

  // Pre-select service type from URL param and skip choose step
  useEffect(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam && SERVICE_PARAM_MAP[serviceParam]) {
      setFormData(prev => ({ ...prev, serviceType: SERVICE_PARAM_MAP[serviceParam] }));
      setSkipChoose(true);
    }
  }, [searchParams]);

  // Determine steps based on service type
  const getSteps = () => {
    const steps: { id: string; label: string }[] = [];
    
    // Only show choose step if service wasn't pre-selected via URL
    if (!skipChoose) {
      steps.push({ id: "choose", label: "Choose" });
    }
    
    if (!formData.serviceType) {
      return steps.length ? steps : [{ id: "choose", label: "Choose" }];
    }
    
    // Demo only needs basics (quick form to generate demo)
    if (formData.serviceType === "demo") {
      steps.push({ id: "basics", label: "Basics" });
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
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("leads/request-demo", {
        body: {
          business_name: formData.businessName.trim(),
          city: formData.serviceArea.trim() || null,
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          your_name: formData.yourName.trim() || null,
          service_type: formData.serviceType,
          // Website fields
          website_goal: formData.websiteGoal || null,
          timeline: formData.timeline || null,
          logo_status: formData.logoStatus || null,
          brand_colors: formData.brandColors.trim() || null,
          services_list: formData.servicesList.trim() || null,
          photo_readiness: formData.photoReadiness || null,
          // AI fields
          business_phone: formData.businessPhone.trim() || null,
          business_hours: formData.businessHours.trim() || null,
          services_offered: formData.servicesOffered.trim() || null,
          escalation_number: formData.escalationNumber.trim() || null,
          emergency_rules: formData.emergencyRules.trim() || null,
          preferred_tone: formData.preferredTone || null,
          booking_link: formData.bookingLink.trim() || null,
          faqs: formData.faqs.trim() || null,
          selected_services: formData.selectedServices.length > 0 ? formData.selectedServices : null,
          custom_request: formData.customRequest.trim() || null,
        },
      });

      if (error) throw error;

      if (data?.demo_url) {
        toast({
          title: "Demo ready!",
          description: "Redirecting you to your personalized demo...",
        });
        navigate(data.demo_url);
      } else {
        toast({
          title: getSuccessTitle(),
          description: getSuccessDescription(),
        });
        navigate("/");
      }
    } catch (err) {
      console.error("Demo request error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSuccessTitle = () => {
    if (formData.serviceType === "demo") return "Demo on the way!";
    if (formData.serviceType === "ai") return "You're set.";
    if (formData.serviceType === "website") return "Got it.";
    if (formData.serviceType === "other") return "Request received.";
    return "Perfect — we've got everything.";
  };

  const getSuccessDescription = () => {
    if (formData.serviceType === "demo") {
      return "Redirecting you to your personalized demo...";
    }
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

  const renderChooseStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl font-bold mb-2">What are you looking for?</h2>
        <p className="text-muted-foreground">Choose your starting point — we'll handle the rest.</p>
      </div>
      
      <div className="grid gap-4">
        <ServiceCard
          value="demo"
          icon={Globe}
          title="See a Demo"
          description="Preview a sample site for your business — no commitment."
        />
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
          title="Full Package"
          description="Website + AI Receptionist — the complete lead-capture system."
          badge="Most Popular"
        />
        <ServiceCard
          value="other"
          icon={Sparkles}
          title="Something Else"
          description="Logo, branding, SEO, animated media, or a custom request."
        />
      </div>
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
          <Label htmlFor="bookingLink">Booking link (optional)</Label>
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
      default:
        return renderChooseStep();
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Get Started"
        description="Request a personalized demo of our AI-powered websites and receptionist systems. No obligation, no spam."
        path="/get-demo"
      />
      
      {/* Header */}
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

      {/* Progress indicator */}
      {formData.serviceType && steps.length > 1 && (
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-6 py-3">
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
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center py-12 px-6">
        <div className="w-full max-w-lg">
          {currentStep === 0 && (
            <div className="text-center mb-8">
              <img src={pcdLogo} alt="Pleasant Cove Design" className="w-12 h-12 rounded-full mb-4 mx-auto" />
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">
                Get started
              </h1>
              <p className="text-muted-foreground">
                Choose your starting point — we'll handle the rest.
              </p>
            </div>
          )}

          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {renderCurrentStep()}
          </div>

          {/* Navigation - show when not on choose step */}
          {currentStepId !== "choose" && (
            <div className="flex gap-3 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
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
                    Submitting...
                  </>
                ) : isLastStep ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Submit
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-8">
            By submitting, you agree to receive follow-up communication.
            <br />
            We won't share your info or send unwanted messages.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pleasant Cove Design
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GetDemo;
