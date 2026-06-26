import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { MENU, MIN_QTY_2_IDS } from "../data/constants";
import { fetchMenu } from "../services/directusMenu";
import { fetchSubcategories } from "../services/directusSubcategories";
import { withRetry } from "../utils/fetchWithRetry";
import type { MenuItem, Subcategory } from "../types";

const MENU_CACHE_KEY = "menu_cache";
const MENU_MIN_QTY_CACHE_KEY = "menu_min_qty2_ids";
const SUBCATEGORIES_CACHE_KEY = "subcategories_cache";

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

function loadCachedSubcategories(): Record<string, Subcategory[]> {
  try {
    const stored = localStorage.getItem(SUBCATEGORIES_CACHE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, Subcategory[]>;
      }
    }
  } catch { /* ignore */ }
  return {};
}

interface MenuContextValue {
  menu: Record<string, MenuItem[]>;
  minQty2Ids: Set<string>;
  subcategories: Record<string, Subcategory[]>;
  menuLoading: boolean;
  reloadMenu: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<Record<string, MenuItem[]>>(() => loadCachedMenu());
  const [minQty2Ids, setMinQty2Ids] = useState<Set<string>>(() => loadCachedMinQty2Ids());
  const [subcategories, setSubcategories] = useState<Record<string, Subcategory[]>>(() => loadCachedSubcategories());
  const [menuLoading, setMenuLoading] = useState(true);

  const loadMenu = useCallback(() => {
    Promise.all([
      withRetry(() => fetchMenu(), 3, 800),
      withRetry(() => fetchSubcategories(), 3, 800),
    ])
      .then(([{ menu, minQty2Ids }, subcats]) => {
        setMenu(menu);
        setMinQty2Ids(minQty2Ids);
        setSubcategories(subcats);
        try {
          localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(menu));
          localStorage.setItem(MENU_MIN_QTY_CACHE_KEY, JSON.stringify([...minQty2Ids]));
          localStorage.setItem(SUBCATEGORIES_CACHE_KEY, JSON.stringify(subcats));
        } catch { /* ignore quota errors */ }
      })
      .catch((err) => {
        console.warn("Directus unavailable after retries, using cached data:", err.message);
      })
      .finally(() => setMenuLoading(false));
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  return (
    <MenuContext.Provider value={{ menu, minQty2Ids, subcategories, menuLoading, reloadMenu: loadMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used within MenuProvider");
  return ctx;
}
