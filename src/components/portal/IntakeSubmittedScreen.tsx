import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight } from "lucide-react";
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
        <Badge variant="secondary" className="text-green-600 bg-green-500/10">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Submitted
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
          Your AI receptionist is being set up
        </h2>
        <p className="text-muted-foreground mb-6">
          We're reviewing your configuration and preparing your system.
        </p>

        {/* What happens next - clear expectations */}
        <div className="bg-muted/40 rounded-lg p-4 mb-6 text-left text-sm space-y-2">
          <p className="font-medium text-foreground">What happens next:</p>
          <ul className="text-muted-foreground space-y-1.5 list-none">
            <li>• We configure your AI based on your answers</li>
            <li>• You'll get a notification when testing begins (usually 24–48 hours)</li>
            <li>• Track status and make updates in your client portal</li>
          </ul>
        </div>

        {/* Primary CTA - Go to portal */}
        <Button 
          onClick={() => navigate(`/p/${projectToken}`)}
          className="w-full"
          size="lg"
        >
          Go to your client portal
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        
        <p className="text-xs text-muted-foreground mt-3">
          You can review your setup and see status updates there.
        </p>
      </BrandCard>
    </ClientLayout>
  );
}
