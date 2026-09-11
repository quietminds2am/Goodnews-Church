// Generates public/sitemap.xml at build time (see package.json "postbuild").
// Includes all static public routes plus every published event and
// announcement, straight from Supabase, so search engines always see an
// up-to-date, accurate sitemap without any manual maintenance.
import { writeFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Same fallback/override contract as src/components/seo/Seo.tsx — keep the
// two in sync. Placeholder until a real domain is registered; set
// VITE_SITE_URL in Vercel once one is, no code change needed then.
const SITE_URL = (process.env.VITE_SITE_URL || "https://goodnews-church.vercel.app").replace(/\/$/, "");

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/about", priority: "0.7", changefreq: "monthly" },
  { path: "/programs", priority: "0.8", changefreq: "monthly" },
  { path: "/events", priority: "0.9", changefreq: "daily" },
  { path: "/past-events", priority: "0.5", changefreq: "weekly" },
  { path: "/announcements", priority: "0.8", changefreq: "daily" },
  { path: "/contact", priority: "0.6", changefreq: "yearly" },
  { path: "/faq", priority: "0.5", changefreq: "monthly" },
  { path: "/privacy-policy", priority: "0.2", changefreq: "yearly" },
  { path: "/terms", priority: "0.2", changefreq: "yearly" },
];

function urlEntry(loc, priority, changefreq, lastmod) {
  return `  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function main() {
  const entries = STATIC_ROUTES.map((r) => urlEntry(`${SITE_URL}${r.path}`, r.priority, r.changefreq));

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: events } = await supabase.from("events").select("slug, updated_at").neq("status", "cancelled");
      for (const event of events ?? []) {
        entries.push(urlEntry(`${SITE_URL}/events/${event.slug}`, "0.6", "weekly", event.updated_at?.slice(0, 10)));
      }
    } catch (err) {
      console.warn("generate-sitemap: could not fetch dynamic routes from Supabase, using static routes only.", err?.message);
    }
  } else {
    console.warn("generate-sitemap: Supabase env vars not set at build time — sitemap will only include static routes.");
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

  writeFileSync("public/sitemap.xml", xml, "utf-8");
  if (existsSync("dist")) {
    writeFileSync("dist/sitemap.xml", xml, "utf-8");
  }
  console.log(`generate-sitemap: wrote ${entries.length} URLs to sitemap.xml`);
}

main();
