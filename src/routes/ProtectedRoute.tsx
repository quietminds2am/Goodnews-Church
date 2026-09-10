import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingState } from "../components/ui/States";
import type { AdminRole } from "../types/database";

export function ProtectedRoute({ children, requireRole }: { children: ReactNode; requireRole?: AdminRole }) {
  const { session, admin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState label="Checking your session…" />;

  if (!session || !admin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (requireRole && admin.role !== requireRole && admin.role !== "super_admin") {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return <>{children}</>;
}
