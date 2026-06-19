import { Link } from "react-router-dom";
import { Copy, QrCode, Star, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/spotlight-card";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { NAP } from "@/lib/localPages";
import {
  REVIEW_URL,
  REVIEW_URL_STATUS,
  REVIEW_URL_IS_LIVE,
} from "@/lib/reviewLink";
import { toast } from "@/hooks/use-toast";

const QR_PATH = "/review-qr.svg";

const Review = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(REVIEW_URL);
      setCopied(true);
      toast({ title: "Link copied", description: "Paste it into a text or email." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: "Long-press the link to copy it manually." });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Leave a Google Review"
        description={`Help other Maine small businesses find ${NAP.name} — leave a quick Google review. One tap on mobile.`}
        path="/review"
        localBusiness
      />
      <MarketingHeader />

      <main className="flex-1">
        <section className="pt-16 pb-10">
          <div className="container mx-auto px-6 text-center max-w-2xl">
            <div className="flex items-center justify-center gap-1 mb-4" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-accent text-accent" />
              ))}
            </div>
            <h1 data-speakable className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Leave a review
            </h1>
            <p data-speakable className="text-lg text-muted-foreground mb-8">
              If we built or fixed something for you, a quick Google review helps other Maine small businesses find us — and it takes about 30 seconds.
            </p>

            {REVIEW_URL_IS_LIVE ? (
              <a href={REVIEW_URL} target="_blank" rel="noopener noreferrer">
                <LiquidButton size="lg">Open Google review form</LiquidButton>
              </a>
            ) : (
              <div className="space-y-3">
                <Button size="lg" variant="outline" disabled>
                  Review link not configured yet
                </Button>
                {REVIEW_URL_STATUS.kind !== "placeholder" && (
                  <p className="text-xs text-destructive flex items-center justify-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {("reason" in REVIEW_URL_STATUS && REVIEW_URL_STATUS.reason) || ""}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="py-12 border-t border-border">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="grid md:grid-cols-2 gap-4">
              <GlowCard customSize glowColor="emerald" className="bg-card/80 p-6">
                <h2 className="font-serif text-xl font-bold mb-3 flex items-center gap-2">
                  <Copy className="h-5 w-5 text-accent" /> Share the link
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Copy and paste into a text message or email.
                </p>
                <div className="bg-card border border-border rounded-md p-3 text-xs font-mono break-all mb-3 text-muted-foreground">
                  {REVIEW_URL_IS_LIVE ? REVIEW_URL : "(link not yet configured)"}
                </div>
                <Button onClick={handleCopy} disabled={!REVIEW_URL_IS_LIVE} variant="secondary" className="w-full">
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </GlowCard>

              <GlowCard customSize glowColor="teal" className="bg-card/80 p-6">
                <h2 className="font-serif text-xl font-bold mb-3 flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-accent" /> Scan in person
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Show this QR code on your phone or print it for the counter.
                </p>
                <div className="bg-white rounded-md p-3 flex items-center justify-center min-h-[160px]">
                  {REVIEW_URL_IS_LIVE ? (
                    <img
                      src={QR_PATH}
                      alt="QR code linking to the Google review form"
                      width={160}
                      height={160}
                      className="block"
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground text-center px-4">
                      QR appears here once the review link is configured.
                    </p>
                  )}
                </div>
              </GlowCard>
            </div>
          </div>
        </section>

        <section className="py-12 border-t border-border">
          <div className="container mx-auto px-6 max-w-2xl">
            <h2 className="font-serif text-xl font-bold mb-4 text-center">
              Not sure what to say?
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Anything honest is more helpful than nothing. Two or three sentences is plenty. A few prompts if you're stuck:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>What was broken or missing before we worked together?</li>
              <li>What changed after the site launched?</li>
              <li>What did the process feel like — easy, fast, communicative?</li>
              <li>Would you recommend us to another Maine business owner?</li>
            </ul>
            <p className="text-center mt-8">
              <Link to="/say-thanks" className="text-sm text-accent hover:underline">
                Need wording for a text or email? →
              </Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 mt-auto">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p className="mb-1">
            {NAP.name} · {NAP.city}, {NAP.region} ·{" "}
            <a href={`tel:${NAP.phoneE164}`} className="hover:text-accent">
              {NAP.phone}
            </a>{" "}
            · {NAP.email}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Review;
