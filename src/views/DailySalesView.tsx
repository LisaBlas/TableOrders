import { useRef, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { S } from "../styles/appStyles";
import { BillCard } from "../components/BillCard";
import { SalesSummary } from "../components/SalesSummary";
import { BackIcon, CalendarIcon } from "../components/icons";
import { todayBerlinDate } from "../services/directusBills";
import { aggregateDailySales, comparePosEntries, type PosEntry } from "../utils/salesAggregation";

type ArticleSortMode = "category" | "posId";

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
  const [articleSortMode, setArticleSortMode] = useState<ArticleSortMode>("category");

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

    const getArticleGroup = (item: PosEntry) => item.category === "Food" ? "Food" : "Drinks";
    const sortedWithPosId = [...withPosId].sort(comparePosEntries);
    const groupedArticles = {
      Food: sortedWithPosId.filter((item) => getArticleGroup(item) === "Food"),
      Drinks: sortedWithPosId.filter((item) => getArticleGroup(item) === "Drinks"),
    };

    const renderSalesItems = (items: PosEntry[]) => (
      <div style={salesGridStyle}>
        {items.map((item) => (
          <div key={`${item.posId}-${item.posName}-${item.items.join(',')}`} style={{ ...S.billCard, padding: "12px 16px" }}>
            {renderPosRow(item, "#1a1a1a")}
          </div>
        ))}
      </div>
    );

    const renderSortButton = (mode: ArticleSortMode, label: string) => (
      <button
        type="button"
        onClick={() => setArticleSortMode(mode)}
        style={{
          flex: 1,
          border: "none",
          borderRadius: 6,
          padding: "9px 10px",
          background: articleSortMode === mode ? "#1a1a1a" : "transparent",
          color: articleSortMode === mode ? "#fff" : "#666",
          fontSize: 13,
          fontWeight: 800,
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );

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
              <div style={{ color: "#1a1a1a", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#1a1a1a",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 900,
                  lineHeight: 1,
                  flexShrink: 0,
                }}>i</span>
                <span>{remainingItemsCount} item{remainingItemsCount !== 1 ? 's' : ''} remaining</span>
              </div>
            )}
          </div>
        )}

        {/* Sales section */}
        {withPosId.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
                Sales
              </div>
              <div style={{ display: "flex", gap: 2, padding: 2, borderRadius: 8, background: "#f0f0f0", minWidth: 180 }}>
                {renderSortButton("category", "Category")}
                {renderSortButton("posId", "POS ID")}
              </div>
            </div>
            {articleSortMode === "posId" ? renderSalesItems(sortedWithPosId) : (
              <>
                {groupedArticles.Food.length > 0 && (
                  <>
                    <div style={{ ...S.subcategorySeparator, marginBottom: 10 } as React.CSSProperties}>Food</div>
                    {renderSalesItems(groupedArticles.Food)}
                  </>
                )}
                {groupedArticles.Drinks.length > 0 && (
                  <>
                    <div style={{ ...S.subcategorySeparator, marginBottom: 10 } as React.CSSProperties}>Drinks</div>
                    {renderSalesItems(groupedArticles.Drinks)}
                  </>
                )}
              </>
            )}
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

  const handleShare = () => {
    const totalTips = paidBills.reduce((sum, b) => sum + (b.tip ?? 0), 0);
    const totalGutschein = paidBills.reduce((sum, b) => sum + (b.gutschein ?? 0), 0);
    const totalRevenue = paidBills.reduce((sum, b) => sum + b.total, 0);

    const articleMap = new Map<string, number>();
    for (const bill of paidBills) {
      for (const item of bill.items) {
        if (item.category && item.category !== "Food") continue;
        const name = item.name;
        articleMap.set(name, (articleMap.get(name) ?? 0) + item.qty);
      }
    }
    const articles = [...articleMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, qty]) => `${name} × ${qty}`)
      .join("\n");

    const lines: string[] = [
      `📊 Daily Sales — ${dateLabel}`,
      ``,
      `Bills closed: ${paidBills.length}`,
      `Total Tips: ${totalTips >= 0 ? "+" : ""}${totalTips.toFixed(2)}€`,
      ...(totalGutschein > 0 ? [`Vouchers: -${totalGutschein.toFixed(2)}€`] : []),
      `Total Revenue: ${totalRevenue.toFixed(2)}€`,
      ``,
      `Articles sold:`,
      articles,
    ];

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      app.showToast("📋 Copied to clipboard!");
    });
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                <div style={{ gridColumn: "1 / -1" }}>
                  <SalesSummary paidBills={paidBills} onShare={handleShare} />
                </div>
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
                <SalesSummary paidBills={paidBills} onShare={handleShare} />
                {renderTotalTab()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
