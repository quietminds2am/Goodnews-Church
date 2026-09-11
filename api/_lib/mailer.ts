import type { Resend } from "resend";
import type { Transporter } from "nodemailer";

/**
 * Email sending, provider-swappable without touching call sites.
 *
 * Right now: Gmail SMTP (set GMAIL_APP_PASSWORD). Later: switch to Resend
 * by setting RESEND_API_KEY (and RESEND_FROM_EMAIL) and either removing
 * GMAIL_APP_PASSWORD or setting EMAIL_PROVIDER=resend explicitly — no code
 * change needed in api/send-campaign.ts, api/subscribe.ts, api/contact.ts,
 * or api/cron-event-reminders.ts, all of which call `sendEmail()` below,
 * not a specific provider's SDK.
 *
 * The sending address is a hardcoded constant, not read from an env var —
 * every email (campaigns, welcome, contact notifications) always sends as
 * the church's own account, permanently, regardless of which admin
 * triggered the send or how env vars happen to be configured. There is no
 * code path anywhere in api/ that derives a "from" address from the
 * logged-in admin — `requireAdmin()`'s result is only ever used for
 * authorization checks and audit logging (see CHURCH_EMAIL usage below).
 *
 * Gmail SMTP note: GMAIL_APP_PASSWORD must be a 16-character Google
 * "App Password" generated on THIS account (Google Account → Security →
 * 2-Step Verification → App passwords — requires 2-Step Verification to be
 * turned on first), not the account's normal login password, and not an
 * app password from a different Google account. Gmail SMTP is also
 * rate-limited (~500 messages/day on a regular account) — fine for now,
 * but the reason to move to Resend for real campaign volume later.
 */

/** The church's permanent sending identity. Changing where mail sends from
 * means changing this constant (a deliberate code change, reviewed like any
 * other), never an env var — see the file-level comment above. Exported so
 * anything else that needs "the church's address" (e.g. where contact-form
 * notifications land, by default) reuses this instead of its own copy. */
export const CHURCH_EMAIL = "goodnewsyouthareahq@gmail.com";
const CHURCH_DISPLAY_NAME = "RCCG Goodnews Area Youth Church";

export type EmailProvider = "gmail" | "resend";

export function getEmailProvider(): EmailProvider {
  const explicit = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (explicit === "gmail" || explicit === "resend") return explicit;
  // No explicit choice: prefer Gmail if it's configured, since that's the
  // "for now" path — otherwise fall back to Resend.
  return process.env.GMAIL_APP_PASSWORD ? "gmail" : "resend";
}

export function getFromAddress(): string {
  if (getEmailProvider() === "gmail") {
    return `${process.env.GMAIL_FROM_NAME || CHURCH_DISPLAY_NAME} <${CHURCH_EMAIL}>`;
  }
  return process.env.RESEND_FROM_EMAIL || `${CHURCH_DISPLAY_NAME} <onboarding@resend.dev>`;
}

// Both SDKs are imported dynamically (only the active provider's module ever
// loads) so a problem in one provider's package — a bundling issue, a
// runtime-version mismatch, anything — can't take down the other, and
// cold starts don't pay for code that won't run.

let gmailTransport: Transporter | null = null;
async function getGmailTransport(): Promise<Transporter> {
  if (gmailTransport) return gmailTransport;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) {
    throw new Error("Server is missing the GMAIL_APP_PASSWORD environment variable.");
  }
  const { default: nodemailer } = await import("nodemailer");
  gmailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: CHURCH_EMAIL, pass },
  });
  return gmailTransport;
}

let resendClient: Resend | null = null;
async function getResendClient(): Promise<Resend> {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Server is missing the RESEND_API_KEY environment variable.");
  const { Resend } = await import("resend");
  resendClient = new Resend(apiKey);
  return resendClient;
}

