import { S } from "../styles/appStyles";
import type { Bill } from "../types";

interface BillCardProps {
  bill: Bill;
  isEditing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onRemoveItem: (itemId: string) => void;
}

export function BillCard({ bill, isEditing, onEdit, onDone, onCancel, onDelete, onRestore, onRemoveItem }: BillCardProps) {
  const cardStyle = bill.addedToPOS
    ? { ...S.billCard, background: "#fff5f5", borderColor: "#f5c2c2" }
    : S.billCard;

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" as const }}>
            <span style={S.billTableNum}>Table {bill.tableId}</span>
            <span style={{ fontSize: 12, color: "#888" }}>
              {new Date(bill.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
            {bill.addedToPOS && (
              <span style={S.addedToPOSLabel}>Added To POS</span>
            )}
          </div>
          <div style={{ ...S.billMeta, marginTop: 2 }}>
            {bill.paymentMode === "full"
              ? bill.gutschein
                ? <span style={{ color: "#2d7a3a", fontWeight: 600 }}>Full payment (Gutschein: {bill.gutschein.toFixed(2)}€)</span>
                : "Full payment"
              : bill.paymentMode === "equal"
              ? `Split ${(bill.splitData as any)?.guests} ways`
              : `Split by item (${(bill.splitData as any)?.payments?.length} guests)`}
            {bill.paymentMode !== "full" && bill.gutschein && bill.gutschein > 0 && (
              <div style={{ color: "#2d7a3a", fontWeight: 600 }}>
                Gutschein: -{bill.gutschein.toFixed(2)}€
              </div>
            )}
            {(bill as any).tip !== undefined && (
              <div style={{ color: (bill as any).tip >= 0 ? "#2d5a35" : "#c0392b" }}>
                Tip: {(bill as any).tip >= 0 ? `+${(bill as any).tip.toFixed(2)}€` : `${(bill as any).tip.toFixed(2)}€`}
              </div>
            )}
          </div>
        </div>
        {bill.addedToPOS ? (
          <button style={S.editBillBtn} onClick={onRestore} title="Restore bill">↩️</button>
        ) : !isEditing ? (
          <button style={S.editBillBtn} onClick={onEdit}>✏️</button>
        ) : (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button style={S.doneEditBtn} onClick={onDone}>Done</button>
            <button style={S.cancelEditBtn} onClick={onCancel}>Cancel</button>
            <button style={S.deleteBillBtnIcon} onClick={onDelete} title="Mark as Added To POS">🗑️</button>
          </div>
        )}
      </div>
      <div style={{ height: 0, borderTop: "2px dashed #d4d2ca", margin: "10px 0 8px" }} />
      <div style={S.billItemsList}>
        {bill.items.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center" as const, color: "#999", fontSize: 14, fontStyle: "italic" }}>
            No items in this bill
          </div>
        ) : (() => {
          type DisplayItem = (typeof bill.items)[0] & { displayQty: number };
          const activeItems: DisplayItem[] = [];
          const crossedItems: DisplayItem[] = [];
          bill.items.forEach((item) => {
            const cQty = item.crossedQty ?? (item.crossed ? item.qty : 0);
            const aQty = item.qty - cQty;
            if (aQty > 0) activeItems.push({ ...item, displayQty: aQty });
            if (cQty > 0) crossedItems.push({ ...item, displayQty: cQty });
          });
          return (
            <>
              {activeItems.map((item) => (
                <div key={item.id} style={isEditing ? S.billItemEditable : S.billItem}>
                  {isEditing && !bill.addedToPOS && (
                    <button style={S.billItemRemoveBtn} onClick={() => onRemoveItem(item.id)} title="Remove one">−</button>
                  )}
                  <span style={S.billItemName}>
                    <span style={S.billItemQty}>{item.displayQty}×</span>
                    {item.name}
                  </span>
                  <span style={S.billItemPrice}>
                    {(item.price * item.displayQty).toFixed(2)}€
                  </span>
                </div>
              ))}
              {crossedItems.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#aaa", textTransform: "uppercase" as const, marginTop: 8, marginBottom: 2 }}>
                    Added to POS
                  </div>
                  {crossedItems.map((item) => (
                    <div key={`crossed-${item.id}`} style={S.billItem}>
                      <span style={{ ...S.billItemName, ...S.billItemCrossed }}>
                        <span style={S.billItemQty}>{item.displayQty}×</span>
                        {item.name}
                      </span>
                      <span style={{ ...S.billItemPrice, ...S.billItemCrossed }}>
                        {(item.price * item.displayQty).toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </>
              )}
            </>
          );
        })()}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <span style={S.billTotal}>{bill.total.toFixed(2)}€</span>
      </div>
    </div>
  );
}
