import { motion } from "framer-motion";
import { TrafficCone, TrendingDown, Clock, Camera, Route, Bot, ArrowRight } from "lucide-react";

const PROBLEMS = [
  {
    icon: TrafficCone,
    title: "Unmonitored congestion",
    body: "Double-parked delivery vehicles and trucks clog major junctions like Silk Board, triggering cascade delays for kilometres.",
  },
  {
    icon: TrendingDown,
    title: "Economic drain",
    body: "Over ₹2.4 Cr is lost daily in Bengaluru to parking-induced traffic delay loops and stalled productivity.",
  },
  {
    icon: Clock,
    title: "Manual enforcement lag",
    body: "Traffic police rely on manual ticket reports and slow dispatch cycles, reacting long after a hotspot has formed.",
  },
];

const SOLUTIONS = [
  {
    icon: Camera,
    title: "AI edge detection",
    body: "Auto-detect parking offenses from live CCTV feeds with real-time YOLOv8 bounding-box classification.",
  },
  {
    icon: Route,
    title: "Mathematical optimization",
    body: "Google OR-Tools CVRP computes optimal dispatch paths, matching multiple tow-trucks to live hotspots.",
  },
  {
    icon: Bot,
    title: "Tactical AI command",
    body: "A generative LLM commander outputs staging routes, diversion schemes, and instant ROI analysis.",
  },
];

export default function ProblemSolution() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20">
      <div className="mb-12 text-center">
        <p className="label-caps mb-2 text-rose">The gridlock problem</p>
        <h2 className="font-display text-3xl text-ink-primary md:text-4xl">
          From reactive chaos to <span className="text-gradient-violet">proactive control</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
        {/* Problem column */}
        <Column label="The problem" accent="#FB4D6D" items={PROBLEMS} />

        {/* Connector */}
        <div className="flex items-center justify-center">
          <div
            className="grid h-12 w-12 place-items-center rounded-full"
            style={{ background: "rgba(124,106,247,0.14)", border: "1px solid rgba(124,106,247,0.4)" }}
          >
            <ArrowRight className="text-violet" size={20} />
          </div>
        </div>

        {/* Solution column */}
        <Column label="Our solution" accent="#10B981" items={SOLUTIONS} />
      </div>
    </section>
  );
}

function Column({ label, accent, items }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
        <span className="label-caps" style={{ color: accent }}>{label}</span>
      </div>
      <div className="space-y-4">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            whileHover={{ y: -3 }}
            className="glass rounded-card p-5 transition-shadow"
            style={{ borderColor: `${accent}33` }}
          >
            <div className="flex items-start gap-3.5">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-inner"
                style={{ background: `${accent}1a`, color: accent }}
              >
                <it.icon size={20} />
              </span>
              <div>
                <h3 className="font-display text-base text-ink-primary">{it.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-body">{it.body}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
