import { motion } from "framer-motion";
import { Camera, Route, BrainCircuit, TrendingUp, ScanEye, Truck } from "lucide-react";
import { accentClass } from "../../lib/accents.js";

const FEATURES = [
  {
    icon: Camera,
    accent: "cyan",
    title: "YOLO CCTV Detection",
    desc: "YOLOv8-Nano edge inference on existing BTP cameras auto-flags illegally parked vehicles — no manual challans.",
    span: "md:col-span-2 md:row-span-2",
    big: true,
    stat: "12,400+ / day",
  },
  {
    icon: Route,
    accent: "emerald",
    title: "OR-Tools VRP Routing",
    desc: "Capacitated vehicle-routing solves optimal tow/patrol paths across the city in seconds.",
    span: "",
    stat: "−31% drive time",
  },
  {
    icon: BrainCircuit,
    accent: "violet",
    title: "Gemini Tactical Planning",
    desc: "LLM commander turns live signals into numbered dispatch playbooks for ground teams.",
    span: "",
    stat: "5-step playbooks",
  },
  {
    icon: TrendingUp,
    accent: "amber",
    title: "ML Forecasting",
    desc: "Gradient-boosted models predict next-hour congestion risk per junction with feature attribution.",
    span: "md:col-span-2",
    stat: "0.91 AUC",
  },
];

const SECONDARY = [
  { icon: ScanEye, accent: "rose", label: "Anomaly detection" },
  { icon: Truck, accent: "violet", label: "Fleet manifests" },
];

export default function FeaturesBento() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-20">
      <Header />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:auto-rows-[200px]">
        {FEATURES.map((f, i) => (
          <BentoCard key={f.title} {...f} index={i} />
        ))}
        {SECONDARY.map((s, i) => (
          <MiniCard key={s.label} {...s} index={i + FEATURES.length} />
        ))}
      </div>
    </section>
  );
}

function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-10 text-center"
    >
      <p className="label-caps mb-2 text-violet">Capabilities</p>
      <h2 className="font-display text-3xl text-ink-primary md:text-4xl">
        One stack, four intelligence engines
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-ink-body">
        Every module mirrors a production pipeline in the SmartPark backend — fused into a single
        operations surface.
      </p>
    </motion.div>
  );
}

function BentoCard({ icon: Icon, accent, title, desc, span, big, stat, index }) {
  const a = accentClass[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.55 }}
      whileHover={{ y: -4 }}
      className={`group glass relative overflow-hidden rounded-card p-6 transition-shadow duration-300 hover:border-strong hover:${a.glow} ${span}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-60"
        style={{ backgroundImage: `linear-gradient(135deg, ${a.hex}1f, transparent 60%)` }}
      />
      <div className="relative flex h-full flex-col">
        <span
          className="mb-4 inline-flex w-fit rounded-inner p-2.5"
          style={{ background: `${a.hex}1a`, color: a.hex }}
        >
          <Icon size={big ? 26 : 20} />
        </span>
        <h3 className={`font-display text-ink-primary ${big ? "text-2xl" : "text-lg"}`}>{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-body">{desc}</p>
        <div className="mt-auto pt-4">
          <span
            className="font-mono text-sm font-semibold"
            style={{ color: a.hex }}
          >
            {stat}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function MiniCard({ icon: Icon, accent, label, index }) {
  const a = accentClass[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.55 }}
      whileHover={{ y: -4 }}
      className={`glass flex items-center gap-3 rounded-card p-5 transition-shadow hover:border-strong hover:${a.glow}`}
    >
      <span className="inline-flex rounded-inner p-2.5" style={{ background: `${a.hex}1a`, color: a.hex }}>
        <Icon size={20} />
      </span>
      <span className="font-display text-ink-primary">{label}</span>
    </motion.div>
  );
}
