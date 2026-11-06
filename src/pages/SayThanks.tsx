import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { REVIEW_URL, REVIEW_URL_IS_LIVE } from "@/lib/reviewLink";
import { toast } from "@/hooks/use-toast";

const LINK = REVIEW_URL_IS_LIVE ? REVIEW_URL : "https://pleasantcovedesign.com/review";

const SMS_TEMPLATE = REVIEW_URL_IS_LIVE ? `Hi {name} — thanks again for trusting us with the site. If it's been working for you, would you mind dropping a quick Google review? Here’s the link: ${LINK}` : `Hi {name} — thanks for working with me. Would you share your honest feedback about the website and the process? ${LINK}`;

const EMAIL_SUBJECT = REVIEW_URL_IS_LIVE ? "Would you share an honest Google review?" : "Would you share your feedback?";
const EMAIL_BODY = REVIEW_URL_IS_LIVE ? `Hi {name},

Hope the site is treating you well. If you've had a good experience working with us, would you be willing to leave a short Google review? It genuinely helps other Maine small businesses find us, and it can be short.

Here's the direct link:
${LINK}

If you're not sure what to say, even one or two honest sentences is plenty. Thanks for considering it — and either way, I'm glad we got to work together.

— Ben
Pleasant Cove Design` : `Hi {name},

Thank you for working with me. I’d welcome your honest thoughts about the website and the process — what went well and what could be better.

You can email me from this page: ${LINK}

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
    <article className="bg-card p-6">
      <h2 className="font-serif text-xl font-bold mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <pre className="bg-card border border-border rounded-md p-3 text-xs whitespace-pre-wrap font-mono text-muted-foreground mb-3 overflow-x-auto">
{value}
      </pre>
      <Button onClick={handleCopy} variant="secondary" className="w-full">
        <Copy className="h-4 w-4 mr-2" />
        {copied ? "Copied" : "Copy"}
      </Button>
    </article>
  );
}

const SayThanks = () => {
  return (
    <div className="pcd-shell min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Review request templates"
        description="Internal templates for requesting honest client feedback."
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
      <MarketingFooter />
    </div>
  );
};

export default SayThanks;
