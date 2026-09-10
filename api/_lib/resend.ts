import { Resend } from "resend";

let cachedClient: Resend | null = null;

export function getResend(): Resend {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Server is missing the RESEND_API_KEY environment variable.");
  }
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

export function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || "Goodnews Youth Church <onboarding@resend.dev>";
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
