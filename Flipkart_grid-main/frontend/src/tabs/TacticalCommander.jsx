import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Send, Bot, CheckCircle2, AlertOctagon, Sparkles, Activity } from "lucide-react";
import GlassCard from "../components/ui/GlassCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import Badge from "../components/ui/Badge.jsx";
import { Loading, ErrorState } from "../components/ui/AsyncState.jsx";
import { chartAxis, chartGrid, chartTooltip } from "../lib/tokens.js";
import ChartGradients, { barFill } from "../lib/chartTheme.jsx";
import { useFetch, endpoints } from "../lib/api.js";

const SUGGESTIONS = [
  "Where should I deploy patrols now?",
  "Summarize today's anomalies",
  "Why is Silk Board flagged?",
];

export default function TacticalCommander() {
  const [history, setHistory] = useState([
    { role: "ai", text: "Tactical AI Commander online. Ask me anything about live enforcement priorities." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  // Stable per-session id so the agent can retrieve adaptive memory.
  const sessionId = useRef(
    (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}`)
  ).current;

  // RF feature importance, anomaly log, dispatch plan.
  const { data, loading, error, refetch } = useFetch(endpoints.commanderInsights, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, typing]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || typing) return;
    const prior = history;
    setHistory((h) => [...h, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    try {
      const res = await endpoints.commanderChat(q, prior, sessionId);
      setHistory((h) => [
        ...h,
        {
          role: "ai",
          text: res.reply,
          meta: {
            confidence: res.confidence_score,
            sources: res.sources,
            tools: res.tools_called,
          },
        },
      ]);
    } catch (e) {
      setHistory((h) => [...h, { role: "ai", text: `⚠️ ${e.message}` }]);
    } finally {
      setTyping(false);
    }
  };

  if (loading) return <Loading label="Loading tactical AI insights…" height={420} />;
  if (error) return <ErrorState error={error} onRetry={refetch} height={420} />;

  const FEATURE_IMPORTANCE = data.featureImportance;
  const ANOMALY_LOG = data.anomalyLog;
  const DISPATCH = data.dispatch ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {/* Chat console */}
      <GlassCard className="flex flex-col p-0 xl:col-span-2" accentBar="from-violet to-cyan" hover={false}>
        <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
          <SectionHeader title="Tactical AI Commander" sub="Groq Llama-3.3-70B · tactical planning" icon={Bot} className="mb-0" />
          <Badge accent="cyan" pulse>Live</Badge>
        </div>

        <div ref={scrollRef} className="h-[420px] space-y-4 overflow-y-auto px-5 py-5" style={{ background: "#080C14" }}>
          {history.map((m, i) => (
            <ChatBubble key={i} role={m.role} text={m.text} meta={m.meta} />
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
        <GlassCard className="p-5" accentBar="from-emerald to-cyan">
          <SectionHeader title="Tactical dispatch plan" sub="ML-predicted ETA + expected violation" icon={Sparkles} accent="emerald" className="mb-4" />
          <ol className="space-y-2.5">
            {DISPATCH.map((d, i) => (
              <DispatchItem key={d.step} item={d} index={i} />
            ))}
          </ol>
        </GlassCard>

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

      {/* Drivers + hourly prediction, side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:col-span-3">
        {/* Feature importance (drivers) */}
        <GlassCard className="p-5" accentBar="from-violet to-cyan">
          <SectionHeader title="ML risk-model feature importance" sub="Random-forest next-hour congestion model" className="mb-4" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={FEATURE_IMPORTANCE} layout="vertical" margin={{ left: 20 }}>
              {ChartGradients()}
              <CartesianGrid {...chartGrid} horizontal={false} />
              <XAxis type="number" {...chartAxis} domain={[0, "dataMax"]} />
              <YAxis type="category" dataKey="feature" tick={{ fill: "#AEB9D4", fontSize: 11 }} width={150} tickLine={false} axisLine={{ stroke: "rgba(148,163,220,0.15)" }} />
              <Tooltip {...chartTooltip} formatter={(v) => `${(v * 100).toFixed(1)}%`} />
              <Bar dataKey="importance" radius={[0, 5, 5, 0]} fill={barFill("violet", "h")} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* 24-hour congestion risk predictor (prediction output) */}
        <RiskPredictor />
      </div>
    </div>
  );
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LEVEL_COLOR = { Low: "#10B981", Medium: "#F59E0B", High: "#FB4D6D", Critical: "#A78BFA" };

function RiskPredictor() {
  const [day, setDay] = useState("Monday");
  const { data, loading, error, refetch } = useFetch(() => endpoints.forecastDay(day), [day]);
  const points = data?.points ?? [];

  return (
    <GlassCard className="p-5" accentBar="from-amber to-rose">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionHeader title="24-hour congestion risk predictor" sub="ML hourly risk score" icon={Activity} accent="amber" className="mb-0" />
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="rounded-inner border border-subtle bg-card/60 px-3 py-1.5 text-xs text-ink-primary outline-none transition-colors focus:border-amber focus:ring-2 focus:ring-amber/30"
        >
          {DAYS.map((d) => (
            <option key={d} value={d} style={{ background: "#0E1525", color: "#E2E8F0" }}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loading label="Predicting…" height={240} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} height={240} />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={points} margin={{ top: 6, right: 6, left: -8, bottom: 0 }}>
              <CartesianGrid {...chartGrid} vertical={false} />
              <XAxis dataKey="hour" {...chartAxis} interval={2} />
              <YAxis {...chartAxis} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip {...chartTooltip} formatter={(v, _n, p) => [`${v}% · ${p?.payload?.risk_level}`, "Risk"]} />
              <ReferenceLine
                y={50}
                stroke="#FB4D6D"
                strokeDasharray="4 4"
                label={{ value: "High Risk Threshold", position: "insideTopRight", fill: "#FB4D6D", fontSize: 10 }}
              />
              <Bar dataKey="risk_score" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700}>
                {points.map((p, i) => (
                  <Cell key={i} fill={LEVEL_COLOR[p.risk_level] || "#7C6AF7"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* legend */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[0.68rem] text-ink-body">
            {Object.entries(LEVEL_COLOR).map(([lvl, c]) => (
              <span key={lvl} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />
                {lvl}
              </span>
            ))}
          </div>
        </>
      )}
    </GlassCard>
  );
}

// One dispatch destination — fetches Model 1 (ETA regressor) + Model 2
// (violation propensity) for its station/coords and shows them as badges.
function DispatchItem({ item, index }) {
  const eta = useFetch(() => endpoints.predictEta(item.lat, item.lon), [item.lat, item.lon]);
  const prop = useFetch(() => endpoints.predictPropensity(item.station, new Date().getHours()), [item.station]);
  return (
    <motion.li
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-inner border border-subtle bg-card/40 px-3 py-2.5 text-sm"
    >
      <div className="flex items-start gap-2.5">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald" />
        <div className="min-w-0 flex-1">
          <div className="text-ink-body">
            <span className="font-mono text-xs text-emerald">{item.step}.</span> {item.action}
            {eta.data && <span className="text-ink-primary"> · ETA: <span className="font-semibold text-amber">{eta.data.eta_min} mins</span></span>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-chip px-2 py-0.5 text-[0.62rem] font-semibold" style={{ background: "rgba(124,106,247,0.14)", color: "#7C6AF7", border: "1px solid rgba(124,106,247,0.3)" }}>
              EPI {item.epi}
            </span>
            {prop.loading ? (
              <span className="text-[0.62rem] text-ink-faint">predicting…</span>
            ) : prop.data?.available ? (
              <span className="rounded-chip px-2 py-0.5 text-[0.62rem] font-semibold" style={{ background: "rgba(251,77,109,0.12)", color: "#FB4D6D", border: "1px solid rgba(251,77,109,0.3)" }}>
                Expected: {prop.data.violation_type} ({prop.data.confidence}%)
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.li>
  );
}

function ChatBubble({ role, text, meta }) {
  const isUser = role === "user";
  const conf = meta?.confidence;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[82%]">
        <div
          className={
            "rounded-inner px-4 py-2.5 leading-relaxed " +
            (isUser ? "whitespace-pre-wrap font-mono text-sm" : "")
          }
          style={
            isUser
              ? { background: "rgba(124,106,247,0.18)", border: "1px solid rgba(124,106,247,0.4)", color: "#E2E8F0" }
              : { background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)", color: "#CFFAFE" }
          }
        >
          {isUser ? (
            text
          ) : (
            <div className="md-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            </div>
          )}
        </div>
        {/* explainable-agent footer: confidence + tools + cited guidelines */}
        {!isUser && meta && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {conf != null && (
              <span className="rounded-chip px-2 py-0.5 text-[0.62rem] font-semibold" style={{ background: "rgba(16,185,129,0.14)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
                confidence {conf}%
              </span>
            )}
            {(meta.tools || []).map((t) => (
              <span key={t} className="rounded-chip px-2 py-0.5 text-[0.6rem] text-ink-faint" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(148,163,220,0.1)" }}>
                {t}
              </span>
            ))}
            {(meta.sources || []).slice(0, 1).map((s) => (
              <span key={s} className="rounded-chip px-2 py-0.5 text-[0.6rem] text-violet" style={{ background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.25)" }}>
                src: {s.split(":")[0]}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-start">
      <div className="flex gap-1 rounded-inner px-4 py-3" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)" }}>
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-2 w-2 rounded-full bg-cyan" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
        ))}
      </div>
    </motion.div>
  );
}
