import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  FileText, 
  MessageSquare, 
  Eye, 
  ExternalLink,
  Hammer
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
  build: Hammer,
  preview: Eye,
  revisions: MessageSquare,
  final: CheckCircle2,
};

// Build phase micro-milestone indicator
function BuildMilestone({ label, done, inProgress }: { label: string; done?: boolean; inProgress?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-1.5 h-1.5 rounded-full ${
        done ? 'bg-green-500' : inProgress ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'
      }`} />
      <span className={done ? 'text-muted-foreground line-through' : inProgress ? 'text-foreground' : 'text-muted-foreground/60'}>
        {label}
      </span>
    </div>
  );
}

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
                
                {/* Build phase progress indicator */}
                {step.id === 'build' && step.status === 'current' && (
                  <div className="mt-3 pl-1 space-y-1.5">
                    <BuildMilestone label="Structure" done />
                    <BuildMilestone label="Visual system" inProgress />
                    <BuildMilestone label="Content pass" />
                  </div>
                )}
                
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
// Luxury 5-step flow: Intake → Build → First Preview → Revisions → Final Approval
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
  const intakeComplete = intakeStatus === 'approved' || intakeStatus === 'submitted';
  const intakeReviewed = intakeStatus === 'approved';
  
  // Step 1: Intake
  const intakeStep: RoadmapStep = {
    id: 'intake',
    label: 'Intake',
    description: intakeReviewed 
      ? 'Your project brief has been received and reviewed.' 
      : intakeStatus === 'submitted'
        ? 'We\'re reviewing your project details.'
        : 'Tell us what you need.',
    status: intakeComplete ? 'completed' : 'current',
    meta: intakeStatus === 'submitted' && !intakeReviewed ? 'Under review' : undefined,
  };

  // Step 2: Build (NEW - the missing clarity phase)
  // Build is "in progress" after intake is complete but before prototype exists
  const buildInProgress = intakeComplete && !hasPrototype;
  const buildComplete = hasPrototype;
  const buildStep: RoadmapStep = {
    id: 'build',
    label: 'Build',
    description: buildComplete
      ? 'Your first version has been assembled.'
      : buildInProgress
        ? 'We\'re designing and assembling your first version.'
        : 'We\'ll design, structure, and prepare your site.',
    status: buildComplete ? 'completed' : (buildInProgress ? 'current' : 'upcoming'),
    meta: buildInProgress ? 'In production' : undefined,
  };

  // Step 3: First Preview
  const hasStartedReview = openCommentsCount > 0 || resolvedCommentsCount > 0;
  const previewStep: RoadmapStep = {
    id: 'preview',
    label: 'First Preview',
    description: hasStartedReview
      ? 'Review in progress — leave pinned comments directly on the page.'
      : hasPrototype 
        ? 'Your preview is ready for review.'
        : 'Review the draft and leave feedback.',
    status: hasPrototype 
      ? (hasStartedReview || isFinalApproved ? 'completed' : 'current') 
      : 'upcoming',
    action: hasPrototype && prototypeUrl && !hasStartedReview && !isFinalApproved ? {
      label: 'View Preview',
      onClick: onViewPrototype,
    } : undefined,
  };

  // Step 4: Revisions
  const revisionsComplete = hasPrototype && openCommentsCount === 0 && resolvedCommentsCount > 0;
  const revisionsInProgress = hasPrototype && openCommentsCount > 0;
  const revisionsStep: RoadmapStep = {
    id: 'revisions',
    label: 'Revisions',
    description: revisionsComplete || isFinalApproved
      ? 'All feedback has been addressed.'
      : revisionsInProgress
        ? `We'll resolve your notes — ${openCommentsCount} open · ${resolvedCommentsCount} resolved`
        : 'We\'ll refine based on your feedback.',
    status: revisionsComplete || isFinalApproved
      ? 'completed' 
      : (hasStartedReview ? 'current' : 'upcoming'),
  };

  // Step 5: Final Approval (Launch is the action, not a step)
  const canApproveFinal = revisionsComplete && !isFinalApproved && !isCompleted;
  const finalStep: RoadmapStep = {
    id: 'final',
    label: 'Final Approval',
    description: isCompleted
      ? 'Your site is live!'
      : isFinalApproved 
        ? 'Approved — preparing for launch.' 
        : 'Approve the final version for launch.',
    status: isCompleted ? 'completed' : (isFinalApproved ? 'completed' : (revisionsComplete ? 'current' : 'upcoming')),
    action: canApproveFinal && onApproveFinal ? {
      label: 'Approve for Launch',
      onClick: onApproveFinal,
    } : undefined,
    meta: isFinalApproved && finalApprovedAt 
      ? `Approved ${new Date(finalApprovedAt).toLocaleDateString()}` 
      : isCompleted
        ? 'Launched'
        : undefined,
  };

  return [intakeStep, buildStep, previewStep, revisionsStep, finalStep];
}
