import { renderEmailShell, type EmailBrandingOptions } from "./mailer.js";
import type { EmailSiteSettings } from "./siteSettings.js";

/** Sent once, right after someone subscribes to the newsletter. */
export function renderWelcomeEmail(opts: {
  fullName?: string | null;
  settings: EmailSiteSettings;
  unsubscribeUrl: string;
  branding?: EmailBrandingOptions;
}): string {
  const firstName = opts.fullName?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hello,";

  const serviceTimesHtml = opts.settings.service_times.length
    ? `<table role="presentation" width="100%" style="border-collapse:collapse;margin:20px 0;">
        ${opts.settings.service_times
          .map(
            (s) => `<tr>
              <td style="padding:8px 0;border-bottom:1px solid #e9ebee;font-weight:600;color:#171b21;">${escapeHtml(s.label)}</td>
              <td style="padding:8px 0;border-bottom:1px solid #e9ebee;text-align:right;color:#4d5865;">${escapeHtml(s.time)}</td>
            </tr>`
          )
          .join("")}
      </table>`
    : "";

  const socialsHtml = opts.settings.socials.length
    ? `<p style="margin:20px 0 0;">
        ${opts.settings.socials
          .map(
            (s) =>
              `<a href="${escapeAttr(s.url)}" style="display:inline-block;margin:0 16px 0 0;color:#c96f22;font-weight:600;text-decoration:none;">${escapeHtml(
                s.label || s.platform
              )}</a>`
          )
          .join("")}
      </p>`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 16px;">${greeting}</p>
    <p style="margin:0 0 16px;">
      Welcome to the <strong>${escapeHtml(opts.settings.church_name)}</strong> family! We're thrilled you subscribed —
      you'll now be the first to hear about upcoming services, programs, and events.
    </p>
    <p style="margin:0 0 8px;color:#4d5865;font-style:italic;">${escapeHtml(opts.settings.tagline)}</p>
    ${serviceTimesHtml}
    <p style="margin:16px 0 0;">We can't wait to see you soon.</p>
    ${socialsHtml}
  `;

  return renderEmailShell({
    title: `Welcome to ${opts.settings.church_name}!`,
    bodyHtml,
    unsubscribeUrl: opts.unsubscribeUrl,
    branding: opts.branding,
  });
}

/** Sent to the church's inbox whenever the public contact form is submitted. */
export function renderContactNotificationEmail(opts: {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  branding?: EmailBrandingOptions;
}): string {
  const bodyHtml = `
    <p style="margin:0 0 16px;">You've received a new message from the website contact form.</p>
    <table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 20px;">
      <tr><td style="padding:6px 0;font-weight:600;width:110px;color:#171b21;">Name</td><td style="padding:6px 0;color:#37404b;">${escapeHtml(opts.name)}</td></tr>
      <tr><td style="padding:6px 0;font-weight:600;color:#171b21;">Email</td><td style="padding:6px 0;color:#37404b;"><a href="mailto:${escapeAttr(opts.email)}" style="color:#c96f22;">${escapeHtml(opts.email)}</a></td></tr>
      ${opts.phone ? `<tr><td style="padding:6px 0;font-weight:600;color:#171b21;">Phone</td><td style="padding:6px 0;color:#37404b;">${escapeHtml(opts.phone)}</td></tr>` : ""}
      <tr><td style="padding:6px 0;font-weight:600;color:#171b21;">Subject</td><td style="padding:6px 0;color:#37404b;">${escapeHtml(opts.subject)}</td></tr>
    </table>
    <p style="margin:0 0 8px;font-weight:600;color:#171b21;">Message</p>
    <p style="margin:0;white-space:pre-line;color:#37404b;">${escapeHtml(opts.message)}</p>
  `;

  return renderEmailShell({ title: "New contact form message", bodyHtml, branding: opts.branding });
}

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
function escapeAttr(input: string): string {
  return escapeHtml(input);
}
