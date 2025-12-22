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
import { Switch } from "@/components/ui/switch";
import { 
  Search, Globe, Phone, MapPin, ExternalLink, Loader2, 
  Rocket, Copy, Check, MessageSquare, Send, Clock, 
  RefreshCw, Building2, Wand2, Mail
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

interface SearchResult {
  lead_id: string;
  business_name: string;
  phone_e164: string | null;
  address?: string | null;
  demo_url: string | null;
  status: string;
}

interface SearchAndGenerateResult {
  run_id: string | null;
  total_found: number;
  no_website_count: number;
  demos_created: number;
  queued_count: number;
  results: SearchResult[];
  // Error case
  ok?: boolean;
  error?: string;
}

interface SearchStats {
  total: number;
  noWebsite: number;
  resultsCount: number;
  searchCompleted: boolean;
  errorMessage?: string;
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
  const [autoQueueOutreach, setAutoQueueOutreach] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  
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
      const res = await fetch(`${SUPABASE_URL}/functions/v1/outreach/events?limit=50`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to fetch outreach");
      return res.json() as Promise<{ events: OutreachEvent[] }>;
    },
    refetchInterval: 30000,
  });

  // Search mutation (search only, no auto-generate)
  const searchMutation = useMutation({
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
          queue_outreach: false, // Never auto-queue
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Search failed");
      }
      return res.json() as Promise<SearchAndGenerateResult>;
    },
    onSuccess: (data) => {
      setSearchResults(data.results || []);
      setSearchStats({ 
        total: data.total_found || 0, 
        noWebsite: data.no_website_count || 0,
        resultsCount: data.results?.length || 0,
        searchCompleted: true 
      });
      if (data.results?.length > 0) {
        toast.success(`Found ${data.results.length} leads without websites (${data.total_found} total)`);
      } else {
        toast.info(`Found ${data.total_found} businesses, but ${data.no_website_count} without websites passed filters`);
      }
      queryClient.invalidateQueries({ queryKey: ["ops-leads"] });
    },
    onError: (error: Error) => {
      setSearchStats({ 
        total: 0, 
        noWebsite: 0, 
        resultsCount: 0, 
        searchCompleted: true, 
        errorMessage: error.message 
      });
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
    onSuccess: (data, leadId) => {
      toast.success("Demo created");
      // Update search results to reflect the new demo
      setSearchResults(prev => prev.map(r => 
        r.lead_id === leadId ? { ...r, demo_url: data.demo_url, status: "created" } : r
      ));
      queryClient.invalidateQueries({ queryKey: ["ops-leads"] });

      // If auto-queue is enabled, queue outreach
      if (autoQueueOutreach && data.demo_url) {
        queueOutreachMutation.mutate(leadId);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Queue outreach for single lead
  const queueOutreachMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const adminKey = localStorage.getItem("admin_key") || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/outreach/queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ lead_id: leadId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to queue outreach");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Outreach queued");
      queryClient.invalidateQueries({ queryKey: ["ops-outreach"] });
      queryClient.invalidateQueries({ queryKey: ["ops-leads"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const copyDemoLink = (demoUrl: string, id: string) => {
    navigator.clipboard.writeText(`${PUBLIC_BASE_URL}${demoUrl}`);
    setCopiedId(id);
    toast.success("Demo link copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const leads = leadsData?.leads || [];
  const leadsWithDemos = leads.filter(l => l.demo_status === "created");
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
        {searchStats && (
          <Badge variant="secondary" className="gap-1">
            Last search: {searchStats.noWebsite}/{searchStats.total} no website
          </Badge>
        )}
      </div>

      {/* Search Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Leads
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-outreach" className="text-sm text-muted-foreground">
                Auto-queue outreach
              </Label>
              <Switch
                id="auto-outreach"
                checked={autoQueueOutreach}
                onCheckedChange={setAutoQueueOutreach}
              />
            </div>
          </div>
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
              onClick={() => searchMutation.mutate()}
              disabled={!query || !location || searchMutation.isPending}
            >
              {searchMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find Leads
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results - Always visible after search completes */}
      {searchStats?.searchCompleted && (
        <Card className={searchStats.errorMessage ? "border-destructive/50" : "border-primary/50"}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                Search Results
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {searchStats.total} found • {searchStats.noWebsite} no website • {searchStats.resultsCount} ready
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearchResults([]); setSearchStats(null); }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {searchStats.errorMessage ? (
              <div className="p-6 text-center text-destructive">
                <p className="font-medium">Search Failed</p>
                <p className="text-sm mt-1">{searchStats.errorMessage}</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <p className="font-medium">No results to display</p>
                <p className="text-sm mt-1">
                  Found {searchStats.total} businesses total, {searchStats.noWebsite} without websites.
                  {searchStats.noWebsite === 0 && " All businesses in this area have websites."}
                  {searchStats.noWebsite > 0 && searchStats.resultsCount === 0 && " Leads may be missing phone numbers or already exist."}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <Table>
                  <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((result) => (
                    <TableRow key={result.lead_id}>
                      <TableCell>
                        <div className="font-medium">{result.business_name}</div>
                        {result.address && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {result.address.split(",").slice(0, 2).join(",")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {result.phone_e164 ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {result.phone_e164}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No phone</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            result.status === "created" || result.demo_url ? "default" :
                            result.status === "existing" ? "secondary" :
                            "outline"
                          }
                        >
                          {result.demo_url ? "Demo Ready" : result.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {/* Generate Demo button */}
                          {!result.demo_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateDemoMutation.mutate(result.lead_id)}
                              disabled={generateDemoMutation.isPending}
                            >
                              <Wand2 className="h-4 w-4 mr-1" />
                              Demo
                            </Button>
                          )}
                          
                          {/* Copy Demo Link */}
                          {result.demo_url && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyDemoLink(result.demo_url!, result.lead_id)}
                              >
                                {copiedId === result.lead_id ? (
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
                                <a href={result.demo_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                              {/* Queue Outreach */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => queueOutreachMutation.mutate(result.lead_id)}
                                disabled={queueOutreachMutation.isPending}
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                Queue
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

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
                                    onClick={() => copyDemoLink(lead.demo_url!, lead.id)}
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
                                  {!lead.outreach_status || lead.outreach_status === "new" ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => queueOutreachMutation.mutate(lead.id)}
                                      disabled={queueOutreachMutation.isPending}
                                    >
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                  ) : null}
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
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="queued" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Queued ({queuedEvents.length})
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="gap-1">
                    <Send className="h-3 w-3" />
                    Sent ({sentEvents.length})
                  </TabsTrigger>
                </TabsList>
                <ScrollArea className="h-[250px]">
                  <TabsContent value="queued" className="m-0">
                    {queuedEvents.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No queued messages
                      </div>
                    ) : (
                      <div className="divide-y">
                        {queuedEvents.map((event) => (
                          <div key={event.id} className="p-3">
                            <div className="font-medium text-sm">
                              {event.lead?.business_name || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {event.lead?.phone_e164 || "No phone"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="sent" className="m-0">
                    {sentEvents.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No sent messages yet
                      </div>
                    ) : (
                      <div className="divide-y">
                        {sentEvents.map((event) => (
                          <div key={event.id} className="p-3">
                            <div className="font-medium text-sm">
                              {event.lead?.business_name || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>{event.lead?.phone_e164 || "No phone"}</span>
                              <span>•</span>
                              <span>{format(new Date(event.created_at), "MMM d, h:mm a")}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
