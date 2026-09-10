import { Link } from "react-router-dom";
import { useSiteSettings } from "../../context/SiteSettingsContext";

/**
 * Renders the church's logo mark — the RCCG denominational seal and the
 * Goodnews Area Youth Church seal shown side by side as a single unit, per
 * the supplied artwork. Do not split these into separate images.
 */
export function BrandLogo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { settings } = useSiteSettings();
  return (
    <Link to="/" className="flex items-center gap-3 shrink-0" aria-label={`${settings.church_name} — Home`}>
      <picture>
        <source srcSet="/assets/church-logo.webp" type="image/webp" />
        <img
          src="/assets/church-logo.png"
          alt={`${settings.church_name} logo`}
          className="h-10 w-auto sm:h-12"
          width={569}
          height={377}
        />
      </picture>
      <span className={variant === "dark" ? "hidden text-ink-900 sm:block" : "hidden text-white sm:block"}>
        <span className="block font-display text-base font-semibold leading-tight">{settings.church_short_name}</span>
      </span>
    </Link>
  );
}
