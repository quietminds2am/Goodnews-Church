import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin";
import { requireAdmin, HttpError } from "./_lib/auth";
import { isRateLimited, getClientIp } from "./_lib/rateLimit";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (isRateLimited(`delete-admin:${getClientIp(req)}`, 10, 60_000)) {
      throw new HttpError(429, "Too many requests. Please wait a moment and try again.");
    }

    const caller = await requireAdmin(req, "super_admin");

    const { adminId } = req.body ?? {};
    if (typeof adminId !== "string" || adminId.length === 0) {
      throw new HttpError(400, "adminId is required.");
    }
    if (adminId === caller.id) {
      throw new HttpError(400, "You cannot remove your own admin account.");
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { error: deleteRowError } = await supabaseAdmin.from("admins").delete().eq("id", adminId);
    if (deleteRowError) throw new HttpError(500, "Could not remove this admin.");

    // Best-effort — also disable their ability to sign in at all.
    await supabaseAdmin.auth.admin.deleteUser(adminId);

    res.status(200).json({ success: true });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error("delete-admin: unexpected error", err);
    res.status(500).json({ error: "Something went wrong removing this admin." });
  }
}
