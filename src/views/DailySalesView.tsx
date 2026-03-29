import { useApp } from "../contexts/AppContext";
import { MENU, FOOD_SUBCATEGORIES, DRINKS_SUBCATEGORIES, BOTTLES_SUBCATEGORIES, ARTICLE_ALIASES } from "../data/constants";
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
    deletingBillIndex, setDeletingBillIndex,
    showToast,
  } = app;

  const clearDailySales = () => {
    if (paidBills.length === 0) return;
    setPaidBills([]);
    showToast("Daily sales cleared");
  };

  const removePaidBillItem = (billIndex: number, itemId: string) => {
    setPaidBills((prev) => {
      const bills = [...prev];
      const bill = { ...bills[billIndex] };
      bill.items = bill.items
        .map((o) => o.id === itemId ? { ...o, qty: o.qty - 1 } : o)
        .filter((o) => o.qty > 0);
      bill.total = bill.items.reduce((s, o) => s + o.price * o.qty, 0);
      if (bill.gutschein) {
        bill.total = Math.max(0, bill.total - bill.gutschein);
      }
      bills[billIndex] = bill;
      return bills;
    });
  };

  const deletePaidBill = (billIndex: number) => {
    setPaidBills((prev) => prev.filter((_, i) => i !== billIndex));
    setEditingBillIndex(null);
    setBillSnapshot(null);
    showToast("Bill deleted");
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
    if (editingBillIndex !== null) {
      const bill = paidBills[editingBillIndex];
      if (bill && bill.items.length === 0) {
        setDeletingBillIndex(editingBillIndex);
        return;
      }
    }
    setEditingBillIndex(null);
    setBillSnapshot(null);
  };

  const confirmDeleteBill = () => {
    if (deletingBillIndex !== null) {
      deletePaidBill(deletingBillIndex);
      setDeletingBillIndex(null);
    }
  };

  // Total tab aggregation
  const renderTotalTab = () => {
    const itemsMap = new Map<string, { name: string; alias: string | null; qty: number; revenue: number; category: string | null; subcategory: string | null }>();
    paidBills.forEach((bill) => {
      bill.items.forEach((item) => {
        if (!itemsMap.has(item.id)) {
          let category = (item as any).category || null;
          let subcategory = item.subcategory || null;
          if (!category || !subcategory) {
            const lookupId = (item as any).baseId || item.id;
            for (const [cat, items] of Object.entries(MENU)) {
              const found = (items as any[]).find((i) => i.id === lookupId);
              if (found) {
                category = category || cat;
                subcategory = subcategory || found.subcategory;
                break;
              }
            }
          }
          itemsMap.set(item.id, { name: item.name, alias: (ARTICLE_ALIASES as any)[item.id] || null, qty: 0, revenue: 0, category, subcategory });
        }
        const existing = itemsMap.get(item.id)!;
        existing.qty += item.qty;
        existing.revenue += item.price * item.qty;
      });
    });

    const aggregatedItems = Array.from(itemsMap.values());
    const categorizedItems: Record<string, Record<string, any[]>> = {};
    Object.keys(MENU).forEach((cat) => { categorizedItems[cat] = {}; });

    aggregatedItems.forEach((item) => {
      const cat = item.category || "Ad-hoc Items";
      const subcat = item.subcategory || "custom";
      if (!categorizedItems[cat]) categorizedItems[cat] = {};
      if (!categorizedItems[cat][subcat]) categorizedItems[cat][subcat] = [];
      categorizedItems[cat][subcat].push(item);
    });

    Object.values(categorizedItems).forEach((subcats) => {
      Object.values(subcats).forEach((items) => {
        items.sort((a, b) => b.qty - a.qty);
      });
    });

    const subcatConfigs: Record<string, any[]> = {
      Food: FOOD_SUBCATEGORIES,
      "Drinks🍷": DRINKS_SUBCATEGORIES,
      "Bottles 🍾": BOTTLES_SUBCATEGORIES,
    };

    const renderItemCard = (item: any, idx: number) => (
      <div key={idx} style={S.billCard}>
        <div style={S.billCardHeader}>
          <span style={S.billTableNum}>{item.alias || item.name}</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", textAlign: "center" as const, minWidth: 36 }}>{item.qty}</span>
        </div>
        <div style={S.billMeta}>
          {item.revenue.toFixed(2)}€ total · {(item.revenue / item.qty).toFixed(2)}€ each
        </div>
      </div>
    );

    return (
      <div style={S.billsList}>
        {Object.keys(MENU).map((category) => {
          const categoryItems = categorizedItems[category];
          const subcatConfig = subcatConfigs[category];
          const hasItems = Object.values(categoryItems).some((items) => items.length > 0);
          if (!hasItems) return null;

          if (subcatConfig) {
            return subcatConfig.map(({ id, label }: any) => {
              const items = categoryItems[id] || [];
              if (items.length === 0) return null;
              return (
                <div key={`${category}-${id}`}>
                  <div style={S.subcategorySeparator}>{label}</div>
                  {items.map(renderItemCard)}
                </div>
              );
            });
          }

          const allItems = Object.values(categoryItems).flat();
          if (allItems.length === 0) return null;
          return (
            <div key={category}>
              <div style={S.subcategorySeparator}>{category}</div>
              {allItems.map(renderItemCard)}
            </div>
          );
        })}

        {categorizedItems["Ad-hoc Items"] && (() => {
          const customItems = Object.values(categorizedItems["Ad-hoc Items"]).flat();
          if (customItems.length === 0) return null;
          return (
            <div key="ad-hoc">
              <div style={S.subcategorySeparator}>Ad-hoc Items</div>
              {customItems.map(renderItemCard)}
            </div>
          );
        })()}
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
                    onDelete={() => setDeletingBillIndex(billIndex)}
                    onRemoveItem={(itemId) => removePaidBillItem(billIndex, itemId)}
                  />
                );
              })}
            </div>
          )}

          {dailySalesTab === "total" && renderTotalTab()}

          <button style={S.clearDayBtn} onClick={clearDailySales}>Clear Daily Sales</button>
        </>
      )}

      {deletingBillIndex !== null && (
        <Modal
          title="Delete Bill?"
          onClose={() => setDeletingBillIndex(null)}
          onConfirm={confirmDeleteBill}
          confirmText="Delete"
          confirmStyle={S.modalDeleteBtn}
        >
          <div style={S.modalMessage}>
            {editingBillIndex !== null && paidBills[deletingBillIndex]?.items.length === 0
              ? "This bill has no items. Delete it?"
              : "Are you sure? This action cannot be undone."}
          </div>
        </Modal>
      )}
    </div>
  );
}
