// Best-effort in-memory rate limiting. Serverless functions are not
// guaranteed to share memory across invocations/instances, so this is a
// defense-in-depth layer — not a substitute for Supabase RLS and admin
// checks, which remain the real access control. For strict multi-instance
// rate limiting, back this with Upstash Redis or Vercel's Edge Config.
const hits = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  if (entry.count > limit) return true;
  return false;
}

export function getClientIp(req: { headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return "unknown";
}
