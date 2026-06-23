import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  MapPin,
  Clock,
  Route as RouteIcon,
  Truck,
  Loader2,
  Download,
  Calculator,
  Crosshair,
} from "lucide-react";
import GlassCard from "../components/ui/GlassCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import BengaluruMap from "../components/map/BengaluruMap.jsx";
import { Loading, ErrorState } from "../components/ui/AsyncState.jsx";
import { useFetch, endpoints } from "../lib/api.js";
import { useConfig } from "../context/ConfigContext.jsx";

const URGENCY_COLOR = { high: "#FB4D6D", medium: "#F59E0B", low: "#10B981" };

export default function FleetOptimizer() {
  // Fleet size is bound to the globally-saved simulation config.
  const { simConfig } = useConfig();
  const initialFleet = Math.min(5, Math.max(1, simConfig.fleetSize ?? 3));
  const [fleetSize, setFleetSize] = useState(initialFleet);
  const [targetStations, setTargetStations] = useState(14);
  const [committed, setCommitted] = useState({ trucks: initialFleet, stations: 14 });
  const [activeTruck, setActiveTruck] = useState(1);
  const [epiOpen, setEpiOpen] = useState(false);
  const [fromConfig, setFromConfig] = useState(false);

  // Pull in the latest fleet size whenever Intelligent Dispatch saves the config.
  useEffect(() => {
    if (simConfig.fleetSize) {
      setFleetSize(Math.min(5, Math.max(1, simConfig.fleetSize)));
      setFromConfig(true);
      const t = setTimeout(() => setFromConfig(false), 2600);
      return () => clearTimeout(t);
    }
  }, [simConfig.fleetSize]);

  // Debounce slider → committed so we don't re-solve on every tick.
  useEffect(() => {
    const id = setTimeout(() => setCommitted({ trucks: fleetSize, stations: targetStations }), 300);
    return () => clearTimeout(id);
  }, [fleetSize, targetStations]);

  // GET /api/ortools/solve?trucks=&stations=
  const { data, loading, error, refetch } = useFetch(
    () => endpoints.ortoolsSolve(committed.trucks, committed.stations),
    [committed.trucks, committed.stations]
  );

  // Keep the active manifest tab valid as the fleet size changes.
  useEffect(() => {
    if (data?.trucks?.length && !data.trucks.some((t) => t.id === activeTruck)) {
      setActiveTruck(data.trucks[0].id);
    }
  }, [data, activeTruck]);

  if (!data && loading) return <Loading label="Solving optimal routes…" height={420} />;
  if (error) return <ErrorState error={error} onRetry={refetch} height={420} />;

  const trucks = data.trucks;
  const totalDist = data.totalDistance;
  const maxEta = data.maxEta;
  const stationsUsed = data.stationsUsed;

  // Feed routes + markers into the map (re-renders whenever data changes).
  const routes = trucks.map((t) => ({ path: t.path, color: t.color, name: t.name }));
  const markers = trucks.flatMap((t) =>
    t.path.map((p, i) => ({
      lat: p[0],
      lon: p[1],
      risk: i === 0 ? "clear" : "medium",
      zone: i === 0 ? "Depot" : t.stops[i - 1]?.station,
    }))
  );
  const stopsCovered = trucks.reduce((s, t) => s + t.stops.length, 0);
  const active = trucks.find((t) => t.id === activeTruck) ?? trucks[0];

  const downloadCsv = () => {
    const header = ["Truck", "Stop", "Station", "EPI", "Violations", "Avg CIS"];
    const lines = [header.join(",")];
    trucks.forEach((t) =>
      t.stops.forEach((s) =>
        lines.push([t.name, s.stop, `"${s.station}"`, s.epi, s.violations, s.avgCis].join(","))
      )
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleet_manifest_${committed.trucks}trucks_${committed.stations}stations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Route map */}
        <GlassCard className="p-3 xl:col-span-2" accentBar="from-violet to-amber" hover={false}>
          <div className="flex items-center justify-between px-2 pt-1">
            <SectionHeader title="OR-Tools VRP solution" sub={`${stationsUsed} priority stations · DarkMatter tiles`} icon={RouteIcon} className="mb-3" />
            {loading && (
              <span className="flex items-center gap-1.5 text-xs text-ink-faint">
                <Loader2 size={12} className="animate-spin" /> re-solving
              </span>
            )}
          </div>
          <div className="overflow-hidden rounded-[16px]">
            <BengaluruMap routes={routes} markers={markers} height="460px" zoom={11} animatedRoutes />
          </div>
        </GlassCard>

        {/* Controls + totals */}
        <GlassCard className="p-5" accentBar="from-emerald to-cyan" hover={false}>
          <SectionHeader title="Fleet configuration" icon={Truck} accent="emerald" className="mb-5" />

          <RangeRow
            label="Target stations"
            icon={Crosshair}
            value={targetStations}
            min={5}
            max={30}
            suffix=" stations"
            onChange={setTargetStations}
          />
          <RangeRow
            label="Tow trucks (fleet size)"
            icon={Truck}
            value={fleetSize}
            min={1}
            max={5}
            suffix=" trucks"
            onChange={setFleetSize}
          />
          {fromConfig && (
            <p className="-mt-2 mb-3 text-[0.68rem] text-emerald">↳ synced from saved Simulation Config</p>
          )}

          <div className="mt-6 space-y-3">
            <TotalRow icon={RouteIcon} label="Total distance" value={`${totalDist} km`} accent="#7C6AF7" />
            <TotalRow icon={Clock} label="Longest ETA" value={`${maxEta} min`} accent="#F59E0B" />
            <TotalRow icon={MapPin} label="Stops covered" value={stopsCovered} accent="#22D3EE" />
          </div>

          <button
            onClick={downloadCsv}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-inner bg-gradient-to-r from-violet to-[#6366F1] py-2.5 font-semibold text-white shadow-glow-violet transition-transform hover:-translate-y-0.5"
          >
            <Download size={15} /> Download Fleet Manifest (CSV)
          </button>

          <div className="mt-4 rounded-inner border border-subtle bg-card/40 p-3 text-xs text-ink-body">
            Solver: <span className="font-mono text-violet">PATH_CHEAPEST_ARC</span> + guided local search · OR-Tools CVRP
          </div>
        </GlassCard>
      </div>

      {/* Per-truck tabbed manifests */}
      <GlassCard className="p-5" accentBar="from-violet to-cyan" hover={false}>
        <SectionHeader title="Fleet dispatch manifests" sub="Optimal stop sequence per tow truck" icon={Truck} className="mb-4" />

        {/* tab bar */}
        <div className="mb-4 flex flex-wrap gap-2">
          {trucks.map((t) => {
            const on = t.id === activeTruck;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTruck(t.id)}
                className="flex items-center gap-2 rounded-inner border px-3.5 py-2 text-sm font-medium transition-colors"
                style={{
                  borderColor: on ? t.color : "rgba(148,163,220,0.1)",
                  background: on ? `${t.color}1a` : "transparent",
                  color: on ? t.color : "#94A3B8",
                  boxShadow: on ? `0 0 14px ${t.color}33` : "none",
                }}
              >
                <Truck size={15} />
                {t.name}
                <span className="rounded-chip px-1.5 py-0.5 text-[0.62rem]" style={{ background: `${t.color}26` }}>
                  {t.stops.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* active truck stats + table */}
        {active && (
          <AnimatePresence mode="wait">
            <motion.div key={active.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                <Stat label="Stops" value={active.stops.length} />
                <Stat label="Distance" value={`${active.distance} km`} />
                <Stat label="ETA" value={`${active.eta} min`} color={URGENCY_COLOR[active.urgency]} />
                <Stat label="Priority" value={active.urgency} color={URGENCY_COLOR[active.urgency]} />
              </div>

              <div className="overflow-x-auto rounded-inner" style={{ borderLeft: `3px solid ${active.color}` }}>
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left">
                      {["Stop", "Station", "EPI", "Violations", "Avg CIS"].map((h) => (
                        <th key={h} className="label-caps border-b border-subtle px-3 py-2 text-violet">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {active.stops.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-ink-faint">No stops assigned to this truck.</td>
                      </tr>
                    ) : (
                      active.stops.map((s, i) => (
                        <tr key={s.stop} className="border-b border-subtle/60" style={{ background: i % 2 ? "rgba(19,29,48,0.4)" : "transparent" }}>
                          <td className="px-3 py-2 font-mono text-xs" style={{ color: active.color }}>{s.stop}</td>
                          <td className="px-3 py-2 text-ink-primary">{s.station}</td>
                          <td className="px-3 py-2">
                            <span className="font-mono font-semibold" style={{ color: s.epi > 70 ? "#FB4D6D" : s.epi > 45 ? "#F59E0B" : "#10B981" }}>
                              {s.epi}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-ink-body">{s.violations.toLocaleString()}</td>
                          <td className="px-3 py-2 font-mono text-cyan">{Number(s.avgCis).toFixed(1)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </GlassCard>

      {/* How is EPI calculated? — collapsible */}
      <GlassCard className="overflow-hidden p-0" accentBar="from-cyan to-violet" hover={false}>
        <button onClick={() => setEpiOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-4 text-left">
          <span className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-inner" style={{ background: "rgba(34,211,238,0.12)", color: "#22D3EE" }}>
              <Calculator size={18} />
            </span>
            <span className="font-display text-ink-primary">How is EPI calculated?</span>
          </span>
          <ChevronDown size={18} className="text-ink-faint transition-transform" style={{ transform: epiOpen ? "rotate(180deg)" : "none" }} />
        </button>

        <AnimatePresence initial={false}>
          {epiOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="space-y-4 border-t border-subtle px-5 py-5 text-sm text-ink-body">
                <div>
                  <p className="label-caps mb-1.5">Congestion Impact Score (per violation)</p>
                  <code className="block rounded-inner bg-base/60 px-3 py-2 font-mono text-cyan">
                    CIS = Severity × Vehicle Size × Time Factor × Junction Factor
                  </code>
                  <p className="mt-2 text-xs text-ink-faint">
                    Severity: Double Parking (10) → Wrong Parking (4) · Size: Tanker/HGV (10) → Moped (1) ·
                    Time: peak rush (3.0) → late night (0.5), weekends ×0.7 · Junction: near junction (2.0) vs none (1.0).
                  </p>
                </div>
                <div>
                  <p className="label-caps mb-1.5">Enforcement Priority Index (per station)</p>
                  <code className="block rounded-inner bg-base/60 px-3 py-2 font-mono text-violet">
                    EPI = 0.4 × Norm(Total CIS) + 0.3 × Norm(Violations) + 0.3 × Norm(Avg CIS)
                  </code>
                  <p className="mt-2 text-xs text-ink-faint">
                    All three components are min-max normalized to 0–100, then the weighted score is itself re-normalized to a 0–100 EPI. Higher EPI = more urgent enforcement need.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}

function RangeRow({ label, icon: Icon, value, min, max, suffix = "", onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-ink-body">
          {Icon && <Icon size={14} className="text-emerald" />}
          {label}
        </span>
        <span className="font-mono text-emerald">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          "--val": `${pct}%`,
          "--track-fill": "#10B981",
          "--thumb-color": "#10B981",
          "--thumb-glow": "rgba(16,185,129,0.5)",
        }}
      />
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

function Stat({ label, value, color = "#E2E8F0" }) {
  return (
    <span className="rounded-chip border border-subtle bg-card/40 px-2.5 py-1">
      <span className="text-ink-faint">{label}: </span>
      <span className="font-semibold" style={{ color }}>{value}</span>
    </span>
  );
}
