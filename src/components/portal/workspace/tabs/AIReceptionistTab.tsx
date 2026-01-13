import { useState, useEffect } from "react";
import { CheckCircle2, Clock, Settings2, Phone, AlertCircle, FileText, Calendar, TrendingUp, PhoneForwarded, Moon, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

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
  projectToken?: string;
}

type AIStatusKey = 'intake_received' | 'review' | 'setup' | 'testing' | 'live' | 'paused';

interface AIEvent {
  id: string;
  event_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface AIStats {
  callsAnswered: number;
  appointmentsBooked: number;
  escalations: number;
  afterHours: number;
  avgDuration: number;
}

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

const EVENT_ICONS: Record<string, typeof Phone> = {
  ai_call_completed: Phone,
  ai_call_started: Phone,
  ai_call_missed: Phone,
  ai_appointment_booked: Calendar,
  ai_booking_failed: AlertCircle,
  ai_escalation_triggered: PhoneForwarded,
  ai_message_taken: FileText,
  ai_voicemail_received: FileText,
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

function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }
  return format(date, 'MMM d, h:mm a');
}

function formatEventDescription(event: AIEvent): string {
  const meta = event.metadata || {};
  const phone = (meta.caller_phone_masked as string) || "a caller";
  
  switch (event.event_name) {
    case "ai_call_completed":
      const duration = meta.duration_seconds as number;
      const durationStr = duration ? ` (${Math.round(duration / 60)} min)` : "";
      return `AI answered a call from ${phone}${durationStr}`;
    case "ai_call_started":
      return `AI started call with ${phone}`;
    case "ai_call_missed":
      return `Missed call from ${phone}`;
    case "ai_appointment_booked":
      const scheduledFor = meta.scheduled_for as string;
      const service = meta.service as string;
      const timeStr = scheduledFor ? ` for ${format(new Date(scheduledFor), 'EEE h:mm a')}` : "";
      return `Booked appointment${service ? ` (${service})` : ""}${timeStr}`;
    case "ai_booking_failed":
      const errorMsg = meta.error_message as string;
      return `Booking failed${errorMsg ? `: ${errorMsg}` : ""}`;
    case "ai_escalation_triggered":
      const reason = meta.reason as string;
      return `Escalated call from ${phone}${reason ? ` — ${reason}` : ""}`;
    case "ai_message_taken":
      const preview = meta.message_preview as string;
      return `Message from ${phone}${preview ? `: "${preview.slice(0, 50)}${preview.length > 50 ? "..." : ""}"` : ""}`;
    case "ai_voicemail_received":
      return `Voicemail from ${phone}`;
    default:
      return event.event_name.replace(/^ai_/, "").replace(/_/g, " ");
  }
}

function StatCard({ label, value, icon: Icon, trend }: { 
  label: string; 
  value: string | number; 
  icon: typeof Phone;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function AIReceptionistTab({ aiStatus, intakeData, onRequestChange, projectToken }: AIReceptionistTabProps) {
  const config = getAIStatusConfig(aiStatus);
  const StatusIcon = config.Icon;
  
  const [events, setEvents] = useState<AIEvent[]>([]);
  const [stats, setStats] = useState<AIStats>({
    callsAnswered: 0,
    appointmentsBooked: 0,
    escalations: 0,
    afterHours: 0,
    avgDuration: 0,
  });
  const [loading, setLoading] = useState(false);

  // Fetch AI events via portal edge function (token-based access)
  useEffect(() => {
    if (!projectToken || aiStatus !== 'live') return;
    
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal/${projectToken}/ai-events`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        
        if (!res.ok) {
          console.error('Error fetching AI events:', res.status);
          return;
        }
        
        const data = await res.json();
        
        // Set events
        setEvents((data.events || []) as AIEvent[]);
        
        // Set stats from server response
        if (data.stats) {
          setStats({
            callsAnswered: data.stats.callsAnswered || 0,
            appointmentsBooked: data.stats.appointmentsBooked || 0,
            escalations: data.stats.escalations || 0,
            afterHours: data.stats.afterHours || 0,
            avgDuration: data.stats.avgDuration || 0,
          });
        }
      } catch (err) {
        console.error('Error fetching AI events:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [projectToken, aiStatus]);

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

          {/* Live status - show stats */}
          {aiStatus === 'live' && (
            <div className="bg-green-500/5 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left text-sm">
              <p className="font-medium text-green-700 dark:text-green-400 mb-2">🎉 You're live!</p>
              <p className="text-muted-foreground">
                Your AI receptionist is actively answering calls. See your stats and activity below.
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards - only show when live */}
        {aiStatus === 'live' && projectToken && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard 
              label="Calls Answered" 
              value={stats.callsAnswered} 
              icon={Phone}
            />
            <StatCard 
              label="Appointments" 
              value={stats.appointmentsBooked} 
              icon={Calendar}
            />
            <StatCard 
              label="Escalations" 
              value={stats.escalations} 
              icon={PhoneForwarded}
            />
            <StatCard 
              label="After Hours" 
              value={stats.afterHours} 
              icon={Moon}
            />
            <StatCard 
              label="Avg Duration" 
              value={stats.avgDuration > 0 ? `${Math.round(stats.avgDuration / 60)}m` : "—"} 
              icon={Timer}
            />
          </div>
        )}

        {/* Recent Activity - only show when live */}
        {aiStatus === 'live' && projectToken && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Recent Activity
              <Badge variant="outline" className="text-xs ml-auto">Last 7 days</Badge>
            </h3>
            
            {loading ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Loading activity...
              </div>
            ) : events.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No calls yet.</p>
                <p className="text-xs mt-1">Your AI will start answering soon.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => {
                  const Icon = EVENT_ICONS[event.event_name] || Phone;
                  return (
                    <div key={event.id} className="flex items-start gap-3 text-sm">
                      <div className={`mt-0.5 p-1.5 rounded-full ${
                        event.event_name === 'ai_escalation_triggered' 
                          ? 'bg-amber-500/10 text-amber-600'
                          : event.event_name === 'ai_booking_failed'
                            ? 'bg-destructive/10 text-destructive'
                            : event.event_name === 'ai_appointment_booked'
                              ? 'bg-green-500/10 text-green-600'
                              : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground">{formatEventDescription(event)}</p>
                        <p className="text-xs text-muted-foreground">{formatEventTime(event.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
