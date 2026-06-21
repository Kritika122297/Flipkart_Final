import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Clock, Route as RouteIcon, Truck } from "lucide-react";
import GlassCard from "../components/ui/GlassCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import BengaluruMap from "../components/map/BengaluruMap.jsx";
import { FLEET } from "../data/mockData.js";

const URGENCY_COLOR = { high: "#FB4D6D", medium: "#F59E0B", low: "#10B981" };

export default function FleetOptimizer() {
  const [fleetSize, setFleetSize] = useState(4);
  const active = FLEET.slice(0, fleetSize);
  const [open, setOpen] = useState(active[0]?.id ?? 1);

  const totalDist = active.reduce((s, t) => s + t.distance, 0).toFixed(1);
  const maxEta = Math.max(...active.map((t) => t.eta));

  const routes = active.map((t) => ({ path: t.path, color: t.color, name: t.name }));
  const markers = active.flatMap((t) =>
    t.path.map((p, i) => ({ lat: p[0], lon: p[1], risk: i === 0 ? "clear" : "medium", zone: t.stops[i] }))
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Route map */}
        <GlassCard className="p-3 xl:col-span-2" accentBar="from-violet to-amber" hover={false}>
          <div className="px-2 pt-1">
            <SectionHeader title="OR-Tools VRP solution" sub="Capacitated vehicle routing · DarkMatter tiles" icon={RouteIcon} className="mb-3" />
          </div>
          <div className="overflow-hidden rounded-[16px]">
            <BengaluruMap routes={routes} markers={markers} height="460px" zoom={11} />
          </div>
        </GlassCard>

        {/* Controls + totals */}
        <GlassCard className="p-5" accentBar="from-emerald to-cyan" hover={false}>
          <SectionHeader title="Fleet configuration" icon={Truck} accent="emerald" className="mb-5" />

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-ink-body">Fleet size</span>
              <span className="font-mono text-emerald">{fleetSize} trucks</span>
            </div>
            <input
              type="range"
              min={1}
              max={4}
              value={fleetSize}
              onChange={(e) => {
                const n = Number(e.target.value);
                setFleetSize(n);
                if (open > n) setOpen(1);
              }}
              style={{
                "--val": `${((fleetSize - 1) / 3) * 100}%`,
                "--track-fill": "#10B981",
                "--thumb-color": "#10B981",
                "--thumb-glow": "rgba(16,185,129,0.5)",
              }}
            />
          </div>

          <div className="mt-6 space-y-3">
            <TotalRow icon={RouteIcon} label="Total distance" value={`${totalDist} km`} accent="#7C6AF7" />
            <TotalRow icon={Clock} label="Longest ETA" value={`${maxEta} min`} accent="#F59E0B" />
            <TotalRow icon={MapPin} label="Stops covered" value={active.reduce((s, t) => s + t.stops.length, 0)} accent="#22D3EE" />
          </div>

          <div className="mt-5 rounded-inner border border-subtle bg-card/40 p-3 text-xs text-ink-body">
            Solver: <span className="font-mono text-violet">PATH_CHEAPEST_ARC</span> + guided local
            search · converged in 1.8s
          </div>
        </GlassCard>
      </div>

      {/* Route manifests */}
      <div className="grid grid-cols-1 gap-3">
        {active.map((t, idx) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="glass overflow-hidden rounded-card"
            style={{ borderLeft: `3px solid ${t.color}` }}
          >
            <button
              onClick={() => setOpen(open === t.id ? -1 : t.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-inner text-white" style={{ background: `${t.color}26`, color: t.color }}>
                  <Truck size={18} />
                </span>
                <div>
                  <div className="font-display text-ink-primary">{t.name}</div>
                  <div className="text-xs text-ink-faint">{t.stops.length} stops · {t.distance} km</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm" style={{ color: URGENCY_COLOR[t.urgency] }}>
                  ETA {t.eta}m
                </span>
                <ChevronDown
                  size={18}
                  className="text-ink-faint transition-transform"
                  style={{ transform: open === t.id ? "rotate(180deg)" : "none" }}
                />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {open === t.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-subtle px-5 py-4">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
                      {t.stops.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 rounded-chip border border-subtle bg-card/50 px-2.5 py-1 text-xs text-ink-primary">
                            <span className="grid h-4 w-4 place-items-center rounded-full text-[0.6rem] font-bold text-white" style={{ background: t.color }}>
                              {i + 1}
                            </span>
                            {s}
                          </span>
                          {i < t.stops.length - 1 && <span style={{ color: t.color }}>→</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TotalRow({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center justify-between rounded-inner border border-subtle bg-card/40 px-3.5 py-2.5">
      <span className="flex items-center gap-2 text-sm text-ink-body">
        <Icon size={15} style={{ color: accent }} />
        {label}
      </span>
      <span className="font-mono font-semibold" style={{ color: accent }}>{value}</span>
    </div>
  );
}
