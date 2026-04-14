import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { S } from "../styles/appStyles";
import { Modal } from "../components/Modal";
import { BillCard } from "../components/BillCard";
import { SalesSummary } from "../components/SalesSummary";

export function DailySalesView() {
  const app = useApp();
  const {
    paidBills, setPaidBills,
    dailySalesTab, setDailySalesTab,
    editingBillIndex, setEditingBillIndex,
    billSnapshot, setBillSnapshot,
    showToast,
  } = app;

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const clearDailySales = () => {
    if (paidBills.length === 0) return;
    setPaidBills([]);
    setShowClearConfirm(false);
    showToast("Daily sales cleared");
  };

  const removePaidBillItem = (billIndex: number, itemId: string) => {
    setPaidBills((prev) => {
      const bills = [...prev];
      const bill = { ...bills[billIndex] };
      bill.items = bill.items.map((o) =>
        o.id === itemId ? { ...o, crossed: !o.crossed } : o
      );
      bills[billIndex] = bill;
      return bills;
    });
  };

  const markBillAsAddedToPOS = (billIndex: number) => {
    setPaidBills((prev) => {
      const bills = [...prev];
      bills[billIndex] = { ...bills[billIndex], addedToPOS: true };
      return bills;
    });
    setEditingBillIndex(null);
    setBillSnapshot(null);
    showToast("Bill marked as Added To POS");
  };

  const enterEditMode = (billIndex: number) => {
    setBillSnapshot({ ...paidBills[billIndex] });
    setEditingBillIndex(billIndex);
  };

  const cancelEditMode = () => {
    if (billSnapshot && editingBillIndex !== null) {
      setPaidBills((prev) => {
        const bills = [...prev];
        bills[editingBillIndex] = billSnapshot;
        return bills;
      });
    }
    setEditingBillIndex(null);
    setBillSnapshot(null);
  };

  const exitEditMode = () => {
    setEditingBillIndex(null);
    setBillSnapshot(null);
  };

  // Total tab aggregation - by POS ID for easy POS entry
  const renderTotalTab = () => {
    type PosEntry = { posId: string; posName: string; qty: number; revenue: number; items: string[] };
    const activeMap = new Map<string, PosEntry>();
    const removedMap = new Map<string, PosEntry>();

    paidBills.forEach((bill) => {
      const billRemoved = !!(bill as any).addedToPOS;
      bill.items.forEach((item) => {
        const posId = (item as any).posId || "NO_POS_ID";
        const posName = (item as any).posName || item.name;
        const isRemoved = billRemoved || !!(item as any).crossed;
        const map = isRemoved ? removedMap : activeMap;

        if (!map.has(posId)) {
          map.set(posId, { posId, posName, qty: 0, revenue: 0, items: [] });
        }
        const entry = map.get(posId)!;
        entry.qty += item.qty;
        entry.revenue += item.price * item.qty;
        if (!entry.items.includes(item.name)) entry.items.push(item.name);
      });
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
    const removedAll = sort(removedMap);

    const withPosId = activeAll.filter((i) => !isMissingPosId(i.posId));
    const missingPosId = activeAll.filter((i) => isMissingPosId(i.posId));
    const removedWithPosId = removedAll.filter((i) => !isMissingPosId(i.posId));
    const removedMissingPosId = removedAll.filter((i) => isMissingPosId(i.posId));

    const renderPosRow = (item: PosEntry, color: string, badge?: boolean) => (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: 0.5, minWidth: 64 }}>
          [{item.posId}]
        </span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: badge ? "#c0392b" : "#555" }}>{item.posName}</span>
        {badge && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "#c0392b", borderRadius: 4, padding: "2px 6px", marginRight: 4 }}>
            Removed
          </span>
        )}
        <span style={{ fontSize: 26, fontWeight: 900, color }}>{badge ? "-" : "×"}{item.qty}</span>
      </div>
    );

    const renderGroup = (items: PosEntry[], isMissing: boolean, removed: boolean) => {
      if (items.length === 0) return null;
      const color = removed ? "#c0392b" : isMissing ? "#e07b5a" : "#1a1a1a";
      return (
        <div style={{ ...S.billCard, ...(removed ? { borderLeft: "4px solid #c0392b", opacity: 0.75 } : isMissing ? { borderLeft: "4px solid #e07b5a" } : {}) }}>
          {items.map((item, idx) => (
            <div key={idx}>
              {idx > 0 && <div style={S.divider} />}
              {renderPosRow(item, color, removed)}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div style={S.billsList}>
        {renderGroup(withPosId, false, false)}
        {missingPosId.length > 0 && (
          <>
            <div style={{ ...S.subcategorySeparator, color: "#e07b5a" } as React.CSSProperties}>⚠️ Missing POS IDs</div>
            {renderGroup(missingPosId, true, false)}
          </>
        )}
        {(removedWithPosId.length > 0 || removedMissingPosId.length > 0) && (
          <>
            <div style={{ ...S.subcategorySeparator, color: "#c0392b" } as React.CSSProperties}>Removed</div>
            {renderGroup(removedWithPosId, false, true)}
            {removedMissingPosId.length > 0 && renderGroup(removedMissingPosId, true, true)}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={S.page}>
      <header style={S.header}>
        <button style={S.back} onClick={() => app.setView("tables")}>← Back</button>
        <span style={S.headerTitle}>Daily Sales</span>
        <span />
      </header>

      {paidBills.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyStateIcon}>📊</div>
          <div style={S.emptyStateText}>
            No sales yet today.<br />Closed bills will appear here.
          </div>
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
              <div style={{
                ...S.tabIndicator,
                transform: dailySalesTab === "total" ? "translateX(100%)" : "translateX(0)",
              }} />
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
                    onEdit={() => enterEditMode(billIndex)}
                    onDone={exitEditMode}
                    onCancel={cancelEditMode}
                    onDelete={() => markBillAsAddedToPOS(billIndex)}
                    onRemoveItem={(itemId) => removePaidBillItem(billIndex, itemId)}
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
          onConfirm={clearDailySales}
          confirmText="Clear"
          confirmStyle={S.modalDeleteBtn}
        >
          <div style={S.modalMessage}>
            This will permanently remove all bills from today's sales. This action cannot be undone.
          </div>
        </Modal>
      )}
    </div>
  );
}
