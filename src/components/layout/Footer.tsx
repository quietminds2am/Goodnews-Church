import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { NewsletterForm } from "../forms/NewsletterForm";
import { FacebookIcon, TiktokIcon } from "../icons/SocialIcons";

const socialIcon = {
  facebook: FacebookIcon,
  tiktok:  TiktokIcon,
} as const;

export function Footer() {
  const { settings } = useSiteSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink-900 text-ink-200">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <p className="font-display text-lg font-semibold text-white">{settings.church_short_name}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-300">{settings.tagline}</p>
          <ul className="mt-5 flex gap-3">
            {settings.socials.map((s) => {
              const Icon = socialIcon[s.platform as keyof typeof socialIcon];
              if (!Icon) return null;
              return (
                <li key={s.platform}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label ?? s.platform}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-600"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <nav aria-label="Footer navigation">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Explore</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/about">About Us</Link></li>
            <li><Link className="hover:text-white" to="/programs">Programs & Services</Link></li>
            <li><Link className="hover:text-white" to="/events">Upcoming Events</Link></li>
            <li><Link className="hover:text-white" to="/past-events">Past Events</Link></li>
            <li><Link className="hover:text-white" to="/announcements">Announcements</Link></li>
            <li><Link className="hover:text-white" to="/faq">FAQ</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm text-ink-300">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                {settings.address}, {settings.city}, {settings.country}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" aria-hidden />
              <a className="hover:text-white" href={`tel:${settings.phone.replace(/\s+/g, "")}`}>
                {settings.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              <a className="hover:text-white" href={`mailto:${settings.email}`}>
                {settings.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Stay in the loop</h2>
          <p className="mt-4 text-sm text-ink-300">
            Get reminders for Sunday services, programs, and upcoming events straight to your inbox.
          </p>
          <div className="mt-4">
            <NewsletterForm variant="dark" />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-ink-400 sm:flex-row">
          <p>
            © {year} {settings.church_name}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link className="hover:text-white" to="/privacy-policy">Privacy Policy</Link>
            <Link className="hover:text-white" to="/terms">Terms & Conditions</Link>
            <Link className="hover:text-white" to="/admin/login">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
