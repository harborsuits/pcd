import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  Palette, 
  Cog, 
  CheckCircle2,
  Loader2,
  Briefcase,
  Wrench,
  Store,
  Users,
  Utensils,
  Calendar,
  MessageSquare,
  CreditCard,
  Clock,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { IntakeSubmittedScreen } from "@/components/portal/IntakeSubmittedScreen";
import { ClientLayout } from "@/components/portal/ClientLayout";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Step definitions
const STEPS = [
  { id: "basics", label: "Basics", icon: Building2 },
  { id: "style", label: "Style", icon: Palette },
  { id: "function", label: "Function", icon: Cog },
  { id: "review", label: "Review", icon: CheckCircle2 },
];

// Business types
const BUSINESS_TYPES = [
  { id: "services", label: "Services", icon: Wrench, description: "Plumbing, HVAC, cleaning, etc." },
  { id: "trades", label: "Trades", icon: Building2, description: "Construction, roofing, electrical" },
  { id: "retail", label: "Local retail", icon: Store, description: "Shops, boutiques, showrooms" },
  { id: "professional", label: "Professional", icon: Briefcase, description: "Law, accounting, consulting" },
  { id: "restaurant", label: "Restaurant / hospitality", icon: Utensils, description: "Food, bars, events" },
  { id: "other", label: "Other", icon: Users, description: "Something else" },
];

// Main goals (multi-select)
const GOALS = [
  { id: "calls", label: "Get more calls / leads" },
  { id: "booking", label: "Online booking / scheduling" },
  { id: "professional", label: "Improve credibility / modernize site" },
  { id: "reviews", label: "Better reviews / reputation" },
  { id: "payments", label: "Take payments / deposits" },
  { id: "automations", label: "Automations / follow-ups" },
];

// Timeline options
const TIMELINE_OPTIONS = [
  { id: "asap", label: "ASAP — I need something live now" },
  { id: "1-2_weeks", label: "1–2 weeks" },
  { id: "30_days", label: "Within 30 days" },
  { id: "browsing", label: "Just browsing / planning" },
];

// Style vibes
const STYLE_VIBES = [
  { id: "clean", label: "Clean & modern", description: "Minimal, crisp, professional", color: "bg-slate-100 border-slate-300" },
  { id: "warm", label: "Warm & local", description: "Friendly, approachable, cozy", color: "bg-amber-50 border-amber-200" },
  { id: "bold", label: "Bold & high-end", description: "Premium, confident, striking", color: "bg-zinc-900 text-white border-zinc-700" },
  { id: "simple", label: "Simple & practical", description: "No-frills, clear, functional", color: "bg-gray-50 border-gray-300" },
  { id: "auto", label: "You decide for me", description: "We'll pick based on your industry", color: "bg-accent/20 border-accent" },
];

// Color presets
const COLOR_PRESETS = [
  { id: "neutral", label: "Light & neutral", colors: ["#f8fafc", "#e2e8f0", "#334155"] },
  { id: "dark", label: "Dark & bold", colors: ["#18181b", "#27272a", "#fafafa"] },
  { id: "blue", label: "Blue & trustworthy", colors: ["#eff6ff", "#3b82f6", "#1e40af"] },
  { id: "green", label: "Green & natural", colors: ["#f0fdf4", "#22c55e", "#166534"] },
  { id: "auto", label: "Choose for me", colors: ["#f0fdfa", "#2dd4bf", "#0f766e"] },
];

// Curated demo style gallery
const STYLE_DEMOS = [
  { id: "clean-contractor", title: "Clean Contractor", subtitle: "Modern trades look", styleVibe: "clean", colorPreset: "neutral" },
  { id: "warm-local", title: "Warm & Local", subtitle: "Friendly neighborhood feel", styleVibe: "warm", colorPreset: "green" },
  { id: "bold-pro", title: "Bold Professional", subtitle: "Premium high-end vibe", styleVibe: "bold", colorPreset: "dark" },
  { id: "simple-service", title: "Simple Service", subtitle: "No-frills & trustworthy", styleVibe: "simple", colorPreset: "blue" },
];

