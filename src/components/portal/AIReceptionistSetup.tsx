import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Phone, 
  Clock, 
  List, 
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Zap
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AIReceptionistSetupProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: SetupData) => Promise<void>;
  businessName: string;
}

interface SetupData {
  businessHours: string;
  services: string;
  callOutcomes: string[];
  notificationEmail: string;
  notificationPhone: string;
}

const CALL_OUTCOMES = [
  { id: "book", label: "Book appointments", description: "Schedule directly on your calendar" },
  { id: "quote", label: "Request quotes", description: "Collect info for pricing estimates" },
  { id: "message", label: "Take messages", description: "Capture caller details for callback" },
  { id: "emergency", label: "Emergency routing", description: "Forward urgent calls to you" },
];

export function AIReceptionistSetup({ 
  open, 
  onClose, 
  onComplete,
  businessName 
}: AIReceptionistSetupProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [businessHours, setBusinessHours] = useState("Mon-Fri 9am-5pm");
  const [services, setServices] = useState("");
  const [callOutcomes, setCallOutcomes] = useState<string[]>(["message"]);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [notificationPhone, setNotificationPhone] = useState("");

  const handleToggleOutcome = (id: string) => {
    setCallOutcomes(prev => 
      prev.includes(id) 
        ? prev.filter(o => o !== id)
        : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete({
        businessHours,
        services,
        callOutcomes,
        notificationEmail,
        notificationPhone,
      });
      setStep(5); // Success step
    } catch (error) {
      console.error("Setup error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return businessHours.trim().length > 0;
      case 2: return services.trim().length > 0;
      case 3: return callOutcomes.length > 0;
      case 4: return notificationEmail.trim().length > 0 || notificationPhone.trim().length > 0;
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Clock className="h-5 w-5" />
              <h3 className="font-semibold">When are you open?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              The AI will know when to offer appointments vs take messages.
            </p>
            <div className="space-y-2">
              <Label htmlFor="hours">Business Hours</Label>
              <Input
                id="hours"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="e.g., Mon-Fri 9am-5pm, Sat 10am-2pm"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <List className="h-5 w-5" />
              <h3 className="font-semibold">What services do you offer?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Help the AI answer common questions about what you do.
            </p>
            <div className="space-y-2">
              <Label htmlFor="services">Services (one per line)</Label>
              <Textarea
                id="services"
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="e.g.,
Roof repair
New roof installation
Gutter cleaning
Emergency leak repair"
                rows={5}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Phone className="h-5 w-5" />
              <h3 className="font-semibold">What should calls become?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Select all that apply. The AI will guide callers appropriately.
            </p>
            <div className="space-y-3">
              {CALL_OUTCOMES.map((outcome) => (
                <label
                  key={outcome.id}
                  className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Checkbox
                    checked={callOutcomes.includes(outcome.id)}
                    onCheckedChange={() => handleToggleOutcome(outcome.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-sm">{outcome.label}</span>
                    <p className="text-xs text-muted-foreground">{outcome.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Mail className="h-5 w-5" />
              <h3 className="font-semibold">Where should leads go?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              We'll send you a notification for every captured lead.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="you@business.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional for SMS)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={notificationPhone}
                  onChange={(e) => setNotificationPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-4 py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-lg">You're all set!</h3>
            <p className="text-sm text-muted-foreground">
              Your AI receptionist is being configured. We'll send you the phone number within 24 hours.
            </p>
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI Receptionist Setup
          </DialogTitle>
          <DialogDescription>
            2-minute setup for {businessName}
          </DialogDescription>
        </DialogHeader>

        {step < 5 && (
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}

        <div className="min-h-[240px]">
          {renderStep()}
        </div>

        {step < 5 && (
          <div className="flex items-center gap-2 pt-4 border-t">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <div className="flex-1" />
            {step < 4 ? (
              <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={!canProceed() || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
