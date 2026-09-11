import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";

/** Public one-click unsubscribe link used in campaign emails. No auth
 * required by design (that's the point of an unsubscribe link) — the
 * random, unguessable per-member token is what authorizes the action. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = typeof req.query.token === "string" ? req.query.token : undefined;

  if (!token) {
    res.status(400).send("Missing unsubscribe token.");
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("members").update({ subscribed: false }).eq("unsubscribe_token", token);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (error) {
    res.status(400).send("<p>We couldn't process your request. The link may be invalid or expired.</p>");
    return;
  }

  res.status(200).send(
    "<!doctype html><html><body style=\"font-family:Arial,sans-serif;padding:40px;text-align:center;\"><h1>You've been unsubscribed</h1><p>You will no longer receive email updates from RCCG Goodnews Area Youth Church HQ. You can resubscribe anytime from our website.</p></body></html>"
  );
}
