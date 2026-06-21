import { motion } from "framer-motion";
import { Cpu, Camera } from "lucide-react";
import GlassCard from "../components/ui/GlassCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import { CCTV_BOXES, CCTV_DETECTIONS } from "../data/mockData.js";

const BOX_COLOR = { car: "#7C6AF7", truck: "#22D3EE", critical: "#FB4D6D" };

export default function LiveCCTV() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {/* Camera feed */}
      <GlassCard className="p-4 xl:col-span-2" accentBar="from-rose to-amber" hover={false}>
        <div className="mb-3 flex items-center justify-between">
          <SectionHeader title="YOLOv8 vision pipeline" sub="CAM-07 · MG Road · Edge inference" icon={Camera} accent="rose" className="mb-0" />
          <div className="flex items-center gap-2 rounded-chip px-2.5 py-1" style={{ background: "rgba(251,77,109,0.16)", border: "1px solid rgba(251,77,109,0.4)" }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose">Live Rec</span>
          </div>
        </div>

        {/* Feed canvas */}
        <div
          className="relative aspect-video w-full overflow-hidden rounded-inner"
          style={{ background: "#080C14" }}
        >
          {/* synthetic street backdrop */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #0b1220 0%, #0e1525 55%, #131d30 100%), repeating-linear-gradient(90deg, rgba(148,163,220,0.05) 0 2px, transparent 2px 60px)",
            }}
          />
          {/* perspective road */}
          <div
            className="absolute bottom-0 left-1/2 h-1/2 w-2/3 -translate-x-1/2"
            style={{ background: "linear-gradient(180deg, transparent, rgba(124,106,247,0.06))", clipPath: "polygon(38% 0, 62% 0, 100% 100%, 0 100%)" }}
          />

          {/* scanning reticle (cyan sweep) */}
          <motion.div
            className="absolute inset-x-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, #22D3EE, transparent)", boxShadow: "0 0 12px #22D3EE" }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          {/* reticle corner brackets */}
          {[
            "left-3 top-3 border-l-2 border-t-2",
            "right-3 top-3 border-r-2 border-t-2",
            "left-3 bottom-3 border-l-2 border-b-2",
            "right-3 bottom-3 border-r-2 border-b-2",
          ].map((c, i) => (
            <span key={i} className={`absolute h-6 w-6 border-cyan/70 ${c}`} />
          ))}

          {/* bounding boxes */}
          {CCTV_BOXES.map((b, i) => {
            const color = BOX_COLOR[b.cls];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 }}
                className="absolute"
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: `${b.w}%`,
                  height: `${b.h}%`,
                  border: `2px solid ${color}`,
                  boxShadow: `0 0 12px ${color}66`,
                  borderRadius: 4,
                }}
              >
                <span
                  className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white"
                  style={{ background: color }}
                >
                  {b.label} {b.conf}%
                </span>
                {b.cls === "critical" && (
                  <span className="absolute inset-0 animate-pulse rounded" style={{ boxShadow: `inset 0 0 18px ${color}` }} />
                )}
              </motion.div>
            );
          })}

          {/* HUD footer */}
          <div className="absolute bottom-2 left-3 flex items-center gap-2 font-mono text-[0.62rem] text-cyan/80">
            <Cpu size={12} /> YOLOv8-Nano · NVIDIA Jetson Orin · 41 FPS
          </div>
          <div className="absolute bottom-2 right-3 font-mono text-[0.62rem] text-ink-faint">
            {new Date().toLocaleTimeString()} · 1920×1080
          </div>
        </div>

        {/* class legend */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-body">
          <Legend color="#7C6AF7" label="Car (in-lane)" />
          <Legend color="#22D3EE" label="Truck / HGV" />
          <Legend color="#FB4D6D" label="Critical violation" />
        </div>
      </GlassCard>

      {/* Infraction log */}
      <GlassCard className="p-5" accentBar="from-rose to-violet" hover={false}>
        <SectionHeader title="Infraction log" sub="Auto-generated challans" accent="rose" className="mb-4" />
        <div className="space-y-2.5">
          {CCTV_DETECTIONS.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-inner border border-subtle bg-card/40 px-3.5 py-2.5"
              style={d.critical ? { borderColor: "rgba(251,77,109,0.4)" } : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-rose">{d.time}</span>
                <span className="font-mono text-xs text-violet">{d.conf}%</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm text-ink-primary">{d.type}</span>
                <span className="text-xs font-semibold text-amber">{d.vehicle}</span>
              </div>
              <div className="mt-0.5 font-mono text-[0.6rem] text-ink-faint">{d.id}</div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-sm border-2" style={{ borderColor: color }} />
      {label}
    </span>
  );
}
