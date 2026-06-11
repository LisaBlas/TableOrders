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

export function UIProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useLocalStorage<boolean>("ui_dark_mode", false);
  const [textScale, setTextScale] = useLocalStorage<TextScale>("ui_text_scale", "md");

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
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
