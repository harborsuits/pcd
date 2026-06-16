import { Helmet } from "react-helmet-async";
import { NAP, VERTICALS } from "@/lib/localPages";
import ogImageDefault from "@/assets/og-image.jpg";

interface FAQItem {
  question: string;
  answer: string;
}

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface ServiceSchema {
  slug: string;
  name: string;
  description: string;
  serviceType?: string;
  areaServed?: string[];
}

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  type?: "website" | "article";
  localBusiness?: boolean;
  areaServed?: string[];
  faq?: FAQItem[];
  breadcrumbs?: BreadcrumbItem[];
  image?: string;
  noindex?: boolean;
  socialLinks?: string[];
  googleBusinessUrl?: string;
  service?: ServiceSchema;
  datePublished?: string;
  dateModified?: string;
}

const DOMAIN = "https://pleasantcovedesign.com";
// Static branded social preview (1216x640, ~16:8.4). Hosted on the project domain
// after build so external crawlers (LinkedIn, Slack, iMessage, ChatGPT) can always reach it.
const DEFAULT_IMAGE = `${DOMAIN}${ogImageDefault}`;

const DEFAULT_AREAS = [
  "Newcastle, ME",
  "Damariscotta, ME",
  "Wiscasset, ME",
  "Boothbay Harbor, ME",
  "Camden, ME",
  "Rockland, ME",
  "Brunswick, ME",
  "Bath, ME",
];

// Stable IDs let nodes cross-reference each other in the @graph.
const ORG_ID = `${DOMAIN}/#organization`;
const WEBSITE_ID = `${DOMAIN}/#website`;

const BUILD_DATE = new Date().toISOString().slice(0, 10);

// Cross-reference every vertical Service node (defined per /websites-for/[slug] page).
// This wires the Organization to its full service catalog at the entity level.
const OFFER_CATALOG = {
  "@type": "OfferCatalog",
  name: "Web design services",
  itemListElement: VERTICALS.map((v) => ({
    "@type": "Offer",
    itemOffered: { "@id": `${DOMAIN}/websites-for/${v.slug}#service` },
  })),
};

