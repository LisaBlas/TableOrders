import { useMemo } from "react";
import { useMenu } from "../contexts/MenuContext";
import type { MenuItem } from "../types";

interface UseMenuItemsParams {
  activeCategory: string;
  searchQuery: string;
}

export function useMenuItems({ activeCategory, searchQuery }: UseMenuItemsParams): MenuItem[] {
  const { menu: MENU } = useMenu();

  return useMemo(() => {
    // Search across all categories
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const results: MenuItem[] = [];
      Object.entries(MENU).forEach(([category, items]: [string, any[]]) => {
        items.forEach((item: any) => {
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
        (MENU as any)["Drinks"]
          ?.filter((item: any) => item.variants?.some((v: any) => v.bottleSubcategory))
          .map((item: any) => ({
            ...item,
            category: "Wines",
            subcategory: "glass",
            wineType: item.variants.find((v: any) => v.bottleSubcategory)?.bottleSubcategory,
          })) || [];

      const staticBottles =
        (MENU as any)["Wines"]?.map((item: any) => ({
          ...item,
          category: "Wines",
          subcategory: "bottle",
          wineType: item.subcategory,
        })) || [];

      return [...winesWithGlasses, ...staticBottles];
    }

    // Special handling for Drinks: exclude wines, hide bottle variants
    if (activeCategory === "Drinks") {
      return (MENU as any)["Drinks"]
        ?.map((item: any) => {
          if (item.subcategory === "wine") return null;
          if (item.variants) {
            const filteredVariants = item.variants.filter((v: any) => !v.bottleSubcategory);
            return filteredVariants.length > 0 ? { ...item, category: "Drinks", variants: filteredVariants } : null;
          }
          return { ...item, category: "Drinks" };
        })
        .filter(Boolean) || [];
    }

    // Default (Food, Shop, etc.)
    return (MENU as any)[activeCategory]?.map((item: any) => ({ ...item, category: activeCategory })) || [];
  }, [MENU, activeCategory, searchQuery]);
}
