import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Palette,
  FileText,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Phone,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Phase B Data Structure - Updated for content-focused intake
export interface PhaseBData {
  // Card 1: Brand & Identity
  logoStatus: "uploaded" | "create" | "help" | "";
  brandColors: string;
  colorPreference: "pick_for_me" | "custom" | "";

  // Card 2: Website Content (NEW)
  businessDescription: string;
  services: string;
  serviceArea: string;
  differentiators: string;
  faq: string;
  primaryGoal: "book" | "quote" | "call" | "portfolio" | "learn" | "visit" | "";
  contentNeedsHelp: boolean;

  // Card 3: Photos & Proof
  photosPlan: "upload" | "generate" | "none" | "help" | "";
  photosUploaded: number;
  // For "generate" path
  generatedPhotoSubjects: string;
  generatedPhotoStyle: "realistic" | "studio" | "lifestyle" | "minimal" | "";
  generatedPhotoNotes: string;
  // For "none" path
  placeholderOk: boolean;
  // Other proof items
  googleReviewsLink: string;
  certifications: string;
  hasBeforeAfter: "yes" | "coming_soon" | "no" | "";

  // Card 4: Style & Preferences
  vibe: "modern" | "classic" | "luxury" | "bold" | "minimal" | "cozy" | "";
  tone: "professional" | "friendly" | "direct" | "playful" | "";
  exampleSites: string;
  mustInclude: string;
  mustAvoid: string;
  styleNeedsHelp: boolean;

  // Legacy fields (kept for backward compat, not shown in UI)
  tagline: string;
  socialLinks: string;
  pages: string[];
  primaryCta: "call" | "book" | "form" | "quote" | "";
  features: string[];
  dislikes: string;
}

const DEFAULT_DATA: PhaseBData = {
  logoStatus: "",
  brandColors: "",
  colorPreference: "",
  businessDescription: "",
  services: "",
  serviceArea: "",
  differentiators: "",
  faq: "",
  primaryGoal: "",
  contentNeedsHelp: false,
  photosPlan: "",
  photosUploaded: 0,
  generatedPhotoSubjects: "",
  generatedPhotoStyle: "",
  generatedPhotoNotes: "",
  placeholderOk: false,
  googleReviewsLink: "",
  certifications: "",
  hasBeforeAfter: "",
  vibe: "",
  tone: "",
  exampleSites: "",
  mustInclude: "",
  mustAvoid: "",
  styleNeedsHelp: false,
  // Legacy
  tagline: "",
  socialLinks: "",
  pages: [],
  primaryCta: "",
  features: [],
  dislikes: "",
};

// Options
const GOAL_OPTIONS = [
  { id: "book", label: "Book an appointment", icon: "📅" },
  { id: "quote", label: "Request a quote", icon: "💬" },
  { id: "call", label: "Call or text us", icon: "📞" },
  { id: "portfolio", label: "See our work", icon: "🖼️" },
  { id: "learn", label: "Learn about services", icon: "📖" },
  { id: "visit", label: "Visit our location", icon: "📍" },
];

const VIBE_OPTIONS = [
  { id: "modern", label: "Modern", description: "Clean lines, contemporary" },
  { id: "classic", label: "Classic", description: "Timeless, traditional" },
  { id: "luxury", label: "Luxury", description: "Premium, elegant" },
  { id: "bold", label: "Bold", description: "Striking, confident" },
  { id: "minimal", label: "Minimal", description: "Simple, uncluttered" },
  { id: "cozy", label: "Cozy", description: "Warm, inviting" },
];

const TONE_OPTIONS = [
  { id: "professional", label: "Professional", description: "Polished, corporate" },
  { id: "friendly", label: "Friendly", description: "Warm, approachable" },
  { id: "direct", label: "Direct", description: "Clear, no-nonsense" },
  { id: "playful", label: "Playful", description: "Fun, energetic" },
];

