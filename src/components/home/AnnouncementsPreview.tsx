import { Link } from "react-router-dom";
import { Megaphone } from "lucide-react";
import { useAnnouncements } from "../../hooks/useAnnouncements";
import { SectionHeading } from "../ui/SectionHeading";
import { LoadingState, ErrorState, EmptyState } from "../ui/States";
import { formatShortDate, truncate } from "../../lib/utils";
import { Reveal } from "../motion/Reveal";
import { StaggerGroup, StaggerItem } from "../motion/StaggerGroup";

export function AnnouncementsPreview() {
  const { data, isLoading, isError, refetch } = useAnnouncements(3);

  return (
    <section className="container-page py-16">
      <Reveal>
        <SectionHeading
          eyebrow="Stay informed"
          title="Latest Announcements"
          action={
            <Link to="/announcements" className="btn-outline">
              View all
            </Link>
          }
        />
      </Reveal>
      <div className="mt-8">
        {isLoading && <LoadingState label="Loading announcements…" />}
        {isError && <ErrorState message="Couldn't load announcements right now." onRetry={() => refetch()} />}
        {!isLoading && !isError && data && data.length === 0 && (
          <EmptyState title="No announcements yet" message="Check back soon for updates from the church." />
        )}
        {data && data.length > 0 && (
          <StaggerGroup as="ul" className="grid gap-4 sm:grid-cols-3">
            {data.map((a) => (
              <StaggerItem as="li" key={a.id} className="card p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Megaphone className="h-4 w-4" aria-hidden />
                </span>
                <h3 className="mt-3 font-semibold">{a.title}</h3>
                <p className="mt-1 text-sm text-ink-500">{truncate(a.body, 120)}</p>
                <p className="mt-3 text-xs font-medium text-ink-400">
                  {formatShortDate(a.publish_at ?? a.created_at)}
                </p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </section>
  );
}
