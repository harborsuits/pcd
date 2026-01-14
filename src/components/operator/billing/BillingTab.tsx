import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, CreditCard, Check, X, Send, ExternalLink, RefreshCw } from "lucide-react";
import { LineItemModal, LineItemFormData } from "./LineItemModal";
import { format } from "date-fns";

interface BillingTabProps {
  projectId: string;
  projectToken: string;
  clientAccountId: string | null;
  stripeCustomerId: string | null;
  contactEmail: string | null;
  contactName: string | null;
  depositStatus?: string | null;
}

type LineItemStatus = "proposed" | "accepted" | "invoiced" | "paid" | "cancelled" | "refunded";

interface LineItem {
  id: string;
  type: string;
  label: string;
  description: string | null;
  amount_cents: number;
  billing_mode: string;
  billing_interval: string | null;
  quantity: number;
  status: string;
  notes: string | null;
  created_at: string;
  accepted_at: string | null;
  invoiced_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
}

export function BillingTab({
  projectId,
  projectToken,
  clientAccountId,
  stripeCustomerId,
  contactEmail,
  contactName,
  depositStatus,
}: BillingTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch line items
  const { data: lineItems, isLoading: loadingItems } = useQuery({
    queryKey: ["line-items", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_line_items")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LineItem[];
    },
  });

  // Ensure customer mutation
  const ensureCustomerMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("billing", {
        body: {
          action: "ensure-customer",
          project_token: projectToken,
          email: contactEmail,
          name: contactName,
        },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Customer record created");
      queryClient.invalidateQueries({ queryKey: ["project", projectToken] });
    },
    onError: (error) => {
      toast.error(`Failed to create customer: ${error.message}`);
    },
  });

  // Add line item mutation
  const addLineItemMutation = useMutation({
    mutationFn: async (item: LineItemFormData) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.from("project_line_items").insert({
        project_id: projectId,
        project_token: projectToken,
        type: item.type,
        label: item.label,
        description: item.description || null,
        amount_cents: item.amount_cents,
        billing_mode: item.billing_mode,
        billing_interval: item.billing_interval || null,
        quantity: item.quantity,
        notes: item.notes || null,
        status: "proposed",
        created_by: session.user.email,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Line item added");
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ["line-items", projectId] });
    },
    onError: (error) => {
      toast.error(`Failed to add line item: ${error.message}`);
    },
  });

  // Update line item status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, timestamp }: { id: string; status: LineItemStatus; timestamp?: string }) => {
      const updates: Record<string, unknown> = { status };
      if (timestamp) {
        updates[timestamp] = new Date().toISOString();
      }

      const { error } = await supabase
        .from("project_line_items")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["line-items", projectId] });
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("billing", {
        body: {
          action: "create-invoice",
          project_token: projectToken,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Invoice created and sent!");
      if (data?.hosted_invoice_url) {
        window.open(data.hosted_invoice_url, "_blank");
      }
      queryClient.invalidateQueries({ queryKey: ["line-items", projectId] });
    },
    onError: (error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const groupedItems = {
    proposed: lineItems?.filter((i) => i.status === "proposed") || [],
    accepted: lineItems?.filter((i) => i.status === "accepted") || [],
    invoiced: lineItems?.filter((i) => i.status === "invoiced") || [],
    paid: lineItems?.filter((i) => i.status === "paid") || [],
    cancelled: lineItems?.filter((i) => i.status === "cancelled" || i.status === "refunded") || [],
  };

  const acceptedTotal = groupedItems.accepted.reduce(
    (sum, item) => sum + item.amount_cents * item.quantity,
    0
  );

  const statusColors: Record<string, string> = {
    proposed: "bg-yellow-100 text-yellow-800",
    accepted: "bg-blue-100 text-blue-800",
    invoiced: "bg-purple-100 text-purple-800",
    paid: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-800",
    refunded: "bg-red-100 text-red-800",
  };

  const renderLineItem = (item: LineItem) => (
    <div
      key={item.id}
      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.label}</span>
          <Badge variant="outline" className="text-xs">
            {item.type}
          </Badge>
          {item.billing_mode === "recurring" && (
            <Badge variant="secondary" className="text-xs">
              {item.billing_interval}ly
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        )}
        <div className="text-xs text-muted-foreground mt-1">
          Created {format(new Date(item.created_at), "MMM d, yyyy")}
          {item.accepted_at && ` • Accepted ${format(new Date(item.accepted_at), "MMM d")}`}
          {item.invoiced_at && ` • Invoiced ${format(new Date(item.invoiced_at), "MMM d")}`}
          {item.paid_at && ` • Paid ${format(new Date(item.paid_at), "MMM d")}`}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="font-semibold">
            {formatCurrency(item.amount_cents * item.quantity)}
          </div>
          {item.quantity > 1 && (
            <div className="text-xs text-muted-foreground">
              {item.quantity} × {formatCurrency(item.amount_cents)}
            </div>
          )}
        </div>
        <Badge className={statusColors[item.status]}>{item.status}</Badge>
        {item.status === "proposed" && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                updateStatusMutation.mutate({
                  id: item.id,
                  status: "accepted",
                  timestamp: "accepted_at",
                })
              }
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                updateStatusMutation.mutate({
                  id: item.id,
                  status: "cancelled",
                  timestamp: "cancelled_at",
                })
              }
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {item.status === "accepted" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              updateStatusMutation.mutate({
                id: item.id,
                status: "cancelled",
                timestamp: "cancelled_at",
              })
            }
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {item.stripe_invoice_id && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              window.open(
                `https://dashboard.stripe.com/invoices/${item.stripe_invoice_id}`,
                "_blank"
              )
            }
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  const depositStatusColors: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    skipped: "bg-gray-100 text-gray-600",
  };

  const depositStatusLabels: Record<string, string> = {
    paid: "Deposit Paid",
    pending: "Deposit Pending",
    skipped: "Skipped Deposit",
  };

  return (
    <div className="space-y-6">
      {/* Customer Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Customer Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Email:</span>{" "}
              <span className="font-medium">{contactEmail || "Not set"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Client Account:</span>{" "}
              {clientAccountId ? (
                <Badge variant="outline" className="bg-green-50">
                  Linked
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50">
                  Not linked
                </Badge>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Stripe Customer:</span>{" "}
              {stripeCustomerId ? (
                <span className="font-mono text-xs">{stripeCustomerId}</span>
              ) : (
                <Badge variant="outline" className="bg-yellow-50">
                  Not created
                </Badge>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Deposit:</span>{" "}
              <Badge className={depositStatusColors[depositStatus || "pending"]}>
                {depositStatusLabels[depositStatus || "pending"] || "Pending"}
              </Badge>
            </div>
            <div className="col-span-2">
              {!clientAccountId || !stripeCustomerId ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => ensureCustomerMutation.mutate()}
                  disabled={ensureCustomerMutation.isPending || !contactEmail}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${ensureCustomerMutation.isPending ? "animate-spin" : ""}`} />
                  Ensure Customer
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Line Items</CardTitle>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingItems ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !lineItems?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No line items yet. Add one to start billing.
            </div>
          ) : (
            <>
              {/* Proposed */}
              {groupedItems.proposed.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Proposed ({groupedItems.proposed.length})
                  </h4>
                  <div className="space-y-2">
                    {groupedItems.proposed.map(renderLineItem)}
                  </div>
                </div>
              )}

              {/* Accepted */}
              {groupedItems.accepted.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Accepted ({groupedItems.accepted.length})
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        Total: {formatCurrency(acceptedTotal)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => createInvoiceMutation.mutate()}
                        disabled={createInvoiceMutation.isPending || !stripeCustomerId}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {groupedItems.accepted.map(renderLineItem)}
                  </div>
                </div>
              )}

              {/* Invoiced */}
              {groupedItems.invoiced.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Invoiced ({groupedItems.invoiced.length})
                  </h4>
                  <div className="space-y-2">
                    {groupedItems.invoiced.map(renderLineItem)}
                  </div>
                </div>
              )}

              {/* Paid */}
              {groupedItems.paid.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Paid ({groupedItems.paid.length})
                  </h4>
                  <div className="space-y-2">{groupedItems.paid.map(renderLineItem)}</div>
                </div>
              )}

              {/* Cancelled/Refunded */}
              {groupedItems.cancelled.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Cancelled/Refunded ({groupedItems.cancelled.length})
                  </h4>
                  <div className="space-y-2 opacity-60">
                    {groupedItems.cancelled.map(renderLineItem)}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <LineItemModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSubmit={(item) => addLineItemMutation.mutate(item)}
        isLoading={addLineItemMutation.isPending}
      />
    </div>
  );
}
