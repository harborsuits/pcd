import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

interface TrustFooterProps {
  className?: string;
}

export function TrustFooter({ className = "" }: TrustFooterProps) {
  return (
    <footer className={`border-t border-border bg-muted/30 px-4 py-4 ${className}`}>
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          <span>Your information is only used to build and support your project.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
