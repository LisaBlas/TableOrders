import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { S } from "../styles/appStyles";
import { Modal } from "../components/Modal";
import { BillCard } from "../components/BillCard";
import { SalesSummary } from "../components/SalesSummary";
import { BackIcon } from "../components/icons";

export function DailySalesView() {
  const app = useApp();
  const {
    paidBills,
    clearTodayBills,
    markBillAddedToPOS,
    restoreBillFromPOS,
    removePaidBillItem,
    restorePaidBillItem,
    editingBillIndex,
    enterBillEditMode,
    exitBillEditMode,
    cancelBillEditMode,
    dailySalesTab, setDailySalesTab,
  } = app;

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClear = () => {
    if (paidBills.length === 0) return;
    clearTodayBills();
    setShowClearConfirm(false);
    app.showToast("Daily sales cleared");
  };

  // Total tab aggregation - by POS ID for easy POS entry
  const renderTotalTab = () => {
    type PosEntry = { posId: string; posName: string; qty: number; revenue: number; items: string[] };
    type BillGroup = { tableId: number; timestamp: string; items: PosEntry[] };
    const activeMap = new Map<string, PosEntry>();
    const removedBillGroups: BillGroup[] = [];

    const addToMap = (map: Map<string, PosEntry>, posId: string, posName: string, item: typeof paidBills[0]["items"][0], qty: number) => {
      if (qty <= 0) return;
      const key = `${posId}::${posName}::${item.name}`;
      if (!map.has(key)) map.set(key, { posId, posName, qty: 0, revenue: 0, items: [] });
      const entry = map.get(key)!;
      entry.qty += qty;
      entry.revenue += item.price * qty;
      if (!entry.items.includes(item.name)) entry.items.push(item.name);
    };

    paidBills.forEach((bill) => {
      const billRemoved = !!bill.addedToPOS;
      const billRemovedMap = new Map<string, PosEntry>();

      bill.items.forEach((item) => {
        const posId = item.posId || "NO_POS_ID";
        const posName = item.posName || item.shortName || item.name;
        const crossedCount = item.crossedQty ?? (item.crossed ? item.qty : 0);
        const activeCount = billRemoved ? 0 : item.qty - crossedCount;
        const removedCount = billRemoved ? item.qty : crossedCount;

        addToMap(activeMap, posId, posName, item, activeCount);
        if (removedCount > 0) addToMap(billRemovedMap, posId, posName, item, removedCount);
      });

      if (billRemovedMap.size > 0) {
        removedBillGroups.push({
          tableId: bill.tableId as number,
          timestamp: bill.timestamp,
          items: Array.from(billRemovedMap.values()),
        });
      }
    });

    const parsePos = (id: string) => {
      const parts = id.split("-");
      return { base: parseInt(parts[0]) || 0, suffix: parseInt(parts[1]) || 0 };
    };
    const sort = (m: Map<string, PosEntry>) =>
      Array.from(m.values()).sort((a, b) => {
        const pa = parsePos(a.posId);
        const pb = parsePos(b.posId);
        return pa.base !== pb.base ? pa.base - pb.base : pa.suffix - pb.suffix;
      });

    const isMissingPosId = (id: string) => id === "NO_POS_ID" || id === "0000";
    const activeAll = sort(activeMap);
    const withPosId = activeAll.filter((i) => !isMissingPosId(i.posId));
    const missingPosId = activeAll.filter((i) => isMissingPosId(i.posId));

    const renderPosRow = (item: PosEntry, color: string, compact?: boolean) => (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "monospace", fontSize: compact ? 14 : 20, fontWeight: 900, color, width: compact ? "6ch" : "8ch", flexShrink: 0 }}>
          [{item.posId}]
        </span>
        <span style={{ flex: 1, fontSize: compact ? 12 : 15, fontWeight: 600, color }}>
          {item.posName}
          {item.items[0] && item.items[0] !== item.posName && (
            <span style={{ display: "block", fontSize: compact ? 10 : 12, fontWeight: 400, color: "#999" }}>{item.items[0]}</span>
          )}
        </span>
        <span style={{ fontSize: compact ? 16 : 26, fontWeight: 900, color }}>×{item.qty}</span>
      </div>
    );

    const renderGroup = (items: PosEntry[], isMissing: boolean) => {
      if (items.length === 0) return null;
      const color = isMissing ? "#e07b5a" : "#1a1a1a";
      return (
        <div style={{ ...S.billCard, ...(isMissing ? { borderLeft: "4px solid #e07b5a" } : {}) }}>
          {items.map((item, idx) => (
            <div key={idx}>
              {idx > 0 && <div style={S.divider} />}
              {renderPosRow(item, color)}
            </div>
          ))}
        </div>
      );
    };

    const renderRemovedBillGroups = () => {
      if (removedBillGroups.length === 0) return null;
      return (
        <div style={{ ...S.billCard, borderLeft: "3px solid #c0392b", background: "#fff5f5", padding: "12px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f5c2c2" }}>
            Already added
          </div>
          {removedBillGroups.map((group, groupIdx) => {
            const timeStr = new Date(group.timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={groupIdx}>
                {groupIdx > 0 && (
                  <div style={{ ...S.divider, margin: "10px -12px", borderTopWidth: 2, borderTopStyle: "dashed", borderTopColor: "#f5c2c2" }} />
                )}
                <div style={{ fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Table {group.tableId}</span>
                  <span style={{ fontSize: 10, fontWeight: 400 }}>{timeStr}</span>
                </div>
                {group.items.map((item, idx) => (
                  <div key={idx}>
                    {idx > 0 && <div style={{ ...S.divider, margin: "4px 0" }} />}
                    {renderPosRow(item, "#555", true)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div style={S.billsList}>
        {renderRemovedBillGroups()}
        {withPosId.length > 0 && (
          <div style={S.billCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #ebe9e3" }}>
              Sales
            </div>
            {withPosId.map((item, idx) => (
              <div key={idx}>
                {idx > 0 && <div style={S.divider} />}
                {renderPosRow(item, "#1a1a1a")}
              </div>
            ))}
          </div>
        )}
        {missingPosId.length > 0 && (
          <>
            <div style={{ ...S.subcategorySeparator, color: "#e07b5a" } as React.CSSProperties}>⚠️ Missing POS IDs</div>
            {renderGroup(missingPosId, true)}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={S.page}>
      <header style={S.header}>
        <button style={S.back} onClick={() => app.setView("tables")}>
          <BackIcon size={22} />
        </button>
        <span style={S.headerTitle}>Daily Sales</span>
        <span />
      </header>

      {paidBills.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyStateIcon}>📊</div>
          <div style={S.emptyStateText}>No sales yet today.<br />Closed bills will appear here.</div>
        </div>
      ) : (
        <>
          <div style={S.tabs}>
            <div style={S.tabsContainer}>
              <button
                style={{ ...S.tab, ...(dailySalesTab === "chronological" ? S.tabActive : {}) }}
                onClick={() => setDailySalesTab("chronological")}
              >Chronological</button>
              <button
                style={{ ...S.tab, ...(dailySalesTab === "total" ? S.tabActive : {}) }}
                onClick={() => setDailySalesTab("total")}
              >Total</button>
              <div style={{ ...S.tabIndicator, transform: dailySalesTab === "total" ? "translateX(100%)" : "translateX(0)" }} />
            </div>
          </div>

          <SalesSummary paidBills={paidBills} />

          {dailySalesTab === "chronological" && (
            <div style={S.billsList}>
              {[...paidBills].reverse().map((bill, reverseIdx) => {
                const billIndex = paidBills.length - 1 - reverseIdx;
                return (
                  <BillCard
                    key={reverseIdx}
                    bill={bill}
                    isEditing={editingBillIndex === billIndex}
                    onEdit={() => enterBillEditMode(billIndex)}
                    onDone={exitBillEditMode}
                    onCancel={cancelBillEditMode}
                    onDelete={() => markBillAddedToPOS(billIndex)}
                    onRestore={() => restoreBillFromPOS(billIndex)}
                    onRemoveItem={(itemId) => removePaidBillItem(billIndex, itemId)}
                    onRestoreItem={(itemId) => restorePaidBillItem(billIndex, itemId)}
                  />
                );
              })}
            </div>
          )}

          {dailySalesTab === "total" && renderTotalTab()}

          <button style={S.clearDayBtn} onClick={() => setShowClearConfirm(true)}>Clear Daily Sales</button>
        </>
      )}

      {showClearConfirm && (
        <Modal
          title="Clear Daily Sales?"
          onClose={() => setShowClearConfirm(false)}
          onConfirm={handleClear}
          confirmText="Clear"
          confirmStyle={S.modalDeleteBtn}
        >
          <div style={S.modalMessage}>
            This will clear today's sales from view. Bills are preserved in the database for reporting.
          </div>
        </Modal>
      )}
    </div>
  );
}
