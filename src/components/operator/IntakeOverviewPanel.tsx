import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Target, 
  Palette, 
  Cog, 
  MapPin, 
  Globe, 
  Clock,
  FileText,
  Sparkles
} from "lucide-react";

interface IntakeData {
  businessName?: string;
  businessType?: string;
  goals?: string[];
  hasWebsite?: boolean;
  websiteUrl?: string;
  timeline?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  serviceArea?: string;
  styleVibe?: string;
  colorPreset?: string;
  inspirationLinks?: string;
  functionality?: string[];
  hoursType?: string;
  selectedDemo?: string;
  notes?: string;
}

interface IntakeOverviewPanelProps {
  intake: IntakeData | null | undefined;
  intakeCreatedAt?: string;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  services: "Services",
  trades: "Trades",
  retail: "Local Retail",
  professional: "Professional",
  restaurant: "Restaurant / Hospitality",
  other: "Other",
};

const GOAL_LABELS: Record<string, string> = {
  calls: "Get more calls / leads",
  booking: "Online booking / scheduling",
  professional: "Improve credibility",
  reviews: "Better reviews / reputation",
  payments: "Take payments / deposits",
  automations: "Automations / follow-ups",
};

const STYLE_LABELS: Record<string, string> = {
  clean: "Clean & Modern",
  warm: "Warm & Local",
  bold: "Bold & High-End",
  simple: "Simple & Practical",
  auto: "You decide",
};

const COLOR_LABELS: Record<string, string> = {
  neutral: "Light & Neutral",
  dark: "Dark & Bold",
  blue: "Blue & Trustworthy",
  green: "Green & Natural",
  auto: "Choose for me",
};

const FUNCTIONALITY_LABELS: Record<string, string> = {
  booking: "Appointments / Booking",
  faq: "FAQ / Auto-answers",
  contact: "Contact Requests",
  afterhours: "After-Hours Handling",
  payments: "Payments / Deposits",
  simple: "Simple Info Site",
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: "ASAP",
  "1-2_weeks": "1–2 weeks",
  "30_days": "Within 30 days",
  browsing: "Just browsing",
};

const HOURS_LABELS: Record<string, string> = {
  regular: "Regular hours (9-5)",
  extended: "Extended / 24-7",
  notsure: "Not sure yet",
};

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

export function IntakeOverviewPanel({ intake, intakeCreatedAt }: IntakeOverviewPanelProps) {
  if (!intake) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
        <div className="text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No intake data</p>
          <p className="text-xs mt-1">Client hasn't completed the onboarding wizard yet.</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-5">
        {/* Intake status */}
        {intakeCreatedAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-b border-border pb-3">
            <Sparkles className="h-3 w-3" />
            Intake submitted {new Date(intakeCreatedAt).toLocaleDateString()}
          </div>
        )}

        {/* Business Snapshot */}
        <Section icon={Building2} title="Business">
          <div className="space-y-1.5 text-sm">
            {intake.businessName && (
              <p className="font-medium">{intake.businessName}</p>
            )}
            {intake.businessType && (
              <p className="text-muted-foreground">
                {BUSINESS_TYPE_LABELS[intake.businessType] || intake.businessType}
              </p>
            )}
            {intake.serviceArea && (
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {intake.serviceArea}
              </p>
            )}
            {intake.websiteUrl && (
              <a 
                href={intake.websiteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <Globe className="h-3 w-3" />
                {intake.websiteUrl}
              </a>
            )}
          </div>
        </Section>

        {/* Goals */}
        {intake.goals && intake.goals.length > 0 && (
          <Section icon={Target} title="Goals">
            <div className="flex flex-wrap gap-1.5">
              {intake.goals.map((goal) => (
                <Badge key={goal} variant="secondary" className="text-xs">
                  {GOAL_LABELS[goal] || goal}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Timeline */}
        {intake.timeline && (
          <Section icon={Clock} title="Timeline">
            <p className="text-sm">{TIMELINE_LABELS[intake.timeline] || intake.timeline}</p>
          </Section>
        )}

        {/* Style Direction */}
        {(intake.styleVibe || intake.colorPreset || intake.selectedDemo) && (
          <Section icon={Palette} title="Style Direction">
            <div className="space-y-1.5 text-sm">
              {intake.selectedDemo && (
                <p className="text-muted-foreground">Demo: {intake.selectedDemo}</p>
              )}
              {intake.styleVibe && (
                <p>{STYLE_LABELS[intake.styleVibe] || intake.styleVibe}</p>
              )}
              {intake.colorPreset && (
                <p className="text-muted-foreground">{COLOR_LABELS[intake.colorPreset] || intake.colorPreset}</p>
              )}
              {intake.inspirationLinks && (
                <p className="text-xs text-muted-foreground mt-1">{intake.inspirationLinks}</p>
              )}
            </div>
          </Section>
        )}

        {/* Functionality */}
        {intake.functionality && intake.functionality.length > 0 && (
          <Section icon={Cog} title="Functionality">
            <div className="flex flex-wrap gap-1.5">
              {intake.functionality.map((fn) => (
                <Badge key={fn} variant="outline" className="text-xs">
                  {FUNCTIONALITY_LABELS[fn] || fn}
                </Badge>
              ))}
            </div>
            {intake.hoursType && (
              <p className="text-xs text-muted-foreground mt-2">
                Hours: {HOURS_LABELS[intake.hoursType] || intake.hoursType}
              </p>
            )}
          </Section>
        )}

        {/* Notes */}
        {intake.notes && (
          <Section icon={FileText} title="Client Notes">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{intake.notes}</p>
          </Section>
        )}
      </div>
    </ScrollArea>
  );
}
