import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

type Props = {
  status?: string;
  businessName?: string;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

const STATUS_MAP: Record<string, { label: string; step: number; hint: string }> = {
  lead: { label: "Kickoff", step: 1, hint: "Complete your setup so we can start the first draft." },
  contacted: { label: "Getting Started", step: 1, hint: "We're reviewing your intake and preparing your first draft." },
  interested: { label: "Getting Started", step: 1, hint: "We're reviewing your intake and preparing your first draft." },
  client: { label: "Draft Ready", step: 2, hint: "Review the first version and tell us what to change." },
  completed: { label: "Launched", step: 4, hint: "Your site is live. Use this portal for updates and support." },
  archived: { label: "Archived", step: 4, hint: "This project has been archived." },
};

const STEPS = ["Intake", "Draft", "Review", "Launch"];

export function ProjectStatusBanner({
  status = "lead",
  businessName,
  onPrimaryAction,
  primaryActionLabel,
  secondaryActionLabel,
  onSecondaryAction,
}: Props) {
  const meta = STATUS_MAP[status] ?? STATUS_MAP.lead;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-3 flex-1">
          {/* Status badge and step indicator */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {meta.label}
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
                <div key={step} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    isComplete ? "text-primary" : isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] ${
                        isCurrent ? "border-primary text-primary" : "border-muted-foreground/40"
                      }`}>
                        {stepNum}
                      </div>
                    )}
                    <span className="hidden sm:inline">{step}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-4 sm:w-8 h-0.5 ${isComplete ? "bg-primary" : "bg-muted-foreground/20"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Hint text */}
          <p className="text-sm text-muted-foreground">{meta.hint}</p>
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
