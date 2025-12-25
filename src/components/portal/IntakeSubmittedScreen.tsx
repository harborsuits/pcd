import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, ArrowRight, Sparkles } from "lucide-react";

interface IntakeSubmittedScreenProps {
  businessName: string;
  projectToken: string;
}

export function IntakeSubmittedScreen({ businessName, projectToken }: IntakeSubmittedScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">
                {businessName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="font-semibold">{businessName}</span>
          </div>
          <Badge variant="secondary" className="text-amber-600 bg-amber-500/10">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="border-2 border-primary/20 bg-card">
            <CardContent className="pt-8 pb-8 text-center">
              {/* Success Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-600 mb-6">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold mb-2">Intake Submitted</h1>
              <p className="text-muted-foreground mb-6">
                We've received everything we need to get started on your project.
              </p>

              {/* What's Next */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  What happens next
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-medium">1.</span>
                    We'll review your intake within 24 hours
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-medium">2.</span>
                    You'll see your first preview in the portal
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-medium">3.</span>
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
            </CardContent>
          </Card>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            We'll notify you when there's something new to review.
          </p>
        </div>
      </main>
    </div>
  );
}
