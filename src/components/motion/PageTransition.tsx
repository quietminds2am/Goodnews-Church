import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Cross-fade between routes. `App.tsx` keys this by `location.pathname`
 * inside an `AnimatePresence mode="wait"` so leaving and entering pages
 * animate instead of hard-cutting.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
