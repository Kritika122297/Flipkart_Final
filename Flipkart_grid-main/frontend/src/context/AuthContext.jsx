import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, tokenStore } from "../lib/api.js";

/**
 * AuthContext — manages the authenticated user (role, username, token) and
 * persists it to localStorage so a refresh keeps the session.
 *
 * Roles:
 *   admin → full access (all 7 tabs)
 *   user  → Command Center, Congestion Analytics, Live CCTV only
 */
const AuthContext = createContext(null);
const USER_KEY = "parkwatch_user";

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const logout = useCallback(() => {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const login = useCallback(async (username, password) => {
    // Throws on bad credentials / network error — caller shows the message.
    const data = await authApi.login(username, password);
    tokenStore.set(data.token);
    const u = { username: data.username, role: data.role, name: data.name };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  // If any API call returns 401, the interceptor fires this event → log out.
  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener("parkwatch:unauthorized", onUnauthorized);
    return () => window.removeEventListener("parkwatch:unauthorized", onUnauthorized);
  }, [logout]);

  const value = useMemo(
    () => ({ user, login, logout, isAuthenticated: !!user, role: user?.role ?? null }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
