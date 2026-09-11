import { useBrandAssets } from "../../hooks/useBrandAssets";
import { SectionHeading } from "../ui/SectionHeading";
import { Reveal } from "../motion/Reveal";
import { Marquee } from "../motion/Marquee";

export function MediaPartners() {
  const { data } = useBrandAssets("member_logo");
  if (!data || data.length === 0) return null;

  return (
    <section className="border-t border-ink-100 bg-white py-14">
      <div className="container-page">
        <Reveal>
          <SectionHeading eyebrow="Working together" title="Media & Ministry Partners" align="center" />
        </Reveal>

        {/* Inset card, not full page width — the glow reads as a distinct
            spotlighted element rather than a page-wide banner. */}
        <Reveal
          className="mx-auto mt-10 max-w-4xl rounded-xl border border-brand-500/20 bg-white px-4 py-8 shadow-glow motion-safe:animate-glowPulse sm:px-8 sm:py-10"
          delay={0.1}
        >
          <Marquee>
            {data.map((asset) => (
              <img
                key={asset.id}
                src={asset.image_url}
                alt={asset.name}
                loading="lazy"
                // Full color, no hover required — the whole point of a
                // marquee is that every logo gets its moment on screen.
                // Sized up and given a touch of depth so each logo reads as
                // a bold, deliberate mark rather than a small icon in a row.
                className="h-24 w-auto shrink-0 object-contain drop-shadow-sm sm:h-28 lg:h-32"
              />
            ))}
          </Marquee>
        </Reveal>
      </div>
    </section>
  );
}
