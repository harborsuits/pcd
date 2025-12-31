import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Palette, 
  FileText, 
  Camera, 
  Brush,
  CheckCircle2,
  Circle,
  Link2,
  Award,
  ImagePlus,
  Loader2,
  Sparkles,
  Image
} from "lucide-react";

type PhotosPlan = "upload" | "generate" | "none" | "";

interface PhaseBData {
  // Card 1: Brand & Identity
  logoStatus?: "uploaded" | "create" | "" | null;
  brandColors?: string | null;
  colorPreference?: "pick_for_me" | "custom" | "" | null;

  // Card 2: Website Content
  businessDescription?: string | null;
  services?: string | null;
  serviceArea?: string | null;
  differentiators?: string | null;
  faq?: string | null;
  primaryGoal?: "book" | "quote" | "call" | "portfolio" | "learn" | "visit" | "" | null;

  // Card 3: Photos & Proof
  photosPlan?: PhotosPlan | null;
  photosUploaded?: number | null;
  generatedPhotoSubjects?: string | null;
  generatedPhotoStyle?: "realistic" | "studio" | "lifestyle" | "minimal" | "" | null;
  generatedPhotoNotes?: string | null;
  placeholderOk?: boolean | null;
  googleReviewsLink?: string | null;
  certifications?: string | null;
  hasBeforeAfter?: "yes" | "coming_soon" | "no" | "" | null;

  // Card 4: Style & Preferences
  vibe?: "modern" | "classic" | "luxury" | "bold" | "minimal" | "cozy" | "" | null;
  tone?: "professional" | "friendly" | "direct" | "playful" | "" | null;
  exampleSites?: string | null;
  mustInclude?: string | null;
  mustAvoid?: string | null;
}

interface PhaseBOverviewPanelProps {
  phaseB: PhaseBData | null | undefined;
  phaseBStatus?: 'pending' | 'in_progress' | 'complete' | null;
  phaseBCompletedAt?: string | null;
  onGenerateImages?: () => void;
  isGenerating?: boolean;
}

function Section({ 
  icon: Icon, 
  title, 
  completed,
  children 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  completed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </div>
        {completed !== undefined && (
          completed ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground/50" />
          )
        )}
      </div>
      <div className="pl-6 text-sm">{children}</div>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  const isEmpty = value === null || value === undefined || value === "";
  return (
    <div className={className}>
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className={isEmpty ? "text-muted-foreground/50 italic" : ""}>
        {isEmpty ? "Not provided" : value}
      </div>
    </div>
  );
}

const GOAL_LABELS: Record<string, string> = {
  book: "Get bookings/appointments",
  quote: "Get quote requests",
  call: "Get phone calls",
  portfolio: "Showcase portfolio",
  learn: "Educate visitors",
  visit: "Drive store visits"
};

const VIBE_LABELS: Record<string, string> = {
  modern: "Modern & Clean",
  classic: "Classic & Traditional",
  luxury: "Luxury & Premium",
  bold: "Bold & Energetic",
  minimal: "Minimal & Simple",
  cozy: "Warm & Cozy"
};

const TONE_LABELS: Record<string, string> = {
  professional: "Professional",
  friendly: "Friendly & Approachable",
  direct: "Direct & No-nonsense",
  playful: "Playful & Fun"
};

const PHOTO_STYLE_LABELS: Record<string, string> = {
  realistic: "Realistic / Documentary",
  studio: "Studio / Polished",
  lifestyle: "Lifestyle / Action",
  minimal: "Minimal / Clean backgrounds"
};

