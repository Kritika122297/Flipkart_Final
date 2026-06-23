import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { BENGALURU_CENTER, HEAT_POINTS } from "../../data/mockData.js";
import { HEAT_GRADIENT } from "../../lib/tokens.js";

const RISK_COLOR = { critical: "#FB4D6D", medium: "#F59E0B", clear: "#10B981" };

// Tile providers per MapModeToggle option.
// NOTE: a true satellite layer (e.g. Mapbox Satellite) needs an API key; we use
// OpenStreetMap "Street" tiles here so the map never breaks without a token.
const TILES = {
  Dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    subdomains: "abcd",
  },
  Light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    subdomains: "abcd",
  },
  Street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    subdomains: "abc",
  },
};

// ── Heat layer (leaflet.heat) ─────────────────────────────────────────
// Uses setLatLngs+redraw instead of recreating the layer on every tick so
// the 24-hour playback is smooth with no blank frames between hours.
function HeatLayer({ points = HEAT_POINTS }) {
  const map = useMap();
  const heatRef = useRef(null);

  // Create the layer once; initialise with current points so StrictMode
  // double-invoke still has data after the first unmount/remount cycle.
  useEffect(() => {
    const layer = L.heatLayer(points ?? [], {
      radius: 40,
      blur: 25,
      maxZoom: 17,
      max: 0.55,        // real intensities top out ~0.48 (rush) → maps to near-red
      minOpacity: 0.04, // night areas nearly invisible so rush-hour contrast pops
      gradient: HEAT_GRADIENT,
    }).addTo(map);
    heatRef.current = layer;
    return () => {
      map.removeLayer(layer);
      heatRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]); // intentionally omitting `points` — updated via the effect below

  // Update data in-place whenever the hour changes — no layer recreation.
  useEffect(() => {
    const layer = heatRef.current;
    if (!layer || !points?.length) return;
    layer.setLatLngs(points);
    layer.redraw();
  }, [points]);

  return null;
}

// ── Zone summary circles (one per station, sized by count) ───────────
function ZoneSummaryCircles({ zones, onSelectLocation, selectedLocation }) {
  if (!zones?.length) return null;
  const maxCount = Math.max(...zones.map((z) => z.count || 1), 1);
  return zones.map((z, i) => {
    const selected = selectedLocation && z.name === selectedLocation;
    return (
      <Circle
        key={`zs-${i}`}
        center={[z.lat, z.lon]}
        radius={320 + (z.count / maxCount) * 750}
        eventHandlers={onSelectLocation ? { click: () => onSelectLocation(z.name) } : undefined}
        pathOptions={{
          color: RISK_COLOR[z.risk] || "#7C6AF7",
          fillColor: RISK_COLOR[z.risk] || "#7C6AF7",
          fillOpacity: selected ? 0.22 : 0.1,
          weight: selected ? 2.5 : z.risk === "critical" ? 2 : 1.5,
          dashArray: z.risk === "critical" ? undefined : "5 5",
        }}
      >
        <Tooltip sticky>
          <b>{z.name}</b>
          {z.count != null && <span> &nbsp;·&nbsp; {z.count.toLocaleString()} violations</span>}
          {z.avgCis != null && <span> &nbsp;·&nbsp; CIS {z.avgCis}</span>}
          {z.epi != null && <span> &nbsp;·&nbsp; EPI {z.epi}</span>}
        </Tooltip>
      </Circle>
    );
  });
}

// ── Selected zone marker — prominent pin + radar ring on the chosen station ──
function SelectedZoneMarker({ zone }) {
  if (!zone?.lat || !zone?.lon) return null;
  const color = RISK_COLOR[zone.risk] || "#7C6AF7";
  return (
    <>
      {/* Outer glow ring */}
      <Circle
        center={[zone.lat, zone.lon]}
        radius={600}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.08, weight: 2, dashArray: "6 4" }}
      />
      {/* Centre dot */}
      <CircleMarker
        center={[zone.lat, zone.lon]}
        radius={13}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.75, weight: 3 }}
      >
        <Popup>
          <div style={{ minWidth: 160 }}>
            <div style={{ fontWeight: 700, color, marginBottom: 4 }}>{zone.name}</div>
            {zone.count != null && <div style={{ fontSize: 12, color: "#94A3B8" }}>{zone.count.toLocaleString()} violations</div>}
            {zone.avgCis != null && <div style={{ fontSize: 12, color: "#94A3B8" }}>Avg CIS: {zone.avgCis}</div>}
            {zone.epi != null && <div style={{ fontSize: 12, color: "#94A3B8" }}>EPI: {zone.epi}</div>}
          </div>
        </Popup>
      </CircleMarker>
      <RadarRing lat={zone.lat} lon={zone.lon} color={color} />
    </>
  );
}

