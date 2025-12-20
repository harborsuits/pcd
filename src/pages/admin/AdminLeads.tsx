import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Globe, Phone, MapPin, ExternalLink, SkipForward, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Lead {
  id: string;
  place_id: string;
  business_name: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  category: string | null;
  lat: number;
  lng: number;
  lead_score: number;
  lead_reasons: string[];
  demo_status: string;
  outreach_status: string;
  created_at: string;
}

interface SearchResult {
  run_id: string | null;
  results: Lead[];
  total_found: number;
  processed: number;
}

export default function AdminLeads() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem("admin_key") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("admin_key"));
  
  // Search form state
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("24140"); // 15 miles in meters
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);

  const queryClient = useQueryClient();

  // Handle admin login
  const handleLogin = () => {
    if (adminKey.trim()) {
      localStorage.setItem("admin_key", adminKey.trim());
      setIsAuthenticated(true);
    }
  };

  // Fetch existing leads
  const { data: leadsData, isLoading: leadsLoading, error: leadsError } = useQuery({
    queryKey: ["leads", noWebsiteOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (noWebsiteOnly) params.set("no_website", "true");
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
          <div className="grid gap-4 md:grid-cols-4">
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
            <div className="flex items-end">
              <Button
                onClick={() => searchMutation.mutate()}
                disabled={!query || !location || searchMutation.isPending}
                className="w-full"
              >
                {searchMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="noWebsite"
            checked={noWebsiteOnly}
            onCheckedChange={setNoWebsiteOnly}
          />
          <Label htmlFor="noWebsite">No website only</Label>
        </div>
        <div className="text-sm text-muted-foreground">
          {leads.length} lead{leads.length !== 1 ? "s" : ""}
        </div>
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
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No leads yet. Run a search to find businesses.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Score</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.filter(l => l.outreach_status !== "skip").map((lead) => (
                  <TableRow key={lead.id}>
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
                        {lead.category && (
                          <div className="text-xs text-muted-foreground capitalize">{lead.category}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-1 text-sm hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
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
                      {lead.address ? (
                        <div className="flex items-start gap-1 text-sm max-w-[200px]">
                          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="truncate" title={lead.address}>
                            {lead.address}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          title="Coming next"
                        >
                          Demo
                        </Button>
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
