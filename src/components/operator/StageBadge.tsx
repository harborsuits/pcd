import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Service types for projects
export type ServiceType = "website" | "ai" | "both";

// Unified pipeline stages (works for all service types)
export type PipelineStage = 
  | "new" 
  | "discovery" 
  | "build" 
  | "preview" 
  | "revisions"
  | "launch" 
  | "live"
  | "closed";

// Ordered stages for forward progression
export const STAGE_ORDER: PipelineStage[] = [
  "new",
  "discovery", 
  "build",
  "preview",
  "revisions",
  "launch",
  "live",
];

// All possible stages including terminal
export const ALL_STAGES: PipelineStage[] = [...STAGE_ORDER, "closed"];

interface StageBadgeProps {
  stage: string | null | undefined;
  className?: string;
}

export const STAGE_CONFIG: Record<PipelineStage, { label: string; className: string; description: string }> = {
  new: {
    label: "New",
    className: "bg-muted text-muted-foreground",
    description: "Intake submitted, awaiting review",
  },
  discovery: {
    label: "Discovery",
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
    description: "Gathering requirements and info",
  },
  build: {
    label: "Build",
    className: "bg-amber-500/15 text-amber-700 border-amber-200 font-medium",
    description: "Active development/configuration",
  },
  preview: {
    label: "Preview",
    className: "bg-purple-500/10 text-purple-600 border-purple-200",
    description: "Ready for client review and testing",
  },
  revisions: {
    label: "Revisions",
    className: "bg-orange-500/10 text-orange-600 border-orange-200",
    description: "Processing client feedback",
  },
  launch: {
    label: "Launch",
    className: "bg-green-500/15 text-green-700 border-green-200 font-medium",
    description: "Final prep and go-live",
  },
  live: {
    label: "Live",
    className: "bg-emerald-500/20 text-emerald-700 border-emerald-300 font-semibold",
    description: "Active and in production",
  },
  closed: {
    label: "Closed",
    className: "bg-gray-500/10 text-gray-500 border-gray-200",
    description: "Completed, canceled, or archived",
  },
};

// Service type configuration
export const SERVICE_TYPE_CONFIG: Record<ServiceType, { label: string; className: string; icon: string }> = {
  website: {
    label: "Website",
    className: "bg-sky-500/10 text-sky-600 border-sky-200",
    icon: "🌐",
  },
  ai: {
    label: "AI Receptionist",
    className: "bg-violet-500/10 text-violet-600 border-violet-200",
    icon: "🤖",
  },
  both: {
    label: "Website + AI",
    className: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
    icon: "⚡",
  },
};

// Get next stage in the pipeline (forward-only)
export function getNextStage(current: string | null | undefined): PipelineStage | null {
  const normalized = (current || "new") as PipelineStage;
  const currentIndex = STAGE_ORDER.indexOf(normalized);
  
  // If already live/closed or not found, no next stage
  if (currentIndex === -1 || normalized === "live" || normalized === "closed") {
    return null;
  }
  
  // Return next stage if exists
  if (currentIndex < STAGE_ORDER.length - 1) {
    return STAGE_ORDER[currentIndex + 1];
  }
  
  return null;
}

// Get valid target stages (forward + closed for override)
export function getValidTargetStages(current: string | null | undefined): PipelineStage[] {
  const normalized = (current || "new") as PipelineStage;
  
  // Terminal states: only allow moving to the other terminal
  if (normalized === "live") return ["closed"];
  if (normalized === "closed") return ["live"];
  
  // For all other stages: forward stages + closed (admin override)
  const idx = STAGE_ORDER.indexOf(normalized);
  const forward = idx === -1 ? STAGE_ORDER.slice(1) : STAGE_ORDER.slice(idx + 1);
  return [...forward, "closed"];
}

// Helper to check if a message is a system message
export function isSystemMessage(content: string): boolean {
  return content.startsWith("[SYSTEM]");
}

// Parse system message to get a cleaner display
export function parseSystemMessage(content: string): { type: "stage_change" | "other"; from?: string; to?: string; text: string } {
  if (!content.startsWith("[SYSTEM]")) {
    return { type: "other", text: content };
  }
  
  const stripped = content.replace("[SYSTEM] ", "");
  
  // Check for stage change pattern: "Pipeline stage changed: X → Y"
  const stageMatch = stripped.match(/Pipeline stage changed: (\w+) → (\w+)/);
  if (stageMatch) {
    return {
      type: "stage_change",
      from: stageMatch[1],
      to: stageMatch[2],
      text: stripped,
    };
  }
  
  return { type: "other", text: stripped };
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  const normalizedStage = (stage || "new") as PipelineStage;
  const config = STAGE_CONFIG[normalizedStage] || STAGE_CONFIG.new;

  return (
    <Badge 
      variant="outline" 
      className={cn("text-xs", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

// Service type badge
interface ServiceTypeBadgeProps {
  serviceType: string | null | undefined;
  className?: string;
  showIcon?: boolean;
}

export function ServiceTypeBadge({ serviceType, className, showIcon = true }: ServiceTypeBadgeProps) {
  const normalized = (serviceType || "website") as ServiceType;
  const config = SERVICE_TYPE_CONFIG[normalized] || SERVICE_TYPE_CONFIG.website;

  return (
    <Badge 
      variant="outline" 
      className={cn("text-xs", config.className, className)}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}

// For filter tabs
export const PIPELINE_FILTERS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "discovery", label: "Discovery" },
  { value: "build", label: "Build" },
  { value: "preview", label: "Preview" },
  { value: "revisions", label: "Revisions" },
  { value: "launch", label: "Launch" },
  { value: "live", label: "Live" },
  { value: "archived", label: "Archived" },
] as const;

export const SERVICE_TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "website", label: "🌐 Website" },
  { value: "ai", label: "🤖 AI" },
  { value: "both", label: "⚡ Both" },
] as const;

export type PipelineFilter = typeof PIPELINE_FILTERS[number]["value"];
export type ServiceTypeFilter = typeof SERVICE_TYPE_FILTERS[number]["value"];
