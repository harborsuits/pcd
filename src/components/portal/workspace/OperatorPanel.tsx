import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ChevronDown, ChevronUp, CheckCircle2, Circle, Clock, Rocket, 
  FileText, MessageSquare, ExternalLink, Send, AlertCircle,
  Eye, EyeOff, StickyNote, ArrowRight, ClipboardList, HelpCircle,
  Upload, Image, Palette, MapPin, Phone, Calendar, Bot, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface PhaseBData {
  logoStatus?: "uploaded" | "create" | "help" | "" | null;
  brandColors?: string | null;
  colorPreference?: "pick_for_me" | "custom" | "" | null;
  businessDescription?: string | null;
  services?: string | null;
  serviceArea?: string | null;
  differentiators?: string | null;
  faq?: string | null;
  primaryGoal?: "book" | "quote" | "call" | "portfolio" | "learn" | "visit" | "" | null;
  photosPlan?: "upload" | "generate" | "none" | "help" | "" | null;
  photosUploaded?: number | null;
  generatedPhotoSubjects?: string | null;
  generatedPhotoStyle?: "realistic" | "studio" | "lifestyle" | "minimal" | "" | null;
  generatedPhotoNotes?: string | null;
  placeholderOk?: boolean | null;
  googleReviewsLink?: string | null;
  certifications?: string | null;
  hasBeforeAfter?: "yes" | "coming_soon" | "no" | "" | null;
  vibe?: "modern" | "classic" | "luxury" | "bold" | "minimal" | "cozy" | "" | null;
  tone?: "professional" | "friendly" | "direct" | "playful" | "" | null;
  exampleSites?: string | null;
  mustInclude?: string | null;
  mustAvoid?: string | null;
  contentNeedsHelp?: boolean;
  styleNeedsHelp?: boolean;
}

interface DiscoveryItem {
  id: string;
  key: string;
  label: string;
  checked: boolean;
  checked_at: string | null;
}

