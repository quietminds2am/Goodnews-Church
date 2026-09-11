// Writes a flat, fully-tagged HTML file per static public route into dist/,
// so a link shared on WhatsApp/Facebook/X/LinkedIn/Slack — none of which
// execute JavaScript before generating a preview — sees that page's real
// title, description, canonical URL, and share image instead of the
// generic homepage ones every route showed before.
//
// Scope: the ~10 fixed-path public pages only. Dynamic per-record pages
// (an individual event at /events/:slug) still render client-side only —
// giving those their own prerendered preview needs either an edge function
// or a server-rendering framework, a larger change than this script; the
// event *list* page (/events) is covered, which is what most sharing
// actually targets.
//
// How it's wired in: vercel.json has an explicit rewrite for each path
// below (checked before the SPA catch-all), pointing "/about" at
// "/about.html", etc. React still fully re-renders over this HTML on load
// (createRoot, not hydrateRoot — see src/main.tsx) so client-side behavior
// is completely unchanged; this only affects what the very first,
// no-JS response contains.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = (process.env.VITE_SITE_URL || "https://goodnews-church.vercel.app").replace(/\/$/, "");

const DEFAULT_SETTINGS = {
  church_name: "RCCG Goodnews Area Youth Church HQ",
  church_short_name: "Goodnews Youth Church",
  pastor_name: "Dr. Onifade David Kayode",
  seo_default_title: "RCCG Goodnews Area Youth Church HQ",
  seo_default_description:
    "Join RCCG Goodnews Area Youth Church HQ for Sunday worship, midweek programs, and community events under Pastor Dr. Onifade David Kayode.",
  og_image_url: null,
};

// Mirrors each page's own <Seo title=... description=... /> call — keep in
// sync if those change. `null` description means "dynamic, built below."
const STATIC_PAGES = [
  { file: "about", path: "/about", title: "About Us", description: null },
  {
    file: "programs",
    path: "/programs",
    title: "Programs & Services",
    description: "Sunday services, midweek programs, and recurring church activities — find a time that works for you.",
  },
  {
    file: "events",
    path: "/events",
    title: "Upcoming Events",
    description: "See flyers and details for every upcoming event, program, and gathering.",
  },
  {
    file: "past-events",
    path: "/past-events",
    title: "Past Events",
    description: "Relive our past events and programs — with links to photos and videos on our social media.",
  },
  {
    file: "announcements",
    path: "/announcements",
    title: "Announcements",
    description: "Official announcements from RCCG Goodnews Area Youth Church HQ.",
  },
  { file: "contact", path: "/contact", title: "Contact Us", description: null },
  {
    file: "faq",
    path: "/faq",
    title: "Frequently Asked Questions",
    description: "Answers to common questions about visiting and joining us.",
  },
  {
    file: "privacy-policy",
    path: "/privacy-policy",
    title: "Privacy Policy",
    description: "How we collect, use, and protect your information.",
  },
  { file: "terms", path: "/terms", title: "Terms & Conditions", description: "Terms and conditions for using this website." },
];

function escapeHtml(input) {
  return input.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// title/description are handled by injectHead's direct <title>/<meta> replace
// below — this only adds the tags the base template doesn't have at all.
function buildHead({ fullTitle, description, canonical, ogImage, siteName }) {
  const t = escapeHtml(fullTitle);
  const d = escapeHtml(description);
  return `<link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${ogImage}" />`;
}

/** Replaces the template's own <title>/<meta description> and injects the
 * rest of the tag block right before </head>. */
function injectHead(template, headExtra, fullTitle, description) {
  let html = template
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(fullTitle)}</title>`)
    .replace(/<meta\s+name="description"[^>]*\/?>/s, `<meta name="description" content="${escapeHtml(description)}" />`);
  return html.replace("</head>", `    ${headExtra}\n  </head>`);
}

async function main() {
  if (!existsSync("dist/index.html")) {
    console.warn("prerender: dist/index.html not found — skipping (run after `vite build`).");
    return;
  }

  let settings = { ...DEFAULT_SETTINGS };
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase.from("site_settings").select("key, value");
      for (const row of data ?? []) {
        if (row.key in settings) settings[row.key] = row.value;
      }
    } catch (err) {
      console.warn("prerender: could not fetch site_settings, using defaults.", err?.message);
    }
  }

  const template = readFileSync("dist/index.html", "utf-8");
  const ogImageDefault = settings.og_image_url || `${SITE_URL}/assets/og-default.jpg`;

  // Home ('/') is already served at dist/index.html directly — enhance it
  // in place rather than writing a separate file.
  const homeHead = buildHead({
    fullTitle: settings.seo_default_title,
    description: settings.seo_default_description,
    canonical: `${SITE_URL}/`,
    ogImage: ogImageDefault,
    siteName: settings.church_short_name,
  });
  writeFileSync("dist/index.html", injectHead(template, homeHead, settings.seo_default_title, settings.seo_default_description), "utf-8");

  const dynamicDescriptions = {
    about: `Learn about ${settings.church_name}, our mission, and our leadership under ${settings.pastor_name}.`,
    contact: `Get in touch with ${settings.church_name}.`,
  };

  let written = 1; // index.html counted
  for (const p of STATIC_PAGES) {
    const description = p.description ?? dynamicDescriptions[p.file];
    const fullTitle = `${p.title} | ${settings.church_short_name}`;
    const canonical = `${SITE_URL}${p.path}`;
    const head = buildHead({ fullTitle, description, canonical, ogImage: ogImageDefault, siteName: settings.church_short_name });
    const html = injectHead(template, head, fullTitle, description);
    writeFileSync(`dist/${p.file}.html`, html, "utf-8");
    written += 1;
  }

  console.log(`prerender: wrote ${written} tagged HTML files (index + ${STATIC_PAGES.length} static routes).`);
}

main();
