import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { Loader2, ArrowRight, Check } from "lucide-react";

interface QuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  projectToken: string;
}

interface QuoteResponse {
  ok: boolean;
  portal_token?: string;
  is_new?: boolean;
}

export function QuoteModal({ open, onOpenChange, businessName, projectToken }: QuoteModalProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke<QuoteResponse>("demo/quote", {
        body: {
          project_token: projectToken,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          service: formData.service,
          message: formData.message,
        },
      });

      if (invokeError) {
        console.error("Quote request error:", invokeError);
        setError("Something went wrong. Please try again.");
        return;
      }

      // Store portal token for "View Portal" button
      if (data?.portal_token) {
        setPortalToken(data.portal_token);
      }
      setSubmitted(true);
    } catch (err) {
      console.error("Quote request error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenPortal = () => {
    if (portalToken) {
      onOpenChange(false);
      navigate(`/p/${portalToken}`);
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Request Received!</h3>
            <p className="text-muted-foreground mb-6">
              We'll get back to you within 1 business day with pricing details.
            </p>
            
            {portalToken ? (
              <div className="space-y-3">
                <Button onClick={handleOpenPortal} className="w-full group">
                  View Your Project Portal
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Your portal is ready — upload files, chat with us, and track progress.
                </p>
              </div>
            ) : (
              <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Get a Quote from {businessName}</DialogTitle>
          <DialogDescription>
            Fill out your details and we'll connect you with the business.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="service">What service do you need?</Label>
            <Input
              id="service"
              placeholder="e.g., Water heater replacement"
              value={formData.service}
              onChange={(e) => handleChange("service", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Additional Details (optional)</Label>
            <Textarea
              id="message"
              placeholder="Any other information that would help..."
              value={formData.message}
              onChange={(e) => handleChange("message", e.target.value)}
              rows={3}
            />
          </div>
          
          {error && <p className="text-sm text-destructive">{error}</p>}
          
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            We'll get back to you within 1 business day.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
