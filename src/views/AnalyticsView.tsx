import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { S } from "../styles/appStyles";
import { colors, radii } from "../styles/tokens";
import { BackIcon } from "../components/icons";
import { PeriodSelector } from "../components/analytics/PeriodSelector";
import { KpiSummary } from "../components/analytics/KpiSummary";
import { RevenueTrendChart } from "../components/analytics/RevenueTrendChart";
import { CategoryBreakdown } from "../components/analytics/CategoryBreakdown";
import { TopItemsTable } from "../components/analytics/TopItemsTable";
import { WeekdayPattern } from "../components/analytics/WeekdayPattern";
import { InsightStrip } from "../components/analytics/InsightStrip";
import { fetchBillsByDateRange, todayBerlinDate } from "../services/directusBills";
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
} from "../utils/analytics";

const _MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtShort(d: string): string {
  const [, m, day] = d.split("-").map(Number);
  return `${_MONTHS[m - 1]} ${day}`;
}

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
  const { isTablet, isTabletLandscape, isDesktop } = useBreakpoint();
  const isWide = isDesktop || isTabletLandscape;
  const kpiWide = isTablet || isWide;

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

  const comparisonLabel =
    period === "last7" ? "vs previous 7 days" :
    period === "last30" ? "vs previous 30 days" :
    period === "thisMonth" ? "vs last month" :
    `vs prior ${daysBetween(current.start, current.end)} days`;

  const header = isTablet || isWide ? S.headerTablet : S.header;
  const dashboardSummary = (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        overflow: "hidden",
      }}
    >
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
        embedded
      />

      {!loading && currentBills.length > 0 && (
        <InsightStrip kpis={kpisWithDeltas} days={dayTimeline} categories={categories} embedded />
      )}

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
              No paid bills for {fmtShort(current.start)}–{fmtShort(current.end)}.
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
          </div>
        ) : (
          // ── Mobile single-column stack ──
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 16px 40px" }}>
            {dashboardSummary}
            <RevenueTrendChart days={dayTimeline} />
            <CategoryBreakdown categories={categories} />
            <TopItemsTable items={topItems} />
            <WeekdayPattern weekdays={weekdays} start={current.start} end={current.end} />
          </div>
        )
      )}
    </div>
  );
}
