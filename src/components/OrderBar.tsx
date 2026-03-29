import { MENU } from "../data/constants";
import { useTable } from "../contexts/TableContext";
import { S } from "../styles/appStyles";
import type { OrderItem, TableId, MenuCategory } from "../types";

interface OrderBarProps {
  tableId: TableId;
  unsent: OrderItem[];
  unsentTotal: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onAddItem: (item: any, variant: any) => void;
}

export function OrderBar({ tableId, unsent, unsentTotal, expanded, onToggleExpand, onAddItem }: OrderBarProps) {
  const table = useTable();

  return (
    <div style={S.orderBar}>
      <div style={S.orderBarHandle} onClick={onToggleExpand}>
        <div style={S.orderBarHandleLine} />
        {unsent.length > 1 && (
          <span style={S.orderBarHandleText}>
            {expanded ? "Show less" : `${unsent.length} items`}
          </span>
        )}
      </div>
      <div style={expanded ? S.orderBarList : S.orderBarListCollapsed}>
        {(expanded ? unsent.slice().reverse() : unsent.slice(-1)).map((o) => (
          <div key={o.id} style={S.orderBarItemWrapper}>
            <div style={S.orderBarItem}>
              <div style={S.orderBarItemInfo}>
                <div style={S.orderBarItemName}>{o.name}</div>
                <div style={S.orderBarItemPrice}>{o.price.toFixed(2)}€</div>
              </div>
              <div style={S.orderBarItemControls}>
                <button style={S.orderBarQtyBtn} onClick={() => table.removeItem(tableId, o.id)}>−</button>
                <span style={S.orderBarQtyNum}>{o.qty}</span>
                <button
                  style={S.orderBarQtyBtn}
                  onClick={() => {
                    const baseItem = (o as any).baseId
                      ? (MENU as any)[o.category]?.find((i: any) => i.id === (o as any).baseId) || o
                      : o;
                    const variant = (o as any).variantType
                      ? baseItem.variants?.find((v: any) => v.type === (o as any).variantType)
                      : null;
                    onAddItem(baseItem, variant);
                  }}
                >+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button style={S.sendBtn} onClick={() => table.sendOrder(tableId)}>
        Send — {unsentTotal.toFixed(2)}€
      </button>
    </div>
  );
}