// ── Fly-to handler — animates map to a target when selectedLocation changes ──
function FlyToHandler({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lon], 14, { duration: 1.2 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, target?.name]); // key by name so object ref churn doesn't re-fire
  return null;
}

// ── Animated pulsing marker via divIcon ───────────────────────────────
function pulseIcon(risk) {
  const color = RISK_COLOR[risk] || "#7C6AF7";
  const critical = risk === "critical" ? "critical" : "";
  return L.divIcon({
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    html: `<div class="map-pulse ${critical}" style="width:14px;height:14px;background:${color};box-shadow:0 0 10px ${color}"></div>`,
  });
}

/**
 * Reusable Bengaluru map.
 *  - markers:       [{lat, lon, risk, cis, zone}] individual scatter markers
 *  - zoneSummaries: [{lat, lon, name, count, avgCis, epi, risk}] one circle per station
 *  - heat:          boolean (show heatmap layer)
 *  - heatPoints:    optional override [[lat,lon,intensity]]
 *  - routes:        [{path:[[lat,lon]], color, name}]
 *  - radar:         [{lat,lon,color}] expanding ping rings
 */
export default function BengaluruMap({
  markers = [],
  zoneSummaries = [],
  heat = false,
  heatPoints,
  routes = [],
  radar = [],
  center = BENGALURU_CENTER,
  zoom = 12,
  className = "",
  height = "100%",
  mode = "Dark",
  onSelectLocation,
  selectedLocation,
  flyTo = null,
  borderRadius = "16px",
  animatedRoutes = false,
  warnings = [],
}) {
  const tile = TILES[mode] || TILES.Dark;
  return (
    <div className={className} style={{ height, width: "100%" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        zoomControl={true}
        style={{ height: "100%", width: "100%", borderRadius }}
        attributionControl={true}
      >
        {/* key forces a fresh tile layer when the user switches map mode */}
        <TileLayer
          key={mode}
          url={tile.url}
          attribution={tile.attribution}
          subdomains={tile.subdomains}
          maxZoom={19}
        />

        {heat && <HeatLayer points={heatPoints} />}
        <FlyToHandler target={flyTo} />
        <SelectedZoneMarker zone={flyTo} />

        {/* Clean zone-level circles (decluttered alternative to scatter markers) */}
        <ZoneSummaryCircles zones={zoneSummaries} onSelectLocation={onSelectLocation} selectedLocation={selectedLocation} />

        {routes.map((r, i) => (
          <Polyline
            key={i}
            positions={r.path}
            pathOptions={{
              color: r.color,
              weight: 4,
              opacity: 0.85,
              lineCap: "round",
              className: animatedRoutes ? "route-flow" : undefined,
            }}
          />
        ))}

        {/* radar ping rings via animated CircleMarker DOM not native — use divIcon markers */}
        {radar.map((p, i) => (
          <RadarRing key={`r-${i}`} lat={p.lat} lon={p.lon} color={p.color || "#7C6AF7"} />
        ))}

        {/* Emerging-risk zones (Model 3) — amber dashed rings + pulsing dot */}
        {warnings.map((w, i) => (
          <EmergingZone key={`w-${i}`} lat={w.lat ?? w.latitude} lon={w.lon ?? w.longitude} growth={w.growth ?? w.growth_rate} recent={w.recent} prior={w.prior} />
        ))}

        {markers.map((m, i) =>
          m.icon ? (
            <MarkerWithIcon key={i} m={m} onSelectLocation={onSelectLocation} selectedLocation={selectedLocation} />
          ) : (
            <CircleMarker
              key={i}
              center={[m.lat, m.lon]}
              radius={
                selectedLocation && m.zone === selectedLocation
                  ? 9
                  : m.risk === "critical"
                    ? 7
                    : 5
              }
              eventHandlers={m.zone && onSelectLocation ? { click: () => onSelectLocation(m.zone) } : undefined}
              pathOptions={{
                color: RISK_COLOR[m.risk] || "#7C6AF7",
                fillColor: RISK_COLOR[m.risk] || "#7C6AF7",
                fillOpacity: selectedLocation && m.zone === selectedLocation ? 0.9 : 0.55,
                weight: selectedLocation && m.zone === selectedLocation ? 3 : 1.5,
              }}
            >
              {(m.zone || m.cis) && (
                <Popup>
                  <div style={{ minWidth: 130 }}>
                    {m.zone && (
                      <div style={{ fontWeight: 700, color: "#E2E8F0", marginBottom: 4 }}>{m.zone}</div>
                    )}
                    {m.cis != null && (
                      <div style={{ fontSize: 12, color: "#94A3B8" }}>
                        CIS: <b style={{ color: RISK_COLOR[m.risk] }}>{m.cis}</b>
                      </div>
                    )}
                    {m.risk && (
                      <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase" }}>
                        {m.risk}
                      </div>
                    )}
                  </div>
                </Popup>
              )}
            </CircleMarker>
          )
        )}
      </MapContainer>
    </div>
  );
}

// Marker rendered with the animated divIcon (used for hero hotspots).
function MarkerWithIcon({ m, onSelectLocation, selectedLocation }) {
  // eslint-disable-next-line no-unused-vars
  const _ = pulseIcon; // referenced for clarity
  const selected = selectedLocation && m.zone === selectedLocation;
  return (
    <CircleMarker
      center={[m.lat, m.lon]}
      radius={selected ? 9 : m.risk === "critical" ? 8 : 6}
      eventHandlers={m.zone && onSelectLocation ? { click: () => onSelectLocation(m.zone) } : undefined}
      pathOptions={{
        color: RISK_COLOR[m.risk] || "#7C6AF7",
        fillColor: RISK_COLOR[m.risk] || "#7C6AF7",
        fillOpacity: selected ? 0.9 : 0.6,
        weight: selected ? 3 : 2,
        className: m.risk === "critical" ? "leaflet-pulse-fast" : "leaflet-pulse",
      }}
    />
  );
}

// Emerging-risk zone — amber dashed Circle ring + pulsing dot + tooltip.
function EmergingZone({ lat, lon, growth, recent, prior }) {
  const YELLOW = "#F5D90A";
  const growthVal = growth ?? 0;
  const recentVal = recent ?? 0;
  return (
    <>
      <Circle
        center={[lat, lon]}
        radius={Math.max(300, growthVal * 15)}
        pathOptions={{
          color: "#F59E0B",
          fillColor: "#F59E0B",
          fillOpacity: 0.08,
          dashArray: "8 6",
          weight: 2,
        }}
      >
        <Tooltip permanent={false}>
          ⚠ Emerging Risk Zone · +{growthVal}% WoW · {recentVal} violations this week
        </Tooltip>
      </Circle>
      <RadarRing lat={lat} lon={lon} color={YELLOW} />
      <CircleMarker
        center={[lat, lon]}
        radius={10}
        pathOptions={{ color: YELLOW, fillColor: YELLOW, fillOpacity: 0.25, weight: 2 }}
      >
        <Popup>
          <div style={{ minWidth: 150 }}>
            <div style={{ fontWeight: 700, color: YELLOW, marginBottom: 4 }}>⚠️ Emerging Risk Zone</div>
            <div style={{ fontSize: 12, color: "#94A3B8" }}>
              Density {growthVal > 0 ? `+${growthVal}%` : "elevated"} week-over-week
            </div>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}

// Expanding radar ping using a divIcon overlay.
function RadarRing({ lat, lon, color }) {
  const map = useMap();
  useEffect(() => {
    const icon = L.divIcon({
      className: "",
      iconSize: [120, 120],
      iconAnchor: [60, 60],
      html: `<div style="width:120px;height:120px;border-radius:50%;border:2px solid ${color};animation:marker-ring 3s ease-out infinite;opacity:0.6"></div>`,
    });
    const marker = L.marker([lat, lon], { icon, interactive: false }).addTo(map);
    return () => map.removeLayer(marker);
  }, [map, lat, lon, color]);
  return null;
}
