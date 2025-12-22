import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Upload, CheckCircle } from "lucide-react";

interface WelcomeScreenProps {
  businessName: string;
  onDismiss: () => void;
}

export function WelcomeScreen({ businessName, onDismiss }: WelcomeScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg animate-in fade-in-0 zoom-in-95">
        <CardContent className="pt-8 pb-6 px-6 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome to Your Workspace</h1>
            <p className="text-muted-foreground">
              This is your private portal for <span className="font-medium text-foreground">{businessName}</span>. 
              Everything we work on together lives here.
            </p>
          </div>
          
          <div className="grid gap-3 text-left">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Message us anytime</p>
                <p className="text-xs text-muted-foreground">Ask questions, share ideas, give feedback</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Upload className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Upload files</p>
                <p className="text-xs text-muted-foreground">Photos, logos, documents — drag & drop</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Review & approve</p>
                <p className="text-xs text-muted-foreground">See work-in-progress and give the green light</p>
              </div>
            </div>
          </div>
          
          <Button onClick={onDismiss} className="w-full" size="lg">
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
