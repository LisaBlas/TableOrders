import { useMemo } from "react";
import { useMenu } from "../contexts/MenuContext";
import type { MenuItem } from "../types";

interface UseMenuItemsParams {
  activeCategory: string;
  searchQuery: string;
}

const WINE_TYPE_ORDER: Record<string, number> = {
  white: 0,
  red: 1,
  rose: 2,
  sparkling: 3,
  sparkly: 3,
  natural: 4,
};

function getWineTypeOrder(item: MenuItem) {
  const wineType = item.wineType
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return wineType ? WINE_TYPE_ORDER[wineType] ?? 99 : 99;
}

export function useMenuItems({ activeCategory, searchQuery }: UseMenuItemsParams): MenuItem[] {
  const { menu: MENU } = useMenu();

  return useMemo(() => {
    // Search across all categories
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const results: MenuItem[] = [];
      Object.entries(MENU).forEach(([category, items]) => {
        items.forEach((item) => {
          if (
            item.name.toLowerCase().includes(query) ||
            (item.shortName && item.shortName.toLowerCase().includes(query))
          ) {
            results.push({ ...item, category });
          }
        });
      });
      return results;
    }

    // Special handling for Wines: wines with glass sizes first, then static bottles
    if (activeCategory === "Wines") {
      const winesWithGlasses =
        MENU["Drinks"]
          ?.filter((item) => item.variants?.some((v) => v.bottleSubcategory))
          .map((item) => ({
            ...item,
            category: "Wines",
            subcategory: "glass",
            wineType: item.variants?.find((v) => v.bottleSubcategory)?.bottleSubcategory,
          }))
          .sort((a, b) => getWineTypeOrder(a) - getWineTypeOrder(b)) || [];

      const staticBottles =
        MENU["Wines"]?.map((item) => ({
          ...item,
          category: "Wines",
          subcategory: "bottle",
          wineType: item.subcategory,
        }))
          .sort((a, b) => getWineTypeOrder(a) - getWineTypeOrder(b)) || [];

      return [...winesWithGlasses, ...staticBottles];
    }

    // Special handling for Drinks: exclude wines, hide bottle variants
    if (activeCategory === "Drinks") {
      const drinks = MENU["Drinks"]
        ?.map((item) => {
          if (item.subcategory === "wine") return null;
          if (item.variants) {
            const filteredVariants = item.variants.filter((v) => !v.bottleSubcategory);
            return filteredVariants.length > 0 ? { ...item, category: "Drinks", variants: filteredVariants } : null;
          }
          return { ...item, category: "Drinks" };
        })
        .filter((item) => item !== null) as MenuItem[];
      return drinks || [];
    }

    // Default (Food, Shop, etc.)
    return MENU[activeCategory]?.map((item) => ({ ...item, category: activeCategory })) || [];
  }, [MENU, activeCategory, searchQuery]);
}
