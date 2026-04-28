import { useApp } from "../contexts/AppContext";
import { useSplit } from "../contexts/SplitContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { BackIcon } from "../components/icons";
import { S } from "../styles/appStyles";

function getSplitItemStyles(selected: boolean, isGutschein?: boolean) {
  if (selected && isGutschein) {
    return {
      background: "#f0faf4",
      border: "1.5px solid #4ade80",
      checkBg: "#16a34a",
    };
  }
  if (selected && !isGutschein) {
    return {
      background: "#f0f7f1",
      border: "1.5px solid #a3c4a8",
      checkBg: "#2d5a35",
    };
  }
  if (!selected && isGutschein) {
    return {
      background: "#f6fef8",
      border: "1.5px solid #86efac",
      checkBg: "#e8e8e6",
    };
  }
  return {
    background: "#fff",
    border: "1.5px solid #ebe9e3",
    checkBg: "#e8e8e6",
  };
}

export function SplitItemView() {
  const app = useApp();
  const { state, dispatch, selectedItems, selectedTotal, remainingTotal, currentGuestNum } = useSplit();
  const { isTablet, isTabletLandscape, isDesktop } = useBreakpoint();
  const tableId = app.ticketTable!;

  const confirmSplitPayment = () => {
    if (selectedItems.length === 0) return;
    dispatch({
      type: "CONFIRM_GUEST",
      guestNum: currentGuestNum,
      items: selectedItems,
      total: selectedTotal,
    });
    app.setView("splitConfirm");
  };

  const hasCompletedPayments = state.payments.length > 0;
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
              ...(hasCompletedPayments ? { opacity: 0.3, cursor: "not-allowed" } : {})
            }}
            onClick={() => {
              if (!hasCompletedPayments) {
                dispatch({ type: "RESET" });
                app.setView("order");
              }
            }}
            disabled={hasCompletedPayments}
          >
            <BackIcon size={22} />
          </button>
          <span style={S.headerTitle}>Guest {currentGuestNum}</span>
          <button style={S.selectAllBtn} onClick={() => dispatch({ type: "SELECT_ALL" })}>All</button>
        </header>

        {state.payments.length > 0 && (
          <div style={S.splitProgress}>
            {state.payments.map((p) => (
              <span key={p.guestNum} style={S.splitProgressChip}>
                G{p.guestNum} — {p.total.toFixed(2)}€
              </span>
            ))}
            <span style={S.splitProgressRemaining}>
              Left: {remainingTotal.toFixed(2)}€
            </span>
          </div>
        )}

        <div style={S.splitItemList}>
          {state.remaining.map((item) => {
            const selected = state.selected.has(item._uid);
            const isGutschein = item.isGutschein;
            const styles = getSplitItemStyles(selected, isGutschein);
            return (
              <button
                key={item._uid}
                style={{
                  ...S.splitItem,
                  background: styles.background,
                  border: styles.border,
                }}
                onClick={() => dispatch({ type: "TOGGLE_ITEM", uid: item._uid })}
              >
                <span style={{
                  ...S.splitItemCheck,
                  background: styles.checkBg,
                  color: selected ? "#fff" : "transparent",
                }}>✓</span>
                <span style={{ ...S.splitItemName, ...(isGutschein ? { color: "#16a34a", fontWeight: 600 } : {}) }}>{item.name}</span>
                <span style={{ ...S.splitItemPrice, ...(isGutschein ? { color: "#16a34a" } : {}) }}>
                  {isGutschein ? `−${Math.abs(item.price).toFixed(2)}€` : `${item.price.toFixed(2)}€`}
                </span>
              </button>
            );
          })}
        </div>

        {state.selected.size > 0 && (
          <div style={S.orderBar}>
            <div style={S.orderBarItems}>
              <span style={S.orderBarChip}>
                {state.selected.size} item{state.selected.size > 1 ? "s" : ""} selected
              </span>
              <span style={{ ...S.orderBarChip, background: "#e8f3e9", color: "#2d5a35" }}>
                Remaining after: {(remainingTotal - selectedTotal).toFixed(2)}€
              </span>
            </div>
            <button style={S.sendBtn} onClick={confirmSplitPayment}>
              Guest {currentGuestNum} pays — {selectedTotal.toFixed(2)}€
            </button>
          </div>
        )}
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
            ...(hasCompletedPayments ? { opacity: 0.3, cursor: "not-allowed" } : {})
          }}
          onClick={() => {
            if (!hasCompletedPayments) {
              dispatch({ type: "RESET" });
              app.setView("order");
            }
          }}
          disabled={hasCompletedPayments}
        >
          <BackIcon size={22} />
        </button>
        <span style={S.headerTitle}>Guest {currentGuestNum}</span>
        <button style={S.selectAllBtn} onClick={() => dispatch({ type: "SELECT_ALL" })}>All</button>
      </header>

      <div style={isDesktop ? S.billContainerTabletLandscape : S.billContainerTablet}>
        {/* Left column: Item list */}
        <div style={S.billReceiptColumn}>
          <div style={isDesktop ? S.billActionsCardLandscape : S.billActionsCard}>
            {state.payments.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#6a6862", marginBottom: 8 }}>
                  Progress
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {state.payments.map((p) => (
                    <span key={p.guestNum} style={S.splitProgressChip}>
                      G{p.guestNum} — {p.total.toFixed(2)}€
                    </span>
                  ))}
                  <span style={S.splitProgressRemaining}>
                    Left: {remainingTotal.toFixed(2)}€
                  </span>
                </div>
                <div style={{ ...S.divider, margin: "16px 0" }} />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {state.remaining.map((item) => {
                const selected = state.selected.has(item._uid);
                const isGutschein = item.isGutschein;
                const styles = getSplitItemStyles(selected, isGutschein);
                return (
                  <button
                    key={item._uid}
                    style={{
                      ...S.splitItem,
                      background: styles.background,
                      border: styles.border,
                    }}
                    onClick={() => dispatch({ type: "TOGGLE_ITEM", uid: item._uid })}
                  >
                    <span style={{
                      ...S.splitItemCheck,
                      background: styles.checkBg,
                      color: selected ? "#fff" : "transparent",
                    }}>✓</span>
                    <span style={{ ...S.splitItemName, ...(isGutschein ? { color: "#16a34a", fontWeight: 600 } : {}) }}>{item.name}</span>
                    <span style={{ ...S.splitItemPrice, ...(isGutschein ? { color: "#16a34a" } : {}) }}>
                      {isGutschein ? `−${Math.abs(item.price).toFixed(2)}€` : `${item.price.toFixed(2)}€`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Actions */}
        <div style={isDesktop ? S.billActionsColumnLandscape : S.billActionsColumn}>
          <div style={isDesktop ? S.billActionsCardLandscape : S.billActionsCard}>
            <div style={S.billActionsLabel}>Selection</div>
            <div style={{ fontSize: 14, color: state.selected.size > 0 ? "#6a6862" : "#b5b2ac", marginBottom: 8 }}>
              {state.selected.size > 0
                ? `${state.selected.size} item${state.selected.size > 1 ? "s" : ""} selected`
                : "No items selected"
              }
            </div>
            <div style={{ fontSize: 14, color: state.selected.size > 0 ? "#2d5a35" : "#b5b2ac", fontWeight: 600 }}>
              Remaining after: {(remainingTotal - selectedTotal).toFixed(2)}€
            </div>
          </div>
          <button
            style={{
              ...S.billPrimaryAction,
              ...(state.selected.size === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {})
            }}
            onClick={confirmSplitPayment}
            disabled={state.selected.size === 0}
          >
            Guest {currentGuestNum} pays — {selectedTotal.toFixed(2)}€
          </button>
        </div>
      </div>
    </div>
  );
}
