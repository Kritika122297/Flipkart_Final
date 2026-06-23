import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Activity, Cpu, Radio } from "lucide-react";
import BengaluruMap from "../map/BengaluruMap.jsx";
import MapModeToggle from "../map/MapModeToggle.jsx";
import TrafficParticles from "../map/TrafficParticles.jsx";
import Badge from "../ui/Badge.jsx";
import LoginModal from "../auth/LoginModal.jsx";
import { useSelectedLocation } from "../../context/LocationContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useFetch, endpoints } from "../../lib/api.js";
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
  const { isAuthenticated } = useAuth();
  const [mapMode, setMapMode] = useState("Dark");
  const [loginOpen, setLoginOpen] = useState(false);
  const { selectedLocation, setSelectedLocation } = useSelectedLocation();
  // Emerging-risk zones (public endpoint) — yellow warning circles on the hero map.
  const emerging = useFetch(endpoints.emergingHotspots, []);

  const launch = () => (isAuthenticated ? navigate("/dashboard") : setLoginOpen(true));

  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      {/* ── Full-screen background map ─────────────────────────── */}
      <div className="absolute inset-0">
        <BengaluruMap
          markers={MAP_MARKERS.map((m) => ({ ...m, icon: true }))}
          heat
          heatPoints={HEAT_POINTS}
          radar={radar}
          height="100%"
          zoom={12}
          mode={mapMode}
          onSelectLocation={setSelectedLocation}
          selectedLocation={selectedLocation}
          warnings={emerging.data?.zones ?? []}
          borderRadius="0"
        />
      </div>

      {/* Traffic-flow light trails over the map */}
      <TrafficParticles />

      {/* Legibility scrim — kept subtle so the map stays the visual backbone */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 42%, rgba(8,12,20,0.62) 0%, rgba(8,12,20,0.30) 45%, transparent 70%), linear-gradient(180deg, rgba(8,12,20,0.55) 0%, transparent 22%, transparent 70%, rgba(8,12,20,0.85) 100%)",
        }}
      />

      {/* ── Map mode toggle (Task B) ──────────────────────────── */}
      <div className="absolute right-5 top-24 z-[1000] md:top-28">
        <MapModeToggle mode={mapMode} onChange={setMapMode} />
      </div>

      {/* ── Floating LIVE badge ───────────────────────────────── */}
      <div className="absolute left-5 top-24 z-[1000] md:top-28">
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

      {/* ── Centered floating glass overlay ───────────────────── */}
      <div className="pointer-events-none relative z-[900] flex h-full items-center justify-center px-5">
        <div className="max-w-3xl text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="mb-5 flex justify-center">
            <Badge accent="cyan" pulse>
              Live · Bengaluru Traffic Police Grid
            </Badge>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="pointer-events-auto inline-block rounded-card px-7 py-8"
            style={{
              background: "rgba(8,12,20,0.42)",
              border: "1px solid rgba(148,163,220,0.12)",
              backdropFilter: "blur(10px) saturate(160%)",
              WebkitBackdropFilter: "blur(10px) saturate(160%)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
          >
            <h1 className="font-display text-4xl leading-[1.05] text-ink-primary sm:text-5xl md:text-6xl">
              Transform congestion into
              <br />
              <span className="text-gradient-violet">actionable intelligence</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm text-ink-body md:text-base">
              SmartPark AI fuses YOLOv8 CCTV detection, OR-Tools fleet routing, and ML forecasting
              into one command center — turning parking chaos across Bengaluru into a real-time
              enforcement advantage.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={launch}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-inner bg-gradient-to-r from-violet to-[#6366F1] px-6 py-3 font-semibold text-white shadow-glow-violet transition-transform hover:-translate-y-0.5"
              >
                Launch Command Center
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#features"
                className="rounded-inner border border-strong px-6 py-3 font-semibold text-ink-body backdrop-blur transition-colors hover:text-ink-primary"
              >
                Explore capabilities
              </a>
            </div>

            {/* inline stat chips */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <ChipStat icon={Activity} label="Avg CIS" value={KPIS.avgCIS} accent="#7C6AF7" />
              <ChipStat icon={Cpu} label="AI uptime" value={`${KPIS.aiUptime}%`} accent="#22D3EE" />
              <ChipStat icon={Radio} label="Patrols" value={`${KPIS.fleetActive}/${KPIS.fleetTotal}`} accent="#10B981" />
            </div>
          </motion.div>

          {/* Legend */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-ink-body"
          >
            <LegendDot color="#FB4D6D" label="Critical hotspot" />
            <LegendDot color="#F59E0B" label="Medium risk" />
            <LegendDot color="#10B981" label="Cleared zone" />
            <span className="hidden text-ink-faint sm:inline">·</span>
            <span className="hidden font-mono text-[0.7rem] text-ink-faint sm:inline">
              click any marker to focus a camera
            </span>
          </motion.div>
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
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
      <div className="text-left leading-tight">
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
