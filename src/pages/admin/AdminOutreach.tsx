import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Ban, CheckCircle, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface OutreachEvent {
  id: string;
  lead_id: string;
  channel: string;
  message: string;
  status: string;
  created_at: string;
  error: string | null;
  leads: {
    id: string;
    business_name: string;
    phone: string | null;
    demo_url: string | null;
    outreach_status: string;
  };
}

export default function AdminOutreach() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem("admin_key") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("admin_key"));
  const [statusFilter, setStatusFilter] = useState<string>("queued");

  const queryClient = useQueryClient();

  const handleLogin = () => {
    if (adminKey.trim()) {
      localStorage.setItem("admin_key", adminKey.trim());
      setIsAuthenticated(true);
    }
  };

  // Fetch outreach events
  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: ["outreach-events", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "100");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/outreach/events?${params}`, {
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
        throw new Error("Failed to fetch events");
      }

      return res.json() as Promise<{ events: OutreachEvent[] }>;
    },
    enabled: isAuthenticated,
  });

  // Mark as sent mutation
  const markSentMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/outreach/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": localStorage.getItem("admin_key") || "",
        },
        body: JSON.stringify({ status: "sent" }),
      });

      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outreach-events"] });
      toast.success("Marked as sent");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  // Suppress mutation
  const suppressMutation = useMutation({
    mutationFn: async ({ phone, leadId }: { phone: string; leadId: string }) => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/outreach/suppress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": localStorage.getItem("admin_key") || "",
        },
        body: JSON.stringify({ phone, lead_id: leadId, reason: "manual_suppress" }),
      });

      if (!res.ok) throw new Error("Failed to suppress");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outreach-events"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Phone suppressed");
    },
    onError: () => {
      toast.error("Failed to suppress phone");
    },
  });

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Outreach Queue Access</CardTitle>
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
              Access Outreach Queue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const events = eventsData?.events || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "queued":
        return <Badge variant="secondary">Queued</Badge>;
      case "sent":
        return <Badge className="bg-green-600">Sent</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "replied":
        return <Badge className="bg-blue-600">Replied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Outreach Queue</h2>
        <p className="text-muted-foreground">Review and manage outreach messages</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <Label>Status Filter</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="pt-6 text-sm text-muted-foreground">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load events. Please check your admin key.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No {statusFilter} messages. Queue leads from the Lead Engine.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Demo</TableHead>
                  <TableHead className="max-w-xs">Message Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.leads?.business_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {event.leads?.phone || "—"}
                    </TableCell>
                    <TableCell>
                      {event.leads?.demo_url ? (
                        <a
                          href={event.leads.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm hover:underline text-primary"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate" title={event.message}>
                        {event.message}
                      </p>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(event.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {event.status === "queued" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markSentMutation.mutate(event.id)}
                              disabled={markSentMutation.isPending}
                              title="Mark as sent"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (event.leads?.phone) {
                                  suppressMutation.mutate({
                                    phone: event.leads.phone,
                                    leadId: event.lead_id,
                                  });
                                }
                              }}
                              disabled={suppressMutation.isPending || !event.leads?.phone}
                              title="Suppress phone"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {event.status === "sent" && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
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
