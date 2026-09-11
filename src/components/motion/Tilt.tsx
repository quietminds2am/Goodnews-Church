import { useRef, type MouseEvent, type ReactNode, type Ref } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

const TAGS = {
  div: motion.div,
  article: motion.article,
  li: motion.li,
} as const;

type Tag = keyof typeof TAGS;

/**
 * Wraps a card so it tilts in 3D toward the cursor on hover — a light,
 * spring-damped `rotateX`/`rotateY` driven by pointer position within the
 * card's own bounds, plus a small lift (`translateZ` via `scale`) so it
 * reads as coming off the page rather than just rotating in place.
 *
 * Renders children unwrapped (no motion, no listeners) when the visitor has
 * requested reduced motion — nothing about layout or content depends on it.
 * Pair with `Reveal`/`StaggerItem` for the scroll-in entrance; this only
 * owns the hover interaction, so the two never fight over the same value.
 */
export function Tilt({
  children,
  as = "div",
  className,
  strength = 10,
}: {
  children: ReactNode;
  as?: Tag;
  className?: string;
  /** Max tilt in degrees at the card's edge. */
  strength?: number;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const springConfig = { stiffness: 300, damping: 28, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [0, 1], [strength, -strength]), springConfig);
  const rotateY = useSpring(useTransform(px, [0, 1], [-strength, strength]), springConfig);
  const scale = useSpring(1, springConfig);

  if (reduceMotion) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  function handleMove(e: MouseEvent<HTMLElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function handleEnter() {
    scale.set(1.015);
  }

  function handleLeave() {
    px.set(0.5);
    py.set(0.5);
    scale.set(1);
  }

  // TypeScript can't unify `ref`/event-handler prop types across a union of
  // motion.div | motion.article | motion.li — all three accept identical
  // DOM props at runtime, so the cast is safe.
  const Component = TAGS[as] as typeof motion.div;
  return (
    <Component
      ref={ref as Ref<HTMLDivElement>}
      className={className}
      style={{ rotateX, rotateY, scale, transformPerspective: 900 }}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
    </Component>
  );
}
