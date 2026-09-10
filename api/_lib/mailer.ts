import { Resend } from "resend";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Email sending, provider-swappable without touching call sites.
 *
 * Right now: Gmail SMTP (set GMAIL_USER + GMAIL_APP_PASSWORD). Later: switch
 * to Resend by setting RESEND_API_KEY (and RESEND_FROM_EMAIL) and either
 * removing the Gmail vars or setting EMAIL_PROVIDER=resend explicitly — no
 * code change needed in api/send-campaign.ts or api/cron-event-reminders.ts,
 * both of which call `sendEmail()` below, not a specific provider's SDK.
 *
 * Gmail SMTP note: GMAIL_APP_PASSWORD must be a 16-character Google
 * "App Password" (Google Account → Security → 2-Step Verification →
 * App passwords), not the account's normal login password — Gmail rejects
 * SMTP auth with the account password once 2FA is enabled, and strongly
 * discourages allowing it otherwise. Gmail SMTP is also rate-limited
 * (~500 messages/day on a regular account) — fine for now, but the reason
 * to move to Resend for real campaign volume later.
 */

export type EmailProvider = "gmail" | "resend";

export function getEmailProvider(): EmailProvider {
  const explicit = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (explicit === "gmail" || explicit === "resend") return explicit;
  // No explicit choice: prefer Gmail if it's configured, since that's the
  // "for now" path — otherwise fall back to Resend.
  return process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD ? "gmail" : "resend";
}

export function getFromAddress(): string {
  if (getEmailProvider() === "gmail") {
    const user = process.env.GMAIL_USER;
    if (!user) throw new Error("Server is missing the GMAIL_USER environment variable.");
    return process.env.GMAIL_FROM_NAME ? `${process.env.GMAIL_FROM_NAME} <${user}>` : user;
  }
  return process.env.RESEND_FROM_EMAIL || "Goodnews Youth Church <onboarding@resend.dev>";
}

let gmailTransport: Transporter | null = null;
function getGmailTransport(): Transporter {
  if (gmailTransport) return gmailTransport;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("Server is missing GMAIL_USER / GMAIL_APP_PASSWORD environment variables.");
  }
  gmailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return gmailTransport;
}

let resendClient: Resend | null = null;
function getResendClient(): Resend {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Server is missing the RESEND_API_KEY environment variable.");
  resendClient = new Resend(apiKey);
  return resendClient;
}

/** Sends one email through whichever provider is configured (see `getEmailProvider`). Throws on failure. */
export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const from = getFromAddress();

  if (getEmailProvider() === "gmail") {
    await getGmailTransport().sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html });
    return;
  }

  const { error } = await getResendClient().emails.send({ from, to: opts.to, subject: opts.subject, html: opts.html });
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