const BEFORE_AFTER_OPTIONS = [
  { id: "yes", label: "Yes, I have some" },
  { id: "coming_soon", label: "I'll add them later" },
  { id: "no", label: "Not applicable" },
];

const PHOTOS_PLAN_OPTIONS = [
  { id: "upload", label: "Yes, I'll upload them", icon: "✅" },
  { id: "generate", label: "No — create images for me", icon: "🪄" },
  { id: "none", label: "No photos for now", icon: "🚫" },
  { id: "help", label: "I'll need help with this", icon: "🤝" },
];

const GENERATED_PHOTO_STYLE_OPTIONS = [
  { id: "realistic", label: "Realistic", description: "Natural, authentic look" },
  { id: "studio", label: "Clean studio", description: "Professional product shots" },
  { id: "lifestyle", label: "Lifestyle", description: "In-context, aspirational" },
  { id: "minimal", label: "Minimal", description: "Simple, uncluttered" },
];

interface CardProps {
  title: string;
  icon: React.ReactNode;
  isComplete: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

interface CardProps {
  title: string;
  icon: React.ReactNode;
  isComplete: boolean;
  isAssisted?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function IntakeCard({ title, icon, isComplete, isAssisted, isExpanded, onToggle, children }: CardProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : isAssisted ? (
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">{icon}</span>
          <span className="font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && (
            <span className="text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
              Complete
            </span>
          )}
          {isAssisted && !isComplete && (
            <span className="text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">
              We'll help
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-border bg-muted/20">
          {children}
        </div>
      )}
    </div>
  );
}

interface PhaseBIntakeProps {
  token: string;
  initialData?: PhaseBData | null;
  filesCount: number;
  onComplete: () => void;
  onDataChange?: (data: PhaseBData) => void;
}

