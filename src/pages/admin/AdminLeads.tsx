import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Globe, Phone, MapPin, ExternalLink, SkipForward, Loader2, AlertCircle, Sparkles, Send, RefreshCw, Rocket } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
  lat: number;
  lng: number;
  lead_score: number;
  lead_reasons: string[];
  lead_enriched: Record<string, unknown> | null;
  demo_status: string;
  demo_url: string | null;
  industry_template: string | null;
  outreach_status: string;
  created_at: string;
}

// Helper to get best phone display
function getBestPhone(lead: Lead): string | null {
  return lead.phone_e164 || lead.phone_raw || lead.phone;
}

interface SearchResult {
  run_id: string | null;
  results: Lead[];
  total_found: number;
  processed: number;
}

interface SearchAndGenerateResult {
  run_id: string | null;
  total_found: number;
  no_website_count: number;
  demos_created: number;
  results: Array<{
    lead_id: string;
    business_name: string;
    demo_url: string | null;
    status: string;
  }>;
}

export default function AdminLeads() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem("admin_key") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("admin_key"));
  
  // Search form state
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("24140");
  const [maxDemos, setMaxDemos] = useState("20");
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);
  const [phoneMissing, setPhoneMissing] = useState(false);
  
  // Selection state for bulk actions
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  const handleLogin = () => {
    if (adminKey.trim()) {
      localStorage.setItem("admin_key", adminKey.trim());
      setIsAuthenticated(true);
    }
  };

  // Fetch existing leads
  const { data: leadsData, isLoading: leadsLoading, error: leadsError } = useQuery({
    queryKey: ["leads", noWebsiteOnly, phoneMissing],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (noWebsiteOnly) params.set("no_website", "true");
      if (phoneMissing) params.set("phone_missing", "true");
      params.set("limit", "100");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/leads?${params}`, {
        headers: {
          "x-admin-key": localStorage.getItem("admin_key") || "",
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          localStorage.removeItem("admin_key");
          setIsAuthenticated(false);
          throw new Error("Invalid admin key");
        }
        throw new Error("Failed to fetch leads");
      }

      return res.json() as Promise<{ leads: Lead[] }>;
    },
    enabled: isAuthenticated,
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/leads/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": localStorage.getItem("admin_key") || "",
        },
        body: JSON.stringify({
          query,
          location,
          radius_m: parseInt(radius, 10),
        }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          localStorage.removeItem("admin_key");
          setIsAuthenticated(false);
          throw new Error("Invalid admin key");
        }
        const err = await res.json();
        throw new Error(err.error || "Search failed");
      }

      return res.json() as Promise<SearchResult>;
    },
    onSuccess: (data) => {
      toast.success(`Found ${data.total_found} places, added ${data.processed} leads`);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Search-and-generate mutation (full pipeline)
  const searchAndGenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/leads/search-and-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": localStorage.getItem("admin_key") || "",
        },
        body: JSON.stringify({
          query,
          location,
          radius_m: parseInt(radius, 10),
          max_demos: parseInt(maxDemos, 10),
          queue_outreach: false,
        }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          localStorage.removeItem("admin_key");
          setIsAuthenticated(false);
          throw new Error("Invalid admin key");
        }
        const err = await res.json();
        throw new Error(err.error || "Pipeline failed");
      }

      return res.json() as Promise<SearchAndGenerateResult>;
    },
    onSuccess: (data) => {
      toast.success(
        `Found ${data.total_found} places → ${data.no_website_count} without websites → ${data.demos_created} demos created`
      );
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Generate demo mutation
  const generateDemoMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/leads/${leadId}/generate-demo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": localStorage.getItem("admin_key") || "",
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate demo");
      }

      return res.json() as Promise<{ ok: boolean; demo_url: string; template_slug: string }>;
    },
    onSuccess: (data) => {
      toast.success(`Demo created: ${data.template_slug}`);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Skip lead mutation
  const skipMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": localStorage.getItem("admin_key") || "",
        },
        body: JSON.stringify({ outreach_status: "skip" }),
      });

      if (!res.ok) {
        throw new Error("Failed to update lead");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead marked as skipped");
    },
    onError: () => {
      toast.error("Failed to skip lead");
    },
  });

  // Enrich lead mutation (Google Places data)
  const enrichMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/enrich-lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": localStorage.getItem("admin_key") || "",
        },
        body: JSON.stringify({ lead_id: leadId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to enrich lead");
      }

      return res.json() as Promise<{ 
        success: boolean; 
        enriched: { 
          rating?: number; 
          review_count?: number; 
          photo_count?: number;
          city?: string;
          state?: string;
        } 
      }>;
    },
    onSuccess: (data) => {
      const e = data.enriched;
      toast.success(`Enriched: ${e.rating ? `★${e.rating}` : ""} ${e.review_count ? `(${e.review_count} reviews)` : ""} ${e.photo_count ? `${e.photo_count} photos` : ""}`);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Queue to outreach mutation
  const queueOutreachMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/outreach/queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": localStorage.getItem("admin_key") || "",
        },
        body: JSON.stringify({ lead_ids: leadIds, template: "intro_v1" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to queue outreach");
      }

      return res.json() as Promise<{ ok: boolean; queued: number; skipped: number; skipped_reasons: Record<string, number> }>;
    },
    onSuccess: (data) => {
      toast.success(`Queued ${data.queued} leads, skipped ${data.skipped}`);
      setSelectedLeads(new Set());
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["outreach-events"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleSelectLead = (leadId: string) => {
    setSelectedLeads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = (leads: Lead[]) => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map((l) => l.id)));
    }
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Lead Engine Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminKey">Admin Key</Label>
              <Input
                id="adminKey"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin key"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              Access Lead Engine
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const leads = leadsData?.leads || [];
  const filteredLeads = leads.filter((l) => l.outreach_status !== "skip");
  const readyForOutreach = filteredLeads.filter(
    (l) => l.demo_status === "created" && l.phone && ["new", "created"].includes(l.outreach_status || "new")
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Lead Engine</h2>
        <p className="text-muted-foreground">Search for businesses and generate demos</p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Businesses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="query">Occupation / Keywords</Label>
              <Input
                id="query"
                placeholder="e.g., roofers, plumbers"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Portland, ME"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Radius</Label>
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8047">5 miles</SelectItem>
                  <SelectItem value="16093">10 miles</SelectItem>
                  <SelectItem value="24140">15 miles</SelectItem>
                  <SelectItem value="32187">20 miles</SelectItem>
                  <SelectItem value="48280">30 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDemos">Max Demos</Label>
              <Select value={maxDemos} onValueChange={setMaxDemos}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={() => searchMutation.mutate()}
                disabled={!query || !location || searchMutation.isPending || searchAndGenerateMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                {searchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() => searchAndGenerateMutation.mutate()}
                disabled={!query || !location || searchMutation.isPending || searchAndGenerateMutation.isPending}
                className="flex-1"
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
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <strong>Search</strong> just finds leads. <strong>Find & Generate</strong> finds leads without websites, enriches them, and creates demos automatically.
          </p>
        </CardContent>
      </Card>

      {/* Filters & Bulk Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="noWebsite"
              checked={noWebsiteOnly}
              onCheckedChange={setNoWebsiteOnly}
            />
            <Label htmlFor="noWebsite">No website only</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="phoneMissing"
              checked={phoneMissing}
              onCheckedChange={setPhoneMissing}
            />
            <Label htmlFor="phoneMissing">Phone missing</Label>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
          </div>
        </div>
        
        {selectedLeads.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedLeads.size} selected</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => queueOutreachMutation.mutate(Array.from(selectedLeads))}
              disabled={queueOutreachMutation.isPending}
            >
              {queueOutreachMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Queue to Outreach
            </Button>
          </div>
        )}
      </div>

      {/* Error state */}
      {leadsError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load leads. Please check your admin key.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          {leadsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No leads yet. Run a search to find businesses.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                      onCheckedChange={() => toggleSelectAll(filteredLeads)}
                    />
                  </TableHead>
                  <TableHead className="w-16">Score</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Demo</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.has(lead.id)}
                        onCheckedChange={() => toggleSelectLead(lead.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={lead.lead_score >= 70 ? "default" : lead.lead_score >= 30 ? "secondary" : "outline"}
                      >
                        {lead.lead_score}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.business_name}</div>
                        <div className="flex items-center gap-2">
                          {lead.category && (
                            <span className="text-xs text-muted-foreground capitalize">{lead.category}</span>
                          )}
                          {lead.industry_template && (
                            <Badge variant="outline" className="text-xs">
                              {lead.industry_template}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const displayPhone = getBestPhone(lead);
                        return displayPhone ? (
                          <a
                            href={`tel:${displayPhone.replace(/\s+/g, "")}`}
                            className="flex items-center gap-1 text-sm hover:underline"
                          >
                            <Phone className="h-3 w-3" />
                            {displayPhone}
                          </a>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            No phone
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm hover:underline text-primary"
                        >
                          <Globe className="h-3 w-3" />
                          View
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          No website
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.demo_status === "created" && lead.demo_url ? (
                        <a
                          href={lead.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm hover:underline text-green-600"
                        >
                          View Demo
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : lead.demo_status === "failed" ? (
                        <Badge variant="destructive" className="text-xs">Failed</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {/* Enrich button - show if place_id exists and not enriched */}
                        {lead.place_id && !lead.lead_enriched?.google_enriched && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => enrichMutation.mutate(lead.id)}
                            disabled={enrichMutation.isPending}
                            title="Enrich from Google"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            {enrichMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {/* Show enriched indicator */}
                        {lead.lead_enriched?.google_enriched && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                            ★{(lead.lead_enriched.rating as number)?.toFixed(1) || "—"}
                          </Badge>
                        )}
                        {lead.demo_status !== "created" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateDemoMutation.mutate(lead.id)}
                            disabled={generateDemoMutation.isPending}
                            title="Generate demo"
                          >
                            {generateDemoMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => skipMutation.mutate(lead.id)}
                          disabled={skipMutation.isPending}
                          title="Skip this lead"
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
