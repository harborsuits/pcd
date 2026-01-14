import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Check, Bot, Globe, Package, Palette, Image, Search, Phone, Clock, AlertTriangle, Users, MessageSquare, FileText, CheckCircle2, Upload } from "lucide-react";
import { categoryServicesMap, generateTagline, getServicesForTemplate } from "@/lib/categoryServices";
import { FileDropZone, UploadedFile, uploadIntakeFiles } from "@/components/intake/FileDropZone";
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
type CallHandling = "always" | "after_hours" | "overflow" | "";
type AfterHoursAction = "message" | "book" | "emergency_only" | "callback_info" | "";
type PricingGuidance = "ranges" | "follow_up" | "never" | "";
type HandoffMethod = "transfer" | "message" | "callback" | "text" | "";
type IntakeTrack = "new_site" | "improve_existing" | "";
type VibeOption = "clean" | "bold" | "rustic" | "luxury" | "playful" | "modern" | "";
type AccessMethod = "collaborator" | "dns_only" | "password" | "none" | "";

// Map query param values to form values
const SERVICE_PARAM_MAP: Record<string, ServiceType> = {
  demo: "demo",
  website: "website",
  ai_receptionist: "ai",
  both: "both",
  other: "other",
};

// Map tier query param values - includes all service types
type TierType = 
  | "starter" | "growth" | "full_ops"  // Bundle tiers
  | "website_essential" | "website_growth" | "website_premium"  // Website-only tiers
  | "ai_front_door" | "ai_booking" | "ai_full"  // AI-only tiers
  | "care_starter" | "care_growth"  // Care plan tiers
  | "custom"  // "Not sure" option
  | "";

const TIER_PARAM_MAP: Record<string, TierType> = {
  // Bundle tiers
  starter: "starter",
  growth: "growth",
  full_ops: "full_ops",
  // Website tiers
  website_essential: "website_essential",
  website_growth: "website_growth",
  website_premium: "website_premium",
  // AI tiers
  ai_front_door: "ai_front_door",
  ai_booking: "ai_booking",
  ai_full: "ai_full",
  // Care plan tiers
  care_starter: "care_starter",
  care_growth: "care_growth",
};

// Product types from pricing page
type ProductType = "bundle" | "care_plan" | "pilot" | "";

interface ServiceItem {
  name: string;
  description: string;
}

interface FormData {
  // Basics
  businessName: string;
  yourName: string;
  email: string;
  phone: string;
  serviceType: ServiceType;
  
  // Tier selection (NEW)
  tier: TierType;
  productType: ProductType;
  
  // Template routing
  intakeTrack: IntakeTrack;
  productKey: string;
  intakeTemplate: string;
  
  // Website fields
  websiteGoal: WebsiteGoal;
  serviceArea: string;
  timeline: Timeline;
  logoStatus: LogoStatus;
  brandColors: string;
  servicesList: string;
  photoReadiness: PhotoReadiness;
  photoFiles: UploadedFile[];
  
  // Track A: Content (NEW)
  heroLine: string;
  aboutBlurb: string;
  servicesDetailed: ServiceItem[];
  primaryCta: string;
  secondaryCta: string;
  
  // Track A: Links (NEW)
  gbpLink: string;
  facebookHandle: string;
  instagramHandle: string;
  tiktokHandle: string;
  reviewsGoogleLink: string;
  reviewsYelpLink: string;
  inspirationSites: string[];
  
  // Track A: Hours (NEW)
  businessHoursDetailed: Record<string, string>;
  serviceAreaDetailed: string;
  preferredContactMethod: string;
  
  // Track A: Design (NEW)
  vibe: VibeOption;
  fontPreference: string;
  
  // Track A: Features (NEW)
  featuresNeeded: string[];
  
  // Track A: Trust signals (NEW)
  yearsInBusiness: string;
  awards: string;
  teamSize: string;
  reviewCount: string;
  averageRating: string;
  testimonials: string;
  
  // Track B: Existing site (NEW)
  existingPlatform: string;
  existingPlatformOther: string;
  existingSiteUrl: string;
  workRequested: string[];
  accessMethod: AccessMethod;
  accessInstructions: string;
  accessChecklist: Record<string, string>;
  
  // AI Receptionist fields - Call Coverage
  callHandling: CallHandling;
  handoffMethod: HandoffMethod;
  textHandling: string[];
  
  // AI Receptionist fields - Business Operations
  businessPhone: string;
  businessHours: string;
  servicesOffered: string;
  serviceAreaRules: string;
  serviceConstraints: string;
  
  // AI Receptionist fields - Emergencies & Escalation
  escalationNumber: string;
  emergencyTriggers: string[];
  emergencyOther: string;
  afterHoursAction: AfterHoursAction;
  
  // AI Receptionist fields - Lead & Qualification
  leadFields: string[];
  qualifiedLeadRules: string;
  handoffTriggers: string[];
  pricingGuidance: PricingGuidance;
  
  // AI Receptionist fields - Voice & Personality
  preferredTone: Tone;
  businessPersonality: string[];
  doNotSay: string;
  guaranteesPolicies: string;
  policyFiles: UploadedFile[];
  
  // AI Receptionist fields - FAQs & Human Context
  faqs: string;
  customerFaqs: string;
  teamNames: string;
  bookingLink: string;
  
