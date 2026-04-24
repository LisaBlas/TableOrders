import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useSplit } from "../contexts/SplitContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { Receipt } from "../components/Receipt";
import { S } from "../styles/appStyles";
import type { ExpandedItem } from "../types";

export function SplitConfirmView() {
  const app = useApp();
  const table = useTable();
  const { state, dispatch, remainingTotal, lastPayment } = useSplit();
  const { isTablet, isTabletLandscape, isDesktop } = useBreakpoint();
  const tableId = app.ticketTable!;

  if (!lastPayment) return null;

  const guestPayment = state.itemPayments[lastPayment.guestNum];

  const nextSplitGuest = () => {
    dispatch({ type: "NEXT_GUEST" });
    app.setView("split");
  };

  const settleItemPayment = () => {
    // Calculate tip
    const guestsWithPayment = state.payments.filter((p) => state.itemPayments[p.guestNum]?.confirmed);
    const totalTip = guestsWithPayment.reduce((sum, p) => {
      const paid = parseFloat(state.itemPayments[p.guestNum].amount);
      return sum + (paid - p.total);
    }, 0);

    // Get paid items from split payments
    const paidItems = state.payments.flatMap(p => p.items) as ExpandedItem[];
    const paidTotal = state.payments.reduce((s, p) => s + p.total, 0);

    // Create bill record
    const bill = {
      tempId: crypto.randomUUID(),
      tableId,
      items: paidItems.map(i => ({ ...i })),
      total: paidTotal,
      timestamp: new Date().toISOString(),
      paymentMode: "item" as const,
      splitData: { payments: state.payments },
      tip: totalTip !== 0 ? totalTip : undefined,
    };

    // Save bill
    app.addPaidBill(bill);

    // Calculate what will remain after removing paid items
    const currentOrders = table.orders[tableId] || [];
    const paidCounts = new Map<string, number>();
    paidItems.forEach((item) => {
      paidCounts.set(item.id, (paidCounts.get(item.id) || 0) + 1);
    });

    const willHaveRemainingItems = currentOrders.some((o) => {
      const paidCount = paidCounts.get(o.id) || 0;
      const remainingQty = o.qty - paidCount;
      return remainingQty > 0;
    });

    // Remove ONLY paid items from table orders
    table.removePaidItems(tableId, paidItems);

    // Reset split state
    dispatch({ type: "RESET" });

    // Close table if no items will remain
    if (!willHaveRemainingItems) {
      table.cleanupTable(tableId);
      app.showToast(`Table ${tableId} closed`);
    } else {
      app.showToast(`${paidItems.length} item${paidItems.length > 1 ? 's' : ''} paid — Table ${tableId} still open`);
    }

    // Return to tables view
    app.setView("tables");
  };

  const headerStyle = isTablet || isTabletLandscape || isDesktop ? S.headerTablet : S.header;
  const ticketStyle = isTablet || isTabletLandscape || isDesktop ? S.ticketTablet : S.ticket;
  const isLargeScreen = isTablet || isTabletLandscape || isDesktop;

  // Mobile layout
  if (!isLargeScreen) {
    return (
      <div style={S.page}>
        <header style={headerStyle}>
          <span />
          <span style={S.headerTitle}>Guest {lastPayment.guestNum} — pays</span>
          <span />
        </header>

        <div style={ticketStyle}>
          <Receipt
            tableId={tableId}
            items={lastPayment.items}
            guestNum={lastPayment.guestNum}
          />
        </div>

        <div style={S.ticketActions}>
        <div style={S.paymentSection}>
          <div style={S.paymentLabel}>Amount Paid</div>
          <div style={S.paymentInputRow}>
            <input
              type="number"
              placeholder={lastPayment.total.toFixed(2)}
              value={guestPayment?.amount || ""}
              onChange={(e) => dispatch({
                type: "UPDATE_ITEM_PAYMENT",
                guestNum: lastPayment.guestNum,
                payment: { amount: e.target.value, confirmed: false },
              })}
              step="0.01" min="0"
              style={S.paymentInput}
              disabled={guestPayment?.confirmed}
            />
            <button
              style={guestPayment?.confirmed ? S.paymentCheckConfirmed : S.paymentCheck}
              onClick={() => {
                const amount = guestPayment?.amount && parseFloat(guestPayment.amount) > 0
                  ? parseFloat(guestPayment.amount) : lastPayment.total;
                dispatch({
                  type: "UPDATE_ITEM_PAYMENT",
                  guestNum: lastPayment.guestNum,
                  payment: { amount: amount.toString(), confirmed: true },
                });
              }}
              disabled={guestPayment?.confirmed}
            >✓</button>
          </div>
          {guestPayment?.confirmed && (() => {
            const paid = parseFloat(guestPayment.amount);
            const tip = paid - lastPayment.total;
            return <div style={S.paymentTip}>Tip: {tip >= 0 ? `+${tip.toFixed(2)}€` : `${tip.toFixed(2)}€`}</div>;
          })()}
        </div>

        {state.remaining.length > 0 && (
          <div style={S.splitRemainingBanner}>
            <div>
              <div style={S.splitRemainingLabel}>Still to pay</div>
              <div style={S.splitRemainingItems}>
                {state.remaining.length} item{state.remaining.length > 1 ? "s" : ""}
              </div>
            </div>
            <span style={S.splitRemainingAmt}>{remainingTotal.toFixed(2)}€</span>
          </div>
        )}

        {state.remaining.length > 0 ? (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{
                ...S.closeBtn,
                ...(guestPayment?.amount && !guestPayment?.confirmed ? { opacity: 0.5, cursor: "not-allowed" } : {}),
              }}
              onClick={settleItemPayment}
              disabled={!!guestPayment?.amount && !guestPayment?.confirmed}
            >
              Done
            </button>
            <button
              style={{
                ...S.sendBtn,
                ...(guestPayment?.amount && !guestPayment?.confirmed ? { opacity: 0.5, cursor: "not-allowed" } : {}),
              }}
              onClick={nextSplitGuest}
              disabled={!!guestPayment?.amount && !guestPayment?.confirmed}
            >
              Next guest →
            </button>
          </div>
        ) : (
          <button
            style={{
              ...S.sendBtn,
              ...(guestPayment?.amount && !guestPayment?.confirmed ? { opacity: 0.5, cursor: "not-allowed" } : {}),
            }}
            onClick={settleItemPayment}
            disabled={!!guestPayment?.amount && !guestPayment?.confirmed}
          >
            Done
          </button>
        )}
      </div>
    </div>
    );
  }

  // Tablet+ layout (two-column)
  return (
    <div style={S.page}>
      <header style={headerStyle}>
        <span />
        <span style={S.headerTitle}>Guest {lastPayment.guestNum} — pays</span>
        <span />
      </header>

      <div style={isDesktop ? S.billContainerTabletLandscape : S.billContainerTablet}>
        {/* Left column: Receipt */}
        <div style={S.billReceiptColumn}>
          <div style={isDesktop ? S.billActionsCardLandscape : S.billActionsCard}>
            <Receipt
              tableId={tableId}
              items={lastPayment.items}
              guestNum={lastPayment.guestNum}
            />
          </div>
        </div>

        {/* Right column: Actions */}
        <div style={isDesktop ? S.billActionsColumnLandscape : S.billActionsColumn}>
          {/* Payment card */}
          <div style={isDesktop ? S.billActionsCardLandscape : S.billActionsCard}>
            <div style={S.paymentLabel}>Amount Paid</div>
            <div style={S.paymentInputRow}>
              <input
                type="number"
                placeholder={lastPayment.total.toFixed(2)}
                value={guestPayment?.amount || ""}
                onChange={(e) => dispatch({
                  type: "UPDATE_ITEM_PAYMENT",
                  guestNum: lastPayment.guestNum,
                  payment: { amount: e.target.value, confirmed: false },
                })}
                step="0.01" min="0"
                style={S.paymentInput}
                disabled={guestPayment?.confirmed}
              />
              <button
                style={guestPayment?.confirmed ? S.paymentCheckConfirmed : S.paymentCheck}
                onClick={() => {
                  const amount = guestPayment?.amount && parseFloat(guestPayment.amount) > 0
                    ? parseFloat(guestPayment.amount) : lastPayment.total;
                  dispatch({
                    type: "UPDATE_ITEM_PAYMENT",
                    guestNum: lastPayment.guestNum,
                    payment: { amount: amount.toString(), confirmed: true },
                  });
                }}
                disabled={guestPayment?.confirmed}
              >✓</button>
            </div>
            {guestPayment?.confirmed && (() => {
              const paid = parseFloat(guestPayment.amount);
              const tip = paid - lastPayment.total;
              return <div style={S.paymentTip}>Tip: {tip >= 0 ? `+${tip.toFixed(2)}€` : `${tip.toFixed(2)}€`}</div>;
            })()}
          </div>

          {/* Remaining banner */}
          {state.remaining.length > 0 && (
            <div style={S.splitRemainingBanner}>
              <div>
                <div style={S.splitRemainingLabel}>Still to pay</div>
                <div style={S.splitRemainingItems}>
                  {state.remaining.length} item{state.remaining.length > 1 ? "s" : ""}
                </div>
              </div>
              <span style={S.splitRemainingAmt}>{remainingTotal.toFixed(2)}€</span>
            </div>
          )}

          {/* Action buttons */}
          {state.remaining.length > 0 ? (
            <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
              <button
                style={{
                  ...S.billPrimaryAction,
                  ...(guestPayment?.amount && !guestPayment?.confirmed ? { opacity: 0.5, cursor: "not-allowed" } : {}),
                }}
                onClick={nextSplitGuest}
                disabled={!!guestPayment?.amount && !guestPayment?.confirmed}
              >
                Next guest →
              </button>
              <button
                style={{
                  ...S.closeBtn,
                  ...(guestPayment?.amount && !guestPayment?.confirmed ? { opacity: 0.5, cursor: "not-allowed" } : {}),
                }}
                onClick={settleItemPayment}
                disabled={!!guestPayment?.amount && !guestPayment?.confirmed}
              >
                Done
              </button>
            </div>
          ) : (
            <button
              style={{
                ...S.billPrimaryAction,
                ...(guestPayment?.amount && !guestPayment?.confirmed ? { opacity: 0.5, cursor: "not-allowed" } : {}),
              }}
              onClick={settleItemPayment}
              disabled={!!guestPayment?.amount && !guestPayment?.confirmed}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
