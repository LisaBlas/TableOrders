import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export type TextScale = "sm" | "md" | "lg";

interface UIContextValue {
  darkMode: boolean;
  toggleDarkMode: () => void;
  textScale: TextScale;
  setTextScale: (s: TextScale) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export const TEXT_SCALE_ZOOM: Record<TextScale, number> = { sm: 0.9, md: 1, lg: 1.12 };

// Applied directly as inline style CSS custom properties on the root React div
// so React's reconciler explicitly writes new values on every darkMode toggle,
// making var(--c-*) references in all child inline styles update reliably.
export const DARK_VARS: Record<string, string> = {
  "--c-fg":            "#e8e6e0",
  "--c-bg":            "#1a1918",
  "--c-surface":       "#242220",
  "--c-border":        "#383632",
  "--c-subtle":        "#b0ae9a",
  "--c-muted":         "#807e70",
  "--c-faint":         "#6a685c",
  "--c-dimmed":        "#585650",
  "--c-dark":          "#d0cec0",
  "--c-secondary":     "#9a9888",
  "--c-success":       "#5aad65",
  "--c-success-bg":    "#1a2e1c",
  "--c-danger":        "#e05c50",
  "--c-danger-bg":     "#2e1a1a",
  "--c-warning-text":  "#c09040",
  "--c-warning-bg":    "#221c0e",
  "--c-warning-border":"#504028",
  "--c-chip-bg":       "#2c2a28",
  "--c-input-bg":      "#1e1c1a",
  "--c-divider":       "#383632",
  "--c-overlay":       "rgba(0,0,0,0.72)",
  "--c-info":          "#5a9ec0",
  "--c-info-bg":       "#162028",
};

export function UIProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useLocalStorage<boolean>("ui_dark_mode", false);
  const [textScale, setTextScale] = useLocalStorage<TextScale>("ui_text_scale", "md");

  // Keep body background in sync for the phone status bar / browser chrome
  useEffect(() => {
    document.body.style.background = darkMode ? "#1a1918" : "#f5f4f0";
  }, [darkMode]);

  return (
    <UIContext.Provider value={{
      darkMode,
      toggleDarkMode: () => setDarkMode(v => !v),
      textScale,
      setTextScale,
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
