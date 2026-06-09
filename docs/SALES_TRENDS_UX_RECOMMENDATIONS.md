# Sales Trends UX Recommendations

## Objective

Improve the Sales Trends dashboard so restaurant operators can understand sales performance quickly, access the most useful analysis with less hunting, and trust what each metric means.

The dashboard should stay practical and operational. It is not a finance suite or fiscal POS report. It should answer:

- How are sales doing for the selected period?
- What changed versus the previous comparable period?
- Which days, categories, and items are driving the result?
- Where should staff or management look next?

## Current Dashboard Map

Entry point:

- `TablesView` exposes `Daily Sales` and `Sales Trends` as separate actions.
- `Sales Trends` routes to `AnalyticsView`.

Current screen structure:

- Header with back button and title.
- Period selector: Last 7, Last 30, This month, Custom.
- KPI summary: Revenue, Avg Bill, Avg Tip, Tables.
- Weekday Pattern.
- Revenue Trend.
- Revenue Mix.
- Top Items.

Current data sources:

- `fetchBillsByDateRange` loads current and prior periods.
- `aggregateKpis` calculates revenue, average bill, average tip percentage, and bill count.
- `buildDayTimeline` creates daily revenue bars.
- `groupByCategory` creates Food, Wines, Drinks, Shop revenue mix.
- `getTopItems` ranks item revenue and quantity.
- `groupByWeekday` averages revenue by weekday.

## Main UX Problems

### 1. The dashboard has no executive summary

The user sees raw modules immediately, but not the conclusion. Revenue, trend, weekday pattern, category mix, and items are all useful, but the screen does not tell the operator what matters first.

Recommended fix:

- Add a compact insight strip under the period selector.
- Show 2-3 generated summaries from the existing analytics data.
- Keep it factual and deterministic, not AI-generated.

Example:

```text
Revenue is up 12.4% vs previous 7 days.
Best day: Saturday, EUR 1,420.
Top category: Food, 58% of item revenue.
```

This gives the dashboard a point of view without adding complexity.

### 2. KPI labels are ambiguous

`Tables` currently means bill count, not physical tables, covers, or sessions. `Avg Bill` means revenue divided by number of bills. `Avg Tip` is tip percentage over revenue. These are reasonable metrics, but the labels can mislead staff.

Recommended fix:

- Rename `Tables` to `Bills`.
- Consider adding `Covers` as a primary KPI because `billCovers` already exists.
- Use small helper text only where needed, not long instructional copy.
- Label deltas as `vs previous period` somewhere near the KPI group.

Recommended KPI order:

1. Revenue
2. Bills
3. Avg Bill
4. Covers or Avg Tip

If space allows on tablet/desktop, include both Covers and Avg Tip.

### 3. Period context is not visible after selection

The selected period is clear from the chip, but the actual date range and comparison range are hidden. This makes deltas harder to trust, especially for `This month` and `Custom`.

Recommended fix:

- Add a small date range row below the period selector.
- Format as `Jun 3-Jun 9, compared with May 27-Jun 2`.
- For `This month`, clarify that the current period is month-to-date.
- For custom ranges, show disabled/apply state more explicitly when dates are invalid.

### 4. Mobile order does not match decision priority

Mobile currently shows:

1. KPI summary
2. Weekday Pattern
3. Revenue Trend
4. Revenue Mix
5. Top Items

For quick operational reading, trend should usually come before weekday pattern. Weekday analysis is more strategic and needs a longer sample.

Recommended mobile order:

1. Period selector and date context
2. Insight strip
3. KPI summary
4. Revenue Trend
5. Revenue Mix
6. Top Items
7. Weekday Pattern

Recommended wide layout:

- Top band: insight strip and KPI summary.
- Main row: Revenue Trend wide, Revenue Mix narrow.
- Secondary row: Top Items wide, Weekday Pattern narrow.

This makes the screen scan from "what happened" to "why it happened".

### 5. Cards are visually similar, so hierarchy is weak

