import { useApp } from "../contexts/AppContext";
import { useSplit } from "../contexts/SplitContext";
import { S } from "../styles/appStyles";

export function SplitItemView() {
  const app = useApp();
  const { state, dispatch, selectedItems, selectedTotal, remainingTotal, currentGuestNum } = useSplit();
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

  return (
    <div style={S.page}>
      <header style={S.header}>
        <button style={S.back} onClick={() => { dispatch({ type: "RESET" }); app.setView("order"); }}>
          ← Back
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
          return (
            <button
              key={item._uid}
              style={{
                ...S.splitItem,
                background: selected ? "#f0f7f1" : "#fff",
                border: selected ? "1.5px solid #a3c4a8" : "1.5px solid #ebe9e3",
              }}
              onClick={() => dispatch({ type: "TOGGLE_ITEM", uid: item._uid })}
            >
              <span style={{
                ...S.splitItemCheck,
                background: selected ? "#2d5a35" : "#e8e8e6",
                color: selected ? "#fff" : "transparent",
              }}>✓</span>
              <span style={S.splitItemName}>{item.name}</span>
              <span style={S.splitItemPrice}>{item.price.toFixed(2)}€</span>
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
