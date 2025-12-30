import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PipelineStage = 
  | "new" 
  | "demo_requested" 
  | "quote_requested" 
  | "claimed" 
  | "contacted" 
  | "qualified"
  | "won" 
  | "lost";

// Ordered stages for forward-only progression (lost is terminal, can go anywhere)
export const STAGE_ORDER: PipelineStage[] = [
  "new",
  "demo_requested", 
  "quote_requested",
  "claimed",
  "contacted",
  "qualified",
  "won",
];

// All possible stages including terminal states
export const ALL_STAGES: PipelineStage[] = [...STAGE_ORDER, "lost"];

interface StageBadgeProps {
  stage: string | null | undefined;
  className?: string;
}

export const STAGE_CONFIG: Record<PipelineStage, { label: string; className: string }> = {
  new: {
    label: "New",
    className: "bg-muted text-muted-foreground",
  },
  demo_requested: {
    label: "Demo",
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  quote_requested: {
    label: "Quoted",
    className: "bg-amber-500/15 text-amber-700 border-amber-200 font-medium",
  },
  claimed: {
    label: "Claimed",
    className: "bg-green-500/15 text-green-700 border-green-200 font-medium",
  },
  contacted: {
    label: "Contacted",
    className: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
  qualified: {
    label: "Qualified",
    className: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  },
  won: {
    label: "Won",
    className: "bg-emerald-500/20 text-emerald-700 border-emerald-300 font-semibold",
  },
  lost: {
    label: "Lost",
    className: "bg-gray-500/10 text-gray-500 border-gray-200",
  },
};

// Get next stage in the pipeline (forward-only)
export function getNextStage(current: string | null | undefined): PipelineStage | null {
  const normalized = (current || "new") as PipelineStage;
  const currentIndex = STAGE_ORDER.indexOf(normalized);
  
  // If already won/lost or not found, no next stage
  if (currentIndex === -1 || normalized === "won" || normalized === "lost") {
    return null;
  }
  
  // Return next stage if exists
  if (currentIndex < STAGE_ORDER.length - 1) {
    return STAGE_ORDER[currentIndex + 1];
  }
  
  return null;
}

// Get valid target stages (forward + lost for override)
export function getValidTargetStages(current: string | null | undefined): PipelineStage[] {
  const normalized = (current || "new") as PipelineStage;
  const currentIndex = STAGE_ORDER.indexOf(normalized);
  
  // If already won or lost, only allow moving to other terminal states
  if (normalized === "won") return ["lost"];
  if (normalized === "lost") return ["won", ...STAGE_ORDER.slice(currentIndex >= 0 ? currentIndex : 0)];
  
  // Forward stages + lost
  const forwardStages = STAGE_ORDER.slice(currentIndex + 1);
  return [...forwardStages, "lost"];
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

// For filter tabs
export const PIPELINE_FILTERS = [
  { value: "all", label: "All" },
  { value: "quote_requested", label: "Quotes" },
  { value: "claimed", label: "Claimed" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "won", label: "Won" },
] as const;

export type PipelineFilter = typeof PIPELINE_FILTERS[number]["value"];
