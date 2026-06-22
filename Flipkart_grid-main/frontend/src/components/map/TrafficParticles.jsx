// Decorative traffic-flow overlay for the hero map.
//
// Not geo-accurate — it renders flowing cyan/violet light trails with glowing
// vehicle particles streaming along stylised "road" paths on top of the map,
// evoking live traffic movement. Pointer-events are disabled so the map stays
// fully interactive underneath. Uses SVG <animateMotion> (SMIL) for smooth,
// dependency-free motion.

const ROADS = [
  { id: "rd1", d: "M -5,30 C 25,20 40,55 70,45 S 95,30 110,38", color: "#22D3EE", cars: 4, dur: 9 },
  { id: "rd2", d: "M -5,70 C 20,75 45,50 65,62 S 90,78 110,68", color: "#7C6AF7", cars: 3, dur: 11 },
  { id: "rd3", d: "M 20,-5 C 30,30 55,40 50,70 S 45,95 60,110", color: "#22D3EE", cars: 3, dur: 12 },
  { id: "rd4", d: "M 85,-5 C 78,25 60,35 70,60 S 80,90 72,110", color: "#10B981", cars: 2, dur: 13 },
];

export default function TrafficParticles({ className = "" }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ mixBlendMode: "screen" }}
    >
      <defs>
        {ROADS.map((r) => (
          <path key={`def-${r.id}`} id={r.id} d={r.d} fill="none" />
        ))}
        <filter id="trailGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* faint road trails */}
      {ROADS.map((r) => (
        <use
          key={`trail-${r.id}`}
          href={`#${r.id}`}
          stroke={r.color}
          strokeWidth="0.4"
          strokeOpacity="0.18"
          strokeLinecap="round"
        />
      ))}

      {/* moving vehicle particles */}
      {ROADS.flatMap((r) =>
        Array.from({ length: r.cars }, (_, i) => (
          <circle key={`${r.id}-${i}`} r="0.9" fill={r.color} filter="url(#trailGlow)">
            <animateMotion
              dur={`${r.dur}s`}
              begin={`${(i * r.dur) / r.cars}s`}
              repeatCount="indefinite"
              rotate="auto"
            >
              <mpath href={`#${r.id}`} />
            </animateMotion>
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur={`${r.dur}s`}
              begin={`${(i * r.dur) / r.cars}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))
      )}
    </svg>
  );
}
