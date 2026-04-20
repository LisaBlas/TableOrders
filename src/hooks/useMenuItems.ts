import { useMemo } from "react";
import { useMenu } from "../contexts/MenuContext";
import type { MenuItem } from "../types";

interface UseMenuItemsParams {
  activeCategory: string;
  selectedSubcategory: string | null;
  searchQuery: string;
}

export function useMenuItems({
  activeCategory,
  selectedSubcategory,
  searchQuery,
}: UseMenuItemsParams): MenuItem[] {
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

    // Special handling for Bottles category: wines with glass sizes first, then static bottles
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

    // Special handling for Drinks category: exclude wines entirely, hide bottle variants on others
    if (activeCategory === "Drinks") {
      let items =
        (MENU as any)["Drinks"]
          ?.map((item: any) => {
            // Exclude wine items — they now live in the Bottles tab
            if (item.subcategory === "wine") return null;
            // If item has variants, filter out bottle variants
            if (item.variants) {
              const filteredVariants = item.variants.filter((v: any) => !v.bottleSubcategory);
              // Only include item if it has non-bottle variants
              if (filteredVariants.length > 0) {
                return {
                  ...item,
                  category: "Drinks",
                  variants: filteredVariants,
                };
              }
              return null;
            }
            // Regular items without variants
            return { ...item, category: "Drinks" };
          })
          .filter(Boolean) || [];

      if (selectedSubcategory) {
        items = items.filter((item: any) => item.subcategory === selectedSubcategory);
      }

      return items;
    }

    // Default category handling (Food, Shop, etc.)
    let items = (MENU as any)[activeCategory]?.map((item: any) => ({ ...item, category: activeCategory })) || [];
    if (selectedSubcategory) {
      items = items.filter((item: any) => item.subcategory === selectedSubcategory);
    }
    return items;
  }, [MENU, activeCategory, selectedSubcategory, searchQuery]);
}
