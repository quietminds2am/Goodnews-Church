import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { sendEmail, getFromAddress } from "./_lib/mailer.js";
import { renderContactNotificationEmail } from "./_lib/emailTemplates.js";
import { isRateLimited, getClientIp } from "./_lib/rateLimit.js";
import { HttpError } from "./_lib/auth.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{7,20}$/;

/** Destination for contact-form notifications. Defaults to the church's own
 * mailbox (GMAIL_USER) so nothing extra needs configuring — override with
 * CONTACT_NOTIFICATION_EMAIL to route them somewhere else later. */
function getContactNotificationEmail(): string {
  return process.env.CONTACT_NOTIFICATION_EMAIL || process.env.GMAIL_USER || "goodnewsyouthareahq@gmail.com";
}

/**
 * Public contact form. Moved server-side (rather than the client inserting
 * into `contact_messages` directly) so every submission also emails the
 * church immediately — messages weren't otherwise seen until an admin
 * happened to check the dashboard.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (isRateLimited(`contact:${getClientIp(req)}`, 10, 60_000)) {
      throw new HttpError(429, "Too many requests. Please wait a moment and try again.");
    }

    const { name, email, phone, subject, message, hp_field } = req.body ?? {};

    if (typeof hp_field === "string" && hp_field.length > 0) {
      res.status(200).json({ success: true });
      return;
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      throw new HttpError(400, "Please enter your name.");
    }
    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      throw new HttpError(400, "Enter a valid email address.");
    }
    if (phone !== undefined && phone !== "" && (typeof phone !== "string" || !PHONE_RE.test(phone.trim()))) {
      throw new HttpError(400, "Enter a valid phone number.");
    }
    if (typeof subject !== "string" || subject.trim().length < 3) {
      throw new HttpError(400, "Please add a short subject.");
    }
    if (typeof message !== "string" || message.trim().length < 10) {
      throw new HttpError(400, "Message should be at least 10 characters.");
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error: insertError } = await supabaseAdmin.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      subject: subject.trim(),
      message: message.trim(),
    });

    if (insertError) {
      throw new HttpError(500, "We couldn't send your message right now. Please try again, or reach us directly by phone or email.");
    }

    res.status(200).json({ success: true });

    // Notifying the church is best-effort — the message is already saved,
    // so a slow/failed email must never turn into an error for the visitor.
    try {
      await sendEmail({
        to: getContactNotificationEmail(),
        subject: `New contact message: ${subject.trim()}`,
        html: renderContactNotificationEmail({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : null,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
    } catch (emailErr) {
      // eslint-disable-next-line no-console
      console.error("contact: notification email failed to send", emailErr, { from: getFromAddress() });
    }
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error("contact: unexpected error", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
