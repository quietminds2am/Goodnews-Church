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
      </div>
      <div className="mt-10">
        <Marquee>
          {data.map((asset) => (
            <img
              key={asset.id}
              src={asset.image_url}
              alt={asset.name}
              loading="lazy"
              // Full color, no hover required — the whole point of a
              // marquee is that every logo gets its moment on screen.
              className="h-16 w-auto shrink-0 object-contain sm:h-20"
            />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
