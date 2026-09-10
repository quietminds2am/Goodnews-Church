import { Hero } from "../../components/home/Hero";
import { ServiceTimesCard } from "../../components/home/ServiceTimesCard";
import { PastorBioCard } from "../../components/home/PastorBioCard";
import { AnnouncementsPreview } from "../../components/home/AnnouncementsPreview";
import { UpcomingEventsPreview } from "../../components/home/UpcomingEventsPreview";
import { AdvertBanner } from "../../components/home/AdvertBanner";
import { MediaPartners } from "../../components/home/MediaPartners";
import { NewsletterForm } from "../../components/forms/NewsletterForm";
import { Seo, SITE_URL } from "../../components/seo/Seo";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { Reveal } from "../../components/motion/Reveal";

export default function Home() {
  const { settings } = useSiteSettings();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Church",
      name: settings.church_name,
      url: SITE_URL,
      address: {
        "@type": "PostalAddress",
        streetAddress: settings.address,
        addressLocality: settings.city,
        addressCountry: settings.country,
      },
      telephone: settings.phone,
      email: settings.email,
      sameAs: settings.socials.map((s) => s.url),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.church_short_name,
      url: SITE_URL,
    },
  ];

  return (
    <>
      <Seo path="/" jsonLd={jsonLd} />
      <Hero />
      <ServiceTimesCard />
      <PastorBioCard />
      <AdvertBanner placement="home_top" />
      <AnnouncementsPreview />
      <UpcomingEventsPreview />
      <AdvertBanner placement="home_middle" />
      <MediaPartners />
      <section className="container-page py-16">
        <Reveal className="card mx-auto max-w-2xl p-8 text-center">
          <h2 className="text-2xl font-semibold">Never miss an update</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-500">
            Subscribe to get service reminders, program updates, and event announcements by email.
          </p>
          <div className="mx-auto mt-6 max-w-md text-left">
            <NewsletterForm />
          </div>
        </Reveal>
      </section>
    </>
  );
}
