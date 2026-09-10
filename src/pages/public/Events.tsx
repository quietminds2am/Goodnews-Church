import { useEvents } from "../../hooks/useEvents";
import { EventCard } from "../../components/events/EventCard";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { Seo } from "../../components/seo/Seo";
import { AdvertBanner } from "../../components/home/AdvertBanner";
import { Reveal } from "../../components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "../../components/motion/StaggerGroup";

export default function Events() {
  const { data, isLoading, isError, refetch } = useEvents("upcoming");

  return (
    <>
      <Seo
        title="Upcoming Events"
        path="/events"
        description="See flyers and details for every upcoming event, program, and gathering."
      />

      <section className="bg-ink-900 py-16 text-white sm:py-20">
        <Reveal className="container-page">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">What's Next</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Upcoming Events</h1>
          <p className="mt-4 max-w-2xl text-ink-200">
            Browse event flyers and details, and mark your calendar — we'd love to see you there.
          </p>
        </Reveal>
      </section>

      <div className="container-page py-16">
        <SectionHeading title="All Upcoming Events" />
        <div className="mt-8">
          {isLoading && <LoadingState label="Loading events…" />}
          {isError && <ErrorState message="Couldn't load events right now." onRetry={() => refetch()} />}
          {!isLoading && !isError && data && data.length === 0 && (
            <EmptyState title="No upcoming events yet" message="New events will appear here as soon as they're scheduled." />
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
      <AdvertBanner placement="events_sidebar" />
    </>
  );
}
