# Analytics Dashboard — Implementation Plan

## Overview

Improve the Sales Trends dashboard (`AnalyticsView`) for clarity, correct metric semantics, and better information hierarchy. All work is confined to `src/views/AnalyticsView.tsx`, `src/components/analytics/`, `src/utils/analytics.ts`, and the bill-creation layer.

Three phases ordered by risk/effort. Phase 1 can ship as a standalone PR.

---

## Phase 1 — Fast readability wins

**Effort:** ~3h | **Risk:** low

### 1. Add `session_id` to bills for correct "Tables" counting

The `Tables` KPI currently equals `bills.length`, which over-counts when a table splits — two guests paying separately on the same table shows as 2 tables. "Tables served" is the correct operational metric (measures throughput, not payment events).

**Fix:** add a `session_id` field to bills. All bills from the same table close share one ID. `aggregateKpis` counts distinct `session_id` values instead of bill count.

#### Directus schema
Add `session_id` — type **text**, nullable, no default — to the `bills` collection.

#### `src/types/index.ts`
Add to `Bill` interface:
```ts
session_id?: string;
```

#### `src/utils/billFactory.ts`
Add `sessionId?: string` param to `baseTableBill` and all three public factories. Spread into returned object as `session_id`.

#### `src/contexts/SplitContext.tsx`
Add `sessionId: string` to split state. Initialize with `crypto.randomUUID()` on `INITIATE_EQUAL` and `INITIATE_ITEM` actions. This ensures all per-guest bills from one split share one ID without prop-drilling.

#### Bill creation callsites

| File | Change |
|---|---|
| `src/hooks/useTableClose.ts:submitClose` | `const sessionId = crypto.randomUUID()` before `addPaidBill`; include `session_id: sessionId` in bill literal |
| `src/views/TicketView.tsx` | Same: generate `sessionId`, pass to `createFullTableBill` |
| `src/views/SplitEqualView.tsx` | Read `state.sessionId` from SplitContext, pass to `createEqualSplitTableBill` |
| `src/views/SplitConfirmView.tsx` | Read `state.sessionId` from SplitContext, include in each per-guest bill |
| `src/views/SplitDoneView.tsx` | Read `state.sessionId` from SplitContext, pass to `createItemSplitTableBill` |

#### `src/services/directusBills.ts`
Include `session_id` in the fields list when fetching bills and in the create payload.

#### `src/utils/analytics.ts` — `aggregateKpis`
```ts
const sessionIds = new Set(bills.map(b => b.session_id).filter(Boolean));
const legacyCount = bills.filter(b => !b.session_id).length;
const tables = sessionIds.size + legacyCount;
```
Legacy bills (pre-schema-change) each count as 1 table — correct conservative fallback.

#### `src/components/analytics/KpiSummary.tsx`
Keep label `"Tables"`. No rename needed.

---

### 2. Rename "Revenue Mix" → "Item Revenue Mix"
`CategoryBreakdown.tsx:22` — change heading text. One-liner.

### 3. Reorder mobile stack
`AnalyticsView.tsx` mobile branch — swap `WeekdayPattern` and `RevenueTrendChart`:

**Current:** KpiSummary → WeekdayPattern → RevenueTrendChart → CategoryBreakdown → TopItemsTable

**Target:** KpiSummary → RevenueTrendChart → CategoryBreakdown → TopItemsTable → WeekdayPattern

### 4. Add bill count to selected-day info strip
`RevenueTrendChart.tsx:72–76` — add `Bills` span alongside Revenue / Covers / Avg Bill. `billCount` already exists on `DayData`.

### 5. Add date range context row
`PeriodSelector.tsx` — add `currentRange: DateRange` and `priorRange: DateRange` props. Render below chip row:
```
Jun 3–Jun 9  ·  vs May 27–Jun 2
```
`AnalyticsView.tsx` — pass `currentRange={current}` and `priorRange={prior}` (already available from `bounds`).

For `thisMonth`, the end date is today, so display naturally reads as MTD.

---

## Phase 2 — Stronger dashboard hierarchy

**Effort:** ~5h | **Risk:** medium (visual QA on mobile + wide)

### 6. Add `covers` KPI
`analytics.ts` — add `covers: number` to `KpiData` and `coversΔ: number | null` to `KpiWithDeltas`. Update `aggregateKpis` to sum `billCovers(b)` (helper already exists at line 31).

`KpiSummary.tsx` — add Covers tile. Grid stays 2-column on mobile; use `repeat(3, 1fr)` on wider layouts if 5 tiles.

Rename `tables`/`tablesΔ` fields to `bills`/`billsΔ` in `analytics.ts` types (internal field name only — the displayed label remains "Tables"). Only 3 callers: `AnalyticsView`, `KpiSummary`, `computeDeltas`.

### 7. Add comparison caption to KpiSummary
Pass `comparisonLabel: string` prop. Generate in `AnalyticsView`:
- `last7` → `"vs previous 7 days"`
- `last30` → `"vs previous 30 days"`
- `thisMonth` → `"vs last month"`
- `custom` → `"vs prior N days"` (compute N from `daysBetween`)

Render as a small row inside the grid wrapper above the tiles.

### 8. Add deterministic insight strip
New function in `analytics.ts`:
```ts
export function computeInsights(
  kpis: KpiWithDeltas,
  days: DayData[],
  categories: CategoryData[],
): string[]
```
Returns 2–3 strings:
1. Revenue delta — `"Revenue up/down X% vs previous period"` (skip if `revenueΔ` is null)
2. Best day — `"Best day: Sat Jun 7, €1,420"`
3. Top category — `"Top category: Food, 58% of item revenue"`

