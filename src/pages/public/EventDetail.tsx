import { useParams, Link } from "react-router-dom";
import { CalendarDays, MapPin, Clock, ArrowLeft } from "lucide-react";
import { useEvent } from "../../hooks/useEvents";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { SocialLinksRow } from "../../components/events/SocialLinksRow";
import { Seo, SITE_URL } from "../../components/seo/Seo";
import NotFound from "./NotFound";
import { formatDate, formatTime } from "../../lib/utils";
import { Reveal } from "../../components/motion/Reveal";

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading, isError, refetch } = useEvent(slug);

  if (isLoading) return <LoadingState label="Loading event…" />;
  if (isError) return <ErrorState message="Couldn't load this event." onRetry={() => refetch()} />;
  if (!event) return <NotFound />;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.event_date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: event.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: event.location || "TBA" },
    description: event.description,
    image: event.flyer_url ? [event.flyer_url] : undefined,
    url: `${SITE_URL}/events/${event.slug}`,
  };

  return (
    <>
      <Seo
        title={event.title}
        path={`/events/${event.slug}`}
        description={event.description.slice(0, 160)}
        image={event.flyer_url ?? undefined}
        jsonLd={jsonLd}
      />

      <div className="container-page py-10">
        <Link to={event.status === "past" ? "/past-events" : "/events"} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to {event.status === "past" ? "Past Events" : "Events"}
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-5">
          <Reveal as="div" className="lg:col-span-3">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-ink-100">
              {event.flyer_url ? (
                <img
                  src={event.flyer_url}
                  alt={event.flyer_alt || `${event.title} flyer`}
                  className="h-full w-full object-cover"
                  width={800}
                  height={600}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink-400">
                  <CalendarDays className="h-12 w-12" aria-hidden />
                </div>
              )}
            </div>
          </Reveal>

          <Reveal as="div" className="lg:col-span-2" delay={0.1}>
            {event.category && <span className="badge bg-brand-50 text-brand-700">{event.category}</span>}
            <h1 className="mt-3 text-3xl font-semibold">{event.title}</h1>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <dt className="sr-only">Date</dt>
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                <dd className="text-ink-700">{formatDate(event.event_date)}</dd>
              </div>
              {(event.start_time || event.end_time) && (
                <div className="flex items-start gap-2">
                  <dt className="sr-only">Time</dt>
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                  <dd className="text-ink-700">
                    {formatTime(event.start_time)}
                    {event.end_time && ` – ${formatTime(event.end_time)}`}
                  </dd>
                </div>
              )}
              {event.location && (
                <div className="flex items-start gap-2">
                  <dt className="sr-only">Location</dt>
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                  <dd className="text-ink-700">{event.location}</dd>
                </div>
              )}
            </dl>

            <div className="prose prose-sm mt-6 max-w-none whitespace-pre-line text-ink-600">{event.description}</div>

            {event.social_links?.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                  {event.status === "past" ? "Watch & view content" : "Follow along"}
                </h2>
                <div className="mt-3">
                  <SocialLinksRow links={event.social_links} />
                </div>
              </div>
            )}

            {event.status !== "past" && (
              <Link to="/contact" className="btn-primary mt-8">
                Get in touch about this event
              </Link>
            )}
          </Reveal>
        </div>
      </div>
    </>
  );
}
