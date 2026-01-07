import { Check } from "lucide-react";
import {
  findTierById,
  findAddonsByIds,
  shouldShowPricing,
  type ServiceType,
} from "@/lib/pricingMenu";

interface PricingSummaryProps {
  serviceType: ServiceType;
  pricingTier?: string | null;
  pricingNotes?: string;
  retainerAddons?: string[];
  addonNotes?: string;
  className?: string;
}

/**
 * Displays a summary of selected pricing tier and retainer add-ons.
 * Only renders for ai/website/both service types.
 */
export function PricingSummary({
  serviceType,
  pricingTier,
  pricingNotes,
  retainerAddons = [],
  addonNotes,
  className,
}: PricingSummaryProps) {
  // Don't show for demo/other service types
  if (!shouldShowPricing(serviceType)) {
    return null;
  }

  const selectedTier = findTierById(pricingTier);
  const selectedAddons = findAddonsByIds(retainerAddons);

  return (
    <div className={className}>
      <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Your selections
        </h3>

        <div className="space-y-4">
          {/* Tier */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Tier</p>
            {selectedTier ? (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">
                  {selectedTier.label} — <span className="text-primary font-medium">{selectedTier.price}</span>
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Not selected</p>
            )}
            {pricingNotes?.trim() && (
              <p className="text-xs text-muted-foreground mt-1 pl-6">
                Notes: {pricingNotes.trim()}
              </p>
            )}
          </div>

          {/* Retainers */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              Monthly Retainers (optional)
            </p>
            {selectedAddons.length > 0 ? (
              <ul className="space-y-1">
                {selectedAddons.map((addon) => (
                  <li key={addon.id} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground">
                      {addon.label} — <span className="text-muted-foreground">{addon.price}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">None selected</p>
            )}
            {addonNotes?.trim() && (
              <p className="text-xs text-muted-foreground mt-1 pl-6">
                Notes: {addonNotes.trim()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingSummary;
