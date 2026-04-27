import { useState } from "react";
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
import { LogoutIcon, ReopenIcon, SalesIcon } from "../components/icons";
import type { TableId, TableConfig } from "../types";

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
  return {
    header: isBig ? S.headerTablet : S.header,
    grid: isWide ? S.gridTabletLandscape : bp.isTablet ? S.gridTablet : S.grid,
    card: isWide ? S.tableCardTabletLandscape : bp.isTablet ? S.tableCardTablet : S.tableCard,
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
  const { orders, seatedTables, seatTable, sentBatches, markedBatches, swapTables, lastClosedSession, reopenLastClosed } = useTable();
  const bp = useBreakpoint();
  const styles = resolveGridStyles(bp);

  const [seatConfirmTable, setSeatConfirmTable] = useState<TableId | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
      showToast(`Table ${seatConfirmTable} seated`);
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
          {lastClosedSession && (
            <button
              style={{
                background: "#fef3c7",
                border: "1.5px solid #f59e0b",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                padding: "7px 10px",
                lineHeight: 1,
                color: "#92400e",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
              onClick={reopenLastClosed}
            >
              T.{lastClosedSession.tableId}
              <ReopenIcon size={15} color="#92400e" />
            </button>
          )}
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
          return (TABLES as TableConfig[]).map((t) => {
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

            return (
              <TableCard
                key={t.id}
                tableId={t.id}
                cfg={STATUS_CONFIG[status]}
                isSource={swap.sourceTable === t.id}
                isTarget={swap.targetTable === t.id}
                inSwapMode={swap.isActive}
                destinations={destinations}
                isWide={styles.isWide}
                baseStyle={styles.card}
                staggerIndex={staggerIndex}
                onPointerDown={!swap.isActive ? () => startLongPress(t.id) : undefined}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onPointerCancel={cancelLongPress}
                onClick={() => handleTableClick(t.id)}
              />
            );
          });
        })()}
      </div>

      {seatConfirmTable !== null && (
        <Modal
          title={`Seat Table ${seatConfirmTable}?`}
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
