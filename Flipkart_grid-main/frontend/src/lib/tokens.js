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
export const chartAxis = {
  stroke: "#22D3EE",
  tick: { fill: "#94A3B8", fontSize: 11, fontFamily: "Inter" },
};
export const chartGrid = { stroke: "rgba(148,163,220,0.08)" };

export const chartTooltip = {
  contentStyle: {
    background: "rgba(14,21,37,0.96)",
    border: "1px solid rgba(148,163,220,0.15)",
    borderRadius: 12,
    backdropFilter: "blur(12px)",
    color: "#E2E8F0",
    fontSize: 12,
  },
  labelStyle: { color: "#94A3B8", fontWeight: 600 },
  cursor: { fill: "rgba(124,106,247,0.08)" },
};
