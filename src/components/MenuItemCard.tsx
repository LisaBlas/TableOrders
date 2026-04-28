import { S } from "../styles/appStyles";
import { useLongPress } from "../hooks/useLongPress";
import { LONG_PRESS_MS } from "../config/appConfig";
import type { MenuItem, OrderItem } from "../types";

interface MenuItemCardProps {
  item: MenuItem;
  unsent: OrderItem[];
  showCategory?: boolean;
  onTap: (item: MenuItem) => void;
  onLongPress?: (item: MenuItem) => void;
}

export function MenuItemCard({ item, unsent, showCategory, onTap, onLongPress }: MenuItemCardProps) {
  const { start, cancel, didFireRef } = useLongPress<MenuItem>(
    (mi) => onLongPress?.(mi),
    LONG_PRESS_MS,
  );

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
  const displayName = item.shortName || item.name;

  const WINE_COLORS: Record<string, string> = {
    white: "#e8c84a",
    red: "#c0392b",
    sparkling: "#999",
    natural: "#7c3aed",
    rosé: "#e88ea0",
  };
  const wineColor = item.wineType ? WINE_COLORS[item.wineType] : undefined;

  const handleClick = () => {
    if (didFireRef.current) return;
    cancel();
    onTap(item);
  };

  return (
    <button
      style={S.menuCard}
      onPointerDown={() => { if (onLongPress) start(item); else didFireRef.current = false; }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      {unsentQty > 0 && (
        <span style={S.menuCardBadge}>({unsentQty})</span>
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
      <div style={S.menuCardName}>{displayName}</div>
      {showCategory && item.category && (
        <div style={{ fontSize: 9, color: "#999", marginTop: 2 }}>{item.category}</div>
      )}
    </button>
  );
}
