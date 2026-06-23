import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Global simulation configuration shared across tabs.
 * IntelligentDispatch writes `fleetSize` here ("Apply Simulation Config");
 * FleetOptimizer reads it to seed its optimizer. Persisted to localStorage.
 */
const ConfigContext = createContext(null);
const KEY = "parkwatch_sim_config";
const DEFAULT = { fleetSize: 3, effectiveness: 70, priority: 50 };

function read() {
  try {
    return { ...DEFAULT, ...(JSON.parse(localStorage.getItem(KEY)) || {}) };
  } catch {
    return { ...DEFAULT };
  }
}

export function ConfigProvider({ children }) {
  const [simConfig, setSim] = useState(read);

  const setSimConfig = useCallback((patch) => {
    setSim((c) => {
      const next = { ...c, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({ simConfig, setSimConfig }), [simConfig, setSimConfig]);
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) return { simConfig: { ...DEFAULT }, setSimConfig: () => {} };
  return ctx;
}