// Functionality options
const FUNCTIONALITY_OPTIONS = [
  { id: "booking", label: "Let customers book appointments", icon: Calendar },
  { id: "faq", label: "Answer common questions automatically", icon: HelpCircle },
  { id: "contact", label: "Collect contact requests", icon: MessageSquare },
  { id: "afterhours", label: "Handle after-hours calls/messages", icon: Clock },
  { id: "payments", label: "Take payments or deposits", icon: CreditCard },
  { id: "simple", label: "Just show info (simple site)", icon: Building2 },
];

// Hours options
const HOURS_OPTIONS = [
  { id: "regular", label: "Regular hours (9-5 type)" },
  { id: "extended", label: "Extended / 24-7" },
  { id: "notsure", label: "Not sure yet" },
];

interface IntakeData {
  businessName: string;
  businessType: string;
  goals: string[];
  hasWebsite: boolean;
  websiteUrl: string;
  timeline: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  serviceArea: string;
  styleVibe: string;
  colorPreset: string;
  inspirationLinks: string;
  functionality: string[];
  hoursType: string;
  selectedDemo: string;
  notes: string;
}

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submittedProject, setSubmittedProject] = useState<{ businessName: string; projectToken: string } | null>(null);
  
  const [intake, setIntake] = useState<IntakeData>({
    businessName: "",
    businessType: "",
    goals: [],
    hasWebsite: false,
    websiteUrl: "",
    timeline: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    serviceArea: "",
    styleVibe: "",
    colorPreset: "",
    inspirationLinks: "",
    functionality: [],
    hoursType: "",
    selectedDemo: "",
    notes: "",
  });

  const stepProgress = ((currentStep + 1) / STEPS.length) * 100;

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: // Basics
        return !!intake.businessName && !!intake.businessType && intake.goals.length > 0 && !!intake.timeline;
      case 1: // Style - can proceed if they pick a demo OR manual style+color
        return (!!intake.styleVibe && !!intake.colorPreset) || !!intake.selectedDemo;
      case 2: // Function
        return intake.functionality.length > 0 && !!intake.hoursType;
      case 3: // Review
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/portal");
    }
  };

  const toggleFunctionality = (id: string) => {
    setIntake(prev => ({
      ...prev,
      functionality: prev.functionality.includes(id)
        ? prev.functionality.filter(f => f !== id)
        : [...prev.functionality, id],
    }));
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

      // Show confirmation screen instead of navigating directly
      setSubmittedProject({
        businessName: intake.businessName,
        projectToken: data.project_token,
      });
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
      case 0:
        return (
          <div className="space-y-6">
            {/* Business name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                placeholder="e.g. Smith Plumbing, Acme Roofing"
                value={intake.businessName}
                onChange={(e) => setIntake(prev => ({ ...prev, businessName: e.target.value }))}
              />
            </div>

            {/* Business type */}
            <div className="space-y-3">
              <Label>What best describes your business?</Label>
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

            {/* Goals (multi-select) */}
            <div className="space-y-3">
              <Label>What are you trying to accomplish? (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((goal) => {
                  const isChecked = intake.goals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setIntake(prev => ({
                        ...prev,
                        goals: isChecked 
                          ? prev.goals.filter(g => g !== goal.id)
                          : [...prev.goals, goal.id]
                      }))}
                      className={`p-3 rounded-lg border-2 text-left transition-all flex items-center gap-2 ${
                        isChecked 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <Checkbox checked={isChecked} className="pointer-events-none" />
                      <span className="text-sm">{goal.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Do you have a website? */}
            <div className="space-y-3">
              <Label>Do you currently have a website?</Label>
              <RadioGroup
                value={intake.hasWebsite ? "yes" : "no"}
                onValueChange={(value) => setIntake(prev => ({ 
                  ...prev, 
                  hasWebsite: value === "yes",
                  websiteUrl: value === "no" ? "" : prev.websiteUrl
                }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="has-website-yes" />
                  <Label htmlFor="has-website-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="has-website-no" />
                  <Label htmlFor="has-website-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>
              
              {intake.hasWebsite && (
                <Input
                  placeholder="https://yoursite.com (optional)"
                  value={intake.websiteUrl}
                  onChange={(e) => setIntake(prev => ({ ...prev, websiteUrl: e.target.value }))}
                />
              )}
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <Label>When do you want to start?</Label>
              <RadioGroup
                value={intake.timeline}
                onValueChange={(value) => setIntake(prev => ({ ...prev, timeline: value }))}
                className="space-y-2"
              >
                {TIMELINE_OPTIONS.map((opt) => (
                  <div key={opt.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={opt.id} id={`timeline-${opt.id}`} />
                    <Label htmlFor={`timeline-${opt.id}`} className="cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Contact info (optional but helpful) */}
            <div className="space-y-3">
              <Label className="text-muted-foreground">Contact info (optional — helps us reach you faster)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Your name"
                  value={intake.contactName}
                  onChange={(e) => setIntake(prev => ({ ...prev, contactName: e.target.value }))}
                />
                <Input
                  placeholder="Phone"
                  value={intake.contactPhone}
                  onChange={(e) => setIntake(prev => ({ ...prev, contactPhone: e.target.value }))}
                />
              </div>
              <Input
                placeholder="Service area (towns, counties, etc.)"
                value={intake.serviceArea}
                onChange={(e) => setIntake(prev => ({ ...prev, serviceArea: e.target.value }))}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            {/* Demo gallery - pick a style reference */}
            <div className="space-y-3">
              <div>
                <Label className="text-base">Pick a style demo (optional)</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose something close to what you want — we'll customize it.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {STYLE_DEMOS.map((demo) => {
                  const isSelected = intake.selectedDemo === demo.id;
                  return (
                    <button
                      key={demo.id}
                      onClick={() => setIntake(prev => ({
                        ...prev,
                        selectedDemo: demo.id,
                        styleVibe: demo.styleVibe ?? prev.styleVibe,
                        colorPreset: demo.colorPreset ?? prev.colorPreset,
                      }))}
                      className={`group text-left rounded-xl border-2 p-4 transition-all ${
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{demo.title}</div>
                          <div className="text-sm text-muted-foreground">{demo.subtitle}</div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Don't worry — you can change this later in your portal.
              </p>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or customize manually</span>
              </div>
            </div>

            {/* Style vibe */}
            <div className="space-y-3">
              <Label>What should this site feel like?</Label>
              <div className="grid grid-cols-1 gap-3">
                {STYLE_VIBES.map((vibe) => {
                  const isSelected = intake.styleVibe === vibe.id && !intake.selectedDemo;
                  return (
                    <button
                      key={vibe.id}
                      onClick={() => setIntake(prev => ({ ...prev, styleVibe: vibe.id, selectedDemo: "" }))}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${vibe.color} ${
                        isSelected 
                          ? "ring-2 ring-primary ring-offset-2" 
                          : "hover:ring-1 hover:ring-muted-foreground/30"
                      }`}
                    >
                      <div className="font-medium">{vibe.label}</div>
                      <div className={`text-sm ${vibe.id === 'bold' ? 'text-zinc-400' : 'text-muted-foreground'}`}>
                        {vibe.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color preset */}
            <div className="space-y-3">
              <Label>Color direction</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = intake.colorPreset === preset.id && !intake.selectedDemo;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setIntake(prev => ({ ...prev, colorPreset: preset.id, selectedDemo: "" }))}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex gap-1 mb-2">
                        {preset.colors.map((color, i) => (
                          <div 
                            key={i} 
                            className="w-5 h-5 rounded-full border border-border/50" 
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="font-medium text-sm">{preset.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inspiration links (optional) */}
            <div className="space-y-2">
              <Label htmlFor="inspiration">Any websites you like? (optional)</Label>
              <Input
                id="inspiration"
                placeholder="Paste links or describe what you like"
                value={intake.inspirationLinks}
                onChange={(e) => setIntake(prev => ({ ...prev, inspirationLinks: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                We'll use these as inspiration for your design.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Functionality checkboxes */}
            <div className="space-y-3">
              <Label>What should this website help you do?</Label>
              <div className="space-y-3">
                {FUNCTIONALITY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isChecked = intake.functionality.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleFunctionality(option.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${
                        isChecked 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <Checkbox checked={isChecked} className="pointer-events-none" />
                      <Icon className={`h-5 w-5 ${isChecked ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-medium text-sm">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                We'll recommend the best setup for your selections.
              </p>
            </div>

            {/* Hours */}
            <div className="space-y-3">
              <Label>Your business hours</Label>
              <RadioGroup
                value={intake.hoursType}
                onValueChange={(value) => setIntake(prev => ({ ...prev, hoursType: value }))}
                className="space-y-2"
              >
                {HOURS_OPTIONS.map((option) => (
                  <div key={option.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.id} id={`hours-${option.id}`} />
                    <Label htmlFor={`hours-${option.id}`} className="cursor-pointer">{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Business</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{intake.businessName || "—"}</p>
                  <p className="text-sm text-muted-foreground">
                    {BUSINESS_TYPES.find(t => t.id === intake.businessType)?.label || "—"}
                    {intake.goals.length > 0 && ` · ${intake.goals.map(g => GOALS.find(goal => goal.id === g)?.label).filter(Boolean).join(", ")}`}
                  </p>
                  {intake.timeline && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Timeline: {TIMELINE_OPTIONS.find(t => t.id === intake.timeline)?.label || intake.timeline}
                    </p>
                  )}
                  {intake.hasWebsite && intake.websiteUrl && (
                    <p className="text-xs text-muted-foreground">
                      Current site: {intake.websiteUrl}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Style</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">
                    {STYLE_VIBES.find(v => v.id === intake.styleVibe)?.label || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {COLOR_PRESETS.find(c => c.id === intake.colorPreset)?.label || "—"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {intake.functionality.map((f) => (
                      <li key={f} className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        {FUNCTIONALITY_OPTIONS.find(opt => opt.id === f)?.label}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    Hours: {HOURS_OPTIONS.find(h => h.id === intake.hoursType)?.label || "—"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Process timeline */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">What happens next</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { step: 1, label: "Intake complete", done: true },
                    { step: 2, label: "Draft design + workflow plan", done: false },
                    { step: 3, label: "Review & edits", done: false },
                    { step: 4, label: "Launch", done: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        item.done 
                          ? "bg-accent text-accent-foreground" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {item.done ? <CheckCircle2 className="h-4 w-4" /> : item.step}
                      </div>
                      <span className={item.done ? "font-medium" : "text-muted-foreground"}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  We'll create your first draft and message you here when it's ready.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  // Show confirmation screen after successful submission
  if (submittedProject) {
    return (
      <IntakeSubmittedScreen
        businessName={submittedProject.businessName}
        projectToken={submittedProject.projectToken}
      />
    );
  }

  return (
    <ClientLayout hideHeader maxWidth="5xl">
      {/* Custom wizard header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
            Pleasant Cove
          </Link>
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>
      </header>

      {/* Progress section with branded gradient */}
      <div className="bg-gradient-to-b from-accent/5 to-background border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={handleBack}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 0 ? "Back to portal" : "Back"}
            </button>
          </div>
          
          {/* Progress bar */}
          <Progress value={stepProgress} className="h-1.5" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStep;
              const isComplete = i < currentStep;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    isActive 
                      ? "text-accent font-medium" 
                      : isComplete 
                        ? "text-accent/70" 
                        : "text-muted-foreground"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : isComplete 
                        ? "bg-accent/20 text-accent" 
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {isComplete ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-xl mx-auto">
          <div className="mb-6">
            <h1 className="font-serif text-2xl font-bold mb-1">
              {currentStep === 0 && "Let's set up your project"}
              {currentStep === 1 && "Style & vibe"}
              {currentStep === 2 && "How it should work"}
              {currentStep === 3 && "Review & start"}
            </h1>
            <p className="text-muted-foreground">
              {currentStep === 0 && "This takes about 5 minutes. You can change anything later."}
              {currentStep === 1 && "Pick what feels right. We'll refine it together."}
              {currentStep === 2 && "Select the features you need."}
              {currentStep === 3 && "Make sure everything looks good."}
            </p>
          </div>

          {renderStep()}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleCreateProject} disabled={loading || !canProceed()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start my project
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </ClientLayout>
  );
}
