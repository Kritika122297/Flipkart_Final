import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

/**
 * Smooth count-up that fires when scrolled into view (or immediately if
 * `runOnMount`). Supports decimals, prefix/suffix, thousands separators.
 */
export default function CountUp({
  to,
  from = 0,
  duration = 1.6,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = ",",
  runOnMount = false,
  className = "",
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(from);
  const started = useRef(false);

  useEffect(() => {
    if (!(inView || runOnMount) || started.current) return;
    started.current = true;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / (duration * 1000));
      setVal(from + (to - from) * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, runOnMount, to, from, duration]);

  const formatted = val
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
