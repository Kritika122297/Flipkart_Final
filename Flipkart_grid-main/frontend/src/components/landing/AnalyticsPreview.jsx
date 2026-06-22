import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { HOURLY, VEHICLE_BREAKDOWN } from "../../data/mockData.js";
import { chartTooltip } from "../../lib/tokens.js";
import ChartGradients, { barFill, areaFill } from "../../lib/chartTheme.jsx";

export default function AnalyticsPreview() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8 text-center">
        <p className="label-caps mb-2 text-violet">Smart analytics</p>
        <h2 className="font-display text-3xl text-ink-primary md:text-4xl">
          Patterns the eye can't catch
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MiniChartCard title="24-hour violation flow" accent="#7C6AF7">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={HOURLY} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              {ChartGradients()}
              <XAxis dataKey="hour" hide />
              <Tooltip {...chartTooltip} />
              <Area
                type="monotone"
                dataKey="violations"
                stroke="#7C6AF7"
                strokeWidth={2.5}
                fill={areaFill("violet")}
                activeDot={{ r: 4, fill: "#7C6AF7", stroke: "#0E1525", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </MiniChartCard>

        <MiniChartCard title="Violations by vehicle type" accent="#22D3EE">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={VEHICLE_BREAKDOWN.slice(0, 6)} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              {ChartGradients()}
              <XAxis dataKey="name" hide />
              <Tooltip {...chartTooltip} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]} fill={barFill("cyan")} />
            </BarChart>
          </ResponsiveContainer>
        </MiniChartCard>
      </div>
    </section>
  );
}

function MiniChartCard({ title, accent, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className="glass rounded-card p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
        <h3 className="text-sm font-semibold text-ink-primary">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}
