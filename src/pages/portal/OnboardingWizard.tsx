import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  CheckCircle2,
  Loader2,
  Briefcase,
  Wrench,
  Store,
  Users,
  Utensils,
  Sparkles,
  Target,
  Timer,
  Hand,
  Palette,
  Upload,
  ImageIcon
} from "lucide-react";
import { ClientLayout } from "@/components/portal/ClientLayout";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// 6-step intake with assets integrated
const STEPS = [
  { id: "basics", label: "Basics", icon: Building2 },
  { id: "goal", label: "Goal", icon: Target },
  { id: "timeline", label: "Timeline", icon: Timer },
  { id: "involvement", label: "Style", icon: Hand },
  { id: "assets", label: "Assets", icon: Palette },
  { id: "review", label: "Review", icon: CheckCircle2 },
];

// Business types
const BUSINESS_TYPES = [
  { id: "trades", label: "Trades", icon: Wrench, description: "Plumbing, HVAC, electrical, roofing" },
  { id: "professional", label: "Professional", icon: Briefcase, description: "Law, accounting, consulting" },
  { id: "retail", label: "Retail", icon: Store, description: "Shops, boutiques, e-commerce" },
  { id: "restaurant", label: "Food & hospitality", icon: Utensils, description: "Restaurants, bars, hotels" },
  { id: "creative", label: "Creative", icon: Sparkles, description: "Design, photography, media" },
  { id: "other", label: "Other", icon: Users, description: "Something else" },
];

// Primary goal - single choice, high-signal
const PRIMARY_GOALS = [
  { id: "leads", label: "Get more calls / leads", description: "Your site will be built around contact forms, click-to-call, and booking" },
  { id: "sell", label: "Sell products or services online", description: "We'll set up payments, checkout, and product/service listings" },
  { id: "professional", label: "Look more professional", description: "Focus on credibility, portfolio, and trust signals" },
  { id: "unsure", label: "Not sure yet — guide me", description: "We'll figure out what works best for your business" },
];

// What they're selling - only shown if "sell" is selected
const SELL_TYPE_OPTIONS = [
  { id: "services", label: "Services", description: "Appointments, consultations, packages" },
  { id: "physical", label: "Physical products", description: "Items you ship or deliver" },
  { id: "digital", label: "Digital products", description: "Downloads, courses, subscriptions" },
  { id: "unsure", label: "Not sure yet", description: "We'll help you decide" },
];

// Timeline - confidence gauge
const TIMELINE_OPTIONS = [
  { id: "exploring", label: "Actively researching", description: "Evaluating options, no rush yet" },
  { id: "soon", label: "In the next 1–2 months", description: "Ready to kick things off soon" },
  { id: "asap", label: "ASAP", description: "High priority — we'll fast-track your project" },
  { id: "deadline", label: "I have a specific deadline", description: "Event, launch, or date driving this" },
];

// Involvement preference - how hands-on
const INVOLVEMENT_OPTIONS = [
  { id: "hands_on", label: "I want to be hands-on", description: "Involved in every decision" },
  { id: "options", label: "Give me options to choose from", description: "Curated choices" },
  { id: "handle_it", label: "Just handle it for me", description: "Trust the experts" },
];

// Photo readiness options
const PHOTO_OPTIONS = [
  { id: "have_photos", label: "I have photos ready", description: "Will upload after submitting" },
  { id: "need_photos", label: "I need photos taken or sourced", description: "We can help with this" },
  { id: "generate", label: "Generate professional images for me", description: "AI-powered, industry-matched" },
];

