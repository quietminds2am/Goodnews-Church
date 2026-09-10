import { Seo } from "../../components/seo/Seo";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function Terms() {
  const { settings } = useSiteSettings();

  return (
    <>
      <Seo title="Terms & Conditions" path="/terms" description="Terms and conditions for using this website." />
      <div className="container-page max-w-3xl py-16">
        <h1 className="text-3xl font-semibold">Terms & Conditions</h1>
        <p className="mt-2 text-sm text-ink-400">Last updated: {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-ink-600">
          <section>
            <h2 className="text-lg font-semibold text-ink-900">1. Acceptance of Terms</h2>
            <p>
              By accessing this website, you agree to be bound by these Terms & Conditions. If you do not agree,
              please discontinue use of the site.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">2. Use of Content</h2>
            <p>
              All content on this site — including text, images, event flyers, and logos — belongs to{" "}
              {settings.church_name} or its licensors and may not be reproduced without permission, except for
              personal, non-commercial use.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">3. User Submissions</h2>
            <p>
              Information you submit through our forms (such as the newsletter or contact form) must be accurate and
              provided by you. Do not submit false information or use these forms for unsolicited advertising.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">4. No Warranty</h2>
            <p>
              This website is provided "as is." While we strive for accuracy, we do not guarantee that all
              information (including event dates and times) is free of error at all times.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">5. Changes to These Terms</h2>
            <p>We may update these terms from time to time. Continued use of the site constitutes acceptance of any changes.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">6. Contact</h2>
            <p>Questions about these terms can be directed to {settings.email}.</p>
          </section>
        </div>
      </div>
    </>
  );
}