/** Sends one email through whichever provider is configured (see `getEmailProvider`). Throws on failure. */
export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const from = getFromAddress();

  if (getEmailProvider() === "gmail") {
    const transport = await getGmailTransport();
    await transport.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html });
    return;
  }

  const client = await getResendClient();
  const { error } = await client.emails.send({ from, to: opts.to, subject: opts.subject, html: opts.html });
  if (error) throw new Error(error.message ?? "Resend failed to send the email.");
}

export interface EmailBrandingOptions {
  logoUrl?: string | null;
  accentColor?: string;
  footerNote?: string;
}

/** Renders a solid-color button, reused by any template that needs a CTA
 * (event reminders, campaign links). Table-based for email-client support. */
export function renderEmailButton(text: string, url: string, accentColor = "#c96f22"): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;">
    <tr>
      <td style="border-radius:8px;background:${accentColor};">
        <a href="${url}" style="display:inline-block;padding:12px 26px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(text)}</a>
      </td>
    </tr>
  </table>`;
}

/**
 * The one email shell every outgoing message is wrapped in — campaigns, the
 * subscriber welcome email, event reminders, and contact-form notifications
 * all render through this, so a branding change (logo/accent color/footer
 * note, admin-editable at /admin/email-template) updates every send path at
 * once with zero drift. `unsubscribeUrl` doubles as "is this member-facing":
 * present for anything a subscriber receives (shows the footer note + an
 * unsubscribe link), omitted for internal notifications like a new contact
 * message, which get a plain minimal footer instead.
 */
export function renderEmailShell(opts: {
  title: string;
  bodyHtml: string;
  unsubscribeUrl?: string;
  branding?: EmailBrandingOptions;
}): string {
  const accent = opts.branding?.accentColor || "#c96f22";
  const logoUrl = opts.branding?.logoUrl;
  const footerNote = opts.branding?.footerNote?.trim();
  const isMemberFacing = Boolean(opts.unsubscribeUrl);

  const headerHtml = logoUrl
    ? `<img src="${escapeAttr(logoUrl)}" alt="${escapeAttr(CHURCH_DISPLAY_NAME)}" height="40" style="height:40px;width:auto;display:block;" />`
    : `<p style="margin:0;color:#ffffff;font-size:17px;font-weight:700;letter-spacing:0.2px;">${escapeHtml(CHURCH_DISPLAY_NAME)}</p>`;

  const footerHtml = isMemberFacing
    ? `${footerNote ? `<p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:#4d5865;">${escapeHtml(footerNote)}</p>` : ""}
       <p style="margin:0;font-size:12px;color:#9aa2ab;">
         You're receiving this because you subscribed to updates from ${escapeHtml(CHURCH_DISPLAY_NAME)}.
         <a href="${opts.unsubscribeUrl}" style="color:#9aa2ab;text-decoration:underline;">Unsubscribe</a>
       </p>`
    : `<p style="margin:0;font-size:12px;color:#9aa2ab;">Sent automatically by the ${escapeHtml(CHURCH_DISPLAY_NAME)} website.</p>`;

  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
  <body style="margin:0;padding:0;background:#eef0f2;font-family:-apple-system,Segoe UI,Roboto,Arial,Helvetica,sans-serif;color:#171b21;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(13,15,19,0.08),0 8px 24px rgba(13,15,19,0.06);">
            <tr><td style="height:5px;background:${accent};line-height:5px;font-size:0;">&nbsp;</td></tr>
            <tr>
              <td style="background:#171b21;padding:22px 32px;">
                ${headerHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px;">
                <h1 style="margin:0 0 18px;font-size:21px;line-height:1.3;color:#0d0f13;">${escapeHtml(opts.title)}</h1>
                <div style="font-size:15px;line-height:1.65;color:#37404b;">${opts.bodyHtml}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 28px;border-top:1px solid #eef0f2;margin-top:8px;">
                ${footerHtml}
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;font-size:11px;color:#9aa2ab;">${escapeHtml(CHURCH_DISPLAY_NAME)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
function escapeAttr(input: string): string {
  return escapeHtml(input);
}
