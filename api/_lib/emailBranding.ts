import { getSupabaseAdmin } from "./supabaseAdmin.js";

/** Admin-editable visual branding for outgoing email — logo, accent color,
 * and a footer note. Stored as plain site_settings rows (same table the
 * public site's settings live in) so no new table/RLS surface is needed;
 * these three keys just aren't part of the public SiteSettings type since
 * only the admin email-template page and the mailer ever read them. */
export interface EmailBranding {
  logoUrl: string | null;
  accentColor: string;
  footerNote: string;
}

export const DEFAULT_EMAIL_BRANDING: EmailBranding = {
  logoUrl: null,
  accentColor: "#c96f22",
  footerNote: "",
};

const KEY_MAP = {
  email_header_logo_url: "logoUrl",
  email_accent_color: "accentColor",
  email_footer_note: "footerNote",
} as const;

/** Reads the current email branding. Never throws — falls back to defaults
 * so a settings-fetch hiccup never blocks an email from sending. */
export async function getEmailBranding(): Promise<EmailBranding> {
  try {
    const { data } = await getSupabaseAdmin()
      .from("site_settings")
      .select("key, value")
      .in("key", Object.keys(KEY_MAP));
    const branding = { ...DEFAULT_EMAIL_BRANDING };
    for (const row of (data ?? []) as { key: string; value: unknown }[]) {
      const field = KEY_MAP[row.key as keyof typeof KEY_MAP];
      if (field && typeof row.value === "string") {
        branding[field] = row.value;
      }
    }
    return branding;
  } catch {
    return DEFAULT_EMAIL_BRANDING;
  }
}
