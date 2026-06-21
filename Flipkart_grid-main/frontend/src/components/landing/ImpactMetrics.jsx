import { motion } from "framer-motion";
import CountUp from "../ui/CountUp.jsx";
import { IMPACT_METRICS } from "../../data/mockData.js";

export default function ImpactMetrics() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-10 text-center">
        <p className="label-caps mb-2 text-emerald">Measured impact</p>
        <h2 className="font-display text-3xl text-ink-primary md:text-4xl">
          Outcomes, not dashboards
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {IMPACT_METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.55 }}
            className="glass rounded-card p-6 text-center transition-shadow hover:border-strong hover:shadow-glow-emerald"
          >
            <div className="font-display text-4xl text-emerald">
              <CountUp
                to={m.value}
                decimals={m.value % 1 !== 0 ? 1 : 0}
                prefix={m.prefix || ""}
                suffix={m.suffix || ""}
              />
            </div>
            <p className="mt-3 text-sm text-ink-body">{m.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
