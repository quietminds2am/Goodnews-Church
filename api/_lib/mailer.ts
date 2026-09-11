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

/** Wraps campaign HTML in a minimal, church-branded email shell. */
export function renderEmailShell(opts: { title: string; bodyHtml: string; unsubscribeUrl?: string }): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f7f8;font-family:Arial,Helvetica,sans-serif;color:#171b21;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#171b21;padding:24px 32px;">
                <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">RCCG Goodnews Area Youth Church HQ</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;">${escapeHtml(opts.title)}</h1>
                <div style="font-size:15px;line-height:1.6;color:#37404b;">${opts.bodyHtml}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e9ebee;">
                <p style="margin:0;font-size:12px;color:#78849699;">
                  You're receiving this because you subscribed to updates from RCCG Goodnews Area Youth Church HQ.
                  ${opts.unsubscribeUrl ? `<a href="${opts.unsubscribeUrl}" style="color:#78849699;">Unsubscribe</a>` : ""}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
