import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Phone, Mail, User, Globe, Clock, MapPin,
  Sparkles, Target, Palette, Camera, FileText, Bot
} from "lucide-react";
import { SERVICE_TYPE_CONFIG, ServiceType } from "@/components/operator/StageBadge";

type IntakeData = Record<string, unknown>;

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && !value.trim()) return null;

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm min-w-[100px] shrink-0">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium flex items-center gap-2 text-sm">
        {icon}
        {title}
      </h4>
      <div className="pl-6 space-y-0">
        {children}
      </div>
    </div>
  );
}

interface IntakeSummaryProps {
  serviceType: ServiceType | string | null | undefined;
  intake: IntakeData;
  basics?: {
    businessName?: string;
    yourName?: string;
    email?: string;
    phone?: string;
  };
}

export function IntakeSummary({ serviceType, intake, basics }: IntakeSummaryProps) {
  const normalized = (serviceType || "website") as ServiceType;
  const config = SERVICE_TYPE_CONFIG[normalized] || SERVICE_TYPE_CONFIG.website;

  // Helper to safely get string value
  const getString = (key: string): string | undefined => {
    const val = intake[key];
    if (typeof val === "string" && val.trim()) return val;
    return undefined;
  };

  // Helper to get array values as comma-separated string
  const getArrayString = (key: string): string | undefined => {
    const val = intake[key];
    if (Array.isArray(val) && val.length > 0) return val.join(", ");
    return undefined;
  };

  return (
    <div className="space-y-6">
      {/* Service Type Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={config.className}>
          <span className="mr-1">{config.icon}</span>
          {config.label}
        </Badge>
      </div>

      {/* Basics Section */}
      <Section title="Business Basics" icon={<Building2 className="h-4 w-4 text-muted-foreground" />}>
        <Row label="Business" value={basics?.businessName || getString("businessName")} />
        <Row label="Contact" value={basics?.yourName || getString("yourName")} />
        <Row label="Email" value={basics?.email || getString("email")} />
        <Row label="Phone" value={basics?.phone || getString("phone")} />
      </Section>

      {/* Website Goals (website or both) */}
      {(normalized === "website" || normalized === "both") && (
        <Section title="Website Goals" icon={<Target className="h-4 w-4 text-muted-foreground" />}>
          <Row label="Goal" value={getString("websiteGoal")} />
          <Row label="Service Area" value={getString("serviceArea")} />
          <Row label="Timeline" value={getString("timeline")} />
        </Section>
      )}

      {/* Brand & Assets (website or both) */}
      {(normalized === "website" || normalized === "both") && (
        <Section title="Brand & Assets" icon={<Palette className="h-4 w-4 text-muted-foreground" />}>
          <Row label="Logo" value={getString("logoStatus")} />
          <Row label="Colors" value={getString("brandColors")} />
          <Row label="Services" value={getString("servicesList")} />
          <Row label="Photos" value={getString("photoReadiness")} />
        </Section>
      )}

      {/* AI Receptionist (ai or both) */}
      {(normalized === "ai" || normalized === "both") && (
        <Section title="AI Receptionist" icon={<Bot className="h-4 w-4 text-muted-foreground" />}>
          <Row label="Business Phone" value={getString("businessPhone")} />
          <Row label="Hours" value={getString("businessHours")} />
          <Row label="Services" value={getString("servicesOffered")} />
          <Row label="Escalation #" value={getString("escalationNumber")} />
          <Row label="Emergency Rules" value={getString("emergencyRules")} />
          <Row label="Tone" value={getString("preferredTone")} />
          <Row label="Calendar Integration" value={getString("bookingLink")} />
          <Row label="FAQs" value={getString("faqs")} />
        </Section>
      )}

      {/* À la carte / Other */}
      {normalized === "other" && (
        <Section title="À la carte Services" icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}>
          <Row label="Services" value={getArrayString("selectedServices")} />
          <Row label="Custom Request" value={getString("customRequest")} />
        </Section>
      )}

      {/* Expectations / Notes (always show if present) */}
      {getString("expectations") && (
        <Section title="Additional Notes" icon={<FileText className="h-4 w-4 text-muted-foreground" />}>
          <div className="text-sm text-foreground bg-muted/50 rounded p-3">
            {getString("expectations")}
          </div>
        </Section>
      )}
    </div>
  );
}

export default IntakeSummary;
