import { getSupabaseAdmin } from "./supabaseAdmin.js";

/** Minimal shape of site_settings actually needed for outgoing emails. */
export interface EmailSiteSettings {
  church_name: string;
  tagline: string;
  service_times: { label: string; time: string }[];
  socials: { platform: string; url: string; label?: string }[];
}

const DEFAULTS: EmailSiteSettings = {
  church_name: "RCCG Goodnews Area Youth Church HQ",
  tagline: "A house of faith, family, and purpose for every young person.",
  service_times: [],
  socials: [],
};

/** Reads site_settings for use in email templates. Never throws — falls
 * back to sensible defaults so a settings-fetch hiccup never blocks an
 * email from sending. */
export async function getSiteSettingsForEmail(): Promise<EmailSiteSettings> {
  try {
    const { data } = await getSupabaseAdmin().from("site_settings").select("key, value");
    const merged = { ...DEFAULTS };
    for (const row of (data ?? []) as { key: string; value: unknown }[]) {
      if (row.key in merged) {
        // @ts-expect-error — key is validated against DEFAULTS above
        merged[row.key] = row.value;
      }
    }
    return merged;
  } catch {
    return DEFAULTS;
  }
}
