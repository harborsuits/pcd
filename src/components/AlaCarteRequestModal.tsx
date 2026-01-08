import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

interface AlaCarteRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceKey: string;
  serviceLabel: string;
}

export function AlaCarteRequestModal({
  open,
  onOpenChange,
  serviceKey,
  serviceLabel,
}: AlaCarteRequestModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [hasWebsite, setHasWebsite] = useState<boolean | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isExistingClient, setIsExistingClient] = useState<boolean | null>(null);
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [contactValue, setContactValue] = useState("");
  const [note, setNote] = useState("");

  const resetForm = () => {
    setHasWebsite(null);
    setWebsiteUrl("");
    setIsExistingClient(null);
    setContactMethod("email");
    setContactValue("");
    setNote("");
    setSubmitted(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(resetForm, 300);
  };

  const canSubmit =
    hasWebsite !== null &&
    isExistingClient !== null &&
    contactValue.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("alacarte_requests").insert({
        service_key: serviceKey,
        service_label: serviceLabel,
        has_website: hasWebsite,
        website_url: hasWebsite ? websiteUrl.trim() || null : null,
        is_existing_client: isExistingClient,
        contact_method: contactMethod,
        contact_value: contactValue.trim(),
        note: note.trim() || null,
      });

      if (error) throw error;

      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit request:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6">
            <CheckCircle className="h-12 w-12 text-accent mb-4" />
            <DialogTitle className="text-xl font-semibold mb-2">
              Request Received
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              We'll get back to you within 1 business day about{" "}
              <span className="font-medium text-foreground">{serviceLabel}</span>.
            </DialogDescription>
            <Button onClick={handleClose} className="mt-6">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request: {serviceLabel}</DialogTitle>
          <DialogDescription>
            Quick form — we'll reach out within 1 business day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Do you have a website? */}
          <div className="space-y-2">
            <Label>Do you already have a website?</Label>
            <RadioGroup
              value={hasWebsite === null ? "" : hasWebsite ? "yes" : "no"}
              onValueChange={(v) => setHasWebsite(v === "yes")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="website-yes" />
                <Label htmlFor="website-yes" className="font-normal cursor-pointer">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="website-no" />
                <Label htmlFor="website-no" className="font-normal cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
            {hasWebsite && (
              <Input
                placeholder="https://yoursite.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* New or existing client */}
          <div className="space-y-2">
            <Label>Have you worked with us before?</Label>
            <RadioGroup
              value={isExistingClient === null ? "" : isExistingClient ? "yes" : "no"}
              onValueChange={(v) => setIsExistingClient(v === "yes")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="client-new" />
                <Label htmlFor="client-new" className="font-normal cursor-pointer">
                  I'm new
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="client-existing" />
                <Label htmlFor="client-existing" className="font-normal cursor-pointer">
                  Existing client
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Best contact method */}
          <div className="space-y-2">
            <Label>Best way to reach you</Label>
            <RadioGroup
              value={contactMethod}
              onValueChange={(v) => setContactMethod(v as "email" | "phone")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="contact-email" />
                <Label htmlFor="contact-email" className="font-normal cursor-pointer">
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="contact-phone" />
                <Label htmlFor="contact-phone" className="font-normal cursor-pointer">
                  Phone
                </Label>
              </div>
            </RadioGroup>
            <Input
              placeholder={contactMethod === "email" ? "you@example.com" : "(555) 123-4567"}
              type={contactMethod === "email" ? "email" : "tel"}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Optional note */}
          <div className="space-y-2">
            <Label>
              Anything else? <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              placeholder="Quick context or questions..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
