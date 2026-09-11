import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * Layered, animated background for a dark hero section — no photo/video
 * assets, just CSS gradients + framer-motion. Reads as "3D" through depth
 * cues: two glow orbs at different parallax speeds (near vs far), two thin
 * rotating rings for a sense of a receding vanishing point, and a scrim so
 * the copy on top always keeps contrast regardless of what's moving behind
 * it. Fully `aria-hidden` and `pointer-events-none` — decorative only.
 *
 * Drop it into any `relative overflow-hidden` section as the first child,
 * absolutely positioned to fill it; put the section's real content after it
 * with `relative` so it stacks on top.
 */
export function Hero3DBackground() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yFar = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 50]);
  const yNear = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 110]);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900" />

      {/* Rotating rings, offset from center and at different parallax depths
          — the offset + rotation is what reads as a receding 3D vanishing
          point rather than a flat spinning circle. */}
      <motion.div
        style={{ y: yFar }}
        className="absolute left-[15%] top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full border border-white/10"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        style={{ y: yNear }}
        className="absolute left-[15%] top-1/2 h-[22rem] w-[22rem] -translate-y-1/2 rounded-full border border-white/10"
        animate={reduceMotion ? undefined : { rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      />

      {/* Glow orbs — far one drifts less than near one on scroll, the
          parallax gap is the depth cue. */}
      <motion.div
        style={{ y: yFar }}
        className="absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand-500/25 blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1, 1.15, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{ y: yNear }}
        className="absolute -bottom-32 -left-16 h-[26rem] w-[26rem] rounded-full bg-brand-700/30 blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1, 1.1, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Scrim behind the copy column guarantees text contrast regardless of
          what the glow/rings behind it are doing. */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-900/80 via-ink-900/40 to-transparent" />
    </div>
  );
}
