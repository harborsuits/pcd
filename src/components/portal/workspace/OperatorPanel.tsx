import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ChevronDown, ChevronUp, CheckCircle2, Circle, Clock, Rocket, 
  FileText, MessageSquare, ExternalLink, Send, AlertCircle,
  Eye, EyeOff, StickyNote, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { adminFetch, getAdminKey } from "@/lib/adminFetch";
import { StageBadge, STAGE_CONFIG, PipelineStage, getNextStage } from "@/components/operator/StageBadge";

interface IntakeData {
  businessName?: string;
  businessType?: string;
  primaryGoal?: string;
  timeline?: string;
  assetsReadiness?: string;
  involvementPreference?: string;
}

interface OperatorPanelProps {
  token: string;
  projectId?: string;
  intakeStatus: "draft" | "submitted" | "approved" | null;
  pipelineStage: string;
  portalStage: string;
  intakeData?: IntakeData | null;
  onRefresh: () => void;
}

const GOAL_LABELS: Record<string, string> = {
  leads: "Get more leads & calls",
  sell: "Sell online",
  professional: "Look professional",
  explore: "Just exploring",
};

const TIMELINE_LABELS: Record<string, string> = {
  exploring: "Just exploring",
  soon: "Next 1-2 months",
  asap: "ASAP",
  deadline: "I have a deadline",
};

const ASSETS_LABELS: Record<string, string> = {
  ready: "I have everything",
  some: "I have some things",
  help: "I need help",
  unsure: "Not sure yet",
};

const INVOLVEMENT_LABELS: Record<string, string> = {
  hands_on: "I want to be hands-on",
  options: "Give me options to choose",
  handle: "Just handle it for me",
};

export function OperatorPanel({
  token,
  projectId,
  intakeStatus,
  pipelineStage,
  portalStage,
  intakeData,
  onRefresh,
}: OperatorPanelProps) {
  const [intakeOpen, setIntakeOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const queryClient = useQueryClient();

  // Fetch internal notes
  const { data: notesData } = useQuery({
    queryKey: ["operator-notes", token],
    queryFn: async () => {
      const res = await adminFetch(`/admin/projects/${token}/notes`);
      if (!res.ok) return { notes: [] };
      return res.json() as Promise<{ notes: Array<{ id: string; content: string; created_at: string; created_by?: string }> }>;
    },
    enabled: !!getAdminKey(),
  });

  // Approve intake mutation
  const approveIntakeMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch(`/admin/projects/${token}/intake/approve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to approve intake");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Intake approved");
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Advance stage mutation
  const advanceStageMutation = useMutation({
    mutationFn: async (stage: PipelineStage) => {
      const res = await adminFetch(`/admin/projects/${token}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Failed to update stage");
      return res.json();
    },
    onSuccess: (_, stage) => {
      const label = STAGE_CONFIG[stage]?.label || stage;
      toast.success(`Moved to ${label}`);
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await adminFetch(`/admin/projects/${token}/notes`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Note added");
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["operator-notes", token] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleApproveIntake = useCallback(() => {
    approveIntakeMutation.mutate();
  }, [approveIntakeMutation]);

  const handleAdvanceStage = useCallback(() => {
    const nextStage = getNextStage(pipelineStage);
    if (nextStage) {
      advanceStageMutation.mutate(nextStage);
    }
  }, [pipelineStage, advanceStageMutation]);

  const handleAddNote = useCallback(() => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote.trim());
  }, [newNote, addNoteMutation]);

  const notes = notesData?.notes || [];
  const nextStage = getNextStage(pipelineStage);

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* Header */}
      <div className="p-3 border-b border-border bg-amber-50 dark:bg-amber-950/30">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">Operator Mode</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Status + Stage */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase">Status</div>
            <div className="flex flex-wrap gap-2">
              {/* Intake status badge */}
              {intakeStatus === "submitted" && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Review
                </Badge>
              )}
              {intakeStatus === "approved" && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Intake Approved
                </Badge>
              )}
              {intakeStatus === "draft" && (
                <Badge variant="outline" className="text-muted-foreground">
                  <Circle className="h-3 w-3 mr-1" />
                  Draft
                </Badge>
              )}
              
              {/* Pipeline stage */}
              <StageBadge stage={pipelineStage as PipelineStage} />
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              {intakeStatus === "submitted" && (
                <Button 
                  size="sm" 
                  onClick={handleApproveIntake}
                  disabled={approveIntakeMutation.isPending}
                  className="gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Approve Intake
                </Button>
              )}
              
              {nextStage && intakeStatus === "approved" && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleAdvanceStage}
                  disabled={advanceStageMutation.isPending}
                  className="gap-1"
                >
                  <ArrowRight className="h-3 w-3" />
                  Move to {STAGE_CONFIG[nextStage]?.label || nextStage}
                </Button>
              )}

              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => window.open(`/p/${token}`, "_blank")}
                className="gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Open Portal
              </Button>
            </div>
          </div>

          {/* Intake Summary */}
          <Collapsible open={intakeOpen} onOpenChange={setIntakeOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 text-xs font-medium">
                  <FileText className="h-3 w-3" />
                  Intake Summary
                </span>
                {intakeOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {intakeData ? (
                <div className="space-y-2 text-sm bg-background rounded-lg p-3 border">
                  {intakeData.businessType && (
                    <div>
                      <div className="text-xs text-muted-foreground">Business Type</div>
                      <div className="capitalize">{intakeData.businessType.replace(/_/g, " ")}</div>
                    </div>
                  )}
                  {intakeData.primaryGoal && (
                    <div>
                      <div className="text-xs text-muted-foreground">Primary Goal</div>
                      <div>{GOAL_LABELS[intakeData.primaryGoal] || intakeData.primaryGoal}</div>
                    </div>
                  )}
                  {intakeData.timeline && (
                    <div>
                      <div className="text-xs text-muted-foreground">Timeline</div>
                      <div>{TIMELINE_LABELS[intakeData.timeline] || intakeData.timeline}</div>
                    </div>
                  )}
                  {intakeData.assetsReadiness && (
                    <div>
                      <div className="text-xs text-muted-foreground">Assets Ready</div>
                      <div>{ASSETS_LABELS[intakeData.assetsReadiness] || intakeData.assetsReadiness}</div>
                    </div>
                  )}
                  {intakeData.involvementPreference && (
                    <div>
                      <div className="text-xs text-muted-foreground">Involvement</div>
                      <div>{INVOLVEMENT_LABELS[intakeData.involvementPreference] || intakeData.involvementPreference}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 mx-auto mb-2 opacity-50" />
                  No intake data yet
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Internal Notes */}
          <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 text-xs font-medium">
                  <StickyNote className="h-3 w-3" />
                  Internal Notes
                  {notes.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 text-xs px-1">
                      {notes.length}
                    </Badge>
                  )}
                </span>
                {notesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              <div className="space-y-2">
                <Textarea
                  placeholder="Add an internal note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <Button 
                  size="sm" 
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addNoteMutation.isPending}
                  className="gap-1"
                >
                  <Send className="h-3 w-3" />
                  Add Note
                </Button>
              </div>
              
              {notes.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  {notes.slice(0, 5).map((note) => (
                    <div key={note.id} className="text-xs bg-background p-2 rounded border">
                      <p className="whitespace-pre-wrap">{note.content}</p>
                      <p className="text-muted-foreground mt-1">
                        {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}
