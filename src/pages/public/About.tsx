import { Seo } from "../../components/seo/Seo";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { Heart, BookOpen, Users } from "lucide-react";
import { Reveal } from "../../components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "../../components/motion/StaggerGroup";

const VALUES = [
  {
    icon: BookOpen,
    title: "The Word",
    body: "We are rooted in the sound teaching of Scripture, helping every member grow in knowledge and faith.",
  },
  {
    icon: Heart,
    title: "Worship",
    body: "We create space for genuine, Spirit-led worship that draws young people closer to God.",
  },
  {
    icon: Users,
    title: "Community",
    body: "We are a family — a place where every young person is known, supported, and given room to grow.",
  },
];

export default function About() {
  const { settings } = useSiteSettings();

  return (
    <>
      <Seo
        title="About Us"
        path="/about"
        description={`Learn about ${settings.church_name}, our mission, and our leadership under ${settings.pastor_name}.`}
      />

      <section className="bg-ink-900 py-16 text-white sm:py-20">
        <Reveal className="container-page">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">About Us</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold sm:text-4xl">{settings.church_name}</h1>
          <p className="mt-4 max-w-2xl text-ink-200">{settings.tagline}</p>
        </Reveal>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <Reveal>
            <SectionHeading eyebrow="Our story" title="Who We Are" />
            <div className="mt-4 space-y-4 text-ink-600">
              <p>
                {settings.church_name} is a vibrant youth congregation of the Redeemed Christian Church of God (RCCG),
                committed to raising young people in the knowledge and love of Christ. We gather every week to worship,
                learn, and build a community that reflects the heart of the Gospel.
              </p>
              <p>
                Whether you're taking your first steps in faith or looking for a church home, there's a place for you
                here — in our services, our programs, and our growing community.
              </p>
            </div>
          </Reveal>

          <Reveal className="card p-6 sm:p-8" delay={0.1}>
            <h2 className="text-xl font-semibold">Leadership</h2>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand-600">
                {settings.pastor_name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <p className="font-semibold text-ink-900">{settings.pastor_name}</p>
                <p className="text-sm text-ink-500">{settings.pastor_title}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-ink-50 py-16">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="What we believe" title="Our Core Values" align="center" />
          </Reveal>
          <StaggerGroup className="mt-10 grid gap-6 sm:grid-cols-3">
            {VALUES.map((v) => (
              <StaggerItem key={v.title} className="card p-6 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <v.icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-ink-500">{v.body}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>
    </>
  );
}
