import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../services/api.js";


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("vault_access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("vault_access_token", data.accessToken);
    localStorage.setItem("vault_refresh_token", data.refreshToken);
    const me = await api.get("/auth/me");
    setUser(me.data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    return data;
  };

  const logout = async () => {
    const rt = localStorage.getItem("vault_refresh_token");
    try {
      if (rt) await api.post("/auth/logout", { refreshToken: rt });
    } catch {}
    localStorage.removeItem("vault_access_token");
    localStorage.removeItem("vault_refresh_token");
    setUser(null);
  };

  const value = { user, loading, login, register, logout, refreshMe: fetchMe, isAuthenticated: !!user };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
