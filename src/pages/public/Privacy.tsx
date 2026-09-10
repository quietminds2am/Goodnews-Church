import { Seo } from "../../components/seo/Seo";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function Privacy() {
  const { settings } = useSiteSettings();

  return (
    <>
      <Seo title="Privacy Policy" path="/privacy-policy" description="How we collect, use, and protect your information." />
      <div className="container-page max-w-3xl py-16">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-400">Last updated: {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-ink-600">
          <section>
            <h2 className="text-lg font-semibold text-ink-900">1. Information We Collect</h2>
            <p>
              When you subscribe to our email list, submit our contact form, or otherwise interact with this website,
              we may collect your name, email address, phone number, and the content of any message you send us.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">2. How We Use Your Information</h2>
            <p>
              We use the information you provide to send service reminders, event announcements, and church updates
              you've subscribed to; to respond to messages sent through our contact form; and to improve our
              programs and communication.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">3. How We Store Your Information</h2>
            <p>
              Your information is stored securely using Supabase, a hosted database provider, with access restricted
              to authorized church administrators. We do not sell or rent your personal information to third parties.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">4. Third-Party Services</h2>
            <p>
              We use Resend to deliver emails and Supabase to store and manage data. These providers process data on
              our behalf under their own privacy and security practices.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">5. Your Rights</h2>
            <p>
              You may unsubscribe from our email list at any time using the link in any email we send, or by
              contacting us directly. You may also request that we delete your information by contacting us at{" "}
              {settings.email}.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-900">6. Contact</h2>
            <p>
              Questions about this policy can be directed to {settings.email} or {settings.phone}.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
