import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { BENGALURU_CENTER, HEAT_POINTS } from "../../data/mockData.js";
import { HEAT_GRADIENT } from "../../lib/tokens.js";

const RISK_COLOR = { critical: "#FB4D6D", medium: "#F59E0B", clear: "#10B981" };

// ── Heat layer (leaflet.heat) ─────────────────────────────────────────
function HeatLayer({ points = HEAT_POINTS }) {
  const map = useMap();
  useEffect(() => {
    if (!points?.length) return;
    const layer = L.heatLayer(points, {
      radius: 28,
      blur: 22,
      maxZoom: 17,
      max: 1.0,
      gradient: HEAT_GRADIENT,
    }).addTo(map);
    return () => map.removeLayer(layer);
  }, [map, points]);
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
 *  - markers: [{lat, lon, risk, cis, zone}]
 *  - heat:    boolean (show heatmap layer)
 *  - heatPoints: optional override [[lat,lon,intensity]]
 *  - routes:  [{path:[[lat,lon]], color, name}]
 *  - radar:   [{lat,lon,color}] expanding ping rings
 */
export default function BengaluruMap({
  markers = [],
  heat = false,
  heatPoints,
  routes = [],
  radar = [],
  center = BENGALURU_CENTER,
  zoom = 12,
  className = "",
  height = "100%",
}) {
  return (
    <div className={className} style={{ height, width: "100%" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        zoomControl={true}
        style={{ height: "100%", width: "100%", borderRadius: "16px" }}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
          subdomains="abcd"
          maxZoom={19}
        />

        {heat && <HeatLayer points={heatPoints} />}

        {routes.map((r, i) => (
          <Polyline
            key={i}
            positions={r.path}
            pathOptions={{ color: r.color, weight: 4, opacity: 0.85, lineCap: "round" }}
          />
        ))}

        {/* radar ping rings via animated CircleMarker DOM not native — use divIcon markers */}
        {radar.map((p, i) => (
          <RadarRing key={`r-${i}`} lat={p.lat} lon={p.lon} color={p.color || "#7C6AF7"} />
        ))}

        {markers.map((m, i) =>
          m.icon ? (
            <MarkerWithIcon key={i} m={m} />
          ) : (
            <CircleMarker
              key={i}
              center={[m.lat, m.lon]}
              radius={m.risk === "critical" ? 7 : 5}
              pathOptions={{
                color: RISK_COLOR[m.risk] || "#7C6AF7",
                fillColor: RISK_COLOR[m.risk] || "#7C6AF7",
                fillOpacity: 0.55,
                weight: 1.5,
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
function MarkerWithIcon({ m }) {
  // eslint-disable-next-line no-unused-vars
  const _ = pulseIcon; // referenced for clarity
  return (
    <CircleMarker
      center={[m.lat, m.lon]}
      radius={m.risk === "critical" ? 8 : 6}
      pathOptions={{
        color: RISK_COLOR[m.risk] || "#7C6AF7",
        fillColor: RISK_COLOR[m.risk] || "#7C6AF7",
        fillOpacity: 0.6,
        weight: 2,
        className: m.risk === "critical" ? "leaflet-pulse-fast" : "leaflet-pulse",
      }}
    />
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