export function PhaseBOverviewPanel({ 
  phaseB, 
  phaseBStatus, 
  phaseBCompletedAt,
  onGenerateImages,
  isGenerating
}: PhaseBOverviewPanelProps) {
  if (!phaseB && phaseBStatus !== 'in_progress' && phaseBStatus !== 'complete') {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
        <div className="text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No Phase B data</p>
          <p className="text-xs mt-1">Client hasn't started Phase 2 yet.</p>
        </div>
      </div>
    );
  }

  const data = phaseB || {};

  // Calculate section completion
  const brandComplete = !!(data.logoStatus || data.brandColors || data.colorPreference);
  const contentComplete = !!(data.businessDescription || data.services || data.primaryGoal);
  const photosComplete = !!(data.photosPlan);
  const styleComplete = !!(data.vibe || data.tone || data.exampleSites);

  const statusConfig = {
    pending: { label: "Phase 2: Not Started", variant: "outline" as const, color: "text-muted-foreground" },
    in_progress: { label: "Phase 2: In Progress", variant: "secondary" as const, color: "text-amber-600" },
    complete: { label: "Phase 2: Complete", variant: "default" as const, color: "text-green-600" },
  };

  const status = phaseBStatus || 'pending';
  const { label, variant, color } = statusConfig[status] || statusConfig.pending;

  // Can generate images if photosPlan is "generate" and we have subject info
  const canGenerateImages = data.photosPlan === "generate" && data.generatedPhotoSubjects;

  return (
    <div className="p-4 space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Badge variant={variant} className={color}>
            {status === 'complete' && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {label}
          </Badge>
          {phaseBCompletedAt && (
            <span className="text-xs text-muted-foreground">
              Completed {new Date(phaseBCompletedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Brand & Identity */}
      <Section icon={Palette} title="Brand & Identity" completed={brandComplete}>
        <div className="space-y-2">
          <Field 
            label="Logo" 
            value={
              data.logoStatus === "uploaded" ? (
                <Badge variant="secondary" className="text-xs"><Image className="h-3 w-3 mr-1" />Uploaded</Badge>
              ) : data.logoStatus === "create" ? (
                <Badge variant="outline" className="text-xs"><Sparkles className="h-3 w-3 mr-1" />Needs creation</Badge>
              ) : null
            } 
          />
          <Field 
            label="Colors" 
            value={
              data.colorPreference === "custom" && data.brandColors ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded font-mono">{data.brandColors}</span>
                </div>
              ) : data.colorPreference === "pick_for_me" ? (
                "Pick for me"
              ) : null
            } 
          />
        </div>
      </Section>

      {/* Website Content */}
      <Section icon={FileText} title="Website Content" completed={contentComplete}>
        <div className="space-y-3">
          <Field 
            label="Primary Goal" 
            value={data.primaryGoal ? (
              <Badge variant="secondary" className="text-xs">{GOAL_LABELS[data.primaryGoal] || data.primaryGoal}</Badge>
            ) : null} 
          />
          <Field label="Business Description" value={data.businessDescription} />
          <Field label="Services Offered" value={data.services} />
          <Field label="Service Area" value={data.serviceArea} />
          <Field label="What Sets You Apart" value={data.differentiators} />
          <Field label="FAQ / Common Questions" value={data.faq} />
        </div>
      </Section>

      {/* Photos & Proof */}
      <Section icon={Camera} title="Photos & Proof" completed={photosComplete}>
        <div className="space-y-3">
          {/* Photo Plan Badge */}
          <Field 
            label="Photo Plan" 
            value={
              data.photosPlan === "upload" ? (
                <Badge className="bg-blue-500/20 text-blue-700 border-blue-300">
                  <Image className="h-3 w-3 mr-1" />
                  Upload own photos {data.photosUploaded ? `(${data.photosUploaded} uploaded)` : ""}
                </Badge>
              ) : data.photosPlan === "generate" ? (
                <Badge className="bg-purple-500/20 text-purple-700 border-purple-300">
                  <ImagePlus className="h-3 w-3 mr-1" />
                  AI-generated photos
                </Badge>
              ) : data.photosPlan === "none" ? (
                <Badge variant="outline">
                  Using placeholders {data.placeholderOk ? "(OK'd)" : ""}
                </Badge>
              ) : null
            } 
          />

          {/* AI Generation Brief */}
          {data.photosPlan === "generate" && (
            <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-300/30 space-y-2">
              <p className="text-xs font-medium text-purple-700 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> AI Photo Brief
              </p>
              <Field label="What to show" value={data.generatedPhotoSubjects} />
              <Field 
                label="Style" 
                value={data.generatedPhotoStyle ? PHOTO_STYLE_LABELS[data.generatedPhotoStyle] || data.generatedPhotoStyle : null} 
              />
              <Field label="Notes" value={data.generatedPhotoNotes} />
              
              {canGenerateImages && onGenerateImages && (
                <Button 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={onGenerateImages}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Generating...</>
                  ) : (
                    <><Sparkles className="h-3 w-3 mr-1" />Generate 6 Images</>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Social Proof */}
          <div className="pt-2 border-t border-border/50 space-y-2">
            <Field 
              label="Google Reviews" 
              value={data.googleReviewsLink ? (
                <a href={data.googleReviewsLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                  <Link2 className="h-3 w-3" />View Reviews
                </a>
              ) : null} 
            />
            <Field 
              label="Certifications / Badges" 
              value={data.certifications ? (
                <span className="flex items-center gap-1"><Award className="h-3 w-3 text-amber-500" />{data.certifications}</span>
              ) : null} 
            />
            <Field 
              label="Before/After Photos" 
              value={
                data.hasBeforeAfter === "yes" ? "Has before/after photos" : 
                data.hasBeforeAfter === "coming_soon" ? "Coming soon" :
                data.hasBeforeAfter === "no" ? "N/A" : null
              } 
            />
          </div>
        </div>
      </Section>

      {/* Style & Preferences */}
      <Section icon={Brush} title="Style & Preferences" completed={styleComplete}>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {data.vibe && (
              <Badge variant="secondary" className="text-xs">{VIBE_LABELS[data.vibe] || data.vibe}</Badge>
            )}
            {data.tone && (
              <Badge variant="outline" className="text-xs">{TONE_LABELS[data.tone] || data.tone}</Badge>
            )}
          </div>
          <Field label="Example Sites They Like" value={data.exampleSites} />
          <Field label="Must Include" value={data.mustInclude} />
          <Field label="Must Avoid" value={data.mustAvoid} />
        </div>
      </Section>
    </div>
  );
}
