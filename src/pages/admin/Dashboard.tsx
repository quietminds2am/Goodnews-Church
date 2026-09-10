import { useQuery } from "@tanstack/react-query";
import { Megaphone, CalendarDays, Users, Mail, MessageSquare } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/admin/PageHeader";
import { StatCard } from "../../components/admin/StatCard";
import { LoadingState } from "../../components/ui/States";
import { useAuth } from "../../context/AuthContext";

function useDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [announcements, events, members, campaigns, messages] = await Promise.all([
        supabase.from("announcements").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "upcoming"),
        supabase.from("members").select("id", { count: "exact", head: true }).eq("subscribed", true),
        supabase.from("email_campaigns").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("handled", false),
      ]);
      return {
        announcements: announcements.count ?? 0,
        events: events.count ?? 0,
        members: members.count ?? 0,
        campaigns: campaigns.count ?? 0,
        unhandledMessages: messages.count ?? 0,
      };
    },
  });
}

export default function Dashboard() {
  const { admin } = useAuth();
  const { data, isLoading } = useDashboardStats();

  return (
    <>
      <PageHeader title={`Welcome back, ${admin?.full_name?.split(" ")[0] || "Admin"}`} description="Here's what's happening across the church website." />

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Published Announcements" value={data?.announcements ?? 0} icon={Megaphone} to="/admin/announcements" />
          <StatCard label="Upcoming Events" value={data?.events ?? 0} icon={CalendarDays} to="/admin/events" />
          <StatCard label="Subscribed Members" value={data?.members ?? 0} icon={Users} to="/admin/members" />
          <StatCard label="Email Campaigns" value={data?.campaigns ?? 0} icon={Mail} to="/admin/campaigns" />
        </div>
      )}

      {!isLoading && (data?.unhandledMessages ?? 0) > 0 && (
        <div className="card mt-6 flex items-center gap-4 border-warning-500/30 bg-warning-50 p-5">
          <MessageSquare className="h-5 w-5 shrink-0 text-warning-700" aria-hidden />
          <p className="text-sm text-ink-700">
            You have <strong>{data?.unhandledMessages}</strong> unread contact message
            {data?.unhandledMessages === 1 ? "" : "s"} awaiting a response.
          </p>
        </div>
      )}

      <div className="mt-8 card p-6">
        <h2 className="font-semibold">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/admin/announcements" className="btn-outline">Post an announcement</a>
          <a href="/admin/events" className="btn-outline">Upload an event flyer</a>
          <a href="/admin/campaigns" className="btn-outline">Send a reminder email</a>
          <a href="/admin/brand-assets" className="btn-outline">Manage logos</a>
        </div>
      </div>
    </>
  );
}
