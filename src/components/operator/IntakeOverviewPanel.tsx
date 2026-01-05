import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Target, 
  Palette, 
  Cog, 
  MapPin, 
  Globe, 
  Clock,
  FileText,
  CheckCircle2,
  Loader2,
  DollarSign,
  Package,
  AlertTriangle
} from "lucide-react";

interface IntakeData {
  // NEW simplified wizard fields
  businessName?: string;
  businessType?: string;
  serviceArea?: string;
  contactEmail?: string;
  contactPhone?: string;
  primaryGoal?: string;
  sellType?: string;
  timeline?: string;
  deadlineDate?: string;
  readiness?: string;
  involvement?: string;
  // Legacy fields from old wizard
  goals?: string[];
  websiteStatus?: string;
  hasWebsite?: boolean;
  websiteUrl?: string;
  readinessAssets?: string[];
  styleVibe?: string;
  selectedDemo?: string;
  inspirationLinks?: string;
  functionality?: string[];
  hoursType?: string;
  budgetRange?: string;
  notes?: string;
  colorPreset?: string;
  contactName?: string;
}

interface IntakeOverviewPanelProps {
  intake: IntakeData | null | undefined;
  intakeCreatedAt?: string;
  intakeStatus?: 'draft' | 'submitted' | 'approved';
  onApproveIntake?: () => void;
  isApproving?: boolean;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  trades: "Trades",
  professional: "Professional Services",
  retail: "Retail / E-commerce",
  restaurant: "Restaurant / Hospitality",
  creative: "Creative / Media",
  services: "Services",
  other: "Other",
};

const GOAL_LABELS: Record<string, string> = {
  // New wizard goals
  leads: "Get more calls / leads",
  sell: "Sell products or services online",
  professional: "Look more professional",
  unsure: "Not sure yet — guide me",
  // Legacy goals
  calls: "Get more phone calls",
  booking: "Online booking / scheduling",
  reviews: "Better reviews",
  payments: "Take payments",
  automations: "Automations",
  automate: "Automate inquiries/follow-ups",
};

const SELL_TYPE_LABELS: Record<string, string> = {
  services: "Services",
  physical: "Physical products",
  digital: "Digital products",
  unsure: "Not sure yet",
};

const READINESS_LABELS_NEW: Record<string, string> = {
  ready: "Has everything ready",
  some: "Has some things",
  need_help: "Needs help with assets",
  unsure: "Not sure what's needed",
};

const INVOLVEMENT_LABELS: Record<string, string> = {
  hands_on: "Wants to be hands-on",
  options: "Wants curated options",
  handle_it: "Just handle it",
};

const WEBSITE_STATUS_LABELS: Record<string, string> = {
  new: "Brand new website",
  redesign: "Redesigning existing site",
  adding: "Adding features",
};

const TIMELINE_LABELS: Record<string, string> = {
  standard: "Standard: 4–6 weeks",
  flexible: "Flexible: 6–8+ weeks",
  rush: "Rush: 2–3 weeks ⚠️",
  exploring: "Just exploring",
  asap: "ASAP",
  "1-2_weeks": "1–2 weeks",
  "30_days": "Within 30 days",
  browsing: "Just browsing",
};

const READINESS_LABELS: Record<string, string> = {
  logo: "Logo",
  colors: "Brand colors",
  photos: "Photos/images",
  content: "Written content",
  none: "None / need help",
};

const STYLE_LABELS: Record<string, string> = {
  clean: "Clean & Modern",
  warm: "Warm & Local",
  bold: "Bold & High-End",
  simple: "Simple & Practical",
  auto: "You decide",
};

const FUNCTIONALITY_LABELS: Record<string, string> = {
  contact: "Contact form",
  booking: "Booking / appointments",
  faq: "FAQ pages",
  payments: "Payments",
  afterhours: "After-hours handling",
  ai_basic: "AI Receptionist – Basic",
  ai_diligent: "AI Receptionist – Diligent",
  simple: "Simple info site",
  unsure: "Not sure yet",
};

const HOURS_LABELS: Record<string, string> = {
  regular: "Regular hours (9–5)",
  extended: "Extended / evenings",
  "24_7": "24/7",
  notsure: "Not sure",
};

