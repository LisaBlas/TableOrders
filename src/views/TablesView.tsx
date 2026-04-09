import { useState, useRef, useCallback } from "react";
import { TABLES, STATUS_CONFIG } from "../data/constants";
import { getTableStatus } from "../utils/helpers";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { S } from "../styles/appStyles";
import { Modal } from "../components/Modal";

const LONG_PRESS_MS = 500;

export function TablesView() {
  const { setView, setActiveTable, showToast } = useApp();
  const { orders, seatedTables, seatTable, sentBatches, markedBatches, swapTables } = useTable();
  const [seatConfirmTable, setSeatConfirmTable] = useState<string | number | null>(null);
  const [swapSourceTable, setSwapSourceTable] = useState<string | number | null>(null);
  const [swapTargetTable, setSwapTargetTable] = useState<string | number | null>(null);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFiredRef = useRef(false);

  const startLongPress = useCallback((tableId: string | number) => {
    longFiredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longFiredRef.current = true;
      setSwapSourceTable(tableId);
      setSwapTargetTable(null);
    }, LONG_PRESS_MS);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTableClick = (tableId: string | number) => {
    if (longFiredRef.current) return;
    cancelLongPress();

    // In swap mode: select target
    if (swapSourceTable !== null) {
      if (tableId === swapSourceTable) return;
      setSwapTargetTable(tableId);
      return;
    }

    const status = getTableStatus(tableId, orders, seatedTables, sentBatches, markedBatches);
    if (status === "open") {
      setSeatConfirmTable(tableId);
    } else {
      openTable(tableId);
    }
  };

  const openTable = (tableId: string | number) => {
    setActiveTable(tableId);
    setView("order");
  };

  const confirmSeatTable = () => {
    if (seatConfirmTable) {
      seatTable(seatConfirmTable);
      showToast(`Table ${seatConfirmTable} seated`);
      openTable(seatConfirmTable);
      setSeatConfirmTable(null);
    }
  };

  const confirmSwap = () => {
    if (swapSourceTable !== null && swapTargetTable !== null) {
      swapTables(swapSourceTable, swapTargetTable);
      setSwapSourceTable(null);
      setSwapTargetTable(null);
    }
  };

  const cancelSwap = () => {
    setSwapSourceTable(null);
    setSwapTargetTable(null);
  };

  return (
    <div style={S.page}>
      <header style={S.header}>
        <span style={S.headerTitle}>Floor</span>
        <span style={S.headerSub}>
          {new Date().toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </span>
      </header>
      <div style={S.legend}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <span key={k} style={S.legendItem}>
            <span style={{ ...S.dot, background: v.dot }} />
            {v.label}
          </span>
        ))}
      </div>
      <button style={S.salesBtn} onClick={() => setView("dailySales")}>
        <span style={S.salesIcon}>📊</span>
        Daily Sales
      </button>
      <div style={S.grid}>
        {TABLES.map((t: any) => {
          if (t.isDivider) {
            return (
              <div key={t.label} style={{ ...S.sentDivider, gridColumn: "1 / -1", margin: "8px 0 4px" }}>
                <div style={S.sentDividerLine} />
                <span style={S.sentDividerText}>{t.label}</span>
                <div style={S.sentDividerLine} />
              </div>
            );
          }
          const status = getTableStatus(t.id, orders, seatedTables, sentBatches, markedBatches);
          const cfg = STATUS_CONFIG[status];

          const isSource = swapSourceTable === t.id;
          const isTarget = swapTargetTable === t.id;
          const inSwapMode = swapSourceTable !== null;

          let cardBorder = `1.5px solid ${cfg.border}`;
          let cardBg = cfg.bg;
          let cardOpacity = inSwapMode && !isSource && !isTarget ? 0.5 : 1;

          if (isSource) {
            cardBorder = "2px solid #f59e0b";
            cardBg = "#fffbeb";
          } else if (isTarget) {
            cardBorder = "2px solid #3b82f6";
            cardBg = "#eff6ff";
          }

          return (
            <button
              key={t.id}
              style={{
                ...S.tableCard,
                background: cardBg,
                border: cardBorder,
                opacity: cardOpacity,
                transition: "opacity 0.2s ease, border 0.15s ease",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
              onPointerDown={() => {
                if (!inSwapMode) startLongPress(t.id);
              }}
              onPointerUp={cancelLongPress}
              onPointerLeave={cancelLongPress}
              onPointerCancel={cancelLongPress}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => handleTableClick(t.id)}
            >
              {isSource && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.3px", marginBottom: 2 }}>
                  MOVING
                </span>
              )}
              {isTarget && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.3px", marginBottom: 2 }}>
                  DESTINATION
                </span>
              )}
              {!isSource && !isTarget && <span style={{ ...S.tableDot, background: cfg.dot }} />}
              <span style={S.tableNum}>{t.id}</span>
              <span style={{ ...S.tableStatus, color: isSource ? "#f59e0b" : isTarget ? "#3b82f6" : cfg.text }}>
                {isSource ? "moving" : isTarget ? "selected" : cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      {seatConfirmTable && (
        <Modal
          title={`Seat Table ${seatConfirmTable}?`}
          onClose={() => setSeatConfirmTable(null)}
          onConfirm={confirmSeatTable}
          confirmText="Seat Table"
        >
          <div style={S.modalMessage}>
            Mark this table as seated for incoming guests.
          </div>
        </Modal>
      )}

      {/* Swap bottom sheet */}
      {swapSourceTable !== null && (
        <>
          <div style={S.variantSheetOverlay} onClick={cancelSwap} />
          <div style={S.variantSheet}>
            <div style={S.variantSheetHeader}>
              Move Table {swapSourceTable}
            </div>
            <div style={{ fontSize: 14, color: "#888", textAlign: "center", marginBottom: 20 }}>
              {swapTargetTable !== null
                ? `Table ${swapSourceTable} → Table ${swapTargetTable}`
                : "Tap a table to select destination"}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{
                  flex: 1,
                  padding: "14px 0",
                  borderRadius: 10,
                  border: "1.5px solid #ddd",
                  background: "#f5f4f0",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#555",
                  cursor: "pointer",
                }}
                onClick={cancelSwap}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "14px 0",
                  borderRadius: 10,
                  border: "none",
                  background: swapTargetTable !== null ? "#1a1a1a" : "#ccc",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: swapTargetTable !== null ? "pointer" : "default",
                }}
                onClick={confirmSwap}
                disabled={swapTargetTable === null}
              >
                Confirm
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
