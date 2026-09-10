import { Clock } from "lucide-react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { Reveal } from "../motion/Reveal";

export function ServiceTimesCard() {
  const { settings } = useSiteSettings();
  return (
    <section className="container-page -mt-10 relative z-10 sm:-mt-14">
      <Reveal className="card grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
        {settings.service_times.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Clock className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-ink-900">{item.label}</p>
              <p className="text-sm text-ink-500">{item.time}</p>
            </div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