function buildBaseGraph(sameAs: string[]) {
  return [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: NAP.name,
      url: DOMAIN,
      email: NAP.email,
      telephone: NAP.phoneE164,
      logo: {
        "@type": "ImageObject",
        url: `${DOMAIN}/apple-touch-icon.png`,
        width: 512,
        height: 512,
        caption: NAP.name,
      },
      image: DEFAULT_IMAGE,
      description:
        "Midcoast Maine web design studio helping small businesses fix outdated websites, broken contact flows, and weak mobile experiences that cost them customers.",
      address: {
        "@type": "PostalAddress",
        addressLocality: NAP.city,
        addressRegion: NAP.region,
        addressCountry: "US",
      },
      areaServed: DEFAULT_AREAS.map((a) => ({ "@type": "City", name: a })),
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: NAP.phoneE164,
          email: NAP.email,
          contactType: "customer service",
          areaServed: "US",
          availableLanguage: ["English"],
        },
      ],
      knowsAbout: [
        "Web design",
        "Small business websites",
        "Local SEO",
        "Booking integrations",
        "AI receptionist",
        "Website redesign",
      ],
      sameAs: sameAs,
      hasOfferCatalog: OFFER_CATALOG,
      potentialAction: {
        "@type": "ReserveAction",
        name: "Book a Free Demo",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${DOMAIN}/get-demo`,
          actionPlatform: [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/MobileWebPlatform",
          ],
        },
        result: {
          "@type": "Reservation",
          name: "Free website demo",
        },
      },
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: DOMAIN,
      name: NAP.name,
      publisher: { "@id": ORG_ID },
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${DOMAIN}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

export function SEOHead({
  title,
  description,
  path = "/",
  type = "website",
  localBusiness = false,
  areaServed,
  faq,
  breadcrumbs,
  image,
  noindex = false,
  socialLinks = [],
  googleBusinessUrl,
  service,
  datePublished,
  dateModified,
}: SEOHeadProps) {
  const canonicalUrl = `${DOMAIN}${path}`;
  // Only append brand suffix if combined length stays under 60 chars (SERP truncation limit).
  const withSuffix = `${title} — Pleasant Cove Design`;
  const fullTitle = path === "/" || withSuffix.length > 60 ? title : withSuffix;
  const ogImage = image ?? DEFAULT_IMAGE;
  const modified = dateModified ?? BUILD_DATE;

  const sameAs = [
    "https://www.facebook.com/pleasantcovedesign",
    "https://www.instagram.com/pleasantcovedesign",
    ...(googleBusinessUrl ? [googleBusinessUrl] : []),
    ...socialLinks,
  ];

  const graph: Record<string, unknown>[] = [...buildBaseGraph(sameAs)];

  // WebPage / Article node — anchors this URL to the Organization and exposes
  // a speakableSpecification telling AI assistants which DOM nodes are the
  // canonical answer text to read aloud or quote.
  if (type === "article") {
    graph.push({
      "@type": "Article",
      "@id": `${canonicalUrl}#article`,
      url: canonicalUrl,
      headline: title,
      name: fullTitle,
      description,
      image: ogImage,
      isPartOf: { "@id": WEBSITE_ID },
      mainEntityOfPage: { "@id": `${canonicalUrl}#article` },
      about: { "@id": ORG_ID },
      inLanguage: "en-US",
      author: { "@id": ORG_ID },
      publisher: { "@id": ORG_ID },
      ...(datePublished ? { datePublished } : {}),
      dateModified: modified,
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "[data-speakable]"],
      },
    });
  } else {
    graph.push({
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: fullTitle,
      description,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORG_ID },
      inLanguage: "en-US",
      ...(datePublished ? { datePublished } : {}),
      dateModified: modified,
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "[data-speakable]"],
      },
    });
  }

  if (localBusiness) {
    graph.push({
      "@type": "ProfessionalService",
      "@id": `${canonicalUrl}#localbusiness`,
      name: NAP.name,
      url: canonicalUrl,
      email: NAP.email,
      telephone: NAP.phoneE164,
      image: ogImage,
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        addressLocality: NAP.city,
        addressRegion: NAP.region,
        addressCountry: "US",
      },
      areaServed: (areaServed ?? DEFAULT_AREAS).map((a) => ({
        "@type": "City",
        name: a,
      })),
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "09:00",
          closes: "17:00",
        },
      ],
      // Free-text supplement so crawlers / LLMs see the appointment policy.
      // schema.org has no first-class "by appointment" field on
      // OpeningHoursSpecification, so we expose it via a description.
      description: `${description} Also available by appointment.`,
      parentOrganization: { "@id": ORG_ID },
    });
  }

  if (service) {
    const serviceAreas = service.areaServed ?? DEFAULT_AREAS;
    graph.push({
      "@type": "Service",
      "@id": `${DOMAIN}/websites-for/${service.slug}#service`,
      name: service.name,
      description: service.description,
      serviceType: service.serviceType ?? "Web design",
      provider: { "@id": ORG_ID },
      areaServed: serviceAreas.map((a) => ({ "@type": "City", name: a })),
      audience: {
        "@type": "BusinessAudience",
        audienceType: "Small business owners",
      },
      url: canonicalUrl,
    });
  }

  if (faq && faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonicalUrl}#faq`,
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    });
  }

  if (breadcrumbs && breadcrumbs.length > 0) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${canonicalUrl}#breadcrumb`,
      itemListElement: breadcrumbs.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: `${DOMAIN}${b.path}`,
      })),
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Geo signals */}
      <meta name="geo.region" content="US-ME" />
      <meta name="geo.placename" content="Midcoast Maine" />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={NAP.name} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
