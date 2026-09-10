import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin";
import { sendEmail, renderEmailShell } from "./_lib/mailer";

const SITE_URL = process.env.VITE_SITE_URL || "https://www.goodnewsyouthchurch.org";
const BATCH_SIZE = 50;

/**
 * Scheduled function (see vercel.json → "crons") that emails subscribed
 * members about events happening tomorrow. Triggered automatically by
 * Vercel Cron, which sends the shared CRON_SECRET as a bearer token —
 * verified below so this endpoint can't be abused to spam members.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const { data: events, error: eventsError } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("status", "upcoming")
      .eq("event_date", tomorrowStr);

    if (eventsError) throw eventsError;
    if (!events || events.length === 0) {
      res.status(200).json({ message: "No events tomorrow — nothing sent." });
      return;
    }

    const { data: members, error: membersError } = await supabaseAdmin
      .from("members")
      .select("email, unsubscribe_token")
      .eq("subscribed", true);

    if (membersError) throw membersError;
    if (!members || members.length === 0) {
      res.status(200).json({ message: "No subscribed members — nothing sent." });
      return;
    }

    let totalSent = 0;

    for (const event of events) {
      const bodyHtml = `
        <p>This is a reminder that <strong>${escapeHtml(event.title)}</strong> is happening tomorrow${
        event.start_time ? ` at ${escapeHtml(event.start_time)}` : ""
      }${event.location ? ` at ${escapeHtml(event.location)}` : ""}.</p>
        <p>${escapeHtml(event.description).slice(0, 300)}</p>
        <p><a href="${SITE_URL}/events/${event.slug}" style="color:#c96f22;font-weight:600;">View event details →</a></p>
      `;

      const campaignInsert = await supabaseAdmin
        .from("email_campaigns")
        .insert({
          subject: `Reminder: ${event.title} is tomorrow`,
          body_html: bodyHtml,
          campaign_type: "event_reminder",
          status: "sending",
          related_event_id: event.id,
          recipient_count: 0,
        })
        .select()
        .single();

      let sentForEvent = 0;
      for (let i = 0; i < members.length; i += BATCH_SIZE) {
        const batch = members.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((member) =>
            sendEmail({
              to: member.email,
              subject: `Reminder: ${event.title} is tomorrow`,
              html: renderEmailShell({
                title: `${event.title} is tomorrow!`,
                bodyHtml,
                unsubscribeUrl: `${SITE_URL}/api/unsubscribe?token=${member.unsubscribe_token}`,
              }),
            })
          )
        );
        sentForEvent += results.filter((r) => r.status === "fulfilled").length;
      }

      totalSent += sentForEvent;

      if (campaignInsert.data) {
        await supabaseAdmin
          .from("email_campaigns")
          .update({ status: "sent", sent_at: new Date().toISOString(), recipient_count: sentForEvent })
          .eq("id", campaignInsert.data.id);
      }
    }

    res.status(200).json({ events: events.length, emailsSent: totalSent });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("cron-event-reminders: unexpected error", err);
    res.status(500).json({ error: "Something went wrong sending event reminders." });
  }
}

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
