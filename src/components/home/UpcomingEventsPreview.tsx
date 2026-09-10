import { Link } from "react-router-dom";
import { useEvents } from "../../hooks/useEvents";
import { EventCard } from "../events/EventCard";
import { SectionHeading } from "../ui/SectionHeading";
import { LoadingState, ErrorState, EmptyState } from "../ui/States";
import { Reveal } from "../motion/Reveal";
import { StaggerGroup, StaggerItem } from "../motion/StaggerGroup";

export function UpcomingEventsPreview() {
  const { data, isLoading, isError, refetch } = useEvents("upcoming", 3);

  return (
    <section className="bg-ink-50 py-16">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            eyebrow="Mark your calendar"
            title="Upcoming Events"
            action={
              <Link to="/events" className="btn-outline">
                View all
              </Link>
            }
          />
        </Reveal>
        <div className="mt-8">
          {isLoading && <LoadingState label="Loading events…" />}
          {isError && <ErrorState message="Couldn't load events right now." onRetry={() => refetch()} />}
          {!isLoading && !isError && data && data.length === 0 && (
            <EmptyState title="No upcoming events" message="New events will appear here as soon as they're scheduled." />
          )}
          {data && data.length > 0 && (
            <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((event) => (
                <StaggerItem key={event.id}>
                  <EventCard event={event} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </div>
      </div>
    </section>
  );
}
