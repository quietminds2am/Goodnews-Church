import { useSiteSettings } from "../../context/SiteSettingsContext";
import { Reveal } from "../motion/Reveal";
import { Tilt } from "../motion/Tilt";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function PastorBioCard() {
  const { settings } = useSiteSettings();

  return (
    <section className="container-page py-16">
      <Reveal>
        <Tilt className="card grid gap-8 p-6 sm:p-10 md:grid-cols-[auto,1fr] md:items-center" strength={5}>
          {settings.pastor_photo_url ? (
            <img
              src={settings.pastor_photo_url}
              alt={settings.pastor_name}
              className="mx-auto h-40 w-40 shrink-0 rounded-full object-cover shadow-lifted sm:h-48 sm:w-48"
              width={192}
              height={192}
            />
          ) : (
            <div
              aria-hidden="true"
              className="mx-auto flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-brand-50 text-4xl font-semibold text-brand-600 shadow-lifted sm:h-48 sm:w-48"
            >
              {initialsOf(settings.pastor_name)}
            </div>
          )}
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">{settings.pastor_title}</p>
            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{settings.pastor_name}</h2>
            <p className="mt-4 text-ink-600">{settings.pastor_bio}</p>
          </div>
        </Tilt>
      </Reveal>
    </section>
  );
}
