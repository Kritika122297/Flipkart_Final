import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Gauge, Cpu, Truck, Play, Pause } from "lucide-react";
import KpiCard from "../components/ui/KpiCard.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import BengaluruMap from "../components/map/BengaluruMap.jsx";
import MapModeToggle from "../components/map/MapModeToggle.jsx";
import { Loading, ErrorState } from "../components/ui/AsyncState.jsx";
import { useSelectedLocation } from "../context/LocationContext.jsx";
import { useFetch, endpoints } from "../lib/api.js";

export default function CommandCenter() {
  const [hour, setHour] = useState(9);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mapMode, setMapMode] = useState("Dark");
  const { selectedLocation, setSelectedLocation } = useSelectedLocation();

  // Fetch summary KPIs + map markers/heat + 24h playback frames together.
  const { data, loading, error, refetch } = useFetch(
    async () => {
      const [summary, map, playback] = await Promise.all([
        endpoints.telemetrySummary(),
        endpoints.mapViolations(),
        endpoints.mapPlayback(),
      ]);
      return { summary, map, playback };
    },
    []
  );

  // Emerging-risk zones (Model 3) overlaid as yellow warning circles.
  const emerging = useFetch(endpoints.emergingHotspots, []);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setHour((h) => (h + 1) % 24), 700 / speed);
    return () => clearInterval(t);
  }, [playing, speed]);

  if (loading) return <Loading label="Loading command center telemetry…" height={420} />;
  if (error) return <ErrorState error={error} onRetry={refetch} height={420} />;

  const kpi = data.summary;
  const markers = data.map.markers;
  const zones = data.map.zones;
  const frames = data.playback.frames;

  // Build heat points for the selected hour from the playback frame.
  const frame = frames[hour]?.zones ?? [];
  const heatPoints = frame.flatMap((z) =>
    Array.from({ length: 6 }, () => [
      z.lat + (Math.random() - 0.5) * 0.02,
      z.lon + (Math.random() - 0.5) * 0.02,
      z.intensity,
    ])
  );

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Active violations" value={kpi.activeViolations} accent="rose" icon={AlertTriangle} sub="live · across 38 stations" delay={0} />
        <KpiCard label="Average CIS" value={kpi.avgCIS} decimals={1} accent="violet" icon={Gauge} sub="congestion impact / 100" delay={0.08} />
        <KpiCard label="AI pipeline" value={kpi.aiUptime} decimals={1} suffix="%" accent="cyan" icon={Cpu} sub="edge inference uptime" delay={0.16} />
        <KpiCard label="Fleet active" value={kpi.fleetActive} suffix={`/${kpi.fleetTotal}`} accent="emerald" icon={Truck} sub={`${kpi.zonesCleared} zones cleared today`} delay={0.24} />
      </div>

      {/* Map + hotspot list */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <GlassCard className="p-3 xl:col-span-2" accentBar="from-violet to-cyan">
          <div className="mb-3 flex items-center justify-between px-2 pt-1">
            <SectionHeader title="CIS-weighted congestion heatmap" sub="DarkMatter tiles · live hotspot density" className="mb-0" />
          </div>
          <div className="relative overflow-hidden rounded-[16px]">
            <div className="pointer-events-none absolute right-3 top-3 z-[1000]">
              <MapModeToggle mode={mapMode} onChange={setMapMode} />
            </div>
            <BengaluruMap
              markers={markers}
              heat
              heatPoints={heatPoints}
              height="460px"
              mode={mapMode}
              onSelectLocation={setSelectedLocation}
              selectedLocation={selectedLocation}
              warnings={emerging.data?.zones ?? []}
            />
          </div>

          {/* Playback slider */}
          <div className="mt-4 flex items-center gap-4 px-2 pb-1">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet text-white shadow-glow-violet"
            >
              {playing ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="label-caps">24-hour congestion playback</span>
                <span className="font-mono text-amber">{String(hour).padStart(2, "0")}:00</span>
              </div>
              <input
                type="range"
                min={0}
                max={23}
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                style={{
                  "--val": `${(hour / 23) * 100}%`,
                  "--track-fill": "#7C6AF7",
                  "--thumb-color": "#F59E0B",
                  "--thumb-glow": "rgba(245,158,11,0.5)",
                }}
              />
            </div>

            {/* Playback speed selector */}
            <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-subtle bg-card/50 p-0.5">
              {[1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold transition-colors"
                  style={
                    speed === s
                      ? { background: "rgba(124,106,247,0.9)", color: "#fff", boxShadow: "0 0 12px rgba(124,106,247,0.5)" }
                      : { color: "#94A3B8" }
                  }
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Hotspot list */}
        <GlassCard className="p-5" accentBar="from-rose to-amber">
          <SectionHeader title="Live hotspots" sub="Ranked by enforcement priority" accent="rose" className="mb-4" />
          <div className="space-y-2.5">
            {[...zones]
              .sort((a, b) => b.epi - a.epi)
              .slice(0, 8)
              .map((z, i) => (
                <motion.button
                  key={z.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedLocation(z.name)}
                  className={
                    "flex w-full items-center gap-3 rounded-inner border bg-card/40 px-3 py-2.5 text-left transition-colors hover:border-strong " +
                    (selectedLocation === z.name ? "border-violet/60" : "border-subtle")
                  }
                  style={selectedLocation === z.name ? { background: "rgba(124,106,247,0.1)" } : undefined}
                >
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.62rem] font-bold text-white"
                    style={{ background: z.risk === "critical" ? "#FB4D6D" : z.risk === "medium" ? "#F59E0B" : "#10B981" }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-ink-primary">{z.name}</div>
                    <div className="text-[0.68rem] text-ink-faint">{z.count} violations</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold text-violet">{z.epi}</div>
                    <div className="text-[0.62rem] text-ink-faint">EPI</div>
                  </div>
                </motion.button>
              ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
