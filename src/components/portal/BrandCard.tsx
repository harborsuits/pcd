import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BrandCardProps {
  className?: string;
  children: ReactNode;
  variant?: "default" | "highlight" | "muted";
  noPadding?: boolean;
}

export function BrandCard({ 
  className, 
  children, 
  variant = "default",
  noPadding = false,
}: BrandCardProps) {
  const variantClasses = {
    default: "bg-card border-border/60 shadow-sm",
    highlight: "bg-card border-accent/30 shadow-md ring-1 ring-accent/10",
    muted: "bg-muted/50 border-border/40",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border",
        variantClasses[variant],
        !noPadding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

interface BrandCardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function BrandCardHeader({ 
  title, 
  subtitle, 
  icon,
  action,
  className,
}: BrandCardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="shrink-0 w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function BrandCardContent({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn("mt-4", className)}>
      {children}
    </div>
  );
}
