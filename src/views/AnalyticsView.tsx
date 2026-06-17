import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { S } from "../styles/appStyles";
import { colors, radii } from "../styles/tokens";
import { ScreenHeader } from "../components/ScreenHeader";
import { CalendarIcon } from "../components/icons";
import { PeriodSelector, fmtRange } from "../components/analytics/PeriodSelector";
import { KpiSummary } from "../components/analytics/KpiSummary";
import { RevenueTrendChart } from "../components/analytics/RevenueTrendChart";
import { CategoryBreakdown } from "../components/analytics/CategoryBreakdown";
import { TopItemsTable } from "../components/analytics/TopItemsTable";
import { WeekdayPattern } from "../components/analytics/WeekdayPattern";

import { PeakHoursChart } from "../components/analytics/PeakHoursChart";
import { TopTablesTable } from "../components/analytics/TopTablesTable";
import { TipsVouchersCard } from "../components/analytics/TipsVouchersCard";
import { ZeroSalesCard } from "../components/analytics/ZeroSalesCard";
import { fetchBillsByDateRange, todayBusinessDate } from "../services/directusBills";
import { useMenu } from "../contexts/MenuContext";
import {
  type AnalyticsPeriod,
  addDays,
  daysBetween,
  getPeriodBounds,
  aggregateKpis,
  computeDeltas,
  buildDayTimeline,
  groupByCategory,
  getTopItems,
  groupByWeekday,
  groupByHour,
  groupByTable,
  computeTipVoucher,
  getZeroSalesItems,
} from "../utils/analytics";

function SkeletonBlock({ height = 80 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        background: colors.border,
        borderRadius: 8,
        animation: "pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

export function AnalyticsView() {
  const { setView } = useApp();
  const { resolveTableDisplayId } = useTable();
  const { menu } = useMenu();
  const { isTablet, isTabletLandscape, isDesktop } = useBreakpoint();
  const isWide = isDesktop || isTabletLandscape;
  const kpiWide = isTablet || isWide;

  const today = todayBusinessDate();

  const [period, setPeriod] = useState<AnalyticsPeriod>("last7");
  const [customStart, setCustomStart] = useState(() => addDays(today, -6));
  const [customEnd, setCustomEnd] = useState(today);
  const [pickerOpen, setPickerOpen] = useState(false);

  const bounds = getPeriodBounds(period, customStart, customEnd);
  const { current, prior } = bounds;

  const { data: currentBills = [], isLoading: loadingCurrent } = useQuery({
    queryKey: ["bills", "range", current.start, current.end],
    queryFn: () => fetchBillsByDateRange(current.start, current.end),
    staleTime: 60_000,
  });

  const { data: priorBills = [], isLoading: loadingPrior } = useQuery({
    queryKey: ["bills", "range", prior.start, prior.end],
    queryFn: () => fetchBillsByDateRange(prior.start, prior.end),
    staleTime: 5 * 60_000,
  });

  const loading = loadingCurrent || loadingPrior;

  const currentKpis = aggregateKpis(currentBills);
  const priorKpis = aggregateKpis(priorBills);
  const kpisWithDeltas = computeDeltas(currentKpis, priorKpis);

  const dayTimeline = buildDayTimeline(currentBills, current.start, current.end);
  const categories = groupByCategory(currentBills);
  const topItems = getTopItems(currentBills, "revenue");
  const weekdays = groupByWeekday(currentBills, current.start, current.end);
  const peakHours = groupByHour(currentBills);
  const topTables = groupByTable(currentBills);
  const tipVoucher = computeTipVoucher(currentBills);
  const zeroSalesItems = getZeroSalesItems(currentBills, menu);

  const isEmpty = !loading && currentBills.length === 0;

  const comparisonLabel =
    period === "last7" ? "vs previous 7 days" :
    period === "last30" ? "vs previous 30 days" :
    period === "thisMonth" ? "vs last month" :
    `vs prior ${daysBetween(current.start, current.end)} days`;

  const periodLabel =
    period === "last7" ? "Last 7" :
    period === "last30" ? "Last 30" :
    period === "thisMonth" ? "This month" :
    fmtRange(customStart, customEnd);

  const dashboardSummary = (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        overflow: "hidden",
      }}
    >
      {loading ? (
        <div style={{ padding: 12 }}>
          <SkeletonBlock height={96} />
        </div>
      ) : (
        <KpiSummary kpis={kpisWithDeltas} comparisonLabel={comparisonLabel} wide={kpiWide} embedded />
      )}
    </div>
  );

  return (
    <div style={S.page}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>

      <ScreenHeader
        title="Sales Trends"
        left="back"
        onBack={() => setView("tables")}
        ariaLabel="Back to floor"
        hideBackOnWide
        right={
          <button
            onClick={() => setPickerOpen(true)}
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
            {periodLabel}
          </button>
        }
      />

      <PeriodSelector
        period={period}
        customStart={customStart}
        customEnd={customEnd}
        currentRange={current}
        priorRange={prior}
        onPeriodChange={setPeriod}
        onCustomRangeChange={(s, e) => {
          setCustomStart(s);
          setCustomEnd(e);
        }}
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 16px 0" }}>
          {dashboardSummary}
          <SkeletonBlock height={120} />
          <SkeletonBlock height={160} />
          <SkeletonBlock height={140} />
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "12px 16px 40px",
            gap: 12,
          }}
        >
          {dashboardSummary}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
              gap: 12,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.lg,
            }}
          >
            <span style={{ fontSize: 32 }}>📊</span>
            <p style={{ fontSize: 15, color: colors.muted, margin: 0, textAlign: "center" }}>
              No paid bills for {fmtRange(current.start, current.end)}.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={() => setPeriod("last30")}
                style={{
                  padding: "8px 16px",
                  borderRadius: radii.sm,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.fg,
                  fontSize: 13,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                Switch to Last 30
              </button>
              <button
                onClick={() => setView("dailySales")}
                style={{
                  padding: "8px 16px",
                  borderRadius: radii.sm,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.fg,
                  fontSize: 13,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                Go to Daily Sales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !isEmpty && (
        isWide ? (
          // ── Desktop two-column layout ──
          <div style={{ padding: "16px 16px 40px", display: "flex", flexDirection: "column", gap: 12 }}>
            {dashboardSummary}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <RevenueTrendChart days={dayTimeline} />
              <CategoryBreakdown categories={categories} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <TopItemsTable items={topItems} />
              <WeekdayPattern weekdays={weekdays} start={current.start} end={current.end} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, alignItems: "start" }}>
              <PeakHoursChart hours={peakHours} />
              <TopTablesTable tables={topTables} resolveLabel={resolveTableDisplayId} />
            </div>
            <TipsVouchersCard data={tipVoucher} />
            <ZeroSalesCard items={zeroSalesItems} />
          </div>
        ) : (
          // ── Mobile single-column stack ──
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 16px 40px" }}>
            {dashboardSummary}
            <RevenueTrendChart days={dayTimeline} />
            <CategoryBreakdown categories={categories} />
            <TopItemsTable items={topItems} />
            <WeekdayPattern weekdays={weekdays} start={current.start} end={current.end} />
            <PeakHoursChart hours={peakHours} />
            <TopTablesTable tables={topTables} resolveLabel={resolveTableDisplayId} />
            <TipsVouchersCard data={tipVoucher} />
            <ZeroSalesCard items={zeroSalesItems} />
          </div>
        )
      )}
    </div>
  );
}
