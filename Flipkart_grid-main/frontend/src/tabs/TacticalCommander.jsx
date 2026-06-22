import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Send, Bot, CheckCircle2, AlertOctagon, Sparkles } from "lucide-react";
import GlassCard from "../components/ui/GlassCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import Badge from "../components/ui/Badge.jsx";
import { chartAxis, chartGrid, chartTooltip } from "../lib/tokens.js";
import ChartGradients, { barFill } from "../lib/chartTheme.jsx";
import { FEATURE_IMPORTANCE, ANOMALY_LOG, DISPATCH_PLAN } from "../data/mockData.js";

const SUGGESTIONS = [
  "Where should I deploy patrols now?",
  "Summarize today's anomalies",
  "Why is Silk Board flagged?",
];

const CANNED = {
  default:
    "Based on live EPI scores, Silk Board (100) and MG Road (94) are your top-priority corridors. I recommend deploying 2 patrol units to Silk Board Junction immediately — CIS there spiked +340% over the 7-day baseline, driven by HGV double-parking during the evening rush.",
};

export default function TacticalCommander() {
  const [history, setHistory] = useState([
    { role: "ai", text: "Tactical AI Commander online. Ask me anything about live enforcement priorities." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, typing]);

  const send = (text) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setHistory((h) => [...h, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setHistory((h) => [...h, { role: "ai", text: CANNED.default }]);
    }, 1100);
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {/* Chat console */}
      <GlassCard className="flex flex-col p-0 xl:col-span-2" accentBar="from-violet to-cyan" hover={false}>
        <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
          <SectionHeader title="Tactical AI Commander" sub="Gemini-class tactical planning" icon={Bot} className="mb-0" />
          <Badge accent="cyan" pulse>Live</Badge>
        </div>

        <div
          ref={scrollRef}
          className="h-[420px] space-y-4 overflow-y-auto px-5 py-5"
          style={{ background: "#080C14" }}
        >
          {history.map((m, i) => (
            <ChatBubble key={i} role={m.role} text={m.text} />
          ))}
          <AnimatePresence>{typing && <TypingBubble />}</AnimatePresence>
        </div>

        <div className="border-t border-subtle px-5 py-3">
          <div className="mb-2.5 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-chip border border-subtle px-2.5 py-1 text-xs text-ink-body transition-colors hover:border-violet/40 hover:text-violet"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask the commander…"
              className="flex-1 rounded-inner border border-subtle bg-card/60 px-4 py-2.5 font-mono text-sm text-ink-primary outline-none transition-all placeholder:text-ink-faint focus:border-violet focus:ring-2 focus:ring-violet/30"
            />
            <button
              onClick={() => send()}
              className="grid h-10 w-10 place-items-center rounded-inner bg-violet text-white shadow-glow-violet transition-transform hover:-translate-y-0.5"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Right column */}
      <div className="space-y-4">
        {/* Dispatch plan */}
        <GlassCard className="p-5" accentBar="from-emerald to-cyan">
          <SectionHeader title="Tactical dispatch plan" icon={Sparkles} accent="emerald" className="mb-4" />
          <ol className="space-y-2.5">
            {DISPATCH_PLAN.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-2.5 text-sm text-ink-body"
              >
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald" />
                <span>
                  <span className="font-mono text-xs text-emerald">{i + 1}.</span> {step}
                </span>
              </motion.li>
            ))}
          </ol>
        </GlassCard>

        {/* Anomaly log */}
        <GlassCard className="p-5" accentBar="from-rose to-amber">
          <SectionHeader title="Anomaly log" icon={AlertOctagon} accent="rose" className="mb-4" />
          <div className="space-y-2">
            {ANOMALY_LOG.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-inner border border-subtle bg-card/40 px-3 py-2 text-sm">
                <span className="font-mono text-xs text-ink-faint">{a.time}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-ink-primary">{a.zone}</div>
                  <div className="text-xs text-ink-body">{a.msg}</div>
                </div>
                {a.flagged && <Badge accent="rose">flag</Badge>}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Feature importance (full width) */}
      <GlassCard className="p-5 xl:col-span-3" accentBar="from-violet to-cyan">
        <SectionHeader title="ML risk-model feature importance" sub="Gradient-boosted next-hour congestion model" className="mb-4" />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={FEATURE_IMPORTANCE} layout="vertical" margin={{ left: 20 }}>
            {ChartGradients()}
            <CartesianGrid {...chartGrid} horizontal={false} />
            <XAxis type="number" {...chartAxis} domain={[0, 0.3]} />
            <YAxis type="category" dataKey="feature" tick={{ fill: "#AEB9D4", fontSize: 11 }} width={150} tickLine={false} axisLine={{ stroke: "rgba(148,163,220,0.15)" }} />
            <Tooltip {...chartTooltip} formatter={(v) => `${(v * 100).toFixed(1)}%`} />
            <Bar dataKey="importance" radius={[0, 5, 5, 0]} fill={barFill("violet", "h")} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}

function ChatBubble({ role, text }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className="max-w-[80%] rounded-inner px-4 py-2.5 font-mono text-sm leading-relaxed"
        style={
          isUser
            ? { background: "rgba(124,106,247,0.18)", border: "1px solid rgba(124,106,247,0.4)", color: "#E2E8F0" }
            : { background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)", color: "#CFFAFE" }
        }
      >
        {text}
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-start">
      <div className="flex gap-1 rounded-inner px-4 py-3" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)" }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-cyan"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
