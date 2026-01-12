import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Zap,
  AlertTriangle,
  Calendar,
  MessageSquare
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AIReceptionistSetupProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: SetupData) => Promise<void>;
  businessName: string;
}

export interface SetupData {
  // Core business info
  businessPhone: string;
  businessHours: string;
  services: string;
  
  // Call handling
  callOutcomes: string[];
  escalationPhone: string;
  emergencyRules: string;
  
  // Optional extras
  bookingLink: string;
  faqs: string;
  preferredTone: string;
  
  // Notifications
  notificationEmail: string;
  notificationPhone: string;
}

const CALL_OUTCOMES = [
  { id: "book", label: "Book appointments", description: "Schedule directly on your calendar" },
  { id: "quote", label: "Request quotes", description: "Collect info for pricing estimates" },
  { id: "message", label: "Take messages", description: "Capture caller details for callback" },
  { id: "emergency", label: "Emergency routing", description: "Forward urgent calls to you" },
];

const TONE_OPTIONS = [
  { id: "friendly", label: "Friendly & warm", description: "Casual, approachable" },
  { id: "professional", label: "Professional", description: "Business-like, formal" },
  { id: "direct", label: "Direct", description: "Efficient, to the point" },
];

export function AIReceptionistSetup({ 
  open, 
  onClose, 
  onComplete,
  businessName 
}: AIReceptionistSetupProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Business basics
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessHours, setBusinessHours] = useState("Mon-Fri 9am-5pm");
  const [services, setServices] = useState("");
  
  // Step 2: Call handling
  const [callOutcomes, setCallOutcomes] = useState<string[]>(["message"]);
  const [escalationPhone, setEscalationPhone] = useState("");
  const [emergencyRules, setEmergencyRules] = useState("");
  
  // Step 3: Extras
  const [bookingLink, setBookingLink] = useState("");
  const [faqs, setFaqs] = useState("");
  const [preferredTone, setPreferredTone] = useState("professional");
  
  // Step 4: Notifications
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
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete({
        businessPhone,
        businessHours,
        services,
        callOutcomes,
        escalationPhone,
        emergencyRules,
        bookingLink,
        faqs,
        preferredTone,
        notificationEmail,
        notificationPhone,
      });
      setStep(6); // Success step
    } catch (error) {
      console.error("Setup error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return businessPhone.trim().length > 0 && businessHours.trim().length > 0 && services.trim().length > 0;
      case 2: return callOutcomes.length > 0 && escalationPhone.trim().length > 0;
      case 3: return preferredTone.length > 0; // FAQs and booking link are optional
      case 4: return notificationEmail.trim().length > 0 || notificationPhone.trim().length > 0;
      case 5: return true; // Review step
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      // Step 1: Business basics
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Phone className="h-5 w-5" />
              <h3 className="font-semibold">Business basics</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              The essentials we need to handle your calls.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="businessPhone">Main business phone number <span className="text-destructive">*</span></Label>
              <Input
                id="businessPhone"
                type="tel"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
              <p className="text-xs text-muted-foreground">The number you want AI to answer</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hours">Business hours <span className="text-destructive">*</span></Label>
              <Input
                id="hours"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="e.g., Mon-Fri 9am-5pm, Sat 10am-2pm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="services">Services you offer <span className="text-destructive">*</span></Label>
              <Textarea
                id="services"
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="e.g.,
Roof repair
New roof installation
Gutter cleaning
Emergency leak repair"
                rows={4}
              />
            </div>
          </div>
        );

      // Step 2: Call handling
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-semibold">Call handling</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              How should the AI handle different situations?
            </p>
            
            <div className="space-y-3">
              <Label>What should calls become? <span className="text-destructive">*</span></Label>
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
            
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="escalation">Escalation / transfer number <span className="text-destructive">*</span></Label>
              <Input
                id="escalation"
                type="tel"
                value={escalationPhone}
                onChange={(e) => setEscalationPhone(e.target.value)}
                placeholder="(555) 999-1234"
              />
              <p className="text-xs text-muted-foreground">Where to send urgent calls or handoffs</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emergency">Emergency rules</Label>
              <Textarea
                id="emergency"
                value={emergencyRules}
                onChange={(e) => setEmergencyRules(e.target.value)}
                placeholder="e.g., Transfer immediately if caller mentions flooding, fire, or gas leak"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">What counts as an emergency + what to do</p>
            </div>
          </div>
        );

      // Step 3: Extras
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Calendar className="h-5 w-5" />
              <h3 className="font-semibold">Extras & tone</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Optional info to make your AI smarter.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="booking">Calendar integration (optional)</Label>
              <Input
                id="booking"
                type="url"
                value={bookingLink}
                onChange={(e) => setBookingLink(e.target.value)}
                placeholder="https://calendly.com/yourbusiness"
              />
              <p className="text-xs text-muted-foreground">Connect Calendly, Acuity, or Google Calendar. The AI books directly.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="faqs">Common questions & answers (optional)</Label>
              <Textarea
                id="faqs"
                value={faqs}
                onChange={(e) => setFaqs(e.target.value)}
                placeholder="Q: What areas do you serve?
A: We serve the entire Greater Boston area.

Q: Do you offer free estimates?
A: Yes, all estimates are free."
                rows={4}
              />
            </div>
            
            <div className="space-y-3 pt-2 border-t">
              <Label>Preferred tone <span className="text-destructive">*</span></Label>
              <RadioGroup
                value={preferredTone}
                onValueChange={setPreferredTone}
                className="space-y-2"
              >
                {TONE_OPTIONS.map((opt) => (
                  <div 
                    key={opt.id} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      preferredTone === opt.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setPreferredTone(opt.id)}
                  >
                    <RadioGroupItem value={opt.id} id={`tone-${opt.id}`} />
                    <div className="flex-1">
                      <Label htmlFor={`tone-${opt.id}`} className="cursor-pointer text-sm font-medium">
                        {opt.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      // Step 4: Notifications
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
                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
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

      // Step 5: Review
      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="font-semibold">Review your setup</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-1">Business Phone</div>
                <div>{businessPhone}</div>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-1">Hours</div>
                <div>{businessHours}</div>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-1">Call Outcomes</div>
                <div>{callOutcomes.map(c => CALL_OUTCOMES.find(o => o.id === c)?.label).join(", ")}</div>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-1">Escalation</div>
                <div>{escalationPhone}</div>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-1">Tone</div>
                <div className="capitalize">{preferredTone}</div>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-1">Notifications</div>
                <div>{notificationEmail}{notificationPhone && `, ${notificationPhone}`}</div>
              </div>
            </div>
          </div>
        );

      // Step 6: Success
      case 6:
        return (
          <div className="text-center space-y-4 py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-lg">You're all set!</h3>
            <p className="text-sm text-muted-foreground">
              Your AI receptionist is being configured. We'll send you setup instructions within 24 hours.
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

  const totalSteps = 5;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI Receptionist Setup
          </DialogTitle>
          <DialogDescription>
            5-minute setup for {businessName}
          </DialogDescription>
        </DialogHeader>

        {step <= totalSteps && (
          <div className="flex gap-1 mb-4">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}

        <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
          {renderStep()}
        </div>

        {step <= totalSteps && (
          <div className="flex items-center gap-2 pt-4 border-t">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <div className="flex-1" />
            {step < totalSteps ? (
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