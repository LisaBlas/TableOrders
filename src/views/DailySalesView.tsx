import { useApp } from "../contexts/AppContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { S } from "../styles/appStyles";
import { BillCard } from "../components/BillCard";
import { SalesSummary } from "../components/SalesSummary";
import { BackIcon } from "../components/icons";
import { todayBerlinDate } from "../services/directusBills";

export function DailySalesView() {
  const app = useApp();
  const { isTablet, isTabletLandscape, isDesktop } = useBreakpoint();
  const {
    paidBills,
    selectedDate, setSelectedDate,
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

    const isWideScreen = isDesktop || isTabletLandscape || isTablet;

    // Find bills that have been added to POS
    const addedToPOSBills = paidBills.filter(bill => bill.addedToPOS);

    // Sales items grid style - multiple columns on larger screens
    const salesGridStyle = isWideScreen ? {
      display: "grid",
      gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
      gap: 12,
      marginBottom: 16
    } : {
      display: "flex",
      flexDirection: "column" as const,
      gap: 12,
      marginBottom: 16
    };

    return (
      <div style={totalTabContainerStyle}>
        {/* Already added to POS bills */}
        {addedToPOSBills.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#c0392b", marginTop: 16, marginBottom: 12 }}>
              Already added to POS
            </div>
            <div style={billsListStyle}>
              {addedToPOSBills.map((bill, idx) => {
                const billIndex = paidBills.indexOf(bill);
                return (
                  <BillCard
                    key={idx}
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
          </>
        )}

        {/* Sales section */}
        {withPosId.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginTop: addedToPOSBills.length > 0 ? 24 : 16, marginBottom: 12 }}>
              Sales
            </div>
            <div style={salesGridStyle}>
              {withPosId.map((item, idx) => (
                <div key={idx} style={{ ...S.billCard, padding: "12px 16px" }}>
                  {renderPosRow(item, "#1a1a1a")}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Missing POS IDs */}
        {missingPosId.length > 0 && (
          <>
            <div style={{ ...S.subcategorySeparator, color: "#e07b5a" } as React.CSSProperties}>⚠️ Missing POS IDs</div>
            {renderGroup(missingPosId, true)}
          </>
        )}
      </div>
    );
  };

  // Responsive styles
  const headerStyle = isTablet || isTabletLandscape || isDesktop ? S.headerTablet : S.header;
  const billsListStyle = isDesktop || isTabletLandscape ? S.billsListTabletLandscape : isTablet ? S.billsListTablet : S.billsList;
  const totalTabContainerStyle = {
    flex: 1,
    overflowY: "auto" as const,
    padding: isDesktop || isTabletLandscape ? "0 24px 100px" : isTablet ? "0 20px 100px" : "0 16px 100px"
  };

  return (
    <div style={S.page}>
      <header style={headerStyle}>
        <button style={S.back} onClick={() => app.setView("tables")}>
          <BackIcon size={22} />
        </button>
        <span style={S.headerTitle}>Daily Sales</span>
        <input
          type="date"
          value={selectedDate}
          max={todayBerlinDate()}
          onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
          style={{
            fontSize: 13,
            fontWeight: 600,
            border: "1.5px solid #e0e0e0",
            borderRadius: 8,
            padding: "4px 8px",
            background: "#f8f8f8",
            color: "#1a1a1a",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </header>

      {paidBills.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyStateIcon}>📊</div>
          <div style={S.emptyStateText}>No sales for this date.<br />Closed bills will appear here.</div>
        </div>
      ) : (
        <>
          <div style={S.tabs}>
            <div style={S.tabsContainer}>
              <button
                style={{ ...S.tab, ...(dailySalesTab === "chronological" ? S.tabActive : {}) }}
                onClick={() => setDailySalesTab("chronological")}
              >Tables</button>
              <button
                style={{ ...S.tab, ...(dailySalesTab === "total" ? S.tabActive : {}) }}
                onClick={() => setDailySalesTab("total")}
              >Articles</button>
              <div style={{ ...S.tabIndicator, transform: dailySalesTab === "total" ? "translateX(100%)" : "translateX(0)" }} />
            </div>
          </div>

          <SalesSummary paidBills={paidBills} />

          {dailySalesTab === "chronological" && (
            <div style={billsListStyle}>
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
        </>
      )}
    </div>
  );
}
