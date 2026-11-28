import * as React from "react";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Globe,
  Wrench,
  ShieldCheck,
  Phone,
  MessageSquare,
  Mail,
  Facebook,
  Instagram,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { NAP, SOCIALS } from "@/lib/localPages";
import {
  SMALL_BUSINESS_WEBSITE,
  CARE_PLANS,
  ALACARTE_SERVICES,
  ALACARTE_NOTE,
  OWN_PLATFORM_NOTE,
} from "@/lib/pricingMenu";
import pcdLogo from "@/assets/pcd-logo.jpeg";
import lighthouseHero from "@/assets/lighthouse-hero.jpg";
import pierWebsite from "@/assets/pier-1-website.jpg.asset.json";
import ravenWebsite from "@/assets/raven-rock-homepage.jpg.asset.json";
import roofer from "@/assets/demos/roofer-hero.jpeg";
import restaurant from "@/assets/restaurant/lobster-thermidor-hero.webp";
import salon from "@/assets/salon/salon-hero-model.png";
import gallery from "@/assets/gallery/harbor-quiet.jpg";
import boutique from "@/assets/boutique/store-interior.jpg";

const smallerJobIds = ["content_refresh", "website_cleanup", "booking_integration", "forms_routing"];
const smallerJobs = smallerJobIds.flatMap((id) => {
  const service = ALACARTE_SERVICES.find((item) => item.id === id);
  return service ? [service] : [];
});
const concepts = [
  { name: "Roofer", image: roofer, path: "/demos/roofer" },
  { name: "Restaurant", image: restaurant, path: "/demos/restaurant" },
  { name: "Salon", image: salon, path: "/demos/salon" },
  { name: "Gallery", image: gallery, path: "/demos/gallery" },
  { name: "Boutique", image: boutique, path: "/demos/boutique" },
];

const LANTERN = { x: 1435, y: 276, w: 1920, h: 1088 };

/** Keeps the beam pinned to the lamp for whatever crop object-fit: cover produces. */
function useLanternPosition(ref: React.RefObject<HTMLElement>) {
  const [pos, setPos] = React.useState<{ x: number; y: number; scale: number } | null>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      const img = el.querySelector<HTMLImageElement>(".pcd-home-hero__bg");
      if (!img || !r.width) return;
      const op = getComputedStyle(img)
        .objectPosition.split(" ")
        .map((v) => parseFloat(v) / 100);
      const scale = Math.max(r.width / LANTERN.w, r.height / LANTERN.h);
      const dw = LANTERN.w * scale,
        dh = LANTERN.h * scale;
      const x = (r.width - dw) * (op[0] ?? 0.5) + LANTERN.x * scale;
      const y = (r.height - dh) * (op[1] ?? 0.5) + LANTERN.y * scale;
      const visible = x > 8 && x < r.width - 8 && y > 8 && y < r.height - 8;
      setPos(visible ? { x, y, scale } : null);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return pos;
}

type HomeContactOption = { label: string; href: string; Icon: LucideIcon; external?: boolean };

const homeContactOptions: HomeContactOption[] = [
  { label: "Call", href: `tel:${NAP.phoneE164}`, Icon: Phone },
  { label: "Text", href: `sms:${NAP.phoneE164}`, Icon: MessageSquare },
  { label: "Email", href: `mailto:${NAP.email}`, Icon: Mail },
  ...SOCIALS.map((social): HomeContactOption => ({
    ...social,
    Icon: social.label === "Instagram" ? Instagram : Facebook,
    external: true,
  })),
];

