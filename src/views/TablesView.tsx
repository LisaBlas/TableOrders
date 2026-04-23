import { useState, useRef, useCallback } from "react";
import { TABLES, STATUS_CONFIG } from "../data/constants";
import { getTableStatus, getItemDestination } from "../utils/helpers";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { S } from "../styles/appStyles";
import { Modal } from "../components/Modal";

const DESTINATION_EMOJI: Record<string, string> = { bar: "🍷", counter: "🧀", kitchen: "🍽️" };
const DESTINATION_ORDER = ["bar", "counter", "kitchen"];

function getTableDestinations(tableId: string | number, orders: any, sentBatches: any): string[] {
  const key = String(tableId);
  const allItems = [
    ...(orders[key] || []),
    ...((sentBatches[key] || []).flatMap((b: any) => b.items)),
  ];
  const found = new Set(allItems.map((item: any) => getItemDestination(item)));
  return DESTINATION_ORDER.filter((d) => found.has(d));
}

const LONG_PRESS_MS = 500;

export function TablesView() {
  const { setView, setActiveTable, showToast } = useApp();
  const { orders, seatedTables, seatTable, sentBatches, markedBatches, swapTables } = useTable();
  const { isMobile, isTablet, isTabletLandscape, isDesktop } = useBreakpoint();
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
    // In swap mode: select target (bypass long-press guard — longFiredRef is stale from the activation press)
    if (swapSourceTable !== null) {
      if (tableId === swapSourceTable) return;
      setSwapTargetTable(tableId);
      return;
    }

    if (longFiredRef.current) return;
    cancelLongPress();

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

  // Responsive styles
  const headerStyle = isTablet || isTabletLandscape || isDesktop ? S.headerTablet : S.header;
  const gridStyle = isDesktop || isTabletLandscape ? S.gridTabletLandscape : isTablet ? S.gridTablet : S.grid;
  const tableCardBaseStyle = isDesktop || isTabletLandscape ? S.tableCardTabletLandscape : isTablet ? S.tableCardTablet : S.tableCard;

  return (
    <div style={S.page}>
      <header style={headerStyle}>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>
          {new Date().toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </span>
        <button
          style={{
            background: "none",
            border: "1.5px solid #ddd",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            padding: "8px 12px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          }}
          onClick={() => setView("dailySales")}
        >
          <span>Daily Sales</span>
        </button>
      </header>
      <div style={{ ...gridStyle, paddingBottom: swapSourceTable !== null ? 160 : (isTablet || isTabletLandscape || isDesktop ? 20 : 16) }}>
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
                ...tableCardBaseStyle,
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
              {(() => {
                const dests = getTableDestinations(t.id, orders, sentBatches);
                if (!dests.length) return null;
                return (
                  <span style={{ position: "absolute", top: 5, right: 6, fontSize: isDesktop || isTabletLandscape ? 11 : 9, letterSpacing: 1, lineHeight: 1 }}>
                    {dests.map((d) => DESTINATION_EMOJI[d]).join("")}
                  </span>
                );
              })()}
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
      )}
    </div>
  );
}
