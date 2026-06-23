import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
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
import { useEffect, useState } from "react";
import { IndianRupee, Ambulance, HeartPulse, Clock, Route as RouteIcon, AlertTriangle } from "lucide-react";
import GlassCard from "../components/ui/GlassCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import LossClock from "../components/ui/LossClock.jsx";
import { Loading, ErrorState } from "../components/ui/AsyncState.jsx";
import { chartAxis, chartGrid, chartTooltip } from "../lib/tokens.js";
import ChartGradients, { barFill, areaFill } from "../lib/chartTheme.jsx";
import { useFetch, endpoints } from "../lib/api.js";

export default function CongestionAnalytics() {
  const { data, loading, error, refetch } = useFetch(endpoints.analyticsCharts, []);
  // 7-day continuous CIS forecast (Prophet/XGBoost/seasonal).
  const fc = useFetch(() => endpoints.forecastPredict(7), []);
  // 30-day economic-loss forecast (Model 4).
  const econ = useFetch(() => endpoints.economicForecast(30), []);

  if (loading) return <Loading label="Loading analytics…" height={420} />;
  if (error) return <ErrorState error={error} onRetry={refetch} height={420} />;

  const HOURLY = data.hourly;
  const VIOLATION_BREAKDOWN = data.violationBreakdown;
  const RADAR_PROFILE = data.radar;
  const EMERGENCY_VULN = data.emergency;
  const ECONOMIC_BY_ZONE = data.economicByZone;
  const loss = data.economicLoss;

  return (
    <div className="space-y-6">
      {/* Economic loss banner */}
      <GlassCard className="flex flex-wrap items-center justify-between gap-4 p-6" accentBar="from-amber to-rose">
        <div>
          <p className="label-caps mb-1">Estimated economic loss · today</p>
          <div className="flex items-center gap-2 font-mono text-4xl font-extrabold text-amber">
            <IndianRupee size={30} />
            <LossClock prefix="" base={loss.base} perSec={loss.perSec} />
          </div>
          <p className="mt-1.5 text-xs text-ink-faint">
            Model: violations × 0.5 person-hr delay × ₹320 value-of-time
          </p>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl text-rose">₹{loss.annualCr} Cr</div>
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

      {/* 7-day continuous CIS forecast */}
      <GlassCard className="p-5" accentBar="from-cyan to-violet">
        <div className="mb-4 flex items-center justify-between">
          <SectionHeader
            title="7-day congestion forecast"
            sub="Hourly average CIS with seasonality"
            accent="cyan"
            className="mb-0"
          />
          {fc.data?.engine && (
            <span className="rounded-chip border border-subtle px-2.5 py-1 font-mono text-[0.68rem] text-cyan">
              {fc.data.engine} model
            </span>
          )}
        </div>
        {fc.loading ? (
          <Loading label="Forecasting…" height={240} />
        ) : fc.error ? (
          <ErrorState error={fc.error} onRetry={fc.refetch} height={240} />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={fc.data.points}>
              {ChartGradients()}
              <CartesianGrid {...chartGrid} vertical={false} />
              <XAxis dataKey="day" {...chartAxis} interval={23} />
              <YAxis {...chartAxis} />
              <Tooltip {...chartTooltip} labelFormatter={(_, p) => p?.[0]?.payload?.ts?.replace("T", " ") ?? ""} />
              <Area type="monotone" dataKey="upper" stroke="none" fill={areaFill("cyan")} />
              <Area type="monotone" dataKey="yhat" stroke="#22D3EE" strokeWidth={2.5} fill="none" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </GlassCard>

      {/* 30-day economic loss forecast (Model 4) */}
      <GlassCard className="p-5" accentBar="from-amber to-rose">
        <div className="mb-4 flex items-center justify-between">
          <SectionHeader title="30-day economic loss forecast" sub="Projected ₹ toll from parking-induced delay" accent="amber" className="mb-0" />
          {econ.data?.engine && (
            <span className="rounded-chip border border-subtle px-2.5 py-1 font-mono text-[0.68rem] text-amber">{econ.data.engine} model</span>
          )}
        </div>
        {econ.loading ? (
          <Loading label="Forecasting economic loss…" height={260} />
        ) : econ.error ? (
          <ErrorState error={econ.error} onRetry={econ.refetch} height={260} />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={[
                ...econ.data.history.map((h) => ({ date: h.date, hist: +(h.loss / 1e5).toFixed(2) })),
                ...econ.data.points.map((p) => ({ date: p.date, fc: +(p.loss / 1e5).toFixed(2) })),
              ]}
            >
              <defs>
                <linearGradient id="econLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#FB4D6D" />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartGrid} vertical={false} />
              <XAxis dataKey="date" {...chartAxis} interval={9} tickFormatter={(d) => d?.slice(5)} />
              <YAxis {...chartAxis} tickFormatter={(v) => `₹${v}L`} />
              <Tooltip {...chartTooltip} formatter={(v, n) => [`₹${v} Lakh`, n === "hist" ? "Historical" : "Forecast"]} />
              <Line type="monotone" dataKey="hist" name="hist" stroke="#94A3B8" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="fc" name="fc" stroke="url(#econLine)" strokeWidth={2.75} strokeDasharray="5 4" dot={false} connectNulls isAnimationActive animationDuration={900} />
            </LineChart>
          </ResponsiveContainer>
        )}
        {econ.data?.points?.length > 0 && (
          <p className="mt-2 text-center text-xs text-ink-faint">
            Projected 30-day toll: <span className="font-semibold text-rose">₹{(econ.data.points.reduce((s, p) => s + p.loss, 0) / 1e7).toFixed(2)} Cr</span>
          </p>
        )}
      </GlassCard>

      {/* Interactive emergency response calculator */}
      <EmergencyCalculator />
    </div>
  );
}

function EmergencyCalculator() {
  const opts = useFetch(endpoints.emergencyOptions, []);
  const [station, setStation] = useState("");
  const [hospital, setHospital] = useState("");

  // Default the selectors once options load.
  useEffect(() => {
    if (opts.data) {
      setStation((s) => s || opts.data.stations[0]?.name || "");
      setHospital((h) => h || opts.data.hospitals[0]?.name || "");
    }
  }, [opts.data]);

  const resp = useFetch(
    () => (station && hospital ? endpoints.emergencyResponse(station, hospital) : Promise.resolve(null)),
    [station, hospital]
  );
  const r = resp.data;
  const LEVEL = {
    ok: "#10B981",
    warn: "#F59E0B",
    high: "#FB4D6D",
    critical: "#A78BFA",
  };

  return (
    <GlassCard className="p-5" accentBar="from-rose to-amber">
      <SectionHeader title="Emergency response calculator" sub="Ambulance travel time = base (40 km/h) + parking delay" icon={Ambulance} accent="rose" className="mb-4" />

      {opts.loading ? (
        <Loading label="Loading stations…" height={120} />
      ) : opts.error ? (
        <ErrorState error={opts.error} onRetry={opts.refetch} height={120} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* selectors */}
          <div className="space-y-3">
            <Selector label="Incident zone (station)" value={station} onChange={setStation} options={opts.data.stations.map((s) => s.name)} />
            <Selector label="Nearest hospital" value={hospital} onChange={setHospital} options={opts.data.hospitals.map((h) => h.name)} />
            <p className="text-xs text-ink-faint">
              Road distance uses a 1.4× network factor; parking delay scales with the station's live CIS.
            </p>
          </div>

          {/* results */}
          <div>
            {resp.loading ? (
              <Loading label="Calculating…" height={160} />
            ) : !r ? (
              <p className="py-10 text-center text-sm text-ink-faint">Select a station and hospital.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <Stat icon={RouteIcon} label="Road distance" value={`${r.road_km} km`} color="#7C6AF7" />
                  <Stat icon={Clock} label="Base travel" value={`${r.base_min} min`} color="#22D3EE" />
                  <Stat icon={Ambulance} label="Parking delay" value={`+${r.parking_delay_min} min`} color={r.parking_delay_min > 3 ? "#FB4D6D" : "#F59E0B"} />
                  <Stat icon={HeartPulse} label="Total response" value={`${r.total_min} min`} color={LEVEL[r.level]} />
                </div>
                <div
                  className="mt-3 rounded-inner px-3 py-2 text-sm font-semibold"
                  style={{ background: `${LEVEL[r.level]}1a`, border: `1px solid ${LEVEL[r.level]}55`, color: LEVEL[r.level] }}
                >
                  {r.badge}
                </div>
                <div className="mt-2 text-xs text-ink-faint">
                  Parking causes <span className="text-ink-primary">{r.delay_pct_of_total}%</span> of total delay.
                </div>
                {r.parking_delay_min > 2 && (
                  <div className="mt-2 flex items-start gap-2 rounded-inner px-3 py-2 text-xs" style={{ background: "rgba(251,77,109,0.1)", border: "1px solid rgba(251,77,109,0.35)", color: "#FCA5B4" }}>
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-rose" />
                    <span>
                      In a cardiac emergency, this {r.parking_delay_min}-min parking delay reduces survival
                      probability by <span className="font-semibold text-rose">~{r.survival_drop_pct}%</span>.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function Selector({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="label-caps mb-1.5 block">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-inner border border-subtle bg-card/60 px-3 py-2.5 text-sm text-ink-primary outline-none transition-colors focus:border-rose focus:ring-2 focus:ring-rose/30"
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ background: "#0E1525", color: "#E2E8F0" }}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-inner border border-subtle bg-card/40 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[0.62rem] uppercase tracking-wider text-ink-faint">
        <Icon size={12} style={{ color }} /> {label}
      </div>
      <div className="font-display text-lg" style={{ color }}>{value}</div>
    </div>
  );
}