export function PhaseBIntake({
  token,
  initialData,
  filesCount,
  onComplete,
  onDataChange,
}: PhaseBIntakeProps) {
  // Merge initialData with defaults to ensure all fields exist
  const [data, setData] = useState<PhaseBData>(() => ({
    ...DEFAULT_DATA,
    ...(initialData || {}),
    // Ensure arrays are always arrays
    pages: initialData?.pages ?? DEFAULT_DATA.pages,
    features: initialData?.features ?? DEFAULT_DATA.features,
  }));
  const [expandedCard, setExpandedCard] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestingHelp, setRequestingHelp] = useState(false);
  const [helpRequested, setHelpRequested] = useState<"call" | "chat" | null>(null);

  // Update photos count from files
  useEffect(() => {
    setData(prev => ({ ...prev, photosUploaded: filesCount }));
  }, [filesCount]);

  // Check card completion status (includes "we'll help" as valid)
  const isCard1Complete = data.logoStatus === "uploaded" || data.logoStatus === "create";
  const isCard1Assisted = data.logoStatus === "help";
  
  const isCard2Complete = !!data.businessDescription.trim() && !!data.services.trim() && !!data.primaryGoal;
  const isCard2Assisted = data.contentNeedsHelp;
  
  // Card 3 completion depends on the photos plan
  const isCard3Complete = (() => {
    if (data.photosPlan === "upload") return data.photosUploaded >= 3;
    if (data.photosPlan === "generate") return !!data.generatedPhotoSubjects.trim() && !!data.generatedPhotoStyle;
    if (data.photosPlan === "none") return data.placeholderOk === true;
    return false;
  })();
  const isCard3Assisted = data.photosPlan === "help";
  
  const isCard4Complete = !!data.vibe && !!data.tone;
  const isCard4Assisted = data.styleNeedsHelp;

  // Count complete OR assisted cards
  const cardsDone = [
    isCard1Complete || isCard1Assisted,
    isCard2Complete || isCard2Assisted,
    isCard3Complete || isCard3Assisted,
    isCard4Complete || isCard4Assisted
  ].filter(Boolean).length;
  
  const allReady = cardsDone === 4;
  const progressPercent = (cardsDone / 4) * 100;

  // Auto-save on data change (debounced)
  const saveData = useCallback(async (newData: PhaseBData) => {
    setSaving(true);
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/portal/${token}/phase-b`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ data: newData, action: "save" }),
      });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }, [token]);

  // Update data with auto-save
  const updateData = useCallback((updates: Partial<PhaseBData>) => {
    setData(prev => {
      const newData = { ...prev, ...updates };
      onDataChange?.(newData);
      // Debounce save
      setTimeout(() => saveData(newData), 1000);
      return newData;
    });
  }, [onDataChange, saveData]);

  const handleSubmit = async () => {
    if (!allReady) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${token}/phase-b`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ data, action: "complete" }),
      });

      const result = await res.json();
      if (res.ok && result.ok) {
        toast({
          title: "Ready to build!",
          description: "We have everything we need. Your first draft is on its way!",
        });
        onComplete();
      } else {
        toast({
          title: "Error",
          description: result.error || "Could not submit. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast({
        title: "Error",
        description: "Could not submit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpRequest = async (type: "call" | "chat") => {
    setRequestingHelp(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${token}/help-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ type }),
      });

      const result = await res.json();
      if (res.ok && result.ok) {
        setHelpRequested(type);
        toast({
          title: type === "call" ? "Call requested!" : "We'll be in touch",
          description: type === "call" 
            ? "We'll reach out within 1 business day to schedule a quick call."
            : "Check your messages — we'll respond shortly.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Could not submit request. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Help request error:", err);
      toast({
        title: "Error",
        description: "Could not submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRequestingHelp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="font-serif text-xl font-bold">Let's get what we need</h2>
        <p className="text-sm text-muted-foreground">
          We'll build the first version using what you provide here.
          <br />
          <span className="text-foreground/70">You can do this all at once or come back later.</span>
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {cardsDone} of 4 sections ready
          </span>
          {saving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving...
            </span>
          )}
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {/* Card 1: Brand & Identity */}
        <IntakeCard
          title="Brand & Identity"
          icon={<Palette className="h-4 w-4" />}
          isComplete={isCard1Complete}
          isAssisted={isCard1Assisted}
          isExpanded={expandedCard === 0}
          onToggle={() => setExpandedCard(expandedCard === 0 ? null : 0)}
        >
          <div className="space-y-4 pt-4">
            {/* Logo status */}
            <div className="space-y-2">
              <Label>Do you have a logo?</Label>
              <RadioGroup
                value={data.logoStatus}
                onValueChange={(v) => updateData({ logoStatus: v as PhaseBData["logoStatus"] })}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="uploaded" id="logo-have" />
                  <Label htmlFor="logo-have" className="cursor-pointer text-sm">
                    Yes, I'll upload it
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="create" id="logo-create" />
                  <Label htmlFor="logo-create" className="cursor-pointer text-sm">
                    No, create one for me
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="help" id="logo-help" />
                  <Label htmlFor="logo-help" className="cursor-pointer text-sm text-blue-600">
                    I'll need help with this
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Color preference */}
            <div className="space-y-2">
              <Label>Brand colors</Label>
              <RadioGroup
                value={data.colorPreference}
                onValueChange={(v) => updateData({ colorPreference: v as PhaseBData["colorPreference"] })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pick_for_me" id="colors-pick" />
                  <Label htmlFor="colors-pick" className="cursor-pointer text-sm">
                    Pick for me
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="colors-custom" />
                  <Label htmlFor="colors-custom" className="cursor-pointer text-sm">
                    I have specific colors
                  </Label>
                </div>
              </RadioGroup>
              {data.colorPreference === "custom" && (
                <Input
                  placeholder="e.g. Navy blue, gold accents"
                  value={data.brandColors}
                  onChange={(e) => updateData({ brandColors: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>
          </div>
        </IntakeCard>

        {/* Card 2: Website Content (NEW) */}
        <IntakeCard
          title="Website Content"
          icon={<FileText className="h-4 w-4" />}
          isComplete={isCard2Complete}
          isAssisted={isCard2Assisted}
          isExpanded={expandedCard === 1}
          onToggle={() => setExpandedCard(expandedCard === 1 ? null : 1)}
        >
          <div className="space-y-4 pt-4">
            {/* Need help toggle */}
            {!isCard2Complete && (
              <div className="flex items-start space-x-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <Checkbox
                  id="content-help"
                  checked={data.contentNeedsHelp}
                  onCheckedChange={(checked) => updateData({ contentNeedsHelp: checked === true })}
                />
                <div className="grid gap-1 leading-none">
                  <Label htmlFor="content-help" className="cursor-pointer text-sm text-blue-700 dark:text-blue-400">
                    I'll need help writing this
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    We'll draft content based on your business — you can review and edit later.
                  </p>
                </div>
              </div>
            )}

            {/* Primary goal */}
            <div className="space-y-2">
              <Label>What should visitors do on your website?</Label>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_OPTIONS.map((opt) => {
                  const isSelected = data.primaryGoal === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => updateData({ primaryGoal: opt.id as PhaseBData["primaryGoal"] })}
                      className={cn(
                        "p-3 rounded-lg border-2 text-left transition-all flex items-center gap-2",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Business description */}
            <div className="space-y-2">
              <Label htmlFor="business-desc">Describe your business in 1–2 sentences</Label>
              <Textarea
                id="business-desc"
                placeholder="e.g. We're a family-owned plumbing company serving Cape Cod for 25 years. We handle everything from leaky faucets to full bathroom remodels."
                value={data.businessDescription}
                onChange={(e) => updateData({ businessDescription: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">We'll use this for your homepage and About section.</p>
            </div>

            {/* Services */}
            <div className="space-y-2">
              <Label htmlFor="services">Top 3 services you offer</Label>
              <Textarea
                id="services"
                placeholder="1. Emergency plumbing repairs&#10;2. Water heater installation&#10;3. Bathroom remodeling"
                value={data.services}
                onChange={(e) => updateData({ services: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">A short sentence about each is even better.</p>
            </div>

            {/* Service area */}
            <div className="space-y-2">
              <Label htmlFor="service-area">Service area (optional)</Label>
              <Input
                id="service-area"
                placeholder="e.g. Cape Cod, Plymouth County, South Shore"
                value={data.serviceArea}
                onChange={(e) => updateData({ serviceArea: e.target.value })}
              />
            </div>

            {/* Differentiators */}
            <div className="space-y-2">
              <Label htmlFor="differentiators">What makes you different? (optional)</Label>
              <Textarea
                id="differentiators"
                placeholder="e.g. Family-owned since 1998, same-day service, licensed & insured"
                value={data.differentiators}
                onChange={(e) => updateData({ differentiators: e.target.value })}
                rows={2}
              />
            </div>

            {/* FAQ */}
            <div className="space-y-2">
              <Label htmlFor="faq">Common customer questions? (optional)</Label>
              <Textarea
                id="faq"
                placeholder="e.g. Do you offer financing? What areas do you serve? Are you licensed?"
                value={data.faq}
                onChange={(e) => updateData({ faq: e.target.value })}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">Great for an FAQ section.</p>
            </div>
          </div>
        </IntakeCard>

        {/* Card 3: Photos & Proof */}
        <IntakeCard
          title="Photos & Proof"
          icon={<ImageIcon className="h-4 w-4" />}
          isComplete={isCard3Complete}
          isAssisted={isCard3Assisted}
          isExpanded={expandedCard === 2}
          onToggle={() => setExpandedCard(expandedCard === 2 ? null : 2)}
        >
          <div className="space-y-4 pt-4">
            {/* Photos plan selector */}
            <div className="space-y-2">
              <Label>Do you have photos we can use?</Label>
              <div className="grid gap-2">
                {PHOTOS_PLAN_OPTIONS.map((opt) => {
                  const isSelected = data.photosPlan === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => updateData({ 
                        photosPlan: opt.id as PhaseBData["photosPlan"],
                        // Reset related fields when switching
                        placeholderOk: false,
                      })}
                      className={cn(
                        "p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Path A: Upload photos */}
            {data.photosPlan === "upload" && (
              <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border">
                <div className={cn(
                  "p-3 rounded-lg border",
                  data.photosUploaded >= 3 ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"
                )}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {data.photosUploaded} photo{data.photosUploaded !== 1 ? "s" : ""} uploaded
                    </span>
                    {data.photosUploaded >= 3 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-xs text-amber-600">Need at least 3</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload photos using the Files section below — work examples, team, space, before/after.
                </p>
              </div>
            )}

            {/* Path B: Generate images */}
            {data.photosPlan === "generate" && (
              <div className="space-y-4 p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-sm text-muted-foreground">
                  We'll create custom images for your site. Tell us what you need:
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="photo-subjects">What should the photos show?</Label>
                  <Textarea
                    id="photo-subjects"
                    placeholder="e.g. Plumbing work in progress, finished bathroom, team at work, tools & equipment"
                    value={data.generatedPhotoSubjects}
                    onChange={(e) => updateData({ generatedPhotoSubjects: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Style preference</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {GENERATED_PHOTO_STYLE_OPTIONS.map((opt) => {
                      const isSelected = data.generatedPhotoStyle === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => updateData({ generatedPhotoStyle: opt.id as PhaseBData["generatedPhotoStyle"] })}
                          className={cn(
                            "p-2 rounded-lg border-2 text-left transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo-notes">Any must-include or avoid? (optional)</Label>
                  <Input
                    id="photo-notes"
                    placeholder="e.g. Use blue tones, no faces, modern equipment"
                    value={data.generatedPhotoNotes}
                    onChange={(e) => updateData({ generatedPhotoNotes: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Path C: No photos */}
            {data.photosPlan === "none" && (
              <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-sm text-muted-foreground">
                  No problem! We'll use clean placeholder imagery for your first draft.
                </p>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="placeholder-ok"
                    checked={data.placeholderOk}
                    onCheckedChange={(checked) => updateData({ placeholderOk: checked === true })}
                  />
                  <div className="grid gap-1 leading-none">
                    <Label htmlFor="placeholder-ok" className="cursor-pointer text-sm">
                      Use placeholder imagery for now
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      You can send real photos anytime and we'll swap them in.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Path D: Need help */}
            {data.photosPlan === "help" && (
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  No worries — we'll reach out to discuss options and help you get what you need.
                </p>
              </div>
            )}
            {data.photosPlan && (
              <div className="border-t border-border pt-4 space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trust signals (optional)</p>
                
                {/* Google Reviews */}
                <div className="space-y-2">
                  <Label htmlFor="google-reviews">Google Reviews link</Label>
                  <Input
                    id="google-reviews"
                    placeholder="https://g.page/your-business/review or leave blank"
                    value={data.googleReviewsLink}
                    onChange={(e) => updateData({ googleReviewsLink: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">We can display your reviews on your site.</p>
                </div>

                {/* Certifications */}
                <div className="space-y-2">
                  <Label htmlFor="certifications">Licenses, insurance, certifications?</Label>
                  <Input
                    id="certifications"
                    placeholder="e.g. Licensed & Insured, EPA Certified, BBB A+"
                    value={data.certifications}
                    onChange={(e) => updateData({ certifications: e.target.value })}
                  />
                </div>

                {/* Before/After */}
                <div className="space-y-2">
                  <Label>Before & after photos?</Label>
                  <RadioGroup
                    value={data.hasBeforeAfter}
                    onValueChange={(v) => updateData({ hasBeforeAfter: v as PhaseBData["hasBeforeAfter"] })}
                    className="flex flex-wrap gap-3"
                  >
                    {BEFORE_AFTER_OPTIONS.map((opt) => (
                      <div key={opt.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt.id} id={`ba-${opt.id}`} />
                        <Label htmlFor={`ba-${opt.id}`} className="cursor-pointer text-sm">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}
          </div>
        </IntakeCard>

        {/* Card 4: Style & Preferences */}
        <IntakeCard
          title="Style & Preferences"
          icon={<Sparkles className="h-4 w-4" />}
          isComplete={isCard4Complete}
          isAssisted={isCard4Assisted}
          isExpanded={expandedCard === 3}
          onToggle={() => setExpandedCard(expandedCard === 3 ? null : 3)}
        >
          <div className="space-y-4 pt-4">
            {/* Need help toggle */}
            {!isCard4Complete && (
              <div className="flex items-start space-x-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <Checkbox
                  id="style-help"
                  checked={data.styleNeedsHelp}
                  onCheckedChange={(checked) => updateData({ styleNeedsHelp: checked === true })}
                />
                <div className="grid gap-1 leading-none">
                  <Label htmlFor="style-help" className="cursor-pointer text-sm text-blue-700 dark:text-blue-400">
                    Just pick something good for me
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    We'll choose a style that fits your industry and brand.
                  </p>
                </div>
              </div>
            )}

            {/* Vibe */}
            <div className="space-y-2">
              <Label>Pick a vibe</Label>
              <div className="grid grid-cols-3 gap-2">
                {VIBE_OPTIONS.map((opt) => {
                  const isSelected = data.vibe === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => updateData({ vibe: opt.id as PhaseBData["vibe"] })}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <Label>Pick a tone</Label>
              <div className="grid grid-cols-2 gap-2">
                {TONE_OPTIONS.map((opt) => {
                  const isSelected = data.tone === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => updateData({ tone: opt.id as PhaseBData["tone"] })}
                      className={cn(
                        "p-3 rounded-lg border-2 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Example sites */}
            <div className="space-y-2">
              <Label htmlFor="examples">Sites you like (optional)</Label>
              <Textarea
                id="examples"
                placeholder="Paste URLs of sites you like the look/feel of..."
                value={data.exampleSites}
                onChange={(e) => updateData({ exampleSites: e.target.value })}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                These don't need to be in your industry — we're looking for style inspiration.
              </p>
            </div>

            {/* Must include */}
            <div className="space-y-2">
              <Label htmlFor="must-include">We must include... (optional)</Label>
              <Input
                id="must-include"
                placeholder="e.g. Phone number in header, emergency service callout"
                value={data.mustInclude}
                onChange={(e) => updateData({ mustInclude: e.target.value })}
              />
            </div>

            {/* Must avoid */}
            <div className="space-y-2">
              <Label htmlFor="must-avoid">Please avoid... (optional)</Label>
              <Input
                id="must-avoid"
                placeholder="e.g. Stock photos, dark backgrounds, autoplay video"
                value={data.mustAvoid}
                onChange={(e) => updateData({ mustAvoid: e.target.value })}
              />
            </div>
          </div>
        </IntakeCard>
      </div>

      {/* Submit Button */}
      {allReady ? (
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Start building my first draft
            </>
          )}
        </Button>
      ) : (
        <div className="p-4 rounded-lg bg-muted/30 border border-border text-sm text-center">
          <p className="text-muted-foreground">
            Fill in or mark "we'll help" on each section above to continue.
          </p>
        </div>
      )}

      {/* Need Help Section */}
      <div className="border-t border-border pt-4 mt-2">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Need help?</span>
        </div>
        
        {helpRequested ? (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {helpRequested === "call" 
                  ? "Call request sent — we'll reach out soon!" 
                  : "Question received — check your messages for a response."}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={requestingHelp}
              onClick={() => handleHelpRequest("call")}
            >
              {requestingHelp ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Phone className="h-4 w-4 mr-2" />
              )}
              Request a quick call
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={requestingHelp}
              onClick={() => handleHelpRequest("chat")}
            >
              {requestingHelp ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              Ask in chat
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Most clients complete this in 10–15 minutes. We're here if you get stuck.
        </p>
      </div>
    </div>
  );
}
