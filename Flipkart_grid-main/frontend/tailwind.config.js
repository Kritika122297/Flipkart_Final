/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // ── Surfaces ──────────────────────────────
        base: "#080C14",
        elevated: "#0E1525",
        card: "#131D30",

        // ── Accent system (main / glow / muted) ──
        violet: {
          DEFAULT: "#7C6AF7",
          glow: "rgba(124, 106, 247, 0.35)",
          muted: "rgba(124, 106, 247, 0.12)",
        },
        cyan: {
          DEFAULT: "#22D3EE",
          glow: "rgba(34, 211, 238, 0.30)",
          muted: "rgba(34, 211, 238, 0.10)",
        },
        emerald: {
          DEFAULT: "#10B981",
          glow: "rgba(16, 185, 129, 0.28)",
          muted: "rgba(16, 185, 129, 0.10)",
        },
        amber: {
          DEFAULT: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.30)",
          muted: "rgba(245, 158, 11, 0.10)",
        },
        rose: {
          DEFAULT: "#FB4D6D",
          glow: "rgba(251, 77, 109, 0.32)",
          muted: "rgba(251, 77, 109, 0.10)",
        },

        // ── Text ──────────────────────────────────
        ink: {
          primary: "#E2E8F0",
          body: "#94A3B8",
          faint: "#475569",
        },
      },
      borderColor: {
        subtle: "rgba(148, 163, 220, 0.08)",
        strong: "rgba(148, 163, 220, 0.15)",
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Inter"', "sans-serif"],
        sans: ['"Inter"', "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      borderRadius: {
        chip: "8px",
        inner: "12px",
        card: "20px",
      },
      boxShadow: {
        glass:
          "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
        "glow-violet": "0 0 20px rgba(124,106,247,0.35), 0 0 60px rgba(124,106,247,0.18)",
        "glow-cyan": "0 0 20px rgba(34,211,238,0.30), 0 0 60px rgba(34,211,238,0.15)",
        "glow-emerald": "0 0 20px rgba(16,185,129,0.28), 0 0 60px rgba(16,185,129,0.14)",
        "glow-amber": "0 0 20px rgba(245,158,11,0.30), 0 0 60px rgba(245,158,11,0.15)",
        "glow-rose": "0 0 20px rgba(251,77,109,0.32), 0 0 60px rgba(251,77,109,0.16)",
      },
      backdropBlur: {
        glass: "24px",
      },
      keyframes: {
        "pulse-marker": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.4)", opacity: "0.3" },
        },
        sweep: {
          "0%": { top: "0%", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { top: "100%", opacity: "0" },
        },
        "radar-ping": {
          "0%": { transform: "scale(0.3)", opacity: "0.7" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        "pulse-marker": "pulse-marker 2s ease-in-out infinite",
        "pulse-marker-fast": "pulse-marker 1.2s ease-in-out infinite",
        sweep: "sweep 3s linear infinite",
        "radar-ping": "radar-ping 3s ease-out infinite",
        shimmer: "shimmer 3s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
