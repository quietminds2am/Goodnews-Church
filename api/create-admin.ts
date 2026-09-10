import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin";
import { requireAdmin, HttpError } from "./_lib/auth";
import { isRateLimited, getClientIp } from "./_lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (isRateLimited(`create-admin:${getClientIp(req)}`, 10, 60_000)) {
      throw new HttpError(429, "Too many requests. Please wait a moment and try again.");
    }

    // Only a Super Admin may create new admin accounts.
    await requireAdmin(req, "super_admin");

    const { full_name, email, role } = req.body ?? {};
    if (typeof full_name !== "string" || full_name.trim().length < 2) {
      throw new HttpError(400, "A valid full name is required.");
    }
    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      throw new HttpError(400, "A valid email address is required.");
    }
    if (role !== "super_admin" && role !== "editor") {
      throw new HttpError(400, "Role must be either super_admin or editor.");
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim().toLowerCase());

    if (createError || !created.user) {
      throw new HttpError(400, createError?.message || "Could not invite this admin. They may already have an account.");
    }

    const { error: insertError } = await supabaseAdmin.from("admins").insert({
      id: created.user.id,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      role,
    });

    if (insertError) {
      // Roll back the auth user so we don't leave an orphaned account.
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new HttpError(500, "Could not finish creating this admin. Please try again.");
    }

    res.status(200).json({ success: true });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error("create-admin: unexpected error", err);
    res.status(500).json({ error: "Something went wrong inviting this admin." });
  }
}
