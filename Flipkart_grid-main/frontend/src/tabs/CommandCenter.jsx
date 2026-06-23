import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Gauge, Cpu, Truck, Play, Pause, Loader2 } from "lucide-react";
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
  const [markerDensity, setMarkerDensity] = useState(0.15); // 15% of markers by default
  const { selectedLocation, setSelectedLocation } = useSelectedLocation();
  const [mlStatus, setMlStatus] = useState(null);

  useEffect(() => {
    const fetch = () => endpoints.mlStatus().then(setMlStatus).catch(() => {});
    fetch();
    const id = setInterval(fetch, 10000);
    const onChanged = () => fetch();
    window.addEventListener("parkwatch:dataset-changed", onChanged);
    return () => { clearInterval(id); window.removeEventListener("parkwatch:dataset-changed", onChanged); };
  }, []);

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

  // Hooks must be unconditional — derive from data safely before any early returns.
  const frames = data?.playback?.frames ?? [];
  const allMarkers = data?.map?.markers ?? [];
  const displayMarkers = useMemo(
    () => allMarkers.slice(0, Math.max(8, Math.ceil(allMarkers.length * markerDensity))),
    [allMarkers, markerDensity]
  );
  const heatPoints = useMemo(() => {
    const frame = frames[hour]?.zones ?? [];
    return frame.flatMap((z, zi) =>
      Array.from({ length: 16 }, (_, k) => {
        // Golden-angle spiral — tight spread (max ~900m) so blobs look concentrated.
        const angle = ((zi * 16 + k) * 2.399963) % (Math.PI * 2);
        const r = 0.001 + (k / 16) * 0.008;
        return [z.lat + Math.sin(angle) * r, z.lon + Math.cos(angle) * r, z.intensity];
      })
    );
  }, [frames, hour]);

  const TOD = [[0,5,"NIGHT","#7C6AF7"],[5,8,"DAWN","#22D3EE"],[8,11,"⚡ RUSH AM","#FB4D6D"],[11,17,"MIDDAY","#F59E0B"],[17,20,"⚡ RUSH PM","#FB4D6D"],[20,24,"EVENING","#7C6AF7"]];
  const [,,todLabel,todColor] = TOD.find(([s,e]) => hour >= s && hour < e) || [0,0,"","#94A3B8"];

  if (loading) return <Loading label="Loading command center telemetry…" height={420} />;
  if (error) return <ErrorState error={error} onRetry={refetch} height={420} />;

  const kpi = data.summary;
  const zones = data.map.zones;
  const selectedZone = zones.find((z) => z.name === selectedLocation) ?? null;

  return (
    <div className="space-y-6">
      {/* ML Status bar */}
      {mlStatus && (
        <GlassCard className="px-4 py-3" hover={false}>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="label-caps text-violet">ML Models</span>
            {[
              { label: "ETA", m: mlStatus.eta },
              { label: "Propensity", m: mlStatus.propensity },
            ].map(({ label, m }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs">
                <span className="text-ink-faint">{label}:</span>
                {m.trained ? (
                  <span className="font-semibold" style={{ color: ["xgboost","lightgbm"].includes(m.engine) ? "#10B981" : "#F59E0B" }}>
                    {m.engine} ✓
                  </span>
                ) : (
                  <Loader2 size={12} className="animate-spin text-ink-faint" />
                )}
              </div>
            ))}
            {[
              { label: "Hotspots", trained: mlStatus.hotspots?.trained },
              { label: "Forecast", trained: mlStatus.forecast?.trained },
            ].map(({ label, trained }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs">
                <span className="text-ink-faint">{label}:</span>
                {trained ? <span className="font-semibold text-emerald">✓</span> : <Loader2 size={12} className="animate-spin text-ink-faint" />}
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2 text-xs">
              <span className="text-ink-faint">Live buffer:</span>
              <span className="font-mono text-amber">{mlStatus.live_buffered} / {mlStatus.retrain_threshold}</span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-subtle">
                <div
                  className="h-full rounded-full bg-amber transition-all"
                  style={{ width: `${Math.min(100, (mlStatus.live_buffered / mlStatus.retrain_threshold) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      )}

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
            <div className="flex items-center gap-1.5">
              <span className="text-[0.65rem] text-ink-faint">Markers</span>
              <div className="flex items-center gap-0.5 rounded-full border border-subtle bg-card/50 p-0.5">
                {[["Low", 0.1], ["Mid", 0.3], ["All", 1.0]].map(([lbl, val]) => (
                  <button
                    key={lbl}
                    onClick={() => setMarkerDensity(val)}
                    className="rounded-full px-2.5 py-1 text-[0.7rem] font-semibold transition-colors"
                    style={markerDensity === val ? { background: "rgba(124,106,247,0.9)", color: "#fff" } : { color: "#94A3B8" }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[16px]">
            <div className="pointer-events-none absolute right-3 top-3 z-[1000]">
              <MapModeToggle mode={mapMode} onChange={setMapMode} />
            </div>
            <BengaluruMap
              markers={displayMarkers}
              heat
              heatPoints={heatPoints}
              height="460px"
              mode={mapMode}
              onSelectLocation={setSelectedLocation}
              selectedLocation={selectedLocation}
              flyTo={selectedZone}
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
                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber">{String(hour).padStart(2, "0")}:00</span>
                  <span className="rounded px-1.5 py-0.5 text-[0.62rem] font-bold tracking-wide" style={{ background: todColor + "22", color: todColor }}>{todLabel}</span>
                </div>
              </div>
              {/* Peak-hour indicator bar */}
              <div className="relative mb-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="absolute h-full rounded-full" style={{ left: `${(8/23)*100}%`, width: `${(3/23)*100}%`, background: "#FB4D6D66" }} />
                <div className="absolute h-full rounded-full" style={{ left: `${(11/23)*100}%`, width: `${(6/23)*100}%`, background: "#F59E0B33" }} />
                <div className="absolute h-full rounded-full" style={{ left: `${(17/23)*100}%`, width: `${(3/23)*100}%`, background: "#FB4D6D66" }} />
                <div className="absolute top-0 h-full w-0.5 rounded-full transition-all" style={{ left: `${(hour/23)*100}%`, background: "#F59E0B", boxShadow: "0 0 6px #F59E0B" }} />
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
