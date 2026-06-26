import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { MENU, MIN_QTY_2_IDS } from "../data/constants";
import { fetchMenu } from "../services/directusMenu";
import { withRetry } from "../utils/fetchWithRetry";
import type { MenuItem } from "../types";

const MENU_CACHE_KEY = "menu_cache";
const MENU_MIN_QTY_CACHE_KEY = "menu_min_qty2_ids";

function loadCachedMenu(): Record<string, MenuItem[]> {
  try {
    const stored = localStorage.getItem(MENU_CACHE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, MenuItem[]>;
      }
    }
  } catch { /* ignore */ }
  return MENU;
}

function loadCachedMinQty2Ids(): Set<string> {
  try {
    const stored = localStorage.getItem(MENU_MIN_QTY_CACHE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) return new Set(parsed as string[]);
    }
  } catch { /* ignore */ }
  return new Set(MIN_QTY_2_IDS);
}

interface MenuContextValue {
  menu: Record<string, MenuItem[]>;
  minQty2Ids: Set<string>;
  menuLoading: boolean;
  reloadMenu: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<Record<string, MenuItem[]>>(() => loadCachedMenu());
  const [minQty2Ids, setMinQty2Ids] = useState<Set<string>>(() => loadCachedMinQty2Ids());
  const [menuLoading, setMenuLoading] = useState(true);

  const loadMenu = useCallback(() => {
    withRetry(() => fetchMenu(), 3, 800)
      .then(({ menu, minQty2Ids }) => {
        setMenu(menu);
        setMinQty2Ids(minQty2Ids);
        try {
          localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(menu));
          localStorage.setItem(MENU_MIN_QTY_CACHE_KEY, JSON.stringify([...minQty2Ids]));
        } catch { /* ignore quota errors */ }
      })
      .catch((err) => {
        console.warn("Directus unavailable after retries, using cached menu:", err.message);
      })
      .finally(() => setMenuLoading(false));
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  return (
    <MenuContext.Provider value={{ menu, minQty2Ids, menuLoading, reloadMenu: loadMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used within MenuProvider");
  return ctx;
}
