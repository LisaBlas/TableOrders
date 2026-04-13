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
    // Aggregate by POS ID
    const posMap = new Map<string, { posId: string; posName: string; qty: number; revenue: number; items: string[] }>();

    paidBills.forEach((bill) => {
      bill.items.forEach((item) => {
        // Extract posId and posName from item metadata
        const posId = (item as any).posId || "NO_POS_ID";
        const posName = (item as any).posName || item.name;

        if (!posMap.has(posId)) {
          posMap.set(posId, { posId, posName, qty: 0, revenue: 0, items: [] });
        }
        const entry = posMap.get(posId)!;
        entry.qty += item.qty;
        entry.revenue += item.price * item.qty;
        if (!entry.items.includes(item.name)) {
          entry.items.push(item.name);
        }
      });
    });

    // Convert to array and sort by quantity (most sold first)
    const aggregated = Array.from(posMap.values()).sort((a, b) => b.qty - a.qty);

    // Separate items with missing POS IDs
    const withPosId = aggregated.filter((item) => item.posId !== "NO_POS_ID" && item.posId !== "0000");
    const missingPosId = aggregated.filter((item) => item.posId === "NO_POS_ID" || item.posId === "0000");

    const renderPosRow = (item: any, isMissing: boolean) => (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: isMissing ? "#e07b5a" : "#1a1a1a", letterSpacing: 0.5, minWidth: 64 }}>
          [{item.posId}]
        </span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "#555" }}>{item.posName}</span>
        <span style={{ fontSize: 26, fontWeight: 900, color: "#1a1a1a" }}>×{item.qty}</span>
      </div>
    );

    return (
      <div style={S.billsList}>
        {withPosId.length > 0 && (
          <div style={S.billCard}>
            {withPosId.map((item, idx) => (
              <div key={idx}>
                {idx > 0 && <div style={S.divider} />}
                {renderPosRow(item, false)}
              </div>
            ))}
          </div>
        )}
        {missingPosId.length > 0 && (
          <>
            <div style={{ ...S.subcategorySeparator, color: "#e07b5a" } as React.CSSProperties}>⚠️ Missing POS IDs</div>
            <div style={{ ...S.billCard, borderLeft: "4px solid #e07b5a" }}>
              {missingPosId.map((item, idx) => (
                <div key={idx}>
                  {idx > 0 && <div style={S.divider} />}
                  {renderPosRow(item, true)}
                </div>
              ))}
            </div>
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
