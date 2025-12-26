import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  Loader2,
  Target,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface Milestone {
  id: string;
  label: string;
  description: string | null;
  is_done: boolean;
  completed_at: string | null;
  sort_order: number;
}

interface ClientProgressPanelProps {
  token: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function ClientProgressPanel({ token }: ClientProgressPanelProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchMilestones = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/portal/${token}/milestones`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );

        const data = await res.json();
        if (res.ok && data.milestones) {
          setMilestones(data.milestones);
        } else {
          setError(data.error || "Failed to load progress");
        }
      } catch (err) {
        console.error("Fetch milestones error:", err);
        setError("Could not load progress");
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [token]);

  const completedCount = milestones.filter(m => m.is_done).length;
  const totalCount = milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Find current milestone (first incomplete one)
  const currentMilestone = milestones.find(m => !m.is_done);
  const lastCompleted = [...milestones].reverse().find(m => m.is_done);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || milestones.length === 0) {
    return null; // Don't show panel if no milestones
  }

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Project Progress</h3>
        </div>
        <Badge 
          variant={completedCount === totalCount ? "default" : "secondary"}
          className={completedCount === totalCount ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
        >
          {completedCount}/{totalCount} Complete
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progressPercent}% complete</span>
          {currentMilestone && (
            <span>Current: {currentMilestone.label}</span>
          )}
        </div>
      </div>

      {/* Milestones List */}
      <div className="space-y-2">
        {milestones.map((milestone, index) => {
          const isCompleted = milestone.is_done;
          const isCurrent = currentMilestone?.id === milestone.id;
          
          return (
            <div 
              key={milestone.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                isCompleted 
                  ? "bg-green-500/5 border border-green-500/10" 
                  : isCurrent 
                    ? "bg-primary/5 border border-primary/20" 
                    : "bg-muted/50 border border-transparent"
              }`}
            >
              {/* Status Icon */}
              <div className="shrink-0 mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : isCurrent ? (
                  <div className="relative">
                    <Circle className="h-5 w-5 text-primary" />
                    <div className="absolute inset-0 animate-ping">
                      <Circle className="h-5 w-5 text-primary opacity-30" />
                    </div>
                  </div>
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/50" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-sm ${
                    isCompleted ? "text-muted-foreground" : ""
                  }`}>
                    {milestone.label}
                  </span>
                  {isCurrent && (
                    <Badge variant="outline" className="text-[10px] h-4 border-primary/30 text-primary">
                      In Progress
                    </Badge>
                  )}
                </div>
                {milestone.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {milestone.description}
                  </p>
                )}
                {milestone.completed_at && (
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Completed {format(new Date(milestone.completed_at), "MMM d, yyyy")}
                  </p>
                )}
              </div>

              {/* Step Number */}
              <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                isCompleted 
                  ? "bg-green-500/10 text-green-600" 
                  : isCurrent 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground"
              }`}>
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Last Update */}
      {lastCompleted?.completed_at && (
        <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Last update: {format(new Date(lastCompleted.completed_at), "MMMM d, yyyy")}
        </p>
      )}
    </div>
  );
}
