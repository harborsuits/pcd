import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Phone, ArrowRight, Zap } from "lucide-react";
import { ClientLayout } from "@/components/portal/ClientLayout";
import { BrandCard } from "@/components/portal/BrandCard";

interface IntakeSubmittedScreenProps {
  businessName: string;
  projectToken: string;
}

export function IntakeSubmittedScreen({ businessName, projectToken }: IntakeSubmittedScreenProps) {
  const navigate = useNavigate();
  const [showTrialOffer, setShowTrialOffer] = useState(true);

  const handleTryAI = () => {
    // Navigate to AI setup flow (can be enhanced later)
    navigate(`/w/${projectToken}?ai_trial=start`);
  };

  const handleSkip = () => {
    setShowTrialOffer(false);
  };

  return (
    <ClientLayout
      title={businessName}
      subtitle={
        <Badge variant="secondary" className="text-green-600 bg-green-500/10">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          All Set
        </Badge>
      }
      maxWidth="md"
      centered
    >
      {/* Main confirmation card */}
      <BrandCard variant="highlight" className="text-center">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 text-green-600 mb-5">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        {/* Confident headline */}
        <h2 className="font-serif text-2xl font-bold mb-2">
          We've got what we need
        </h2>
        <p className="text-muted-foreground mb-6">
          We're reviewing your intake and preparing next steps.
          <br />
          <span className="text-foreground/80">Nothing else needed from you right now.</span>
        </p>

        {/* What happens next - minimal */}
        <div className="bg-muted/40 rounded-lg p-4 mb-6 text-left text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">What happens next:</span>{" "}
            We'll have your first preview ready within 24–48 hours. You'll get a notification when it's time to review.
          </p>
        </div>

        {/* Go to portal */}
        <Button 
          onClick={() => navigate(`/w/${projectToken}`)}
          variant="outline"
          className="w-full"
          size="lg"
        >
          Go to Project Home
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </BrandCard>

      {/* AI Receptionist Trial Offer */}
      {showTrialOffer && (
        <BrandCard className="mt-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Phone className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-2">
                While we're setting things up…
              </p>
              <h3 className="font-medium mb-1">
                Try our AI receptionist free for a week
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                It answers calls, captures leads, and follows up automatically — no setup stress, no commitment.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleTryAI}
                  className="flex-1"
                  size="sm"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Try it free for a week
                </Button>
                <Button 
                  onClick={handleSkip}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  Skip for now
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">
                If you don't like it, we'll turn it off. No pressure.
              </p>
            </div>
          </div>
        </BrandCard>
      )}

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground mt-4">
        Questions? Just reply to any email from us.
      </p>
    </ClientLayout>
  );
}
