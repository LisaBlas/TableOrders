import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useTableOrder } from "../hooks/useTableOrder";
import { useSplit } from "../contexts/SplitContext";
import { S } from "../styles/appStyles";
import type { OrderItem } from "../types";

export function SplitDoneView() {
  const app = useApp();
  const table = useTable();
  const { state, dispatch } = useSplit();
  const tableId = app.ticketTable!;
  const { total: ticketTotal } = useTableOrder(tableId);

  const closeSplitTable = () => {
    const items = (table.orders[tableId] || []).filter((o: OrderItem) => (o.sentQty || 0) > 0);
    const subtotal = items.reduce((s: number, o: OrderItem) => s + o.price * (o.sentQty || 0), 0);
    const gutschein = table.gutscheinAmounts[tableId] || 0;
    const total = Math.max(0, subtotal - gutschein);

    // Calculate total tips from item split
    const guestsWithPayment = state.payments.filter((p) => state.itemPayments[p.guestNum]?.confirmed);
    const totalTip = guestsWithPayment.reduce((sum, p) => {
      const paid = parseFloat(state.itemPayments[p.guestNum].amount);
      return sum + (paid - p.total);
    }, 0);

    const bill = {
      tableId,
      items: items.map((o: OrderItem) => ({ ...o, qty: o.sentQty || 0 })),
      total,
      subtotal: gutschein > 0 ? subtotal : undefined,
      gutschein: gutschein > 0 ? gutschein : undefined,
      timestamp: new Date().toISOString(),
      paymentMode: "item" as const,
      splitData: { payments: state.payments },
      tip: totalTip !== 0 ? totalTip : undefined,
    };

    app.addPaidBill(bill);
    table.cleanupTable(tableId);
    dispatch({ type: "RESET" });
    app.showToast(`Table ${tableId} closed — ${total.toFixed(2)}€`);
    app.setView("tables");
  };

  return (
    <div style={S.page}>
      <header style={S.header}>
        <span />
        <span style={S.headerTitle}>Bill Settled — Table {tableId}</span>
        <span />
      </header>
      <div style={S.splitDoneCard}>
        <div style={S.splitDoneBadge}>✓</div>
        <div style={S.splitDoneTitle}>All paid</div>
        <div style={S.splitDoneSub}>
          {state.payments.length} guest{state.payments.length > 1 ? "s" : ""} · {ticketTotal.toFixed(2)}€ total
        </div>
        <div style={S.divider} />
        {state.payments.map((p) => (
          <div key={p.guestNum} style={S.splitDoneRow}>
            <span style={S.splitDoneGuest}>Guest {p.guestNum}</span>
            <div style={S.splitDoneItems}>
              {p.items.map((item, idx) => (
                <span key={idx} style={S.splitDoneItemChip}>{item.name}</span>
              ))}
            </div>
            <span style={S.splitDoneAmt}>{p.total.toFixed(2)}€</span>
          </div>
        ))}
        <div style={S.divider} />
        <div style={S.splitDoneTotal}>
          <span>Total collected</span>
          <span>{state.payments.reduce((s, p) => s + p.total, 0).toFixed(2)}€</span>
        </div>
        {(() => {
          const guestsWithPayment = state.payments.filter((p) => state.itemPayments[p.guestNum]?.confirmed);
          if (guestsWithPayment.length > 0) {
            const totalTip = guestsWithPayment.reduce((sum, p) => {
              const paid = parseFloat(state.itemPayments[p.guestNum].amount);
              return sum + (paid - p.total);
            }, 0);
            return (
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 15, color: totalTip >= 0 ? "#2d5a35" : "#c0392b",
                marginTop: 8, fontWeight: 600,
              }}>
                <span>Total tip</span>
                <span>{totalTip >= 0 ? `+${totalTip.toFixed(2)}€` : `${totalTip.toFixed(2)}€`}</span>
              </div>
            );
          }
          return null;
        })()}
      </div>
      <div style={S.ticketActions}>
        <button style={S.closeBtn} onClick={closeSplitTable}>Close table</button>
      </div>
    </div>
  );
}
