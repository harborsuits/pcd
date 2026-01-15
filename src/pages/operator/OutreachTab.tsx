import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Inbox,
  Activity,
  ShieldOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Phone,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  Reply,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { operatorSupabase } from "@/integrations/supabase/operatorClient";
import { ConversationThread } from "@/components/operator/ConversationThread";
import { TemplateManager } from "@/components/operator/TemplateManager";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Lead {
  id: string;
  business_name: string;
  phone: string | null;
  phone_e164: string | null;
  demo_url: string | null;
  outreach_status: string | null;
  demo_review_status: string;
}

interface OutreachEvent {
  id: string;
  lead_id: string;
  channel: string;
  message: string | null;
  status: string;
  created_at: string;
  error: string | null;
  delivery_status: string | null;
  delivery_status_at: string | null;
  delivery_error_code: string | null;
  direction: string;
  seen_at: string | null;
  provider_message_id: string | null;
  leads: {
    id: string;
    business_name: string;
    phone: string | null;
    phone_e164: string | null;
  };
}

interface Suppression {
  id: string;
  phone: string;
  reason: string | null;
  created_at: string;
}

interface Template {
  id: string;
  name: string;
  body: string;
  is_active: boolean;
  created_at: string;
}

async function getAuthHeaders() {
  const { data: { session } } = await operatorSupabase.auth.getSession();
  return {
    Authorization: `Bearer ${session?.access_token || ""}`,
    "Content-Type": "application/json",
  };
}

