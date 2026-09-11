import { Link } from "react-router-dom";
import { CalendarDays, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { fadeUp, stagger } from "../motion/variants";
import { Hero3DBackground } from "../motion/Hero3DBackground";

export function Hero() {
  const { settings } = useSiteSettings();

  return (
    <section className="relative overflow-hidden text-white">
      <Hero3DBackground />

      <motion.div
        className="container-page relative py-20 sm:py-28 lg:py-32"
        style={{ perspective: 1000 }}
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
