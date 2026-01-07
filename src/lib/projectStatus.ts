// Centralized project status computation for consistent display across the app

export type ProjectDisplayStatus = 
  | "draft"
  | "submitted"
  | "review"
  | "building"
  | "preview"
  | "live"
  | "completed"
  | "paused"
  | "needs_info";

export interface ProjectStatusInfo {
  status: ProjectDisplayStatus;
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  color: string; // Tailwind color class
}

export interface ProjectData {
  intake_status?: string | null;
  portal_stage?: string;
  versions_count?: number;
  needs_info?: boolean;
  final_approved_at?: string | null;
  ai_trial_status?: string | null;
  service_type?: string;
}

// Compute website status
export function getWebsiteStatus(project: ProjectData): ProjectStatusInfo {
  if (project.needs_info) {
    return {
      status: "needs_info",
      label: "Needs info",
      variant: "destructive",
      color: "text-orange-600 bg-orange-100",
    };
  }

  if (project.final_approved_at) {
    return {
      status: "completed",
      label: "Completed",
      variant: "default",
      color: "text-green-700 bg-green-100",
    };
  }

  const versionsCount = project.versions_count ?? 0;
  
  if (versionsCount > 0) {
    return {
      status: "preview",
      label: "Preview ready",
      variant: "default",
      color: "text-blue-700 bg-blue-100",
    };
  }

  const intakeStatus = project.intake_status;
  
  if (intakeStatus === "approved" || project.portal_stage === "building") {
    return {
      status: "building",
      label: "Building",
      variant: "secondary",
      color: "text-purple-700 bg-purple-100",
    };
  }

  if (intakeStatus === "submitted" || project.portal_stage === "review") {
    return {
      status: "review",
      label: "Under review",
      variant: "secondary",
      color: "text-amber-700 bg-amber-100",
    };
  }

  if (intakeStatus === "draft" || !intakeStatus) {
    return {
      status: "draft",
      label: "Draft",
      variant: "outline",
      color: "text-muted-foreground bg-muted",
    };
  }

  return {
    status: "submitted",
    label: "Submitted",
    variant: "secondary",
    color: "text-amber-700 bg-amber-100",
  };
}

// Compute AI receptionist status
export function getAIStatus(project: ProjectData): ProjectStatusInfo {
  const aiStatus = project.ai_trial_status;

  if (!aiStatus || aiStatus === "none") {
    return {
      status: "draft",
      label: "Not started",
      variant: "outline",
      color: "text-muted-foreground bg-muted",
    };
  }

  switch (aiStatus) {
    case "intake_received":
    case "received":
      return {
        status: "submitted",
        label: "Received",
        variant: "secondary",
        color: "text-amber-700 bg-amber-100",
      };
    case "review":
      return {
        status: "review",
        label: "Under review",
        variant: "secondary",
        color: "text-amber-700 bg-amber-100",
      };
    case "setup":
    case "setting_up":
      return {
        status: "building",
        label: "Setting up",
        variant: "secondary",
        color: "text-purple-700 bg-purple-100",
      };
    case "testing":
      return {
        status: "preview",
        label: "Testing",
        variant: "default",
        color: "text-blue-700 bg-blue-100",
      };
    case "live":
    case "active":
      return {
        status: "live",
        label: "Live",
        variant: "default",
        color: "text-green-700 bg-green-100",
      };
    case "paused":
      return {
        status: "paused",
        label: "Paused",
        variant: "outline",
        color: "text-muted-foreground bg-muted",
      };
    default:
      return {
        status: "submitted",
        label: aiStatus,
        variant: "secondary",
        color: "text-amber-700 bg-amber-100",
      };
  }
}

// Get combined project status (for simple single badge)
export function getProjectStatus(project: ProjectData): ProjectStatusInfo {
  const serviceType = project.service_type || "website";

  if (project.needs_info) {
    return {
      status: "needs_info",
      label: "Needs info",
      variant: "destructive",
      color: "text-orange-600 bg-orange-100",
    };
  }

  // For AI-only projects
  if (serviceType === "ai" || serviceType === "ai_receptionist") {
    return getAIStatus(project);
  }

  // For website or both
  return getWebsiteStatus(project);
}

// Get both statuses for combined projects
export function getProjectStatuses(project: ProjectData): {
  website?: ProjectStatusInfo;
  ai?: ProjectStatusInfo;
} {
  const serviceType = project.service_type || "website";
  const result: { website?: ProjectStatusInfo; ai?: ProjectStatusInfo } = {};

  if (serviceType === "website" || serviceType === "both") {
    result.website = getWebsiteStatus(project);
  }

  if (serviceType === "ai" || serviceType === "ai_receptionist" || serviceType === "both") {
    result.ai = getAIStatus(project);
  }

  return result;
}