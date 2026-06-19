import { Link } from "react-router-dom";
import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/spotlight-card";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { REVIEW_URL, REVIEW_URL_IS_LIVE } from "@/lib/reviewLink";
import { toast } from "@/hooks/use-toast";

const LINK = REVIEW_URL_IS_LIVE ? REVIEW_URL : "https://pleasantcovedesign.com/review";

const SMS_TEMPLATE = `Hi {name} — thanks again for trusting us with the site. If it's been working for you, would you mind dropping a quick Google review? Takes about 30 seconds: ${LINK}`;

const EMAIL_SUBJECT = "Quick favor — would you mind leaving a Google review?";
const EMAIL_BODY = `Hi {name},

Hope the site is treating you well. If you've had a good experience working with us, would you be willing to leave a short Google review? It genuinely helps other Maine small businesses find us, and it takes about 30 seconds.

Here's the direct link:
${LINK}

If you're not sure what to say, even one or two honest sentences is plenty. Thanks for considering it — and either way, I'm glad we got to work together.

— Ben
Pleasant Cove Design`;

interface TemplateCardProps {
  title: string;
  description: string;
  value: string;
}

function TemplateCard({ title, description, value }: TemplateCardProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: "Copied", description: `${title} copied to clipboard.` });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: "Select the text and copy manually." });
    }
  };
  return (
    <GlowCard customSize glowColor="emerald" className="bg-card/80 p-6">
      <h2 className="font-serif text-xl font-bold mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <pre className="bg-card border border-border rounded-md p-3 text-xs whitespace-pre-wrap font-mono text-muted-foreground mb-3 overflow-x-auto">
{value}
      </pre>
      <Button onClick={handleCopy} variant="secondary" className="w-full">
        <Copy className="h-4 w-4 mr-2" />
        {copied ? "Copied" : "Copy"}
      </Button>
    </GlowCard>
  );
}

const SayThanks = () => {
  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Review request templates"
        description="Internal templates for asking clients to leave a Google review."
        path="/say-thanks"
        noindex
      />
      <MarketingHeader />

      <main className="flex-1">
        <section className="pt-16 pb-10">
          <div className="container mx-auto px-6 max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-3 text-center">
              Internal · not indexed
            </p>
            <h1 className="font-serif text-4xl font-bold mb-4 text-center">
              Review request templates
            </h1>
            <p className="text-muted-foreground text-center mb-2">
              Replace <code className="text-accent">{`{name}`}</code> with the client's first name. The link is already filled in.
            </p>
            <p className="text-center mb-10">
              <Link to="/review" className="text-sm text-accent hover:underline">
                Or send them to the public /review page →
              </Link>
            </p>

            <div className="grid gap-4">
              <TemplateCard
                title="SMS / text message"
                description="Short and direct. Best for clients you talk to on text."
                value={SMS_TEMPLATE}
              />
              <TemplateCard
                title="Email — subject"
                description="Paste into the subject line."
                value={EMAIL_SUBJECT}
              />
              <TemplateCard
                title="Email — body"
                description="A little longer, sounds like you. Edit anything that doesn't."
                value={EMAIL_BODY}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SayThanks;
