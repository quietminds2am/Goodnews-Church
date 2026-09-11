import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, stagger, revealViewport } from "./variants";

const TAGS = {
  div: motion.div,
  ul: motion.ul,
} as const;

type Tag = keyof typeof TAGS;

/**
 * Wraps a grid/list of cards (announcements, events, media partner logos) so
 * they fade+rise in one after another as the group scrolls into view.
 * `StaggerItem` marks each child — the existing `.map()` output and grid
 * classes don't change, this only wraps them.
 */
export function StaggerGroup({
  children,
  as = "div",
  className,
}: {
  children: ReactNode;
  as?: Tag;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  const Component = TAGS[as];
  return (
    <Component className={className} initial="hidden" whileInView="show" viewport={revealViewport} variants={stagger}>
      {children}
    </Component>
  );
}

const ITEM_TAGS = {
  div: motion.div,
  li: motion.li,
} as const;

type ItemTag = keyof typeof ITEM_TAGS;

export function StaggerItem({ children, as = "div", className }: { children: ReactNode; as?: ItemTag; className?: string }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  const Component = ITEM_TAGS[as];
  return (
    <Component className={className} style={{ transformPerspective: 1000 }} variants={fadeUp}>
      {children}
    </Component>
  );
}