New component `InsightStrip` in `AnalyticsView.tsx` (or `src/components/analytics/InsightStrip.tsx`). Placed between `<PeriodSelector>` and the loading skeletons. Renders nothing while loading.

### 9. Default selected day to latest with revenue
`RevenueTrendChart.tsx` — use `useEffect` to set `selectedIdx` when `days` first loads:
```ts
useEffect(() => {
  const last = [...days].map((d, i) => ({ r: d.revenue, i })).filter(x => x.r > 0).at(-1);
  setSelectedIdx(last?.i ?? null);
}, [days.length]);
```

### 10. Add peak context to chart header
`RevenueTrendChart.tsx` — right-side label in the card header: `Peak €1,420`. Derived from `Math.max(...days.map(d => d.revenue))`. Show only when `maxRevenue > 0`.

### 11. Improve wide layout
`AnalyticsView.tsx` wide branch — replace `gap: 0` grid with real spacing:
```tsx
<div style={{ padding: "16px 16px 40px", display: "flex", flexDirection: "column", gap: 12 }}>
  <KpiSummary />
  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
    <RevenueTrendChart />
    <CategoryBreakdown />
  </div>
  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
    <TopItemsTable />
    <WeekdayPattern />
  </div>
</div>
```
Strip the `margin: "12px 16px 0"` from individual card components; own all spacing in the grid parent.

---

## Phase 3 — Better analysis depth

**Effort:** ~3h | **Risk:** medium (data model assumptions)

### 12. Add % of item revenue to TopItemsTable
`analytics.ts:getTopItems` — compute total item revenue inside the function; add `pct` field to `ItemData`.

`TopItemsTable.tsx` — show `pct` as a dim suffix (e.g. `58%`) on each row.

### 13. Show weekday sample count
`WeekdayData.dayCount` already carries the count. Surface it in `WeekdayPattern.tsx`:
- When `rangeDays >= 28`: render sample count beside each bar label (e.g. `Sat avg across 4 days`)
- When `rangeDays < 14`: show a more prominent low-data warning (current 11px text is easy to miss); optionally collapse bars

### 14. Improve empty state
`AnalyticsView.tsx:127–143` — replace generic message with:
- Selected date range: `"No paid bills for Jun 3–Jun 9."`
- Action: `Switch to Last 30` → `setPeriod("last30")`
- Action: `Go to Daily Sales` → `setView("dailySales")`

---

## Full file list

| File | P1 | P2 | P3 |
|---|---|---|---|
| Directus `bills` collection | add `session_id` field | — | — |
| `src/types/index.ts` | add `session_id` to `Bill` | — | — |
| `src/utils/billFactory.ts` | accept + forward `sessionId` | — | — |
| `src/contexts/SplitContext.tsx` | add `sessionId` to state | — | — |
| `src/hooks/useTableClose.ts` | generate + attach `session_id` | — | — |
| `src/views/TicketView.tsx` | generate + attach `session_id` | — | — |
| `src/views/SplitEqualView.tsx` | pass `state.sessionId` | — | — |
| `src/views/SplitConfirmView.tsx` | pass `state.sessionId` | — | — |
| `src/views/SplitDoneView.tsx` | pass `state.sessionId` | — | — |
| `src/services/directusBills.ts` | include `session_id` in fetch + create | — | — |
| `src/utils/analytics.ts` | count distinct sessions in `aggregateKpis` | rename `tables→bills`, add `covers`, add `computeInsights` | add `pct` to `ItemData` |
| `src/components/analytics/KpiSummary.tsx` | keep "Tables" label | add Covers tile, comparison caption | — |
| `src/components/analytics/CategoryBreakdown.tsx` | rename to "Item Revenue Mix" | — | — |
| `src/components/analytics/PeriodSelector.tsx` | add date range context row | — | — |
| `src/components/analytics/RevenueTrendChart.tsx` | add bill count to info strip | default selection, peak label | — |
| `src/components/analytics/TopItemsTable.tsx` | — | — | add pct column |
| `src/components/analytics/WeekdayPattern.tsx` | — | — | sample count, low-data state |
| `src/views/AnalyticsView.tsx` | reorder mobile stack | InsightStrip, wide layout grid, comparison label | improved empty state |

---

## Risks & notes

- **`session_id` in SplitConfirmView**: verify `state.sessionId` is set before the first `addPaidBill` call in that view, not lazily initialized.
- **`tables` field rename** (Phase 2): only used in `AnalyticsView`, `KpiSummary`, and `computeDeltas`. Run `tsc --noEmit` after.
- **`findLastIndex` / `.at(-1)`** (Phase 2): requires ES2022 lib target. Fallback: `[...days].reverse().findIndex(d => d.revenue > 0)`.
- **Grid gap vs card margin** (Phase 2): if card-level `margin` is removed, confirm mobile single-column wrapper has `gap: 12`.
- **Weekday zero-days** (Phase 3): `dayCount` includes closed/no-sales days. Adding a note in the UI resolves ambiguity without changing the calculation.

---

## Open product decisions

- Should `Covers` become a primary KPI even though it depends on split metadata quality?
- Should weekday averages include closed/no-sales days?
- Should item variants be grouped or shown separately in Top Items?
- Should Revenue Mix reconcile to net revenue after Gutschein, or remain item-gross?
