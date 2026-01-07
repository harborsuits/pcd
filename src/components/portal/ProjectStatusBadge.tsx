import { cn } from "@/lib/utils";
import { getProjectStatus, getProjectStatuses, type ProjectData, type ProjectStatusInfo } from "@/lib/projectStatus";
import { Globe, Phone } from "lucide-react";

interface ProjectStatusBadgeProps {
  project: ProjectData;
  showBoth?: boolean;
  size?: "sm" | "md";
  className?: string;
}

function StatusPill({ 
  status, 
  icon: Icon,
  size = "sm" 
}: { 
  status: ProjectStatusInfo;
  icon?: typeof Globe;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full",
        status.color,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      )}
    >
      {Icon && <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
      {status.label}
    </span>
  );
}

export function ProjectStatusBadge({ 
  project, 
  showBoth = false, 
  size = "sm",
  className 
}: ProjectStatusBadgeProps) {
  const serviceType = project.service_type || "website";

  // For combined projects, optionally show both badges
  if (showBoth && serviceType === "both") {
    const statuses = getProjectStatuses(project);
    return (
      <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
        {statuses.website && (
          <StatusPill status={statuses.website} icon={Globe} size={size} />
        )}
        {statuses.ai && (
          <StatusPill status={statuses.ai} icon={Phone} size={size} />
        )}
      </div>
    );
  }

  // Single badge
  const status = getProjectStatus(project);
  
  // Add icon based on service type
  let Icon: typeof Globe | undefined;
  if (serviceType === "ai" || serviceType === "ai_receptionist") {
    Icon = Phone;
  } else if (serviceType === "website") {
    Icon = Globe;
  }

  return (
    <div className={className}>
      <StatusPill status={status} icon={Icon} size={size} />
    </div>
  );
}