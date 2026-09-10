import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, revealViewport } from "./variants";

const TAGS = {
  div: motion.div,
  section: motion.section,
  ul: motion.ul,
  li: motion.li,
} as const;

type Tag = keyof typeof TAGS;

/**
 * Scroll-triggered fade+rise wrapper for a section's content. Animates once,
 * the moment it's ~80px from entering the viewport. Renders children
 * unanimated when the visitor has requested reduced motion — content still
 * appears immediately, nothing ever depends on the animation completing.
 */
export function Reveal({
  children,
  as = "div",
  className,
  delay = 0,
}: {
  children: ReactNode;
  as?: Tag;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  const Component = TAGS[as];
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </Component>
  );
}