interface IntakeData {
  businessName: string;
  businessType: string;
  serviceArea: string;
  contactEmail: string;
  contactPhone: string;
  primaryGoal: string;
  sellType: string;
  timeline: string;
  deadlineDate: string;
  involvement: string;
  // Assets - all optional
  hasLogo: boolean;
  brandColors: string;
  servicesList: string;
  photoReadiness: string;
}

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  
  const [intake, setIntake] = useState<IntakeData>({
    businessName: "",
    businessType: "",
    serviceArea: "",
    contactEmail: "",
    contactPhone: "",
    primaryGoal: "",
    sellType: "",
    timeline: "",
    deadlineDate: "",
    involvement: "",
    // Assets - all optional
    hasLogo: false,
    brandColors: "",
    servicesList: "",
    photoReadiness: "",
  });

  // Auth guard: redirect if no session
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
      setAuthChecking(false);
    };
    
    checkAuth();
    
    // Also listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && !authChecking) {
        toast({
          title: "Session expired",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        navigate("/portal", { replace: true });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate, authChecking]);

  const stepProgress = ((currentStep + 1) / STEPS.length) * 100;

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: // Basics
        return !!intake.businessName && !!intake.businessType && !!intake.contactEmail && !!intake.contactPhone;
      case 1: // Goal
        // If they selected "sell", require sellType too
        if (intake.primaryGoal === "sell") {
          return !!intake.primaryGoal && !!intake.sellType;
        }
        return !!intake.primaryGoal;
      case 2: // Timeline
        if (intake.timeline === "deadline") {
          return !!intake.timeline && !!intake.deadlineDate;
        }
        return !!intake.timeline;
      case 3: // Involvement/Style
        return !!intake.involvement;
      case 4: // Assets - all optional, always can proceed
        return true;
      case 5: // Review - always can proceed
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCreateProject();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/portal");
    }
  };

  const handleCreateProject = async () => {
    setLoading(true);
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
        body: JSON.stringify({ intake }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      // Navigate directly to workspace with AI trial offer
      navigate(`/w/${data.project_token}?ai_trial=start`);
    } catch (err) {
      console.error("Create project error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      // STEP 1: BASICS
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                placeholder="e.g. Smith Plumbing, Acme Roofing"
                value={intake.businessName}
                onChange={(e) => setIntake(prev => ({ ...prev, businessName: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>What type of business?</Label>
              <div className="grid grid-cols-2 gap-3">
                {BUSINESS_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = intake.businessType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setIntake(prev => ({ ...prev, businessType: type.id }))}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceArea">Where do you serve customers?</Label>
              <Input
                id="serviceArea"
                placeholder="e.g. Dallas, TX or Greater Boston Area"
                value={intake.serviceArea}
                onChange={(e) => setIntake(prev => ({ ...prev, serviceArea: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>How can we reach you?</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Email"
                  type="email"
                  value={intake.contactEmail}
                  onChange={(e) => setIntake(prev => ({ ...prev, contactEmail: e.target.value }))}
                />
                <Input
                  placeholder="Phone"
                  type="tel"
                  value={intake.contactPhone}
                  onChange={(e) => setIntake(prev => ({ ...prev, contactPhone: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      // STEP 2: PRIMARY GOAL
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base">What's the main purpose of this website?</Label>
              <p className="text-sm text-muted-foreground">This shapes everything — layout, calls-to-action, and features we prioritize.</p>
              <RadioGroup
                value={intake.primaryGoal}
                onValueChange={(value) => setIntake(prev => ({ ...prev, primaryGoal: value, sellType: value === "sell" ? prev.sellType : "" }))}
                className="space-y-3"
              >
                {PRIMARY_GOALS.map((goal) => (
                  <div 
                    key={goal.id} 
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      intake.primaryGoal === goal.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setIntake(prev => ({ ...prev, primaryGoal: goal.id, sellType: goal.id === "sell" ? prev.sellType : "" }))}
                  >
                    <RadioGroupItem value={goal.id} id={`goal-${goal.id}`} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={`goal-${goal.id}`} className="cursor-pointer font-medium">
                        {goal.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">{goal.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Follow-up for "sell" option */}
            {intake.primaryGoal === "sell" && (
              <div className="space-y-3 pt-2 border-t">
                <Label className="text-base">What will you be selling?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {SELL_TYPE_OPTIONS.map((opt) => {
                    const isSelected = intake.sellType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setIntake(prev => ({ ...prev, sellType: opt.id }))}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className="font-medium text-sm">{opt.label}</div>
                        <div className="text-xs text-muted-foreground">{opt.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      // STEP 3: TIMELINE
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base">When are you hoping to have something live?</Label>
              <p className="text-sm text-muted-foreground">This helps us prioritize and plan — no commitment yet.</p>
              <RadioGroup
                value={intake.timeline}
                onValueChange={(value) => setIntake(prev => ({ ...prev, timeline: value, deadlineDate: value !== "deadline" ? "" : prev.deadlineDate }))}
                className="space-y-3"
              >
                {TIMELINE_OPTIONS.map((opt) => (
                  <div 
                    key={opt.id} 
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      intake.timeline === opt.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setIntake(prev => ({ ...prev, timeline: opt.id, deadlineDate: opt.id !== "deadline" ? "" : prev.deadlineDate }))}
                  >
                    <RadioGroupItem value={opt.id} id={`timeline-${opt.id}`} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={`timeline-${opt.id}`} className="cursor-pointer font-medium">
                        {opt.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Conditional: Deadline date picker */}
            {intake.timeline === "deadline" && (
              <div className="space-y-3 pt-2 border-t">
                <Label className="text-base">When is your deadline?</Label>
                <Input
                  type="date"
                  value={intake.deadlineDate}
                  onChange={(e) => setIntake(prev => ({ ...prev, deadlineDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="max-w-xs"
                />
              </div>
            )}
          </div>
        );

      // STEP 4: INVOLVEMENT/STYLE
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base">How involved do you want to be in decisions?</Label>
              <p className="text-sm text-muted-foreground">There's no wrong answer — this helps us match your style.</p>
              <RadioGroup
                value={intake.involvement}
                onValueChange={(value) => setIntake(prev => ({ ...prev, involvement: value }))}
                className="space-y-3"
              >
                {INVOLVEMENT_OPTIONS.map((opt) => (
                  <div 
                    key={opt.id} 
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      intake.involvement === opt.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setIntake(prev => ({ ...prev, involvement: opt.id }))}
                  >
                    <RadioGroupItem value={opt.id} id={`involvement-${opt.id}`} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={`involvement-${opt.id}`} className="cursor-pointer font-medium">
                        {opt.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      // STEP 5: ASSETS (all optional)
      case 4:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              These help us build faster — but everything here is optional. Skip what you don't have ready.
            </p>

            {/* Logo */}
            <div className="p-4 rounded-lg border-2 border-border space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <Label className="font-medium">Do you have a logo?</Label>
                  <p className="text-sm text-muted-foreground">We can work with or without one</p>
                </div>
                <Checkbox
                  checked={intake.hasLogo}
                  onCheckedChange={(checked) => setIntake(prev => ({ ...prev, hasLogo: !!checked }))}
                />
              </div>
              {intake.hasLogo && (
                <p className="text-xs text-muted-foreground ml-13 pl-13">
                  Great! You'll be able to upload it after submitting.
                </p>
              )}
            </div>

            {/* Brand Colors */}
            <div className="p-4 rounded-lg border-2 border-border space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <Label className="font-medium">Brand colors</Label>
                  <p className="text-sm text-muted-foreground">Any colors you want us to use?</p>
                </div>
              </div>
              <Input
                placeholder="e.g. Navy blue and gold, or #1a365d"
                value={intake.brandColors}
                onChange={(e) => setIntake(prev => ({ ...prev, brandColors: e.target.value }))}
              />
            </div>

            {/* Services List */}
            <div className="p-4 rounded-lg border-2 border-border space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <Label className="font-medium">Services or products</Label>
                  <p className="text-sm text-muted-foreground">What do you offer?</p>
                </div>
              </div>
              <Textarea
                placeholder="e.g. Residential plumbing, drain cleaning, water heater installation..."
                value={intake.servicesList}
                onChange={(e) => setIntake(prev => ({ ...prev, servicesList: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Photos */}
            <div className="p-4 rounded-lg border-2 border-border space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <Label className="font-medium">Photos of your work</Label>
                  <p className="text-sm text-muted-foreground">Portfolio, team, or workspace images</p>
                </div>
              </div>
              <RadioGroup
                value={intake.photoReadiness}
                onValueChange={(value) => setIntake(prev => ({ ...prev, photoReadiness: value }))}
                className="space-y-2"
              >
                {PHOTO_OPTIONS.map((opt) => (
                  <div 
                    key={opt.id} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      intake.photoReadiness === opt.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setIntake(prev => ({ ...prev, photoReadiness: opt.id }))}
                  >
                    <RadioGroupItem value={opt.id} id={`photo-${opt.id}`} />
                    <div className="flex-1">
                      <Label htmlFor={`photo-${opt.id}`} className="cursor-pointer text-sm font-medium">
                        {opt.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      // STEP 6: REVIEW
      case 5:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Review your information below. You can go back to make changes.
            </p>

            <div className="space-y-4">
              {/* Business Info */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Business
                </h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {intake.businessName}</p>
                  <p><span className="text-muted-foreground">Type:</span> {BUSINESS_TYPES.find(t => t.id === intake.businessType)?.label}</p>
                  <p><span className="text-muted-foreground">Service area:</span> {intake.serviceArea || "Not specified"}</p>
                </div>
              </div>

              {/* Contact */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <h3 className="font-medium">Contact</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Email:</span> {intake.contactEmail}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {intake.contactPhone}</p>
                </div>
              </div>

              {/* Goals & Timeline */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Goals
                </h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Main goal:</span> {PRIMARY_GOALS.find(g => g.id === intake.primaryGoal)?.label}</p>
                  {intake.sellType && (
                    <p><span className="text-muted-foreground">Selling:</span> {SELL_TYPE_OPTIONS.find(s => s.id === intake.sellType)?.label}</p>
                  )}
                  <p><span className="text-muted-foreground">Timeline:</span> {TIMELINE_OPTIONS.find(t => t.id === intake.timeline)?.label}</p>
                  {intake.deadlineDate && (
                    <p><span className="text-muted-foreground">Deadline:</span> {intake.deadlineDate}</p>
                  )}
                </div>
              </div>

              {/* Assets */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  Assets
                </h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Has logo:</span> {intake.hasLogo ? "Yes" : "No"}</p>
                  <p><span className="text-muted-foreground">Brand colors:</span> {intake.brandColors || "Not specified"}</p>
                  <p><span className="text-muted-foreground">Services:</span> {intake.servicesList ? "Provided" : "Not specified"}</p>
                  <p><span className="text-muted-foreground">Photos:</span> {PHOTO_OPTIONS.find(p => p.id === intake.photoReadiness)?.label || "Not specified"}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const CurrentStepIcon = STEPS[currentStep].icon;
  const isLastStep = currentStep === STEPS.length - 1;

  // Show loading state while checking auth
  if (authChecking) {
    return (
      <ClientLayout
        title="New Project"
        subtitle="Checking authentication..."
        maxWidth="md"
      >
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout
      title="New Project"
      subtitle={`Step ${currentStep + 1} of ${STEPS.length}`}
      maxWidth="md"
    >
      {/* Progress bar */}
      <div className="mb-8">
        <Progress value={stepProgress} className="h-1" />
        <div className="flex justify-between mt-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isComplete = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div 
                key={step.id}
                className={`flex flex-col items-center gap-1 ${
                  isCurrent ? "text-primary" : isComplete ? "text-primary/60" : "text-muted-foreground/40"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  isCurrent ? "border-primary bg-primary/10" : isComplete ? "border-primary/60 bg-primary/5" : "border-muted"
                }`}>
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="text-xs hidden sm:block">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        <div className="mb-6">
          <h2 className="font-serif text-2xl font-bold flex items-center gap-3">
            <CurrentStepIcon className="h-6 w-6 text-primary" />
            {STEPS[currentStep].label}
          </h2>
        </div>
        
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border mt-8">
        <Button
          variant="ghost"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 0 ? "Cancel" : "Back"}
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!canProceed() || loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : isLastStep ? (
            <>
              Submit
              <CheckCircle2 className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </ClientLayout>
  );
}