interface OperatorPanelProps {
  token: string;
  projectId?: string;
  intakeStatus: "draft" | "submitted" | "approved" | null;
  pipelineStage: string;
  portalStage: string;
  intakeData?: IntakeData | null;
  phaseBStatus?: 'pending' | 'in_progress' | 'complete' | null;
  phaseBData?: PhaseBData | null;
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

// Common request info items
const REQUEST_INFO_OPTIONS = [
  { key: "logo", label: "Upload your logo", icon: Palette },
  { key: "photos", label: "Upload 5-10 photos", icon: Image },
  { key: "services", label: "Confirm services list", icon: ClipboardList },
  { key: "service_area", label: "Confirm service area", icon: MapPin },
  { key: "contact", label: "Confirm contact details", icon: Phone },
  { key: "booking", label: "Booking/scheduling link", icon: Calendar },
  { key: "brand_colors", label: "Brand colors", icon: Palette },
];

export function OperatorPanel({
  token,
  projectId,
  intakeStatus,
  pipelineStage,
  portalStage,
  intakeData,
  phaseBStatus,
  phaseBData,
  onRefresh,
}: OperatorPanelProps) {
  const [intakeOpen, setIntakeOpen] = useState(true);
  const [phaseBOpen, setPhaseBOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [discoveryOpen, setDiscoveryOpen] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);
  const [selectedInfoItems, setSelectedInfoItems] = useState<string[]>([]);
  const [infoNote, setInfoNote] = useState("");
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

  // Fetch discovery checklist
  const { data: discoveryData, refetch: refetchDiscovery } = useQuery({
    queryKey: ["discovery-checklist", token],
    queryFn: async () => {
      const res = await adminFetch(`/admin/discovery/${token}`);
      if (!res.ok) return { items: [] };
      return res.json() as Promise<{ items: DiscoveryItem[] }>;
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

  // Seed discovery checklist
  const seedDiscoveryMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch(`/admin/discovery/${token}/seed`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to create checklist");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Discovery checklist created");
      refetchDiscovery();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Toggle discovery item
  const toggleDiscoveryMutation = useMutation({
    mutationFn: async ({ key, checked }: { key: string; checked: boolean }) => {
      const res = await adminFetch(`/admin/discovery/${token}/${key}`, {
        method: "PATCH",
        body: JSON.stringify({ checked }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      return res.json();
    },
    onSuccess: () => {
      refetchDiscovery();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Request info mutation
  const requestInfoMutation = useMutation({
    mutationFn: async () => {
      const items = selectedInfoItems.map((key) => {
        const opt = REQUEST_INFO_OPTIONS.find((o) => o.key === key);
        return { key, label: opt?.label || key, required: true };
      });
      const res = await adminFetch(`/admin/projects/${token}/request-info`, {
        method: "POST",
        body: JSON.stringify({ items, note: infoNote }),
      });
      if (!res.ok) throw new Error("Failed to request info");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Info requested from client");
      setRequestInfoOpen(false);
      setSelectedInfoItems([]);
      setInfoNote("");
      onRefresh();
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
  const discoveryItems = discoveryData?.items || [];
  const nextStage = getNextStage(pipelineStage);
  const checkedCount = discoveryItems.filter((i) => i.checked).length;

  return (
    <div className="h-full flex flex-col">
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

              {/* Request Info button */}
              <Dialog open={requestInfoOpen} onOpenChange={setRequestInfoOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1">
                    <HelpCircle className="h-3 w-3" />
                    Request Info
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Info from Client</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      {REQUEST_INFO_OPTIONS.map((opt) => (
                        <label
                          key={opt.key}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedInfoItems.includes(opt.key)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedInfoItems([...selectedInfoItems, opt.key]);
                              } else {
                                setSelectedInfoItems(selectedInfoItems.filter((k) => k !== opt.key));
                              }
                            }}
                          />
                          <opt.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    <Textarea
                      placeholder="Optional message to client..."
                      value={infoNote}
                      onChange={(e) => setInfoNote(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => requestInfoMutation.mutate()}
                      disabled={selectedInfoItems.length === 0 || requestInfoMutation.isPending}
                      className="gap-1"
                    >
                      <Send className="h-3 w-3" />
                      Send Request
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => window.open(`/p/${token}`, "_blank")}
                className="gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Portal
              </Button>
            </div>
          </div>

          {/* Discovery Checklist */}
          <Collapsible open={discoveryOpen} onOpenChange={setDiscoveryOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 text-xs font-medium">
                  <ClipboardList className="h-3 w-3" />
                  Discovery Checklist
                  {discoveryItems.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 text-xs px-1">
                      {checkedCount}/{discoveryItems.length}
                    </Badge>
                  )}
                </span>
                {discoveryOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {discoveryItems.length === 0 ? (
                <div className="text-center py-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => seedDiscoveryMutation.mutate()}
                    disabled={seedDiscoveryMutation.isPending}
                    className="gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    Create Checklist
                  </Button>
                </div>
              ) : (
                <div className="space-y-1 bg-background rounded-lg p-2 border">
                  {discoveryItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={(checked) => {
                          toggleDiscoveryMutation.mutate({ key: item.key, checked: !!checked });
                        }}
                      />
                      <span className={item.checked ? "line-through text-muted-foreground" : ""}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

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

          {/* Phase B Status */}
          <Collapsible open={phaseBOpen} onOpenChange={setPhaseBOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  Phase B (Execution Details)
                  {phaseBStatus === 'complete' && (
                    <Badge variant="secondary" className="ml-1 h-4 text-xs px-1 bg-green-500/10 text-green-600 border-green-200">
                      Complete
                    </Badge>
                  )}
                  {phaseBStatus === 'in_progress' && (
                    <Badge variant="secondary" className="ml-1 h-4 text-xs px-1 bg-amber-500/10 text-amber-600 border-amber-200">
                      In Progress
                    </Badge>
                  )}
                  {(!phaseBStatus || phaseBStatus === 'pending') && (
                    <Badge variant="secondary" className="ml-1 h-4 text-xs px-1">
                      Not Started
                    </Badge>
                  )}
                </span>
                {phaseBOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {(!phaseBStatus || phaseBStatus === 'pending') && !phaseBData ? (
                <div className="text-center py-4 text-sm bg-muted/50 rounded-lg border border-dashed">
                  <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground font-medium">Phase B not started yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting client input after intake approval</p>
                </div>
              ) : (
                <div className="space-y-2 text-sm bg-background rounded-lg p-3 border">
                  {/* Brand & Identity */}
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-1">Brand & Identity</div>
                    <div className="flex flex-wrap gap-1">
                      {phaseBData?.logoStatus === 'uploaded' && <Badge variant="secondary" className="text-xs"><Image className="h-3 w-3 mr-1" />Logo uploaded</Badge>}
                      {phaseBData?.logoStatus === 'create' && <Badge variant="outline" className="text-xs">Logo needed</Badge>}
                      {phaseBData?.logoStatus === 'help' && <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-200">Need help with logo</Badge>}
                      {phaseBData?.brandColors && <Badge variant="outline" className="text-xs font-mono">{phaseBData.brandColors}</Badge>}
                      {phaseBData?.colorPreference === 'pick_for_me' && <Badge variant="outline" className="text-xs">Pick colors for me</Badge>}
                      {!phaseBData?.logoStatus && !phaseBData?.brandColors && !phaseBData?.colorPreference && (
                        <span className="text-xs text-muted-foreground italic">Not provided</span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-1">Website Content</div>
                    {phaseBData?.contentNeedsHelp ? (
                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-200">Client needs help with content</Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {phaseBData?.businessDescription && <Badge variant="secondary" className="text-xs">Description ✓</Badge>}
                        {phaseBData?.services && <Badge variant="secondary" className="text-xs">Services ✓</Badge>}
                        {phaseBData?.serviceArea && <Badge variant="secondary" className="text-xs">Service area ✓</Badge>}
                        {!phaseBData?.businessDescription && !phaseBData?.services && !phaseBData?.serviceArea && (
                          <span className="text-xs text-muted-foreground italic">Not provided</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Photos */}
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-1">Photos & Proof</div>
                    <div className="flex flex-wrap gap-1">
                      {phaseBData?.photosPlan === 'upload' && <Badge variant="secondary" className="text-xs"><Upload className="h-3 w-3 mr-1" />{phaseBData.photosUploaded || 0} photos</Badge>}
                      {phaseBData?.photosPlan === 'generate' && <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-200"><Sparkles className="h-3 w-3 mr-1" />AI photos</Badge>}
                      {phaseBData?.photosPlan === 'none' && <Badge variant="outline" className="text-xs">Placeholders OK</Badge>}
                      {phaseBData?.photosPlan === 'help' && <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-200">Need help with photos</Badge>}
                      {phaseBData?.googleReviewsLink && <Badge variant="secondary" className="text-xs">Reviews linked</Badge>}
                      {phaseBData?.certifications && <Badge variant="secondary" className="text-xs">Certifications</Badge>}
                      {!phaseBData?.photosPlan && !phaseBData?.googleReviewsLink && !phaseBData?.certifications && (
                        <span className="text-xs text-muted-foreground italic">Not provided</span>
                      )}
                    </div>
                  </div>

                  {/* Style */}
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-1">Style & Preferences</div>
                    {phaseBData?.styleNeedsHelp ? (
                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-200">Just pick something good</Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {phaseBData?.vibe && <Badge variant="outline" className="text-xs capitalize">{phaseBData.vibe}</Badge>}
                        {phaseBData?.tone && <Badge variant="outline" className="text-xs capitalize">{phaseBData.tone}</Badge>}
                        {!phaseBData?.vibe && !phaseBData?.tone && (
                          <span className="text-xs text-muted-foreground italic">Not provided</span>
                        )}
                      </div>
                    )}
                  </div>
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