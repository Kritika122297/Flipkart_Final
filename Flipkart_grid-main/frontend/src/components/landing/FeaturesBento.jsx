import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Map,
  Camera,
  LineChart,
  Target,
  Bot,
  Truck,
  Database,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import LoginModal from "../auth/LoginModal.jsx";

// Each module deep-links into its dashboard tab (ids match Dashboard.jsx).
const MODULES = [
  {
    id: "command",
    tab: "command",
    title: "Command Center",
    subtitle: "Live Intelligence Map",
    desc: "A CIS-weighted heatmap of Bengaluru with live KPI cards, a 24-hour hour-by-hour congestion replay, and critical junction alerts — your primary enforcement hub.",
    color: "#22D3EE",
    span: "md:col-span-2 lg:col-span-4 lg:row-span-2",
    badge: "Core",
    features: ["CIS heatmap", "24h time-lapse", "Junction alerts", "Live KPIs"],
    big: true,
    Icon: Map,
  },
  {
    id: "cctv",
    tab: "cctv",
    title: "Live CCTV Vision",
    subtitle: "YOLOv8 · Jetson Orin",
    desc: "Edge-AI turns existing traffic cameras into automatic illegal-parking detectors — computing live CIS and alerting dispatch in real time.",
    color: "#FB4D6D",
    span: "md:col-span-2 lg:col-span-2 lg:row-span-2",
    badge: "Edge AI",
    features: ["No-parking detection", "Live infraction log"],
    Icon: Camera,
  },
  {
    id: "analytics",
    tab: "analytics",
    title: "Congestion Analytics",
    subtitle: "Economic & Emergency Impact",
    desc: "Quantifies congestion cost in ₹ and models ambulance-delay risk across Bengaluru hospitals.",
    color: "#F59E0B",
    span: "md:col-span-1 lg:col-span-2",
    features: ["₹ cost calculator", "Ambulance delay"],
    Icon: LineChart,
  },
  {
    id: "dispatch",
    tab: "dispatch",
    title: "Intelligent Dispatch",
    subtitle: "Enforcement Priority Index",
    desc: "Ranks stations by EPI, runs what-if patrol simulations, and forecasts annual savings.",
    color: "#10B981",
    span: "md:col-span-1 lg:col-span-2",
    features: ["EPI ranking", "What-if simulator"],
    Icon: Target,
  },
  {
    id: "tactical",
    tab: "tactical",
    title: "Tactical AI Commander",
    subtitle: "Groq LLM + ML Forecasting",
    desc: "Natural-language patrol advice via Groq (Llama 3.3 70B), paired with a RandomForest model that forecasts risk and flags anomalies.",
    color: "#7C6AF7",
    span: "md:col-span-2 lg:col-span-2",
    badge: "AI",
    features: ["Groq chat", "RandomForest forecast", "Anomaly detection"],
    Icon: Bot,
  },
  {
    id: "fleet",
    tab: "fleet",
    title: "OR-Tools Fleet",
    subtitle: "Fleet Route Optimization",
    desc: "Google OR-Tools CVRP solver computes mathematically optimal routes for multiple tow trucks at once — clearing high-CIS zones faster than naive heuristics.",
    color: "#14B8A6",
    span: "md:col-span-1 lg:col-span-3",
    features: ["CVRP solver", "Multi-vehicle routing", "Optimal tow dispatch"],
    Icon: Truck,
  },
  {
    id: "data",
    tab: "data",
    title: "Data Inspector",
    subtitle: "Upload · Clean · Validate",
    desc: "Drag-and-drop CSV ingestion with schema validation, data-quality scoring, and 1-click demo data. Handles 300K+ BTP records.",
    color: "#3B82F6",
    span: "md:col-span-1 lg:col-span-3",
    features: ["Schema auto-detect", "Quality metrics", "Geo validation"],
    Icon: Database,
  },
];

export default function FeaturesBento() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [login, setLogin] = useState({ open: false, redirect: "/dashboard" });

  // Deep-link into a tab; if not signed in, open the login dialog first.
  const openTab = (tab) => {
    const target = `/dashboard?tab=${tab}`;
    if (isAuthenticated) navigate(target);
    else setLogin({ open: true, redirect: target });
  };

  return (
    <section id="features" ref={ref} className="relative overflow-hidden py-24 md:py-28">
      <div className="city-grid absolute inset-0 opacity-[0.1]" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.25)", color: "#B9AEF9" }}>
            The Platform
          </div>
          <h2 className="text-balance font-display text-3xl text-ink-primary md:text-5xl">
            Seven Modules. <span className="text-gradient-violet">One Operating System.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-ink-body md:text-lg">
            From raw violation data to tactical enforcement decisions — every layer of urban
            mobility intelligence, in one cockpit.
          </p>
        </motion.div>

        {/* bento grid */}
        <div className="grid auto-rows-[minmax(150px,auto)] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
          {MODULES.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 26 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => openTab(m.tab)}
              className={`group bento-card flex cursor-pointer flex-col p-6 ${m.span}`}
            >
              {/* hover radial glow */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: `radial-gradient(circle at 30% 0%, ${m.color}14, transparent 60%)` }} />

              <div className="relative mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: `${m.color}14`, border: `1px solid ${m.color}30`, color: m.color }}>
                  <m.Icon className="h-6 w-6" strokeWidth={1.7} />
                </div>
                {m.badge && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}33` }}>
                    {m.badge}
                  </span>
                )}
              </div>

              <div className="relative">
                <h3 className={`font-display text-ink-primary ${m.big ? "text-2xl" : "text-lg"}`}>{m.title}</h3>
                <div className="mt-0.5 text-xs font-medium" style={{ color: m.color }}>{m.subtitle}</div>
                <p className={`mt-3 leading-relaxed text-ink-body ${m.big ? "max-w-xl text-base" : "text-sm"}`}>{m.desc}</p>
              </div>

              {/* big-card decorative heat dots */}
              {m.big && (
                <div className="relative mt-6 grid max-w-md grid-cols-12 gap-1.5">
                  {Array.from({ length: 24 }).map((_, k) => {
                    const intensity = [0.3, 0.6, 0.9, 0.5, 0.4, 0.8, 1, 0.7, 0.45, 0.55, 0.85, 0.35][k % 12];
                    const c = intensity > 0.82 ? "#FB4D6D" : intensity > 0.6 ? "#F59E0B" : intensity > 0.4 ? "#22D3EE" : "#10B981";
                    const alpha = Math.round(intensity * 120 + 30).toString(16).padStart(2, "0");
                    return <span key={k} className="h-2.5 rounded-sm" style={{ background: `${c}${alpha}` }} />;
                  })}
                </div>
              )}

              <div className="relative mt-auto flex items-center justify-between pt-5">
                <div className="flex flex-wrap gap-1.5">
                  {m.features.map((f) => (
                    <span key={f} className="rounded-md px-2 py-0.5 text-[10.5px] text-ink-body" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {f}
                    </span>
                  ))}
                </div>
                <span
                  aria-label={`Open ${m.title}`}
                  className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover:translate-x-0.5"
                  style={{ background: `${m.color}12`, border: `1px solid ${m.color}30`, color: m.color }}
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <LoginModal open={login.open} onClose={() => setLogin((s) => ({ ...s, open: false }))} redirectTo={login.redirect} />
    </section>
  );
}
