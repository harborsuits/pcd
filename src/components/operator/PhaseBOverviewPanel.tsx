import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Palette, 
  FileText, 
  Camera, 
  Brush,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Link2,
  Award,
  ImagePlus,
  Loader2,
  Sparkles,
  Image,
  Upload,
  FolderOpen,
  AlertCircle,
  Clock
} from "lucide-react";

type PhotosPlan = "upload" | "generate" | "none" | "";

interface PhaseBData {
  logoStatus?: "uploaded" | "create" | "" | null;
  brandColors?: string | null;
  colorPreference?: "pick_for_me" | "custom" | "" | null;
  businessDescription?: string | null;
  services?: string | null;
  serviceArea?: string | null;
  differentiators?: string | null;
  faq?: string | null;
  primaryGoal?: "book" | "quote" | "call" | "portfolio" | "learn" | "visit" | "" | null;
  photosPlan?: PhotosPlan | null;
  photosUploaded?: number | null;
  generatedPhotoSubjects?: string | null;
  generatedPhotoStyle?: "realistic" | "studio" | "lifestyle" | "minimal" | "" | null;
  generatedPhotoNotes?: string | null;
  placeholderOk?: boolean | null;
  googleReviewsLink?: string | null;
  certifications?: string | null;
  hasBeforeAfter?: "yes" | "coming_soon" | "no" | "" | null;
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
  phaseBUpdatedAt?: string | null;
  onGenerateImages?: () => void;
  isGenerating?: boolean;
  onOpenMedia?: () => void;
}

// Labels
const GOAL_LABELS: Record<string, string> = {
  book: "Book appointments",
  quote: "Quote requests",
  call: "Phone calls",
  portfolio: "Showcase work",
  learn: "Educate visitors",
  visit: "Drive visits"
};

const VIBE_LABELS: Record<string, string> = {
  modern: "Modern",
  classic: "Classic",
  luxury: "Luxury",
  bold: "Bold",
  minimal: "Minimal",
  cozy: "Cozy"
};

const TONE_LABELS: Record<string, string> = {
  professional: "Professional",
  friendly: "Friendly",
  direct: "Direct",
  playful: "Playful"
};

const PHOTO_STYLE_LABELS: Record<string, string> = {
  realistic: "Realistic",
  studio: "Studio",
  lifestyle: "Lifestyle",
  minimal: "Minimal"
};

