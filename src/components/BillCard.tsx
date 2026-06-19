import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { S } from "../styles/appStyles";
import { colors, radii } from "../styles/tokens";
import { CheckIcon, ReopenIcon } from "./icons";
import type { Bill } from "../types";

interface BillCardProps {
  bill: Bill;
  isExpanded: boolean;
  onToggle: () => void;
  onMarkAll: () => void;
  onRestoreAll: () => void;
  onMarkItem: (itemId: string) => void;
  onRestoreItem: (itemId: string) => void;
}

export function BillCard({
  bill, isExpanded, onToggle,
  onMarkAll, onRestoreAll, onMarkItem, onRestoreItem,
}: BillCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const expandedPanelRef = useRef<HTMLDivElement>(null);
  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isExpanded) {
      setCardRect(null);
      return;
    }
    const update = () => {
      if (cardRef.current) setCardRect(cardRef.current.getBoundingClientRect());
    };
    update();
    window.addEventListener("scroll", update, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", update, { capture: true });
  }, [isExpanded]);

  // Close on outside pointerdown so the same gesture can open another card via its click event.
  useEffect(() => {
    if (!isExpanded) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (expandedPanelRef.current && !expandedPanelRef.current.contains(e.target as Node)) {
        onToggleRef.current();
      }
    };
    // Defer one tick so the pointerdown that opened this card isn't immediately caught.
    const timer = setTimeout(() => document.addEventListener("pointerdown", handlePointerDown), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isExpanded]);

  const allItemsCrossed = bill.items.length > 0 && bill.items.every((item) => {
    const cQty = item.crossedQty ?? (item.crossed ? item.qty : 0);
    return cQty === item.qty;
  });

  const totalItemCount = bill.items.reduce((sum, item) => sum + item.qty, 0);
  const crossedCount = bill.items.reduce((sum, item) => {
    return sum + (item.crossedQty ?? (item.crossed ? item.qty : 0));
  }, 0);

  const isFullyMarked = bill.addedToPOS || allItemsCrossed;
  const isPartiallyMarked = !isFullyMarked && crossedCount > 0;

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

  const timeStr = new Date(bill.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const billSubtitle = `${timeStr} · ${shortPaymentLabel}${totalItemCount > 0 ? ` · ${totalItemCount} item${totalItemCount !== 1 ? "s" : ""}` : ""}`;

  const chevron = (
    <span style={{
      fontSize: 16,
      color: colors.faint,
      lineHeight: 1,
      userSelect: "none",
      display: "inline-block",
      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
      transition: "transform 0.18s ease",
      flexShrink: 0,
    }}>›</span>
  );

  const markBtn = (
    <button
      onClick={(e) => { e.stopPropagation(); isFullyMarked ? onRestoreAll() : onMarkAll(); }}
      title={isFullyMarked ? "Restore from POS" : "Mark all as in POS"}
      style={{
        width: 28,
        height: 28,
        borderRadius: radii.sm,
        border: `1.5px solid ${isFullyMarked ? colors.info : isPartiallyMarked ? colors.info : colors.border}`,
        background: isFullyMarked ? colors.info : isPartiallyMarked ? colors.infoBg : "transparent",
        color: isFullyMarked ? colors.surface : isPartiallyMarked ? colors.info : colors.faint,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "inherit",
        padding: 0,
      }}
    >
      {isFullyMarked
        ? <CheckIcon size={14} color={colors.surface} />
        : isPartiallyMarked
        ? `${crossedCount}/${totalItemCount}`
        : null}
    </button>
  );

  const headerContent = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {chevron}
          <span style={S.billTableNum}>{bill.tableId}</span>
        </div>
        <div style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>{billSubtitle}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <span style={S.billTotal}>{bill.total.toFixed(2)}€</span>
          {bill.tip !== undefined && (
            <span style={{ fontSize: 12, color: colors.muted }}>
              Tip €{Math.abs(bill.tip).toFixed(2)}
            </span>
          )}
        </div>
        {markBtn}
      </div>
    </div>
  );

  type DisplayItem = (typeof bill.items)[0] & { displayQty: number };
  const activeItems: DisplayItem[] = [];
  const crossedItems: DisplayItem[] = [];

  bill.items.forEach((item) => {
    if (bill.addedToPOS) {
      crossedItems.push({ ...item, displayQty: item.qty });
    } else {
      const cQty = item.crossedQty ?? (item.crossed ? item.qty : 0);
      const aQty = item.qty - cQty;
      if (aQty > 0) activeItems.push({ ...item, displayQty: aQty });
      if (cQty > 0) crossedItems.push({ ...item, displayQty: cQty });
    }
  });

  const stepperBtn = (onClick: () => void, isRestore: boolean) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={isRestore ? "Restore one from POS" : "Mark one in POS"}
      style={{
        width: 24,
        height: 24,
        borderRadius: radii.sm,
        border: `1px solid ${isRestore ? colors.successBg : colors.border}`,
        background: isRestore ? colors.successBg : colors.bg,
        color: isRestore ? colors.success : colors.subtle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        fontSize: 11,
        fontFamily: "inherit",
        padding: 0,
      }}
    >
      {isRestore ? <ReopenIcon size={11} /> : "→"}
    </button>
  );

  const itemsPanel = (
    <div style={{ padding: "0 16px 14px" }}>
      {bill.gutschein && bill.gutschein > 0 && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: colors.danger, fontWeight: 600 }}>
            (-{bill.gutschein.toFixed(2)}€)
          </span>
          <span style={S.billTotal}>{bill.total.toFixed(2)}€</span>
        </div>
      )}
      {bill.tip !== undefined && (
        <div style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
          Tip: {bill.tip >= 0 ? `+${bill.tip.toFixed(2)}€` : `${bill.tip.toFixed(2)}€`}
        </div>
      )}
      {bill.items.length === 0 ? (
        <div style={{ padding: "20px 0", textAlign: "center" as const, color: colors.faint, fontSize: 14, fontStyle: "italic" }}>
          No items in this bill
        </div>
      ) : (
        <div style={S.billItemsList}>
          {activeItems.map((item, idx) => (
            <div key={`active-${item.directusId || item.id}-${idx}`} style={S.billItemEditable}>
              {stepperBtn(() => onMarkItem(item.id), false)}
              <span style={{ ...S.billItemName, flex: "none" }}>
                <span style={S.billItemQty}>{item.displayQty}×</span>
                {item.name}
              </span>
              <span style={{ flex: 1, borderBottom: `1px dotted ${colors.faint}`, margin: "0 6px", alignSelf: "flex-end", marginBottom: 3 }} />
              <span style={S.billItemPrice}>{(item.price * item.displayQty).toFixed(2)}€</span>
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
                marginTop: activeItems.length > 0 ? 8 : 0,
                marginBottom: 2,
              }}>
                In POS
              </div>
              {crossedItems.map((item, idx) => (
                <div
                  key={`crossed-${item.directusId || item.id}-${idx}`}
                  style={bill.addedToPOS ? S.billItem : S.billItemEditable}
                >
                  {!bill.addedToPOS && stepperBtn(() => onRestoreItem(item.id), true)}
                  <span style={{ ...S.billItemName, flex: "none", textDecoration: "line-through", color: colors.info }}>
                    <span style={S.billItemQty}>{item.displayQty}×</span>
                    {item.name}
                  </span>
                  <span style={{ flex: 1, borderBottom: `1px dotted ${colors.info}`, margin: "0 6px", alignSelf: "flex-end", marginBottom: 3, opacity: 0.4 }} />
                  <span style={{ ...S.billItemPrice, textDecoration: "line-through", color: colors.info }}>
                    {(item.price * item.displayQty).toFixed(2)}€
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Grid placeholder — always reserves the cell space; hidden when portal takes over */}
      <div
        ref={cardRef}
        style={{
          ...S.billCard,
          padding: "14px 16px",
          cursor: "pointer",
          visibility: isExpanded ? "hidden" : "visible",
        }}
        onClick={onToggle}
      >
        {headerContent}
      </div>

      {isExpanded && cardRect && createPortal(
        <div
          ref={expandedPanelRef}
          style={{
            position: "fixed",
            top: cardRect.top,
            left: cardRect.left,
            width: cardRect.width,
            zIndex: 100,
            background: colors.surface,
            borderRadius: radii.lg,
            border: `1px solid ${colors.info}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            maxHeight: `calc(100vh - ${cardRect.top}px - 16px)`,
            overflowY: "auto",
          }}
        >
          <div
            style={{ padding: "14px 16px", cursor: "pointer" }}
            onClick={onToggle}
          >
            {headerContent}
          </div>
          {itemsPanel}
        </div>,
        document.body
      )}
    </>
  );
}
