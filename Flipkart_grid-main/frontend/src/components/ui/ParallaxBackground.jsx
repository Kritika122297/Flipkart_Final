import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Subtle mouse-parallax depth layers (0.02x mouse delta), plus a fixed grid
 * + drifting accent orbs. Sits behind page content.
 */
export default function ParallaxBackground() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });

  const x1 = useTransform(sx, (v) => v * 0.02);
  const y1 = useTransform(sy, (v) => v * 0.02);
  const x2 = useTransform(sx, (v) => v * -0.035);
  const y2 = useTransform(sy, (v) => v * -0.035);

  useEffect(() => {
    const onMove = (e) => {
      mx.set(e.clientX - window.innerWidth / 2);
      my.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,220,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,220,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 75%)",
        }}
      />
      <motion.div
        style={{ x: x1, y: y1 }}
        className="absolute -left-40 -top-40 h-[460px] w-[460px] rounded-full bg-violet/20 blur-[120px]"
      />
      <motion.div
        style={{ x: x2, y: y2 }}
        className="absolute -right-40 top-20 h-[420px] w-[420px] rounded-full bg-cyan/15 blur-[120px]"
      />
      <motion.div
        style={{ x: x1, y: y2 }}
        className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-emerald/10 blur-[120px]"
      />
    </div>
  );
}
