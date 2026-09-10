import { Link } from "react-router-dom";
import { CalendarDays, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import type { EventRow } from "../../types/database";
import { formatShortDate, formatTime } from "../../lib/utils";
import { SocialLinksRow } from "./SocialLinksRow";

export function EventCard({ event }: { event: EventRow }) {
  return (
    <motion.article
      className="card group flex flex-col overflow-hidden"
      whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(13,15,19,0.12)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Link to={`/events/${event.slug}`} className="block aspect-[4/3] w-full overflow-hidden bg-ink-100">
        {event.flyer_url ? (
          <img
            src={event.flyer_url}
            alt={event.flyer_alt || `${event.title} flyer`}
            loading="lazy"
            width={640}
            height={480}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-400">
            <CalendarDays className="h-10 w-10" aria-hidden />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {event.category && (
          <span className="badge w-fit bg-brand-50 text-brand-700">{event.category}</span>
        )}
        <h3 className="text-lg font-semibold leading-snug">
          <Link to={`/events/${event.slug}`} className="hover:text-brand-600">
            {event.title}
          </Link>
        </h3>
        <div className="flex flex-col gap-1.5 text-sm text-ink-500">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
            {formatShortDate(event.event_date)}
            {event.start_time && ` · ${formatTime(event.start_time)}`}
          </span>
          {event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              {event.location}
            </span>
          )}
        </div>
        {event.status === "past" && event.social_links?.length > 0 && (
          <div className="mt-1">
            <SocialLinksRow links={event.social_links} />
          </div>
        )}
        <Link
          to={`/events/${event.slug}`}
          className="mt-auto pt-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          {event.status === "past" ? "View recap →" : "View details →"}
        </Link>
      </div>
    </motion.article>
  );
}
