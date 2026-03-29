import { S } from "../styles/appStyles";
import type { OrderItem } from "../types";

interface MenuItemRowProps {
  item: any;
  unsent: OrderItem[];
  showCategory?: boolean;
  onAddItem: (item: any, variant?: any) => void;
}

export function MenuItemRow({ item, unsent, showCategory = false, onAddItem }: MenuItemRowProps) {
  if (item.variants) {
    return (
      <div key={item.id} style={S.menuItem}>
        <div style={S.menuItemInfo}>
          <span style={S.menuItemName}>
            {item.name}
            {showCategory && <span style={S.menuItemCategory}> · {item.category}</span>}
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
          {(item.category === "Bottles 🍾" ? item.variants.slice().reverse() : item.variants).map((variant: any) => {
            const variantId = `${item.id}-${variant.type}`;
            const unsentQty = unsent.find((o) => o.id === variantId)?.qty || 0;
            return (
              <button key={variant.type} style={S.variantBtn} onClick={() => onAddItem(item, variant)}>
                <span style={S.variantLabel}>{variant.label}{unsentQty > 0 && ` (${unsentQty})`}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const unsentQty = unsent.find((o) => o.id === item.id)?.qty || 0;
  return (
    <div key={item.id} style={S.menuItem}>
      <div style={S.menuItemInfo}>
        <span style={S.menuItemName}>
          {item.name}
          {showCategory && <span style={S.menuItemCategory}> · {item.category}</span>}
        </span>
        <span style={S.menuItemPrice}>{item.price.toFixed(2)}€</span>
      </div>
      <button style={S.variantBtn} onClick={() => onAddItem(item)}>
        <span style={S.variantLabel}>Add{unsentQty > 0 && ` (${unsentQty})`}</span>
      </button>
    </div>
  );
}
