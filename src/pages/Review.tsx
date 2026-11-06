import { Copy, QrCode } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { NAP } from "@/lib/localPages";
import { REVIEW_URL, REVIEW_URL_IS_LIVE } from "@/lib/reviewLink";
import { toast } from "@/hooks/use-toast";

const Review = () => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (!REVIEW_URL_IS_LIVE) return;
    try { await navigator.clipboard.writeText(REVIEW_URL); setCopied(true); toast({ title: "Link copied" }); }
    catch { toast({ title: "Couldn't copy", description: "Select the link and copy it manually." }); }
  };
  return <div className="pcd-shell min-h-screen flex flex-col bg-page-bg text-foreground">
    <SEOHead title={REVIEW_URL_IS_LIVE ? "Leave a Google Review" : "Share Your Feedback with Ben"} description="Share honest feedback about working with Pleasant Cove Design. Email Ben about your website project and your experience with the process." path="/review" localBusiness />
    <MarketingHeader />
    <main className="flex-1"><section className="px-5 sm:px-6 py-10 md:py-16"><div className="max-w-2xl mx-auto text-center"><h1 className="font-serif text-3xl md:text-5xl font-bold mb-5">Share your feedback with Ben</h1><p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-7">If we’ve worked together, I’d welcome your honest thoughts about your website and the process — what went well and what could be better.</p><Button asChild size="lg"><a href={`mailto:${NAP.email}?subject=Feedback%20on%20our%20website%20project`}>Email Ben</a></Button><a href={`mailto:${NAP.email}`} className="block mt-5 text-sm text-muted-foreground underline underline-offset-4 [overflow-wrap:anywhere]">{NAP.email}</a>{REVIEW_URL_IS_LIVE && <Button asChild variant="outline" size="lg" className="mt-6"><a href={REVIEW_URL} target="_blank" rel="noopener noreferrer">Open Google review form</a></Button>}</div></section>
    {REVIEW_URL_IS_LIVE && <section className="border-t border-border py-10 md:py-12"><div className="max-w-3xl mx-auto px-5 sm:px-6 grid md:grid-cols-2 gap-5"><article className="bg-card border border-border rounded-lg p-6"><h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2"><Copy className="h-5 w-5" />Share the review link</h2><a href={REVIEW_URL} className="block text-sm [overflow-wrap:anywhere] underline mb-5">{REVIEW_URL}</a><Button onClick={handleCopy} variant="secondary">{copied ? "Copied" : "Copy link"}</Button></article><article className="bg-card border border-border rounded-lg p-6"><h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2"><QrCode className="h-5 w-5" />Scan in person</h2><img src="/review-qr.svg" alt="QR code for the Google review form" width={160} height={160} /></article></div></section>}
    <section className="border-t border-border py-10 md:py-12"><div className="max-w-2xl mx-auto px-5 sm:px-6"><h2 className="font-serif text-2xl font-bold mb-5">What would you like to share?</h2><ul className="list-disc pl-5 space-y-3 text-muted-foreground"><li>What did you need help with?</li><li>How did communication and review feel?</li><li>What is working well, and what needs attention?</li></ul></div></section></main><MarketingFooter />
  </div>;
};
export default Review;
