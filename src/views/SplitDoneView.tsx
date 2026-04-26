import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useTableOrder } from "../hooks/useTableOrder";
import { useSplit } from "../contexts/SplitContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { calculateItemSplitTip, createItemSplitTableBill } from "../utils/billFactory";
import { S } from "../styles/appStyles";

export function SplitDoneView() {
  const app = useApp();
  const table = useTable();
  const { state, dispatch } = useSplit();
  const { isTablet, isTabletLandscape, isDesktop } = useBreakpoint();
  const tableId = app.ticketTable!;
  const { total: ticketTotal } = useTableOrder(tableId);
  const totalTip = calculateItemSplitTip(state.payments, state.itemPayments);
  const hasConfirmedPayments = state.payments.some((payment) => state.itemPayments[payment.guestNum]?.confirmed);

  const closeSplitTable = () => {
    const bill = createItemSplitTableBill({
      tableId,
      orders: table.orders,
      gutschein: table.gutscheinAmounts[tableId] || 0,
      payments: state.payments,
      itemPayments: state.itemPayments,
    });

    app.addPaidBill(bill);
    table.cleanupTable(tableId, bill.tempId);
    dispatch({ type: "RESET" });
    app.showToast(`Table ${tableId} closed — ${bill.total.toFixed(2)}€`);
    app.setOrderViewTab(null);
    app.setView("tables");
  };

  const headerStyle = isTablet || isTabletLandscape || isDesktop ? S.headerTablet : S.header;
  const isLargeScreen = isTablet || isTabletLandscape || isDesktop;

  // Mobile layout
  if (!isLargeScreen) {
    return (
      <div style={S.page}>
        <header style={headerStyle}>
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
          {hasConfirmedPayments && (
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: 15, color: totalTip >= 0 ? "#2d5a35" : "#c0392b",
              marginTop: 8, fontWeight: 600,
            }}>
              <span>Total tip</span>
              <span>{totalTip >= 0 ? `+${totalTip.toFixed(2)}€` : `${totalTip.toFixed(2)}€`}</span>
            </div>
          )}
        </div>
        <div style={S.ticketActions}>
          <button style={S.closeBtn} onClick={closeSplitTable}>
            Close table
          </button>
        </div>
      </div>
    );
  }

  // Tablet+ layout (two-column)
  return (
    <div style={S.page}>
      <header style={headerStyle}>
        <span />
        <span style={S.headerTitle}>Bill Settled — Table {tableId}</span>
        <span />
      </header>

      <div style={isDesktop ? S.billContainerTabletLandscape : S.billContainerTablet}>
        {/* Left column: Summary */}
        <div style={S.billReceiptColumn}>
          <div style={isDesktop ? S.billActionsCardLandscape : S.billActionsCard}>
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
            {hasConfirmedPayments && (
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 15, color: totalTip >= 0 ? "#2d5a35" : "#c0392b",
                marginTop: 8, fontWeight: 600,
              }}>
                <span>Total tip</span>
                <span>{totalTip >= 0 ? `+${totalTip.toFixed(2)}€` : `${totalTip.toFixed(2)}€`}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Action */}
        <div style={isDesktop ? S.billActionsColumnLandscape : S.billActionsColumn}>
          <button style={S.billPrimaryAction} onClick={closeSplitTable}>
            Close table
          </button>
        </div>
      </div>
    </div>
  );
}
