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
  // Tier and product type (NEW)
  tier?: string;
  product_type?: string;
  intake_track?: string;
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
  // Current intake form fields (snake_case from DB)
  business_name?: string;
  your_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  service_type?: string;
  services_list?: string;
  services_offered?: string;
  website_goal?: string;
  photo_readiness?: string;
  logo_status?: string;
  brand_colors?: string;
  // AI Receptionist fields
  preferred_tone?: string;
  business_hours?: string;
  call_handling?: string;
  after_hours_action?: string;
  text_handling?: string[];
  handoff_triggers?: string[];
  handoff_method?: string;
  escalation_number?: string;
  pricing_guidance?: string;
  customer_faqs?: string;
  do_not_say?: string;
  booking_link?: string;
  lead_fields?: string[];
  team_names?: string;
  business_phone?: string;
  business_personality?: string[];
  guarantees_policies?: string;
  submitted_at?: string;
  // Structured intake details (NEW)
  intake_details?: {
    content?: { hero_line?: string; services?: Array<{ name: string; description?: string }> };
    existing_site?: { 
      platform?: string; 
      platform_other?: string;
      url?: string; 
      work_requested?: string[];
      access_method?: string;
      access_instructions?: string;
    };
    access_checklist?: Record<string, string>;
    design?: Record<string, unknown>;
    hours?: Record<string, unknown>;
    links?: Record<string, unknown>;
    required_sections?: string[];
    features_needed?: string[];
    trust_signals?: Record<string, unknown>;
  };
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

  // Detect format: current intake uses snake_case fields
  const isCurrentFormat = !!(intake.service_type || intake.website_goal || intake.preferred_tone);
  const isNewFormat = !!(intake.primaryGoal && !intake.goals);

  // Helper to get display value with fallback label lookup
  const getLabel = (value: string | undefined, labels: Record<string, string>) => {
    if (!value) return null;
    return labels[value] || value;
  };

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

        {/* Current format - service_type based intake */}
        {isCurrentFormat && (
          <>
            {/* Service Type Badge */}
            {intake.service_type && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="default" className="text-xs">
                  {intake.service_type === 'website' && 'Website Only'}
                  {intake.service_type === 'ai' && 'AI Receptionist Only'}
                  {intake.service_type === 'both' && 'Website + AI Receptionist'}
                  {intake.service_type === 'demo' && 'Demo Request'}
                  {!['website', 'ai', 'both', 'demo'].includes(intake.service_type) && intake.service_type}
                </Badge>
                {intake.tier && (
                  <Badge variant="outline" className="text-xs font-medium bg-primary/5">
                    {/* Website tiers */}
                    {intake.tier === 'website_starter' && '🌱 Website Starter'}
                    {intake.tier === 'website_growth' && '📈 Website Growth'}
                    {intake.tier === 'website_full_ops' && '🚀 Website Full Ops'}
                    {/* AI tiers */}
                    {intake.tier === 'ai_starter' && '🤖 AI Starter'}
                    {intake.tier === 'ai_growth' && '📞 AI Growth'}
                    {intake.tier === 'ai_full_ops' && '⚡ AI Full Ops'}
                    {/* Bundle tiers */}
                    {intake.tier === 'bundle_starter' && '📦 Bundle Starter'}
                    {intake.tier === 'bundle_growth' && '📦 Bundle Growth'}
                    {intake.tier === 'bundle_full_ops' && '📦 Bundle Full Ops'}
                    {/* Legacy tiers */}
                    {intake.tier === 'starter' && 'Starter System'}
                    {intake.tier === 'growth' && 'Growth System'}
                    {intake.tier === 'full_ops' && 'Full Operations'}
                    {intake.tier === 'care_starter' && 'Care Plan – Starter'}
                    {intake.tier === 'care_growth' && 'Care Plan – Growth'}
                    {/* Fallback for unknown tiers */}
                    {!['website_starter', 'website_growth', 'website_full_ops', 'ai_starter', 'ai_growth', 'ai_full_ops', 'bundle_starter', 'bundle_growth', 'bundle_full_ops', 'starter', 'growth', 'full_ops', 'care_starter', 'care_growth'].includes(intake.tier) && intake.tier}
                  </Badge>
                )}
                {intake.intake_track && (
                  <Badge variant={intake.intake_track === 'new_site' ? 'secondary' : 'outline'} className="text-xs">
                    {intake.intake_track === 'new_site' ? 'New Build' : 'Existing Site'}
                  </Badge>
                )}
              </div>
            )}

            <Section icon={Building2} title="Business">
              <div className="space-y-1.5 text-sm">
                {intake.business_name && <p className="font-medium">{intake.business_name}</p>}
                {intake.your_name && <p className="text-muted-foreground">Contact: {intake.your_name}</p>}
                {intake.city && <p className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{intake.city}</p>}
                {(intake.email || intake.phone) && (
                  <p className="text-muted-foreground">
                    {intake.email}{intake.phone ? ` · ${intake.phone}` : ''}
                  </p>
                )}
                {intake.business_phone && intake.business_phone !== intake.phone && (
                  <p className="text-muted-foreground">Business: {intake.business_phone}</p>
                )}
              </div>
            </Section>

            {/* Website Info - only show for website or both service types */}
            {(intake.service_type === 'website' || intake.service_type === 'both') && 
             (intake.website_goal || intake.services_list) && (
              <Section icon={Globe} title="Website">
                <div className="space-y-1.5 text-sm">
                  {intake.website_goal && (
                    <Badge variant="secondary" className="text-xs">
                      {intake.website_goal === 'bookings' && 'Goal: Get Bookings'}
                      {intake.website_goal === 'calls' && 'Goal: Get Calls'}
                      {intake.website_goal === 'info' && 'Goal: Provide Info'}
                      {intake.website_goal === 'quotes' && 'Goal: Get Quotes'}
                      {!['bookings', 'calls', 'info', 'quotes'].includes(intake.website_goal) && intake.website_goal}
                    </Badge>
                  )}
                  {intake.services_list && (
                    <p className="text-muted-foreground">Services: {intake.services_list}</p>
                  )}
                </div>
              </Section>
            )}

            {/* Existing Site Details (from intake_details) */}
            {intake.intake_details?.existing_site && (
              <Section icon={Globe} title="Existing Site">
                <div className="space-y-2 text-sm">
                  {intake.intake_details.existing_site.url && (
                    <a 
                      href={intake.intake_details.existing_site.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline block"
                    >
                      {intake.intake_details.existing_site.url}
                    </a>
                  )}
                  {intake.intake_details.existing_site.platform && (
                    <p className="text-muted-foreground">
                      Platform: <span className="capitalize">{intake.intake_details.existing_site.platform === 'platform_other' 
                        ? intake.intake_details.existing_site.platform_other 
                        : intake.intake_details.existing_site.platform}</span>
                    </p>
                  )}
                  {intake.intake_details.existing_site.work_requested && intake.intake_details.existing_site.work_requested.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-muted-foreground">Work requested:</span>
                      {intake.intake_details.existing_site.work_requested.map((w: string) => (
                        <Badge key={w} variant="outline" className="text-xs">
                          {w === 'domain_dns' && 'Domain/DNS'}
                          {w === 'tracking' && 'Analytics/Tracking'}
                          {w === 'redesign' && 'Redesign'}
                          {w === 'content' && 'Content Updates'}
                          {w === 'seo' && 'SEO'}
                          {w === 'speed' && 'Speed Optimization'}
                          {!['domain_dns', 'tracking', 'redesign', 'content', 'seo', 'speed'].includes(w) && w}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {intake.intake_details.existing_site.access_method && (
                    <p className="text-muted-foreground">
                      Access: {intake.intake_details.existing_site.access_method === 'share' ? 'Will share credentials' : intake.intake_details.existing_site.access_method === 'none' ? 'No access yet' : intake.intake_details.existing_site.access_method}
                    </p>
                  )}
                  {intake.intake_details.existing_site.access_instructions && (
                    <p className="text-muted-foreground text-xs bg-muted/30 rounded p-2">
                      {intake.intake_details.existing_site.access_instructions}
                    </p>
                  )}
                </div>
              </Section>
            )}

            {/* Access Checklist (from intake_details) */}
            {intake.intake_details?.access_checklist && Object.keys(intake.intake_details.access_checklist).length > 0 && (
              <Section icon={CheckCircle2} title="Access Status">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(intake.intake_details.access_checklist).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className={value === 'granted' ? 'text-green-600' : value === 'pending' ? 'text-amber-600' : 'text-muted-foreground'}>
                        {value === 'granted' ? '✓' : value === 'pending' ? '⏳' : '○'}
                      </span>
                      <span className="capitalize text-muted-foreground">
                        {key === 'analytics' && 'Google Analytics'}
                        {key === 'search_console' && 'Search Console'}
                        {key === 'hosting' && 'Hosting'}
                        {key === 'domain' && 'Domain'}
                        {!['analytics', 'search_console', 'hosting', 'domain'].includes(key) && key.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Content from intake_details */}
            {intake.intake_details?.content && (
              <Section icon={FileText} title="Content">
                <div className="space-y-2 text-sm">
                  {intake.intake_details.content.hero_line && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Hero Line:</p>
                      <p className="text-foreground italic">"{intake.intake_details.content.hero_line}"</p>
                    </div>
                  )}
                  {intake.intake_details.content.services && intake.intake_details.content.services.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Services ({intake.intake_details.content.services.length}):</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {intake.intake_details.content.services.map((svc: { name: string; description?: string }, i: number) => (
                          <li key={i} className="text-muted-foreground">
                            <span className="font-medium text-foreground">{svc.name}</span>
                            {svc.description && <span className="text-xs"> — {svc.description}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Photo & Brand Readiness */}
            {(intake.photo_readiness || intake.logo_status || intake.brand_colors) && (
              <Section icon={Palette} title="Brand & Assets">
                <div className="space-y-1.5 text-sm">
                  {intake.logo_status && (
                    <p className="text-muted-foreground">
                      Logo: {intake.logo_status === 'yes' ? '✓ Has logo' : intake.logo_status === 'no' ? '✗ Needs logo' : intake.logo_status}
                    </p>
                  )}
                  {intake.photo_readiness && (
                    <p className="text-muted-foreground">
                      Photos: {intake.photo_readiness === 'ready' ? '✓ Ready' : intake.photo_readiness === 'some' ? 'Some available' : intake.photo_readiness === 'need_help' ? 'Needs help' : intake.photo_readiness}
                    </p>
                  )}
                  {intake.brand_colors && (
                    <p className="text-muted-foreground">Colors: {intake.brand_colors}</p>
                  )}
                </div>
              </Section>
            )}

            {/* AI Receptionist Settings */}
            {(intake.preferred_tone || intake.call_handling || intake.text_handling) && (
              <Section icon={Cog} title="AI Receptionist">
                <div className="space-y-2 text-sm">
                  {intake.preferred_tone && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Tone:</span>
                      <Badge variant="outline" className="text-xs capitalize">{intake.preferred_tone}</Badge>
                    </div>
                  )}
                  {intake.business_personality && intake.business_personality.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {intake.business_personality.map((p) => (
                        <Badge key={p} variant="outline" className="text-xs capitalize">{p.replace('_', ' ')}</Badge>
                      ))}
                    </div>
                  )}
                  {intake.call_handling && (
                    <p className="text-muted-foreground">
                      Call handling: {intake.call_handling === 'after_hours' ? 'After hours only' : intake.call_handling === 'always' ? 'Always on' : intake.call_handling}
                    </p>
                  )}
                  {intake.after_hours_action && (
                    <p className="text-muted-foreground">
                      After hours: {intake.after_hours_action === 'book' ? 'Book appointments' : intake.after_hours_action === 'message' ? 'Take messages' : intake.after_hours_action}
                    </p>
                  )}
                  {intake.text_handling && intake.text_handling.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Text handling: </span>
                      {intake.text_handling.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs mr-1">
                          {t === 'answer_faqs' ? 'Answer FAQs' : t === 'send_booking' ? 'Send booking link' : t === 'collect_info' ? 'Collect info' : t}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {intake.handoff_triggers && intake.handoff_triggers.length > 0 && (
                    <p className="text-muted-foreground">
                      Handoff when: {intake.handoff_triggers.join(', ')}
                    </p>
                  )}
                  {intake.handoff_method && (
                    <p className="text-muted-foreground">
                      Handoff via: {intake.handoff_method === 'message' ? 'Text message' : intake.handoff_method === 'call' ? 'Phone call' : intake.handoff_method}
                    </p>
                  )}
                  {intake.escalation_number && (
                    <p className="text-muted-foreground">Escalation: {intake.escalation_number}</p>
                  )}
                  {intake.pricing_guidance && (
                    <p className="text-muted-foreground">
                      Pricing: {intake.pricing_guidance === 'follow_up' ? 'Follow up for quote' : intake.pricing_guidance === 'provide' ? 'Provide prices' : intake.pricing_guidance}
                    </p>
                  )}
                </div>
              </Section>
            )}

            {/* Knowledge Base */}
            {(intake.customer_faqs || intake.guarantees_policies || intake.do_not_say) && (
              <Section icon={FileText} title="Knowledge Base">
                <div className="space-y-2 text-sm">
                  {intake.customer_faqs && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">FAQs:</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded p-2">{intake.customer_faqs}</p>
                    </div>
                  )}
                  {intake.guarantees_policies && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Guarantees/Policies:</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded p-2">{intake.guarantees_policies}</p>
                    </div>
                  )}
                  {intake.do_not_say && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Do NOT say:</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded p-2">{intake.do_not_say}</p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Lead Capture */}
            {(intake.lead_fields || intake.booking_link || intake.team_names) && (
              <Section icon={Target} title="Lead Capture">
                <div className="space-y-1.5 text-sm">
                  {intake.lead_fields && intake.lead_fields.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-muted-foreground">Collect:</span>
                      {intake.lead_fields.map((f) => (
                        <Badge key={f} variant="outline" className="text-xs capitalize">{f.replace('_', ' ')}</Badge>
                      ))}
                    </div>
                  )}
                  {intake.booking_link && (
                    <p className="text-muted-foreground">Booking: {intake.booking_link}</p>
                  )}
                  {intake.team_names && (
                    <p className="text-muted-foreground">Team: {intake.team_names}</p>
                  )}
                </div>
              </Section>
            )}

            {intake.business_hours && (
              <Section icon={Clock} title="Hours">
                <p className="text-sm text-muted-foreground">{intake.business_hours}</p>
              </Section>
            )}
          </>
        )}

        {/* Fallback to legacy/new wizard format display */}
        {!isCurrentFormat && (
          <>
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
          </>
        )}

        {/* Timeline - works for all formats */}
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
      </div>
    </ScrollArea>
  );
}
