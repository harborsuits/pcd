import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
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
  Sparkles,
  Target,
  Timer,
  Package,
  DollarSign,
  FileText,
  Bot,
  Zap,
  AlertTriangle
} from "lucide-react";
import { IntakeSubmittedScreen } from "@/components/portal/IntakeSubmittedScreen";
import { ClientLayout } from "@/components/portal/ClientLayout";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Step definitions - 8 steps matching the revised intake
const STEPS = [
  { id: "basics", label: "Basics", icon: Building2 },
  { id: "intent", label: "Intent", icon: Target },
  { id: "timeline", label: "Timeline", icon: Timer },
  { id: "readiness", label: "Readiness", icon: Package },
  { id: "style", label: "Style", icon: Palette },
  { id: "functionality", label: "Features", icon: Cog },
  { id: "budget", label: "Budget", icon: DollarSign },
  { id: "review", label: "Review", icon: CheckCircle2 },
];

// Business types
const BUSINESS_TYPES = [
  { id: "trades", label: "Trades", icon: Wrench, description: "Plumbing, HVAC, electrical, roofing" },
  { id: "professional", label: "Professional services", icon: Briefcase, description: "Law, accounting, consulting" },
  { id: "retail", label: "Retail / e-commerce", icon: Store, description: "Shops, boutiques, online sales" },
  { id: "restaurant", label: "Restaurant / hospitality", icon: Utensils, description: "Food, bars, hotels, events" },
  { id: "creative", label: "Creative / media", icon: Sparkles, description: "Design, photography, marketing" },
  { id: "other", label: "Other", icon: Users, description: "Something else" },
];

// Primary goals (multi-select)
const GOALS = [
  { id: "calls", label: "Get more phone calls" },
  { id: "booking", label: "Online booking / scheduling" },
  { id: "professional", label: "Improve credibility / look professional" },
  { id: "sell", label: "Sell products or services online" },
  { id: "automate", label: "Automate inquiries or follow-ups" },
  { id: "unsure", label: "Not sure yet" },
];

// Website status
const WEBSITE_STATUS = [
  { id: "new", label: "Brand new website" },
  { id: "redesign", label: "Redesigning an existing site" },
  { id: "adding", label: "Adding features to an existing site" },
];

// Timeline options - realistic with rush pricing warning
const TIMELINE_OPTIONS = [
  { id: "standard", label: "Standard (recommended): 4–6 weeks", description: "Best quality, best price" },
  { id: "flexible", label: "Flexible: 6–8+ weeks", description: "No rush, lower priority" },
  { id: "rush", label: "Express / Rush: 2–3 weeks", description: "Limited availability, higher cost", warning: true },
  { id: "exploring", label: "Just exploring / no set timeline", description: "Planning ahead" },
];

// Readiness assets
const READINESS_ASSETS = [
  { id: "logo", label: "Logo" },
  { id: "colors", label: "Brand colors" },
  { id: "photos", label: "Photos / images" },
  { id: "content", label: "Written content" },
  { id: "none", label: "None of the above / need help" },
];

// Style vibes
const STYLE_VIBES = [
  { id: "clean", label: "Clean & modern", description: "Minimal, crisp, professional", color: "bg-slate-100 border-slate-300" },
  { id: "warm", label: "Warm & local", description: "Friendly, approachable, cozy", color: "bg-amber-50 border-amber-200" },
  { id: "bold", label: "Bold & high-end", description: "Premium, confident, striking", color: "bg-zinc-900 text-white border-zinc-700" },
  { id: "simple", label: "Simple & practical", description: "No-frills, clear, functional", color: "bg-gray-50 border-gray-300" },
  { id: "auto", label: "You decide for me", description: "We'll pick based on your industry", color: "bg-accent/20 border-accent" },
];

// Curated demo style gallery
const STYLE_DEMOS = [
  { id: "clean-contractor", title: "Clean Contractor", subtitle: "Modern trades look", styleVibe: "clean" },
  { id: "warm-local", title: "Warm & Local", subtitle: "Friendly neighborhood feel", styleVibe: "warm" },
  { id: "bold-pro", title: "Bold Professional", subtitle: "Premium high-end vibe", styleVibe: "bold" },
  { id: "simple-service", title: "Simple Service", subtitle: "No-frills & trustworthy", styleVibe: "simple" },
];

