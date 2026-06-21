import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingDown, Users, Crosshair } from "lucide-react";
import GlassCard from "../components/ui/GlassCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import CountUp from "../components/ui/CountUp.jsx";
import { chartAxis, chartGrid, chartTooltip } from "../lib/tokens.js";
import { simulateDispatch, EPI_RANKING, KPIS } from "../data/mockData.js";

const RANK_COLOR = ["#FB4D6D", "#F59E0B", "#7C6AF7"];

export default function IntelligentDispatch() {
  const [teams, setTeams] = useState(5);
  const [effectiveness, setEffectiveness] = useState(70);

  const curve = useMemo(() => simulateDispatch(teams, effectiveness), [teams, effectiveness]);
  const finalCis = curve[curve.length - 1].cis;
  const reduction = Math.round(((KPIS.avgCIS - finalCis) / KPIS.avgCIS) * 1000) / 10;
  const coverage = Math.min(98, Math.round(teams * effectiveness * 0.26));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Controls */}
        <GlassCard className="p-5" accentBar="from-emerald to-cyan" hover={false}>
          <SectionHeader title="Simulator controls" sub="What-if patrol deployment" accent="emerald" icon={Crosshair} className="mb-5" />

          <Slider
            label="Patrol teams"
            icon={Users}
            value={teams}
            min={1}
            max={12}
            onChange={setTeams}
            suffix=" teams"
          />
          <Slider
            label="Effectiveness"
            value={effectiveness}
            min={30}
            max={95}
            onChange={setEffectiveness}
            suffix="%"
          />

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Metric label="CIS reduction" value={reduction} suffix="%" accent="#10B981" />
            <Metric label="Zone coverage" value={coverage} suffix="%" accent="#22D3EE" />
          </div>
        </GlassCard>

        {/* CIS reduction chart */}
        <GlassCard className="p-5 lg:col-span-2" accentBar="from-emerald to-cyan">
          <SectionHeader title="Real-time CIS reduction" sub="Projected impact as patrols deploy" accent="emerald" icon={TrendingDown} className="mb-4" />
          <ResponsiveContainer width="100%" height={290}>
            <LineChart data={curve}>
              <defs>
                <linearGradient id="emGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartGrid} vertical={false} />
              <XAxis dataKey="team" {...chartAxis} label={{ value: "patrol teams deployed", fill: "#475569", fontSize: 10, position: "insideBottom", offset: -3 }} />
              <YAxis {...chartAxis} domain={[0, 80]} />
              <Tooltip {...chartTooltip} />
              <Line type="monotone" dataKey="cis" stroke="url(#emGrad)" strokeWidth={3} dot={{ r: 3, fill: "#10B981" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* EPI Leaderboard */}
      <GlassCard className="p-5" accentBar="from-rose to-violet">
        <SectionHeader title="EPI leaderboard" sub="Enforcement Priority Index = 0.4·CIS + 0.3·volume + 0.3·avg severity" accent="rose" className="mb-4" />
        <div className="space-y-2">
          {EPI_RANKING.map((z, i) => {
            const color = i < 3 ? RANK_COLOR[i] : "#475569";
            return (
              <motion.div
                key={z.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 rounded-inner border border-subtle bg-card/40 px-4 py-3 transition-colors hover:border-strong"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: color }}>
                  {i + 1}
                </span>
                <div className="w-40 shrink-0 truncate font-medium text-ink-primary">{z.name}</div>
                <div className="hidden flex-1 sm:block">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${z.epi}%` }}
                      transition={{ delay: i * 0.04 + 0.2, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                    />
                  </div>
                </div>
                <div className="w-14 text-right font-mono text-sm font-semibold" style={{ color }}>{z.epi}</div>
                <div className="hidden w-20 text-right text-xs text-ink-faint md:block">{z.count} viol.</div>
                <div className="hidden w-20 text-right text-xs text-ink-faint md:block">{z.rushPct}% rush</div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function Slider({ label, icon: Icon, value, min, max, onChange, suffix = "" }) {
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

function Metric({ label, value, suffix, accent }) {
  return (
    <div className="rounded-inner border border-subtle bg-card/40 p-3 text-center">
      <div className="font-display text-2xl" style={{ color: accent }}>
        <CountUp to={value} decimals={value % 1 !== 0 ? 1 : 0} suffix={suffix} runOnMount />
      </div>
      <div className="mt-1 text-[0.62rem] uppercase tracking-wider text-ink-faint">{label}</div>
    </div>
  );
}
