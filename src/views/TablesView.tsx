import { useState, useMemo } from "react";
import { STATUS_CONFIG } from "../data/constants";
import { getTableStatus, getItemDestination } from "../utils/helpers";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useLongPress } from "../hooks/useLongPress";
import { useTableSwap } from "../hooks/useTableSwap";
import { TableCard } from "../components/TableCard";
import { SwapSheet } from "../components/SwapSheet";
import { Modal } from "../components/Modal";
import { ScreenHeader } from "../components/ScreenHeader";
import { PlusIcon } from "../components/icons";
import { S } from "../styles/appStyles";
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

function resolveGridStyles(bp: { isTablet: boolean; isTabletLandscape: boolean; isLaptop: boolean; isDesktop: boolean }) {
  const isWide = bp.isDesktop || bp.isLaptop || bp.isTabletLandscape;
  const isBig = isWide || bp.isTablet;

  let grid, card;
  if (bp.isDesktop) {
    grid = S.gridDesktop;
    card = S.tableCardDesktop;
  } else if (bp.isLaptop) {
    grid = S.gridLaptop;
    card = S.tableCardLaptop;
  } else if (bp.isTabletLandscape) {
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


export function TablesView() {
  const { setView, setActiveTable, showToast } = useApp();
  const { orders, seatedTables, seatTable, sentBatches, markedBatches, swapTables, permanentTables, dynamicTables, addDynamicTable, resolveTableDisplayId } = useTable();
  const bp = useBreakpoint();
  const styles = resolveGridStyles(bp);

  const [seatConfirmTable, setSeatConfirmTable] = useState<TableId | null>(null);
  const [showNewTableModal, setShowNewTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState("");

  const allTables = useMemo((): TableConfig[] => {
    return [...permanentTables, ...dynamicTables] as TableConfig[];
  }, [permanentTables, dynamicTables]);

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
      <ScreenHeader
        title={styles.isWide ? "Floor" : ""}
        left={styles.isWide ? "none" : "profile"}
        right={
          <button
            onClick={() => {
              setNewTableName("");
              setShowNewTableModal(true);
            }}
            style={S.back}
            aria-label="Create new table"
            title="Create new table"
          >
            <PlusIcon size={22} />
          </button>
        }
      />

      <div style={{ ...styles.grid, paddingBottom: swap.isActive ? 160 : styles.isBig ? 20 : 16 }}>
        {(() => {
          let cardIndex = 0;
          return allTables.map((t) => {
            const status = getTableStatus(t.id, orders, seatedTables, sentBatches, markedBatches);
            const destinations = status === "unconfirmed" ? getTableDestinations(t.id, orders, sentBatches) : [];
            const staggerIndex = cardIndex++;

            const isSource = swap.sourceTable === t.id;
            const isTarget = swap.targetTable === t.id;
            const swapStatus = isSource ? "source" : isTarget ? "target" : swap.isActive ? "dimmed" : "none";

            return (
              <TableCard
                key={t.id}
                tableId={t.id}
                label={t.label}
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
          title="New table"
          onClose={() => setShowNewTableModal(false)}
          onConfirm={() => {
            const name = newTableName.trim();
            if (!name) return;
            addDynamicTable(name);
            setShowNewTableModal(false);
          }}
          confirmText="Add Table"
        >
            <input
              autoFocus
              type="text"
              placeholder="Table name"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTableName.trim()) {
                  addDynamicTable(newTableName.trim());
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
                marginBottom: 8,
              }}
            />
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

    </div>
  );
}
