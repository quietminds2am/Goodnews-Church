import type { Variants } from "framer-motion";

/**
 * The one entrance animation used everywhere (`Reveal`, `StaggerGroup`,
 * `Hero`) so motion across the site reads as a single system rather than
 * per-component one-offs. A short fade + rise with a slight 3D rotation in
 * (rotateX settles to 0), so text and cards feel like they're tilting up
 * into place rather than just sliding — subtle and premium, nothing bouncy.
 * Pairs with the `transformPerspective` set on `Reveal`/`StaggerItem` so the
 * rotation actually reads as depth instead of a flat skew.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16, rotateX: -10 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
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
