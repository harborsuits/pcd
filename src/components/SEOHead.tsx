import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  type?: "website" | "article";
  localBusiness?: boolean;
  areaServed?: string[];
}

const DOMAIN = "https://pleasantcovedesign.com";

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

export function SEOHead({
  title,
  description,
  path = "/",
  type = "website",
  localBusiness = false,
  areaServed,
}: SEOHeadProps) {
  const canonicalUrl = `${DOMAIN}${path}`;
  const fullTitle = path === "/" ? title : `${title} — Pleasant Cove Design`;

  const localBusinessJsonLd = localBusiness
    ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Pleasant Cove Design",
        url: canonicalUrl,
        email: "hello@pleasantcove.design",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Midcoast Maine",
          addressRegion: "ME",
          addressCountry: "US",
        },
        areaServed: (areaServed ?? DEFAULT_AREAS).map((a) => ({
          "@type": "City",
          name: a,
        })),
        description,
      }
    : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />

      {localBusinessJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(localBusinessJsonLd)}
        </script>
      )}
    </Helmet>
  );
}
