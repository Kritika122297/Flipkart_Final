import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Activity, Cpu, Radio } from "lucide-react";
import BengaluruMap from "../map/BengaluruMap.jsx";
import Badge from "../ui/Badge.jsx";
import { MAP_MARKERS, HEAT_POINTS, ZONE_STATS, KPIS } from "../../data/mockData.js";

const radar = ZONE_STATS.filter((z) => z.risk === "critical")
  .slice(0, 3)
  .map((z) => ({ lat: z.lat, lon: z.lon, color: "#7C6AF7" }));

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: "easeOut" },
  }),
};

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative mx-auto max-w-7xl px-5 pb-10 pt-28 md:pt-32">
      {/* Eyebrow + heading */}
      <div className="mb-8 text-center">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="mb-5 flex justify-center">
          <Badge accent="cyan" pulse>
            Live · Bengaluru Traffic Police Grid
          </Badge>
        </motion.div>
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="font-display text-5xl leading-[1.05] text-ink-primary md:text-7xl"
        >
          Transform congestion into
          <br />
          <span className="text-gradient-violet">actionable intelligence</span>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="mx-auto mt-5 max-w-2xl text-base text-ink-body md:text-lg"
        >
          SmartPark AI fuses YOLO CCTV detection, OR-Tools fleet routing, and ML forecasting into
          one command center — turning parking chaos across Bengaluru into a real-time enforcement
          advantage.
        </motion.p>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          className="mt-7 flex flex-wrap items-center justify-center gap-3"
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-inner bg-gradient-to-r from-violet to-[#6366F1] px-6 py-3 font-semibold text-white shadow-glow-violet transition-transform hover:-translate-y-0.5"
          >
            Launch Command Center
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
          <a
            href="#features"
            className="rounded-inner border border-strong px-6 py-3 font-semibold text-ink-body transition-colors hover:text-ink-primary"
          >
            Explore capabilities
          </a>
        </motion.div>
      </div>

      {/* Map visualization */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={4}
        className="glass relative rounded-card p-2 md:p-3"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 z-[1000] h-px bg-gradient-to-r from-transparent via-violet to-transparent" />

        {/* Floating live badge */}
        <div className="pointer-events-none absolute left-6 top-6 z-[1000]">
          <div
            className="flex items-center gap-2 rounded-inner px-3.5 py-2 text-sm font-semibold text-white shadow-glow-rose"
            style={{ background: "rgba(251,77,109,0.16)", border: "1px solid rgba(251,77,109,0.4)", backdropFilter: "blur(8px)" }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose" />
            </span>
            LIVE — {KPIS.activeViolations} Active Violations
          </div>
        </div>

        {/* Corner stat chips */}
        <div className="pointer-events-none absolute right-6 top-6 z-[1000] hidden gap-2 sm:flex">
          <ChipStat icon={Activity} label="Avg CIS" value={KPIS.avgCIS} accent="#7C6AF7" />
          <ChipStat icon={Cpu} label="AI uptime" value={`${KPIS.aiUptime}%`} accent="#22D3EE" />
          <ChipStat icon={Radio} label="Patrols" value={`${KPIS.fleetActive}/${KPIS.fleetTotal}`} accent="#10B981" />
        </div>

        <div className="overflow-hidden rounded-[16px]">
          <BengaluruMap
            markers={MAP_MARKERS.map((m) => ({ ...m, icon: true }))}
            heat
            heatPoints={HEAT_POINTS}
            radar={radar}
            height="540px"
            zoom={12}
          />
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 px-2 pb-1 text-xs text-ink-body">
          <LegendDot color="#FB4D6D" label="Critical hotspot" />
          <LegendDot color="#F59E0B" label="Medium risk" />
          <LegendDot color="#10B981" label="Cleared zone" />
          <span className="text-ink-faint">·</span>
          <span className="font-mono text-[0.7rem] text-ink-faint">
            Heatmap: CIS-weighted congestion density
          </span>
        </div>
      </motion.div>
    </section>
  );
}

function ChipStat({ icon: Icon, label, value, accent }) {
  return (
    <div
      className="flex items-center gap-2 rounded-inner px-3 py-2 backdrop-blur"
      style={{ background: "rgba(14,21,37,0.78)", border: "1px solid rgba(148,163,220,0.12)" }}
    >
      <Icon size={15} style={{ color: accent }} />
      <div className="leading-tight">
        <div className="text-[0.6rem] uppercase tracking-wider text-ink-faint">{label}</div>
        <div className="font-display text-sm" style={{ color: accent }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      {label}
    </span>
  );
}
