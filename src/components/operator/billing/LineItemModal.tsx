import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LineItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: LineItemFormData) => void;
  isLoading?: boolean;
}

export interface LineItemFormData {
  type: "setup" | "subscription" | "addon" | "credit" | "refund";
  label: string;
  description?: string;
  amount_cents: number;
  billing_mode: "one_time" | "recurring";
  billing_interval?: "month" | "year";
  quantity: number;
  notes?: string;
}

export function LineItemModal({ open, onOpenChange, onSubmit, isLoading }: LineItemModalProps) {
  const [formData, setFormData] = useState<LineItemFormData>({
    type: "setup",
    label: "",
    description: "",
    amount_cents: 0,
    billing_mode: "one_time",
    billing_interval: undefined,
    quantity: 1,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    // Reset form
    setFormData({
      type: "setup",
      label: "",
      description: "",
      amount_cents: 0,
      billing_mode: "one_time",
      billing_interval: undefined,
      quantity: 1,
      notes: "",
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Line Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: LineItemFormData["type"]) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="setup">Setup</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="addon">Add-on</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_mode">Billing Mode</Label>
              <Select
                value={formData.billing_mode}
                onValueChange={(value: LineItemFormData["billing_mode"]) =>
                  setFormData({
                    ...formData,
                    billing_mode: value,
                    billing_interval: value === "recurring" ? "month" : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One-time</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.billing_mode === "recurring" && (
            <div className="space-y-2">
              <Label htmlFor="billing_interval">Billing Interval</Label>
              <Select
                value={formData.billing_interval || "month"}
                onValueChange={(value: "month" | "year") =>
                  setFormData({ ...formData, billing_interval: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="label">Label *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., Website Design Package"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount_cents / 100}
                onChange={(e) =>
                  setFormData({ ...formData, amount_cents: Math.round(parseFloat(e.target.value || "0") * 100) })
                }
                placeholder="0.00"
                required
              />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(formData.amount_cents)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value || "1", 10) })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes visible only to operators..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.label || formData.amount_cents <= 0}>
              {isLoading ? "Adding..." : "Add Line Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
