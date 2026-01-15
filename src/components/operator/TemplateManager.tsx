import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Pencil, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { operatorSupabase } from "@/integrations/supabase/operatorClient";

interface TemplateManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Template {
  id: string;
  name: string;
  body: string;
  is_active: boolean;
  created_at: string;
}

export function TemplateManager({ open, onOpenChange }: TemplateManagerProps) {
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formActive, setFormActive] = useState(true);
  
  const queryClient = useQueryClient();

  // Fetch all templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["all-sms-templates"],
    queryFn: async () => {
      const { data, error } = await operatorSupabase
        .from("sms_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Template[];
    },
    enabled: open,
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async ({ name, body }: { name: string; body: string }) => {
      const { error } = await operatorSupabase
        .from("sms_templates")
        .insert({ name, body, is_active: true });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template created");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["all-sms-templates"] });
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, name, body, is_active }: { id: string; name: string; body: string; is_active: boolean }) => {
      const { error } = await operatorSupabase
        .from("sms_templates")
        .update({ name, body, is_active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template updated");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["all-sms-templates"] });
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await operatorSupabase
        .from("sms_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template deleted");
      queryClient.invalidateQueries({ queryKey: ["all-sms-templates"] });
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => {
    setEditingTemplate(null);
    setIsCreating(false);
    setFormName("");
    setFormBody("");
    setFormActive(true);
  };

  const startEdit = (template: Template) => {
    setEditingTemplate(template);
    setIsCreating(false);
    setFormName(template.name);
    setFormBody(template.body);
    setFormActive(template.is_active);
  };

  const startCreate = () => {
    setEditingTemplate(null);
    setIsCreating(true);
    setFormName("");
    setFormBody("");
    setFormActive(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formBody.trim()) {
      toast.error("Name and body are required");
      return;
    }
    
    if (isCreating) {
      createMutation.mutate({ name: formName.trim(), body: formBody.trim() });
    } else if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        name: formName.trim(),
        body: formBody.trim(),
        is_active: formActive,
      });
    }
  };

  const isFormOpen = isCreating || !!editingTemplate;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Preview the template with sample data
  const previewBody = formBody
    .replace(/\{\{business_name\}\}/g, "Acme Corp")
    .replace(/\{\{demo_url\}\}/g, "https://example.com/demo/acme-corp");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Templates
          </DialogTitle>
          <DialogDescription>
            Manage your outreach message templates. Use {"{{business_name}}"} and {"{{demo_url}}"} as placeholders.
          </DialogDescription>
        </DialogHeader>

        {isFormOpen ? (
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Template Name</label>
              <Input
                placeholder="e.g., intro_v3"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message Body</label>
              <Textarea
                placeholder="Hi! I noticed {{business_name}} doesn't have a website..."
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                className="mt-1 min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formBody.length} characters • Max recommended: 160 for single SMS
              </p>
            </div>
            {formBody && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Preview:</p>
                <p className="text-sm">{previewBody}</p>
              </div>
            )}
            {editingTemplate && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={formActive}
                  onCheckedChange={setFormActive}
                />
                <label className="text-sm">Active (available for selection)</label>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isCreating ? "Create" : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{templates.length} templates</p>
              <Button size="sm" onClick={startCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No templates yet</p>
                <Button className="mt-4" onClick={startCreate}>
                  Create your first template
                </Button>
              </div>
            ) : (
              <ScrollArea className="flex-1 max-h-[400px]">
                <div className="space-y-3 py-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium font-mono">{template.name}</span>
                            {!template.is_active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {template.body}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(template)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Delete this template?")) {
                                deleteMutation.mutate(template.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
