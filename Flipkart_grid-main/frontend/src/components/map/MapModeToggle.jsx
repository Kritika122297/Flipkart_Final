import { motion } from "framer-motion";
import { cx } from "../../lib/accents.js";

export const MAP_MODES = ["Dark", "Light", "Street"];

/**
 * Reusable pill-style segmented control for switching map tile styles.
 * Glass-panel styling; active option glows violet.
 *
 *   <MapModeToggle mode={mode} onChange={setMode} />
 */
export default function MapModeToggle({ mode = "Dark", onChange, className = "" }) {
  return (
    <div
      className={cx(
        "pointer-events-auto inline-flex items-center gap-0.5 rounded-full p-1",
        className
      )}
      style={{
        background: "rgba(14,21,37,0.72)",
        border: "1px solid rgba(148,163,220,0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {MAP_MODES.map((m) => {
        const on = m === mode;
        return (
          <button
            key={m}
            onClick={() => onChange?.(m)}
            className={cx(
              "relative rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              on ? "text-white" : "text-ink-faint hover:text-ink-body"
            )}
          >
            {on && (
              <motion.span
                layoutId="mapmode-pill"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: "rgba(124,106,247,0.9)",
                  boxShadow: "0 0 16px rgba(124,106,247,0.5)",
                }}
              />
            )}
            <span className="relative z-10">{m}</span>
          </button>
        );
      })}
    </div>
  );
}
