import { useRef } from "react";
import { S } from "../styles/appStyles";
import type { MenuItem, OrderItem } from "../types";

const LONG_PRESS_MS = 500;

interface MenuItemCardProps {
  item: MenuItem;
  unsent: OrderItem[];
  showCategory?: boolean;
  onTap: (item: MenuItem) => void;
  onLongPress?: (item: MenuItem) => void;
}

export function MenuItemCard({ item, unsent, showCategory, onTap, onLongPress }: MenuItemCardProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFiredRef = useRef(false);

  const getUnsentQty = () => {
    if (item.variants) {
      return item.variants.reduce((sum, variant) => {
        const variantId = `${item.id}-${variant.type}`;
        const unsentItem = unsent.find((u) => u.id === variantId);
        return sum + (unsentItem?.qty || 0);
      }, 0);
    } else {
      const unsentItem = unsent.find((u) => u.id === item.id);
      return unsentItem?.qty || 0;
    }
  };

  const unsentQty = getUnsentQty();
  const displayName = (item as any).posName || item.name;

  const WINE_COLORS: Record<string, string> = {
    white: "#e8c84a",
    red: "#c0392b",
    sparkling: "#999",
    natural: "#7c3aed",
    rosé: "#e88ea0",
  };
  const wineColor = WINE_COLORS[(item as any).wineType];

  const startPress = () => {
    longFiredRef.current = false;
    if (onLongPress) {
      timerRef.current = setTimeout(() => {
        longFiredRef.current = true;
        onLongPress(item);
      }, LONG_PRESS_MS);
    }
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = () => {
    if (longFiredRef.current) return;
    cancelPress();
    onTap(item);
  };

  return (
    <button
      style={S.menuCard as any}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      {unsentQty > 0 && (
        <span style={S.menuCardBadge as any}>({unsentQty})</span>
      )}
      {wineColor && (
        <span style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: wineColor,
          marginBottom: 4,
        }} />
      )}
      <div style={S.menuCardName as any}>{displayName}</div>
      {showCategory && (item as any).category && (
        <div style={{ fontSize: 9, color: "#999", marginTop: 2 }}>{(item as any).category}</div>
      )}
    </button>
  );
}
