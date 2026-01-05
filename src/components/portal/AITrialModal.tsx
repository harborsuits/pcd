import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Zap, CheckCircle2, ArrowRight, X } from "lucide-react";

interface AITrialModalProps {
  open: boolean;
  onClose: () => void;
  businessName: string;
}

export function AITrialModal({ open, onClose, businessName }: AITrialModalProps) {
  const [step, setStep] = useState<"intro" | "phone" | "success">("intro");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleStartTrial = () => {
    setStep("phone");
  };

  const handleSubmitPhone = async () => {
    if (!phone.trim()) return;
    
    setSubmitting(true);
    // Simulate API call - in production this would call an edge function
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitting(false);
    setStep("success");
  };

  const handleClose = () => {
    setStep("intro");
    setPhone("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {step === "intro" && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4 mx-auto">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-center">
                Try AI Receptionist Free
              </DialogTitle>
              <DialogDescription className="text-center">
                While we build your website, let our AI answer your calls, capture leads, and follow up automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-4">
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Answers calls 24/7 with your business info</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Captures caller details and sends you a summary</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Free for 7 days, no commitment</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleStartTrial} className="w-full">
                <Zap className="mr-2 h-4 w-4" />
                Start Free Trial
              </Button>
              <Button variant="ghost" onClick={handleClose} className="w-full text-muted-foreground">
                Maybe Later
              </Button>
            </div>
          </>
        )}

        {step === "phone" && (
          <>
            <DialogHeader>
              <DialogTitle>Set Up Your AI Line</DialogTitle>
              <DialogDescription>
                Enter a phone number where you'd like calls forwarded when you're unavailable.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Your Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  We'll send you a text to confirm and share your new AI line number.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("intro")} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleSubmitPhone} 
                disabled={!phone.trim() || submitting}
                className="flex-1"
              >
                {submitting ? "Setting up..." : "Activate Trial"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-4 mx-auto">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <DialogTitle className="text-center">You're All Set!</DialogTitle>
              <DialogDescription className="text-center">
                We'll text you shortly with your AI receptionist number for {businessName}.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/50 rounded-lg p-4 my-4 text-sm text-center">
              <p className="text-muted-foreground">
                Forward calls to your new AI line, or use it as your main business number. 
                We'll handle the rest.
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
