import type { CSSProperties } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { groupBy } from "../utils/helpers";
import { S } from "../styles/appStyles";
import { MenuItemCard } from "./MenuItemCard";
import type { MenuItem, OrderItem, Subcategory } from "../types";

interface MenuGridProps {
  filteredItems: MenuItem[];
  subcategoryConfig: Subcategory[];
  searchQuery: string;
  unsent: OrderItem[];
  onTap: (item: MenuItem) => void;
  onLongPress: (item: MenuItem) => void;
}

export function MenuGrid({
  filteredItems,
  subcategoryConfig,
  searchQuery,
  unsent,
  onTap,
  onLongPress,
}: MenuGridProps) {
  const { isTablet, isTabletLandscape, isDesktop } = useBreakpoint();
  const menuGridStyle = isDesktop || isTabletLandscape ? S.grid4TabletLandscape : isTablet ? S.grid4Tablet : S.grid4;

  if (filteredItems.length === 0) {
    return (
      <div style={S.noResults as CSSProperties}>
        <span style={S.noResultsText as CSSProperties}>No items found for "{searchQuery}"</span>
      </div>
    );
  }

  const grouped = groupBy(filteredItems, "subcategory") as Record<string, MenuItem[]>;

  return (
    <div style={menuGridStyle}>
      {Object.entries(grouped).map(([subcategoryId, items]) => {
        const subcategoryObj = subcategoryConfig.find((subcategory) => subcategory.id === subcategoryId);
        const subcategoryLabel = subcategoryObj?.label || subcategoryId;

        return (
          <div key={subcategoryId} style={{ gridColumn: "1 / -1", display: "contents" }}>
            {subcategoryConfig.length > 0 && (
              <div style={S.subcategoryDivider as CSSProperties}>{subcategoryLabel}</div>
            )}
            {items.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                unsent={unsent}
                showCategory={!!searchQuery}
                onTap={onTap}
                onLongPress={onLongPress}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
