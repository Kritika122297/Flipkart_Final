// ════════════════════════════════════════════════════════════════════
//  SmartPark AI — synthetic data layer
//  Mirrors the Streamlit backend's domain model: Bengaluru parking
//  violations, CIS (Congestion Impact Score), EPI (Enforcement Priority
//  Index), economic loss, fleet routing, CCTV detections.
// ════════════════════════════════════════════════════════════════════

// Deterministic PRNG so charts/maps are stable across renders.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(42);
const rand = (min, max) => min + rng() * (max - min);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

// ── Bengaluru hotspots (lat, lon) ─────────────────────────────────────
export const BENGALURU_CENTER = [12.9716, 77.5946];

export const ZONES = [
  { name: "MG Road", lat: 12.9756, lon: 77.6068, station: "Cubbon Park" },
  { name: "Koramangala", lat: 12.9352, lon: 77.6245, station: "Koramangala" },
  { name: "Indiranagar", lat: 12.9784, lon: 77.6408, station: "Indiranagar" },
  { name: "Whitefield", lat: 12.9698, lon: 77.7499, station: "Whitefield" },
  { name: "Electronic City", lat: 12.8452, lon: 77.6602, station: "Electronic City" },
  { name: "Jayanagar", lat: 12.9252, lon: 77.5833, station: "Jayanagar" },
  { name: "Majestic", lat: 12.9774, lon: 77.5713, station: "Majestic" },
  { name: "Silk Board", lat: 12.9172, lon: 77.6225, station: "Silk Board" },
  { name: "HSR Layout", lat: 12.9116, lon: 77.6389, station: "HSR Layout" },
  { name: "Marathahalli", lat: 12.9591, lon: 77.6974, station: "Marathahalli" },
  { name: "Rajajinagar", lat: 12.9916, lon: 77.5526, station: "Rajajinagar" },
  { name: "Yelahanka", lat: 13.1007, lon: 77.5963, station: "Yelahanka" },
];

export const VEHICLE_TYPES = [
  { type: "Two-wheeler", size: 2 },
  { type: "Car", size: 5 },
  { type: "Passenger Auto", size: 4 },
  { type: "LGV", size: 7 },
  { type: "Bus", size: 9 },
  { type: "HGV/Truck", size: 10 },
  { type: "Tanker", size: 10 },
];

export const VIOLATION_TYPES = [
  { type: "Double Parking", severity: 10 },
  { type: "Parking opposite to parked vehicle", severity: 9 },
  { type: "Parking in a main road", severity: 8 },
  { type: "Parking near road crossing", severity: 8 },
  { type: "Parking near bus-stop/school/hospital", severity: 7 },
  { type: "No Parking", severity: 5 },
  { type: "Wrong Parking", severity: 4 },
  { type: "Footpath Parking", severity: 6 },
];

// ── Headline KPIs (Command Center) ────────────────────────────────────
export const KPIS = {
  activeViolations: 847,
  avgCIS: 68.4,
  aiUptime: 99.7,
  fleetActive: 4,
  fleetTotal: 6,
  zonesCleared: 23,
  economicLossPerSec: 4.85, // ₹ per second, ticking
  economicLossBase: 18_420_000, // ₹ baseline today
};

// ── Per-zone aggregated metrics (CIS / EPI / counts) ──────────────────
export const ZONE_STATS = ZONES.map((z, i) => {
  const count = Math.round(rand(120, 980));
  const avgCis = Math.round(rand(34, 92) * 10) / 10;
  const totalCis = Math.round(count * avgCis);
  const rushPct = Math.round(rand(28, 74));
  const heavyPct = Math.round(rand(8, 38));
  const severity = Math.round(rand(4.5, 9.2) * 10) / 10;
  return {
    id: i,
    name: z.name,
    station: z.station,
    lat: z.lat,
    lon: z.lon,
    count,
    avgCis,
    totalCis,
    rushPct,
    heavyPct,
    severity,
  };
});

// EPI = 0.4*norm(totalCis) + 0.3*norm(count) + 0.3*norm(avgCis), renormed.
function normalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return values.map((v) => (max > min ? ((v - min) / (max - min)) * 100 : 50));
}
const _tc = normalize(ZONE_STATS.map((z) => z.totalCis));
const _ct = normalize(ZONE_STATS.map((z) => z.count));
const _ac = normalize(ZONE_STATS.map((z) => z.avgCis));
const _epiRaw = ZONE_STATS.map((_, i) => 0.4 * _tc[i] + 0.3 * _ct[i] + 0.3 * _ac[i]);
const _epiNorm = normalize(_epiRaw);
ZONE_STATS.forEach((z, i) => {
  z.epi = Math.round(_epiNorm[i] * 10) / 10;
  z.risk = z.epi > 70 ? "critical" : z.epi > 45 ? "medium" : "clear";
});

