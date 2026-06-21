import { motion } from "framer-motion";
import { accentClass, cx } from "../../lib/accents.js";
import CountUp from "./CountUp.jsx";

/**
 * KPI metric card — accent-coloured value, label caps, optional sub line and
 * count-up. Hover lifts and reveals the accent glow.
 */
export default function KpiCard({
  label,
  value,
  accent = "violet",
  icon: Icon,
  sub,
  decimals = 0,
  prefix = "",
  suffix = "",
  countUp = true,
  delay = 0,
}) {
  const a = accentClass[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className={cx(
        "glass rounded-card relative overflow-hidden p-5 transition-shadow duration-300 hover:border-strong",
        `hover:${a.glow}`
      )}
    >
      <span
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl"
        style={{ background: a.hex, opacity: 0.12 }}
      />
      <div className="flex items-start justify-between">
        <p className="label-caps">{label}</p>
        {Icon && (
          <span className={cx("rounded-chip p-1.5", `${a.text}`)} style={{ background: `${a.hex}1a` }}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <div className={cx("mt-3 font-display text-3xl leading-none", a.text)}>
        {countUp && typeof value === "number" ? (
          <CountUp to={value} decimals={decimals} prefix={prefix} suffix={suffix} runOnMount />
        ) : (
          <>
            {prefix}
            {value}
            {suffix}
          </>
        )}
      </div>
      {sub && <p className="mt-2 text-xs text-ink-faint">{sub}</p>}
    </motion.div>
  );
}
