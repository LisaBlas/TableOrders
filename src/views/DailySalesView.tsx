import { useRef } from "react";
import { useApp } from "../contexts/AppContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { S } from "../styles/appStyles";
import { BillCard } from "../components/BillCard";
import { SalesSummary } from "../components/SalesSummary";
import { BackIcon, CalendarIcon } from "../components/icons";
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
    editingBillId,
    enterBillEditMode,
    exitBillEditMode,
    cancelBillEditMode,
    dailySalesTab, setDailySalesTab,
  } = app;

  const dateInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const today = todayBerlinDate();
  const dateLabel = selectedDate === today
    ? "Today"
    : (() => {
        const [, month, day] = selectedDate.split("-");
        return `${day}/${month}`;
      })();
  const tabOrder = ["chronological", "total"] as const;
  const tabIndex = tabOrder.indexOf(dailySalesTab);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && tabIndex < tabOrder.length - 1) setDailySalesTab(tabOrder[tabIndex + 1]);
    else if (dx > 0 && tabIndex > 0) setDailySalesTab(tabOrder[tabIndex - 1]);
  };

  // Total tab aggregation - by POS ID for easy POS entry
  const renderTotalTab = () => {
    const { addedToPOSBills, withPosId, missingPosId } = aggregateDailySales(paidBills);

    // Calculate summary stats
    const addedItemsCount = addedToPOSBills.reduce((sum, bill) => {
      return sum + bill.items.reduce((itemSum, item) => {
        if (bill.addedToPOS) {
          // If entire bill is marked as added, count all items
          return itemSum + item.qty;
        } else {
          // Otherwise only count crossed items
          const crossedQty = item.crossedQty ?? (item.crossed ? item.qty : 0);
          return itemSum + crossedQty;
        }
      }, 0);
    }, 0);

    const remainingItemsCount = withPosId.reduce((sum, entry) => sum + entry.qty, 0);

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
        <span style={{
          fontSize: compact ? 13 : 15,
          fontWeight: 800,
          color: color === "#e07b5a" ? "#e07b5a" : "#fff",
          background: color === "#e07b5a" ? "#fdeee8" : "#1a1a1a",
          borderRadius: 20,
          padding: compact ? "2px 8px" : "4px 12px",
          minWidth: compact ? 28 : 36,
          textAlign: "center",
          flexShrink: 0,
        }}>×{item.qty}</span>
      </div>
    );

    const renderGroup = (items: PosEntry[], isMissing: boolean) => {
      if (items.length === 0) return null;
      const color = isMissing ? "#e07b5a" : "#1a1a1a";
      return (
        <div style={{ ...S.billCard, ...(isMissing ? { borderLeft: "4px solid #e07b5a" } : {}) }}>
          {items.map((item, idx) => (
            <div key={`${item.posId ?? 'missing'}-${item.posName}-${item.items.join(',')}`}>
              {idx > 0 && <div style={S.divider} />}
              {renderPosRow(item, color)}
            </div>
          ))}
        </div>
      );
    };

    const isWideScreen = isDesktop || isTabletLandscape || isTablet;

    const salesGridStyle = {
      display: "grid",
      gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
      gap: 12,
      marginBottom: 16
    };

    return (
      <>
        {/* Compact summary */}
        {(addedItemsCount > 0 || remainingItemsCount > 0) && (
          <div style={{
            background: "#e8f4fc",
            border: "1px solid #c2dcf5",
            borderRadius: 8,
            padding: "12px 16px",
            marginTop: 16,
            marginBottom: 16,
            fontSize: 13,
            lineHeight: 1.6
          }}>
            {addedItemsCount > 0 && (
              <div style={{ color: "#3498db", fontWeight: 600 }}>
                ✓ {addedItemsCount} item{addedItemsCount !== 1 ? 's' : ''} added during shift ({addedToPOSBills.length} bill{addedToPOSBills.length !== 1 ? 's' : ''})
              </div>
            )}
            {remainingItemsCount > 0 && (
              <div style={{ color: "#1a1a1a", fontWeight: 600 }}>
                {remainingItemsCount} item{remainingItemsCount !== 1 ? 's' : ''} remaining to enter
              </div>
            )}
          </div>
        )}

        {/* Sales section */}
        {withPosId.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>
              Sales
            </div>
            <div style={salesGridStyle}>
              {[...withPosId].sort((a, b) => b.qty - a.qty).map((item) => (
                <div key={`${item.posId}-${item.posName}-${item.items.join(',')}`} style={{ ...S.billCard, padding: "12px 16px" }}>
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
      </>
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
    <div style={{ ...S.page, height: "100dvh", minHeight: 0, overflow: "hidden" }}>
      <header style={headerStyle}>
        <button style={S.back} onClick={() => app.setView("tables")}>
          <BackIcon size={22} />
        </button>
        <span style={S.headerTitle}>Daily Sales</span>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => dateInputRef.current?.showPicker()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              border: "1.5px solid #e0e0e0",
              borderRadius: 8,
              padding: "4px 10px",
              background: "#f8f8f8",
              color: "#1a1a1a",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <CalendarIcon size={15} />
            {dateLabel}
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
          />
        </div>
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

          <div
            style={{ flex: 1, overflow: "hidden", minHeight: 0, touchAction: "pan-y" }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div style={{
              display: "flex",
              width: "200%",
              height: "100%",
              transform: `translateX(${-tabIndex * 50}%)`,
              transition: "transform 0.3s ease-out",
            }}>
              {/* Tables (chronological) pane */}
              <div style={{ ...billsListStyle, width: "50%", height: "100%", flex: "none" }}>
                {[...paidBills].reverse().map((bill, reverseIdx) => {
                  const billIndex = paidBills.length - 1 - reverseIdx;
                  return (
                    <BillCard
                      key={bill.directusId || bill.tempId || `bill-${billIndex}`}
                      bill={bill}
                      isEditing={editingBillId === bill.directusId}
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
              {/* Articles (total) pane */}
              <div style={{ ...totalTabContainerStyle, width: "50%", height: "100%", flex: "none" }}>
                {renderTotalTab()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