export const EPI_RANKING = [...ZONE_STATS].sort((a, b) => b.epi - a.epi);

// ── Map markers (one cluster per zone, jittered points) ───────────────
export const MAP_MARKERS = ZONE_STATS.flatMap((z) => {
  const n = Math.max(3, Math.round(z.count / 90));
  return Array.from({ length: n }, () => ({
    lat: z.lat + rand(-0.012, 0.012),
    lon: z.lon + rand(-0.012, 0.012),
    cis: Math.round(z.avgCis + rand(-15, 15)),
    risk: z.risk,
    zone: z.name,
  }));
});

// Heat points for the leaflet heat layer: [lat, lon, intensity 0..1].
export const HEAT_POINTS = MAP_MARKERS.map((m) => [
  m.lat,
  m.lon,
  Math.min(1, Math.max(0.15, m.cis / 100)),
]);

// ── Hourly violation distribution (rush-hour peaks) ──────────────────
export const HOURLY = Array.from({ length: 24 }, (_, h) => {
  let base = 12;
  if ((h >= 8 && h <= 10) || (h >= 17 && h <= 19)) base = rand(60, 95);
  else if (h === 7 || h === 11 || h === 16 || h === 20) base = rand(35, 55);
  else if (h >= 11 && h <= 16) base = rand(25, 40);
  else if (h >= 21 && h <= 23) base = rand(10, 22);
  else base = rand(3, 12);
  return {
    hour: `${String(h).padStart(2, "0")}:00`,
    h,
    violations: Math.round(base),
    cis: Math.round(base * rand(0.6, 0.95)),
  };
});

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAILY = DAYS.map((d, i) => ({
  day: d,
  violations: Math.round(i < 5 ? rand(520, 880) : rand(280, 460)),
  cis: Math.round(i < 5 ? rand(58, 82) : rand(38, 56)),
}));

// ── Vehicle-type breakdown ────────────────────────────────────────────
export const VEHICLE_BREAKDOWN = VEHICLE_TYPES.map((v) => ({
  name: v.type,
  value: Math.round(rand(40, 520) * (v.size > 6 ? 0.4 : 1)),
  size: v.size,
})).sort((a, b) => b.value - a.value);

// ── Violation-type breakdown ──────────────────────────────────────────
export const VIOLATION_BREAKDOWN = VIOLATION_TYPES.map((v) => ({
  name: v.type,
  value: Math.round(rand(60, 640)),
  severity: v.severity,
})).sort((a, b) => b.value - a.value);

// ── Radar: zone risk profile (multi-axis) ─────────────────────────────
export const RADAR_PROFILE = [
  { axis: "Severity", A: 82, B: 54 },
  { axis: "Volume", A: 91, B: 61 },
  { axis: "Rush-hour", A: 76, B: 48 },
  { axis: "Heavy veh.", A: 64, B: 39 },
  { axis: "Junction", A: 88, B: 57 },
  { axis: "Recurrence", A: 71, B: 44 },
];

// ── Emergency-route vulnerability (rose bars) ─────────────────────────
export const EMERGENCY_VULN = [
  { route: "Silk Board → St. John's", delay: 14.2 },
  { route: "MG Rd → Manipal Hosp.", delay: 11.6 },
  { route: "Marathahalli → Aster", delay: 9.8 },
  { route: "Koramangala → Apollo", delay: 8.4 },
  { route: "Whitefield → Vydehi", delay: 7.1 },
  { route: "Jayanagar → NIMHANS", delay: 5.9 },
];

// ── Economic loss breakdown by zone ───────────────────────────────────
export const ECONOMIC_BY_ZONE = ZONE_STATS.map((z) => ({
  name: z.name,
  cost: Math.round(z.count * 0.5 * 320), // violations × delay × value-of-time
})).sort((a, b) => b.cost - a.cost);

// ── Dispatch simulation curve (CIS reduction over teams) ──────────────
export function simulateDispatch(teams, effectiveness) {
  // Returns CIS reduction curve as patrols deploy.
  const points = [];
  let cis = KPIS.avgCIS;
  for (let t = 0; t <= teams; t++) {
    const reduction = t === 0 ? 0 : (effectiveness / 100) * (cis * 0.18);
    cis = Math.max(18, cis - reduction);
    points.push({ team: t, cis: Math.round(cis * 10) / 10 });
  }
  return points;
}

