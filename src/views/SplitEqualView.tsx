import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useTableOrder } from "../hooks/useTableOrder";
import { useSplit } from "../contexts/SplitContext";
import { S } from "../styles/appStyles";
import type { OrderItem } from "../types";

export function SplitEqualView() {
  const app = useApp();
  const table = useTable();
  const { state, dispatch } = useSplit();
  const tableId = app.ticketTable!;
  const { total: ticketTotal } = useTableOrder(tableId);

  const equalShare = state.equalGuests > 0 ? ticketTotal / state.equalGuests : 0;

  const closeSplitTable = () => {
    const items = (table.orders[tableId] || []).filter((o: OrderItem) => (o.sentQty || 0) > 0);
    const subtotal = items.reduce((s: number, o: OrderItem) => s + o.price * (o.sentQty || 0), 0);
    const gutschein = table.gutscheinAmounts[tableId] || 0;
    const total = Math.max(0, subtotal - gutschein);

    // Calculate total tips
    const confirmedPayments = state.equalPayments.filter((p) => p.confirmed);
    const totalPaid = confirmedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalTip = totalPaid > 0 ? totalPaid - (confirmedPayments.length * equalShare) : 0;

    const bill = {
      tableId,
      items: items.map((o: OrderItem) => ({ ...o, qty: o.sentQty || 0 })),
      total,
      subtotal: gutschein > 0 ? subtotal : undefined,
      gutschein: gutschein > 0 ? gutschein : undefined,
      timestamp: new Date().toISOString(),
      paymentMode: "equal" as const,
      splitData: { guests: state.equalGuests },
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
        <button style={S.back} onClick={() => { dispatch({ type: "RESET" }); app.setView("order"); }}>
          ← Back
        </button>
        <span style={S.headerTitle}>Equal Split — Table {tableId}</span>
        <span />
      </header>
      <div style={S.equalCard}>
        <div style={S.equalTotalLine}>
          <span style={S.equalTotalLabel}>Bill total</span>
          <span style={S.equalTotalAmt}>{ticketTotal.toFixed(2)}€</span>
        </div>
        <div style={S.divider} />
        <div style={S.guestCountRow}>
          <span style={S.guestCountLabel}>Number of guests</span>
          <div style={S.guestCounter}>
            <button style={S.guestCountBtn} onClick={() => dispatch({ type: "SET_EQUAL_GUESTS", count: Math.max(1, state.equalGuests - 1) })}>−</button>
            <span style={S.guestCountNum}>{state.equalGuests}</span>
            <button style={S.guestCountBtn} onClick={() => dispatch({ type: "SET_EQUAL_GUESTS", count: state.equalGuests + 1 })}>+</button>
          </div>
        </div>
        <div style={S.divider} />
        <div style={S.equalShareRow}>
          <span style={S.equalShareLabel}>Each guest pays</span>
          <span style={S.equalShareAmt}>{equalShare.toFixed(2)}€</span>
        </div>
        {state.equalGuests > 1 && (
          <div style={S.equalBreakdown}>
            {Array.from({ length: state.equalGuests }).map((_, i) => (
              <div key={i} style={S.equalGuestRow}>
                <span style={S.equalGuestChip}>Guest {i + 1}</span>
                <span style={S.equalGuestAmt}>{equalShare.toFixed(2)}€</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={S.ticketActions}>
        <div style={S.paymentSection}>
          <div style={S.paymentLabel}>Amount Paid</div>
          {state.equalPayments.map((payment, idx) => (
            <div key={idx} style={idx === state.equalPayments.length - 1 ? S.paymentItemLast : S.paymentItem}>
              <div style={S.paymentInputRow}>
                <input
                  type="number"
                  placeholder={equalShare.toFixed(2)}
                  value={payment.amount}
                  onChange={(e) => dispatch({ type: "UPDATE_EQUAL_PAYMENT", index: idx, payment: { ...payment, amount: e.target.value } })}
                  step="0.01" min="0"
                  style={S.paymentInput}
                  disabled={payment.confirmed}
                />
                <button
                  style={payment.confirmed ? S.paymentCheckConfirmed : S.paymentCheck}
                  onClick={() => {
                    if (!payment.confirmed) {
                      const amount = payment.amount && parseFloat(payment.amount) > 0 ? parseFloat(payment.amount) : equalShare;
                      const updated = [...state.equalPayments];
                      updated[idx] = { amount: amount.toString(), confirmed: true };
                      dispatch({ type: "ADD_EQUAL_PAYMENT", payments: [...updated, { amount: "", confirmed: false }] });
                    }
                  }}
                  disabled={payment.confirmed}
                >✓</button>
              </div>
            </div>
          ))}
          {(() => {
            const confirmed = state.equalPayments.filter((p) => p.confirmed);
            if (confirmed.length > 0) {
              const totalPaid = confirmed.reduce((sum, p) => sum + parseFloat(p.amount), 0);
              const expectedTotal = confirmed.length * equalShare;
              const totalTip = totalPaid - expectedTotal;
              return (
                <div style={S.paymentTip}>
                  Total Tip: {totalTip >= 0 ? `+${totalTip.toFixed(2)}€` : `${totalTip.toFixed(2)}€`}
                </div>
              );
            }
            return null;
          })()}
        </div>
        <button
          style={{
            ...S.closeBtn,
            ...(state.equalPayments.some((p) => p.amount && !p.confirmed) ? { opacity: 0.5, cursor: "not-allowed" } : {}),
          }}
          onClick={closeSplitTable}
          disabled={state.equalPayments.some((p) => !!p.amount && !p.confirmed)}
        >
          Close table
        </button>
      </div>
    </div>
  );
}