All modules use similar card styling and small 13px headings. This keeps the UI quiet, but it flattens priority. The operator has to read every card title instead of scanning by visual weight.

Recommended fix:

- Give KPI values and the Revenue Trend more visual priority.
- Keep secondary cards compact.
- Use consistent section headers:
  - Title
  - optional right-side context
  - content
- Avoid overusing pills inside cards. Use segmented controls only where they change the view.

Suggested card priorities:

- Primary: KPI Summary, Revenue Trend.
- Secondary: Revenue Mix, Top Items.
- Tertiary: Weekday Pattern.

### 6. Deltas need direction and context

KPI deltas are color-coded, but there is no visible basis for comparison. Some deltas are percentages and others are absolute values. Null deltas show as a dash, which is technically correct but not meaningful.

Recommended fix:

- Add a label above or below KPI cards: `Compared with previous 7 days`.
- Use arrows or +/- consistently.
- For unavailable deltas, show `No prior data` instead of a dash where space allows.
- For Avg Tip, label the delta as percentage points, e.g. `+1.2 pp`.

### 7. Revenue Trend needs stronger readability

The bar chart works, but it has limited context:

- No y-axis scale.
- Date labels disappear for longer ranges.
- Selected day details are hidden until interaction.
- Very small bars can be hard to tap.

Recommended fix:

- Add max value context, e.g. `Peak EUR 1,420`.
- Keep a minimum tap target around each bar even when the visual bar is thin.
- Show selected or latest day by default.
- For 30-day/custom ranges, show weekly tick labels or first/mid/last date labels.
- Include bill count in the selected info strip, not just covers and avg bill.

### 8. Weekday Pattern needs sample confidence

The component warns that it is best with 4+ weeks of data, which is good. But it still appears above core trend data on mobile, and it averages zero-sales days into the weekday value. That may be correct, but the user should understand the meaning.

Recommended fix:

- Move Weekday Pattern lower on mobile.
- Show sample count per weekday when range is long enough, e.g. `Sat avg across 4 days`.
- Consider a toggle or label for whether zero-sales days are included.
- Hide or collapse the module by default when the period is under 14 days, or show a compact warning state.

### 9. Revenue Mix compares item revenue, not bill net revenue

`Revenue Mix` sums `item.price * item.qty`. The top KPI revenue subtracts Gutschein. That means totals can diverge. This is defensible, but the UI should not imply exact equivalence.

Recommended fix:

- Label card as `Item Revenue Mix`.
- Add small context: `Before Gutschein adjustments`.
- If management expects totals to reconcile, create a shared revenue basis and document it.

### 10. Top Items loses variant detail

Top items are grouped by `item.name`. If variants share the same name but different prices/options, they may be merged. That may be desirable for high-level analysis, but it can hide product-level details.

Recommended fix:

- Keep default grouping by item name.
- Add a future option for `Group variants` on/off if Directus item IDs or variant labels are reliably available in bills.
- Add columns/values for both revenue and quantity in a stable alignment.
- Consider showing percentage of item revenue for each row.

### 11. Empty and loading states are too generic

The empty state says there are no paid bills for the period. It does not help the user recover or switch context.

Recommended fix:

- Empty state should show the selected date range.
- Provide one clear action: switch to Last 30 or go to Daily Sales.
- Loading skeletons should roughly match the eventual layout, especially on wide screens.

### 12. Access from Tables could be clearer

`Daily Sales` and `Sales Trends` are adjacent, but their jobs are different:

- Daily Sales is operational closing / POS crossing.
- Sales Trends is management analysis.

Recommended fix:

- Keep both entries, but visually separate them if space allows.
- Label Sales Trends as `Trends` or `Analytics` if the button is cramped.
- On tablet/desktop, consider a small `Reports` group containing Daily Sales and Trends.

## Recommended Information Architecture

The dashboard should behave like a small reporting workspace, not a flat stack of unrelated cards. The scan path should be:

1. Select period.
2. See the headline result.
3. Understand the trend.
4. Understand the drivers.
5. Drill into details.

