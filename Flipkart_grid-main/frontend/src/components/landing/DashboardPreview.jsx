import { motion } from "framer-motion";
import { AlertTriangle, Gauge, IndianRupee } from "lucide-react";
import CountUp from "../ui/CountUp.jsx";
import LossClock from "../ui/LossClock.jsx";
import { KPIS } from "../../data/mockData.js";

export default function DashboardPreview() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass relative overflow-hidden rounded-card p-7 md:p-9"
      >
        <span className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-violet/20 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-amber/15 blur-3xl" />

        <div className="relative mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-caps mb-1 text-cyan">Live dashboard preview</p>
            <h2 className="font-display text-2xl text-ink-primary md:text-3xl">
              Real-time city pulse
            </h2>
          </div>
          <span className="font-mono text-xs text-ink-faint">refreshed · just now</span>
        </div>

        <div className="relative grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatTile
            icon={AlertTriangle}
            accent="#FB4D6D"
            label="Active violations"
            value={<CountUp to={KPIS.activeViolations} runOnMount />}
            sub="across 38 stations"
          />
          <StatTile
            icon={Gauge}
            accent="#7C6AF7"
            label="Average CIS score"
            value={<CountUp to={KPIS.avgCIS} decimals={1} runOnMount />}
            sub="congestion impact / 100"
          />
          <StatTile
            icon={IndianRupee}
            accent="#F59E0B"
            label="Economic loss today"
            value={<LossClock />}
            sub="ticking · ₹/sec live"
            mono
          />
        </div>
      </motion.div>
    </section>
  );
}

function StatTile({ icon: Icon, accent, label, value, sub, mono }) {
  return (
    <div
      className="rounded-inner p-5"
      style={{ background: "rgba(19,29,48,0.6)", border: `1px solid ${accent}26` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="label-caps">{label}</span>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div
        className={`text-3xl font-extrabold leading-none ${mono ? "font-mono" : "font-display"}`}
        style={{ color: accent }}
      >
        {value}
      </div>
      <p className="mt-2 text-xs text-ink-faint">{sub}</p>
    </div>
  );
}
