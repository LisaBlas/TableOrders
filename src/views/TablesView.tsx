import { useState, useMemo } from "react";
import { TABLES, STATUS_CONFIG } from "../data/constants";
import { getTableStatus, getItemDestination } from "../utils/helpers";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useTable } from "../contexts/TableContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useLongPress } from "../hooks/useLongPress";
import { useTableSwap } from "../hooks/useTableSwap";
import { TableCard } from "../components/TableCard";
import { SwapSheet } from "../components/SwapSheet";
import { Modal } from "../components/Modal";
import { S } from "../styles/appStyles";
import { LogoutIcon, SalesIcon } from "../components/icons";
import type { TableId, TableConfig, TableEntry } from "../types";

const DESTINATION_ORDER = ["bar", "counter", "kitchen"] as const;

function getTableDestinations(tableId: TableId, orders: any, sentBatches: any): string[] {
  const key = String(tableId);
  const allItems = [
    ...(orders[key] || []),
    ...((sentBatches[key] || []).flatMap((b: any) => b.items)),
  ];
  const found = new Set(allItems.map((item: any) => getItemDestination(item)));
  return DESTINATION_ORDER.filter((d) => found.has(d));
}

function resolveGridStyles(bp: { isTablet: boolean; isTabletLandscape: boolean; isDesktop: boolean }) {
  const isWide = bp.isDesktop || bp.isTabletLandscape;
  const isBig = isWide || bp.isTablet;

  let grid, card;
  if (isWide) {
    grid = S.gridTabletLandscape;
    card = S.tableCardTabletLandscape;
  } else if (bp.isTablet) {
    grid = S.gridTablet;
    card = S.tableCardTablet;
  } else {
    grid = S.grid;
    card = S.tableCard;
  }

  return {
    header: isBig ? S.headerTablet : S.header,
    grid,
    card,
    isWide,
    isBig,
  };
}

