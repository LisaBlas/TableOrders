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
  const expandedItems = lastPayment.items as ExpandedItem[];
  const guestHasGutschein = expandedItems.some((i) => i.isGutschein);
  const receiptItems = expandedItems.filter((i) => !i.isGutschein);
  const receiptGutschein = guestHasGutschein ? (table.gutscheinAmounts[tableId] || 0) : 0;

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

    // Get paid items from split payments (exclude gutschein fake item)
    const allPaidItems = state.payments.flatMap(p => p.items) as ExpandedItem[];
    const paidItems = allPaidItems.filter(i => !i.isGutschein);
    const paidTotal = state.payments.reduce((s, p) => s + p.total, 0);
    const gutschein = table.gutscheinAmounts[tableId] || 0;

    // Create bill record
    const displayId = table.resolveTableDisplayId(tableId);
    const bill = {
      tempId: crypto.randomUUID(),
      tableId: displayId,
      items: paidItems.map(i => ({ ...i })),
      total: paidTotal,
      subtotal: gutschein > 0 ? paidTotal + gutschein : undefined,
      gutschein: gutschein > 0 ? gutschein : undefined,
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
      app.showToast(`Table ${table.resolveTableDisplayId(tableId)} closed`);
    } else {
      app.showToast(`${paidItems.length} item${paidItems.length > 1 ? 's' : ''} paid — Table ${table.resolveTableDisplayId(tableId)} still open`);
    }

    // Return to tables view
    app.setOrderViewTab(null);
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
          <span style={{ width: 22, height: 22 }} />
          <span style={S.headerTitle}>Guest {lastPayment.guestNum} — pays</span>
          <span style={{ width: 22, height: 22 }} />
        </header>

        <div style={ticketStyle}>
          <Receipt
            tableId={tableId}
            items={receiptItems}
            guestNum={lastPayment.guestNum}
            gutschein={receiptGutschein}
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
        <span style={{ width: 22, height: 22 }} />
        <span style={S.headerTitle}>Guest {lastPayment.guestNum} — pays</span>
        <span style={{ width: 22, height: 22 }} />
      </header>

      <div style={isDesktop ? S.billContainerTabletLandscape : S.billContainerTablet}>
        {/* Left column: Receipt */}
        <div style={S.billReceiptColumn}>
          <div style={isDesktop ? S.billActionsCardLandscape : S.billActionsCard}>
            <Receipt
              tableId={tableId}
              items={receiptItems}
              guestNum={lastPayment.guestNum}
              gutschein={receiptGutschein}
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
