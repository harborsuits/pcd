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
  Upload,
  Palette,
  Image as ImageIcon,
  Layout,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Phone,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Phase B Data Structure
export interface PhaseBData {
  // Card 1: Brand & Identity
  logoStatus: "uploaded" | "create" | "";
  brandColors: string;
  colorPreference: "pick_for_me" | "custom" | "";
  tone: "professional" | "friendly" | "bold" | "luxury" | "";

  // Card 2: Content & Proof
  photosUploaded: number;
  tagline: string;
  socialLinks: string;

  // Card 3: Structure & Features
  pages: string[];
  primaryCta: "call" | "book" | "form" | "quote" | "";
  features: string[];

  // Card 4: Inspiration
  exampleSites: string;
  dislikes: string;
}

const DEFAULT_DATA: PhaseBData = {
  logoStatus: "",
  brandColors: "",
  colorPreference: "",
  tone: "",
  photosUploaded: 0,
  tagline: "",
  socialLinks: "",
  pages: [],
  primaryCta: "",
  features: [],
  exampleSites: "",
  dislikes: "",
};

// Options
const TONE_OPTIONS = [
  { id: "professional", label: "Professional", description: "Clean, polished, corporate" },
  { id: "friendly", label: "Friendly", description: "Warm, approachable, personal" },
  { id: "bold", label: "Bold", description: "Striking, confident, modern" },
  { id: "luxury", label: "Luxury", description: "Premium, elegant, refined" },
];

const PAGE_OPTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "contact", label: "Contact" },
  { id: "gallery", label: "Gallery / Portfolio" },
  { id: "reviews", label: "Reviews / Testimonials" },
  { id: "faq", label: "FAQ" },
  { id: "pricing", label: "Pricing" },
];

const CTA_OPTIONS = [
  { id: "call", label: "Call us" },
  { id: "book", label: "Book online" },
  { id: "form", label: "Contact form" },
  { id: "quote", label: "Get a quote" },
];

const FEATURE_OPTIONS = [
  { id: "booking", label: "Online booking / scheduling" },
  { id: "afterhours", label: "After-hours AI handling" },
  { id: "reviews", label: "Reviews display" },
  { id: "payments", label: "Online payments" },
  { id: "chat", label: "Live chat" },
  { id: "forms", label: "Custom forms" },
];

