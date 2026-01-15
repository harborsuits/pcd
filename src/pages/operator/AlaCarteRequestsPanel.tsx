import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { operatorSupabase } from "@/integrations/supabase/operatorClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronRight, 
  ShoppingBag, 
  Mail, 
  Phone, 
  Globe, 
  Check, 
  User,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AlaCarteRequest {
  id: string;
  service_key: string;
  service_label: string;
  contact_method: string;
  contact_value: string;
  has_website: boolean | null;
  website_url: string | null;
  is_existing_client: boolean | null;
  note: string | null;
  status: string;
  handled_at: string | null;
  handled_by: string | null;
  created_at: string;
}

export function AlaCarteRequestsPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "handled">("new");
  const queryClient = useQueryClient();

  // Fetch à la carte requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["alacarte-requests"],
    queryFn: async () => {
      const { data, error } = await operatorSupabase
        .from("alacarte_requests")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as AlaCarteRequest[];
    },
    refetchInterval: 30000,
  });

  // Mark as handled mutation
  const handleMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await operatorSupabase
        .from("alacarte_requests")
        .update({ 
          status: "handled", 
          handled_at: new Date().toISOString(),
          handled_by: "operator"
        })
        .eq("id", requestId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request marked as handled");
      queryClient.invalidateQueries({ queryKey: ["alacarte-requests"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const allRequests = requests || [];
  const newRequests = allRequests.filter(r => r.status === "new");
  const handledRequests = allRequests.filter(r => r.status === "handled");
  const filteredRequests = statusFilter === "all" 
    ? allRequests 
    : statusFilter === "new" 
      ? newRequests 
      : handledRequests;

  const newCount = newRequests.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={newCount > 0 ? "border-primary/50" : ""}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <ShoppingBag className="h-5 w-5" />
                À La Carte Requests
                {newCount > 0 && (
                  <Badge variant="default" className="ml-2">
                    {newCount} new
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ({allRequests.length})</SelectItem>
                    <SelectItem value="new">New ({newCount})</SelectItem>
                    <SelectItem value="handled">Handled ({handledRequests.length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                {statusFilter === "new" 
                  ? "No new requests" 
                  : statusFilter === "handled" 
                    ? "No handled requests" 
                    : "No à la carte requests yet"}
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="text-sm">
                          {format(new Date(request.created_at), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-sm">{request.service_label}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            {request.contact_method === "email" ? (
                              <Mail className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <Phone className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="truncate max-w-[150px]">{request.contact_value}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.has_website ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Globe className="h-3 w-3 text-green-500" />
                              {request.website_url ? (
                                <a 
                                  href={request.website_url.startsWith("http") ? request.website_url : `https://${request.website_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline truncate max-w-[120px]"
                                >
                                  {request.website_url.replace(/^https?:\/\//, "")}
                                </a>
                              ) : (
                                <span>Yes</span>
                              )}
                            </div>
                          ) : request.has_website === false ? (
                            <span className="text-muted-foreground text-sm">No</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {request.is_existing_client === true ? (
                            <Badge variant="secondary" className="gap-1">
                              <User className="h-3 w-3" />
                              Existing
                            </Badge>
                          ) : request.is_existing_client === false ? (
                            <span className="text-sm text-muted-foreground">New</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {request.note ? (
                            <span 
                              className="text-sm text-muted-foreground truncate max-w-[150px] block" 
                              title={request.note}
                            >
                              {request.note}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={request.status === "new" ? "default" : "secondary"}
                          >
                            {request.status === "new" ? "New" : "Handled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.status === "new" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMutation.mutate(request.id)}
                              disabled={handleMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Done
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {request.handled_at && format(new Date(request.handled_at), "MMM d")}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
