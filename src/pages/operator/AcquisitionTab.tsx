import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Globe, Phone, MapPin, ExternalLink, Loader2, 
  Rocket, Copy, Check, MessageSquare, Send, Clock, 
  RefreshCw, Building2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PUBLIC_BASE_URL = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;

interface Lead {
  id: string;
  place_id: string;
  business_name: string;
  phone: string | null;
  phone_raw: string | null;
  phone_e164: string | null;
  website: string | null;
  address: string | null;
  category: string | null;
  lead_score: number;
  demo_status: string;
  demo_url: string | null;
  outreach_status: string;
  created_at: string;
}

interface OutreachEvent {
  id: string;
  lead_id: string;
  channel: string;
  status: string;
  message: string | null;
  created_at: string;
  lead?: {
    business_name: string;
    phone_e164: string | null;
  };
}

interface SearchAndGenerateResult {
  run_id: string | null;
  total_found: number;
  no_website_count: number;
  demos_created: number;
  queued_count: number;
  results: Array<{
    lead_id: string;
    business_name: string;
    phone_e164: string | null;
    demo_url: string | null;
    status: string;
  }>;
}

function getBestPhone(lead: Lead): string | null {
  return lead.phone_e164 || lead.phone_raw || lead.phone;
}

export function AcquisitionTab() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("24140");
  const [maxDemos, setMaxDemos] = useState("10");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch leads with demos
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ["ops-leads"],
    queryFn: async () => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/leads?no_website=true&limit=100`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json() as Promise<{ leads: Lead[] }>;
    },
    refetchInterval: 30000,
  });

  // Fetch recent outreach events
  const { data: outreachData } = useQuery({
    queryKey: ["ops-outreach"],
    queryFn: async () => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/outreach?limit=50`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to fetch outreach");
      return res.json() as Promise<{ events: OutreachEvent[] }>;
    },
    refetchInterval: 30000,
  });

  // Search and generate mutation
  const searchAndGenerateMutation = useMutation({
    mutationFn: async () => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/leads/search-and-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          query,
          location,
          radius_m: parseInt(radius, 10),
          max_demos: parseInt(maxDemos, 10),
          queue_outreach: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Pipeline failed");
      }
      return res.json() as Promise<SearchAndGenerateResult>;
    },
    onSuccess: (data) => {
      toast.success(`Created ${data.demos_created} demos, queued ${data.queued_count} for outreach`);
      queryClient.invalidateQueries({ queryKey: ["ops-leads"] });
      queryClient.invalidateQueries({ queryKey: ["ops-outreach"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Send SMS mutation
  const sendSmsMutation = useMutation({
    mutationFn: async () => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ action: "send_queued" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "SMS send failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Sent ${data.sent || 0} SMS messages`);
      queryClient.invalidateQueries({ queryKey: ["ops-outreach"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Generate demo for single lead
  const generateDemoMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/leads/${leadId}/generate-demo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate demo");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Demo created");
      queryClient.invalidateQueries({ queryKey: ["ops-leads"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const copyDemoLink = (lead: Lead) => {
    if (!lead.demo_url) return;
    navigator.clipboard.writeText(`${PUBLIC_BASE_URL}${lead.demo_url}`);
    setCopiedId(lead.id);
    toast.success("Demo link copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const leads = leadsData?.leads || [];
  const leadsWithDemos = leads.filter(l => l.demo_status === "created");
  const leadsReadyForDemo = leads.filter(l => l.demo_status !== "created" && !l.website);
  const outreachEvents = outreachData?.events || [];
  const queuedEvents = outreachEvents.filter(e => e.status === "queued");
  const sentEvents = outreachEvents.filter(e => e.status === "sent");

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="gap-1">
          <Building2 className="h-3 w-3" />
          {leads.length} leads
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {queuedEvents.length} queued
        </Badge>
      </div>

      {/* Search Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label className="sr-only">Occupation</Label>
              <Input
                placeholder="Occupation (e.g., roofers)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="sr-only">Location</Label>
              <Input
                placeholder="City, State (e.g., Portland, ME)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Select value={radius} onValueChange={setRadius}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8047">5 mi</SelectItem>
                <SelectItem value="16093">10 mi</SelectItem>
                <SelectItem value="24140">15 mi</SelectItem>
                <SelectItem value="32187">20 mi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={maxDemos} onValueChange={setMaxDemos}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 max</SelectItem>
                <SelectItem value="10">10 max</SelectItem>
                <SelectItem value="20">20 max</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => searchAndGenerateMutation.mutate()}
              disabled={!query || !location || searchAndGenerateMutation.isPending}
            >
              {searchAndGenerateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Find & Generate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leads Table - 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Leads with Demos</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["ops-leads"] })}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {leadsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : leadsWithDemos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No demos generated yet. Use the search above to find leads.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Outreach</TableHead>
                        <TableHead className="w-[140px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leadsWithDemos.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div className="font-medium">{lead.business_name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {lead.address?.split(",").slice(0, 2).join(",")}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getBestPhone(lead) ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {getBestPhone(lead)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No phone</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                lead.outreach_status === "sent" ? "default" :
                                lead.outreach_status === "queued" ? "secondary" :
                                "outline"
                              }
                            >
                              {lead.outreach_status || "new"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {lead.demo_url && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyDemoLink(lead)}
                                  >
                                    {copiedId === lead.id ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                  >
                                    <a href={lead.demo_url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Pending Leads */}
          {leadsReadyForDemo.length > 0 && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Leads Without Demos ({leadsReadyForDemo.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[200px]">
                  <Table>
                    <TableBody>
                      {leadsReadyForDemo.slice(0, 10).map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.business_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {getBestPhone(lead) || "No phone"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateDemoMutation.mutate(lead.id)}
                              disabled={generateDemoMutation.isPending}
                            >
                              Generate Demo
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity Panel - 1 column */}
        <div className="space-y-4">
          {/* Send SMS Card */}
          <Card>
            <CardContent className="pt-6">
              <Button
                className="w-full"
                onClick={() => sendSmsMutation.mutate()}
                disabled={sendSmsMutation.isPending || queuedEvents.length === 0}
              >
                {sendSmsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send {queuedEvents.length} Queued SMS
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="queued">
                <div className="px-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="queued" className="flex-1">
                      Queued ({queuedEvents.length})
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="flex-1">
                      Sent ({sentEvents.length})
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="queued" className="mt-0">
                  <ScrollArea className="h-[250px]">
                    {queuedEvents.length === 0 ? (
                      <p className="text-center py-6 text-muted-foreground text-sm">
                        No queued messages
                      </p>
                    ) : (
                      <div className="divide-y">
                        {queuedEvents.slice(0, 20).map((event) => (
                          <div key={event.id} className="p-3">
                            <div className="font-medium text-sm">
                              {event.lead?.business_name || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {event.lead?.phone_e164 || "No phone"}
                            </div>
                            {event.message && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {event.message}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="sent" className="mt-0">
                  <ScrollArea className="h-[250px]">
                    {sentEvents.length === 0 ? (
                      <p className="text-center py-6 text-muted-foreground text-sm">
                        No sent messages yet
                      </p>
                    ) : (
                      <div className="divide-y">
                        {sentEvents.slice(0, 20).map((event) => (
                          <div key={event.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">
                                {event.lead?.business_name || "Unknown"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(event.created_at), "MMM d, h:mm a")}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {event.lead?.phone_e164}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
