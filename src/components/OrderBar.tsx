import { useState } from "react";
import { useMenu } from "../contexts/MenuContext";
import { useTable } from "../contexts/TableContext";
import { groupByDestination, DESTINATIONS, DEST_LABELS } from "../utils/batchGrouping";
import { S } from "../styles/appStyles";
import type { OrderItem, Batch, TableId } from "../types";

interface OrderBarProps {
  tableId: TableId;
  unsent: OrderItem[];
  batches: Batch[];
  expanded: boolean;
  onToggleExpand: () => void;
  onAddItem: (item: any, variant: any) => void;
  onSendOrder?: () => void;
}

export function OrderBar({ tableId, unsent, batches, expanded, onToggleExpand, onAddItem, onSendOrder }: OrderBarProps) {
  const table = useTable();
  const { menu } = useMenu();
  const sentMode = unsent.length === 0;
  const [firing, setFiring] = useState(false);

  const handleSend = () => {
    if (firing) return;
    setFiring(true);
    setTimeout(() => {
      table.sendOrder(tableId);
      onSendOrder?.();
    }, 500);
    setTimeout(() => setFiring(false), 600);
  };

  const allMarked = batches.length > 0 && batches.every((_, i) => table.markedBatches[tableId]?.has(i));
  const statusDotColor = allMarked ? "#52b87a" : "#e05252";

  return (
    <div style={S.orderBar}>
      <div style={S.orderBarHandle} onClick={onToggleExpand}>
        <div style={S.orderBarHandleLine} />
        {sentMode ? (
          <span style={{ ...S.orderBarHandleText, display: "flex", alignItems: "center", gap: 6, animation: "fadeIn 0.4s ease-out" }}>
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
        <div style={{
          display: "grid",
          gridTemplateRows: expanded ? "1fr" : "0fr",
          transition: "grid-template-rows 0.35s ease-out",
          animation: "slideUpFade 0.4s ease-out",
          animationFillMode: "both",
        }}>
          <div style={{ overflow: "hidden" }}>
            {[...batches].reverse().map((batch, batchIdx) => {
              const actualBatchIdx = batches.length - 1 - batchIdx;
              const isMarked = table.markedBatches[tableId]?.has(actualBatchIdx) || false;
              const accentColor = isMarked ? "#52b87a" : "#e05252";
              const sectionStyle = { ...S.sentSection, ...(isMarked ? S.sentSectionMarked : S.sentSectionPending) };
              const batchByDest = groupByDestination(batch.items);
              const ts = typeof batch.timestamp === "string" ? new Date(batch.timestamp) : batch.timestamp;
              return (
                <div key={actualBatchIdx}>
                  <div style={S.sentDivider}>
                    <div style={{ ...S.sentDividerLine, background: accentColor }} />
                    <span style={S.sentDividerText}>
                      Sent {ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <button style={{ ...S.markBtn, borderColor: accentColor }} onClick={() => {
                      table.toggleMarkBatch(tableId, actualBatchIdx);
                      // Only close slider if marking the last unmarked batch
                      const willBeMarked = !isMarked;
                      if (willBeMarked) {
                        // Check if all other batches are already marked
                        const allOthersMarked = batches.every((_, i) =>
                          i === actualBatchIdx || table.markedBatches[tableId]?.has(i)
                        );
                        if (allOthersMarked) {
                          onToggleExpand(); // Close only if this was the last one
                        }
                      }
                      // If unmarking, keep slider open
                    }}>
                      {isMarked ? "Unmark" : "Mark"}
                    </button>
                    <div style={{ ...S.sentDividerLine, background: accentColor }} />
                  </div>
                  {DESTINATIONS.map((dest) => batchByDest[dest].length > 0 && (
                    <div key={dest} style={sectionStyle}>
                      <span style={S.sentLabel}>{DEST_LABELS[dest]}</span>
                      {batchByDest[dest].map((o) => (
                        <div key={o.id} style={S.sentItem}>
                          <span>
                            {o.qty}× {(o as any).shortName || o.name}
                            {o.note && <span style={{ fontSize: 11, color: "#888", fontStyle: "italic", marginLeft: 4 }}>({o.note})</span>}
                          </span>
                          <span style={S.sentPrice}>{(o.price * o.qty).toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div style={expanded ? S.orderBarList : S.orderBarListCollapsed}>
            {unsent.slice().reverse().map((o) => (
              <div key={o.id} style={S.orderBarItemWrapper}>
                <div style={S.orderBarItem}>
                  <div style={S.orderBarItemInfo}>
                    <div style={S.orderBarItemName}>{o.name}</div>
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
                        const baseItem = (o as any).baseId && o.category
                          ? (menu as any)[o.category]?.find((i: any) => i.id === (o as any).baseId) || o
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
          <button
            style={{
              ...S.sendBtn,
              ...(firing ? { animation: "confirmFlash 0.6s ease-out", transition: "none" } : {}),
            }}
            onClick={handleSend}
          >
            Confirm
          </button>
        </>
      )}
    </div>
  );
}
