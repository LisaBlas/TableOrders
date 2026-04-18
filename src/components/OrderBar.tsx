import { MENU } from "../data/constants";
import { useTable } from "../contexts/TableContext";
import { getItemDestination } from "../utils/helpers";
import { S } from "../styles/appStyles";
import type { OrderItem, Batch, TableId } from "../types";

interface OrderBarProps {
  tableId: TableId;
  unsent: OrderItem[];
  batches: Batch[];
  expanded: boolean;
  onToggleExpand: () => void;
  onAddItem: (item: any, variant: any) => void;
}

export function OrderBar({ tableId, unsent, batches, expanded, onToggleExpand, onAddItem }: OrderBarProps) {
  const table = useTable();
  const sentMode = unsent.length === 0;

  const allMarked = batches.length > 0 && batches.every((_, i) => table.markedBatches[tableId]?.has(i));
  const statusDotColor = allMarked ? "#52b87a" : "#e05252";

  return (
    <div style={S.orderBar}>
      <div style={S.orderBarHandle} onClick={onToggleExpand}>
        <div style={S.orderBarHandleLine} />
        {sentMode ? (
          <span style={{ ...S.orderBarHandleText, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusDotColor, display: "inline-block", flexShrink: 0 }} />
            {expanded ? "Hide sent" : `${batches.length} batch${batches.length > 1 ? "es" : ""} sent`}
          </span>
        ) : (
          unsent.length > 1 && (
            <span style={S.orderBarHandleText}>
              {expanded ? "Show less" : `${unsent.length} items`}
            </span>
          )
        )}
      </div>

      {sentMode ? (
        expanded && (
          <div>
            {[...batches].reverse().map((batch, batchIdx) => {
              const actualBatchIdx = batches.length - 1 - batchIdx;
              const isMarked = table.markedBatches[tableId]?.has(actualBatchIdx) || false;
              const accentColor = isMarked ? "#52b87a" : "#e05252";
              const sectionStyle = { ...S.sentSection, ...(isMarked ? S.sentSectionMarked : S.sentSectionPending) };
              const batchByDest: Record<string, OrderItem[]> = { bar: [], counter: [], kitchen: [] };
              batch.items.forEach((item: OrderItem) => {
                batchByDest[getItemDestination(item)].push(item);
              });
              const ts = typeof batch.timestamp === "string" ? new Date(batch.timestamp) : batch.timestamp;
              return (
                <div key={batchIdx}>
                  <div style={S.sentDivider}>
                    <div style={{ ...S.sentDividerLine, background: accentColor }} />
                    <span style={S.sentDividerText}>
                      Sent {ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <button style={{ ...S.markBtn, borderColor: accentColor }} onClick={() => {
                      table.toggleMarkBatch(tableId, actualBatchIdx);
                      onToggleExpand();
                    }}>
                      {isMarked ? "Unmark" : "Mark"}
                    </button>
                    <div style={{ ...S.sentDividerLine, background: accentColor }} />
                  </div>
                  {batchByDest.bar.length > 0 && (
                    <div style={sectionStyle}>
                      <span style={S.sentLabel}>🍷 Bar</span>
                      {batchByDest.bar.map((o) => (
                        <div key={o.id} style={S.sentItem}>
                          <span>
                            {o.qty}× {(o as any).posName || o.name}
                            {o.note && <span style={{ fontSize: 11, color: "#888", fontStyle: "italic", marginLeft: 4 }}>({o.note})</span>}
                          </span>
                          <span style={S.sentPrice}>{(o.price * o.qty).toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {batchByDest.counter.length > 0 && (
                    <div style={sectionStyle}>
                      <span style={S.sentLabel}>🧀 Counter</span>
                      {batchByDest.counter.map((o) => (
                        <div key={o.id} style={S.sentItem}>
                          <span>
                            {o.qty}× {(o as any).posName || o.name}
                            {o.note && <span style={{ fontSize: 11, color: "#888", fontStyle: "italic", marginLeft: 4 }}>({o.note})</span>}
                          </span>
                          <span style={S.sentPrice}>{(o.price * o.qty).toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {batchByDest.kitchen.length > 0 && (
                    <div style={sectionStyle}>
                      <span style={S.sentLabel}>🍽️ Kitchen</span>
                      {batchByDest.kitchen.map((o) => (
                        <div key={o.id} style={S.sentItem}>
                          <span>
                            {o.qty}× {(o as any).posName || o.name}
                            {o.note && <span style={{ fontSize: 11, color: "#888", fontStyle: "italic", marginLeft: 4 }}>({o.note})</span>}
                          </span>
                          <span style={S.sentPrice}>{(o.price * o.qty).toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <>
          <div style={expanded ? S.orderBarList : S.orderBarListCollapsed}>
            {(expanded ? unsent.slice().reverse() : unsent.slice(-1)).map((o) => (
              <div key={o.id} style={S.orderBarItemWrapper}>
                <div style={S.orderBarItem}>
                  <div style={S.orderBarItemInfo}>
                    <div style={S.orderBarItemName}>{(o as any).posName || o.name}</div>
                    {o.note && (
                      <div style={{ fontSize: 11, color: "#888", fontStyle: "italic", marginTop: 1 }}>
                        {o.note}
                      </div>
                    )}
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
            Confirm
          </button>
        </>
      )}
    </div>
  );
}
