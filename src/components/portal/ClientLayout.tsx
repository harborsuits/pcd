import { ReactNode } from "react";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { PortalHeader } from "@/components/portal/PortalHeader";

interface ClientLayoutProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  rightSlot?: ReactNode;
  centered?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "5xl";
  hideHeader?: boolean;
}

export function ClientLayout({
  title,
  subtitle,
  children,
  rightSlot,
  centered = false,
  maxWidth = "5xl",
  hideHeader = false,
}: ClientLayoutProps) {
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
  }[maxWidth];

  return (
    <div className="min-h-screen flex flex-col bg-accent/10">
      {/* Header - matches homepage */}
      {!hideHeader && <PortalHeader rightSlot={rightSlot} />}

      {/* Hero band - like homepage/pricing */}
      {(title || subtitle) && (
        <div className="bg-page-bg border-b border-border py-10 md:py-12">
          <div className={`container mx-auto px-6 ${maxWidthClass} text-center`}>
            {title && (
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-2 text-lg text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content area */}
      <main className={`flex-1 ${centered ? "flex items-center justify-center" : ""}`}>
        <div className={`container mx-auto px-6 py-10 ${maxWidthClass}`}>
          {children}
        </div>
      </main>

      {/* Footer - shared across all portal screens */}
      <MarketingFooter compact />
    </div>
  );
}
