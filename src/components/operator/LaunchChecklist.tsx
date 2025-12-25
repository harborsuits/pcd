import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Loader2, 
  Trash2, 
  Rocket, 
  CheckCircle2,
  ListChecks
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/adminFetch";

interface ChecklistItem {
  id: string;
  label: string;
  is_done: boolean;
  completed_at: string | null;
  sort_order: number;
}

interface LaunchChecklistProps {
  projectToken: string;
}

const DEFAULT_CHECKLIST_ITEMS = [
  "Domain connected",
  "Mobile responsive verified",
  "Forms tested",
  "SEO basics (title/description)",
  "Analytics installed",
  "Backup/export stored",
  "Final invoice confirmed",
];

export function LaunchChecklist({ projectToken }: LaunchChecklistProps) {
  const [newItemLabel, setNewItemLabel] = useState("");
  const queryClient = useQueryClient();

  // Fetch checklist items
  const { data: checklistData, isLoading } = useQuery({
    queryKey: ["project-checklist", projectToken],
    queryFn: async () => {
      const res = await adminFetch(`/admin/checklist/${projectToken}`);
      if (!res.ok) throw new Error("Failed to fetch checklist");
      return res.json() as Promise<{ items: ChecklistItem[] }>;
    },
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (label: string) => {
      const res = await adminFetch(`/admin/checklist/${projectToken}`, {
        method: "POST",
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-checklist", projectToken] });
      setNewItemLabel("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Toggle item mutation
  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemId, isDone }: { itemId: string; isDone: boolean }) => {
      const res = await adminFetch(`/admin/checklist/${projectToken}/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_done: isDone }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-checklist", projectToken] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await adminFetch(`/admin/checklist/${projectToken}/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-checklist", projectToken] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Add defaults mutation
  const addDefaultsMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch(`/admin/checklist/${projectToken}/defaults`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to add defaults");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-checklist", projectToken] });
      toast.success("Default checklist added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const items = checklistData?.items || [];
  const completedCount = items.filter(i => i.is_done).length;
  const totalCount = items.length;
  const allDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="h-full flex flex-col p-3">
      <div className="flex-shrink-0 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Launch Checklist</h3>
          {totalCount > 0 && (
            <Badge 
              variant={allDone ? "default" : "secondary"} 
              className={`text-xs ${allDone ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}`}
            >
              {completedCount}/{totalCount}
            </Badge>
          )}
        </div>
        {items.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => addDefaultsMutation.mutate()}
            disabled={addDefaultsMutation.isPending}
          >
            {addDefaultsMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <ListChecks className="h-3 w-3 mr-1" />
            )}
            Add Defaults
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Rocket className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No checklist items</p>
            <p className="text-xs mt-1">Add defaults or create your own</p>
          </div>
        ) : (
          <div className="space-y-1 pr-2">
            {items.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group ${
                  item.is_done ? "opacity-60" : ""
                }`}
              >
                <Checkbox
                  checked={item.is_done}
                  onCheckedChange={(checked) => 
                    toggleItemMutation.mutate({ itemId: item.id, isDone: !!checked })
                  }
                  disabled={toggleItemMutation.isPending}
                />
                <span className={`flex-1 text-sm ${item.is_done ? "line-through text-muted-foreground" : ""}`}>
                  {item.label}
                </span>
                {item.is_done && (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteItemMutation.mutate(item.id)}
                  disabled={deleteItemMutation.isPending}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Add item input */}
      <div className="flex-shrink-0 pt-2 border-t border-border mt-2 flex gap-2">
        <Input
          value={newItemLabel}
          onChange={(e) => setNewItemLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newItemLabel.trim()) {
              addItemMutation.mutate(newItemLabel.trim());
            }
          }}
          placeholder="Add checklist item..."
          className="flex-1 h-8 text-sm"
        />
        <Button
          size="sm"
          className="h-8"
          onClick={() => {
            if (newItemLabel.trim()) {
              addItemMutation.mutate(newItemLabel.trim());
            }
          }}
          disabled={!newItemLabel.trim() || addItemMutation.isPending}
        >
          {addItemMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}