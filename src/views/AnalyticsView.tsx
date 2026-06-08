import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { S } from "../styles/appStyles";
import { colors } from "../styles/tokens";
import { BackIcon } from "../components/icons";
import { PeriodSelector } from "../components/analytics/PeriodSelector";
import { KpiSummary } from "../components/analytics/KpiSummary";
import { RevenueTrendChart } from "../components/analytics/RevenueTrendChart";
import { CategoryBreakdown } from "../components/analytics/CategoryBreakdown";
import { TopItemsTable } from "../components/analytics/TopItemsTable";
import { WeekdayPattern } from "../components/analytics/WeekdayPattern";
import { fetchBillsByDateRange, todayBerlinDate } from "../services/directusBills";
import {
  type AnalyticsPeriod,
  addDays,
  getPeriodBounds,
  aggregateKpis,
  computeDeltas,
  buildDayTimeline,
  groupByCategory,
  getTopItems,
  groupByWeekday,
} from "../utils/analytics";

function SkeletonBlock({ height = 80 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        background: colors.border,
        borderRadius: 8,
        margin: "12px 16px 0",
        animation: "pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

export function AnalyticsView() {
  const { setView } = useApp();
  const { isTablet, isTabletLandscape, isDesktop } = useBreakpoint();
  const isWide = isDesktop || isTabletLandscape;

  const today = todayBerlinDate();

  const [period, setPeriod] = useState<AnalyticsPeriod>("last7");
  const [customStart, setCustomStart] = useState(() => addDays(today, -6));
  const [customEnd, setCustomEnd] = useState(today);

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

  const isEmpty = !loading && currentBills.length === 0;

  const header = isTablet || isWide ? S.headerTablet : S.header;

  return (
    <div style={S.page}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>

      {/* Header */}
      <div style={header}>
        <button
          onClick={() => setView("tables")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
        >
          <BackIcon />
        </button>
        <span style={S.headerTitle}>Sales Trends</span>
        <div style={{ width: 32 }} />
      </div>

      {/* Period selector — always visible */}
      <PeriodSelector
        period={period}
        customStart={customStart}
        customEnd={customEnd}
        onPeriodChange={setPeriod}
        onCustomRangeChange={(s, e) => {
          setCustomStart(s);
          setCustomEnd(e);
        }}
      />

      {/* Loading skeletons */}
      {loading && (
        <>
          <SkeletonBlock height={96} />
          <SkeletonBlock height={120} />
          <SkeletonBlock height={160} />
          <SkeletonBlock height={140} />
        </>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 32px",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 32 }}>📊</span>
          <p style={{ fontSize: 15, color: colors.muted, margin: 0, textAlign: "center" }}>
            No paid bills for this period.
          </p>
        </div>
      )}

      {/* Content */}
      {!loading && !isEmpty && (
        isWide ? (
          // ── Desktop two-column layout ──
          <div style={{ padding: "0 0 40px" }}>
            <KpiSummary kpis={kpisWithDeltas} />
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 0 }}>
              <RevenueTrendChart days={dayTimeline} />
              <WeekdayPattern weekdays={weekdays} start={current.start} end={current.end} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, alignItems: "start" }}>
              <CategoryBreakdown categories={categories} />
              <TopItemsTable items={topItems} />
            </div>
          </div>
        ) : (
          // ── Mobile single-column stack ──
          <div style={{ paddingBottom: 40 }}>
            <KpiSummary kpis={kpisWithDeltas} />
            <WeekdayPattern weekdays={weekdays} start={current.start} end={current.end} />
            <RevenueTrendChart days={dayTimeline} />
            <CategoryBreakdown categories={categories} />
            <TopItemsTable items={topItems} />
          </div>
        )
      )}
    </div>
  );
}