Use sections for the main dashboard. Do not use tabs for the first iteration because tabs would hide important context and force users to guess where insights live. Tabs can become useful later if the dashboard grows into separate modes such as `Overview`, `Items`, and `Weekdays`.

Recommended sections:

- Overview: insight summary and KPIs.
- Trend: daily revenue chart.
- Drivers: item revenue mix and top items.
- Patterns: weekday averages.

On mobile, these sections should be simple scroll headings. On desktop, they should become visual groupings through layout, spacing, and column placement. Avoid wrapping entire sections in large cards; keep cards for the individual modules.

### Mobile

```text
Header
Period selector
Date context row
Insight strip
KPI grid
Revenue Trend
Item Revenue Mix
Top Items
Weekday Pattern
```

Recommended mobile layout:

```text
Header
Date / period selector
Summary insight strip
KPI cards
Revenue trend chart
Sales drivers
  Item Revenue Mix
  Top Items
Patterns
  Weekday Pattern
Actions / links
  Daily Sales
```

Place the date picker directly under the header, before any analytics. It controls the whole screen, so it belongs above the data rather than inside a later card.

Recommended mobile period control:

```text
Last 7 | Last 30 | This month | Custom
Jun 3-Jun 9 vs May 27-Jun 2
```

When `Custom` is selected, expand the date controls inline under the chips. Do not move the user to a separate screen unless custom filtering becomes significantly more complex.

### Tablet/Desktop

```text
Header
Period selector + date context
Insight strip
KPI summary

Revenue Trend        Item Revenue Mix
Top Items            Weekday Pattern
```

Recommended desktop layout:

```text
Header
Period selector + date context

Insight strip
KPI row

Main column                 Side column
Revenue Trend               Item Revenue Mix
Top Items                   Weekday Pattern
```

Desktop should not just stretch the mobile stack. Use the available width to keep the most important data visible without excessive scrolling. The main column should carry the primary story: trend first, then item details. The side column should carry supporting driver and pattern analysis.

## Layout And Navigation Recommendations

### Sections vs Tabs

Create sections first. Sections preserve context and make the dashboard easier to scan. Tabs are only worth adding if the dashboard becomes too dense for one coherent screen.

Potential future tabs:

- Overview
- Items
- Weekdays

Do not add these in Phase 1. The immediate opportunity is clearer hierarchy, not more navigation.

### Date Picker Placement

Place the date controls at the top of the dashboard, directly below the header. They are global controls, so users should see them before any metric cards.

Recommended behavior:

- Keep quick ranges as chips or segmented controls.
- Show the exact selected range below the controls.
- Show the comparison range below or beside the selected range.
- Expand custom start/end inputs inline.
- Keep invalid custom ranges visibly disabled with a clear reason.

### Dashboard Navigation

Do not add heavy internal navigation yet.

Recommended first step:

- Keep `Sales Trends` accessible from `TablesView`.
- Add a small action from Sales Trends back to `Daily Sales`.
- On tablet/desktop, consider a future `Reports` group containing `Daily Sales` and `Sales Trends`.

Optional later enhancement:

```text
Overview | Trend | Items | Patterns
```

This should only be added after the sectioned single-page layout becomes too long or if managers start using the dashboard for deeper reporting sessions.

### Clarity Principles

A clear dashboard needs:

- One obvious control area.
- One headline answer.
- Consistent metric definitions.
- Visible comparison context.
- Prioritized layout.
- Fewer equal-weight cards.
- Stable number formatting.
- Plain labels that match the underlying calculations.
- Helpful empty and loading states.
- Drill-down only after the overview is understandable.

The dashboard should answer the first question in under 10 seconds: what happened, compared with what, and what drove it?

## Recommended Metrics

Primary metrics:

- Revenue: net bill revenue after Gutschein adjustment.
- Bills: number of paid bills.
- Avg Bill: net revenue / paid bills.
- Covers: estimated guests from split metadata, fallback 1 per bill.

Secondary metrics:

