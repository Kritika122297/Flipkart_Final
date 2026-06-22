import { createContext, useContext, useMemo, useState } from "react";
import { ZONE_STATS, ZONES } from "../data/mockData.js";

/**
 * Global "currently selected location/station" state.
 *
 * Clicking a marker on any map, or a hotspot/leaderboard row on any tab,
 * updates this so the whole dashboard (notably the CCTV tab) follows along.
 * Default = the highest-CIS zone, so the CCTV feed always has a sensible
 * camera even before the user interacts.
 */
const LocationContext = createContext(null);

// Highest-CIS zone name — used as the default selection.
const DEFAULT_ZONE = [...ZONE_STATS].sort((a, b) => b.avgCis - a.avgCis)[0]?.name ?? "MG Road";

// Build a stable "Camera" label per zone (e.g. "Koramangala 80ft Rd · Cam 3").
const ROAD_BY_ZONE = {
  "MG Road": "MG Road Boulevard",
  Koramangala: "Koramangala 80ft Rd",
  Indiranagar: "Indiranagar 100ft Rd",
  Whitefield: "Whitefield Main Rd",
  "Electronic City": "Hosur Rd · Elec. City",
  Jayanagar: "Jayanagar 4th Block",
  Majestic: "Majestic KSR Approach",
  "Silk Board": "Silk Board Junction",
  "HSR Layout": "HSR 27th Main",
  Marathahalli: "Marathahalli Bridge",
  Rajajinagar: "Rajajinagar 1st Block",
  Yelahanka: "Yelahanka New Town",
};

export function cameraLabelFor(zoneName) {
  const idx = ZONES.findIndex((z) => z.name === zoneName);
  const road = ROAD_BY_ZONE[zoneName] || `${zoneName} Main Rd`;
  return { road, cam: (idx % 12) + 1, label: `${road} · Cam ${(idx % 12) + 1}` };
}

export function LocationProvider({ children }) {
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_ZONE);
  const value = useMemo(
    () => ({ selectedLocation, setSelectedLocation }),
    [selectedLocation]
  );
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useSelectedLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    // Defensive fallback so a component used outside the provider still works.
    return { selectedLocation: DEFAULT_ZONE, setSelectedLocation: () => {} };
  }
  return ctx;
}
