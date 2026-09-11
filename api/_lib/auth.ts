import type { VercelRequest } from "@vercel/node";
import { getSupabaseAdmin } from "./supabaseAdmin.js";

export interface AuthorizedAdmin {
  id: string;
  email: string;
  role: "super_admin" | "editor";
}

/**
 * Verifies the bearer token on an incoming request and confirms the caller
 * is a registered admin. Every serverless function that mutates data or
 * sends email MUST call this first — client-side route protection alone is
 * never sufficient, since these endpoints are public HTTP URLs.
 */
export async function requireAdmin(req: VercelRequest, requireRole?: "super_admin"): Promise<AuthorizedAdmin> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing authorization token.");
  }
  const token = authHeader.slice("Bearer ".length);

  const supabaseAdmin = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    throw new HttpError(401, "Invalid or expired session.");
  }

  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from("admins")
    .select("id, email, role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (adminError || !adminRow) {
    throw new HttpError(403, "This account is not authorized to perform this action.");
  }

  if (requireRole && adminRow.role !== requireRole) {
    throw new HttpError(403, "This action requires Super Admin access.");
  }

  return adminRow as AuthorizedAdmin;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
