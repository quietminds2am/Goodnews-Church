import { Mail, Phone, MapPin } from "lucide-react";
import { ContactForm } from "../../components/forms/ContactForm";
import { Seo } from "../../components/seo/Seo";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function Contact() {
  const { settings } = useSiteSettings();

  return (
    <>
      <Seo title="Contact Us" path="/contact" description={`Get in touch with ${settings.church_name}.`} />

      <section className="bg-ink-900 py-16 text-white sm:py-20">
        <div className="container-page">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">We'd love to hear from you</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Contact Us</h1>
        </div>
      </section>

      <div className="container-page grid gap-10 py-16 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold">Reach us directly</h2>
          <ul className="mt-5 space-y-4 text-ink-600">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
              <span>
                {settings.address}, {settings.city}, {settings.country}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
              <a className="hover:text-brand-600" href={`tel:${settings.phone.replace(/\s+/g, "")}`}>
                {settings.phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
              <a className="hover:text-brand-600" href={`mailto:${settings.email}`}>
                {settings.email}
              </a>
            </li>
          </ul>
        </div>

        <div className="card p-6 sm:p-8 lg:col-span-3">
          <h2 className="text-xl font-semibold">Send us a message</h2>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </>
  );
}
