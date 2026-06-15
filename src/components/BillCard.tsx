import { useEffect } from "react";
import { S } from "../styles/appStyles";
import { colors } from "../styles/tokens";
import { EditIcon, ReopenIcon, TrashIcon } from "./icons";
import type { Bill } from "../types";

interface BillCardProps {
  bill: Bill;
  isExpanded: boolean;
  onToggle: () => void;
  isEditing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onRemoveItem: (itemId: string) => void;
  onRestoreItem: (itemId: string) => void;
}

export function BillCard({ bill, isExpanded, onToggle, isEditing, onEdit, onDone, onCancel, onDelete, onRestore, onRemoveItem, onRestoreItem }: BillCardProps) {
  useEffect(() => {
    if (isEditing && !isExpanded) onToggle();
  }, [isEditing]);

  const allItemsCrossed = bill.items.length > 0 && bill.items.every((item) => {
    const cQty = item.crossedQty ?? (item.crossed ? item.qty : 0);
    return cQty === item.qty;
  });

  const crossedCount = bill.items.reduce((sum, item) => {
    return sum + (item.crossedQty ?? (item.crossed ? item.qty : 0));
  }, 0);

  const posLabel = (bill.addedToPOS || allItemsCrossed)
    ? "In POS"
    : crossedCount > 0
    ? `${crossedCount} items in POS`
    : null;

  const cardStyle = S.billCard;

  const splitGuestCount = bill.splitData
    ? "payments" in bill.splitData
      ? bill.splitData.payments.length
      : bill.splitData.guests
    : null;

  const shortPaymentLabel = bill.paymentMode === "full"
    ? "Paid"
    : bill.paymentMode === "equal"
    ? `Split ${splitGuestCount ?? 0} ways`
    : splitGuestCount === null
    ? "Split by item"
    : `Split by item (${splitGuestCount})`;

  const itemCount = bill.items.reduce((sum, i) => sum + i.qty, 0);
  const timeStr = new Date(bill.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const billSubtitle = `${timeStr} · ${shortPaymentLabel}${itemCount > 0 ? ` · ${itemCount} item${itemCount !== 1 ? "s" : ""}` : ""}`;

  const handleToggle = () => {
    if (!isEditing) onToggle();
  };

  const chevron = (expanded: boolean) => (
    <span style={{
      fontSize: 16,
      color: colors.faint,
      lineHeight: 1,
      userSelect: "none",
      display: "inline-block",
      transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
      transition: "transform 0.18s ease",
      flexShrink: 0,
    }}>›</span>
  );

  if (!isExpanded) {
    return (
      <div style={{ ...cardStyle, cursor: "pointer" }} onClick={handleToggle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {chevron(false)}
              <span style={S.billTableNum}>{bill.tableId}</span>
              {posLabel && (
                <span style={S.addedToPOSLabel}>{posLabel}</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>{billSubtitle}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span style={S.billTotal}>{bill.total.toFixed(2)}€</span>
            {bill.tip !== undefined && (
              <span style={{ fontSize: 12, color: colors.muted }}>
                Tip €{Math.abs(bill.tip).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div style={{ ...cardStyle, cursor: isEditing ? "default" : "pointer" }} onClick={handleToggle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {chevron(true)}
            <span style={S.billTableNum}>{bill.tableId}</span>
            {posLabel && (
              <span style={S.addedToPOSLabel}>{posLabel}</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{billSubtitle}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            {bill.gutschein && bill.gutschein > 0 && (
              <span style={{ fontSize: 13, color: colors.danger, fontWeight: 600 }}>(-{bill.gutschein.toFixed(2)}€)</span>
            )}
            <span style={S.billTotal}>{bill.total.toFixed(2)}€</span>
          </div>
          {bill.tip !== undefined && (
            <span style={{ fontSize: 12, color: colors.muted }}>
              Tip: {bill.tip >= 0 ? `+${bill.tip.toFixed(2)}€` : `${bill.tip.toFixed(2)}€`}
            </span>
          )}
        </div>
      </div>
      <div style={{ ...S.billItemsList, marginTop: 10 }}>
        {bill.items.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center" as const, color: colors.faint, fontSize: 14, fontStyle: "italic" }}>
            No items in this bill
          </div>
        ) : (() => {
          type DisplayItem = (typeof bill.items)[0] & { displayQty: number };
          const activeItems: DisplayItem[] = [];
          const crossedItems: DisplayItem[] = [];
          bill.items.forEach((item) => {
            const cQty = item.crossedQty ?? (item.crossed ? item.qty : 0);
            const aQty = item.qty - cQty;

            if (bill.addedToPOS || allItemsCrossed) {
              activeItems.push({ ...item, displayQty: item.qty });
            } else {
              if (aQty > 0) activeItems.push({ ...item, displayQty: aQty });
              if (cQty > 0) crossedItems.push({ ...item, displayQty: cQty });
            }
          });
          return (
            <>
              {activeItems.map((item, idx) => (
                <div key={`active-${item.directusId || item.id}-${idx}`} style={isEditing ? S.billItemEditable : S.billItem}>
                  {isEditing && !bill.addedToPOS && !allItemsCrossed && (
                    <button style={S.billItemRemoveBtn} onClick={() => onRemoveItem(item.id)} title="Remove one">−</button>
                  )}
                  <span style={{ ...S.billItemName, flex: "none" }}>
                    <span style={S.billItemQty}>{item.displayQty}×</span>
                    {item.name}
                  </span>
                  <span style={{ flex: 1, borderBottom: `1px dotted ${colors.faint}`, margin: "0 6px", alignSelf: "flex-end", marginBottom: 3 }} />
                  <span style={S.billItemPrice}>
                    {(item.price * item.displayQty).toFixed(2)}€
                  </span>
                </div>
              ))}
              {crossedItems.length > 0 && (
                <>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: colors.info,
                    textTransform: "uppercase" as const,
                    marginTop: 8,
                    marginBottom: 2
                  }}>
                    In POS
                  </div>
                  {crossedItems.map((item, idx) => (
                    <div key={`crossed-${item.directusId || item.id}-${idx}`} style={isEditing && !bill.addedToPOS ? S.billItemEditable : S.billItem}>
                      {isEditing && !bill.addedToPOS && (
                        <button style={{ ...S.billItemRemoveBtn, background: colors.success, color: "#fff" }} onClick={() => onRestoreItem(item.id)} title="Un-cross one">+</button>
                      )}
                      <span style={{
                        ...S.billItemName,
                        flex: "none",
                        textDecoration: "line-through",
                        color: colors.info
                      }}>
                        <span style={S.billItemQty}>{item.displayQty}×</span>
                        {item.name}
                      </span>
                      <span style={{ flex: 1, borderBottom: `1px dotted ${colors.info}`, margin: "0 6px", alignSelf: "flex-end", marginBottom: 3, opacity: 0.4 }} />
                      <span style={{
                        ...S.billItemPrice,
                        textDecoration: "line-through",
                        color: colors.info
                      }}>
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
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }} onClick={e => e.stopPropagation()}>
        {bill.addedToPOS ? (
          <button style={S.editBillBtn} onClick={e => { e.stopPropagation(); onRestore(); }} title="Restore bill"><ReopenIcon size={15} /></button>
        ) : !isEditing ? (
          <button style={S.editBillBtn} onClick={e => { e.stopPropagation(); onEdit(); }}><EditIcon size={15} />Cross</button>
        ) : (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button style={S.doneEditBtn} onClick={onDone}>Done</button>
            <button style={S.cancelEditBtn} onClick={onCancel}>Cancel</button>
            <button style={S.deleteBillBtnIcon} onClick={onDelete} title="Mark full bill as in POS"><TrashIcon size={15} />Bill</button>
          </div>
        )}
      </div>
    </div>
  );
}
