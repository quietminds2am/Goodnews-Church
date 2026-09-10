import { useEvents } from "../../hooks/useEvents";
import { EventCard } from "../../components/events/EventCard";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { Seo } from "../../components/seo/Seo";
import { Reveal } from "../../components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "../../components/motion/StaggerGroup";

export default function PastEvents() {
  const { data, isLoading, isError, refetch } = useEvents("past");

  return (
    <>
      <Seo
        title="Past Events"
        path="/past-events"
        description="Relive our past events and programs — with links to photos and videos on our social media."
      />

      <section className="bg-ink-900 py-16 text-white sm:py-20">
        <Reveal className="container-page">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">Look Back</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Past Events</h1>
          <p className="mt-4 max-w-2xl text-ink-200">
            Catch up on what you missed — every past event links to our social media pages for photos, videos, and
            highlights.
          </p>
        </Reveal>
      </section>

      <div className="container-page py-16">
        <SectionHeading title="Event Recaps" />
        <div className="mt-8">
          {isLoading && <LoadingState label="Loading past events…" />}
          {isError && <ErrorState message="Couldn't load past events right now." onRetry={() => refetch()} />}
          {!isLoading && !isError && data && data.length === 0 && (
            <EmptyState title="No past events yet" message="Recaps of past events will show up here." />
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
    </>
  );
}