// Truncated text with expand
function PreviewText({ text, maxLength = 120 }: { text: string | null | undefined; maxLength?: number }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!text) return <span className="text-muted-foreground/50 italic text-xs">Not provided</span>;
  
  if (text.length <= maxLength) {
    return <span className="text-sm">{text}</span>;
  }
  
  return (
    <div>
      <span className="text-sm">
        {expanded ? text : `${text.slice(0, maxLength)}...`}
      </span>
      <button 
        onClick={() => setExpanded(!expanded)}
        className="ml-1 text-xs text-primary hover:underline"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

// Accordion section
function AccordionSection({ 
  icon: Icon, 
  title, 
  complete,
  defaultOpen = false,
  children 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  complete: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {complete ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-500" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pr-2 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PhaseBOverviewPanel({ 
  phaseB, 
  phaseBStatus, 
  phaseBCompletedAt,
  phaseBUpdatedAt,
  onGenerateImages,
  isGenerating,
  onOpenMedia
}: PhaseBOverviewPanelProps) {
  // Empty state
  if (!phaseB && phaseBStatus !== 'in_progress' && phaseBStatus !== 'complete') {
    return (
      <div className="flex items-center justify-center text-muted-foreground p-6">
        <div className="text-center">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">Phase 2 not started</p>
          <p className="text-xs mt-1">Client hasn't begun detailed setup</p>
        </div>
      </div>
    );
  }

  const data = phaseB || {};

  // Section completion checks
  const brandComplete = !!(data.logoStatus || data.brandColors || data.colorPreference);
  const contentComplete = !!(data.businessDescription || data.services || data.primaryGoal);
  const photosComplete = !!(data.photosPlan);
  const styleComplete = !!(data.vibe || data.tone);
  
  const completedCount = [brandComplete, contentComplete, photosComplete, styleComplete].filter(Boolean).length;
  const missingItems: string[] = [];
  if (!brandComplete) missingItems.push("Brand");
  if (!contentComplete) missingItems.push("Content");
  if (!photosComplete) missingItems.push("Photos");
  if (!styleComplete) missingItems.push("Style");

  // Photos status
  const photosBrief = data.photosPlan === "generate" && data.generatedPhotoSubjects;
  const photosUploaded = data.photosUploaded || 0;

  return (
    <div className="p-4 space-y-3">
      {/* ===== SUMMARY HEADER ===== */}
      <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-2">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Phase 2</span>
            <Badge 
              variant={phaseBStatus === 'complete' ? 'default' : 'secondary'}
              className={phaseBStatus === 'complete' ? 'bg-green-500/20 text-green-700 border-green-300' : ''}
            >
              {phaseBStatus === 'complete' ? 'Complete' : 'In Progress'} ({completedCount}/4)
            </Badge>
          </div>
          {(phaseBUpdatedAt || phaseBCompletedAt) && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {phaseBCompletedAt 
                ? `Completed ${new Date(phaseBCompletedAt).toLocaleDateString()}`
                : phaseBUpdatedAt 
                  ? `Updated ${new Date(phaseBUpdatedAt).toLocaleDateString()}`
                  : ''
              }
            </span>
          )}
        </div>

        {/* Missing items */}
        {missingItems.length > 0 && (
          <div className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Missing: {missingItems.join(", ")}
          </div>
        )}

        {/* Key chips row */}
        <div className="flex flex-wrap gap-1.5">
          {data.primaryGoal && (
            <Badge variant="secondary" className="text-xs">
              Goal: {GOAL_LABELS[data.primaryGoal] || data.primaryGoal}
            </Badge>
          )}
          {data.vibe && (
            <Badge variant="outline" className="text-xs">
              {VIBE_LABELS[data.vibe]}
            </Badge>
          )}
          {data.tone && (
            <Badge variant="outline" className="text-xs">
              {TONE_LABELS[data.tone]}
            </Badge>
          )}
          {data.photosPlan === "upload" && (
            <Badge className="text-xs bg-blue-500/20 text-blue-700 border-blue-300">
              <Upload className="h-3 w-3 mr-1" />
              {photosUploaded > 0 ? `${photosUploaded} uploaded` : "Upload photos"}
            </Badge>
          )}
          {data.photosPlan === "generate" && (
            <Badge className="text-xs bg-purple-500/20 text-purple-700 border-purple-300">
              <Sparkles className="h-3 w-3 mr-1" />
              AI photos {photosBrief ? "✓" : ""}
            </Badge>
          )}
          {data.photosPlan === "none" && (
            <Badge variant="outline" className="text-xs">
              Placeholders {data.placeholderOk ? "OK" : ""}
            </Badge>
          )}
          {data.colorPreference === "custom" && data.brandColors && (
            <Badge variant="outline" className="text-xs font-mono">
              {data.brandColors}
            </Badge>
          )}
        </div>
      </div>

      {/* ===== ACCORDION SECTIONS ===== */}
      <div className="space-y-1 border rounded-lg divide-y">
        {/* Brand & Identity */}
        <AccordionSection icon={Palette} title="Brand & Identity" complete={brandComplete}>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs w-16">Logo:</span>
              {data.logoStatus === "uploaded" ? (
                <Badge variant="secondary" className="text-xs"><Image className="h-3 w-3 mr-1" />Uploaded</Badge>
              ) : data.logoStatus === "create" ? (
                <Badge variant="outline" className="text-xs"><Sparkles className="h-3 w-3 mr-1" />Needs creation</Badge>
              ) : (
                <span className="text-muted-foreground/50 italic text-xs">Not set</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs w-16">Colors:</span>
              {data.colorPreference === "custom" && data.brandColors ? (
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{data.brandColors}</code>
              ) : data.colorPreference === "pick_for_me" ? (
                <span className="text-xs">Pick for me</span>
              ) : (
                <span className="text-muted-foreground/50 italic text-xs">Not set</span>
              )}
            </div>
          </div>
        </AccordionSection>

        {/* Website Content */}
        <AccordionSection icon={FileText} title="Website Content" complete={contentComplete}>
          <div className="space-y-3 text-sm">
            {data.primaryGoal && (
              <div>
                <span className="text-muted-foreground text-xs">Primary Goal:</span>
                <div><Badge variant="secondary" className="text-xs mt-1">{GOAL_LABELS[data.primaryGoal]}</Badge></div>
              </div>
            )}
            <div>
              <span className="text-muted-foreground text-xs">Business Description:</span>
              <div className="mt-1"><PreviewText text={data.businessDescription} /></div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Services:</span>
              <div className="mt-1"><PreviewText text={data.services} /></div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Service Area:</span>
              <div className="mt-1"><PreviewText text={data.serviceArea} maxLength={80} /></div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">What Sets You Apart:</span>
              <div className="mt-1"><PreviewText text={data.differentiators} /></div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">FAQ:</span>
              <div className="mt-1"><PreviewText text={data.faq} /></div>
            </div>
          </div>
        </AccordionSection>

        {/* Photos & Proof */}
        <AccordionSection icon={Camera} title="Photos & Proof" complete={photosComplete}>
          <div className="space-y-3">
            {/* Photo Plan Actions */}
            {data.photosPlan === "upload" && (
              <div className="p-2 rounded bg-blue-500/10 border border-blue-300/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-700 flex items-center gap-1">
                    <Upload className="h-3 w-3" /> Client uploading photos
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {photosUploaded > 0 ? `${photosUploaded} files` : "0 files"}
                  </Badge>
                </div>
                {onOpenMedia && (
                  <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={onOpenMedia}>
                    <FolderOpen className="h-3 w-3 mr-1" />Open Media
                  </Button>
                )}
              </div>
            )}

            {data.photosPlan === "generate" && (
              <div className="p-2 rounded bg-purple-500/10 border border-purple-300/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-purple-700 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI-generated photos
                  </span>
                  <Badge variant={photosBrief ? "secondary" : "outline"} className="text-xs">
                    Brief {photosBrief ? "✓" : "missing"}
                  </Badge>
                </div>
                {photosBrief && (
                  <div className="text-xs space-y-1">
                    <div><span className="text-muted-foreground">Subjects:</span> {data.generatedPhotoSubjects}</div>
                    {data.generatedPhotoStyle && (
                      <div><span className="text-muted-foreground">Style:</span> {PHOTO_STYLE_LABELS[data.generatedPhotoStyle]}</div>
                    )}
                    {data.generatedPhotoNotes && (
                      <div><span className="text-muted-foreground">Notes:</span> {data.generatedPhotoNotes}</div>
                    )}
                  </div>
                )}
                {photosBrief && onGenerateImages && (
                  <Button 
                    size="sm" 
                    className="w-full text-xs h-7"
                    onClick={onGenerateImages}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Generating...</>
                    ) : (
                      <><ImagePlus className="h-3 w-3 mr-1" />Generate 6 Images</>
                    )}
                  </Button>
                )}
                <div className="text-xs text-muted-foreground">Generated images: 0</div>
              </div>
            )}

            {data.photosPlan === "none" && (
              <div className="p-2 rounded bg-muted/50 border border-border/50 space-y-1">
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">Using placeholders</span>
                  {data.placeholderOk && <Badge variant="outline" className="text-xs">OK'd</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">Consider asking for photos later</p>
              </div>
            )}

            {/* Social Proof */}
            <div className="pt-2 border-t space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <Link2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Reviews:</span>
                {data.googleReviewsLink ? (
                  <a href={data.googleReviewsLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    View link
                  </a>
                ) : (
                  <span className="text-muted-foreground/50 italic">None</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Certs:</span>
                {data.certifications ? (
                  <span>{data.certifications}</span>
                ) : (
                  <span className="text-muted-foreground/50 italic">None</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Image className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Before/After:</span>
                <span>
                  {data.hasBeforeAfter === "yes" ? "Yes" : 
                   data.hasBeforeAfter === "coming_soon" ? "Coming soon" :
                   data.hasBeforeAfter === "no" ? "No" : 
                   <span className="text-muted-foreground/50 italic">Not set</span>}
                </span>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Style & Preferences */}
        <AccordionSection icon={Brush} title="Style & Preferences" complete={styleComplete}>
          <div className="space-y-3 text-sm">
            {(data.vibe || data.tone) && (
              <div className="flex flex-wrap gap-1.5">
                {data.vibe && <Badge variant="secondary" className="text-xs">{VIBE_LABELS[data.vibe]}</Badge>}
                {data.tone && <Badge variant="outline" className="text-xs">{TONE_LABELS[data.tone]}</Badge>}
              </div>
            )}
            <div>
              <span className="text-muted-foreground text-xs">Example Sites:</span>
              <div className="mt-1"><PreviewText text={data.exampleSites} maxLength={100} /></div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Must Include:</span>
              <div className="mt-1"><PreviewText text={data.mustInclude} maxLength={100} /></div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Must Avoid:</span>
              <div className="mt-1"><PreviewText text={data.mustAvoid} maxLength={100} /></div>
            </div>
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}
