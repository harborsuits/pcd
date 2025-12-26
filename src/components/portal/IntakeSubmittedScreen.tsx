import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, ArrowRight, Sparkles } from "lucide-react";
import { ClientLayout } from "@/components/portal/ClientLayout";
import { BrandCard } from "@/components/portal/BrandCard";

interface IntakeSubmittedScreenProps {
  businessName: string;
  projectToken: string;
}

export function IntakeSubmittedScreen({ businessName, projectToken }: IntakeSubmittedScreenProps) {
  const navigate = useNavigate();

  return (
    <ClientLayout
      title={businessName}
      subtitle={
        <Badge variant="secondary" className="text-amber-600 bg-amber-500/10">
          <Clock className="h-3 w-3 mr-1" />
          Under Review
        </Badge>
      }
      maxWidth="md"
      centered
    >
      <BrandCard variant="highlight" className="text-center">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-600 mb-6">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        {/* Title */}
        <h2 className="font-serif text-2xl font-bold mb-2">Intake Submitted</h2>
        <p className="text-muted-foreground mb-6">
          We've received everything we need to get started on your project.
        </p>

        {/* What's Next */}
        <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            What happens next
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent font-medium">1.</span>
              We'll review your intake within 24 hours
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent font-medium">2.</span>
              You'll see your first preview in the portal
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent font-medium">3.</span>
              Leave feedback and we'll refine together
            </li>
          </ul>
        </div>

        {/* CTA */}
        <Button 
          onClick={() => navigate(`/p/${projectToken}`)}
          className="w-full"
          size="lg"
        >
          Go to Project Home
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </BrandCard>

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground mt-4">
        We'll notify you when there's something new to review.
      </p>
    </ClientLayout>
  );
}
