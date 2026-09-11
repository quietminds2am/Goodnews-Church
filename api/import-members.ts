import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { requireAdmin, HttpError } from "./_lib/auth.js";
import { isRateLimited, getClientIp } from "./_lib/rateLimit.js";
import { randomToken } from "./_lib/token.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ROWS = 2000;

interface ImportRow {
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  department?: string;
}

/** Leniently parses a date-of-birth from whatever format a CSV export used
 * (Google Forms, Excel, etc. all differ). Returns an ISO date string or
 * null — an unparseable DOB should never reject an otherwise-good row. */
function parseDate(input: string | undefined): string | null {
  if (!input || !input.trim()) return null;
  const raw = input.trim();

  // DD/MM/YYYY or MM/DD/YYYY or YYYY-MM-DD or YYYY/MM/DD
  const slashOrDash = raw.match(/^(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})$/);
  if (slashOrDash) {
    let [, a, b, c] = slashOrDash;
    let year: string, month: string, day: string;
    if (a.length === 4) {
      [year, month, day] = [a, b, c];
    } else if (c.length === 4) {
      // Ambiguous DD/MM vs MM/DD — assume DD/MM first (more common outside
      // the US, and this church is in Nigeria), but fall back to MM/DD if
      // that doesn't produce a valid day/month (e.g. "3/15/1998" can only
      // be MM/DD — day 15 isn't a valid month).
      [day, month, year] = [a, b, c];
      if (Number(month) > 12) [month, day] = [day, month];
    } else {
      return null;
    }
    const y = Number(year), m = Number(month), d = Number(day);
    if (!y || !m || !d || m > 12 || d > 31) return null;
    const iso = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return Number.isNaN(new Date(iso).getTime()) ? null : iso;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

/**
 * Bulk member import (CSV, parsed client-side — see MembersAdmin.tsx —
 * this endpoint receives already-mapped rows, not a raw file). Admin-only.
 * Imported members are `subscribed: true` by default and land in the same
 * `members` table every other subscriber is in, so they're immediately
 * live campaign recipients — there's no separate "subscribers" list.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (isRateLimited(`import-members:${getClientIp(req)}`, 5, 60_000)) {
      throw new HttpError(429, "Too many requests. Please wait a moment and try again.");
    }

    await requireAdmin(req);

    const { rows } = req.body ?? {};
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new HttpError(400, "No rows to import.");
    }
    if (rows.length > MAX_ROWS) {
      throw new HttpError(400, `Too many rows in one import (max ${MAX_ROWS}). Split the file and try again.`);
    }

    const supabaseAdmin = getSupabaseAdmin();
    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of rows as ImportRow[]) {
      const email = row.email?.trim().toLowerCase();
      const fullName = row.full_name?.trim();

      if (!email || !EMAIL_RE.test(email) || !fullName) {
        failed += 1;
        continue;
      }

      const { error } = await supabaseAdmin.from("members").insert({
        full_name: fullName,
        email,
        phone: row.phone?.trim() || null,
        date_of_birth: parseDate(row.date_of_birth),
        gender: row.gender?.trim() || null,
        department: row.department?.trim() || null,
        subscribed: true,
        source: "csv_import",
        unsubscribe_token: randomToken(),
      });

      if (error) {
        if (error.code === "23505") skipped += 1;
        else failed += 1;
        continue;
      }
      imported += 1;
    }

    res.status(200).json({ imported, skipped, failed });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error("import-members: unexpected error", err);
    res.status(500).json({ error: "Something went wrong importing members." });
  }
}
