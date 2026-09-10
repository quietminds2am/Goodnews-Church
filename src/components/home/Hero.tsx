import { Link } from "react-router-dom";
import { CalendarDays, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { fadeUp, stagger } from "../motion/variants";

export function Hero() {
  const { settings } = useSiteSettings();
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white">
      {/* Ambient glow, parked in the corners so it never washes out the copy
          column — opacity/position only ever moves within a narrow, dark
          range, so contrast under the text never drops. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand-500/25 blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1, 1.15, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-16 h-[26rem] w-[26rem] rounded-full bg-brand-700/30 blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1, 1.1, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      {/* Scrim behind the copy column guarantees text contrast regardless of
          what the glow behind it is doing. */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-900/80 via-ink-900/40 to-transparent" aria-hidden="true" />

      <motion.div
        className="container-page relative py-20 sm:py-28 lg:py-32"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-brand-300">
          Welcome home
        </motion.p>
        <motion.h1
          variants={fadeUp}
          className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-brand-50 drop-shadow-sm sm:text-5xl lg:text-6xl"
        >
          {settings.church_name}
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-5 max-w-xl text-lg text-white/90">
          {settings.tagline}
        </motion.p>
        <motion.p variants={fadeUp} className="mt-2 text-white/70">
          {settings.pastor_title}: <span className="font-medium text-white">{settings.pastor_name}</span>
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-4">
          <Link to="/programs" className="btn-primary">
            <CalendarDays className="h-4 w-4" aria-hidden />
            Service Times
          </Link>
          <Link to="/events" className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20 px-5 py-2.5">
            Upcoming Events
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