export function OutreachTab() {
  const [activeSubTab, setActiveSubTab] = useState<"queue" | "activity" | "replies" | "suppression">("activity");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("intro_v1");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [suppressionSearch, setSuppressionSearch] = useState("");
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showConversation, setShowConversation] = useState<string | null>(null);
  const [showAddSuppression, setShowAddSuppression] = useState(false);
  const [newSuppressionPhone, setNewSuppressionPhone] = useState("");
  const [newSuppressionReason, setNewSuppressionReason] = useState("manual");
  
  const queryClient = useQueryClient();

  // Fetch leads ready for outreach (just needs phone, not suppressed)
  const { data: readyLeads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["outreach-ready-leads"],
    queryFn: async () => {
      const { data, error } = await operatorSupabase
        .from("leads")
        .select("id, business_name, phone, phone_e164, demo_url, outreach_status, demo_review_status")
        .not("phone", "is", null)
        .not("outreach_status", "in", "(sent,opted_out,queued)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Lead[];
    },
    staleTime: 30_000,
  });

  // Fetch all outreach events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["outreach-events", activityFilter],
    queryFn: async () => {
      let query = operatorSupabase
        .from("lead_outreach_events")
        .select(`
          id,
          lead_id,
          channel,
          message,
          status,
          created_at,
          error,
          delivery_status,
          delivery_status_at,
          delivery_error_code,
          direction,
          seen_at,
          provider_message_id,
          leads!inner(id, business_name, phone, phone_e164)
        `)
        .order("created_at", { ascending: false })
        .limit(500);

      if (activityFilter === "queued") query = query.eq("status", "queued");
      else if (activityFilter === "sent") query = query.eq("status", "sent");
      else if (activityFilter === "delivered") query = query.eq("delivery_status", "delivered");
      else if (activityFilter === "failed") query = query.or("status.eq.failed,delivery_status.eq.failed,delivery_status.eq.undelivered");
      else if (activityFilter === "inbound") query = query.eq("direction", "inbound");

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as OutreachEvent[];
    },
    staleTime: 15_000,
  });

  // Fetch inbound replies (for Replies tab)
  const { data: replies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ["outreach-replies"],
    queryFn: async () => {
      const { data, error } = await operatorSupabase
        .from("lead_outreach_events")
        .select(`
          id,
          lead_id,
          channel,
          message,
          status,
          created_at,
          error,
          direction,
          seen_at,
          provider_message_id,
          leads!inner(id, business_name, phone, phone_e164)
        `)
        .eq("direction", "inbound")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as unknown as OutreachEvent[];
    },
    staleTime: 15_000,
  });

  // Unread count
  const unreadCount = replies.filter(r => !r.seen_at).length;

  // Fetch suppressions
  const { data: suppressions = [], isLoading: suppressionsLoading } = useQuery({
    queryKey: ["outreach-suppressions"],
    queryFn: async () => {
      const { data, error } = await operatorSupabase
        .from("outreach_suppressions")
        .select("id, phone, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Suppression[];
    },
    staleTime: 60_000,
  });

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ["sms-templates"],
    queryFn: async () => {
      const { data, error } = await operatorSupabase
        .from("sms_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Template[];
    },
    staleTime: 60_000,
  });

  // Queue mutation - now passes template_id
  const queueMutation = useMutation({
    mutationFn: async ({ leadIds, templateId }: { leadIds: string[]; templateId: string }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/outreach/queue`, {
        method: "POST",
        headers,
        body: JSON.stringify({ lead_ids: leadIds, template_id: templateId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Queue failed");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Queued ${data.queued} leads for outreach`);
      if (data.skipped > 0) {
        toast.info(`Skipped ${data.skipped} leads`, {
          description: Object.entries(data.skipped_reasons || {})
            .map(([k, v]) => `${k}: ${v}`)
            .join(", "),
        });
      }
      setSelectedLeads(new Set());
      queryClient.invalidateQueries({ queryKey: ["outreach-ready-leads"] });
      queryClient.invalidateQueries({ queryKey: ["outreach-events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Send queued mutation
  const sendMutation = useMutation({
    mutationFn: async (limit: number) => {
      const headers = await getAuthHeaders();
      // Use admin key for SMS send
      const { data: { session } } = await operatorSupabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/sms/send`, {
        method: "POST",
        headers: {
          ...headers,
          "x-admin-key": import.meta.env.VITE_ADMIN_KEY || "",
        },
        body: JSON.stringify({ limit }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Send failed");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Sent ${data.sent} messages`, {
        description: data.failed > 0 ? `${data.failed} failed` : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["outreach-events"] });
      queryClient.invalidateQueries({ queryKey: ["outreach-ready-leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Mark as seen mutation
  const markSeenMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await operatorSupabase
        .from("lead_outreach_events")
        .update({ seen_at: new Date().toISOString() })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outreach-replies"] });
    },
  });

  // Add suppression mutation
  const addSuppressionMutation = useMutation({
    mutationFn: async ({ phone, reason }: { phone: string; reason: string }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/outreach/suppress`, {
        method: "POST",
        headers,
        body: JSON.stringify({ phone, reason }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to add suppression");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Added to suppression list");
      setShowAddSuppression(false);
      setNewSuppressionPhone("");
      queryClient.invalidateQueries({ queryKey: ["outreach-suppressions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Remove suppression mutation
  const removeSuppressionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await operatorSupabase
        .from("outreach_suppressions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed from suppression list");
      queryClient.invalidateQueries({ queryKey: ["outreach-suppressions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const queuedCount = events.filter(e => e.status === "queued").length;
  const filteredSuppressions = suppressions.filter(s =>
    s.phone.includes(suppressionSearch) || (s.reason || "").includes(suppressionSearch)
  );

  const getStatusBadge = (event: OutreachEvent) => {
    if (event.direction === "inbound") {
      return <Badge variant="secondary" className="gap-1"><MessageSquare className="h-3 w-3" />Reply</Badge>;
    }
    if (event.delivery_status === "delivered") {
      return <Badge className="gap-1 bg-green-500/20 text-green-700 hover:bg-green-500/30"><CheckCircle2 className="h-3 w-3" />Delivered</Badge>;
    }
    if (event.delivery_status === "failed" || event.delivery_status === "undelivered") {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
    }
    if (event.status === "failed") {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
    }
    if (event.status === "sent") {
      return <Badge className="gap-1 bg-blue-500/20 text-blue-700 hover:bg-blue-500/30"><Send className="h-3 w-3" />Sent</Badge>;
    }
    if (event.status === "queued") {
      return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Queued</Badge>;
    }
    return <Badge variant="outline">{event.status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Outreach Management</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateManager(true)}
          >
            Manage Templates
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["outreach-events"] });
              queryClient.invalidateQueries({ queryKey: ["outreach-replies"] });
              queryClient.invalidateQueries({ queryKey: ["outreach-ready-leads"] });
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as typeof activeSubTab)}>
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="queue" className="gap-2">
            <Send className="h-4 w-4" />Queue
            {queuedCount > 0 && <Badge variant="secondary" className="ml-1">{queuedCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />Activity
          </TabsTrigger>
          <TabsTrigger value="replies" className="gap-2">
            <Inbox className="h-4 w-4" />Replies
            {unreadCount > 0 && <Badge variant="destructive" className="ml-1">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="suppression" className="gap-2">
            <ShieldOff className="h-4 w-4" />Suppression
          </TabsTrigger>
        </TabsList>

        {/* Queue/Send Panel */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Queue Leads for Outreach</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Template:</span>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                      ))}
                      {templates.length === 0 && (
                        <>
                          <SelectItem value="intro_v1">intro_v1</SelectItem>
                          <SelectItem value="intro_v2">intro_v2</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => queueMutation.mutate({ leadIds: Array.from(selectedLeads), templateId: selectedTemplate })}
                  disabled={selectedLeads.size === 0 || queueMutation.isPending}
                >
                  {queueMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Queue {selectedLeads.size} Selected
                </Button>
                <Button
                  variant="default"
                  onClick={() => sendMutation.mutate(25)}
                  disabled={queuedCount === 0 || sendMutation.isPending}
                >
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Send {Math.min(queuedCount, 25)} Queued
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mb-2">
                Daily limit: 100/day, 25/hour. Templates use {"{{site_url}}"} → pleasantcovedesign.com
              </p>
              {leadsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : readyLeads.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No leads ready for outreach. Approve demos in the Leads tab first.</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selectedLeads.size === readyLeads.length && readyLeads.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLeads(new Set(readyLeads.map(l => l.id)));
                              } else {
                                setSelectedLeads(new Set());
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Business</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {readyLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedLeads.has(lead.id)}
                              onCheckedChange={(checked) => {
                                const next = new Set(selectedLeads);
                                if (checked) next.add(lead.id);
                                else next.delete(lead.id);
                                setSelectedLeads(next);
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{lead.business_name}</TableCell>
                          <TableCell className="font-mono text-sm">{lead.phone_e164 || lead.phone || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{lead.outreach_status || "ready"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Panel */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Outreach Activity</CardTitle>
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : events.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No outreach events yet.</p>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.id} className={event.direction === "inbound" ? "bg-muted/30" : ""}>
                          <TableCell className="font-medium">{event.leads.business_name}</TableCell>
                          <TableCell className="font-mono text-xs">{event.leads.phone_e164 || event.leads.phone || "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">{event.message || "—"}</TableCell>
                          <TableCell>{getStatusBadge(event)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-xs text-destructive max-w-[100px] truncate">
                            {event.error || event.delivery_error_code || "—"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowConversation(event.lead_id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Replies Panel */}
        <TabsContent value="replies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Inbound Replies
                {unreadCount > 0 && <Badge variant="destructive">{unreadCount} new</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {repliesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : replies.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No inbound replies yet.</p>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${!reply.seen_at ? "border-primary bg-primary/5" : ""}`}
                        onClick={() => {
                          if (!reply.seen_at) {
                            markSeenMutation.mutate(reply.id);
                          }
                          setShowConversation(reply.lead_id);
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{reply.leads.business_name}</span>
                              {!reply.seen_at && <Badge variant="destructive" className="text-xs">New</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground font-mono">
                              {reply.leads.phone_e164 || reply.leads.phone}
                            </p>
                            <p className="text-sm mt-1 line-clamp-2">{reply.message}</p>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowConversation(reply.lead_id);
                            }}
                          >
                            <Reply className="h-3 w-3 mr-1" />Reply
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const phone = reply.leads.phone_e164 || reply.leads.phone;
                              if (phone) {
                                addSuppressionMutation.mutate({ phone, reason: "manual" });
                              }
                            }}
                          >
                            <Ban className="h-3 w-3 mr-1" />Suppress
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppression Panel */}
        <TabsContent value="suppression" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Suppression List</CardTitle>
                <Button size="sm" onClick={() => setShowAddSuppression(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search by phone or reason..."
                value={suppressionSearch}
                onChange={(e) => setSuppressionSearch(e.target.value)}
              />
              {suppressionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredSuppressions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No suppressed contacts.</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppressions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono">{s.phone}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{s.reason || "opted_out"}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(s.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSuppressionMutation.mutate(s.id)}
                              disabled={removeSuppressionMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Manager Dialog */}
      <TemplateManager open={showTemplateManager} onOpenChange={setShowTemplateManager} />

      {/* Conversation Thread Dialog */}
      {showConversation && (
        <ConversationThread
          leadId={showConversation}
          open={!!showConversation}
          onOpenChange={(open) => !open && setShowConversation(null)}
        />
      )}

      {/* Add Suppression Dialog */}
      <Dialog open={showAddSuppression} onOpenChange={setShowAddSuppression}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Suppression List</DialogTitle>
            <DialogDescription>
              This phone number will not receive any future outreach messages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                placeholder="+1234567890"
                value={newSuppressionPhone}
                onChange={(e) => setNewSuppressionPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Select value={newSuppressionReason} onValueChange={setNewSuppressionReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="opted_out">Opted Out</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="invalid">Invalid Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSuppression(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addSuppressionMutation.mutate({ phone: newSuppressionPhone, reason: newSuppressionReason })}
              disabled={!newSuppressionPhone.trim() || addSuppressionMutation.isPending}
            >
              {addSuppressionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
