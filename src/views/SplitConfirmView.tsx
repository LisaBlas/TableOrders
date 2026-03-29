import { useApp } from "../contexts/AppContext";
import { useSplit } from "../contexts/SplitContext";
import { Receipt } from "../components/Receipt";
import { S } from "../styles/appStyles";

export function SplitConfirmView() {
  const app = useApp();
  const { state, dispatch, remainingTotal, lastPayment } = useSplit();
  const tableId = app.ticketTable!;

  if (!lastPayment) return null;

  const guestPayment = state.itemPayments[lastPayment.guestNum];

  const nextSplitGuest = () => {
    dispatch({ type: "NEXT_GUEST" });
    app.setView("split");
  };

  return (
    <div style={S.page}>
      <header style={S.header}>
        <span />
        <span style={S.headerTitle}>Guest {lastPayment.guestNum} — pays</span>
        <span />
      </header>

      <div style={S.ticket}>
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
        ) : (
          <button
            style={{
              ...S.sendBtn,
              ...(guestPayment?.amount && !guestPayment?.confirmed ? { opacity: 0.5, cursor: "not-allowed" } : {}),
            }}
            onClick={() => app.setView("splitDone")}
            disabled={!!guestPayment?.amount && !guestPayment?.confirmed}
          >
            Confirm
          </button>
        )}
      </div>
    </div>
  );
}
