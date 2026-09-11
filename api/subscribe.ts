import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { sendEmail } from "./_lib/mailer.js";
import { renderWelcomeEmail } from "./_lib/emailTemplates.js";
import { getSiteSettingsForEmail } from "./_lib/siteSettings.js";
import { getEmailBranding } from "./_lib/emailBranding.js";
import { randomToken } from "./_lib/token.js";
import { isRateLimited, getClientIp } from "./_lib/rateLimit.js";
import { HttpError } from "./_lib/auth.js";

// Placeholder until a real domain is registered — see src/components/seo/Seo.tsx.
const SITE_URL = process.env.VITE_SITE_URL || "https://goodnews-church.vercel.app";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{7,20}$/;

/**
 * Public newsletter signup. Moved server-side (rather than the client
 * inserting into `members` directly) so a successful subscribe reliably
 * triggers exactly one welcome email — the insert and the email are one
 * request, not two client-side steps that could get out of sync.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (isRateLimited(`subscribe:${getClientIp(req)}`, 10, 60_000)) {
      throw new HttpError(429, "Too many requests. Please wait a moment and try again.");
    }

    const { full_name, email, phone, hp_field, source } = req.body ?? {};

    // Honeypot: real visitors never fill this hidden field — a bot did.
    // Report success without doing anything, so the bot doesn't learn.
    if (typeof hp_field === "string" && hp_field.length > 0) {
      res.status(200).json({ success: true });
      return;
    }

    if (typeof full_name !== "string" || full_name.trim().length < 2) {
      throw new HttpError(400, "Please enter your full name.");
    }
    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      throw new HttpError(400, "Enter a valid email address.");
    }
    // `!= null` (loose) catches both undefined AND null in one check — the
    // client sends `phone: values.phone || null` when the field is empty,
    // so `phone !== undefined` alone let `null` fall through to the
    // typeof/regex check below and fail every submission with no phone.
    if (phone != null && phone !== "" && (typeof phone !== "string" || !PHONE_RE.test(phone.trim()))) {
      throw new HttpError(400, "Enter a valid phone number.");
    }

    const unsubscribeToken = randomToken();
    const supabaseAdmin = getSupabaseAdmin();
    const { error: insertError } = await supabaseAdmin.from("members").insert({
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      subscribed: true,
      source: typeof source === "string" && source ? source : "website",
      unsubscribe_token: unsubscribeToken,
    });

    if (insertError) {
      // Unique violation → already subscribed. Treat as a soft success —
      // no welcome email (they've already had one), no error shown.
      if (insertError.code === "23505") {
        res.status(200).json({ success: true, alreadySubscribed: true });
        return;
      }
      throw new HttpError(500, "We couldn't save your details right now. Please try again shortly.");
    }

    res.status(200).json({ success: true });

    // Welcome email is best-effort and happens after the response is sent —
    // a slow or failed send should never delay or break the signup itself.
    try {
      const [settings, branding] = await Promise.all([getSiteSettingsForEmail(), getEmailBranding()]);
      await sendEmail({
        to: email.trim().toLowerCase(),
        subject: `Welcome to ${settings.church_name}!`,
        html: renderWelcomeEmail({
          fullName: full_name,
          settings,
          unsubscribeUrl: `${SITE_URL}/api/unsubscribe?token=${unsubscribeToken}`,
          branding,
        }),
      });
    } catch (emailErr) {
      // eslint-disable-next-line no-console
      console.error("subscribe: welcome email failed to send", emailErr);
    }
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error("subscribe: unexpected error", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
