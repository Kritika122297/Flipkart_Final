// Central design-token map mirroring tailwind.config.js + index.css.
// Used where we need accent values in JS (charts, maps, inline styles).

export const ACCENTS = {
  violet: { main: "#7C6AF7", glow: "rgba(124,106,247,0.35)", muted: "rgba(124,106,247,0.12)" },
  cyan: { main: "#22D3EE", glow: "rgba(34,211,238,0.30)", muted: "rgba(34,211,238,0.10)" },
  emerald: { main: "#10B981", glow: "rgba(16,185,129,0.28)", muted: "rgba(16,185,129,0.10)" },
  amber: { main: "#F59E0B", glow: "rgba(245,158,11,0.30)", muted: "rgba(245,158,11,0.10)" },
  rose: { main: "#FB4D6D", glow: "rgba(251,77,109,0.32)", muted: "rgba(251,77,109,0.10)" },
};

export const SURFACES = {
  base: "#080C14",
  elevated: "#0E1525",
  card: "#131D30",
  borderSubtle: "rgba(148,163,220,0.08)",
  borderStrong: "rgba(148,163,220,0.15)",
};

export const TEXT = {
  primary: "#E2E8F0",
  body: "#94A3B8",
  faint: "#475569",
};

// Heatmap gradient stops (matches backend spec).
export const HEAT_GRADIENT = {
  0.0: "#22D3EE",
  0.4: "#7C6AF7",
  0.7: "#F59E0B",
  1.0: "#FB4D6D",
};

// Route colours for the OR-Tools fleet (Truck 1..4).
export const ROUTE_COLORS = ["#7C6AF7", "#22D3EE", "#10B981", "#F59E0B"];

// Shared Recharts axis / grid styling.
// High-contrast labels, muted axis line, no tick ticks for a cleaner read.
export const chartAxis = {
  stroke: "rgba(34,211,238,0.35)",
  tick: { fill: "#AEB9D4", fontSize: 11, fontFamily: "Inter", fontWeight: 500 },
  tickLine: false,
  axisLine: { stroke: "rgba(148,163,220,0.15)" },
};

// Gridlines recede visually (opacity 0.06–0.08) so data pops.
export const chartGrid = { stroke: "rgba(148,163,220,0.07)", strokeDasharray: "3 3" };

// Glass-panel tooltip matching .glass.
export const chartTooltip = {
  contentStyle: {
    background: "rgba(14,21,37,0.85)",
    border: "1px solid rgba(148,163,220,0.18)",
    borderRadius: 14,
    backdropFilter: "blur(14px) saturate(160%)",
    WebkitBackdropFilter: "blur(14px) saturate(160%)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
    color: "#E2E8F0",
    fontSize: 12,
    padding: "10px 12px",
  },
  labelStyle: { color: "#94A3B8", fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: "#E2E8F0", padding: 0 },
  cursor: { fill: "rgba(124,106,247,0.08)" },
};
