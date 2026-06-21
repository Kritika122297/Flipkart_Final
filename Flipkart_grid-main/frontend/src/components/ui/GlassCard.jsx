import { motion } from "framer-motion";
import { cx } from "../../lib/accents.js";

/**
 * Glassmorphism card with optional hover-lift + accent glow on hover.
 */
export default function GlassCard({
  children,
  className = "",
  hover = true,
  glow = "", // tailwind shadow-glow-* class
  accentBar = "", // gradient class for top bar, e.g. "from-violet to-cyan"
  ...rest
}) {
  return (
    <motion.div
      whileHover={
        hover
          ? { y: -3, transition: { type: "spring", stiffness: 300, damping: 22 } }
          : undefined
      }
      className={cx(
        "glass rounded-card relative overflow-hidden transition-shadow duration-300",
        hover && "hover:border-strong",
        hover && glow && `hover:${glow}`,
        className
      )}
      {...rest}
    >
      {accentBar && (
        <span
          className={cx(
            "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-80",
            accentBar
          )}
        />
      )}
      {children}
    </motion.div>
  );
}
