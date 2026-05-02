import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useTableOrder } from "../hooks/useTableOrder";
import { useSplit } from "../contexts/SplitContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { createEqualSplitTableBill } from "../utils/billFactory";
import { BackIcon } from "../components/icons";
import { S } from "../styles/appStyles";

const MAX_EQUAL_SPLIT_GUESTS = 20;

export function SplitEqualView() {
  const app = useApp();
  const table = useTable();
  const { state, dispatch } = useSplit();
  const { isTablet, isTabletLandscape, isDesktop } = useBreakpoint();
  const tableId = app.ticketTable!;
  const { total: ticketTotal } = useTableOrder(tableId);
  const gutschein = table.gutscheinAmounts[tableId] || 0;
  const billableTotal = Math.max(0, ticketTotal - gutschein);

  const equalShare = state.equalGuests > 0 ? billableTotal / state.equalGuests : 0;
  const equalShareRounded = state.equalGuests > 0 ? Math.round(equalShare * 100) / 100 : 0;
  const lastGuestShare = state.equalGuests > 1
    ? Math.round((billableTotal - equalShareRounded * (state.equalGuests - 1)) * 100) / 100
    : equalShareRounded;
  const hasConfirmedPayments = state.equalPayments.some(p => p.confirmed);

  const closeSplitTable = () => {
    const displayId = table.resolveTableDisplayId(tableId);
    const bill = createEqualSplitTableBill({
      tableId: displayId,
      orders: table.orders,
      gutschein: table.gutscheinAmounts[tableId] || 0,
      guests: state.equalGuests,
      equalPayments: state.equalPayments,
      equalShare: equalShareRounded,
    });

    app.addPaidBill(bill);
    table.cleanupTable(tableId);
    dispatch({ type: "RESET" });
    app.showToast(`Table ${displayId} closed — ${bill.total.toFixed(2)}€`);
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
          <button
            style={{
              ...S.back,
              ...(hasConfirmedPayments ? { opacity: 0.3, cursor: "not-allowed" } : {})
            }}
            onClick={() => {
              if (!hasConfirmedPayments) {
                dispatch({ type: "RESET" });
                app.setView("order");
              }
            }}
            disabled={hasConfirmedPayments}
          >
            <BackIcon size={22} />
          </button>
          <span style={S.headerTitle}>Equal Split — Table {table.resolveTableDisplayId(tableId)}</span>
          <span />
        </header>
        <div style={S.equalCard}>
        <div style={S.equalTotalLine}>
          <span style={S.equalTotalLabel}>Bill total</span>
          <span style={S.equalTotalAmt}>{ticketTotal.toFixed(2)}€</span>
        </div>
        {gutschein > 0 && (
          <div style={S.equalTotalLine}>
            <span style={S.equalTotalLabel}>Gutschein</span>
            <span style={{ ...S.equalTotalAmt, color: "#22c55e" }}>−{gutschein.toFixed(2)}€</span>
          </div>
        )}
        <div style={S.divider} />
        <div style={S.guestCountRow}>
          <span style={S.guestCountLabel}>Number of guests</span>
          <div style={S.guestCounter}>
            <button style={S.guestCountBtn} onClick={() => dispatch({ type: "SET_EQUAL_GUESTS", count: Math.max(1, state.equalGuests - 1) })}>−</button>
            <span style={S.guestCountNum}>{state.equalGuests}</span>
            <button
              style={S.guestCountBtn}
              onClick={() => dispatch({ type: "SET_EQUAL_GUESTS", count: Math.min(MAX_EQUAL_SPLIT_GUESTS, state.equalGuests + 1) })}
              disabled={state.equalGuests >= MAX_EQUAL_SPLIT_GUESTS}
            >+</button>
          </div>
        </div>
        <div style={S.divider} />
        <div style={S.equalShareRow}>
          <span style={S.equalShareLabel}>Each guest pays</span>
          <span style={S.equalShareAmt}>{equalShareRounded.toFixed(2)}€</span>
        </div>
        {state.equalGuests > 1 && (
          <div style={S.equalBreakdown}>
            {Array.from({ length: state.equalGuests }).map((_, i) => (
              <div key={i} style={S.equalGuestRow}>
                <span style={S.equalGuestChip}>Guest {i + 1}</span>
                <span style={S.equalGuestAmt}>{i === state.equalGuests - 1 ? lastGuestShare.toFixed(2) : equalShareRounded.toFixed(2)}€</span>
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
                  placeholder={(idx === state.equalGuests - 1 ? lastGuestShare : equalShareRounded).toFixed(2)}
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
                      const parsedAmount = parseFloat(payment.amount);
                      const defaultShare = idx === state.equalGuests - 1 ? lastGuestShare : equalShareRounded;
                      const amount = !Number.isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : defaultShare;
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
              const totalPaid = confirmed.reduce((sum, p) => {
                const parsedAmount = parseFloat(p.amount);
                return sum + (!Number.isNaN(parsedAmount) ? parsedAmount : 0);
              }, 0);
              const expectedTotal = confirmed.length >= state.equalGuests
                ? (state.equalGuests - 1) * equalShareRounded + lastGuestShare
                : confirmed.length * equalShareRounded;
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

  // Tablet+ layout (two-column)
  return (
    <div style={S.page}>
      <header style={headerStyle}>
        <button
          style={{
            ...S.back,
            ...(hasConfirmedPayments ? { opacity: 0.3, cursor: "not-allowed" } : {})
          }}
          onClick={() => {
            if (!hasConfirmedPayments) {
              dispatch({ type: "RESET" });
              app.setView("order");
            }
          }}
          disabled={hasConfirmedPayments}
        >
          <BackIcon size={22} />
        </button>
        <span style={S.headerTitle}>Equal Split — Table {table.resolveTableDisplayId(tableId)}</span>
        <span />
      </header>

      <div style={isDesktop ? S.billContainerTabletLandscape : S.billContainerTablet}>
        {/* Left column: Split details */}
        <div style={S.billReceiptColumn}>
          <div style={isDesktop ? S.billActionsCardLandscape : S.billActionsCard}>
            <div style={S.equalTotalLine}>
              <span style={S.equalTotalLabel}>Bill total</span>
              <span style={S.equalTotalAmt}>{ticketTotal.toFixed(2)}€</span>
            </div>
            {gutschein > 0 && (
              <div style={S.equalTotalLine}>
                <span style={S.equalTotalLabel}>Gutschein</span>
                <span style={{ ...S.equalTotalAmt, color: "#22c55e" }}>−{gutschein.toFixed(2)}€</span>
              </div>
            )}
            <div style={S.divider} />
            <div style={S.guestCountRow}>
              <span style={S.guestCountLabel}>Number of guests</span>
              <div style={S.guestCounter}>
                <button style={S.guestCountBtn} onClick={() => dispatch({ type: "SET_EQUAL_GUESTS", count: Math.max(1, state.equalGuests - 1) })}>−</button>
                <span style={S.guestCountNum}>{state.equalGuests}</span>
                <button
                  style={S.guestCountBtn}
                  onClick={() => dispatch({ type: "SET_EQUAL_GUESTS", count: Math.min(MAX_EQUAL_SPLIT_GUESTS, state.equalGuests + 1) })}
                  disabled={state.equalGuests >= MAX_EQUAL_SPLIT_GUESTS}
                >+</button>
              </div>
            </div>
            <div style={S.divider} />
            <div style={S.equalShareRow}>
              <span style={S.equalShareLabel}>Each guest pays</span>
              <span style={S.equalShareAmt}>{equalShareRounded.toFixed(2)}€</span>
            </div>
            {state.equalGuests > 1 && (
              <div style={S.equalBreakdown}>
                {Array.from({ length: state.equalGuests }).map((_, i) => (
                  <div key={i} style={S.equalGuestRow}>
                    <span style={S.equalGuestChip}>Guest {i + 1}</span>
                    <span style={S.equalGuestAmt}>{i === state.equalGuests - 1 ? lastGuestShare.toFixed(2) : equalShareRounded.toFixed(2)}€</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Payment */}
        <div style={isDesktop ? S.billActionsColumnLandscape : S.billActionsColumn}>
          <div style={isDesktop ? S.billActionsCardLandscape : S.billActionsCard}>
            <div style={S.paymentLabel}>Amount Paid</div>
            {state.equalPayments.map((payment, idx) => (
              <div key={idx} style={idx === state.equalPayments.length - 1 ? S.paymentItemLast : S.paymentItem}>
                <div style={S.paymentInputRow}>
                  <input
                    type="number"
                    placeholder={(idx === state.equalGuests - 1 ? lastGuestShare : equalShareRounded).toFixed(2)}
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
                        const parsedAmount = parseFloat(payment.amount);
                        const defaultShare = idx === state.equalGuests - 1 ? lastGuestShare : equalShareRounded;
                        const amount = !Number.isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : defaultShare;
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
                const totalPaid = confirmed.reduce((sum, p) => {
                  const parsedAmount = parseFloat(p.amount);
                  return sum + (!Number.isNaN(parsedAmount) ? parsedAmount : 0);
                }, 0);
                const expectedTotal = confirmed.length >= state.equalGuests
                  ? (state.equalGuests - 1) * equalShareRounded + lastGuestShare
                  : confirmed.length * equalShareRounded;
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
              ...S.billPrimaryAction,
              ...(state.equalPayments.some((p) => p.amount && !p.confirmed) ? { opacity: 0.5, cursor: "not-allowed" } : {}),
            }}
            onClick={closeSplitTable}
            disabled={state.equalPayments.some((p) => !!p.amount && !p.confirmed)}
          >
            Close table
          </button>
        </div>
      </div>
    </div>
  );
}
