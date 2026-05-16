import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { IS_DEMO_MODE } from "../demo";

const STAFF_CONFIG = { username: "camidi", password: "fonduefortwo" };
const ADMIN_CONFIG = { username: "admin", password: "camidiadmin" };

const AUTH_TOKEN_KEY = "authToken";

interface AuthContextValue {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(IS_DEMO_MODE);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (IS_DEMO_MODE) return;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token === "admin") {
      setIsAuthenticated(true);
      setIsAdmin(true);
    } else if (token === "true") {
      setIsAuthenticated(true);
      setIsAdmin(false);
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    if (IS_DEMO_MODE) return true;
    if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
      localStorage.setItem(AUTH_TOKEN_KEY, "admin");
      setIsAuthenticated(true);
      setIsAdmin(true);
      return true;
    }
    if (username === STAFF_CONFIG.username && password === STAFF_CONFIG.password) {
      localStorage.setItem(AUTH_TOKEN_KEY, "true");
      setIsAuthenticated(true);
      setIsAdmin(false);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (IS_DEMO_MODE) return;
    localStorage.removeItem(AUTH_TOKEN_KEY);
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
