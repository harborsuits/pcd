import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogIn, Mail, MessageSquare } from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { SEOHead } from "@/components/SEOHead";
import { NAP } from "@/lib/localPages";

interface InquiryLayoutProps {
  title: string;
  introduction: string;
  seoTitle: string;
  seoDescription: string;
  formTitle?: string;
  children: ReactNode;
  secondary: ReactNode;
}

/** Shared public inquiry shell. Keep at module scope so typing never remounts fields. */
export function InquiryLayout({
  title,
  introduction,
  seoTitle,
  seoDescription,
  formTitle,
  children,
  secondary,
}: InquiryLayoutProps) {
  return (
    <div className="pcd-shell min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead title={seoTitle} description={seoDescription} path="/get-demo" />
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-2 flex items-center justify-between gap-3">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground" aria-label="Pleasant Cove Design home">
            <BrandMark compact />
          </Link>
          <Link to="/portal" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Client login
          </Link>
        </div>
      </header>

      <main className="flex-1 px-5 sm:px-6 py-10 md:py-14 lg:py-20">
        <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-x-14 lg:gap-y-6">
          <div className="lg:col-start-1 lg:row-start-1 lg:pt-8">
            <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight mb-4">{title}</h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-lg">{introduction}</p>
          </div>

          <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
            {formTitle && <h2 className="font-serif text-2xl font-bold mb-6">{formTitle}</h2>}
            {children}
          </div>

          <div className="lg:col-start-1 lg:row-start-2 space-y-5 text-sm">{secondary}</div>
        </div>
      </main>
      <MarketingFooter compact />
    </div>
  );
}

export function InquiryContactLinks() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-3">
      <a href={`mailto:${NAP.email}`} className="inline-flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground">
        <Mail className="h-4 w-4" aria-hidden="true" />Email Ben
      </a>
      <a href={`sms:${NAP.phoneE164}`} className="inline-flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground">
        <MessageSquare className="h-4 w-4" aria-hidden="true" />Text Ben
      </a>
    </div>
  );
}
