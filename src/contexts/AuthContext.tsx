import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { IS_DEMO_MODE } from "../demo";
import { setSessionToken, clearSessionToken, getSessionToken, DIRECTUS_URL } from "../services/directusFetch";

const AUTH_ROLE_KEY = "authRole";

interface AuthContextValue {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(IS_DEMO_MODE);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (IS_DEMO_MODE) return;
    const role = localStorage.getItem(AUTH_ROLE_KEY);
    const token = getSessionToken();
    if (token && role === "admin") {
      setIsAuthenticated(true);
      setIsAdmin(true);
    } else if (token && role === "staff") {
      setIsAuthenticated(true);
      setIsAdmin(false);
    }

    const handleExpired = () => {
      setIsAuthenticated(false);
      setIsAdmin(false);
    };
    window.addEventListener("session-expired", handleExpired);
    return () => window.removeEventListener("session-expired", handleExpired);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    if (IS_DEMO_MODE) return true;
    try {
      const email = `${username}@camidi.com`;
      const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const { data: { access_token } } = await res.json();

      const appRole = username === "admin" ? "admin" : "staff";

      setSessionToken(access_token);
      localStorage.setItem(AUTH_ROLE_KEY, appRole);
      setIsAuthenticated(true);
      setIsAdmin(appRole === "admin");
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    if (IS_DEMO_MODE) return;
    clearSessionToken();
    localStorage.removeItem(AUTH_ROLE_KEY);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
