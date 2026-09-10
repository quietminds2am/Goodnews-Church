import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Admin } from "../types/database";

interface AuthState {
  session: Session | null;
  admin: Admin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAdminProfile(userId: string) {
    const { data, error } = await supabase.from("admins").select("*").eq("id", userId).maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load admin profile", error);
      setAdmin(null);
      return;
    }
    setAdmin((data as Admin) ?? null);
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        await loadAdminProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await loadAdminProfile(newSession.user.id);
      } else {
        setAdmin(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    // Confirm this authenticated user is actually a registered admin.
    // Non-admins are signed back out immediately so a leaked Supabase
    // Auth account (e.g. a member who signed up elsewhere) can never
    // reach the dashboard even if authentication itself succeeds.
    const { data: adminRow } = await supabase.from("admins").select("*").eq("id", data.user.id).maybeSingle();
    if (!adminRow) {
      await supabase.auth.signOut();
      return { error: "This account is not authorized to access the admin panel." };
    }
    setAdmin(adminRow as Admin);
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAdmin(null);
  }

  const value = useMemo<AuthState>(
    () => ({
      session,
      admin,
      loading,
      signIn,
      signOut,
      isSuperAdmin: admin?.role === "super_admin",
    }),
    [session, admin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
