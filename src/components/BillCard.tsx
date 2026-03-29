import { S } from "../styles/appStyles";
import type { Bill } from "../types";

interface BillCardProps {
  bill: Bill;
  isEditing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onRemoveItem: (itemId: string) => void;
}

export function BillCard({ bill, isEditing, onEdit, onDone, onCancel, onDelete, onRemoveItem }: BillCardProps) {
  return (
    <div style={S.billCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={S.billTableNum}>Table {bill.tableId}</span>
            <span style={{ fontSize: 12, color: "#888" }}>
              {new Date(bill.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div style={{ ...S.billMeta, marginTop: 2 }}>
            {bill.paymentMode === "full"
              ? bill.gutschein
                ? <span style={{ color: "#2d7a3a", fontWeight: 600 }}>Full payment (Gutschein: {bill.gutschein.toFixed(2)}€)</span>
                : "Full payment"
              : bill.paymentMode === "equal"
              ? `Split ${(bill.splitData as any)?.guests} ways`
              : `Split by item (${(bill.splitData as any)?.payments?.length} guests)`}
            {(bill as any).tip !== undefined && (
              <div style={{ color: (bill as any).tip >= 0 ? "#2d5a35" : "#c0392b" }}>
                Tip: {(bill as any).tip >= 0 ? `+${(bill as any).tip.toFixed(2)}€` : `${(bill as any).tip.toFixed(2)}€`}
              </div>
            )}
          </div>
        </div>
        {!isEditing ? (
          <button style={S.editBillBtn} onClick={onEdit}>Edit</button>
        ) : (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button style={S.doneEditBtn} onClick={onDone}>Done</button>
            <button style={S.cancelEditBtn} onClick={onCancel}>Cancel</button>
            <button style={S.deleteBillBtnIcon} onClick={onDelete} title="Delete this bill">🗑️</button>
          </div>
        )}
      </div>
      <div style={{ height: 0, borderTop: "2px dashed #d4d2ca", margin: "10px 0 8px" }} />
      <div style={S.billItemsList}>
        {bill.items.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center" as const, color: "#999", fontSize: 14, fontStyle: "italic" }}>
            No items in this bill
          </div>
        ) : (
          bill.items.map((item) => (
            <div key={item.id} style={isEditing ? S.billItemEditable : S.billItem}>
              {isEditing && (
                <button style={S.billItemRemoveBtn} onClick={() => onRemoveItem(item.id)} title="Remove one">−</button>
              )}
              <span style={S.billItemName}>
                <span style={S.billItemQty}>{item.qty}×</span>
                {item.name}
              </span>
              <span style={S.billItemPrice}>{(item.price * item.qty).toFixed(2)}€</span>
            </div>
          ))
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <span style={S.billTotal}>{bill.total.toFixed(2)}€</span>
      </div>
    </div>
  );
}
