import type { VercelRequest, VercelResponse } from "@vercel/node";
import { renderEmailShell, renderEmailButton } from "./_lib/mailer.js";
import { requireAdmin, HttpError } from "./_lib/auth.js";
import { isRateLimited, getClientIp } from "./_lib/rateLimit.js";

/**
 * Renders a sample email with the *draft* branding values from the admin
 * email-template form — not-yet-saved — through the exact same
 * `renderEmailShell()` used for every real send. The admin page shows the
 * returned HTML in an iframe, so the preview can never drift from reality:
 * it's not a re-implementation, it's the real function.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (isRateLimited(`preview-email-template:${getClientIp(req)}`, 30, 60_000)) {
      throw new HttpError(429, "Too many requests. Please wait a moment and try again.");
    }

    await requireAdmin(req);

    const { logoUrl, accentColor, footerNote } = req.body ?? {};
    const branding = {
      logoUrl: typeof logoUrl === "string" && logoUrl ? logoUrl : null,
      accentColor: typeof accentColor === "string" && accentColor ? accentColor : "#c96f22",
      footerNote: typeof footerNote === "string" ? footerNote : "",
    };

    const bodyHtml = `
      <p style="margin:0 0 16px;">Hi Sarah,</p>
      <p style="margin:0 0 16px;">
        This is a sample announcement so you can see exactly how your emails will look —
        the header, accent color, and footer note below reflect what you've set on this page
        (even before you save).
      </p>
      <p style="margin:0 0 16px;">Join us this Sunday as we continue our series on faith and purpose.</p>
      ${renderEmailButton("View Event Details", "#", branding.accentColor)}
    `;

    const html = renderEmailShell({
      title: "Sample: Youth Conference — This Sunday",
      bodyHtml,
      unsubscribeUrl: "#",
      branding,
    });

    res.status(200).json({ html });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error("preview-email-template: unexpected error", err);
    res.status(500).json({ error: "Couldn't render a preview right now." });
  }
}