// ── Tactical AI: feature importance (violet horizontal bars) ──────────
export const FEATURE_IMPORTANCE = [
  { feature: "Hour of day", importance: 0.27 },
  { feature: "Junction proximity", importance: 0.21 },
  { feature: "Vehicle size", importance: 0.18 },
  { feature: "Day of week", importance: 0.13 },
  { feature: "Violation severity", importance: 0.11 },
  { feature: "Weather", importance: 0.06 },
  { feature: "Event nearby", importance: 0.04 },
].sort((a, b) => b.importance - a.importance);

// ── Tactical AI: anomaly log ──────────────────────────────────────────
export const ANOMALY_LOG = [
  { time: "08:42", zone: "Silk Board", msg: "CIS spike +340% vs 7-day baseline", flagged: true },
  { time: "09:15", zone: "MG Road", msg: "Cluster of 12 HGV violations in 200m", flagged: true },
  { time: "10:03", zone: "Koramangala", msg: "Normal patrol coverage", flagged: false },
  { time: "11:27", zone: "Whitefield", msg: "Tanker parked near school zone", flagged: true },
  { time: "12:48", zone: "Jayanagar", msg: "Routine enforcement sweep", flagged: false },
  { time: "13:30", zone: "Indiranagar", msg: "Repeat-offender plate detected (4×)", flagged: true },
];

// ── Tactical dispatch plan (numbered steps) ──────────────────────────
export const DISPATCH_PLAN = [
  "Deploy Patrol Alpha to Silk Board Junction — EPI 100, est. 14min ETA",
  "Re-route Patrol Bravo from Jayanagar to MG Road corridor (rush-hour surge)",
  "Hold Patrol Charlie at HSR Layout — preventive coverage, medium risk",
  "Dispatch tow unit to Koramangala 80ft Rd — 3 HGV double-parking blocks",
  "Flag Indiranagar repeat offender for automated challan escalation",
];

// ── Impact metrics (landing — count-up) ──────────────────────────────
export const IMPACT_METRICS = [
  { label: "Avg congestion reduction", value: 34, suffix: "%" },
  { label: "Faster emergency response", value: 11.6, suffix: " min" },
  { label: "Violations auto-detected / day", value: 12400, suffix: "+" },
  { label: "Economic loss averted / yr", value: 220, prefix: "₹", suffix: " Cr" },
];

// ── Fleet routes (OR-Tools VRP) ───────────────────────────────────────
export const FLEET = [
  {
    id: 1,
    name: "Truck Alpha",
    color: "#7C6AF7",
    accent: "violet",
    distance: 42.6,
    eta: 96,
    stops: ["Depot — Majestic", "MG Road", "Indiranagar", "Marathahalli", "Whitefield"],
    path: [
      [12.9774, 77.5713],
      [12.9756, 77.6068],
      [12.9784, 77.6408],
      [12.9591, 77.6974],
      [12.9698, 77.7499],
    ],
    urgency: "high",
  },
  {
    id: 2,
    name: "Truck Bravo",
    color: "#22D3EE",
    accent: "cyan",
    distance: 31.2,
    eta: 74,
    stops: ["Depot — Majestic", "Rajajinagar", "Jayanagar", "Koramangala"],
    path: [
      [12.9774, 77.5713],
      [12.9916, 77.5526],
      [12.9252, 77.5833],
      [12.9352, 77.6245],
    ],
    urgency: "medium",
  },
  {
    id: 3,
    name: "Truck Charlie",
    color: "#10B981",
    accent: "emerald",
    distance: 27.8,
    eta: 63,
    stops: ["Depot — Majestic", "Silk Board", "HSR Layout", "Electronic City"],
    path: [
      [12.9774, 77.5713],
      [12.9172, 77.6225],
      [12.9116, 77.6389],
      [12.8452, 77.6602],
    ],
    urgency: "low",
  },
  {
    id: 4,
    name: "Truck Delta",
    color: "#F59E0B",
    accent: "amber",
    distance: 38.9,
    eta: 88,
    stops: ["Depot — Majestic", "Yelahanka", "Indiranagar", "HSR Layout"],
    path: [
      [12.9774, 77.5713],
      [13.1007, 77.5963],
      [12.9784, 77.6408],
      [12.9116, 77.6389],
    ],
    urgency: "high",
  },
];

