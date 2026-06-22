import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Radio,
  ChevronDown,
  Play,
  Square,
  Info,
  ShieldAlert,
} from "lucide-react";
import GlassCard from "../components/ui/GlassCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import { useSelectedLocation, cameraLabelFor } from "../context/LocationContext.jsx";
import { CCTV_DETECTIONS, CCTV_DETECTION_POOL, ZONES } from "../data/mockData.js";

// Camera list built from the Bengaluru zones (like Streamlit builds it from the
// dataframe locations). The select syncs with the global selected-location state.
const CAMERAS = ZONES.map((z) => ({ zone: z.name, ...cameraLabelFor(z.name) }));

// Detection boxes positioned within the lane view (mirrors the Streamlit feed):
// Car + Truck sit inside the NO PARKING ZONE, the moving vehicle is in a clear lane.
const FEED_BOXES = [
  { label: "Car", conf: 96, status: "VIOLATION", color: "#FB4D6D", ok: false, x: 9, y: 44, w: 19, h: 22 },
  { label: "Truck", conf: 89, status: "VIOLATION", color: "#FB4D6D", ok: false, x: 13, y: 70, w: 24, h: 22 },
  { label: "Moving", conf: 99, status: "OK", color: "#10B981", ok: true, x: 56, y: 19, w: 15, h: 17 },
];

const nowClock = () => new Date().toLocaleTimeString("en-GB");

export default function LiveCCTV() {
  // Dropdown removed (Task A): the active feed follows the globally selected
  // location, set by clicking any map marker or hotspot/leaderboard row.
  const { selectedLocation, setSelectedLocation } = useSelectedLocation();
  const cam = cameraLabelFor(selectedLocation);

  const [running, setRunning] = useState(false);
  const [fps, setFps] = useState(28.4);
  const [log, setLog] = useState(CCTV_DETECTIONS);
  const idRef = useRef(7742);

  // Live behaviour while "recording": flicker FPS + append new infractions.
  useEffect(() => {
    if (!running) return;
    const fpsTimer = setInterval(() => setFps(+(26 + Math.random() * 6).toFixed(1)), 1200);
    const logTimer = setInterval(() => {
      const pick = CCTV_DETECTION_POOL[Math.floor(Math.random() * CCTV_DETECTION_POOL.length)];
      const entry = {
        ...pick,
        id: `DET-${idRef.current++}`,
        time: nowClock(),
        conf: +(80 + Math.random() * 19).toFixed(1),
      };
      setLog((l) => [entry, ...l].slice(0, 14));
    }, 3200);
    return () => {
      clearInterval(fpsTimer);
      clearInterval(logTimer);
    };
  }, [running]);

  return (
    <div className="space-y-5">
      {/* Concept banner (mirrors the Streamlit st.info block) */}
      <div
        className="flex items-start gap-3 rounded-card border-l-2 px-4 py-3.5"
        style={{ background: "rgba(34,211,238,0.07)", borderColor: "#22D3EE", border: "1px solid rgba(34,211,238,0.2)", borderLeft: "3px solid #22D3EE" }}
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
        {/* ── Left control / spec panel ─────────────────────────── */}
        <GlassCard className="space-y-4 p-5" accentBar="from-rose to-amber" hover={false}>
          <SectionHeader title="Edge node" sub="YOLOv8 inference control" icon={Camera} accent="rose" className="mb-0" />

          {/* Camera selector (mirrors the Streamlit selectbox) — synced to the
              global location so map clicks on other tabs switch this feed too. */}
          <div>
            <label className="label-caps mb-1.5 flex items-center gap-1.5">
              <Radio size={12} className="text-violet" /> Select camera feed
            </label>
            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full appearance-none rounded-inner border border-subtle bg-card/60 px-3 py-2.5 pr-9 text-sm text-ink-primary outline-none transition-colors focus:border-violet focus:ring-2 focus:ring-violet/30"
              >
                {CAMERAS.map((c) => (
                  <option key={c.zone} value={c.zone} style={{ background: "#0E1525", color: "#E2E8F0" }}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            </div>
            <p className="mt-1.5 text-[0.68rem] text-ink-faint">Synced across tabs · click any map marker to switch</p>
          </div>

          {/* Start / Stop button */}
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

          {/* Model spec card (mirrors Streamlit Model / Compute / Pipeline) */}
          <div className="space-y-3 rounded-inner border border-subtle bg-card/40 p-3.5">
            <Spec label="Model" value="YOLOv8-Nano (Edge)" color="#22D3EE" />
            <Spec label="Compute" value="NVIDIA Jetson Orin" color="#7C6AF7" />
            <Spec label="Pipeline" value="Object Det → Tracker → Zone Check" color="#10B981" />
          </div>
        </GlassCard>

        {/* ── Feed area ─────────────────────────────────────────── */}
        <GlassCard className="p-4 xl:col-span-3" accentBar="from-rose to-amber" hover={false}>
          <div className="mb-3">
            <SectionHeader title="YOLOv8 vision pipeline" sub={`${cam.label} · Edge inference`} icon={Camera} accent="rose" className="mb-0" />
          </div>

          {/* Feed canvas OR offline placeholder */}
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
                {/* asphalt texture */}
                <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(120% 90% at 30% 40%, rgba(251,77,109,0.05), transparent 60%), linear-gradient(180deg, #0d0f18 0%, #12141f 100%)" }} />

                {/* lane divider lines (dashed verticals → 3 lanes) */}
                <div className="absolute bottom-0 top-0" style={{ left: "48%", borderLeft: "2px dashed rgba(148,163,220,0.4)" }} />
                <div className="absolute bottom-0 top-0" style={{ left: "74%", borderLeft: "2px dashed rgba(148,163,220,0.4)" }} />

                {/* NO PARKING ZONE — dashed parallelogram in the left lane */}
                <div
                  className="absolute"
                  style={{
                    left: "6%",
                    top: "12%",
                    width: "32%",
                    height: "76%",
                    transform: "skewX(-11deg)",
                    border: "2px dashed rgba(251,77,109,0.6)",
                    borderRadius: 8,
                    background: "linear-gradient(180deg, rgba(251,77,109,0.10), rgba(251,77,109,0.02))",
                  }}
                />
                <span
                  className="absolute font-bold uppercase tracking-wider"
                  style={{ left: "10%", top: "16%", color: "#FB4D6D", fontSize: "0.8rem", letterSpacing: "0.08em", textShadow: "0 0 10px rgba(251,77,109,0.5)" }}
                >
                  No Parking Zone
                </span>

                {/* scanning reticle */}
                <motion.div
                  className="absolute inset-x-0 h-[2px]"
                  style={{ background: "linear-gradient(90deg, transparent, #22D3EE, transparent)", boxShadow: "0 0 12px #22D3EE", opacity: 0.5 }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                />

                {/* LIVE REC badge (top-left, inside feed) */}
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded px-2 py-1" style={{ background: "rgba(251,77,109,0.92)" }}>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  <span className="text-[0.62rem] font-black uppercase tracking-widest text-white">Live Rec</span>
                </div>

                {/* FPS + camera (top-right, inside feed) */}
                <div className="absolute right-3 top-3 rounded px-2 py-1 font-mono text-[0.62rem] text-emerald" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(148,163,220,0.15)" }}>
                  FPS: {fps} | {cam.label}
                </div>

                {/* detection boxes positioned within lanes */}
                {FEED_BOXES.map((b, i) => (
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

      {/* ── Live infraction log (table, mirrors the Streamlit dataframe) ─────── */}
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
                        {d.cis.toFixed(1)}
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