const BUDGET_LABELS: Record<string, string> = {
  under_1500: "Under $1,500",
  "1500_3000": "$1,500 – $3,000",
  "3000_6000": "$3,000 – $6,000",
  "6000_plus": "$6,000+",
  guidance: "Needs guidance",
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

export function IntakeOverviewPanel({ intake, intakeCreatedAt, intakeStatus, onApproveIntake, isApproving }: IntakeOverviewPanelProps) {
  if (!intake) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
        <div className="text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No intake data</p>
          <p className="text-xs mt-1">Client hasn't completed Phase 1A yet.</p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    draft: { label: "Draft", variant: "outline" as const, color: "text-muted-foreground" },
    submitted: { label: "Phase 1A: Submitted", variant: "secondary" as const, color: "text-amber-600" },
    approved: { label: "Phase 1A: Approved", variant: "default" as const, color: "text-green-600" },
  };

  const status = intakeStatus || 'submitted';
  const { label, variant, color } = statusConfig[status];

  // Detect if this is the new simplified wizard format
  const isNewFormat = !!(intake.primaryGoal && !intake.goals);

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Badge variant={variant} className={color}>
              {status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {label}
            </Badge>
            {intakeCreatedAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(intakeCreatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {status === 'submitted' && onApproveIntake && (
            <Button size="sm" onClick={onApproveIntake} disabled={isApproving}>
              {isApproving ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Approving...</>
              ) : (
                <><CheckCircle2 className="h-3 w-3 mr-1" />Approve Intake</>
              )}
            </Button>
          )}
        </div>

        <Section icon={Building2} title="Business">
          <div className="space-y-1.5 text-sm">
            {intake.businessName && <p className="font-medium">{intake.businessName}</p>}
            {intake.businessType && <p className="text-muted-foreground">{BUSINESS_TYPE_LABELS[intake.businessType] || intake.businessType}</p>}
            {intake.serviceArea && <p className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{intake.serviceArea}</p>}
            {intake.contactEmail && <p className="text-muted-foreground">{intake.contactEmail}{intake.contactPhone ? ` · ${intake.contactPhone}` : ''}</p>}
            {intake.websiteUrl && <a href={intake.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1"><Globe className="h-3 w-3" />{intake.websiteUrl}</a>}
          </div>
        </Section>

        {/* New format: Primary Goal */}
        {isNewFormat && intake.primaryGoal && (
          <Section icon={Target} title="Goal">
            <div className="space-y-2">
              <Badge variant="secondary" className="text-xs">{GOAL_LABELS[intake.primaryGoal] || intake.primaryGoal}</Badge>
              {intake.sellType && (
                <p className="text-xs text-muted-foreground">Selling: {SELL_TYPE_LABELS[intake.sellType] || intake.sellType}</p>
              )}
            </div>
          </Section>
        )}

        {/* Legacy format: Goals array */}
        {!isNewFormat && intake.goals && intake.goals.length > 0 && (
          <Section icon={Target} title="Goals">
            <div className="flex flex-wrap gap-1.5">
              {intake.goals.map((goal) => <Badge key={goal} variant="secondary" className="text-xs">{GOAL_LABELS[goal] || goal}</Badge>)}
            </div>
            {intake.websiteStatus && <p className="text-xs text-muted-foreground mt-2">{WEBSITE_STATUS_LABELS[intake.websiteStatus] || intake.websiteStatus}</p>}
          </Section>
        )}

        {intake.timeline && (
          <Section icon={Clock} title="Timeline">
            <div className="space-y-1">
              <p className={`text-sm ${intake.timeline === 'asap' ? 'text-amber-600 font-medium' : ''}`}>
                {intake.timeline === 'asap' && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                {TIMELINE_LABELS[intake.timeline] || intake.timeline}
              </p>
              {intake.deadlineDate && (
                <p className="text-xs text-muted-foreground">Deadline: {intake.deadlineDate}</p>
              )}
            </div>
          </Section>
        )}

        {intake.budgetRange && (
          <Section icon={DollarSign} title="Budget">
            <p className="text-sm font-medium">{BUDGET_LABELS[intake.budgetRange] || intake.budgetRange}</p>
          </Section>
        )}

        {/* New format: Readiness */}
        {isNewFormat && intake.readiness && (
          <Section icon={Package} title="Readiness">
            <Badge variant="outline" className="text-xs">{READINESS_LABELS_NEW[intake.readiness] || intake.readiness}</Badge>
          </Section>
        )}

        {/* Legacy format: Readiness assets */}
        {!isNewFormat && intake.readinessAssets && intake.readinessAssets.length > 0 && (
          <Section icon={Package} title="Assets Ready">
            <div className="flex flex-wrap gap-1.5">
              {intake.readinessAssets.map((asset) => <Badge key={asset} variant="outline" className="text-xs">{READINESS_LABELS[asset] || asset}</Badge>)}
            </div>
          </Section>
        )}

        {/* New format: Involvement */}
        {isNewFormat && intake.involvement && (
          <Section icon={Cog} title="Involvement">
            <Badge variant="outline" className="text-xs">{INVOLVEMENT_LABELS[intake.involvement] || intake.involvement}</Badge>
          </Section>
        )}

        {(intake.styleVibe || intake.selectedDemo) && (
          <Section icon={Palette} title="Style">
            <div className="space-y-1.5 text-sm">
              {intake.selectedDemo && <p className="text-muted-foreground">Demo: {intake.selectedDemo}</p>}
              {intake.styleVibe && <p>{STYLE_LABELS[intake.styleVibe] || intake.styleVibe}</p>}
              {intake.inspirationLinks && <p className="text-xs text-muted-foreground mt-1">{intake.inspirationLinks}</p>}
            </div>
          </Section>
        )}

        {intake.functionality && intake.functionality.length > 0 && (
          <Section icon={Cog} title="Features">
            <div className="flex flex-wrap gap-1.5">
              {intake.functionality.map((fn) => <Badge key={fn} variant="outline" className="text-xs">{FUNCTIONALITY_LABELS[fn] || fn}</Badge>)}
            </div>
            {intake.hoursType && <p className="text-xs text-muted-foreground mt-2">Hours: {HOURS_LABELS[intake.hoursType] || intake.hoursType}</p>}
          </Section>
        )}

        {intake.notes && (
          <Section icon={FileText} title="Notes">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{intake.notes}</p>
          </Section>
        )}
      </div>
    </ScrollArea>
  );
}
