import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Package,
  Hand
} from "lucide-react";
import { ClientLayout } from "@/components/portal/ClientLayout";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Lean 5-step intake
const STEPS = [
  { id: "basics", label: "Basics", icon: Building2 },
  { id: "goal", label: "Goal", icon: Target },
  { id: "timeline", label: "Timeline", icon: Timer },
  { id: "readiness", label: "Readiness", icon: Package },
  { id: "involvement", label: "Involvement", icon: Hand },
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

// Readiness - what they have
const READINESS_OPTIONS = [
  { id: "ready", label: "I have everything ready", description: "Logo, photos, content" },
  { id: "some", label: "I have some things", description: "Partial assets" },
  { id: "need_help", label: "I need help with assets", description: "We can assist" },
  { id: "unsure", label: "Not sure what I need", description: "We'll guide you" },
];

// Involvement preference - how hands-on
const INVOLVEMENT_OPTIONS = [
  { id: "hands_on", label: "I want to be hands-on", description: "Involved in every decision" },
  { id: "options", label: "Give me options to choose from", description: "Curated choices" },
  { id: "handle_it", label: "Just handle it for me", description: "Trust the experts" },
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
  readiness: string;
  involvement: string;
}

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
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
    readiness: "",
    involvement: "",
  });

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
      case 3: // Readiness
        return !!intake.readiness;
      case 4: // Involvement
        return !!intake.involvement;
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

      // STEP 4: READINESS
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base">How ready are you with assets?</Label>
              <p className="text-sm text-muted-foreground">Logo, photos, written content, etc.</p>
              <RadioGroup
                value={intake.readiness}
                onValueChange={(value) => setIntake(prev => ({ ...prev, readiness: value }))}
                className="space-y-3"
              >
                {READINESS_OPTIONS.map((opt) => (
                  <div 
                    key={opt.id} 
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      intake.readiness === opt.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setIntake(prev => ({ ...prev, readiness: opt.id }))}
                  >
                    <RadioGroupItem value={opt.id} id={`readiness-${opt.id}`} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={`readiness-${opt.id}`} className="cursor-pointer font-medium">
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

      // STEP 5: INVOLVEMENT
      case 4:
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

      default:
        return null;
    }
  };

  const CurrentStepIcon = STEPS[currentStep].icon;
  const isLastStep = currentStep === STEPS.length - 1;

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