const todayLabel = new Date().toLocaleDateString("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function TablesView() {
  const { setView, setActiveTable, showToast } = useApp();
  const { logout } = useAuth();
  const { orders, seatedTables, seatTable, sentBatches, markedBatches, swapTables, dynamicTables, addDynamicTable, resolveTableDisplayId } = useTable();
  const bp = useBreakpoint();
  const styles = resolveGridStyles(bp);

  const [seatConfirmTable, setSeatConfirmTable] = useState<TableId | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNewTableModal, setShowNewTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableLocation, setNewTableLocation] = useState<"inside" | "outside">("inside");

  const allTables = useMemo((): TableConfig[] => {
    const result = [...TABLES] as TableConfig[];
    const insideDynamic = dynamicTables.filter((t) => t.location === "inside");
    const outsideDynamic = dynamicTables.filter((t) => t.location === "outside");
    if (insideDynamic.length > 0) {
      const outsideIdx = result.findIndex((t) => t.isDivider && t.label === "Outside");
      result.splice(outsideIdx >= 0 ? outsideIdx : result.length, 0, ...insideDynamic);
    }
    if (outsideDynamic.length > 0) {
      result.push(...outsideDynamic);
    }
    return result;
  }, [dynamicTables]);

  const swap = useTableSwap(swapTables);
  const { start: startLongPress, cancel: cancelLongPress, didFireRef: longFiredRef } =
    useLongPress<TableId>(swap.activate);

  const openTable = (tableId: TableId) => {
    setActiveTable(tableId);
    setView("order");
  };

  const handleTableClick = (tableId: TableId) => {
    if (swap.isActive) {
      if (tableId !== swap.sourceTable) swap.selectTarget(tableId);
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

  const confirmSeat = () => {
    if (seatConfirmTable) {
      seatTable(seatConfirmTable);
      showToast(`Table ${resolveTableDisplayId(seatConfirmTable)} seated`);
      openTable(seatConfirmTable);
      setSeatConfirmTable(null);
    }
  };

  return (
    <div style={S.page}>
      <header style={styles.header}>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>
          {todayLabel}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            style={{
              background: "none",
              border: "1.5px solid #ddd",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              padding: "7px 10px",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "#555",
            }}
            onClick={() => { setNewTableName(""); setNewTableLocation("inside"); setShowNewTableModal(true); }}
          >
            <span style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>+</span>
            Table
          </button>
          <button
            style={{
              background: "none",
              border: "1.5px solid #ddd",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              padding: "7px 10px",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: "#555",
            }}
            onClick={() => setView("dailySales")}
          >
            <SalesIcon size={15} color="#555" />
            Sales
          </button>
          <button
            style={{
              background: "none",
              border: "1.5px solid #ccc",
              borderRadius: 8,
              padding: "7px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#555",
            }}
            onClick={() => setShowLogoutModal(true)}
          >
            <LogoutIcon size={16} color="#555" />
          </button>
        </div>
      </header>

      <div style={{ ...styles.grid, paddingBottom: swap.isActive ? 160 : styles.isBig ? 20 : 16 }}>
        {(() => {
          let cardIndex = 0;
          return allTables.map((t) => {
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
            const destinations = status === "unconfirmed" ? getTableDestinations(t.id, orders, sentBatches) : [];
            const staggerIndex = cardIndex++;

            const isSource = swap.sourceTable === t.id;
            const isTarget = swap.targetTable === t.id;
            const swapStatus = isSource ? "source" : isTarget ? "target" : swap.isActive ? "dimmed" : "none";

            const isDynamic = String(t.id).startsWith("ext-");
            return (
              <TableCard
                key={t.id}
                tableId={t.id}
                label={isDynamic ? (t as TableEntry).label : undefined}
                cfg={STATUS_CONFIG[status]}
                swapStatus={swapStatus}
                destinations={destinations}
                style={{
                  base: styles.card,
                  isWide: styles.isWide,
                  staggerIndex,
                }}
                handlers={{
                  onPointerDown: !swap.isActive ? () => startLongPress(t.id) : undefined,
                  onPointerUp: cancelLongPress,
                  onPointerLeave: cancelLongPress,
                  onPointerCancel: cancelLongPress,
                  onClick: () => handleTableClick(t.id),
                }}
              />
            );
          });
        })()}
      </div>

      {showNewTableModal && (
        <Modal
          title="New Table"
          onClose={() => setShowNewTableModal(false)}
          onConfirm={() => {
            const name = newTableName.trim();
            if (!name) return;
            addDynamicTable(name, newTableLocation);
            setShowNewTableModal(false);
          }}
          confirmText="Add Table"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 8 }}>
            <input
              autoFocus
              type="text"
              placeholder="Table name"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTableName.trim()) {
                  addDynamicTable(newTableName.trim(), newTableLocation);
                  setShowNewTableModal(false);
                }
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 15,
                border: "1.5px solid #ddd",
                borderRadius: 8,
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              {(["inside", "outside"] as const).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setNewTableLocation(loc)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    borderRadius: 8,
                    border: newTableLocation === loc ? "2px solid #333" : "1.5px solid #ddd",
                    background: newTableLocation === loc ? "#333" : "none",
                    color: newTableLocation === loc ? "#fff" : "#555",
                    textTransform: "capitalize",
                  }}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {seatConfirmTable !== null && (
        <Modal
          title={`Seat Table ${resolveTableDisplayId(seatConfirmTable)}?`}
          onClose={() => setSeatConfirmTable(null)}
          onConfirm={confirmSeat}
          confirmText="Seat Table"
        >
          <div style={S.modalMessage}>Mark this table as seated for incoming guests.</div>
        </Modal>
      )}

      {swap.isActive && (
        <SwapSheet
          sourceTable={swap.sourceTable!}
          targetTable={swap.targetTable}
          onConfirm={swap.confirm}
          onCancel={swap.cancel}
        />
      )}

      {showLogoutModal && (
        <Modal
          title="Log Out"
          onClose={() => setShowLogoutModal(false)}
          onConfirm={() => {
            logout();
            setShowLogoutModal(false);
            showToast("Logged out");
          }}
          confirmText="Log Out"
        >
          <div style={S.modalMessage}>Are you sure you want to log out?</div>
        </Modal>
      )}
    </div>
  );
}
