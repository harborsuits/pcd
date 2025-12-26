import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface WelcomeScreenProps {
  businessName: string;
  onDismiss: () => void;
}

export function WelcomeScreen({ businessName, onDismiss }: WelcomeScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg rounded-xl border border-border shadow-lg animate-in fade-in-0 zoom-in-95">
        <CardContent className="pt-8 pb-6 px-6 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-accent" />
          </div>
          
          <div>
            <h1 className="font-serif text-2xl font-bold mb-2 text-foreground">Welcome, {businessName}</h1>
            <p className="text-muted-foreground">
              This is your project space. Everything we work on together lives here.
            </p>
          </div>
          
          <div className="text-left space-y-4 py-2">
            <p className="text-sm text-foreground font-medium">Here's what happens next:</p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/10 text-accent text-sm font-semibold shrink-0">1</span>
                <p className="text-sm text-muted-foreground">We'll refine the design to match your business</p>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/10 text-accent text-sm font-semibold shrink-0">2</span>
                <p className="text-sm text-muted-foreground">You'll review and give feedback right here</p>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/10 text-accent text-sm font-semibold shrink-0">3</span>
                <p className="text-sm text-muted-foreground">When you're ready, we'll build it live</p>
              </div>
            </div>
          </div>
          
          <Button onClick={onDismiss} className="w-full" size="lg">
            Go to my project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