- Avg Tip: tip / net revenue.
- Peak Day: highest revenue day in selected period.
- Top Category: category with highest item revenue.
- Top Item: item with highest item revenue or quantity.

Recommended naming:

- `Tables` -> `Bills`
- `Revenue Mix` -> `Item Revenue Mix`
- `Avg Tip` -> `Tip Rate`
- `Revenue Trend` -> keep
- `Weekday Pattern` -> keep

## Component-Level Recommendations

### `AnalyticsView.tsx`

- Reorder mobile modules so Revenue Trend appears before Weekday Pattern.
- Add date context derived from `getPeriodBounds`.
- Add deterministic insight summary derived from current analytics.
- Use a responsive grid with real gaps on wide screens instead of `gap: 0` plus card margins.

### `PeriodSelector.tsx`

- Add visible current range and comparison range outside the chip row.
- Keep the custom date controls compact, but improve invalid-date feedback.
- Consider applying custom date changes automatically after valid selection on mobile to reduce taps.

### `KpiSummary.tsx`

- Rename Tables to Bills.
- Add Covers if the dashboard can support five or six tiles on wider layouts.
- Add a comparison caption.
- Use full `EUR` formatting consistently if avoiding symbol encoding issues.

### `RevenueTrendChart.tsx`

- Default selected day to latest day with revenue.
- Add peak/current context in the header.
- Add bill count to selected details.
- Improve longer-range date labels.
- Preserve horizontal scrolling for custom ranges, but keep tap targets stable.

### `CategoryBreakdown.tsx`

- Rename title to Item Revenue Mix.
- Sort categories by revenue for custom/long ranges, or keep fixed order but highlight the leader.
- Add a total item revenue footer if reconciliation matters.

### `TopItemsTable.tsx`

- Keep the Revenue/Qty sort.
- Align revenue and quantity columns more explicitly.
- Add percent of item revenue.
- Preserve collapsed default on mobile, but consider 8 visible rows on tablet/desktop.

### `WeekdayPattern.tsx`

- Move lower in mobile hierarchy.
- Show sample count when period is 28+ days.
- Clarify zero-day inclusion in the card subtitle.

## Implementation Plan

### Phase 1: Fast readability wins

- Rename ambiguous labels.
- Reorder mobile modules.
- Add date comparison context.
- Add bill count to Revenue Trend selected details.
- Rename Revenue Mix to Item Revenue Mix.

Expected effort: small.

Risk: low. Mostly copy/layout changes.

### Phase 2: Stronger dashboard hierarchy

- Add deterministic insight strip.
- Add `Bills`/`Covers` KPI adjustments.
- Improve wide layout spacing and card priority.
- Add peak/latest context to Revenue Trend.

Expected effort: moderate.

Risk: medium. Requires careful metric agreement and visual QA on mobile/tablet.

### Phase 3: Better analysis depth

- Add item revenue percentage in Top Items.
- Add weekday sample count and confidence handling.
- Consider variant grouping option if bill item data supports it.
- Decide whether item revenue mix should reconcile with net revenue or remain explicitly item-based.

Expected effort: moderate.

Risk: medium. Depends on data model expectations.

## Acceptance Criteria

- A user can identify total revenue, comparison direction, and best/worst drivers within 10 seconds.
- KPI labels match the underlying calculations.
- The selected date range and comparison range are visible.
- Mobile scan order prioritizes period, summary, KPIs, and trend before deeper analysis.
- Empty state helps the user recover by changing range or returning to Daily Sales.
- Layout remains touch-friendly and readable on phone and tablet.
- No fiscal/POS compliance language is introduced.

## Open Product Decisions

- Should the dashboard optimize for staff shift review or owner/manager analysis?
- Should revenue mix reconcile to net revenue after Gutschein, or remain item-gross?
- Should `Covers` become a primary KPI even though it depends on split metadata quality?
- Should weekday averages include closed/no-sales days?
- Should item variants be grouped or shown separately?

## Suggested Next Step

Implement Phase 1 first. It improves clarity without changing the data model, and it will reveal whether the dashboard needs deeper analytics or just better structure.
