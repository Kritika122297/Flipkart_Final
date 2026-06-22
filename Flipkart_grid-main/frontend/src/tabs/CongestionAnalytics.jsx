import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { IndianRupee } from "lucide-react";
import GlassCard from "../components/ui/GlassCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import LossClock from "../components/ui/LossClock.jsx";
import { chartAxis, chartGrid, chartTooltip } from "../lib/tokens.js";
import ChartGradients, { barFill, areaFill } from "../lib/chartTheme.jsx";
import {
  HOURLY,
  VIOLATION_BREAKDOWN,
  RADAR_PROFILE,
  EMERGENCY_VULN,
  ECONOMIC_BY_ZONE,
} from "../data/mockData.js";

export default function CongestionAnalytics() {
  return (
    <div className="space-y-6">
      {/* Economic loss banner */}
      <GlassCard className="flex flex-wrap items-center justify-between gap-4 p-6" accentBar="from-amber to-rose">
        <div>
          <p className="label-caps mb-1">Estimated economic loss · today</p>
          <div className="flex items-center gap-2 font-mono text-4xl font-extrabold text-amber">
            <IndianRupee size={30} />
            <LossClock prefix="" />
          </div>
          <p className="mt-1.5 text-xs text-ink-faint">
            Model: violations × 0.5 person-hr delay × ₹320 value-of-time
          </p>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl text-rose">₹220 Cr</div>
          <div className="text-xs text-ink-faint">projected annual loss</div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Hourly bar chart */}
        <GlassCard className="p-5" accentBar="from-violet to-cyan">
          <SectionHeader title="Violations by hour" sub="Rush-hour peaks · 24h window" className="mb-4" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={HOURLY}>
              {ChartGradients()}
              <CartesianGrid {...chartGrid} vertical={false} />
              <XAxis dataKey="hour" {...chartAxis} interval={2} />
              <YAxis {...chartAxis} />
              <Tooltip {...chartTooltip} />
              <Bar dataKey="violations" radius={[5, 5, 0, 0]}>
                {HOURLY.map((h, i) => (
                  <Cell key={i} fill={h.violations > 55 ? barFill("rose") : h.violations > 35 ? barFill("amber") : barFill("violet")} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Area chart */}
        <GlassCard className="p-5" accentBar="from-violet to-cyan">
          <SectionHeader title="CIS trend" sub="Violet-to-transparent gradient" accent="cyan" className="mb-4" />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={HOURLY}>
              {ChartGradients()}
              <CartesianGrid {...chartGrid} vertical={false} />
              <XAxis dataKey="hour" {...chartAxis} interval={2} />
              <YAxis {...chartAxis} />
              <Tooltip {...chartTooltip} />
              <Area type="monotone" dataKey="cis" stroke="#7C6AF7" strokeWidth={2.75} fill={areaFill("violet")} activeDot={{ r: 5, fill: "#7C6AF7", stroke: "#0E1525", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Radar */}
        <GlassCard className="p-5" accentBar="from-cyan to-violet">
          <SectionHeader title="Zone risk profile" sub="Critical zone vs city average" accent="cyan" className="mb-4" />
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={RADAR_PROFILE} outerRadius={100}>
              <PolarGrid stroke="rgba(148,163,220,0.12)" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "#94A3B8", fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: "#475569", fontSize: 9 }} stroke="rgba(148,163,220,0.1)" />
              <Tooltip {...chartTooltip} />
              <Radar name="Critical zone" dataKey="A" stroke="#22D3EE" fill="#7C6AF7" fillOpacity={0.3} strokeWidth={2} />
              <Radar name="City avg" dataKey="B" stroke="#475569" fill="#475569" fillOpacity={0.12} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Emergency vulnerability */}
        <GlassCard className="p-5" accentBar="from-rose to-amber">
          <SectionHeader title="Emergency-route vulnerability" sub="Added delay to hospital corridors (min)" accent="rose" className="mb-4" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={EMERGENCY_VULN} layout="vertical" margin={{ left: 10 }}>
              {ChartGradients()}
              <CartesianGrid {...chartGrid} horizontal={false} />
              <XAxis type="number" {...chartAxis} />
              <YAxis type="category" dataKey="route" tick={{ fill: "#AEB9D4", fontSize: 10 }} width={150} tickLine={false} axisLine={{ stroke: "rgba(148,163,220,0.15)" }} />
              <Tooltip {...chartTooltip} />
              <Bar dataKey="delay" radius={[0, 5, 5, 0]} fill={barFill("rose", "h")} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Violation types + economic by zone */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard className="p-5" accentBar="from-violet to-cyan">
          <SectionHeader title="Violations by type" sub="Severity-ranked categories" className="mb-4" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={VIOLATION_BREAKDOWN} layout="vertical" margin={{ left: 10 }}>
              {ChartGradients()}
              <CartesianGrid {...chartGrid} horizontal={false} />
              <XAxis type="number" {...chartAxis} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#AEB9D4", fontSize: 9.5 }} width={180} tickLine={false} axisLine={{ stroke: "rgba(148,163,220,0.15)" }} />
              <Tooltip {...chartTooltip} />
              <Bar dataKey="value" radius={[0, 5, 5, 0]} fill={barFill("violet", "h")} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5" accentBar="from-amber to-rose">
          <SectionHeader title="Economic cost by zone" sub="₹ daily congestion cost" accent="amber" className="mb-4" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ECONOMIC_BY_ZONE.slice(0, 8)}>
              {ChartGradients()}
              <CartesianGrid {...chartGrid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#AEB9D4", fontSize: 9 }} angle={-25} textAnchor="end" height={60} tickLine={false} axisLine={{ stroke: "rgba(148,163,220,0.15)" }} />
              <YAxis {...chartAxis} />
              <Tooltip {...chartTooltip} formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
              <Bar dataKey="cost" radius={[5, 5, 0, 0]} fill={barFill("amber")} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}
