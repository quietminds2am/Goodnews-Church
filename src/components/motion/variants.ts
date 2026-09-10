import type { Variants } from "framer-motion";

/**
 * The one entrance animation used everywhere (`Reveal`, `StaggerGroup`,
 * `Hero`) so motion across the site reads as a single system rather than
 * per-component one-offs. Subtle & premium: a short fade with a small rise,
 * nothing bouncy or attention-seeking.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/** Container variant for staggered children — pair with `fadeUp` on each child. */
export const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

/** Shared viewport config for `whileInView` triggers: animate once, slightly before fully on-screen. */
export const revealViewport = { once: true, margin: "-80px" } as const;