// ── CCTV: live infraction feed (mirrors the Streamlit infractions table) ─────
export const CCTV_DETECTIONS = [
  { id: "DET-7741", time: "13:42:08", vehicle: "HGV/Truck", conf: 97.2, type: "Double Parking (Obstruction)", cis: 88.0, action: "Tow Truck Assigned", critical: true },
  { id: "DET-7740", time: "13:41:52", vehicle: "Sedan", conf: 94.8, type: "Parked in No-Parking", cis: 42.5, action: "Alert Dispatched", critical: false },
  { id: "DET-7739", time: "13:41:31", vehicle: "Bus", conf: 91.5, type: "Bus-stop Obstruction", cis: 79.5, action: "Tow Truck Assigned", critical: true },
  { id: "DET-7738", time: "13:41:09", vehicle: "Sedan", conf: 88.3, type: "Wrong Side Parking", cis: 22.0, action: "Traffic Fine Issued", critical: false },
  { id: "DET-7737", time: "13:40:47", vehicle: "Tanker", conf: 96.1, type: "Footpath Parking", cis: 71.2, action: "Tow Truck Assigned", critical: true },
  { id: "DET-7736", time: "13:40:22", vehicle: "Two-Wheeler", conf: 82.6, type: "Sidewalk Parking", cis: 15.2, action: "Traffic Fine Issued", critical: false },
];

// Pool used to synthesize new live detections while the feed is "recording".
export const CCTV_DETECTION_POOL = [
  { vehicle: "HGV/Truck", type: "Double Parking (Obstruction)", cis: 88.0, action: "Tow Truck Assigned", critical: true },
  { vehicle: "Sedan", type: "Parked in No-Parking", cis: 42.5, action: "Alert Dispatched", critical: false },
  { vehicle: "Bus", type: "Bus-stop Obstruction", cis: 79.5, action: "Tow Truck Assigned", critical: true },
  { vehicle: "Tanker", type: "Footpath Parking", cis: 71.2, action: "Tow Truck Assigned", critical: true },
  { vehicle: "Two-Wheeler", type: "Sidewalk Parking", cis: 15.2, action: "Traffic Fine Issued", critical: false },
  { vehicle: "Auto", type: "Wrong Side Parking", cis: 28.4, action: "Traffic Fine Issued", critical: false },
  { vehicle: "Sedan", type: "Junction Blocking", cis: 64.8, action: "Alert Dispatched", critical: true },
];

// Bounding boxes for the CCTV canvas (% coords): cars=violet, trucks=cyan, critical=rose.
export const CCTV_BOXES = [
  { x: 8, y: 52, w: 22, h: 30, label: "CAR", cls: "car", conf: 94 },
  { x: 38, y: 44, w: 27, h: 38, label: "TRUCK", cls: "truck", conf: 97 },
  { x: 70, y: 56, w: 20, h: 26, label: "VIOLATION", cls: "critical", conf: 92 },
  { x: 24, y: 30, w: 12, h: 14, label: "CAR", cls: "car", conf: 86 },
];

// ── Data Inspector: sample table rows ─────────────────────────────────
export const TABLE_ROWS = Array.from({ length: 24 }, (_, i) => {
  const z = pick(ZONES);
  const v = pick(VIOLATION_TYPES);
  const veh = pick(VEHICLE_TYPES);
  const cis = Math.round(rand(20, 98));
  return {
    id: 100234 + i,
    station: z.station,
    location: `${pick(["80ft Rd", "100ft Rd", "Outer Ring Rd", "Hosur Rd", "Sarjapur Rd"])}`,
    vehicle: veh.type,
    violation: v.type,
    cis,
    anomaly: cis > 88,
    time: `${String(Math.floor(rand(0, 24))).padStart(2, "0")}:${String(Math.floor(rand(0, 60))).padStart(2, "0")}`,
  };
});

export const DATA_QUALITY = {
  rawRows: 48213,
  cleanRows: 47956,
  droppedDatetime: 142,
  droppedCoords: 115,
  dateRange: "01 Jan 2024 – 31 May 2024",
  stations: 38,
  locations: 1247,
};

// 24h congestion playback frames (intensity per zone, 0..1).
export const PLAYBACK_FRAMES = Array.from({ length: 24 }, (_, h) => {
  const peak = (h >= 8 && h <= 10) || (h >= 17 && h <= 19);
  const mid = h >= 11 && h <= 16;
  return ZONE_STATS.map((z) => ({
    lat: z.lat,
    lon: z.lon,
    intensity: Math.min(1, (peak ? 0.85 : mid ? 0.5 : 0.22) * rand(0.7, 1.2) * (z.epi / 80)),
  }));
});