function HomeContactIcons({ className = "" }: { className?: string }) {
  return (
    <ul aria-label="Contact options" className={`pcd-contact-orbs ${className}`}>
      {homeContactOptions.map(({ label, href, Icon, external }) => (
        <li key={href}>
          <a
            href={href}
            aria-label={label}
            title={label}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            <Icon aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}

const homeHeadingFont = "font-[family-name:Manrope,system-ui,sans-serif]";

function HomeHero() {
  const ref = React.useRef<HTMLElement>(null);
  const lantern = useLanternPosition(ref);
  return (
    <section ref={ref} className="pcd-home-hero !min-h-0" aria-labelledby="home-hero-title">
      <img src={lighthouseHero} alt="" aria-hidden="true" className="pcd-home-hero__bg" />
      {lantern && (
        <div
          className="pcd-home-hero__light"
          aria-hidden="true"
          style={{ left: lantern.x, top: lantern.y, ["--hh-s" as string]: lantern.scale } as React.CSSProperties}
        >
          <span className="pcd-home-hero__reflect" aria-hidden="true">
            <span className="pcd-hh-sweep">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <i key={i} className={`pcd-hh-glint pcd-hh-glint--${i}`} />
              ))}
            </span>
          </span>
          <span className="pcd-home-hero__beam" />
          <span className="pcd-home-hero__flare" />
        </div>
      )}
      <div className="pcd-home-hero__scrim" aria-hidden="true" />
      <div className="pcd-home-hero__copy !py-10 md:!px-6 md:!py-16 lg:!py-20">
        <p className="mb-3 text-sm font-semibold text-[#c5e1d6] sm:mb-4">Websites for businesses, towns & nonprofits</p>
        <h1
          id="home-hero-title"
          data-speakable
          className={`${homeHeadingFont} text-[clamp(2.05rem,calc(7.2vw+0.4rem),4.25rem)] font-extrabold leading-[1.06] tracking-[-0.05em]`}
        >
          Web design for <span className="block">Midcoast Maine.</span>
        </h1>
        <p
          data-speakable
          className="pcd-home-hero__lede mt-4 !max-w-[44ch] text-[1.0625rem] leading-relaxed md:mt-5 md:text-xl"
        >
          We build new websites, improve the one you have, keep it running, and help local customers find you through search, Google Search ads, and Facebook and Instagram ads. You work directly with a local designer.
        </p>
        <div className="mt-5 flex w-full flex-col items-center gap-3 sm:mt-7 sm:w-fit sm:self-start">
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link to="/get-demo?from=homepage-hero" className="pcd-home-hero__btn pcd-home-hero__btn--primary">
              Tell us about your project <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
            <a href="#work" className="pcd-home-hero__btn pcd-home-hero__btn--secondary">
              See Our Work
            </a>
          </div>
          <HomeContactIcons className="pcd-home-hero__orbs" />
        </div>
      </div>
    </section>
  );
}

const Index = () => (
  <div className="homepage pcd-shell min-h-screen flex flex-col bg-page-bg text-foreground">
    <SEOHead
      title="Midcoast Maine Web Design | Pleasant Cove Design"
      description="Web design, website improvements, and ongoing care for Midcoast Maine small businesses, towns, and nonprofits. Larger organization builds by proposal."
      path="/"
      localBusiness
    />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@600..800&amp;display=swap" />
    <MarketingHeader activePage="home" />
    <main className="flex-1 [&_h2]:font-[family-name:Manrope,system-ui,sans-serif] [&_h2]:font-extrabold [&_h2]:tracking-[-0.035em] [&_h3]:font-[family-name:Manrope,system-ui,sans-serif] [&_h3]:tracking-[-0.025em]">
      <HomeHero />

      <section id="work" className="border-t border-border bg-background scroll-mt-28 py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="mb-6 text-2xl md:text-3xl">Recent client work</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                name: "Pier 1 Pizza",
                image: pierWebsite.url,
                href: "https://pier1pizza207.com/",
                alt: "The live Pier 1 Pizza homepage",
                description:
                  "A clear home for Pier 1’s menu, weekly events, and visitor information. Direct online-ordering links, contact details, and directions help guests find their next step.",
              },
              {
                name: "Raven Rock Construction",
                image: ravenWebsite.url,
                href: "https://www.ravenrockconstruction.com/",
                alt: "The current live Raven Rock Construction homepage, showing Built strong. Built for Maine. and a stone-and-timber building",
                description:
                  "A construction website with clear service pages, project photos, and a direct quote-inquiry path.",
              },
            ].map((project) => (
              <article
                key={project.name}
                className="border border-border rounded-xl overflow-hidden bg-card flex flex-col shadow-sm transition-shadow hover:shadow-md"
              >
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit the live ${project.name} website`}
                  className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
                >
                  <img
                    src={project.image}
                    alt={project.alt}
                    width="1440"
                    height="810"
                    loading="lazy"
                    className="w-full aspect-video max-h-[180px] md:max-h-none object-cover object-top"
                  />
                </a>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-3">{project.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{project.description}</p>
                  <Button asChild variant="link" className="mt-auto self-start p-0 h-auto">
                    <a href={project.href} target="_blank" rel="noopener noreferrer">
                      Visit live website <ArrowUpRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sm text-accent font-semibold mb-3">Start where you are</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-8">What does your website need?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <article className="pcd-soft-card rounded-2xl p-7 flex flex-col">
              <Globe className="h-6 w-6 text-accent mb-5" aria-hidden="true" />
              <h3 className="text-2xl font-bold mb-3">Build a website</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">
                A professional first website or a more complete home for your business.
              </p>
              <div className="mb-6">
                <p className="font-semibold">
                  {SMALL_BUSINESS_WEBSITE.label} · {SMALL_BUSINESS_WEBSITE.price}
                </p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{SMALL_BUSINESS_WEBSITE.scopeNote}</p>
              </div>
              <Button asChild variant="outline" className="mt-auto justify-between">
                <Link to="/get-demo?service=website">
                  Discuss a new website <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </article>
            <article className="pcd-soft-card rounded-2xl p-7 flex flex-col">
              <Wrench className="h-6 w-6 text-accent mb-5" aria-hidden="true" />
              <h3 className="text-2xl font-bold mb-3">Improve an existing site</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">
                Keep what works. Fix what doesn’t. Content updates, contact forms, booking connections, and mobile
                layout improvements.
              </p>
              <p className="font-semibold mb-2">Focused work, agreed scope</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Start with the issue you want solved. We’ll review the site and confirm the work and price before you
                commit.
              </p>
              <Button asChild variant="outline" className="mt-auto justify-between">
                <Link to="/get-demo?service=existing">
                  Discuss an improvement <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </article>
            <article className="pcd-soft-card rounded-2xl p-7 flex flex-col">
              <ShieldCheck className="h-6 w-6 text-accent mb-5" aria-hidden="true" />
              <h3 className="text-2xl font-bold mb-3">Ongoing website care</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">
                Hosting, maintenance, backups, and a reliable place to turn when your website needs attention.
              </p>
              <div className="space-y-4 mb-4">
                {CARE_PLANS.map((plan) => (
                  <div key={plan.id}>
                    <p className="font-semibold">
                      {plan.label} · {plan.price}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-6">{OWN_PLATFORM_NOTE}</p>
              <Button asChild variant="outline" className="mt-auto justify-between">
                <Link to="/get-demo?product=care_plan&tier=care_website">
                  Discuss website care <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </article>
          </div>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            <Link to="/organizations" className="font-medium text-foreground underline underline-offset-4">
              Websites for towns & nonprofits
            </Link>
            : larger builds, document migration, and staff publishing. Scoped by proposal.
          </p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Want to promote your business once the site is in shape? We also plan and manage Google Search, Facebook and Instagram ad campaigns.{" "}
            <Link to="/marketing-and-ads" className="font-medium text-foreground underline underline-offset-4">
              See Marketing & Ads services
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-background py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-sm text-accent font-semibold mb-3">Smaller jobs welcome</p>
              <h2 className="text-3xl md:text-4xl font-bold">You don’t always need a new website.</h2>
            </div>
            <Button asChild variant="ghost">
              <Link to="/pricing">
                Full pricing & scope <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {smallerJobs.map((service) => (
              <article key={service.id} className="pcd-soft-card rounded-2xl p-6 flex flex-col">
                <h3 className="font-semibold text-lg mb-2">{service.label}</h3>
                <p className="text-2xl font-bold mb-4">{service.price}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{service.description}</p>
                <Button asChild variant="link" className="mt-auto self-start p-0 h-auto">
                  <Link to="/pricing">
                    View scope <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed mt-7 max-w-3xl">{ALACARTE_NOTE}</p>
        </div>
      </section>

      <section id="demos" className="border-t border-border py-10 scroll-mt-28">
        <div className="max-w-6xl mx-auto px-6">
          <details className="group">
            <summary className="cursor-pointer py-3 text-xl font-[family-name:Manrope,system-ui,sans-serif] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
              Sample industry concepts
            </summary>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              Sample designs, not completed client projects. Explore an example for your industry.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {concepts.map((concept) => (
                <article key={concept.name} className="rounded-lg overflow-hidden border border-border bg-card">
                  <img
                    src={concept.image}
                    alt={`${concept.name} sample concept imagery`}
                    loading="lazy"
                    width="400"
                    height="300"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="p-3">
                    <h3 className="font-semibold">{concept.name}</h3>
                    <Button asChild variant="link" className="p-0 h-auto mt-2 text-sm">
                      <Link to={concept.path}>
                        Explore sample <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </details>
        </div>
      </section>

      <section className="py-12 md:py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-9">A straightforward way forward.</h2>
          <ol className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Talk & review",
                description:
                  "Tell us what you need, or start with a free website review. We’ll identify the right next step.",
              },
              {
                title: "Agree on scope",
                description:
                  "You receive a written proposal outlining the work, price, and payment terms. Projects begin with the existing deposit process once the scope is agreed.",
              },
              {
                title: "Build, check & launch",
                description:
                  "Review the work together, check the website on phones and desktop, and approve the launch.",
              },
            ].map((step, i) => (
              <li key={step.title} className="border-t-2 border-t-accent/50 pt-5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent font-semibold text-sm">
                  0{i + 1}
                </span>
                <h3 className="text-xl font-semibold mt-3 mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="about-ben" className="border-t border-border bg-background py-10 md:py-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-5">
            <img
              src={pcdLogo}
              alt="Pleasant Cove Design sailboat mark"
              width={40}
              height={40}
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">About Pleasant Cove Design</p>
              <h2 id="about-ben" className="text-2xl md:text-3xl font-bold">
                One designer, one point of contact.
              </h2>
            </div>
          </div>
          <div className="space-y-4 text-base md:text-lg leading-relaxed">
            <p>
              Pleasant Cove Design is run by Ben Dickinson in Midcoast Maine — a website studio for small
              businesses, towns, and nonprofits that need a website they can feel confident sending people to.
            </p>
            <p>
              The approach is straightforward: understand your business, explain the options in plain language, and
              agree on the work and price before anything begins. Whether you need a new website or a focused
              improvement, you’ll know what’s included and what comes next.
            </p>
          </div>
          <Link
            to="/get-demo?from=homepage-about"
            className="mt-5 inline-flex items-center gap-1 font-semibold text-accent underline-offset-4 hover:underline"
          >
            Tell us about your website <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="home-contact"
        className="border-t border-border bg-primary py-12 text-primary-foreground md:py-16"
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 id="home-contact" className="mb-4 text-3xl font-bold md:text-4xl">
            Let’s talk about your website.
          </h2>
          <p className="mb-6 text-lg leading-relaxed">
            Need a new site, a small fix, or help keeping it up to date? Tell us what you have in mind.
          </p>
          <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
            <Link to="/get-demo?from=homepage-contact">
              Send a project inquiry <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <HomeContactIcons className="mt-5" />
          <p className="mt-4 border-t border-primary-foreground/25 pt-4 text-sm leading-relaxed">
            Want feedback on your current site?{" "}
            <Link to="/get-demo?service=review" className="font-semibold underline underline-offset-4">
              Get a Free Website Review
            </Link>
          </p>
        </div>
      </section>
      <section className="py-7 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already a client?{" "}
          <Link to="/portal" className="underline underline-offset-4 hover:text-foreground">
            Open your client portal
          </Link>
        </p>
      </section>
    </main>
    <MarketingFooter />
  </div>
);
export default Index;