  // Review confirmation
  reviewConfirmed: boolean;
  
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setAccessToken(session.access_token);
      }
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
      setAccessToken(session?.access_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    yourName: "",
    email: "",
    phone: "",
    serviceType: "",
    // Tier selection (NEW)
    tier: "",
    productType: "",
    // Template routing
    intakeTrack: "",
    productKey: "",
    intakeTemplate: "",
    // Website fields
    websiteGoal: "",
    serviceArea: "",
    timeline: "",
    logoStatus: "",
    brandColors: "",
    servicesList: "",
    photoReadiness: "",
    photoFiles: [],
    // Track A: Content (NEW)
    heroLine: "",
    aboutBlurb: "",
    servicesDetailed: [],
    primaryCta: "",
    secondaryCta: "",
    // Track A: Links (NEW)
    gbpLink: "",
    facebookHandle: "",
    instagramHandle: "",
    tiktokHandle: "",
    reviewsGoogleLink: "",
    reviewsYelpLink: "",
    inspirationSites: [],
    // Track A: Hours (NEW)
    businessHoursDetailed: {},
    serviceAreaDetailed: "",
    preferredContactMethod: "",
    // Track A: Design (NEW)
    vibe: "",
    fontPreference: "",
    // Track A: Features (NEW)
    featuresNeeded: [],
    // Track A: Trust signals (NEW)
    yearsInBusiness: "",
    awards: "",
    teamSize: "",
    reviewCount: "",
    averageRating: "",
    testimonials: "",
    // Track B: Existing site (NEW)
    existingPlatform: "",
    existingPlatformOther: "",
    existingSiteUrl: "",
    workRequested: [],
    accessMethod: "",
    accessInstructions: "",
    accessChecklist: {},
    // AI fields
    callHandling: "",
    handoffMethod: "",
    textHandling: [],
    businessPhone: "",
    businessHours: "",
    servicesOffered: "",
    serviceAreaRules: "",
    serviceConstraints: "",
    escalationNumber: "",
    emergencyTriggers: [],
    emergencyOther: "",
    afterHoursAction: "",
    leadFields: [],
    qualifiedLeadRules: "",
    handoffTriggers: [],
    pricingGuidance: "",
    preferredTone: "",
    businessPersonality: [],
    doNotSay: "",
    guaranteesPolicies: "",
    policyFiles: [],
    faqs: "",
    customerFaqs: "",
    teamNames: "",
    bookingLink: "",
    reviewConfirmed: false,
    selectedServices: [],
    customRequest: "",
  });

  // Track if service came from URL param (skip choose step)
  const [skipChoose, setSkipChoose] = useState(false);

  // Pre-select service type, tier, and product from URL params and skip choose step
  useEffect(() => {
    const serviceParam = searchParams.get("service");
    const tierParam = searchParams.get("tier");
    const productParam = searchParams.get("product");
    
    const updates: Partial<FormData> = {};
    
    if (serviceParam && SERVICE_PARAM_MAP[serviceParam]) {
      updates.serviceType = SERVICE_PARAM_MAP[serviceParam];
      setSkipChoose(true);
    }
    
    if (tierParam && TIER_PARAM_MAP[tierParam]) {
      updates.tier = TIER_PARAM_MAP[tierParam];
    }
    
    if (productParam) {
      if (productParam === "care_plan") {
        updates.productType = "care_plan";
      } else if (productParam === "pilot") {
        updates.productType = "pilot";
        updates.serviceType = "ai"; // Pilot is AI-only
        setSkipChoose(true);
      }
    }
    
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }));
    }
  }, [searchParams]);

  // Check if we should show emergency step (based on call handling selection)
  const shouldShowEmergencyStep = () => {
    // Show if AI answers calls (not just overflow) OR if after-hours includes emergency escalation
    return formData.callHandling !== "overflow";
  };

  // Determine steps based on service type - OPTIMIZED ORDER FOR AI
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
    
    // Add tier step for all service types if tier wasn't pre-selected
    // (website, ai, or both all require tier selection)
    if ((formData.serviceType === "website" || formData.serviceType === "ai" || formData.serviceType === "both") && !formData.tier) {
      steps.push({ id: "tier", label: "System" });
      return steps; // Don't show further steps until tier is selected
    }
    
    if (formData.serviceType === "website" || formData.serviceType === "both") {
      // First ask which track they want
      steps.push({ id: "track", label: "Track" });
      
      if (formData.intakeTrack === "new_site") {
        // Track A: New Site flow
        steps.push({ id: "content", label: "Content" });
        steps.push({ id: "links", label: "Links" });
        steps.push({ id: "hours", label: "Hours" });
        steps.push({ id: "design", label: "Design" });
        steps.push({ id: "features", label: "Features" });
      } else if (formData.intakeTrack === "improve_existing") {
        // Track B: Improve Existing Site flow
        steps.push({ id: "platform", label: "Platform" });
        steps.push({ id: "work-needed", label: "Work" });
        steps.push({ id: "access", label: "Access" });
        steps.push({ id: "access-checklist", label: "Checklist" });
      }
      // If intakeTrack not yet selected, just show the track step
    }
    
    if (formData.serviceType === "ai" || formData.serviceType === "both") {
      // NEW OPTIMIZED ORDER:
      // 1. Framing (sets expectations)
      steps.push({ id: "ai-framing", label: "Overview" });
      // 2. Call Coverage (core mental model)
      steps.push({ id: "ai-coverage", label: "Call Coverage" });
      // 3. Business Operations (concrete, familiar)
      steps.push({ id: "ai-operations", label: "Operations" });
      // 4. Emergencies & Escalation (conditional)
      if (shouldShowEmergencyStep()) {
        steps.push({ id: "ai-emergency", label: "Emergencies" });
      }
      // 5. Lead & Qualification (where AI becomes useful)
      steps.push({ id: "ai-leads", label: "Leads" });
      // 6. AI Voice & Personality (after logic is clear)
      steps.push({ id: "ai-voice", label: "Voice" });
      // 7. FAQs & Human Context (optional depth)
      steps.push({ id: "ai-context", label: "Context" });
      // 8. Review & Confirmation (required)
      steps.push({ id: "ai-review", label: "Review" });
    }
    
    if (formData.serviceType === "other") {
      steps.push({ id: "other", label: "Services" });
    }
    
    return steps;
  };

  const steps = getSteps();
  const currentStepId = steps[currentStep]?.id;

  // Validation helpers
  const isValidPhone = (phone: string) => {
    if (!phone.trim()) return true; // Empty is handled by required check
    // Must have at least 10 digits and contain letters is suspicious
    const digitsOnly = phone.replace(/\D/g, '');
    const hasEnoughDigits = digitsOnly.length >= 10 && digitsOnly.length <= 15;
    const isMostlyNumbers = phone.replace(/[\s\-().+]/g, '').length > 0;
    return hasEnoughDigits && isMostlyNumbers;
  };

  const isValidBusinessHours = (hours: string) => {
    if (!hours.trim()) return true; // Empty is handled by required check
    // Should contain time-related words or patterns, not just random numbers
    const hasTimeIndicators = /\d/.test(hours) && (/am|pm|:\d{2}|morning|afternoon|evening|mon|tue|wed|thu|fri|sat|sun|week|day|hour|open|close|-/i.test(hours));
    const isNotJustNumbers = !/^\d+$/.test(hours.replace(/\s/g, ''));
    return hasTimeIndicators && isNotJustNumbers;
  };

  const isValidTextContent = (text: string, minWords: number = 1) => {
    if (!text.trim()) return true; // Empty is handled by required check
    // Should contain actual words, not just random characters/numbers
    const words = text.trim().split(/\s+/);
    const hasRealWords = words.some(w => /^[a-zA-Z]{2,}/.test(w));
    const isNotJustNumbers = !/^\d+$/.test(text.replace(/\s/g, ''));
    return hasRealWords && isNotJustNumbers && words.length >= minWords;
  };

  // Track which fields have been touched
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const markTouched = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  // Field-level validation errors
  const getFieldError = (field: string): string | null => {
    if (!touched[field]) return null;
    
    switch (field) {
      case 'businessPhone':
        if (!formData.businessPhone.trim()) return 'Phone number is required';
        if (!isValidPhone(formData.businessPhone)) return 'Please enter a valid phone number (e.g. 207-555-1234)';
        return null;
      case 'businessHours':
        if (!formData.businessHours.trim()) return 'Business hours are required';
        if (!isValidBusinessHours(formData.businessHours)) return 'Please enter valid hours (e.g. Mon-Fri 8am-5pm)';
        return null;
      case 'servicesOffered':
        if (!formData.servicesOffered.trim()) return 'Services are required';
        if (!isValidTextContent(formData.servicesOffered, 1)) return 'Please describe your services in words';
        return null;
      case 'escalationNumber':
        if (!formData.escalationNumber.trim()) return 'Escalation number is required';
        if (!isValidPhone(formData.escalationNumber)) return 'Please enter a valid phone number';
        return null;
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStepId) {
      case "choose":
        return !!formData.serviceType;
      case "basics":
        // For demo, website, both - require serviceArea; for AI-only, it's optional (collected later as serviceAreaRules)
        const needsServiceArea = formData.serviceType === "demo" || formData.serviceType === "website" || formData.serviceType === "both";
        const basicsValid = formData.businessName.trim() && formData.email.trim() && formData.phone.trim();
        return needsServiceArea ? basicsValid && formData.serviceArea.trim() : basicsValid;
      // Tier selection step (for "both" without pre-selected tier)
      case "tier":
        return !!formData.tier || formData.tier === "custom";
      // Track selection step
      case "track":
        return !!formData.intakeTrack;
      // Track A: New Site steps
      case "content":
        return formData.heroLine.trim().length > 0 && formData.servicesDetailed.length > 0;
      case "links":
        return true; // All optional
      case "hours":
        return Object.keys(formData.businessHoursDetailed).length > 0;
      case "design":
        return !!formData.vibe && !!formData.logoStatus && !!formData.photoReadiness;
      case "features":
        return true; // All optional
      // Track B: Existing Site steps
      case "platform":
        return !!formData.existingPlatform && formData.existingSiteUrl.trim().length > 0;
      case "work-needed":
        return formData.workRequested.length > 0;
      case "access":
        return !!formData.accessMethod;
      case "access-checklist":
        return true; // All optional but informative
      // AI Steps - new order
      case "ai-framing":
        return true; // Just context, always can proceed
      case "ai-coverage":
        return !!formData.callHandling && !!formData.handoffMethod;
      case "ai-operations":
        return (
          formData.businessPhone.trim() && 
          isValidPhone(formData.businessPhone) &&
          formData.businessHours.trim() && 
          isValidBusinessHours(formData.businessHours) &&
          formData.servicesOffered.trim() &&
          isValidTextContent(formData.servicesOffered)
        );
      case "ai-emergency":
        return formData.escalationNumber.trim() && isValidPhone(formData.escalationNumber) && formData.emergencyTriggers.length > 0;
      case "ai-leads":
        return formData.leadFields.length > 0;
      case "ai-voice":
        return !!formData.preferredTone;
      case "ai-context":
        return true; // All optional
      case "ai-review":
        return formData.reviewConfirmed;
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
    } else {
      navigate("/");
    }
  };

  // Map frontend service types to database-compatible values
  const mapServiceType = (type: ServiceType): string => {
    if (type === "ai") return "ai_receptionist";
    return type;
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // Build headers - include auth token if user is logged in
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const { data, error } = await supabase.functions.invoke("leads/request-demo", {
        headers,
        body: {
          business_name: formData.businessName.trim(),
          city: formData.serviceArea.trim() || null,
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          your_name: formData.yourName.trim() || null,
          service_type: mapServiceType(formData.serviceType),
          // Tier and product type (NEW)
          tier: formData.tier || null,
          product_type: formData.productType || null,
          // Track routing
          intake_track: formData.intakeTrack || null,
          // Track A: Content
          hero_line: formData.heroLine.trim() || null,
          about_blurb: formData.aboutBlurb.trim() || null,
          services_detailed: formData.servicesDetailed.length > 0 ? formData.servicesDetailed : null,
          primary_cta: formData.primaryCta || null,
          // Track A: Links
          gbp_link: formData.gbpLink.trim() || null,
          facebook_handle: formData.facebookHandle.trim() || null,
          instagram_handle: formData.instagramHandle.trim() || null,
          reviews_google_link: formData.reviewsGoogleLink.trim() || null,
          reviews_yelp_link: formData.reviewsYelpLink.trim() || null,
          // Track A: Hours
          business_hours_detailed: Object.keys(formData.businessHoursDetailed).length > 0 ? formData.businessHoursDetailed : null,
          service_area_detailed: formData.serviceAreaDetailed.trim() || null,
          preferred_contact_method: formData.preferredContactMethod || null,
          // Track A: Design
          vibe: formData.vibe || null,
          logo_status: formData.logoStatus || null,
          brand_colors: formData.brandColors.trim() || null,
          photo_readiness: formData.photoReadiness || null,
          // Track A: Features
          features_needed: formData.featuresNeeded.length > 0 ? formData.featuresNeeded : null,
          // Track B: Existing Site
          existing_platform: formData.existingPlatform || null,
          existing_platform_other: formData.existingPlatformOther.trim() || null,
          existing_site_url: formData.existingSiteUrl.trim() || null,
          work_requested: formData.workRequested.length > 0 ? formData.workRequested : null,
          access_method: formData.accessMethod || null,
          access_instructions: formData.accessInstructions.trim() || null,
          access_checklist: Object.keys(formData.accessChecklist).length > 0 ? formData.accessChecklist : null,
          // Website fields (legacy)
          website_goal: formData.websiteGoal || formData.primaryCta || null,
          timeline: formData.timeline || null,
          services_list: formData.servicesList.trim() || null,
          // AI fields
          business_phone: formData.businessPhone.trim() || null,
          business_hours: formData.businessHours.trim() || null,
          services_offered: formData.servicesOffered.trim() || null,
          escalation_number: formData.escalationNumber.trim() || null,
          emergency_triggers: formData.emergencyTriggers.length > 0 ? formData.emergencyTriggers : null,
          emergency_other: formData.emergencyOther.trim() || null,
          preferred_tone: formData.preferredTone || null,
          booking_link: formData.bookingLink.trim() || null,
          faqs: formData.faqs.trim() || null,
          // AI handling fields
          call_handling: formData.callHandling || null,
          after_hours_action: formData.afterHoursAction || null,
          text_handling: formData.textHandling.length > 0 ? formData.textHandling : null,
          // AI customer knowledge fields
          team_names: formData.teamNames.trim() || null,
          customer_faqs: formData.customerFaqs.trim() || null,
          do_not_say: formData.doNotSay.trim() || null,
          guarantees_policies: formData.guaranteesPolicies.trim() || null,
          business_personality: formData.businessPersonality.length > 0 ? formData.businessPersonality : null,
          // AI ops fields
          lead_fields: formData.leadFields.length > 0 ? formData.leadFields : null,
          qualified_lead_rules: formData.qualifiedLeadRules.trim() || null,
          service_constraints: formData.serviceConstraints.trim() || null,
          service_area_rules: formData.serviceAreaRules.trim() || null,
          pricing_guidance: formData.pricingGuidance || null,
          handoff_triggers: formData.handoffTriggers.length > 0 ? formData.handoffTriggers : null,
          handoff_method: formData.handoffMethod || null,
          selected_services: formData.selectedServices.length > 0 ? formData.selectedServices : null,
          custom_request: formData.customRequest.trim() || null,
        },
      });

      if (error) throw error;

      // Upload files if we have a project token and files to upload
      if (data?.project_token) {
        const filesToUpload = [
          { files: formData.photoFiles, category: "Photos" },
          { files: formData.policyFiles, category: "Policy" },
        ].filter(g => g.files.length > 0);

        if (filesToUpload.length > 0) {
          console.log(`Uploading ${filesToUpload.reduce((sum, g) => sum + g.files.length, 0)} files to project ${data.project_token}`);
          
          for (const group of filesToUpload) {
            const result = await uploadIntakeFiles(data.project_token, group.files, group.category);
            if (result.errors.length > 0) {
              console.warn(`File upload errors (${group.category}):`, result.errors);
            }
            if (result.uploaded.length > 0) {
              console.log(`Uploaded ${result.uploaded.length} ${group.category} files`);
            }
          }
        }
      }

      if (data?.demo_url) {
        // Demo service type - redirect to generated demo
        toast({
          title: "Demo ready!",
          description: "Redirecting you to your personalized demo...",
        });
        navigate(data.demo_url);
      } else if (data?.project_token && isLoggedIn) {
        // User is already logged in - project ownership was set by backend
        // Go directly to workspace (skip create-password)
        toast({
          title: "Project created!",
          description: "Redirecting to your workspace...",
        });
        navigate(`/w/${data.project_token}`);
      } else if (data?.project_token && formData.email) {
        // Not logged in - redirect to create password page
        // This allows the client to set up their portal account
        toast({
          title: "Almost there!",
          description: "Let's set up your portal access...",
        });
        const params = new URLSearchParams({
          token: data.project_token,
          email: formData.email.trim(),
          name: formData.yourName?.trim() || "",
          business: formData.businessName.trim(),
        });
        navigate(`/create-password?${params.toString()}`);
      } else if (data?.project_token) {
        // Fallback for projects without email - direct to portal
        toast({
          title: getSuccessTitle(),
          description: getSuccessDescription(),
        });
        navigate(`/p/${data.project_token}`);
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

  // Helper to toggle array field values (with optional max cap)
  const toggleArrayField = (
    field: "textHandling" | "leadFields" | "handoffTriggers" | "businessPersonality" | "emergencyTriggers", 
    value: string,
    maxItems?: number
  ) => {
    setFormData(prev => {
      const currentValues = prev[field] as string[];
      const isSelected = currentValues.includes(value);
      
      // If removing, always allow
      if (isSelected) {
        return { ...prev, [field]: currentValues.filter((v: string) => v !== value) };
      }
      
      // If adding and at max, don't add
      if (maxItems && currentValues.length >= maxItems) {
        return prev;
      }
      
      return { ...prev, [field]: [...currentValues, value] };
    });
  };

  const renderChooseStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl font-bold mb-2">What can we build for you?</h2>
        <p className="text-muted-foreground">Choose your product — we'll guide you through the rest.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <ServiceCard
          value="demo"
          icon={Globe}
          title="Website Demo"
          description="See an instant preview of your site in 3 styles. Takes 30 seconds."
        />
        <ServiceCard
          value="website"
          icon={Globe}
          title="Website Build"
          description="Custom website tailored to your business. Full design + build process."
        />
        <ServiceCard
          value="ai"
          icon={Bot}
          title="AI Receptionist"
          description="Set up your AI to answer calls 24/7. We'll guide you through the setup."
        />
        <ServiceCard
          value="both"
          icon={Package}
          title="Complete Growth System"
          description="Website + AI Receptionist working together for maximum impact."
        />
      </div>
    </div>
  );

  const renderBasicsStep = () => {
    // Show serviceArea field for demo, website, both (needed for demo generation/personalization)
    const showServiceArea = formData.serviceType === "demo" || formData.serviceType === "website" || formData.serviceType === "both";
    
    return (
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

          {showServiceArea && (
            <div className="space-y-2">
              <Label htmlFor="serviceArea">Where do you serve customers? *</Label>
              <Input
                id="serviceArea"
                placeholder="e.g. Portland, ME"
                value={formData.serviceArea}
                onChange={(e) => updateField("serviceArea", e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">City, county, or general area</p>
            </div>
          )}

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
  };

  // Tier options per service type
  const WEBSITE_TIER_OPTIONS = [
    { 
      value: "website_essential", 
      label: "Essential", 
      price: "Starting at $750",
      priceType: "one-time" as const,
      description: "Get online professionally with a clean, fast site.",
    },
    { 
      value: "website_growth", 
      label: "Growth", 
      price: "Starting at $1,500",
      priceType: "one-time" as const,
      description: "Turn visitors into leads with booking + forms.",
      popular: true,
    },
    { 
      value: "website_premium", 
      label: "Premium", 
      price: "Starting at $2,500",
      priceType: "one-time" as const,
      description: "Custom design with advanced features + integrations.",
    },
  ];

  const AI_TIER_OPTIONS = [
    { 
      value: "ai_front_door", 
      label: "Front Door", 
      price: "Starting at $450/mo",
      priceType: "monthly" as const,
      description: "Never miss a call — AI answers 24/7.",
    },
    { 
      value: "ai_booking", 
      label: "Front Door + Booking", 
      price: "Starting at $700/mo",
      priceType: "monthly" as const,
      description: "Fill your calendar automatically.",
      popular: true,
    },
    { 
      value: "ai_full", 
      label: "Full AI Suite", 
      price: "Starting at $950/mo",
      priceType: "monthly" as const,
      description: "AI + booking + CRM — the complete system.",
    },
  ];

  const BUNDLE_TIER_OPTIONS = [
    { 
      value: "starter", 
      label: "Starter", 
      price: "Starting at $575/mo",
      priceType: "monthly" as const,
      description: "Get online professionally with AI handling your calls.",
    },
    { 
      value: "growth", 
      label: "Growth", 
      price: "Starting at $875/mo",
      priceType: "monthly" as const,
      description: "Turn visitors into booked appointments automatically.",
      popular: true,
    },
    { 
      value: "full_ops", 
      label: "Full Operations", 
      price: "Starting at $1,100/mo",
      priceType: "monthly" as const,
      description: "We run your digital front desk end-to-end.",
    },
  ];

  // Get tier options based on service type
  const getTierOptionsForService = () => {
    switch (formData.serviceType) {
      case "website":
        return { 
          options: WEBSITE_TIER_OPTIONS, 
          title: "Pick a starting point", 
          subtitle: "These are ballpark ranges — we'll fine-tune together." 
        };
      case "ai":
        return { 
          options: AI_TIER_OPTIONS, 
          title: "Pick a starting point", 
          subtitle: "These are ballpark ranges — we'll fine-tune together." 
        };
      case "both":
      default:
        return { 
          options: BUNDLE_TIER_OPTIONS, 
          title: "Pick a starting point", 
          subtitle: "Website + AI included in all tiers. We'll fine-tune together." 
        };
    }
  };

  const renderTierStep = () => {
    const { options, title, subtitle } = getTierOptionsForService();
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        
        {/* Reassurance banner */}
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-3 text-center">
          <p className="text-sm text-muted-foreground">
            💡 These are starting points, not final quotes. We'll work with you to find the right fit.
          </p>
        </div>
        
        <div className="grid gap-3">
          {options.map((tier) => (
            <button
              key={tier.value}
              type="button"
              onClick={() => updateField("tier", tier.value as TierType)}
              className={cn(
                "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                "hover:border-primary/50 hover:shadow-md",
                formData.tier === tier.value 
                  ? "border-primary bg-primary/5" 
                  : "border-border bg-card"
              )}
            >
              {'popular' in tier && tier.popular && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                  Recommended
                </span>
              )}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{tier.label}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{tier.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-medium text-muted-foreground">{tier.price}</p>
                </div>
              </div>
              {formData.tier === tier.value && (
                <div className="absolute top-3 right-3">
                  <Check className="w-5 h-5 text-primary" />
                </div>
              )}
            </button>
          ))}
          
          {/* "Not sure" escape hatch option */}
          <button
            type="button"
            onClick={() => updateField("tier", "custom" as TierType)}
            className={cn(
              "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
              "hover:border-primary/50 hover:shadow-md",
              formData.tier === "custom" 
                ? "border-primary bg-primary/5" 
                : "border-dashed border-muted-foreground/30 bg-muted/20"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Not sure yet</h3>
                <p className="text-sm text-muted-foreground">We'll figure it out together on a quick call.</p>
              </div>
              {formData.tier === "custom" && (
                <Check className="w-5 h-5 text-primary shrink-0" />
              )}
            </div>
          </button>
        </div>
      </div>
    );
  };

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
              <div 
                key={opt.value} 
                onClick={() => !isLoading && updateField("websiteGoal", opt.value as WebsiteGoal)}
                className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={opt.value} id={`goal-${opt.value}`} className="pointer-events-none" />
                <Label className="cursor-pointer font-normal flex-1 pointer-events-none">{opt.label}</Label>
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
              <div 
                key={opt.value} 
                onClick={() => !isLoading && updateField("timeline", opt.value as Timeline)}
                className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={opt.value} id={`timeline-${opt.value}`} className="pointer-events-none" />
                <Label className="cursor-pointer font-normal flex-1 pointer-events-none">{opt.label}</Label>
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
              <div 
                key={opt.value} 
                onClick={() => !isLoading && updateField("logoStatus", opt.value as LogoStatus)}
                className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={opt.value} id={`logo-${opt.value}`} className="pointer-events-none" />
                <Label className="cursor-pointer font-normal flex-1 pointer-events-none">{opt.label}</Label>
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
              { value: "ready", label: "Ready — I have photos to upload" },
              { value: "some", label: "Some — I have a few to share" },
              { value: "none", label: "None yet — I'll need help" },
            ].map((opt) => (
              <div 
                key={opt.value} 
                onClick={() => !isLoading && updateField("photoReadiness", opt.value as PhotoReadiness)}
                className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={opt.value} id={`photo-${opt.value}`} className="pointer-events-none" />
                <Label className="cursor-pointer font-normal flex-1 pointer-events-none">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Photo upload dropzone - shown when ready or some selected */}
        {(formData.photoReadiness === "ready" || formData.photoReadiness === "some") && (
          <FileDropZone
            label="Upload your photos"
            hint="Photos of your work, team, storefront, before/after shots, etc. (Max 10 files, 10MB each)"
            accept="image/*"
            multiple={true}
            maxFiles={10}
            maxSizeMB={10}
            files={formData.photoFiles}
            onFilesChange={(files) => updateField("photoFiles", files)}
            disabled={isLoading}
          />
        )}
      </div>
    </div>
  );

  // =====================================================
  // TRACK SELECTION & NEW SITE / EXISTING SITE STEPS
  // =====================================================

  const VIBE_OPTIONS = [
    { value: "clean", label: "Clean & Minimal", desc: "Simple, spacious, professional" },
    { value: "bold", label: "Bold & Modern", desc: "Strong colors, dynamic layouts" },
    { value: "rustic", label: "Rustic & Warm", desc: "Earthy tones, textured feel" },
    { value: "luxury", label: "Luxury & Elegant", desc: "Refined, high-end aesthetic" },
    { value: "playful", label: "Playful & Friendly", desc: "Bright, approachable, casual" },
    { value: "modern", label: "Modern & Sleek", desc: "Contemporary, tech-forward" },
  ];

  const PLATFORM_OPTIONS = [
    { value: "squarespace", label: "Squarespace" },
    { value: "wix", label: "Wix" },
    { value: "wordpress", label: "WordPress" },
    { value: "shopify", label: "Shopify" },
    { value: "godaddy", label: "GoDaddy" },
    { value: "weebly", label: "Weebly" },
    { value: "other", label: "Other / Not sure" },
  ];

  const WORK_REQUESTED_OPTIONS = [
    { value: "content_edits", label: "Content edits", desc: "Update text, images, pages" },
    { value: "seo", label: "SEO improvements", desc: "Better Google rankings" },
    { value: "design_refresh", label: "Design refresh", desc: "Modernize look & feel" },
    { value: "booking_forms", label: "Add booking/forms", desc: "Contact forms, scheduling" },
    { value: "new_pages", label: "New pages", desc: "Add services, about, etc." },
    { value: "speed", label: "Speed optimization", desc: "Faster load times" },
    { value: "tracking", label: "Tracking/analytics", desc: "GA4, conversion tracking" },
    { value: "domain_dns", label: "Domain/DNS changes", desc: "Domain setup or transfer" },
  ];

  const FEATURE_OPTIONS = [
    { value: "contact_form", label: "Contact form" },
    { value: "quote_form", label: "Quote request form" },
    { value: "booking", label: "Booking integration" },
    { value: "menu_page", label: "Menu page" },
    { value: "gallery", label: "Photo gallery" },
    { value: "events", label: "Events/promos page" },
    { value: "newsletter", label: "Newsletter signup" },
    { value: "faq", label: "FAQ page" },
    { value: "job_form", label: "Job application form" },
    { value: "popup", label: "Popup banner" },
  ];

  const ACCESS_CHECKLIST_ITEMS = [
    { key: "website_editor", label: "Website editor access", desc: "Required for content changes" },
    { key: "domain_dns", label: "Domain/DNS access", desc: "For technical changes, new domains" },
    { key: "search_console", label: "Google Search Console", desc: "For SEO visibility" },
    { key: "analytics", label: "Google Analytics (GA4)", desc: "For conversion tracking" },
    { key: "gbp", label: "Google Business Profile", desc: "For map/local SEO" },
  ];

  const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  // Toggle helpers for new array fields
  const toggleWorkRequested = (value: string) => {
    setFormData(prev => ({
      ...prev,
      workRequested: prev.workRequested.includes(value)
        ? prev.workRequested.filter(v => v !== value)
        : [...prev.workRequested, value]
    }));
  };

  const toggleFeaturesNeeded = (value: string) => {
    setFormData(prev => ({
      ...prev,
      featuresNeeded: prev.featuresNeeded.includes(value)
        ? prev.featuresNeeded.filter(v => v !== value)
        : [...prev.featuresNeeded, value]
    }));
  };

  const updateAccessChecklist = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      accessChecklist: { ...prev.accessChecklist, [key]: value }
    }));
  };

  const updateBusinessHoursDetailed = (day: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      businessHoursDetailed: { ...prev.businessHoursDetailed, [day]: value }
    }));
  };

  const addServiceItem = () => {
    setFormData(prev => ({
      ...prev,
      servicesDetailed: [...prev.servicesDetailed, { name: "", description: "" }]
    }));
  };

  const updateServiceItem = (index: number, field: "name" | "description", value: string) => {
    setFormData(prev => ({
      ...prev,
      servicesDetailed: prev.servicesDetailed.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeServiceItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      servicesDetailed: prev.servicesDetailed.filter((_, i) => i !== index)
    }));
  };

  // Track Selection Step
  const renderTrackStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl font-bold mb-2">How can we help?</h2>
        <p className="text-muted-foreground">Choose the path that fits your situation.</p>
      </div>
      
      <div className="grid gap-4">
        <button
          type="button"
          onClick={() => updateField("intakeTrack", "new_site")}
          className={cn(
            "relative p-6 rounded-xl border-2 text-left transition-all duration-200",
            "hover:border-primary/50 hover:shadow-md",
            formData.intakeTrack === "new_site" 
              ? "border-primary bg-primary/5" 
              : "border-border bg-card"
          )}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Build me a new website</h3>
              <p className="text-sm text-muted-foreground">We handle everything: design, hosting, and updates. Recommended for most businesses.</p>
            </div>
          </div>
          <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
            Recommended
          </span>
        </button>

        <button
          type="button"
          onClick={() => updateField("intakeTrack", "improve_existing")}
          className={cn(
            "relative p-6 rounded-xl border-2 text-left transition-all duration-200",
            "hover:border-primary/50 hover:shadow-md",
            formData.intakeTrack === "improve_existing" 
              ? "border-primary bg-primary/5" 
              : "border-border bg-card"
          )}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Improve my existing website</h3>
              <p className="text-sm text-muted-foreground">We'll work inside your current platform (Squarespace, Wix, WordPress, etc.)</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  // =====================================================
  // TRACK A: NEW SITE STEPS
  // =====================================================

  // Helper to prefill content with trade-specific examples
  const prefillTradeExample = (trade: string) => {
    const services = getServicesForTemplate(trade);
    const city = formData.serviceArea || "your area";
    const tagline = generateTagline(trade, city);
    
    updateField("heroLine", tagline);
    
    // Prefill 3-4 services
    const exampleServices: ServiceItem[] = services.slice(0, 4).map(s => ({
      name: s,
      description: "",
    }));
    updateField("servicesDetailed", exampleServices);
  };

  const TRADE_CHIPS = [
    { key: "plumber", label: "Plumber" },
    { key: "roofer", label: "Roofer" },
    { key: "electrician", label: "Electrician" },
    { key: "contractor", label: "Contractor" },
    { key: "restaurant", label: "Restaurant" },
    { key: "cleaner", label: "Cleaner" },
  ];

  const renderContentStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Your content</h2>
        <p className="text-muted-foreground">This is what visitors will see first. We'll refine it together.</p>
      </div>
      
      {/* Reassurance banner */}
      <div className="bg-secondary/50 rounded-lg p-3 text-sm text-muted-foreground">
        💡 Rough ideas are perfect — bullet points, fragments, whatever you have. We'll polish everything together.
      </div>

      {/* Quick-fill trade chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Quick-fill example:</span>
        {TRADE_CHIPS.map((trade) => (
          <button
            key={trade.key}
            type="button"
            onClick={() => prefillTradeExample(trade.key)}
            className="px-3 py-1 text-sm rounded-full border border-border hover:bg-secondary/70 transition-colors"
            disabled={isLoading}
          >
            {trade.label}
          </button>
        ))}
      </div>
      
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="heroLine">In one sentence, what do you do? *</Label>
          <Input
            id="heroLine"
            placeholder="e.g. We keep Portland homes safe with 24/7 plumbing service."
            value={formData.heroLine}
            onChange={(e) => updateField("heroLine", e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            This becomes your homepage headline. Examples: "24/7 emergency plumbing for Seattle homes" • "Family-owned Italian restaurant since 1985" • "Expert roof repairs you can count on"
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Your services *</Label>
            {formData.servicesDetailed.length < 6 && (
              <Button type="button" variant="ghost" size="sm" onClick={addServiceItem}>
                + Add service
              </Button>
            )}
          </div>
          
          {/* Helper text for services */}
          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
            <strong>Examples:</strong> "Leak Detection" with "Fast, non-invasive detection" — or just "Kitchen Remodeling" (descriptions are optional)
          </div>
          
          {formData.servicesDetailed.length === 0 && (
            <Button type="button" variant="outline" onClick={addServiceItem} className="w-full">
              + Add your first service
            </Button>
          )}
          
          {formData.servicesDetailed.map((service, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Service name"
                  value={service.name}
                  onChange={(e) => updateServiceItem(index, "name", e.target.value)}
                  disabled={isLoading}
                />
                <Input
                  placeholder="Brief description (optional)"
                  value={service.description}
                  onChange={(e) => updateServiceItem(index, "description", e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                onClick={() => removeServiceItem(index)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                ×
              </Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Add at least 1 service. You can add up to 6.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aboutBlurb">Tell us a bit about your business (optional)</Label>
          <p className="text-xs text-muted-foreground mb-1">
            A few sentences or bullet points — we'll handle the polish.
          </p>
          <Textarea
            id="aboutBlurb"
            placeholder="e.g. Family-owned since 2005. Serving the greater Portland area. Known for fast, honest service..."
            value={formData.aboutBlurb}
            onChange={(e) => updateField("aboutBlurb", e.target.value)}
            disabled={isLoading}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-3">
          <Label>What's the main action you want visitors to take? *</Label>
          <RadioGroup
            value={formData.primaryCta}
            onValueChange={(v) => updateField("primaryCta", v)}
            className="grid grid-cols-2 gap-2"
            disabled={isLoading}
          >
            {[
              { value: "calls", label: "Call us" },
              { value: "quotes", label: "Get a quote" },
              { value: "bookings", label: "Book online" },
              { value: "info", label: "Learn more" },
            ].map((opt) => (
              <div 
                key={opt.value} 
                onClick={() => !isLoading && updateField("primaryCta", opt.value)}
                className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={opt.value} id={`cta-${opt.value}`} className="pointer-events-none" />
                <Label className="cursor-pointer font-normal flex-1 pointer-events-none">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );

  const renderLinksStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Your online presence</h2>
        <p className="text-muted-foreground">Help us connect your site to your existing profiles. All optional.</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gbpLink">Google Business Profile link</Label>
          <Input
            id="gbpLink"
            type="url"
            placeholder="https://g.page/your-business"
            value={formData.gbpLink}
            onChange={(e) => updateField("gbpLink", e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">We'll pull reviews and info from here.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="facebookHandle">Facebook</Label>
            <Input
              id="facebookHandle"
              placeholder="@yourbusiness"
              value={formData.facebookHandle}
              onChange={(e) => updateField("facebookHandle", e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagramHandle">Instagram</Label>
            <Input
              id="instagramHandle"
              placeholder="@yourbusiness"
              value={formData.instagramHandle}
              onChange={(e) => updateField("instagramHandle", e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reviewsGoogleLink">Google Reviews link</Label>
          <Input
            id="reviewsGoogleLink"
            type="url"
            placeholder="https://g.page/your-business/review"
            value={formData.reviewsGoogleLink}
            onChange={(e) => updateField("reviewsGoogleLink", e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reviewsYelpLink">Yelp link</Label>
          <Input
            id="reviewsYelpLink"
            type="url"
            placeholder="https://yelp.com/biz/your-business"
            value={formData.reviewsYelpLink}
            onChange={(e) => updateField("reviewsYelpLink", e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );

  const renderHoursStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Hours & location</h2>
        <p className="text-muted-foreground">When can customers reach you?</p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-3">
          <Label>Business hours *</Label>
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-20 text-sm capitalize text-muted-foreground">{day}</span>
                <Input
                  placeholder="e.g. 8am-5pm or Closed"
                  value={formData.businessHoursDetailed[day] || ""}
                  onChange={(e) => updateBusinessHoursDetailed(day, e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Enter hours or "Closed" for each day.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceAreaDetailed">Service area</Label>
          <Input
            id="serviceAreaDetailed"
            placeholder="e.g. Greater Portland, within 30 miles of Brunswick"
            value={formData.serviceAreaDetailed || formData.serviceArea}
            onChange={(e) => updateField("serviceAreaDetailed", e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-3">
          <Label>Preferred contact method</Label>
          <RadioGroup
            value={formData.preferredContactMethod}
            onValueChange={(v) => updateField("preferredContactMethod", v)}
            className="grid grid-cols-3 gap-2"
            disabled={isLoading}
          >
            {[
              { value: "call", label: "Call" },
              { value: "text", label: "Text" },
              { value: "email", label: "Email" },
            ].map((opt) => (
              <div 
                key={opt.value} 
                onClick={() => !isLoading && updateField("preferredContactMethod", opt.value)}
                className="flex items-center justify-center space-x-2 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={opt.value} id={`contact-${opt.value}`} className="pointer-events-none" />
                <Label className="cursor-pointer font-normal pointer-events-none">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );

  const renderDesignStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Design & brand</h2>
        <p className="text-muted-foreground">Help us match your style. Don't stress — we'll refine it together.</p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-3">
          <Label>What vibe fits your brand? *</Label>
          <div className="grid grid-cols-2 gap-2">
            {VIBE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField("vibe", opt.value as VibeOption)}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all duration-200",
                  "hover:border-primary/50",
                  formData.vibe === opt.value 
                    ? "border-primary bg-primary/5" 
                    : "border-border"
                )}
              >
                <span className="font-medium text-sm">{opt.label}</span>
                <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

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
              <div 
                key={opt.value} 
                onClick={() => !isLoading && updateField("logoStatus", opt.value as LogoStatus)}
                className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={opt.value} id={`logo-${opt.value}`} className="pointer-events-none" />
                <Label className="cursor-pointer font-normal flex-1 pointer-events-none">{opt.label}</Label>
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
              { value: "ready", label: "Ready — I have photos to upload" },
              { value: "some", label: "Some — I have a few to share" },
              { value: "none", label: "None yet — I'll need help" },
            ].map((opt) => (
              <div 
                key={opt.value} 
                onClick={() => !isLoading && updateField("photoReadiness", opt.value as PhotoReadiness)}
                className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={opt.value} id={`photo-${opt.value}`} className="pointer-events-none" />
                <Label className="cursor-pointer font-normal flex-1 pointer-events-none">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {(formData.photoReadiness === "ready" || formData.photoReadiness === "some") && (
          <FileDropZone
            label="Upload your photos"
            hint="Photos of your work, team, storefront, etc. (Max 10 files)"
            accept="image/*"
            multiple={true}
            maxFiles={10}
            maxSizeMB={10}
            files={formData.photoFiles}
            onFilesChange={(files) => updateField("photoFiles", files)}
            disabled={isLoading}
          />
        )}
      </div>
    </div>
  );

  const renderFeaturesStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Website features</h2>
        <p className="text-muted-foreground">What functionality do you need? Select all that apply.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {FEATURE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggleFeaturesNeeded(opt.value)}
            className={cn(
              "flex items-center space-x-2 p-3 rounded-lg border text-left text-sm transition-colors",
              formData.featuresNeeded.includes(opt.value)
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-secondary/50"
            )}
          >
            <Checkbox checked={formData.featuresNeeded.includes(opt.value)} className="pointer-events-none" />
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground">Don't worry — you can always add features later.</p>
    </div>
  );

  // =====================================================
  // TRACK B: EXISTING SITE STEPS
  // =====================================================

  const renderPlatformStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Your current site</h2>
        <p className="text-muted-foreground">Tell us about your existing website so we can help.</p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-3">
          <Label>What platform is your site on? *</Label>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField("existingPlatform", opt.value)}
                className={cn(
                  "p-3 rounded-lg border-2 text-left text-sm transition-all duration-200",
                  "hover:border-primary/50",
                  formData.existingPlatform === opt.value 
                    ? "border-primary bg-primary/5" 
                    : "border-border"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {formData.existingPlatform === "other" && (
          <div className="space-y-2">
            <Label htmlFor="existingPlatformOther">What platform?</Label>
            <Input
              id="existingPlatformOther"
              placeholder="e.g. Custom HTML, Webflow, Duda..."
              value={formData.existingPlatformOther}
              onChange={(e) => updateField("existingPlatformOther", e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="existingSiteUrl">Your website URL *</Label>
          <Input
            id="existingSiteUrl"
            type="url"
            placeholder="https://yourbusiness.com"
            value={formData.existingSiteUrl}
            onChange={(e) => updateField("existingSiteUrl", e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );

  const renderWorkNeededStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">What do you need?</h2>
        <p className="text-muted-foreground">Select all that apply.</p>
      </div>
      
      <div className="space-y-2">
        {WORK_REQUESTED_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggleWorkRequested(opt.value)}
            className={cn(
              "flex items-start space-x-3 p-4 rounded-lg border w-full text-left transition-colors",
              formData.workRequested.includes(opt.value)
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-secondary/50"
            )}
          >
            <Checkbox checked={formData.workRequested.includes(opt.value)} className="mt-0.5 pointer-events-none" />
            <div>
              <span className="font-medium">{opt.label}</span>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderAccessStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">How will you give us access?</h2>
        <p className="text-muted-foreground">Choose the method that works best for you.</p>
      </div>
      
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => updateField("accessMethod", "collaborator")}
          className={cn(
            "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
            formData.accessMethod === "collaborator" 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">Invite as collaborator</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary">Best option</span>
              <p className="text-sm text-muted-foreground mt-1">No passwords needed. You keep full control.</p>
              {formData.existingPlatform === "squarespace" && (
                <p className="text-xs text-muted-foreground mt-2">Squarespace: Settings → Permissions → Add contributor</p>
              )}
              {formData.existingPlatform === "wix" && (
                <p className="text-xs text-muted-foreground mt-2">Wix: Settings → Roles & Permissions → Add team member</p>
              )}
              {formData.existingPlatform === "wordpress" && (
                <p className="text-xs text-muted-foreground mt-2">WordPress: Users → Add New → Editor role</p>
              )}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => updateField("accessMethod", "dns_only")}
          className={cn(
            "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
            formData.accessMethod === "dns_only" 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">DNS/domain access only</span>
              <p className="text-sm text-muted-foreground mt-1">We can connect services but not edit your content directly.</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => updateField("accessMethod", "password")}
          className={cn(
            "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
            formData.accessMethod === "password" 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">Send login credentials</span>
              <p className="text-sm text-muted-foreground mt-1">We recommend collaborator invite instead when possible.</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => updateField("accessMethod", "none")}
          className={cn(
            "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
            formData.accessMethod === "none" 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">I'm not sure / Need help</span>
              <p className="text-sm text-muted-foreground mt-1">We'll help you figure out the best approach.</p>
            </div>
          </div>
        </button>
      </div>

      {formData.accessMethod && formData.accessMethod !== "none" && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="accessInstructions">Any notes about access?</Label>
          <Textarea
            id="accessInstructions"
            placeholder="e.g. I'll send an invite to your email, or The site is managed by my nephew..."
            value={formData.accessInstructions}
            onChange={(e) => updateField("accessInstructions", e.target.value)}
            disabled={isLoading}
            rows={2}
            className="resize-none"
          />
        </div>
      )}
    </div>
  );

  const renderAccessChecklistStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Access checklist</h2>
        <p className="text-muted-foreground">Which of these can you provide? This helps us understand what's possible.</p>
      </div>
      
      <div className="space-y-3">
        {ACCESS_CHECKLIST_ITEMS.map((item) => (
          <div key={item.key} className="p-4 rounded-lg border border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-medium">{item.label}</span>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {["granted", "pending", "blocked"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateAccessChecklist(item.key, status)}
                    className={cn(
                      "px-2 py-1 text-xs rounded transition-colors",
                      formData.accessChecklist[item.key] === status
                        ? status === "granted" ? "bg-green-500/20 text-green-700" :
                          status === "pending" ? "bg-yellow-500/20 text-yellow-700" :
                          "bg-red-500/20 text-red-700"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {status === "granted" ? "✓ Yes" : status === "pending" ? "⏳ TBD" : "✗ No"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground">Don't worry if you're unsure — we'll help you figure it out.</p>
    </div>
  );

  // =====================================================
  // AI RECEPTIONIST STEPS - NEW OPTIMIZED ORDER
  // =====================================================

  // Step 0: Framing (NEW - sets expectations, ~10 seconds)
  const renderAIFramingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-serif text-2xl font-bold mb-3">Let's set up your AI receptionist</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          We'll walk through how your AI handles calls, emergencies, and leads. 
          Takes about 5 minutes — and you can change anything later.
        </p>
      </div>
      
      <div className="bg-secondary/30 rounded-xl p-6 space-y-4">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">What we'll cover:</h3>
        <div className="grid gap-3">
          {[
            { icon: Phone, label: "When & how AI answers calls" },
            { icon: Clock, label: "Your business hours & operations" },
            { icon: AlertTriangle, label: "Emergency handling & escalation" },
            { icon: Users, label: "Lead capture & qualification" },
            { icon: MessageSquare, label: "Voice, tone & brand personality" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Step 1: Call Coverage (defines core mental model)
  const renderAICoverageStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Call coverage</h2>
        <p className="text-muted-foreground">This defines when and how the AI answers your phone.</p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-3">
          <Label>When should the AI answer calls? *</Label>
          <RadioGroup
            value={formData.callHandling}
            onValueChange={(v: CallHandling) => updateField("callHandling", v)}
            className="grid gap-2"
            disabled={isLoading}
          >
            {[
              { value: "always", label: "Always answer", desc: "AI picks up every call" },
              { value: "after_hours", label: "After hours only", desc: "AI answers when you're closed" },
              { value: "overflow", label: "Overflow only", desc: "AI answers missed calls" },
            ].map((opt) => (
              <div 
                key={opt.value} 
                onClick={() => !isLoading && updateField("callHandling", opt.value as CallHandling)}
                className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={opt.value} id={`coverage-${opt.value}`} className="mt-0.5 pointer-events-none" />
                <div className="flex-1">
                  <Label className="cursor-pointer font-medium pointer-events-none">{opt.label}</Label>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label>How should handoffs work? *</Label>
          <RadioGroup
            value={formData.handoffMethod}
            onValueChange={(v: HandoffMethod) => updateField("handoffMethod", v)}
            className="grid gap-2"
            disabled={isLoading}
          >
            {[
              { value: "transfer", label: "Transfer call", desc: "Warm transfer to a person" },
              { value: "message", label: "Take message", desc: "Collect info, you call back" },
              { value: "callback", label: "Schedule callback", desc: "Book a time for you to call" },
              { value: "text", label: "Send text follow-up", desc: "Text the caller details" },
            ].map((opt) => (
              <div 
                key={opt.value} 
                onClick={() => !isLoading && updateField("handoffMethod", opt.value as HandoffMethod)}
                className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={opt.value} id={`handoff-${opt.value}`} className="mt-0.5 pointer-events-none" />
                <div className="flex-1">
                  <Label className="cursor-pointer font-medium pointer-events-none">{opt.label}</Label>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label>Text/chat capabilities</Label>
          <p className="text-xs text-muted-foreground -mt-1">Select all that apply</p>
          <div className="grid gap-2">
            {[
              { value: "answer_faqs", label: "Answer FAQs" },
              { value: "collect_lead", label: "Collect lead info" },
              { value: "send_booking", label: "Book appointments directly" },
              { value: "follow_up", label: "Follow up missed calls" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleArrayField("textHandling", opt.value)}
                className={cn(
                  "flex items-center space-x-2 p-3 rounded-lg border text-left text-sm transition-colors",
                  formData.textHandling.includes(opt.value)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <Checkbox checked={formData.textHandling.includes(opt.value)} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Business Operations (concrete, familiar)
  const renderAIOperationsStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Business operations</h2>
        <p className="text-muted-foreground">The basics the AI needs to answer accurately.</p>
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
            onBlur={() => markTouched("businessPhone")}
            disabled={isLoading}
            className={getFieldError("businessPhone") ? "border-destructive" : ""}
          />
          {getFieldError("businessPhone") ? (
            <p className="text-xs text-destructive">{getFieldError("businessPhone")}</p>
          ) : (
            <p className="text-xs text-muted-foreground">The number customers already call</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessHours">Business hours *</Label>
          <Input
            id="businessHours"
            placeholder="e.g. Mon-Fri 8am-5pm, Sat 9am-12pm"
            value={formData.businessHours}
            onChange={(e) => updateField("businessHours", e.target.value)}
            onBlur={() => markTouched("businessHours")}
            disabled={isLoading}
            className={getFieldError("businessHours") ? "border-destructive" : ""}
          />
          {getFieldError("businessHours") && (
            <p className="text-xs text-destructive">{getFieldError("businessHours")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="servicesOffered">Services you offer *</Label>
          <Textarea
            id="servicesOffered"
            placeholder="e.g. Emergency plumbing, Water heater repair, Drain cleaning..."
            value={formData.servicesOffered}
            onChange={(e) => updateField("servicesOffered", e.target.value)}
            onBlur={() => markTouched("servicesOffered")}
            disabled={isLoading}
            rows={3}
            className={cn("resize-none", getFieldError("servicesOffered") && "border-destructive")}
          />
          {getFieldError("servicesOffered") && (
            <p className="text-xs text-destructive">{getFieldError("servicesOffered")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceAreaRules">Service area (optional)</Label>
          <Input
            id="serviceAreaRules"
            placeholder="e.g. Greater Portland, within 30 miles of Brunswick..."
            value={formData.serviceAreaRules}
            onChange={(e) => updateField("serviceAreaRules", e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">AI will politely decline out-of-area requests</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceConstraints">Service limitations (optional)</Label>
          <Textarea
            id="serviceConstraints"
            placeholder="e.g. No work on Sundays, no high-rise buildings, no warranty calls..."
            value={formData.serviceConstraints}
            onChange={(e) => updateField("serviceConstraints", e.target.value)}
            disabled={isLoading}
            rows={2}
            className="resize-none"
          />
        </div>
      </div>
    </div>
  );

  // Step 3: Emergencies & Escalation (conditional)
  const renderAIEmergencyStep = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h2 className="font-serif text-2xl font-bold">Emergencies & escalation</h2>
        </div>
        <p className="text-muted-foreground">Safety-critical settings for urgent situations.</p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="escalationNumber">Escalation number *</Label>
          <Input
            id="escalationNumber"
            type="tel"
            placeholder="(207) 555-9999"
            value={formData.escalationNumber}
            onChange={(e) => updateField("escalationNumber", e.target.value)}
            onBlur={() => markTouched("escalationNumber")}
            disabled={isLoading}
            className={getFieldError("escalationNumber") ? "border-destructive" : ""}
          />
          {getFieldError("escalationNumber") ? (
            <p className="text-xs text-destructive">{getFieldError("escalationNumber")}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Where emergencies / handoffs should go</p>
          )}
        </div>

        <div className="space-y-3">
          <Label>What counts as an emergency? *</Label>
          <p className="text-xs text-muted-foreground -mt-1">Select all that apply</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "safety", label: "Safety issue" },
              { value: "water_power_heat", label: "Water / power / heat outage" },
              { value: "fire_gas", label: "Fire / gas" },
              { value: "locked_out", label: "Locked out" },
              { value: "flooding", label: "Flooding / burst pipes" },
              { value: "no_heat_ac", label: "No heat or A/C" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleArrayField("emergencyTriggers", opt.value)}
                className={cn(
                  "flex items-center space-x-2 p-3 rounded-lg border text-left text-sm transition-colors",
                  formData.emergencyTriggers.includes(opt.value)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <Checkbox checked={formData.emergencyTriggers.includes(opt.value)} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2 pt-2">
            <Label htmlFor="emergencyOther" className="text-sm font-normal">Other emergency triggers</Label>
            <Input
              id="emergencyOther"
              placeholder="e.g. Sewage backup, electrical sparks..."
              value={formData.emergencyOther}
              onChange={(e) => updateField("emergencyOther", e.target.value)}
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-muted-foreground">AI will escalate these immediately</p>
        </div>

        {formData.callHandling !== "always" && (
          <div className="space-y-3">
            <Label>After-hours behavior</Label>
            <RadioGroup
              value={formData.afterHoursAction}
              onValueChange={(v: AfterHoursAction) => updateField("afterHoursAction", v)}
              className="grid gap-2"
              disabled={isLoading}
            >
              {[
                { value: "message", label: "Take a message" },
                { value: "book", label: "Book appointments" },
                { value: "emergency_only", label: "Emergency escalation only" },
                { value: "callback_info", label: "Tell callers when to call back" },
              ].map((opt) => (
                <div 
                  key={opt.value} 
                  onClick={() => !isLoading && updateField("afterHoursAction", opt.value as AfterHoursAction)}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <RadioGroupItem value={opt.value} id={`after-${opt.value}`} className="pointer-events-none" />
                  <Label className="cursor-pointer font-normal flex-1 pointer-events-none">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </div>
    </div>
  );

  // Step 4: Lead & Qualification (where AI becomes useful)
  const renderAILeadsStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Lead capture & qualification</h2>
        <p className="text-muted-foreground">What info should the AI collect from potential customers?</p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-3">
          <Label>What should the AI collect from leads? *</Label>
          <p className="text-xs text-muted-foreground -mt-1">Select all that apply</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "name", label: "Name" },
              { value: "phone", label: "Phone" },
              { value: "email", label: "Email" },
              { value: "address", label: "Address" },
              { value: "issue", label: "Issue description" },
              { value: "urgency", label: "Urgency level" },
              { value: "budget", label: "Budget" },
              { value: "preferred_time", label: "Preferred time" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleArrayField("leadFields", opt.value)}
                className={cn(
                  "flex items-center space-x-2 p-3 rounded-lg border text-left text-sm transition-colors",
                  formData.leadFields.includes(opt.value)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <Checkbox checked={formData.leadFields.includes(opt.value)} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qualifiedLeadRules">What makes a "good" lead? (optional)</Label>
          <Textarea
            id="qualifiedLeadRules"
            placeholder="e.g. Homeowner (not renter), within service area, job over $500..."
            value={formData.qualifiedLeadRules}
            onChange={(e) => updateField("qualifiedLeadRules", e.target.value)}
            disabled={isLoading}
            rows={2}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">AI will flag high-quality leads for priority follow-up</p>
        </div>

        <div className="space-y-3">
          <Label>When should the AI hand off to a human?</Label>
          <p className="text-xs text-muted-foreground -mt-1">Select all that apply</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "angry", label: "Angry caller" },
              { value: "repeated", label: "Repeated questions" },
              { value: "complex", label: "Complex request" },
              { value: "payment", label: "Payment questions" },
              { value: "legal", label: "Legal / safety" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleArrayField("handoffTriggers", opt.value)}
                className={cn(
                  "flex items-center space-x-2 p-3 rounded-lg border text-left text-sm transition-colors",
                  formData.handoffTriggers.includes(opt.value)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <Checkbox checked={formData.handoffTriggers.includes(opt.value)} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Can the AI discuss pricing?</Label>
          <RadioGroup
            value={formData.pricingGuidance}
            onValueChange={(v: PricingGuidance) => updateField("pricingGuidance", v)}
            className="grid gap-2"
            disabled={isLoading}
          >
            {[
              { value: "ranges", label: "Yes, give ranges" },
              { value: "follow_up", label: 'Only say "we\'ll follow up"' },
              { value: "never", label: "Never discuss pricing" },
            ].map((opt) => (
              <div 
                key={opt.value} 
                onClick={() => !isLoading && updateField("pricingGuidance", opt.value as PricingGuidance)}
                className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={opt.value} id={`pricing-${opt.value}`} className="pointer-events-none" />
                <Label className="cursor-pointer font-normal flex-1 pointer-events-none">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );

  // Step 5: AI Voice & Personality (after logic is clear)
  const renderAIVoiceStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">Voice & personality</h2>
        <p className="text-muted-foreground">Now that we know what the AI does, let's define how it sounds.</p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-3">
          <Label>Preferred tone *</Label>
          <RadioGroup
            value={formData.preferredTone}
            onValueChange={(v: Tone) => updateField("preferredTone", v)}
            className="grid grid-cols-3 gap-2"
            disabled={isLoading}
          >
            {[
              { value: "friendly", label: "Friendly", desc: "Warm & approachable" },
              { value: "professional", label: "Professional", desc: "Polished & formal" },
              { value: "direct", label: "Direct", desc: "Efficient & to the point" },
            ].map((opt) => (
              <div 
                key={opt.value} 
                onClick={() => !isLoading && updateField("preferredTone", opt.value as Tone)}
                className="flex flex-col items-center text-center space-y-1 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={opt.value} id={`tone-${opt.value}`} className="pointer-events-none" />
                <Label className="cursor-pointer font-medium text-sm pointer-events-none">{opt.label}</Label>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label>How should the business feel to customers?</Label>
          <p className="text-xs text-muted-foreground -mt-1">Select up to 2</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "family_owned", label: "Family-owned & personal" },
              { value: "fast", label: "Fast & no-nonsense" },
              { value: "calm", label: "Calm & professional" },
              { value: "friendly", label: "Friendly & casual" },
            ].map((opt) => {
              const isSelected = formData.businessPersonality.includes(opt.value);
              const isDisabled = !isSelected && formData.businessPersonality.length >= 2;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleArrayField("businessPersonality", opt.value, 2)}
                  disabled={isDisabled}
                  className={cn(
                    "flex items-center space-x-2 p-3 rounded-lg border text-left text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : isDisabled
                        ? "border-border opacity-50 cursor-not-allowed"
                        : "border-border hover:bg-secondary/50"
                  )}
                >
                  <Checkbox checked={isSelected} disabled={isDisabled} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">Guides phrasing, not just tone</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="doNotSay">Anything the AI should avoid saying?</Label>
          <Textarea
            id="doNotSay"
            placeholder="Don't quote prices&#10;Don't promise same-day service&#10;Don't mention competitors"
            value={formData.doNotSay}
            onChange={(e) => updateField("doNotSay", e.target.value)}
            disabled={isLoading}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">Prevents brand damage</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="guaranteesPolicies">Any guarantees or policies worth mentioning?</Label>
          <Textarea
            id="guaranteesPolicies"
            placeholder="Licensed & insured&#10;Satisfaction guarantee&#10;No weekend fees&#10;Family-owned"
            value={formData.guaranteesPolicies}
            onChange={(e) => updateField("guaranteesPolicies", e.target.value)}
            disabled={isLoading}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">Becomes part of the AI's default pitch</p>
          
          {/* Policy/terms file upload */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <FileDropZone
              label="Or upload policy documents"
              hint="Terms of service, warranty info, pricing sheets, etc. (PDF or images)"
              accept="application/pdf,image/*"
              multiple={true}
              maxFiles={5}
              maxSizeMB={10}
              files={formData.policyFiles}
              onFilesChange={(files) => updateField("policyFiles", files)}
              disabled={isLoading}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Step 6: FAQs & Human Context (optional depth)
  const renderAIContextStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-2">FAQs & context</h2>
        <p className="text-muted-foreground">Optional but powerful — makes the AI sound like it really knows your business.</p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="faqs">Common questions & answers</Label>
          <Textarea
            id="faqs"
            placeholder="Q: Do you offer emergency service?&#10;A: Yes, 24/7 for existing customers.&#10;&#10;Q: Do you give free estimates?&#10;A: Yes, for jobs over $200."
            value={formData.faqs}
            onChange={(e) => updateField("faqs", e.target.value)}
            disabled={isLoading}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerFaqs">What do customers ask all the time?</Label>
          <Textarea
            id="customerFaqs"
            placeholder="Do you work weekends?&#10;How fast can you get here?&#10;Do you service my area?"
            value={formData.customerFaqs}
            onChange={(e) => updateField("customerFaqs", e.target.value)}
            disabled={isLoading}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="teamNames">Who might customers speak to or hear about?</Label>
          <Textarea
            id="teamNames"
            placeholder="John – Owner&#10;Sarah – Office Manager&#10;Mike – Lead Technician"
            value={formData.teamNames}
            onChange={(e) => updateField("teamNames", e.target.value)}
            disabled={isLoading}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">AI can say "I'll pass this to Mike" — sounds human instantly</p>
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
          <p className="text-xs text-muted-foreground">Calendly, Acuity, etc. — AI can send this to callers</p>
        </div>
      </div>
    </div>
  );

  // Helper to find step index by id
  const getStepIndex = (stepId: string) => {
    return steps.findIndex(s => s.id === stepId);
  };

  // Step 7: Review & Confirmation (NEW - required)
  const renderAIReviewStep = () => {
    const callHandlingLabels: Record<string, string> = {
      always: "Always answer",
      after_hours: "After hours only",
      overflow: "Overflow only",
    };
    
    const handoffLabels: Record<string, string> = {
      transfer: "Transfer call",
      message: "Take message",
      callback: "Schedule callback",
      text: "Send text follow-up",
    };

    const afterHoursLabels: Record<string, string> = {
      message: "Take a message",
      book: "Book appointments",
      emergency_only: "Emergency escalation only",
      callback_info: "Tell callers when to call back",
    };

    const toneLabels: Record<string, string> = {
      friendly: "Friendly",
      professional: "Professional",
      direct: "Direct",
    };

    const pricingLabels: Record<string, string> = {
      ranges: "Yes, give ranges",
      follow_up: 'Only say "we\'ll follow up"',
      never: "Never discuss pricing",
    };

    const textHandlingLabels: Record<string, string> = {
      answer_faqs: "Answer FAQs",
      collect_lead: "Collect lead info",
      send_booking: "Book appointments",
      follow_up_missed: "Follow up missed calls",
    };

    const handoffTriggerLabels: Record<string, string> = {
      angry: "Angry caller",
      repeated: "Repeated questions",
      complex: "Complex request",
      pricing_disputes: "Pricing disputes",
      legal_safety: "Legal/safety concerns",
    };

    const emergencyLabels: Record<string, string> = {
      safety: "Safety issue",
      water_power_heat: "Water/power/heat outage",
      fire_gas: "Fire/gas",
      locked_out: "Locked out",
      flooding: "Flooding/burst pipes",
      no_heat_ac: "No heat or A/C",
    };

    const ReviewSection = ({ 
      icon: Icon, 
      title, 
      stepId, 
      children 
    }: { 
      icon: typeof Phone; 
      title: string; 
      stepId: string;
      children: React.ReactNode;
    }) => (
      <div className="bg-secondary/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <h3 className="font-medium">{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => setCurrentStep(getStepIndex(stepId))}
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
        </div>
        {children}
      </div>
    );

    const ReviewRow = ({ label, value }: { label: string; value: string | undefined | null }) => (
      <div className="flex justify-between gap-2">
        <span className="text-muted-foreground shrink-0">{label}</span>
        <span className="font-medium text-right truncate">{value || "—"}</span>
      </div>
    );

    const ReviewList = ({ label, items }: { label: string; items: string[] }) => (
      <div>
        <span className="text-muted-foreground">{label}</span>
        <p className="font-medium mt-1 text-xs">{items.length > 0 ? items.join(", ") : "—"}</p>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-3">Review your setup</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Click "Edit" on any section to make changes.
          </p>
        </div>

        <div className="space-y-4">
          {/* Business Basics */}
          <ReviewSection icon={Users} title="Business Basics" stepId="basics">
            <div className="grid gap-2 text-sm">
              <ReviewRow label="Business:" value={formData.businessName} />
              <ReviewRow label="Contact:" value={formData.yourName} />
              <ReviewRow label="Email:" value={formData.email} />
              <ReviewRow label="Phone:" value={formData.phone} />
            </div>
          </ReviewSection>

          {/* Call Coverage */}
          <ReviewSection icon={Phone} title="Call Coverage" stepId="ai-coverage">
            <div className="grid gap-2 text-sm">
              <ReviewRow label="When AI answers:" value={callHandlingLabels[formData.callHandling]} />
              <ReviewRow label="Handoff method:" value={handoffLabels[formData.handoffMethod]} />
              {formData.textHandling.length > 0 && (
                <ReviewList 
                  label="Text/chat actions:" 
                  items={formData.textHandling.map(t => textHandlingLabels[t] || t)} 
                />
              )}
            </div>
          </ReviewSection>

          {/* Operations */}
          <ReviewSection icon={Clock} title="Operations" stepId="ai-operations">
            <div className="grid gap-2 text-sm">
              <ReviewRow label="Business phone:" value={formData.businessPhone} />
              <ReviewRow label="Hours:" value={formData.businessHours} />
              {formData.afterHoursAction && (
                <ReviewRow label="After hours:" value={afterHoursLabels[formData.afterHoursAction]} />
              )}
              {formData.servicesOffered && (
                <div>
                  <span className="text-muted-foreground">Services:</span>
                  <p className="font-medium mt-1 text-xs line-clamp-2">{formData.servicesOffered}</p>
                </div>
              )}
              {formData.serviceAreaRules && (
                <div>
                  <span className="text-muted-foreground">Service area:</span>
                  <p className="font-medium mt-1 text-xs line-clamp-2">{formData.serviceAreaRules}</p>
                </div>
              )}
            </div>
          </ReviewSection>

          {/* Emergencies */}
          {shouldShowEmergencyStep() && (
            <ReviewSection icon={AlertTriangle} title="Emergencies" stepId="ai-emergency">
              <div className="grid gap-2 text-sm">
                <ReviewRow label="Escalation number:" value={formData.escalationNumber} />
                <ReviewList 
                  label="Emergency triggers:" 
                  items={[
                    ...formData.emergencyTriggers.map(t => emergencyLabels[t] || t),
                    ...(formData.emergencyOther ? [formData.emergencyOther] : [])
                  ]} 
                />
              </div>
            </ReviewSection>
          )}

          {/* Lead Handling */}
          <ReviewSection icon={Users} title="Lead Handling" stepId="ai-leads">
            <div className="grid gap-2 text-sm">
              <ReviewList label="Info collected:" items={formData.leadFields} />
              {formData.pricingGuidance && (
                <ReviewRow label="Pricing:" value={pricingLabels[formData.pricingGuidance]} />
              )}
              {formData.handoffTriggers.length > 0 && (
                <ReviewList 
                  label="Handoff triggers:" 
                  items={formData.handoffTriggers.map(t => handoffTriggerLabels[t] || t)} 
                />
              )}
              {formData.qualifiedLeadRules && (
                <div>
                  <span className="text-muted-foreground">Qualification rules:</span>
                  <p className="font-medium mt-1 text-xs line-clamp-2">{formData.qualifiedLeadRules}</p>
                </div>
              )}
            </div>
          </ReviewSection>

          {/* Voice & Personality */}
          <ReviewSection icon={MessageSquare} title="Voice & Personality" stepId="ai-voice">
            <div className="grid gap-2 text-sm">
              <ReviewRow label="Tone:" value={toneLabels[formData.preferredTone]} />
              {formData.businessPersonality.length > 0 && (
                <ReviewList label="Personality:" items={formData.businessPersonality} />
              )}
              {formData.doNotSay && (
                <div>
                  <span className="text-muted-foreground">Do not say:</span>
                  <p className="font-medium mt-1 text-xs line-clamp-2">{formData.doNotSay}</p>
                </div>
              )}
              {formData.guaranteesPolicies && (
                <div>
                  <span className="text-muted-foreground">Guarantees/policies:</span>
                  <p className="font-medium mt-1 text-xs line-clamp-2">{formData.guaranteesPolicies}</p>
                </div>
              )}
            </div>
          </ReviewSection>

          {/* Context (if any filled) */}
          {(formData.faqs || formData.customerFaqs || formData.teamNames || formData.bookingLink) && (
            <ReviewSection icon={FileText} title="FAQs & Context" stepId="ai-context">
              <div className="grid gap-2 text-sm">
                {formData.teamNames && (
                  <div>
                    <span className="text-muted-foreground">Team names:</span>
                    <p className="font-medium mt-1 text-xs line-clamp-2">{formData.teamNames}</p>
                  </div>
                )}
                {formData.bookingLink && (
                  <ReviewRow label="Calendar integration:" value={formData.bookingLink} />
                )}
                {formData.faqs && (
                  <div>
                    <span className="text-muted-foreground">FAQs:</span>
                    <p className="font-medium mt-1 text-xs line-clamp-2">{formData.faqs}</p>
                  </div>
                )}
                {formData.customerFaqs && (
                  <div>
                    <span className="text-muted-foreground">Common questions:</span>
                    <p className="font-medium mt-1 text-xs line-clamp-2">{formData.customerFaqs}</p>
                  </div>
                )}
              </div>
            </ReviewSection>
          )}
        </div>

        {/* Confirmation checkbox */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <button
            type="button"
            onClick={() => updateField("reviewConfirmed", !formData.reviewConfirmed)}
            className="flex items-start gap-3 w-full text-left"
          >
            <div className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors",
              formData.reviewConfirmed 
                ? "bg-primary border-primary" 
                : "border-muted-foreground/50"
            )}>
              {formData.reviewConfirmed && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
            <div>
              <p className="font-medium">I've reviewed this and understand how the AI will handle customer calls.</p>
              <p className="text-xs text-muted-foreground mt-1">You can update any of these settings later in your dashboard.</p>
            </div>
          </button>
        </div>
      </div>
    );
  };

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
      // Tier selection (for "both" without pre-selected tier)
      case "tier":
        return renderTierStep();
      // Track selection
      case "track":
        return renderTrackStep();
      // Track A: New Site steps
      case "content":
        return renderContentStep();
      case "links":
        return renderLinksStep();
      case "hours":
        return renderHoursStep();
      case "design":
        return renderDesignStep();
      case "features":
        return renderFeaturesStep();
      // Track B: Existing Site steps
      case "platform":
        return renderPlatformStep();
      case "work-needed":
        return renderWorkNeededStep();
      case "access":
        return renderAccessStep();
      case "access-checklist":
        return renderAccessChecklistStep();
      // AI steps - new order
      case "ai-framing":
        return renderAIFramingStep();
      case "ai-coverage":
        return renderAICoverageStep();
      case "ai-operations":
        return renderAIOperationsStep();
      case "ai-emergency":
        return renderAIEmergencyStep();
      case "ai-leads":
        return renderAILeadsStep();
      case "ai-voice":
        return renderAIVoiceStep();
      case "ai-context":
        return renderAIContextStep();
      case "ai-review":
        return renderAIReviewStep();
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
            <div className="flex items-center gap-2 overflow-x-auto">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center shrink-0">
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
          {currentStep === 0 && !skipChoose && (
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
                    <CheckCircle2 className="mr-2 h-4 w-4" />
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
