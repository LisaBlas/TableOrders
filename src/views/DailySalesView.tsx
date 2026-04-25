import { useApp } from "../contexts/AppContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { S } from "../styles/appStyles";
import { BillCard } from "../components/BillCard";
import { SalesSummary } from "../components/SalesSummary";
import { BackIcon } from "../components/icons";
import { todayBerlinDate } from "../services/directusBills";
import { aggregateDailySales, type PosEntry } from "../utils/salesAggregation";

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
    const { addedToPOSBills, withPosId, missingPosId } = aggregateDailySales(paidBills);

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
            <div key={`${item.posId}-${item.posName}`}>
              {idx > 0 && <div style={S.divider} />}
              {renderPosRow(item, color)}
            </div>
          ))}
        </div>
      );
    };

    const isWideScreen = isDesktop || isTabletLandscape || isTablet;

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
              {addedToPOSBills.map((bill) => {
                const billIndex = paidBills.indexOf(bill);
                return (
                  <BillCard
                    key={bill.directusId || bill.tempId}
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
              {withPosId.map((item) => (
                <div key={`${item.posId}-${item.posName}`} style={{ ...S.billCard, padding: "12px 16px" }}>
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
                    key={bill.directusId || bill.tempId}
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
