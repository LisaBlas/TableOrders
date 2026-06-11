import { useApp } from "../contexts/AppContext";
import { useSplit } from "../contexts/SplitContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { ScreenHeader } from "../components/ScreenHeader";
import { S } from "../styles/appStyles";
import { colors } from "../styles/tokens";

function getSplitItemStyles(selected: boolean, isGutschein?: boolean) {
  if (selected && isGutschein) {
    return {
      background: colors.successBg,
      border: `1.5px solid ${colors.success}`,
      checkBg: colors.success,
    };
  }
  if (selected && !isGutschein) {
    return {
      background: colors.successBg,
      border: `1.5px solid ${colors.divider}`,
      checkBg: colors.success,
    };
  }
  if (!selected && isGutschein) {
    return {
      background: colors.surface,
      border: `1.5px solid ${colors.successBg}`,
      checkBg: colors.chipBg,
    };
  }
  return {
    background: colors.surface,
    border: `1.5px solid ${colors.border}`,
    checkBg: colors.chipBg,
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
  const isLargeScreen = isTablet || isTabletLandscape || isDesktop;
  const handleBack = () => {
    if (!hasCompletedPayments) {
      dispatch({ type: "RESET" });
      app.setView("order");
    }
  };
  const selectAllButton = (
    <button style={S.selectAllBtn} onClick={() => dispatch({ type: "SELECT_ALL" })}>All</button>
  );

  // Mobile layout
  if (!isLargeScreen) {
    return (
      <div style={S.page}>
        <ScreenHeader
          title={`Guest ${currentGuestNum}`}
          left="back"
          onBack={handleBack}
          backDisabled={hasCompletedPayments}
          right={selectAllButton}
        />

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
                <span style={{ ...S.splitItemName, ...(isGutschein ? { color: colors.success, fontWeight: 600 } : {}) }}>{item.name}</span>
                <span style={{ ...S.splitItemPrice, ...(isGutschein ? { color: colors.success } : {}) }}>
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
              <span style={{ ...S.orderBarChip, background: colors.successBg, color: colors.success }}>
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
      <ScreenHeader
        title={`Guest ${currentGuestNum}`}
        left="back"
        onBack={handleBack}
        backDisabled={hasCompletedPayments}
        right={selectAllButton}
      />

      <div style={isDesktop ? S.billContainerTabletLandscape : S.billContainerTablet}>
        {/* Left column: Item list */}
        <div style={S.billReceiptColumn}>
          <div style={isDesktop ? S.billActionsCardLandscape : S.billActionsCard}>
            {state.payments.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.muted, marginBottom: 8 }}>
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
                    <span style={{ ...S.splitItemName, ...(isGutschein ? { color: colors.success, fontWeight: 600 } : {}) }}>{item.name}</span>
                    <span style={{ ...S.splitItemPrice, ...(isGutschein ? { color: colors.success } : {}) }}>
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
            <div style={{ fontSize: 14, color: state.selected.size > 0 ? colors.muted : colors.dimmed, marginBottom: 8 }}>
              {state.selected.size > 0
                ? `${state.selected.size} item${state.selected.size > 1 ? "s" : ""} selected`
                : "No items selected"
              }
            </div>
            <div style={{ fontSize: 14, color: state.selected.size > 0 ? colors.success : colors.dimmed, fontWeight: 600 }}>
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
