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

    // Wines tab: glass wines come from Drinks (items with bottleSubcategory variants) OR from
    // Wines (if already migrated there); bottle-only wines come from Wines. Merging both sources
    // keeps the tab working regardless of whether the Directus migration has happened.
    if (activeCategory === "Wines") {
      const glassWines = (MENU["Drinks"] ?? [])
        .filter((item) => item.variants?.some((v) => v.bottleSubcategory))
        .map((item) => ({
          ...item,
          category: "Wines",
          subcategory: "glass",
          wineType: item.variants?.find((v) => v.bottleSubcategory)?.bottleSubcategory,
        }));

      const winesEntries = (MENU["Wines"] ?? []).map((item) => {
        const isGlass = item.variants?.some((v) => v.bottleSubcategory);
        return isGlass
          ? {
              ...item,
              category: "Wines",
              subcategory: "glass",
              wineType: item.variants?.find((v) => v.bottleSubcategory)?.bottleSubcategory,
            }
          : {
              ...item,
              category: "Wines",
              subcategory: "bottle",
              wineType: item.subcategory,
            };
      });

      return [...glassWines, ...winesEntries].sort((a, b) => getWineTypeOrder(a) - getWineTypeOrder(b));
    }

    // Drinks tab: exclude wine items (shown in Wines tab) and strip bottleSubcategory variants
    if (activeCategory === "Drinks") {
      return (MENU["Drinks"] ?? [])
        .map((item) => {
          if (item.subcategory === "wine") return null;
          if (item.variants) {
            const filteredVariants = item.variants.filter((v) => !v.bottleSubcategory);
            return filteredVariants.length > 0 ? { ...item, category: "Drinks", variants: filteredVariants } : null;
          }
          return { ...item, category: "Drinks" };
        })
        .filter((item): item is MenuItem => item !== null);
    }

    // Default (Food, Shop, etc.)
    return MENU[activeCategory]?.map((item) => ({ ...item, category: activeCategory })) || [];
  }, [MENU, activeCategory, searchQuery]);
}
