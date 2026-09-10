import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { classNames } from "../../lib/utils";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function FAQ() {
  const { settings } = useSiteSettings();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What time should I arrive for Sunday service?",
      a: `We recommend arriving 15 minutes early. Our main Sunday Worship Service details are listed on the Programs & Services page.`,
    },
    {
      q: "Is there parking available at the church?",
      a: "Yes, parking is available on-site for members and visitors. Ushers will be on hand to help direct you.",
    },
    {
      q: "How do I join a program or department?",
      a: "Reach out through our Contact page or speak with any usher after a service — our team will connect you with the right department.",
    },
    {
      q: "How can I stay updated on events?",
      a: "Subscribe to our email list from the homepage or footer, follow us on social media, and check the Events and Announcements pages regularly.",
    },
    {
      q: "Who do I contact for prayer requests or pastoral care?",
      a: `You can reach us at ${settings.email} or ${settings.phone}, or use the Contact form — our team responds promptly.`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <Seo title="Frequently Asked Questions" path="/faq" description="Answers to common questions about visiting and joining us." jsonLd={jsonLd} />

      <section className="bg-ink-900 py-16 text-white sm:py-20">
        <div className="container-page">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">Have Questions?</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Frequently Asked Questions</h1>
        </div>
      </section>

      <div className="container-page max-w-3xl py-16">
        <ul className="divide-y divide-ink-100 rounded-lg border border-ink-100">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <li key={faq.q}>
                <h2>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium text-ink-900"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                  >
                    {faq.q}
                    <ChevronDown
                      className={classNames("h-5 w-5 shrink-0 text-ink-400 transition-transform", isOpen && "rotate-180")}
                      aria-hidden
                    />
                  </button>
                </h2>
                {isOpen && (
                  <div id={`faq-panel-${i}`} className="px-5 pb-5 text-ink-600">
                    {faq.a}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
