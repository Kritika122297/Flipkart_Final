import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, Play, Square, Info, ShieldAlert, Zap, Loader2, CheckCircle2 } from "lucide-react";
import GlassCard from "../components/ui/GlassCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import { Loading, ErrorState } from "../components/ui/AsyncState.jsx";
import { useSelectedLocation } from "../context/LocationContext.jsx";
import { useFetch, useLazyRequest, endpoints } from "../lib/api.js";

const nowClock = () => new Date().toLocaleTimeString("en-GB");

export default function LiveCCTV() {
  // The active feed follows the globally selected location (set by map clicks or
  // hotspot rows on other tabs). Read-only here — no local camera dropdown.
  const { selectedLocation } = useSelectedLocation();
  const { data, loading, error, refetch } = useFetch(endpoints.cctvCameras, []);

  const [running, setRunning] = useState(false);
  const [fps, setFps] = useState(28.4);
  const [log, setLog] = useState([]);
  const [pushed, setPushed] = useState(0); // # detections posted to the backend
  const idRef = useRef(7742);

  // "Recalculate Dispatch VRP" action.
  const { run: runVrp, data: vrp, loading: vrpLoading } = useLazyRequest(endpoints.dispatcherVrp);

  // Seed the infraction log when camera data arrives.
  useEffect(() => {
    if (data?.detections) setLog(data.detections);
  }, [data]);

  // Live behaviour while "recording": flicker FPS, append infractions, AND post
  // each new detection to the backend so maps/telemetry/routes include it.
  useEffect(() => {
    if (!running || !data?.pool) return;
    const camNow = data.cameras.find((c) => c.zone === selectedLocation) ?? data.cameras[0];
    const fpsTimer = setInterval(() => setFps(+(26 + Math.random() * 6).toFixed(1)), 1200);
    const logTimer = setInterval(() => {
      const pool = data.pool;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const conf = +(80 + Math.random() * 19).toFixed(1);
      setLog((l) => [{ ...pick, id: `DET-${idRef.current++}`, time: nowClock(), conf }, ...l].slice(0, 14));

      // ── CCTV → backend feedback loop ──
      if (camNow) {
        endpoints
          .cctvInfraction({
            latitude: camNow.lat + (Math.random() - 0.5) * 0.008,
            longitude: camNow.lon + (Math.random() - 0.5) * 0.008,
            vehicle_type: pick.vehicle,
            violation_type: pick.type,
            location: camNow.label,
            confidence: conf,
          })
          .then(() => {
            setPushed((p) => p + 1);
            // Notify every mounted tab to refetch with the new violation included.
            window.dispatchEvent(new CustomEvent("parkwatch:dataset-changed"));
          })
          .catch(() => {});
      }
    }, 3200);
    return () => {
      clearInterval(fpsTimer);
      clearInterval(logTimer);
    };
  }, [running, data, selectedLocation]);

  if (loading) return <Loading label="Connecting to camera grid…" height={420} />;
  if (error) return <ErrorState error={error} onRetry={refetch} height={420} />;

  const cameras = data.cameras;
  const boxes = data.boxes;
  const cam = cameras.find((c) => c.zone === selectedLocation) ?? cameras[0] ?? { label: selectedLocation, zone: selectedLocation, cam: 1 };

  return (
    <div className="space-y-5">
      {/* Concept banner */}
      <div
        className="flex items-start gap-3 rounded-card px-4 py-3.5"
        style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.2)", borderLeft: "3px solid #22D3EE" }}
      >
        <Info size={18} className="mt-0.5 shrink-0 text-cyan" />
        <p className="text-sm leading-relaxed text-ink-body">
          <span className="font-semibold text-cyan">Concept:</span> instead of relying on manual
          police tickets (CSV data), this module shows how existing BTP traffic cameras can
          automatically detect vehicles parked in No-Parking zones, compute the live{" "}
          <span className="text-ink-primary">Congestion Impact Score (CIS)</span>, and instantly
          alert the routing dispatcher.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {/* Left control / spec panel */}
        <GlassCard className="space-y-4 p-5" accentBar="from-rose to-amber" hover={false}>
          <SectionHeader title="Edge node" sub="YOLOv8 inference control" icon={Camera} accent="rose" className="mb-0" />

          {/* Read-only active camera — bound to the global LocationContext */}
          <div className="rounded-inner border border-subtle bg-card/50 px-3 py-2.5">
            <div className="label-caps mb-1 flex items-center gap-1.5">
              <MapPin size={12} className="text-violet" /> Active camera feed
            </div>
            <div className="text-sm font-semibold text-ink-primary">{cam.label}</div>
            <div className="font-mono text-[0.68rem] text-ink-faint">Synced from map · click any marker to switch</div>
          </div>

          <button
            onClick={() => setRunning((r) => !r)}
            className="flex w-full items-center justify-center gap-2 rounded-inner py-2.5 font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={
              running
                ? { background: "rgba(251,77,109,0.18)", border: "1px solid rgba(251,77,109,0.5)", color: "#FB4D6D" }
                : { background: "linear-gradient(135deg,#FB4D6D,#F59E0B)", boxShadow: "0 0 20px rgba(251,77,109,0.4)" }
            }
          >
            {running ? <Square size={16} /> : <Play size={16} />}
            {running ? "Stop Analysis" : "Start Live Edge Analysis"}
          </button>

          {/* Feedback-loop status + manual VRP recompute */}
          {pushed > 0 && (
            <div className="flex items-center gap-1.5 rounded-inner px-3 py-2 text-xs" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#6EE7B7" }}>
              <CheckCircle2 size={13} /> {pushed} detection{pushed > 1 ? "s" : ""} pushed to live dataset
            </div>
          )}
          <button
            onClick={() => runVrp(4).catch(() => {})}
            disabled={vrpLoading}
            className="flex w-full items-center justify-center gap-2 rounded-inner border border-strong py-2.5 text-sm font-semibold text-amber transition-colors hover:bg-amber/10 disabled:opacity-50"
          >
            {vrpLoading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            ⚡ Recalculate Dispatch VRP
          </button>
          {vrp && (
            <div className="rounded-inner border border-subtle bg-card/40 p-2.5 text-xs text-ink-body">
              Routes recomputed: <span className="font-semibold text-emerald">{vrp.trucks.length} trucks</span> ·{" "}
              {vrp.totalDistance} km · max ETA {vrp.maxEta} min (includes CCTV detections)
            </div>
          )}

          <div className="space-y-3 rounded-inner border border-subtle bg-card/40 p-3.5">
            <Spec label="Model" value="YOLOv8-Nano (Edge)" color="#22D3EE" />
            <Spec label="Compute" value="NVIDIA Jetson Orin" color="#7C6AF7" />
            <Spec label="Pipeline" value="Object Det → Tracker → Zone Check" color="#10B981" />
          </div>
        </GlassCard>

        {/* Feed area */}
        <GlassCard className="p-4 xl:col-span-3" accentBar="from-rose to-amber" hover={false}>
          <div className="mb-3">
            <SectionHeader title="YOLOv8 vision pipeline" sub={`${cam.label} · Edge inference`} icon={Camera} accent="rose" className="mb-0" />
          </div>

          <AnimatePresence mode="wait">
            {running ? (
              <motion.div
                key="feed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative aspect-video w-full overflow-hidden rounded-inner"
                style={{ background: "linear-gradient(135deg,#12101f,#0b0d16)", border: "1px solid rgba(99,91,255,0.5)", boxShadow: "0 0 30px rgba(79,70,229,0.25)" }}
              >
                <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(120% 90% at 30% 40%, rgba(251,77,109,0.05), transparent 60%), linear-gradient(180deg, #0d0f18 0%, #12141f 100%)" }} />

                {/* lane divider lines */}
                <div className="absolute bottom-0 top-0" style={{ left: "48%", borderLeft: "2px dashed rgba(148,163,220,0.4)" }} />
                <div className="absolute bottom-0 top-0" style={{ left: "74%", borderLeft: "2px dashed rgba(148,163,220,0.4)" }} />

                {/* NO PARKING ZONE parallelogram */}
                <div
                  className="absolute"
                  style={{ left: "6%", top: "12%", width: "32%", height: "76%", transform: "skewX(-11deg)", border: "2px dashed rgba(251,77,109,0.6)", borderRadius: 8, background: "linear-gradient(180deg, rgba(251,77,109,0.10), rgba(251,77,109,0.02))" }}
                />
                <span className="absolute font-bold uppercase tracking-wider" style={{ left: "10%", top: "16%", color: "#FB4D6D", fontSize: "0.8rem", letterSpacing: "0.08em", textShadow: "0 0 10px rgba(251,77,109,0.5)" }}>
                  No Parking Zone
                </span>

                {/* scanning reticle */}
                <motion.div
                  className="absolute inset-x-0 h-[2px]"
                  style={{ background: "linear-gradient(90deg, transparent, #22D3EE, transparent)", boxShadow: "0 0 12px #22D3EE", opacity: 0.5 }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                />

                {/* LIVE REC + FPS */}
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded px-2 py-1" style={{ background: "rgba(251,77,109,0.92)" }}>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  <span className="text-[0.62rem] font-black uppercase tracking-widest text-white">Live Rec</span>
                </div>
                <div className="absolute right-3 top-3 rounded px-2 py-1 font-mono text-[0.62rem] text-emerald" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(148,163,220,0.15)" }}>
                  FPS: {fps} | {cam.label}
                </div>

                {/* detection boxes */}
                {boxes.map((b, i) => (
                  <motion.div
                    key={b.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.15 }}
                    className="absolute"
                    style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, border: `2px solid ${b.color}`, boxShadow: `0 0 14px ${b.color}66`, borderRadius: 4 }}
                  >
                    <span className="absolute -top-[18px] left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white" style={{ background: b.color }}>
                      {b.label} {b.conf}%{b.ok ? "" : ` | ${b.status}`}
                    </span>
                    {!b.ok && <span className="absolute inset-0 animate-pulse rounded" style={{ boxShadow: `inset 0 0 18px ${b.color}` }} />}
                  </motion.div>
                ))}

                <div className="absolute bottom-2 right-3 font-mono text-[0.62rem] text-ink-faint">
                  YOLOv8-Nano · NVIDIA Jetson Orin · Edge Inference
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="offline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid aspect-video w-full place-items-center rounded-inner border border-dashed border-subtle text-center"
                style={{ background: "#080C14" }}
              >
                <div>
                  <Camera size={44} className="mx-auto text-ink-faint" />
                  <div className="mt-3 font-display text-ink-body">Camera Offline</div>
                  <div className="mt-1 text-sm text-ink-faint">
                    Click <span className="font-semibold text-rose">Start Live Edge Analysis</span> to connect to
                    <br />
                    <span className="text-ink-primary">{cam.label}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* Live infraction log table */}
      <GlassCard className="p-5" accentBar="from-rose to-violet" hover={false}>
        <div className="mb-4 flex items-center justify-between">
          <SectionHeader title="Live infractions log" sub="Auto-generated challans · appended in real time" icon={ShieldAlert} accent="rose" className="mb-0" />
          {running && <span className="font-mono text-xs text-emerald">● streaming</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="text-left">
                {["Detection Time", "Camera", "Vehicle Type", "Confidence", "Offense", "Est. CIS Impact", "Action"].map((h) => (
                  <th key={h} className="label-caps border-b border-subtle px-3 py-2 text-violet">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {log.map((d, i) => (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0, backgroundColor: "rgba(251,77,109,0.12)" }}
                    animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }}
                    transition={{ duration: 0.8 }}
                    className="border-b border-subtle/60"
                    style={{ background: i % 2 ? "rgba(19,29,48,0.4)" : "transparent" }}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-rose">{d.time}</td>
                    <td className="px-3 py-2 text-xs text-ink-body">{cam.label}</td>
                    <td className="px-3 py-2 text-amber">{d.vehicle}</td>
                    <td className="px-3 py-2 font-mono text-violet">{d.conf}%</td>
                    <td className="px-3 py-2 text-ink-primary">{d.type}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono font-semibold" style={{ color: d.cis > 60 ? "#FB4D6D" : d.cis > 30 ? "#F59E0B" : "#10B981" }}>
                        {Number(d.cis).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-chip px-2 py-0.5 text-[0.68rem] font-semibold" style={actionStyle(d.action)}>
                        {d.action}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {!running && (
          <p className="mt-3 text-center text-xs text-ink-faint">
            Showing last recorded session — start the feed to stream live detections.
          </p>
        )}
      </GlassCard>
    </div>
  );
}

function Spec({ label, value, color }) {
  return (
    <div>
      <div className="label-caps mb-0.5">{label}</div>
      <div className="text-sm font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}

function actionStyle(action) {
  if (action.includes("Tow")) return { background: "rgba(251,77,109,0.14)", color: "#FB4D6D", border: "1px solid rgba(251,77,109,0.3)" };
  if (action.includes("Alert")) return { background: "rgba(245,158,11,0.14)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" };
  return { background: "rgba(34,211,238,0.12)", color: "#22D3EE", border: "1px solid rgba(34,211,238,0.3)" };
}
