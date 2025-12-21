import { Phone, MessageSquare } from "lucide-react";

interface StickyMobileCTAProps {
  phone?: string;
  onQuoteClick: () => void;
}

export function StickyMobileCTA({ phone, onQuoteClick }: StickyMobileCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-card border-t border-border p-3 z-50">
      <div className="flex gap-3">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex-1 flex items-center justify-center gap-2 bg-accent text-accent-foreground py-3 rounded-lg font-semibold"
          >
            <Phone className="w-4 h-4" />
            Call
          </a>
        )}
        <button
          onClick={onQuoteClick}
          className={`flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-semibold ${
            phone ? "flex-1" : "w-full"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Get Quote
        </button>
      </div>
    </div>
  );
}
