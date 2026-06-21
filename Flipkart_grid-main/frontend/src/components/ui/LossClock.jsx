import { useEffect, useState } from "react";
import { KPIS } from "../../data/mockData.js";

/**
 * Economic-loss clock that ticks up in real time (amber mono).
 * Starts from a baseline and increments by `perSec` ₹/second.
 */
export default function LossClock({
  base = KPIS.economicLossBase,
  perSec = KPIS.economicLossPerSec * 1000,
  className = "",
  prefix = "₹",
}) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      setVal(base + ((now - t0) / 1000) * perSec);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [base, perSec]);

  return (
    <span className={className}>
      {prefix}
      {Math.floor(val).toLocaleString("en-IN")}
    </span>
  );
}
