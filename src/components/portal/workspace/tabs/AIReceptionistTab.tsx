import { CheckCircle2, Clock, Settings2, Phone, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AIReceptionistTabProps {
  aiStatus: 'intake_received' | 'review' | 'setup' | 'testing' | 'live' | 'paused' | null;
  intakeData?: {
    business_phone?: string;
    business_hours?: string;
    services_offered?: string;
    call_handling?: string;
    handoff_method?: string;
    escalation_number?: string;
  } | null;
  onRequestChange?: () => void;
}

type AIStatusKey = 'intake_received' | 'review' | 'setup' | 'testing' | 'live' | 'paused';

const CALL_HANDLING_LABELS: Record<string, string> = {
  always: "Always answer",
  after_hours: "After hours only",
  overflow: "Overflow only",
};

const HANDOFF_LABELS: Record<string, string> = {
  transfer: "Transfer call",
  message: "Take message",
  callback: "Schedule callback",
  text: "Text follow-up",
};

function getAIStatusConfig(status: string | null): { 
  label: string; 
  Icon: typeof Clock; 
  colorClass: string; 
  headline: string;
  description: string;
  progressStep: number;
} {
  const configs: Record<AIStatusKey, ReturnType<typeof getAIStatusConfig>> = {
    intake_received: {
      label: "Received",
      Icon: Clock,
      colorClass: "bg-amber-500/10 text-amber-600 border-amber-200",
      headline: "We've received your setup",
      description: "Your AI receptionist configuration is in our queue. We'll start reviewing it shortly.",
      progressStep: 1,
    },
    review: {
      label: "Under Review",
      Icon: Clock,
      colorClass: "bg-amber-500/10 text-amber-600 border-amber-200",
      headline: "We're reviewing your configuration",
      description: "We're verifying your settings and phone number to make sure everything is correct.",
      progressStep: 2,
    },
    setup: {
      label: "Setting Up",
      Icon: Settings2,
      colorClass: "bg-blue-500/10 text-blue-600 border-blue-200",
      headline: "We're configuring your AI",
      description: "We're programming the AI with your business rules, FAQs, and preferences.",
      progressStep: 3,
    },
    testing: {
      label: "Testing",
      Icon: Phone,
      colorClass: "bg-purple-500/10 text-purple-600 border-purple-200",
      headline: "Testing in progress",
      description: "We're running sample calls to ensure everything works perfectly before going live.",
      progressStep: 4,
    },
    live: {
      label: "Live",
      Icon: CheckCircle2,
      colorClass: "bg-green-500/10 text-green-600 border-green-200",
      headline: "Your AI receptionist is live!",
      description: "Calls are being answered. You'll receive leads and summaries automatically.",
      progressStep: 5,
    },
    paused: {
      label: "Paused",
      Icon: AlertCircle,
      colorClass: "bg-muted text-muted-foreground border-border",
      headline: "Service paused",
      description: "Your AI receptionist is temporarily paused. Contact us to resume.",
      progressStep: 0,
    },
  };

  const key = (status as AIStatusKey) || 'intake_received';
  return configs[key] || configs.intake_received;
}

export function AIReceptionistTab({ aiStatus, intakeData, onRequestChange }: AIReceptionistTabProps) {
  const config = getAIStatusConfig(aiStatus);
  const StatusIcon = config.Icon;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Status Card */}
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-5 ${
            aiStatus === 'live' 
              ? 'bg-green-500/10 text-green-600' 
              : 'bg-primary/10 text-primary'
          }`}>
            <StatusIcon className="h-7 w-7" />
          </div>

          <h2 className="font-serif text-2xl font-bold mb-2">
            {config.headline}
          </h2>
          <p className="text-muted-foreground mb-6">
            {config.description}
          </p>

          {/* Progress steps - only show if not live */}
          {aiStatus !== 'live' && aiStatus !== 'paused' && (
            <div className="bg-muted/40 rounded-lg p-4 text-left text-sm space-y-3">
              <p className="font-medium text-foreground">Progress:</p>
              <div className="space-y-2">
                {[
                  { step: 1, label: "Intake received" },
                  { step: 2, label: "Configuration review" },
                  { step: 3, label: "AI setup" },
                  { step: 4, label: "Testing" },
                  { step: 5, label: "Live!" },
                ].map(({ step, label }) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                      step < config.progressStep 
                        ? 'bg-green-500 text-white' 
                        : step === config.progressStep 
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted-foreground/20 text-muted-foreground'
                    }`}>
                      {step < config.progressStep ? '✓' : step}
                    </div>
                    <span className={step <= config.progressStep ? 'text-foreground' : 'text-muted-foreground'}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Expected timeline: <span className="font-medium text-foreground">24–48 hours</span>
              </p>
            </div>
          )}

          {/* Live status - show dashboard preview */}
          {aiStatus === 'live' && (
            <div className="bg-green-500/5 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left text-sm">
              <p className="font-medium text-green-700 dark:text-green-400 mb-2">🎉 You're live!</p>
              <p className="text-muted-foreground">
                Your AI receptionist is actively answering calls. Leads and call summaries will appear here soon.
              </p>
            </div>
          )}
        </div>

        {/* Configuration Summary */}
        {intakeData && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Your submitted configuration
            </h3>
            
            <div className="space-y-3 text-sm">
              {intakeData.business_phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Business phone</span>
                  <span className="font-medium">{intakeData.business_phone}</span>
                </div>
              )}
              {intakeData.business_hours && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hours</span>
                  <span className="font-medium">{intakeData.business_hours}</span>
                </div>
              )}
              {intakeData.call_handling && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">When AI answers</span>
                  <span className="font-medium">{CALL_HANDLING_LABELS[intakeData.call_handling] || intakeData.call_handling}</span>
                </div>
              )}
              {intakeData.handoff_method && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Handoff method</span>
                  <span className="font-medium">{HANDOFF_LABELS[intakeData.handoff_method] || intakeData.handoff_method}</span>
                </div>
              )}
              {intakeData.escalation_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Escalation number</span>
                  <span className="font-medium">{intakeData.escalation_number}</span>
                </div>
              )}
              {intakeData.services_offered && (
                <div>
                  <span className="text-muted-foreground">Services</span>
                  <p className="font-medium mt-1 text-xs">{intakeData.services_offered}</p>
                </div>
              )}
            </div>

            {onRequestChange && (
              <div className="pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={onRequestChange}
                >
                  <AlertCircle className="h-4 w-4" />
                  Request a change
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground">
          Questions? Just reply to any email from us.
        </p>
      </div>
    </div>
  );
}
