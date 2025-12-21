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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(raw: string) {
  return raw.replace(/[^\d]/g, "");
}

function isValidPhone(raw: string) {
  const digits = normalizePhone(raw);
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
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
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; email?: string; form?: string }>({});

  const validate = () => {
    const next: typeof fieldErrors = {};
    const phone = formData.phone.trim();
    const email = formData.email.trim();

    if (!phone && !email) {
      next.form = "Please provide at least a phone number or an email.";
    }

    if (email && !emailRegex.test(email)) {
      next.email = "Please enter a valid email address.";
    }

    if (phone && !isValidPhone(phone)) {
      next.phone = "Please enter a valid phone number (10 digits).";
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const clientKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!baseUrl || !clientKey) {
        throw new Error("Missing Supabase env config");
      }

      const res = await fetch(`${baseUrl}/functions/v1/demo/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: clientKey,
          Authorization: `Bearer ${clientKey}`,
        },
        body: JSON.stringify({
          project_token: projectToken,
          name: formData.name.trim(),
          phone: normalizePhone(formData.phone.trim()),
          email: formData.email.trim(),
          notes: formData.notes.trim(),
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to submit");
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
    // Clear field error on change
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined, form: undefined }));
    }
  };

  const canSubmit = !submitting && (formData.phone.trim() || formData.email.trim());

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
                className={fieldErrors.phone ? "border-destructive" : ""}
              />
              {fieldErrors.phone && (
                <p className="text-xs text-destructive">{fieldErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="claim-email">Email</Label>
              <Input
                id="claim-email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={fieldErrors.email ? "border-destructive" : ""}
              />
              {fieldErrors.email && (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          {fieldErrors.form && (
            <p className="text-sm text-destructive text-center">{fieldErrors.form}</p>
          )}
          
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
            <Button type="submit" className="flex-1" disabled={!canSubmit}>
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
