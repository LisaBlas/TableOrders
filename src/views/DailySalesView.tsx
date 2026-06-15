import { useRef, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { S } from "../styles/appStyles";
import { colors, radii } from "../styles/tokens";
import { BillCard } from "../components/BillCard";
import { SalesSummary } from "../components/SalesSummary";
import { ScreenHeader } from "../components/ScreenHeader";
import { CalendarIcon } from "../components/icons";
import { todayBusinessDate } from "../services/directusBills";
import { aggregateDailySales, comparePosEntries, isMissingPosId, type PosEntry } from "../utils/salesAggregation";

type ArticleSortMode = "qty" | "posId";

export function DailySalesView() {
  const app = useApp();
  const { isTablet, isTabletLandscape, isLaptop, isDesktop } = useBreakpoint();
  const {
    paidBills,
    selectedDate, setSelectedDate,
    markBillAddedToPOS,
    restoreBillFromPOS,
    removePaidBillItem,
    restorePaidBillItem,
    dailySalesTab, setDailySalesTab,
  } = app;

  const dateInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [articleSortMode, setArticleSortMode] = useState<ArticleSortMode>("qty");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [expandedBillKey, setExpandedBillKey] = useState<string | null>(null);

  const getBillKey = (bill: { directusId?: string; tempId?: string }, idx: number) =>
    bill.directusId || bill.tempId || `bill-${idx}`;

  const toggleSection = (label: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const today = todayBusinessDate();
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

  const renderTotalTab = () => {
    const { addedToPOSItems, withPosId, missingPosId, uncategorised } = aggregateDailySales(paidBills);

    const addedItemsCount = addedToPOSItems.reduce((sum, entry) => sum + entry.qty, 0);

    const allItems = [...withPosId, ...missingPosId, ...uncategorised].sort(comparePosEntries);
    const remainingItemsCount = allItems.reduce((sum, entry) => sum + entry.qty, 0);
    const excludedTableCount = paidBills.filter((bill) =>
      bill.addedToPOS || bill.items.some((item) => {
        const crossedQty = item.crossedQty ?? (item.crossed ? item.qty : 0);
        return crossedQty > 0;
      })
    ).length;
    const CATEGORY_ORDER = ["Food", "Wines", "Drinks", "Shop"] as const;
    const sortFn = articleSortMode === "qty"
      ? (a: PosEntry, b: PosEntry) => b.qty - a.qty || a.posName.localeCompare(b.posName)
      : comparePosEntries;
    const knownCats = new Set(CATEGORY_ORDER as readonly string[]);
    const categoryGroups = CATEGORY_ORDER.map(cat => ({
      label: cat,
      items: withPosId.filter(item => item.category === cat).sort(sortFn),
    }));
    const allUncategorised = [
      ...uncategorised,
      ...[...withPosId, ...missingPosId].filter(item => !knownCats.has(item.category ?? "")),
    ].sort(sortFn);


    const renderPosRow = (item: PosEntry, panelIsMissing = false) => {
      const isMissing = panelIsMissing || isMissingPosId(item.posId);
      return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(58px, 74px) minmax(0, 1fr) auto",
          alignItems: "center",
          gap: 10,
          padding: "10px 0",
          minHeight: 48,
        }}
      >
        <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 800, color: isMissing ? colors.danger : colors.fg, letterSpacing: 0 }}>
          [{isMissing ? "???" : (item.posId ?? "--")}]
        </span>
        <span style={{ minWidth: 0, fontSize: 13, fontWeight: 600, color: colors.fg, lineHeight: 1.25 }}>
          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.posName}
          </span>
          {item.items[0] && item.items[0] !== item.posName && (
            <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, fontWeight: 400, color: colors.muted }}>
              {item.items[0]}
            </span>
          )}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: isMissing ? colors.danger : colors.surface,
            background: isMissing ? colors.dangerBg : colors.fg,
            border: isMissing ? `1px solid ${colors.dangerBg}` : `1px solid ${colors.fg}`,
            borderRadius: radii.pill,
            padding: "3px 9px",
            minWidth: 34,
            textAlign: "center" as const,
            flexShrink: 0,
          }}
        >
          x{item.qty}
        </span>
      </div>
      );
    };

    const renderPanel = (title: string, items: PosEntry[], isMissing = false) => {
      if (items.length === 0) return null;
      const isCollapsed = collapsedSections.has(title);
      return (
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${isMissing ? "#f0d1cd" : colors.border}`,
            borderRadius: radii.lg,
            padding: "14px 16px",
          }}
        >
          <div
            onClick={() => toggleSection(title)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: isCollapsed ? 0 : 4, cursor: "pointer", userSelect: "none" }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: isMissing ? colors.danger : colors.fg }}>
              {title}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: colors.muted }}>
                {items.reduce((sum, item) => sum + item.qty, 0)} items
              </span>
              <span style={{ fontSize: 10, color: colors.muted, lineHeight: 1, transition: "transform 0.2s", display: "inline-block", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>
                ▼
              </span>
            </div>
          </div>
          {!isCollapsed && items.map((item, idx) => (
            <div key={`${item.posId ?? "missing"}-${item.posName}-${item.items.join(",")}`}>
              {idx > 0 && <div style={{ height: 1, background: colors.border }} />}
              {renderPosRow(item, isMissing)}
            </div>
          ))}
        </div>
      );
    };

    const renderSortButton = (mode: ArticleSortMode, label: string) => (
      <button
        type="button"
        onClick={() => setArticleSortMode(mode)}
        style={{
          border: `1px solid ${articleSortMode === mode ? colors.fg : colors.border}`,
          borderRadius: radii.pill,
          padding: "5px 12px",
          background: articleSortMode === mode ? colors.fg : "transparent",
          color: articleSortMode === mode ? colors.surface : colors.fg,
          fontSize: 12,
          fontWeight: articleSortMode === mode ? 700 : 500,
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );

    return (
      <>
        <SalesSummary paidBills={paidBills} />

        {(allItems.length > 0 || addedToPOSItems.length > 0) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 12, color: colors.muted, minWidth: 0 }}>
                {remainingItemsCount > 0
                  ? `${remainingItemsCount} item${remainingItemsCount !== 1 ? "s" : ""} to cross`
                  : "All articles crossed"}
                {addedItemsCount > 0 && (
                  <> · {addedItemsCount} item{addedItemsCount !== 1 ? "s" : ""} excluded from {excludedTableCount} table{excludedTableCount !== 1 ? "s" : ""}</>
                )}
              </span>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {allItems.length > 0 && renderSortButton("qty", "Sales")}
                {allItems.length > 0 && renderSortButton("posId", "POS ID")}
              </div>
            </div>
            {allItems.length > 0 && (
              (isDesktop || isTabletLandscape) ? (
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    {allUncategorised.length > 0 && renderPanel("Uncategorised", allUncategorised, true)}
                    {renderPanel("Food", categoryGroups[0].items)}
                    {renderPanel("Wines", categoryGroups[1].items)}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    {renderPanel("Drinks", categoryGroups[2].items)}
                    {renderPanel("Shop", categoryGroups[3].items)}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {allUncategorised.length > 0 && renderPanel("Uncategorised", allUncategorised, true)}
                  {categoryGroups.map(g => renderPanel(g.label, g.items))}
                </div>
              )
            )}
          </div>
        )}
      </>
    );
  };

  const isWideShell = isDesktop || isLaptop || isTabletLandscape;
  const billsListStyle = isDesktop || isTabletLandscape ? S.billsListTabletLandscape : isTablet ? S.billsListTablet : S.billsList;
  const totalTabContainerStyle = {
    flex: 1,
    overflowY: "auto" as const,
    padding: isDesktop || isTabletLandscape ? "0 24px 100px" : isTablet ? "0 20px 100px" : "0 16px 100px",
  };

  return (
    <div style={{ ...S.page, height: "100%", minHeight: 0, overflow: "hidden" }}>
      <ScreenHeader
        title="Daily Sales"
        left={isWideShell ? "none" : "profile"}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                border: `1px solid ${colors.border}`,
                borderRadius: radii.sm,
                padding: "5px 10px",
                background: colors.surface,
                color: colors.fg,
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
              onClick={() => { try { dateInputRef.current?.showPicker(); } catch (_) {} }}
              style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
            />
          </div>
          </div>
        }
      />

      {paidBills.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyStateIcon}>0</div>
          <div style={S.emptyStateText}>No paid bills for {dateLabel.toLowerCase()}.</div>
        </div>
      ) : (
        <>
          <div style={S.tabs}>
            <div style={S.tabsContainer}>
              <button
                style={{ ...S.tab, ...(dailySalesTab === "chronological" ? S.tabActive : {}) }}
                onClick={() => setDailySalesTab("chronological")}
              >Timeline</button>
              <button
                style={{ ...S.tab, ...(dailySalesTab === "total" ? S.tabActive : {}) }}
                onClick={() => setDailySalesTab("total")}
              >Sales</button>
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
              <div style={{ ...billsListStyle, width: "50%", height: "100%", flex: "none" }}>
                {[...paidBills].reverse().map((bill, reverseIdx) => {
                  const billIndex = paidBills.length - 1 - reverseIdx;
                  const billKey = getBillKey(bill, billIndex);
                  return (
                    <BillCard
                      key={billKey}
                      bill={bill}
                      isExpanded={expandedBillKey === billKey}
                      onToggle={() => setExpandedBillKey(prev => prev === billKey ? null : billKey)}
                      onMarkAll={() => markBillAddedToPOS(billIndex)}
                      onRestoreAll={() => restoreBillFromPOS(billIndex)}
                      onMarkItem={(itemId) => removePaidBillItem(billIndex, itemId)}
                      onRestoreItem={(itemId) => restorePaidBillItem(billIndex, itemId)}
                    />
                  );
                })}
              </div>
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