// Functionality options - including AI Receptionist tiers
const FUNCTIONALITY_OPTIONS = [
  { id: "contact", label: "Contact form", icon: MessageSquare },
  { id: "booking", label: "Online booking / appointments", icon: Calendar },
  { id: "faq", label: "FAQ / information pages", icon: HelpCircle },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "afterhours", label: "After-hours handling", icon: Clock },
  { id: "ai_basic", label: "AI Receptionist – Basic", icon: Bot, description: "Auto-replies + missed call follow-up + basic routing" },
  { id: "ai_diligent", label: "AI Receptionist – Diligent", icon: Zap, description: "Smarter handling + qualifying questions + follow-ups + escalation rules" },
  { id: "simple", label: "Simple informational site", icon: Building2 },
  { id: "unsure", label: "Not sure yet", icon: HelpCircle },
];

// Hours options
const HOURS_OPTIONS = [
  { id: "regular", label: "Regular hours (e.g. 9–5)" },
  { id: "extended", label: "Extended / evenings / weekends" },
  { id: "24_7", label: "24/7" },
  { id: "notsure", label: "Not sure" },
];

// Budget ranges
const BUDGET_RANGES = [
  { id: "under_1500", label: "Under $1,500" },
  { id: "1500_3000", label: "$1,500 – $3,000" },
  { id: "3000_6000", label: "$3,000 – $6,000" },
  { id: "6000_plus", label: "$6,000+" },
  { id: "guidance", label: "Not sure — need guidance" },
];

interface IntakeData {
  // Step 1: Basics
  businessName: string;
  businessType: string;
  serviceArea: string;
  contactEmail: string;
  contactPhone: string;
  
  // Step 2: Intent
  goals: string[];
  websiteStatus: string;
  hasWebsite: boolean;
  websiteUrl: string;
  
  // Step 3: Timeline
  timeline: string;
  
  // Step 4: Readiness
  readinessAssets: string[];
  
  // Step 5: Style
  styleVibe: string;
  selectedDemo: string;
  inspirationLinks: string;
  
  // Step 6: Functionality
  functionality: string[];
  hoursType: string;
  
  // Step 7: Budget
  budgetRange: string;
  
