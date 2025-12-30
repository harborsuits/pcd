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

interface QuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
}

export function QuoteModal({ open, onOpenChange, businessName }: QuoteModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would save to the database
    console.log("Quote request submitted:", formData);
    setSubmitted(true);
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
            <h3 className="text-xl font-semibold text-foreground mb-2">Request Received!</h3>
            <p className="text-muted-foreground">
              {businessName} will be in touch with you shortly.
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
          
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Submit Request
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            We'll text you back within 1 business day.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
