import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "../../context/SiteSettingsContext";

interface SeoProps {
  title?: string;
  description?: string;
  path?: string; // e.g. "/events/youth-conference-2026"
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

// Falls back to the live Vercel URL — this is a placeholder until a real
// domain is registered. Once one is, set VITE_SITE_URL in Vercel's project
// environment variables to the new domain and redeploy; that takes
// precedence over this fallback automatically, no code change needed.
const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://goodnews-church.vercel.app";

export function Seo({ title, description, path = "/", image, noindex = false, jsonLd }: SeoProps) {
  const { settings } = useSiteSettings();

  const fullTitle = title ? `${title} | ${settings.church_short_name}` : settings.seo_default_title;
  const desc = description ?? settings.seo_default_description;
  const canonical = `${SITE_URL.replace(/\/$/, "")}${path}`;
  const ogImage = image ?? settings.og_image_url ?? `${SITE_URL.replace(/\/$/, "")}/assets/og-default.jpg`;

  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={settings.church_short_name} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLdArray.map((entry, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
}

export { SITE_URL };
