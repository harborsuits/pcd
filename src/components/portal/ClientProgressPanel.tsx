import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  Loader2,
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
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header with progress */}
      <div className="p-6 border-b border-border bg-gradient-to-b from-accent/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground">Project Progress</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} of {totalCount} milestones complete
            </p>
          </div>
          <div className="text-2xl font-bold text-accent">{progressPercent}%</div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {currentMilestone && (
          <p className="text-xs text-muted-foreground mt-2">
            Current: {currentMilestone.label}
          </p>
        )}
      </div>

      {/* Milestones List */}
      <div className="p-6 space-y-3">
        {milestones.map((milestone, index) => {
          const isCompleted = milestone.is_done;
          const isCurrent = currentMilestone?.id === milestone.id;
          
          return (
            <div 
              key={milestone.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                isCompleted 
                  ? "bg-accent/5 border border-accent/10" 
                  : isCurrent 
                    ? "bg-accent/10 border border-accent/20" 
                    : "bg-muted/50 border border-transparent"
              }`}
            >
              {/* Status Icon */}
              <div className="shrink-0 mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                ) : isCurrent ? (
                  <div className="relative">
                    <Circle className="h-5 w-5 text-accent" />
                    <div className="absolute inset-0 animate-ping">
                      <Circle className="h-5 w-5 text-accent opacity-30" />
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
                    <Badge variant="outline" className="text-[10px] h-4 border-accent/30 text-accent">
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
                  ? "bg-accent/10 text-accent" 
                  : isCurrent 
                    ? "bg-accent/10 text-accent" 
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
        <div className="px-6 pb-6">
          <p className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
            Last update: {format(new Date(lastCompleted.completed_at), "MMMM d, yyyy")}
          </p>
        </div>
      )}
    </div>
  );
}
