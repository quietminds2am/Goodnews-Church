import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { sendEmail, renderEmailShell, getFromAddress } from "./_lib/mailer.js";
import { requireAdmin, HttpError } from "./_lib/auth.js";
import { isRateLimited, getClientIp } from "./_lib/rateLimit.js";
import { getEmailBranding } from "./_lib/emailBranding.js";

// Placeholder until a real domain is registered — see src/components/seo/Seo.tsx.
const SITE_URL = process.env.VITE_SITE_URL || "https://goodnews-church.vercel.app";
const BATCH_SIZE = 50; // sent concurrently per batch, regardless of email provider

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (isRateLimited(`send-campaign:${getClientIp(req)}`, 10, 60_000)) {
      throw new HttpError(429, "Too many requests. Please wait a moment and try again.");
    }

    const admin = await requireAdmin(req);
    const { campaignId } = req.body ?? {};
    if (!campaignId || typeof campaignId !== "string") {
      throw new HttpError(400, "campaignId is required.");
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .maybeSingle();

    if (campaignError || !campaign) {
      throw new HttpError(404, "Campaign not found.");
    }
    if (campaign.status === "sent" || campaign.status === "sending") {
      throw new HttpError(409, "This campaign has already been sent or is currently sending.");
    }

    const { data: members, error: membersError } = await supabaseAdmin
      .from("members")
      .select("email, unsubscribe_token")
      .eq("subscribed", true);

    if (membersError) throw new HttpError(500, "Could not load recipient list.");
    if (!members || members.length === 0) {
      throw new HttpError(400, "There are no subscribed members to send to yet.");
    }

    // Resolved once, up front — this is always the church's permanent
    // sending identity (a hardcoded constant in mailer.ts), never the
    // sending admin's own account. Failing fast here (before marking the
    // campaign "sending") means a misconfigured sender shows a clear error
    // instead of quietly failing every single delivery in the loop below.
    let senderEmail: string;
    try {
      senderEmail = getFromAddress();
    } catch (err) {
      throw new HttpError(500, err instanceof Error ? err.message : "Email sender is not configured.");
    }

    await supabaseAdmin.from("email_campaigns").update({ status: "sending", sender_email: senderEmail }).eq("id", campaignId);

    const branding = await getEmailBranding();
    let sentCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < members.length; i += BATCH_SIZE) {
      const batch = members.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((member) =>
          sendEmail({
            to: member.email,
            subject: campaign.subject,
            html: renderEmailShell({
              title: campaign.subject,
              bodyHtml: campaign.body_html,
              unsubscribeUrl: `${SITE_URL}/api/unsubscribe?token=${member.unsubscribe_token}`,
              branding,
            }),
          })
        )
      );
      for (const result of results) {
        if (result.status === "fulfilled") sentCount += 1;
        else errors.push(String(result.reason));
      }
    }

    const finalStatus = sentCount > 0 ? "sent" : "failed";
    await supabaseAdmin
      .from("email_campaigns")
      .update({
        status: finalStatus,
        sent_at: new Date().toISOString(),
        recipient_count: sentCount,
      })
      .eq("id", campaignId);

    if (errors.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`send-campaign: ${errors.length} deliveries failed for campaign ${campaignId} (sent by ${admin.email})`, errors.slice(0, 5));
    }

    res.status(200).json({ sent: sentCount, failed: errors.length });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error("send-campaign: unexpected error", err);
    const detail = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Something went wrong sending this campaign: ${detail}` });
  }
}
