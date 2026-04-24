import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// Hardcoded credentials (configurable)
const AUTH_CONFIG = {
  username: "camidi",
  password: "fonduefortwo"
};

const AUTH_TOKEN_KEY = "authToken";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    if (username === AUTH_CONFIG.username && password === AUTH_CONFIG.password) {
      localStorage.setItem(AUTH_TOKEN_KEY, "true");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
