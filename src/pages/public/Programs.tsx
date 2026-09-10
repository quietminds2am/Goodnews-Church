import { Clock, MapPin } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { Reveal } from "../../components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "../../components/motion/StaggerGroup";

export default function Programs() {
  const { settings } = useSiteSettings();

  const jsonLd = settings.service_times.map((s) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: s.label,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: settings.church_name,
      address: `${settings.address}, ${settings.city}, ${settings.country}`,
    },
    organizer: { "@type": "Organization", name: settings.church_name },
    description: s.time,
  }));

  return (
    <>
      <Seo
        title="Programs & Services"
        path="/programs"
        description="Sunday services, midweek programs, and recurring church activities — find a time that works for you."
        jsonLd={jsonLd}
      />

      <section className="bg-ink-900 py-16 text-white sm:py-20">
        <Reveal className="container-page">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">Join Us</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Programs & Services</h1>
          <p className="mt-4 max-w-2xl text-ink-200">
            There's always something happening at {settings.church_short_name}. Here's our regular weekly schedule.
          </p>
        </Reveal>
      </section>

      <section className="container-page py-16">
        <Reveal>
          <SectionHeading eyebrow="Weekly schedule" title="Service Times" />
        </Reveal>
        <StaggerGroup className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {settings.service_times.map((s) => (
            <StaggerItem key={s.label} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Clock className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{s.label}</h3>
              <p className="mt-1 text-sm text-ink-500">{s.time}</p>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-400">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {settings.address}, {settings.city}
              </p>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <Reveal className="mt-12 card p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Special Programs</h2>
          <p className="mt-2 text-ink-500">
            Beyond our weekly services, we host seasonal programs, youth conferences, and outreach events throughout
            the year. Check our{" "}
            <a href="/events" className="font-semibold text-brand-600 hover:underline">
              Events page
            </a>{" "}
            for upcoming dates, and{" "}
            <a href="/announcements" className="font-semibold text-brand-600 hover:underline">
              Announcements
            </a>{" "}
            for the latest updates.
          </p>
        </Reveal>
      </section>
    </>
  );
}
