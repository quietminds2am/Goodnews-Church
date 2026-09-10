import { Children, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Continuous horizontal scroller (logos, partner marks). Every item is
 * always fully visible and in its natural color as it drifts by — nothing
 * here is gated behind hover. The child list is duplicated once so the loop
 * seam is invisible: a CSS animation translating the doubled track by
 * exactly -50% of its width always ends on a frame identical to the start.
 * A plain CSS animation (rather than a JS-driven one) means pausing on
 * hover just flips `animation-play-state` — the track holds its exact
 * position, no snap.
 *
 * Renders as a plain static wrapped row — no duplication, no animation —
 * when the visitor has reduced motion set.
 */
export function Marquee({ children, speed = 40 }: { children: ReactNode; speed?: number }) {
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const items = Children.toArray(children);

  if (reduceMotion) {
    return (
      <div className="container-page flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
        {items}
      </div>
    );
  }

  // Duration scales with item count so the per-logo pace stays constant
  // whether there are 3 partners or 12.
  const duration = items.length * speed * 0.1;

  return (
    <div
      className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="flex w-max animate-marquee items-center gap-16 py-2"
        style={{ animationDuration: `${duration}s`, animationPlayState: paused ? "paused" : "running" }}
      >
        {items.map((child, i) => (
          <div className="flex shrink-0 items-center" key={i}>
            {child}
          </div>
        ))}
        {items.map((child, i) => (
          <div className="flex shrink-0 items-center" key={`dup-${i}`} aria-hidden="true">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
