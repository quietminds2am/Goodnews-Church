import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X, LockKeyhole } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { BrandLogo } from "./BrandLogo";
import { classNames } from "../../lib/utils";

const NAV_LINKS = [
  { to: "/about", label: "About" },
  { to: "/programs", label: "Programs & Services" },
  { to: "/events", label: "Events" },
  { to: "/past-events", label: "Past Events" },
  { to: "/announcements", label: "Announcements" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="container-page flex h-16 items-center justify-between sm:h-20">
        <BrandLogo />

        <nav aria-label="Primary" className="hidden lg:flex lg:items-center lg:gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                classNames(
                  "rounded px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "text-brand-600" : "text-ink-700 hover:text-brand-600"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <NavLink
            to="/admin/login"
            className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-medium text-ink-500 hover:text-brand-600"
          >
            <LockKeyhole className="h-4 w-4" aria-hidden />
            Admin
          </NavLink>
          <NavLink to="/contact" className="btn-primary">
            Get Connected
          </NavLink>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded p-2 text-ink-800 hover:bg-ink-100 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile"
            className="overflow-hidden border-t border-ink-100 bg-white px-4 lg:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pb-6 pt-2">
              <ul className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        classNames(
                          "block rounded px-3 py-3 text-base font-medium",
                          isActive ? "bg-brand-50 text-brand-600" : "text-ink-800 hover:bg-ink-50"
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <NavLink to="/contact" className="btn-primary mt-4 w-full">
                Get Connected
              </NavLink>
              <NavLink
                to="/admin/login"
                className="mt-3 flex items-center justify-center gap-1.5 rounded px-3 py-2 text-sm font-medium text-ink-500 hover:text-brand-600"
              >
                <LockKeyhole className="h-4 w-4" aria-hidden />
                Admin
              </NavLink>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
