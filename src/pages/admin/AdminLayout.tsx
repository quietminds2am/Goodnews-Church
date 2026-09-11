import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Megaphone,
  CalendarDays,
  Users,
  Send,
  Mail,
  Image as ImageIcon,
  BadgePercent,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { classNames } from "../../lib/utils";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/events", label: "Events & Flyers", icon: CalendarDays },
  { to: "/admin/members", label: "Members", icon: Users },
  { to: "/admin/campaigns", label: "Email Campaigns", icon: Send },
  { to: "/admin/email-template", label: "Email Template", icon: Mail },
  { to: "/admin/brand-assets", label: "Brand Assets", icon: ImageIcon },
  { to: "/admin/adverts", label: "Adverts", icon: BadgePercent },
  { to: "/admin/settings", label: "Site Settings", icon: Settings },
];

export default function AdminLayout() {
  const { admin, signOut, isSuperAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login");
  }

  const items = isSuperAdmin ? [...NAV_ITEMS, { to: "/admin/admins", label: "Admin Users", icon: ShieldCheck }] : NAV_ITEMS;

  const sidebarContent = (
    <>
      <div className="px-5 py-6">
        <p className="font-display text-lg font-semibold text-white">Admin Panel</p>
        <p className="mt-0.5 text-xs text-ink-400">Goodnews Youth Church</p>
      </div>
      <nav aria-label="Admin navigation" className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              classNames(
                "flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-brand-600 text-white" : "text-ink-300 hover:bg-white/5 hover:text-white"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 px-3 py-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-ink-300 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          View public site
        </a>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-ink-300 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col bg-ink-900 lg:flex">{sidebarContent}</aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="relative flex h-full w-64 flex-col bg-ink-900">
            <button
              className="absolute right-3 top-4 rounded p-1.5 text-white hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-ink-100 bg-white px-4 lg:px-8">
          <button
            className="rounded p-2 text-ink-700 hover:bg-ink-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-ink-900">{admin?.full_name || admin?.email}</p>
              <p className="text-xs capitalize text-ink-400">{admin?.role.replace("_", " ")}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600">
              {(admin?.full_name || admin?.email || "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        {/* Fixed width, not just padding — on a very wide monitor the page
            itself stays capped instead of stretching edge to edge. Wide
            content (big tables) gets its own overflow-x-auto wrapper
            already (see e.g. MembersAdmin/CampaignsAdmin) and scrolls
            inside this fixed width rather than growing the page. */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 lg:p-8">
          <div className="mx-auto w-full min-w-0 max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
