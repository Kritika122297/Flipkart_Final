// Maps an accent key to the exact Tailwind class strings we use throughout.
// Keeping these in one place avoids dynamic class names that Tailwind would
// purge (Tailwind can only see complete strings at build time).
export const accentClass = {
  violet: {
    text: "text-violet",
    border: "border-violet/40",
    bg: "bg-violet",
    glow: "shadow-glow-violet",
    ring: "ring-violet/30",
    gradFrom: "from-violet/20",
    dot: "bg-violet",
    hex: "#7C6AF7",
  },
  cyan: {
    text: "text-cyan",
    border: "border-cyan/40",
    bg: "bg-cyan",
    glow: "shadow-glow-cyan",
    ring: "ring-cyan/30",
    gradFrom: "from-cyan/20",
    dot: "bg-cyan",
    hex: "#22D3EE",
  },
  emerald: {
    text: "text-emerald",
    border: "border-emerald/40",
    bg: "bg-emerald",
    glow: "shadow-glow-emerald",
    ring: "ring-emerald/30",
    gradFrom: "from-emerald/20",
    dot: "bg-emerald",
    hex: "#10B981",
  },
  amber: {
    text: "text-amber",
    border: "border-amber/40",
    bg: "bg-amber",
    glow: "shadow-glow-amber",
    ring: "ring-amber/30",
    gradFrom: "from-amber/20",
    dot: "bg-amber",
    hex: "#F59E0B",
  },
  rose: {
    text: "text-rose",
    border: "border-rose/40",
    bg: "bg-rose",
    glow: "shadow-glow-rose",
    ring: "ring-rose/30",
    gradFrom: "from-rose/20",
    dot: "bg-rose",
    hex: "#FB4D6D",
  },
};

export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}
