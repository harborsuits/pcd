import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ClaimDesignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  projectToken: string;
}

export function ClaimDesignModal({ open, onOpenChange, businessName, projectToken }: ClaimDesignModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(`${baseUrl}/functions/v1/demo/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : {}),
        },
        body: JSON.stringify({
          project_token: projectToken,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          notes: formData.notes,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit");
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Claim submission error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-accent text-3xl">✓</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">We Got It!</h3>
            <p className="text-muted-foreground">
              We'll reach out shortly to get your site live for {businessName}.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Claim This Design</DialogTitle>
          <DialogDescription>
            Love what you see? We'll help you get this live under your own domain.
            No obligation, no pressure.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="claim-name">Your Name</Label>
            <Input
              id="claim-name"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="claim-phone">Phone (preferred)</Label>
              <Input
                id="claim-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claim-email">Email</Label>
              <Input
                id="claim-email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="claim-notes">Anything we should know? (optional)</Label>
            <Textarea
              id="claim-notes"
              placeholder="e.g., I'd like to add more photos, change the colors..."
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Not Yet
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Submitting..." : "Make This Mine"}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            We handle everything: domain, hosting, setup. Just tell us you're interested.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