  // Step 8: Notes
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
    serviceArea: "",
    contactEmail: "",
    contactPhone: "",
    goals: [],
    websiteStatus: "",
    hasWebsite: false,
    websiteUrl: "",
    timeline: "",
    readinessAssets: [],
    styleVibe: "",
    selectedDemo: "",
    inspirationLinks: "",
    functionality: [],
    hoursType: "",
    budgetRange: "",
    notes: "",
  });

  const stepProgress = ((currentStep + 1) / STEPS.length) * 100;

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: // Basics - phone is optional to increase completions
        return !!intake.businessName && !!intake.businessType && !!intake.contactEmail;
      case 1: // Intent
        return intake.goals.length > 0 && !!intake.websiteStatus;
      case 2: // Timeline
        return !!intake.timeline;
      case 3: // Readiness
        return intake.readinessAssets.length > 0;
      case 4: // Style
        return !!intake.styleVibe || !!intake.selectedDemo;
      case 5: // Functionality
        return intake.functionality.length > 0 && !!intake.hoursType;
      case 6: // Budget
        return !!intake.budgetRange;
      case 7: // Review
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

  const toggleArrayItem = (field: keyof IntakeData, id: string) => {
    setIntake(prev => {
      const arr = prev[field] as string[];
      // Handle "none" option in readiness
      if (field === 'readinessAssets') {
        if (id === 'none') {
          return { ...prev, [field]: ['none'] };
        } else {
          return {
            ...prev,
            [field]: arr.includes(id) 
              ? arr.filter(item => item !== id)
              : [...arr.filter(item => item !== 'none'), id]
          };
        }
      }
      return {
        ...prev,
        [field]: arr.includes(id) ? arr.filter(item => item !== id) : [...arr, id],
      };
    });
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
              <Label>Business type</Label>
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
              <Label htmlFor="serviceArea">Where do you primarily serve customers?</Label>
              <Input
                id="serviceArea"
                placeholder="e.g. Dallas, TX or Greater Boston Area"
                value={intake.serviceArea}
                onChange={(e) => setIntake(prev => ({ ...prev, serviceArea: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Primary contact</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Email"
                  type="email"
                  value={intake.contactEmail}
                  onChange={(e) => setIntake(prev => ({ ...prev, contactEmail: e.target.value }))}
                />
                <Input
                  placeholder="Phone (optional)"
                  type="tel"
                  value={intake.contactPhone}
                  onChange={(e) => setIntake(prev => ({ ...prev, contactPhone: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      // STEP 2: INTENT
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>What is the primary goal of this website? (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((goal) => {
                  const isChecked = intake.goals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleArrayItem('goals', goal.id)}
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

            <div className="space-y-3">
              <Label>Is this a new website or a redesign?</Label>
              <RadioGroup
                value={intake.websiteStatus}
                onValueChange={(value) => setIntake(prev => ({ 
                  ...prev, 
                  websiteStatus: value,
                  hasWebsite: value !== "new"
                }))}
                className="space-y-2"
              >
                {WEBSITE_STATUS.map((opt) => (
                  <div key={opt.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={opt.id} id={`status-${opt.id}`} />
                    <Label htmlFor={`status-${opt.id}`} className="cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {intake.hasWebsite && (
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Current website URL (optional)</Label>
                <Input
                  id="websiteUrl"
                  placeholder="https://yoursite.com"
                  value={intake.websiteUrl}
                  onChange={(e) => setIntake(prev => ({ ...prev, websiteUrl: e.target.value }))}
                />
              </div>
            )}
          </div>
        );

      // STEP 3: TIMELINE
      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
              <p>Most projects take several weeks depending on scope and availability. Faster timelines require rush pricing.</p>
              <p className="text-xs">Timelines assume your content + approvals are provided quickly. Delays in assets or feedback can extend delivery.</p>
            </div>

            <div className="space-y-3">
              <Label>When would you ideally like this project completed?</Label>
              <RadioGroup
                value={intake.timeline}
                onValueChange={(value) => setIntake(prev => ({ ...prev, timeline: value }))}
                className="space-y-3"
              >
                {TIMELINE_OPTIONS.map((opt) => (
                  <div 
                    key={opt.id} 
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all ${
                      intake.timeline === opt.id 
                        ? opt.warning ? "border-warning bg-warning/5" : "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <RadioGroupItem value={opt.id} id={`timeline-${opt.id}`} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={`timeline-${opt.id}`} className="cursor-pointer flex items-center gap-2">
                        {opt.label}
                        {opt.warning && <AlertTriangle className="h-4 w-4 text-warning" />}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {intake.timeline === 'rush' && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Rush projects typically require 50% higher pricing</p>
                    <p className="text-muted-foreground mt-1">They also require significant upfront commitment. Availability is limited.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // STEP 4: READINESS
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Do you already have any of the following?</Label>
              <p className="text-sm text-muted-foreground">This helps us plan — it does not affect approval.</p>
              <div className="space-y-2">
                {READINESS_ASSETS.map((asset) => {
                  const isChecked = intake.readinessAssets.includes(asset.id);
                  return (
                    <button
                      key={asset.id}
                      onClick={() => toggleArrayItem('readinessAssets', asset.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${
                        isChecked 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <Checkbox checked={isChecked} className="pointer-events-none" />
                      <span className="font-medium text-sm">{asset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      // STEP 5: STYLE
      case 4:
        return (
          <div className="space-y-6">
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
                        styleVibe: demo.styleVibe,
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
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or describe a vibe</span>
              </div>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="inspiration">Any websites you like or dislike? (optional)</Label>
              <Input
                id="inspiration"
                placeholder="Paste links or describe what you like/dislike"
                value={intake.inspirationLinks}
                onChange={(e) => setIntake(prev => ({ ...prev, inspirationLinks: e.target.value }))}
              />
            </div>
          </div>
        );

      // STEP 6: FUNCTIONALITY
      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>What functionality do you think you'll need?</Label>
              <div className="space-y-3">
                {FUNCTIONALITY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isChecked = intake.functionality.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleArrayItem('functionality', option.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-start gap-3 ${
                        isChecked 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <Checkbox checked={isChecked} className="pointer-events-none mt-0.5" />
                      <Icon className={`h-5 w-5 shrink-0 ${isChecked ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="flex-1">
                        <span className="font-medium text-sm">{option.label}</span>
                        {option.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label>What are your business hours?</Label>
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

      // STEP 7: BUDGET
      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p>Most projects vary based on scope and complexity. This helps ensure we're aligned before moving forward.</p>
              <p className="mt-2 text-xs">This does not lock pricing.</p>
            </div>

            <div className="space-y-3">
              <Label>Budget comfort range</Label>
              <RadioGroup
                value={intake.budgetRange}
                onValueChange={(value) => setIntake(prev => ({ ...prev, budgetRange: value }))}
                className="space-y-2"
              >
                {BUDGET_RANGES.map((range) => (
                  <div 
                    key={range.id} 
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                      intake.budgetRange === range.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <RadioGroupItem value={range.id} id={`budget-${range.id}`} />
                    <Label htmlFor={`budget-${range.id}`} className="cursor-pointer flex-1">{range.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      // STEP 8: REVIEW & NOTES
      case 7:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Business</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{intake.businessName || "—"}</p>
                  <p className="text-sm text-muted-foreground">
                    {BUSINESS_TYPES.find(t => t.id === intake.businessType)?.label || "—"}
                    {intake.serviceArea && ` · ${intake.serviceArea}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {intake.contactEmail} · {intake.contactPhone}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Goals & Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {intake.goals.map(g => GOALS.find(goal => goal.id === g)?.label).filter(Boolean).join(", ") || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {WEBSITE_STATUS.find(s => s.id === intake.websiteStatus)?.label || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Timeline: {TIMELINE_OPTIONS.find(t => t.id === intake.timeline)?.label.split(":")[0] || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Budget: {BUDGET_RANGES.find(b => b.id === intake.budgetRange)?.label || "—"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Style</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">
                    {intake.selectedDemo 
                      ? STYLE_DEMOS.find(d => d.id === intake.selectedDemo)?.title
                      : STYLE_VIBES.find(v => v.id === intake.styleVibe)?.label || "—"}
                  </p>
                  {intake.inspirationLinks && (
                    <p className="text-xs text-muted-foreground mt-1">Inspiration: {intake.inspirationLinks}</p>
                  )}
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

            <div className="space-y-2">
              <Label htmlFor="notes">Anything else we should know before the discovery meeting? (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional context, special requirements, questions..."
                value={intake.notes}
                onChange={(e) => setIntake(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
              />
            </div>

            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">What happens next</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { step: 1, label: "Phase 1A: Intake complete", done: true },
                    { step: 2, label: "Phase 1B: Discovery meeting", done: false },
                    { step: 3, label: "Phase 2: Build & review", done: false },
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
                  We'll review your intake and reach out to schedule a discovery meeting.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

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
          
          <Progress value={stepProgress} className="h-1.5" />
          
          <div className="flex justify-between mt-3 overflow-x-auto">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStep;
              const isComplete = i < currentStep;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-1.5 text-xs transition-colors shrink-0 ${
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

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-xl mx-auto">
          <div className="mb-6">
            <h1 className="font-serif text-2xl font-bold mb-1">
              {currentStep === 0 && "Let's start with the basics"}
              {currentStep === 1 && "What are your goals?"}
              {currentStep === 2 && "Timeline expectations"}
              {currentStep === 3 && "What do you have ready?"}
              {currentStep === 4 && "Style direction"}
              {currentStep === 5 && "Features & functionality"}
              {currentStep === 6 && "Budget alignment"}
              {currentStep === 7 && "Review & submit"}
            </h1>
            <p className="text-muted-foreground">
              {currentStep === 0 && "Tell us about your business."}
              {currentStep === 1 && "What should this website help you accomplish?"}
              {currentStep === 2 && "When do you need this completed?"}
              {currentStep === 3 && "This helps us plan the project."}
              {currentStep === 4 && "Pick what feels right. We'll refine it together."}
              {currentStep === 5 && "Select the features you need."}
              {currentStep === 6 && "This helps ensure we're aligned."}
              {currentStep === 7 && "Make sure everything looks good, then add any final notes."}
            </p>
          </div>

          {renderStep()}

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
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Submit intake
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
