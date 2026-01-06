import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  type?: "website" | "article";
}

const DOMAIN = "https://pleasantcovedesign.com";

export function SEOHead({ 
  title, 
  description, 
  path = "/",
  type = "website" 
}: SEOHeadProps) {
  const canonicalUrl = `${DOMAIN}${path}`;
  const fullTitle = path === "/" ? title : `${title} — Pleasant Cove Design`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      
      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