interface CardProps {
  title: string;
  icon: React.ReactNode;
  isComplete: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function IntakeCard({ title, icon, isComplete, isExpanded, onToggle, children }: CardProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
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

  // Check card completion status
  const isCard1Complete = (data.logoStatus === "uploaded" || data.logoStatus === "create") && !!data.tone;
  const isCard2Complete = data.photosUploaded >= 3;
  const isCard3Complete = data.pages.length >= 1 && !!data.primaryCta;
  const isCard4Complete = !!data.exampleSites.trim();

  const completedCards = [isCard1Complete, isCard2Complete, isCard3Complete, isCard4Complete].filter(Boolean).length;
  const allComplete = completedCards === 4;
  const progressPercent = (completedCards / 4) * 100;

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
      const timeout = setTimeout(() => saveData(newData), 1000);
      return newData;
    });
  }, [onDataChange, saveData]);

  const toggleArrayItem = (field: "pages" | "features", id: string) => {
    setData(prev => {
      const arr = prev[field] as string[];
      const newArr = arr.includes(id) ? arr.filter(item => item !== id) : [...arr, id];
      const newData = { ...prev, [field]: newArr };
      onDataChange?.(newData);
      setTimeout(() => saveData(newData), 1000);
      return newData;
    });
  };

  const handleSubmit = async () => {
    if (!allComplete) return;
    
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
        <h2 className="font-serif text-xl font-bold">Let's prepare your first draft</h2>
        <p className="text-sm text-muted-foreground">
          Complete these sections so we can start designing. You can do them in any order.
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {completedCards} of 4 sections complete
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
                className="flex gap-4"
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

            {/* Tone */}
            <div className="space-y-2">
              <Label>What tone fits your brand?</Label>
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
          </div>
        </IntakeCard>

        {/* Card 2: Content & Proof */}
        <IntakeCard
          title="Content & Proof"
          icon={<ImageIcon className="h-4 w-4" />}
          isComplete={isCard2Complete}
          isExpanded={expandedCard === 1}
          onToggle={() => setExpandedCard(expandedCard === 1 ? null : 1)}
        >
          <div className="space-y-4 pt-4">
            {/* Photos status */}
            <div className="space-y-2">
              <Label>Photos of your work, team, or space</Label>
              <div className={cn(
                "p-3 rounded-lg border",
                data.photosUploaded >= 3 ? "border-green-500/30 bg-green-500/5" : "border-border bg-muted/30"
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {data.photosUploaded} photo{data.photosUploaded !== 1 ? "s" : ""} uploaded
                  </span>
                  {data.photosUploaded >= 3 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Need at least 3</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload photos using the Files section below. We'll use them in your design.
              </p>
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline or short description (optional)</Label>
              <Input
                id="tagline"
                placeholder="e.g. Your trusted local plumber since 1985"
                value={data.tagline}
                onChange={(e) => updateData({ tagline: e.target.value })}
              />
            </div>

            {/* Social links */}
            <div className="space-y-2">
              <Label htmlFor="social">Social media links (optional)</Label>
              <Textarea
                id="social"
                placeholder="Facebook, Instagram, LinkedIn URLs..."
                value={data.socialLinks}
                onChange={(e) => updateData({ socialLinks: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        </IntakeCard>

        {/* Card 3: Structure & Features */}
        <IntakeCard
          title="Structure & Features"
          icon={<Layout className="h-4 w-4" />}
          isComplete={isCard3Complete}
          isExpanded={expandedCard === 2}
          onToggle={() => setExpandedCard(expandedCard === 2 ? null : 2)}
        >
          <div className="space-y-4 pt-4">
            {/* Pages */}
            <div className="space-y-2">
              <Label>What pages do you need?</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAGE_OPTIONS.map((opt) => {
                  const isChecked = data.pages.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleArrayItem("pages", opt.id)}
                      className={cn(
                        "p-2 rounded-lg border-2 text-left transition-all flex items-center gap-2",
                        isChecked
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <Checkbox checked={isChecked} className="pointer-events-none" />
                      <span className="text-sm">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary CTA */}
            <div className="space-y-2">
              <Label>What's the main action visitors should take?</Label>
              <RadioGroup
                value={data.primaryCta}
                onValueChange={(v) => updateData({ primaryCta: v as PhaseBData["primaryCta"] })}
                className="grid grid-cols-2 gap-2"
              >
                {CTA_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded-lg border-2 cursor-pointer transition-all",
                      data.primaryCta === opt.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                    onClick={() => updateData({ primaryCta: opt.id as PhaseBData["primaryCta"] })}
                  >
                    <RadioGroupItem value={opt.id} id={`cta-${opt.id}`} />
                    <Label htmlFor={`cta-${opt.id}`} className="cursor-pointer text-sm flex-1">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label>Any special features? (optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {FEATURE_OPTIONS.map((opt) => {
                  const isChecked = data.features.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleArrayItem("features", opt.id)}
                      className={cn(
                        "p-2 rounded-lg border-2 text-left transition-all flex items-center gap-2",
                        isChecked
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <Checkbox checked={isChecked} className="pointer-events-none" />
                      <span className="text-sm">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </IntakeCard>

        {/* Card 4: Inspiration */}
        <IntakeCard
          title="Inspiration & Direction"
          icon={<Sparkles className="h-4 w-4" />}
          isComplete={isCard4Complete}
          isExpanded={expandedCard === 3}
          onToggle={() => setExpandedCard(expandedCard === 3 ? null : 3)}
        >
          <div className="space-y-4 pt-4">
            {/* Example sites */}
            <div className="space-y-2">
              <Label htmlFor="examples">Share 1–3 websites you like</Label>
              <Textarea
                id="examples"
                placeholder="Paste URLs of sites you like the look/feel of..."
                value={data.exampleSites}
                onChange={(e) => updateData({ exampleSites: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                These don't need to be in your industry — we're looking for style inspiration.
              </p>
            </div>

            {/* Dislikes */}
            <div className="space-y-2">
              <Label htmlFor="dislikes">Anything you DON'T want? (optional)</Label>
              <Textarea
                id="dislikes"
                placeholder="e.g. No stock photos, no dark mode, no autoplay videos..."
                value={data.dislikes}
                onChange={(e) => updateData({ dislikes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        </IntakeCard>
      </div>

      {/* Submit Button */}
      {allComplete ? (
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
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Complete all 4 sections above to unlock your first draft.</span>
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
