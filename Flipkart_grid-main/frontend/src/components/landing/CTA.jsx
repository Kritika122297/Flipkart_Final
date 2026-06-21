import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  const navigate = useNavigate();
  return (
    <section className="mx-auto max-w-5xl px-5 py-24">
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass relative overflow-hidden rounded-card px-8 py-16 text-center"
      >
        <span className="pointer-events-none absolute inset-0 opacity-70"
          style={{ backgroundImage: "radial-gradient(600px 200px at 50% 0%, rgba(124,106,247,0.18), transparent 70%)" }} />
        <span className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[600px] -translate-x-1/2 rounded-full bg-violet/20 blur-3xl" />

        <h2 className="relative font-display text-4xl text-ink-primary md:text-5xl">
          Ready to take <span className="text-gradient-violet">command</span>?
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-ink-body">
          Step into the SmartPark AI operations center — seven live intelligence surfaces, one
          unified view of Bengaluru's streets.
        </p>
        <motion.button
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/dashboard")}
          className="group relative mt-8 inline-flex items-center gap-2 rounded-inner bg-gradient-to-r from-violet to-[#6366F1] px-8 py-4 text-lg font-semibold text-white shadow-glow-violet"
        >
          Launch Command Center
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1.5" />
        </motion.button>
      </motion.div>
    </section>
  );
}
