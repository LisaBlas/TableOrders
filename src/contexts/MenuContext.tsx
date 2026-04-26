import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { MENU, MIN_QTY_2_IDS } from "../data/constants";
import { fetchMenu } from "../services/directusMenu";
import { withRetry } from "../utils/fetchWithRetry";

interface MenuContextValue {
  menu: Record<string, any[]>;
  minQty2Ids: Set<string>;
  menuLoading: boolean;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<Record<string, any[]>>(MENU as any);
  const [minQty2Ids, setMinQty2Ids] = useState<Set<string>>(MIN_QTY_2_IDS as Set<string>);
  const [menuLoading, setMenuLoading] = useState(true);

  useEffect(() => {
    withRetry(() => fetchMenu(), 3, 800)
      .then(({ menu, minQty2Ids }) => {
        setMenu(menu);
        setMinQty2Ids(minQty2Ids);
      })
      .catch((err) => {
        console.warn("Directus unavailable after retries, using static menu:", err.message);
      })
      .finally(() => setMenuLoading(false));
  }, []);

  return (
    <MenuContext.Provider value={{ menu, minQty2Ids, menuLoading }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used within MenuProvider");
  return ctx;
}
