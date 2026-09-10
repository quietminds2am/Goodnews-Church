import type { AdvertPlacement } from "../../types/database";
import { useAdverts } from "../../hooks/useAdverts";
import { StaggerGroup, StaggerItem } from "../motion/StaggerGroup";

export function AdvertBanner({ placement }: { placement: AdvertPlacement }) {
  const { data } = useAdverts(placement);
  if (!data || data.length === 0) return null;

  return (
    <div className="container-page py-6">
      <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((ad) => {
          const content = (
            <img
              src={ad.image_url}
              alt={ad.title}
              loading="lazy"
              className="w-full rounded-lg border border-ink-100 object-cover shadow-card transition-transform hover:scale-[1.01]"
            />
          );
          return (
            <StaggerItem key={ad.id}>
              {ad.link_url ? (
                <a href={ad.link_url} target="_blank" rel="noopener noreferrer" aria-label={ad.title}>
                  {content}
                </a>
              ) : (
                content
              )}
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </div>
  );
}
