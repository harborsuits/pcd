import { Phone, MessageSquare, Sparkles } from "lucide-react";

interface StickyMobileCTAProps {
  phone?: string;
  onQuoteClick: () => void;
  onClaimClick: () => void;
}

export function StickyMobileCTA({ phone, onQuoteClick, onClaimClick }: StickyMobileCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-card border-t border-border p-3 z-50">
      <div className="flex gap-2">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center justify-center gap-1.5 bg-accent text-accent-foreground py-3 px-4 rounded-lg font-semibold"
          >
            <Phone className="w-4 h-4" />
            Call
          </a>
        )}
        <button
          onClick={onQuoteClick}
          className="flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground py-3 px-4 rounded-lg font-semibold"
        >
          <MessageSquare className="w-4 h-4" />
          Quote
        </button>
        <button
          onClick={onClaimClick}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground py-3 rounded-lg font-semibold"
        >
          <Sparkles className="w-4 h-4" />
          Claim This
        </button>
      </div>
    </div>
  );
}
