import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

type Props = {
  status?: string;
  intakeStatus?: string; // 'pending' | 'submitted' | 'approved'
  discoveryStatus?: string; // 'pending' | 'scheduled' | 'completed'
  businessName?: string;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

// Phase 1A = Intake, Phase 1B = Discovery, Phase 2 = Build, Phase 3 = Launch
const STATUS_MAP: Record<string, { label: string; step: number; hint: string }> = {
  lead: { label: "Phase 1A: Intake", step: 1, hint: "Complete your intake so we can schedule a discovery meeting." },
  contacted: { label: "Phase 1B: Discovery", step: 2, hint: "Your intake is approved. We'll schedule a discovery meeting." },
  interested: { label: "Phase 1B: Discovery", step: 2, hint: "Discovery meeting in progress. We're scoping your project." },
  client: { label: "Phase 2: Build", step: 3, hint: "Your project is approved. We're building your site." },
  completed: { label: "Launched", step: 4, hint: "Your site is live. Use this portal for updates and support." },
  archived: { label: "Archived", step: 4, hint: "This project has been archived." },
};

const STEPS = [
  { label: "Intake", phase: "1A" },
  { label: "Discovery", phase: "1B" },
  { label: "Build", phase: "2" },
  { label: "Launch", phase: "3" },
];

export function ProjectStatusBanner({
  status = "lead",
  intakeStatus,
  discoveryStatus,
  businessName,
  onPrimaryAction,
  primaryActionLabel,
  secondaryActionLabel,
  onSecondaryAction,
}: Props) {
  const meta = STATUS_MAP[status] ?? STATUS_MAP.lead;

  // Determine more specific label based on intake/discovery status
  let displayLabel = meta.label;
  let displayHint = meta.hint;
  
  if (status === "lead" || status === "contacted") {
    if (intakeStatus === "pending") {
      displayLabel = "Phase 1A: Intake Required";
      displayHint = "Complete your intake to move forward.";
    } else if (intakeStatus === "submitted" && discoveryStatus !== "completed") {
      displayLabel = "Phase 1B: Discovery Pending";
      displayHint = "Intake submitted. We'll reach out to schedule a discovery meeting.";
    } else if (discoveryStatus === "scheduled") {
      displayLabel = "Phase 1B: Discovery Scheduled";
      displayHint = "Your discovery meeting is scheduled. We'll finalize scope and quote.";
    } else if (discoveryStatus === "completed") {
      displayLabel = "Phase 1B: Discovery Complete";
      displayHint = "Discovery complete. Awaiting approval to start build.";
    }
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-3 flex-1">
          {/* Status badge and step indicator */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {displayLabel}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Step {meta.step} of 4
              {businessName ? <> · {businessName}</> : null}
            </span>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => {
              const stepNum = i + 1;
              const isComplete = stepNum < meta.step;
              const isCurrent = stepNum === meta.step;
              
              return (
                <div key={step.label} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    isComplete ? "text-primary" : isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] ${
                        isCurrent ? "border-primary text-primary" : "border-muted-foreground/40"
                      }`}>
                        {step.phase}
                      </div>
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-4 sm:w-8 h-0.5 ${isComplete ? "bg-primary" : "bg-muted-foreground/20"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Hint text */}
          <p className="text-sm text-muted-foreground">{displayHint}</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {primaryActionLabel && onPrimaryAction && (
            <Button size="sm" onClick={onPrimaryAction}>
              {primaryActionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
