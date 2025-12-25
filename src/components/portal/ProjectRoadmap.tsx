import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  FileText, 
  MessageSquare, 
  Eye, 
  Rocket,
  ExternalLink
} from "lucide-react";

export type RoadmapStep = {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  meta?: string;
};

interface ProjectRoadmapProps {
  steps: RoadmapStep[];
  className?: string;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  intake: FileText,
  preview: Eye,
  revisions: MessageSquare,
  final: CheckCircle2,
  launch: Rocket,
};

function StepIcon({ stepId, status }: { stepId: string; status: RoadmapStep['status'] }) {
  const Icon = STEP_ICONS[stepId] || Circle;
  
  if (status === 'completed') {
    return (
      <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      </div>
    );
  }
  
  if (status === 'current') {
    return (
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/30">
        <Icon className="h-4 w-4 text-primary" />
      </div>
    );
  }
  
  return (
    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export function ProjectRoadmap({ steps, className }: ProjectRoadmapProps) {
  const currentStepIndex = steps.findIndex(s => s.status === 'current');
  
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium text-sm">Project Progress</h3>
        {currentStepIndex >= 0 && (
          <Badge variant="secondary" className="text-xs">
            Step {currentStepIndex + 1} of {steps.length}
          </Badge>
        )}
      </div>
      
      <div className="space-y-1">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div 
                className={`absolute left-4 top-8 w-0.5 h-full -translate-x-1/2 ${
                  step.status === 'completed' ? 'bg-green-500/30' : 'bg-border'
                }`}
              />
            )}
            
            {/* Step content */}
            <div className={`flex gap-3 p-3 rounded-lg transition-colors ${
              step.status === 'current' 
                ? 'bg-primary/5 border border-primary/20' 
                : ''
            }`}>
              <StepIcon stepId={step.id} status={step.status} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-sm ${
                    step.status === 'upcoming' ? 'text-muted-foreground' : ''
                  }`}>
                    {step.label}
                  </span>
                  {step.status === 'current' && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
                
                {/* Action button */}
                {step.action && step.status === 'current' && (
                  <div className="mt-2">
                    {step.action.href ? (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="text-xs h-7"
                      >
                        <a href={step.action.href} target="_blank" rel="noopener noreferrer">
                          {step.action.label}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    ) : step.action.onClick ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={step.action.onClick}
                        className="text-xs h-7"
                      >
                        {step.action.label}
                      </Button>
                    ) : null}
                  </div>
                )}
                
                {/* Meta info */}
                {step.meta && (
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {step.meta}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper to compute roadmap steps from project state
export function computeRoadmapSteps({
  intakeStatus,
  hasPrototype,
  openCommentsCount,
  resolvedCommentsCount,
  projectStatus,
  prototypeUrl,
  finalApprovedAt,
  onViewPrototype,
  onApproveFinal,
}: {
  intakeStatus?: 'draft' | 'submitted' | 'approved';
  hasPrototype: boolean;
  openCommentsCount: number;
  resolvedCommentsCount: number;
  projectStatus: string;
  prototypeUrl?: string;
  finalApprovedAt?: string | null;
  onViewPrototype?: () => void;
  onApproveFinal?: () => void;
}): RoadmapStep[] {
  const isCompleted = projectStatus === 'completed';
  const isFinalApproved = !!finalApprovedAt;
  
  // Step 1: Intake
  const intakeComplete = intakeStatus === 'approved';
  const intakeStep: RoadmapStep = {
    id: 'intake',
    label: 'Intake Submitted',
    description: intakeComplete 
      ? 'Your project details have been reviewed' 
      : 'We\'re reviewing your project details',
    status: intakeComplete ? 'completed' : 'current',
    meta: intakeStatus === 'submitted' ? 'Under review' : undefined,
  };

  // Step 2: First Preview
  const previewStep: RoadmapStep = {
    id: 'preview',
    label: 'First Preview',
    description: hasPrototype 
      ? 'Your preview is ready for review' 
      : 'We\'re preparing your first preview',
    status: hasPrototype 
      ? (intakeComplete ? 'current' : 'completed') 
      : (intakeComplete ? 'current' : 'upcoming'),
    action: hasPrototype && prototypeUrl ? {
      label: 'View Preview',
      onClick: onViewPrototype,
    } : undefined,
  };

  // Step 3: Revisions
  const hasAnyComments = openCommentsCount > 0 || resolvedCommentsCount > 0;
  const revisionsComplete = hasPrototype && openCommentsCount === 0 && resolvedCommentsCount > 0;
  const revisionsStep: RoadmapStep = {
    id: 'revisions',
    label: 'Revisions',
    description: hasAnyComments
      ? `${openCommentsCount} open · ${resolvedCommentsCount} resolved`
      : 'Leave feedback on your preview',
    status: revisionsComplete || isFinalApproved
      ? 'completed' 
      : (hasPrototype && intakeComplete ? 'current' : 'upcoming'),
  };

  // Step 4: Final Review
  const canApproveFinal = revisionsComplete && !isFinalApproved && !isCompleted;
  const finalStep: RoadmapStep = {
    id: 'final',
    label: 'Final Review',
    description: isFinalApproved 
      ? 'You approved the final version' 
      : isCompleted 
        ? 'All feedback addressed' 
        : 'Approve the final version',
    status: isFinalApproved || isCompleted ? 'completed' : (revisionsComplete ? 'current' : 'upcoming'),
    action: canApproveFinal && onApproveFinal ? {
      label: 'Approve Final',
      onClick: onApproveFinal,
    } : undefined,
    meta: isFinalApproved && finalApprovedAt 
      ? `Approved ${new Date(finalApprovedAt).toLocaleDateString()}` 
      : undefined,
  };

  // Step 5: Launch
  const launchStep: RoadmapStep = {
    id: 'launch',
    label: 'Launch',
    description: isCompleted 
      ? 'Your site is live!' 
      : 'Go live with your new site',
    status: isCompleted ? 'completed' : 'upcoming',
  };

  return [intakeStep, previewStep, revisionsStep, finalStep, launchStep];
}
