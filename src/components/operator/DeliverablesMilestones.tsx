import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Loader2, 
  Trash2, 
  CheckCircle2,
  Circle,
  Target,
  StickyNote,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Clock,
  Sparkles,
  Rocket,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/adminFetch";
import { format } from "date-fns";

interface Milestone {
  id: string;
  label: string;
  description: string | null;
  is_done: boolean;
  completed_at: string | null;
  sort_order: number;
  is_client_visible: boolean;
  notes: MilestoneNote[];
}

interface MilestoneNote {
  id: string;
  content: string;
  created_at: string;
  created_by: string | null;
}

interface DeliverablesMilestonesProps {
  projectToken: string;
  projectStatus?: string;
}

// Package templates with display info
const PACKAGE_TEMPLATES = [
  { id: "starter", label: "Starter", icon: Zap, description: "4 milestones" },
  { id: "growth", label: "Growth", icon: Sparkles, description: "6 milestones" },
  { id: "full_ops", label: "Full Ops", icon: Rocket, description: "9 milestones" },
] as const;

export function DeliverablesMilestones({ projectToken, projectStatus }: DeliverablesMilestonesProps) {
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const isLaunched = projectStatus === "completed";

  // Fetch milestones
  const { data: milestonesData, isLoading } = useQuery({
    queryKey: ["project-milestones", projectToken],
    queryFn: async () => {
      const res = await adminFetch(`/admin/milestones/${projectToken}`);
      if (!res.ok) {
        // If endpoint doesn't exist yet, return empty
        if (res.status === 404) return { milestones: [] };
        throw new Error("Failed to fetch milestones");
      }
      return res.json() as Promise<{ milestones: Milestone[] }>;
    },
  });

  // Add milestone mutation
  const addMilestoneMutation = useMutation({
    mutationFn: async ({ label, description }: { label: string; description?: string }) => {
      const res = await adminFetch(`/admin/milestones/${projectToken}`, {
        method: "POST",
        body: JSON.stringify({ label, description }),
      });
      if (!res.ok) throw new Error("Failed to add milestone");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectToken] });
      setNewItemLabel("");
      setNewItemDescription("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Toggle milestone mutation
  const toggleMilestoneMutation = useMutation({
    mutationFn: async ({ milestoneId, isDone }: { milestoneId: string; isDone: boolean }) => {
      const res = await adminFetch(`/admin/milestones/${projectToken}/${milestoneId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_done: isDone }),
      });
      if (!res.ok) throw new Error("Failed to update milestone");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectToken] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Toggle client visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ milestoneId, isVisible }: { milestoneId: string; isVisible: boolean }) => {
      const res = await adminFetch(`/admin/milestones/${projectToken}/${milestoneId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_client_visible: isVisible }),
      });
      if (!res.ok) throw new Error("Failed to update visibility");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectToken] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Delete milestone mutation
  const deleteMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      const res = await adminFetch(`/admin/milestones/${projectToken}/${milestoneId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete milestone");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectToken] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ milestoneId, content }: { milestoneId: string; content: string }) => {
      const res = await adminFetch(`/admin/milestones/${projectToken}/${milestoneId}/notes`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectToken] });
      setNewNoteContent(prev => ({ ...prev, [variables.milestoneId]: "" }));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Add defaults mutation with package support
  const addDefaultsMutation = useMutation({
    mutationFn: async (packageType: string) => {
      const res = await adminFetch(`/admin/milestones/${projectToken}/defaults`, {
        method: "POST",
        body: JSON.stringify({ package: packageType }),
      });
      if (!res.ok) throw new Error("Failed to add defaults");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectToken] });
      const pkgLabel = PACKAGE_TEMPLATES.find(p => p.id === data.package)?.label || data.package;
      toast.success(`${pkgLabel} template added (${data.count} milestones)`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const milestones = milestonesData?.milestones || [];
  const completedCount = milestones.filter(m => m.is_done).length;
  const totalCount = milestones.length;
  const allDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="h-full flex flex-col p-3">
      <div className="flex-shrink-0 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Milestones</h3>
          {totalCount > 0 && (
            <Badge 
              variant={allDone ? "default" : "secondary"} 
              className={`text-xs ${allDone ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}`}
            >
              {completedCount}/{totalCount}
            </Badge>
          )}
        </div>
        {milestones.length === 0 && !isLaunched && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                disabled={addDefaultsMutation.isPending}
              >
                {addDefaultsMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Plus className="h-3 w-3 mr-1" />
                )}
                Add Template
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {PACKAGE_TEMPLATES.map((pkg) => {
                const Icon = pkg.icon;
                return (
                  <DropdownMenuItem
                    key={pkg.id}
                    onClick={() => addDefaultsMutation.mutate(pkg.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="flex-1">{pkg.label}</span>
                    <span className="text-[10px] text-muted-foreground">{pkg.description}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : milestones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No milestones yet</p>
            <p className="text-xs mt-1">Track project progress with milestones</p>
          </div>
        ) : (
          <div className="space-y-2 pr-2">
            {milestones.map((milestone) => {
              const isExpanded = expandedMilestone === milestone.id;
              const noteCount = milestone.notes?.length || 0;
              
              return (
                <div 
                  key={milestone.id}
                  className={`rounded-lg border transition-colors ${
                    milestone.is_done 
                      ? "border-green-500/20 bg-green-500/5" 
                      : "border-border bg-card"
                  }`}
                >
                  {/* Milestone Header */}
                  <div className="flex items-center gap-2 p-2">
                    <button
                      onClick={() => toggleMilestoneMutation.mutate({ 
                        milestoneId: milestone.id, 
                        isDone: !milestone.is_done 
                      })}
                      disabled={toggleMilestoneMutation.isPending}
                      className="shrink-0"
                    >
                      {milestone.is_done ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${milestone.is_done ? "text-muted-foreground line-through" : ""}`}>
                          {milestone.label}
                        </span>
                        {milestone.is_client_visible && (
                          <Badge variant="outline" className="text-[10px] h-4">
                            Visible
                          </Badge>
                        )}
                        {noteCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-4">
                            <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
                            {noteCount}
                          </Badge>
                        )}
                      </div>
                      {milestone.description && (
                        <p className="text-xs text-muted-foreground truncate">{milestone.description}</p>
                      )}
                    </button>

                    <button
                      onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
                      className="shrink-0 p-1 hover:bg-muted rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/50">
                      {/* Meta Info */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {milestone.completed_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Completed {format(new Date(milestone.completed_at), "MMM d, yyyy")}
                          </span>
                        )}
                        <button
                          onClick={() => toggleVisibilityMutation.mutate({
                            milestoneId: milestone.id,
                            isVisible: !milestone.is_client_visible,
                          })}
                          className="hover:text-primary transition-colors"
                        >
                          {milestone.is_client_visible ? "Hide from client" : "Show to client"}
                        </button>
                        <button
                          onClick={() => deleteMilestoneMutation.mutate(milestone.id)}
                          className="hover:text-destructive transition-colors ml-auto"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Notes */}
                      {milestone.notes && milestone.notes.length > 0 && (
                        <div className="space-y-2">
                          {milestone.notes.map((note) => (
                            <div 
                              key={note.id}
                              className="p-2 bg-muted/50 rounded text-sm"
                            >
                              <p className="text-foreground">{note.content}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {format(new Date(note.created_at), "MMM d, h:mm a")}
                                {note.created_by && ` • ${note.created_by}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Note Input */}
                      <div className="flex gap-2">
                        <Input
                          value={newNoteContent[milestone.id] || ""}
                          onChange={(e) => setNewNoteContent(prev => ({ 
                            ...prev, 
                            [milestone.id]: e.target.value 
                          }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newNoteContent[milestone.id]?.trim()) {
                              addNoteMutation.mutate({
                                milestoneId: milestone.id,
                                content: newNoteContent[milestone.id].trim(),
                              });
                            }
                          }}
                          placeholder="Add a note..."
                          className="flex-1 h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8"
                          onClick={() => {
                            if (newNoteContent[milestone.id]?.trim()) {
                              addNoteMutation.mutate({
                                milestoneId: milestone.id,
                                content: newNoteContent[milestone.id].trim(),
                              });
                            }
                          }}
                          disabled={!newNoteContent[milestone.id]?.trim() || addNoteMutation.isPending}
                        >
                          {addNoteMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <StickyNote className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Add Milestone Input */}
      {!isLaunched && (
        <div className="flex-shrink-0 pt-2 border-t border-border mt-2 space-y-2">
          <div className="flex gap-2">
            <Input
              value={newItemLabel}
              onChange={(e) => setNewItemLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newItemLabel.trim()) {
                  addMilestoneMutation.mutate({ 
                    label: newItemLabel.trim(), 
                    description: newItemDescription.trim() || undefined 
                  });
                }
              }}
              placeholder="Add milestone..."
              className="flex-1 h-8 text-sm"
            />
            <Button
              size="sm"
              className="h-8"
              onClick={() => {
                if (newItemLabel.trim()) {
                  addMilestoneMutation.mutate({ 
                    label: newItemLabel.trim(), 
                    description: newItemDescription.trim() || undefined 
                  });
                }
              }}
              disabled={!newItemLabel.trim() || addMilestoneMutation.isPending}
            >
              {addMilestoneMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
          {newItemLabel.trim() && (
            <Input
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder="Description (optional)"
              className="h-7 text-xs"
            />
          )}
        </div>
      )}
    </div>
  );
}
