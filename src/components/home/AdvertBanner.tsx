import { ExternalLink } from "lucide-react";
import type { AdvertPlacement } from "../../types/database";
import { useAdverts } from "../../hooks/useAdverts";
import { StaggerGroup, StaggerItem } from "../motion/StaggerGroup";

export function AdvertBanner({ placement }: { placement: AdvertPlacement }) {
  const { data } = useAdverts(placement);
  if (!data || data.length === 0) return null;

  return (
    <div className="container-page py-6">
      {/* Always a horizontal scroller — never reflows into a grid, regardless
          of viewport width or how many adverts are active. Negative margin +
          matching padding lets cards bleed to the screen edge on mobile while
          the section itself stays aligned to container-page. */}
      <div className="-mx-4 snap-x snap-mandatory overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <StaggerGroup className="flex w-max gap-4">
          {data.map((ad) => (
            <StaggerItem key={ad.id} className="card flex w-72 shrink-0 snap-start flex-col overflow-hidden sm:w-80">
              <img
                src={ad.image_url}
                alt={ad.title}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="flex flex-1 flex-col gap-3 p-4">
                <h3 className="line-clamp-1 font-semibold text-ink-900">{ad.title}</h3>
                {ad.link_url && (
                  <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline mt-auto w-full"
                  >
                    Visit Website
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </div>
  );
}
