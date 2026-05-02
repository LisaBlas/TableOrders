# TableOrders Codebase Review Plan

**Created**: 2026-04-29
**Status**: Active
**Approach**: Session-based deep dives targeting specific subsystems and interactions

> **Note**: This document covers **code-level reviews**. For production/ops concerns (monitoring, backups, token security), see [SECURITY.md](SECURITY.md).

---

## Review Philosophy

- **Session-based**: 60-90 min focused reviews with concrete artifacts
- **Output-driven**: Each session produces issues list + quick wins + refactor candidates
- **Prioritized by impact**: P0 (breaks revenue) > P1 (blocks features) > P2 (technical debt)
- **Automation-ready**: Flag what can be linted, tested, or agent-checked

---

## Review Dimensions

### 1. By Architecture Layer
- State management (contexts + hooks) — race conditions, stale closures
- Sync infrastructure (useDirectusSync, polling, conflict resolution) — correctness, edge cases
- Services layer (Directus API calls) — error handling, retry logic, timeout behavior
- View layer (UI components) — loading states, error boundaries, UX consistency
- Utilities (helpers, factories, aggregations) — reusability, coupling

### 2. By Critical User Flow
- Auth → Table selection → Order → Send → Bill → Close (happy path)
- Multi-device sync (conflict scenarios, race conditions)
- Offline → Online recovery (localStorage fallback, rehydration)
- Split payment flows (equal/item modes, edge cases)
- Table swap (state transfer integrity)

### 3. By Risk Surface
- Data consistency (localStorage ↔ Directus ↔ React state triangle)
- Concurrency (debounce + polling + user actions)
- Error recovery (network failures, malformed data, Directus downtime)
- Security (auth bypass, XSS in notes, token exposure)
- Performance (re-render storms, polling overhead, memory leaks)

### 4. By Integration Point
- Directus API (sessions, bills, menu) — contract assumptions, versioning
- Browser APIs (localStorage, clipboard, window events)
- TanStack Query (cache staleness, retry config, optimistic updates)

---

## Planned Review Sessions

### Session 1: Sync Correctness Audit ✅
**Focus**: [useDirectusSync.ts](src/hooks/useDirectusSync.ts) + [directusSessions.ts](src/services/directusSessions.ts) + [conflictDetection.ts](src/utils/conflictDetection.ts)

**Completed**: 2026-04-29

**Questions**:
- ✅ Does the 3-second grace period handle all race conditions? **NO** — extends on retry, extends for wrong tables
- ✅ Can polling + debounce + user actions create inconsistent states? **YES** — stale ref race during debounce window (P0)
- ✅ What happens when writes fail during the grace period? **SILENT FAILURE** — user left in limbo after retries (P1)
- ✅ Are batch merges order-safe when timestamps interleave? **NO** — positional indices break (P0)

**Known Issues Verified**:
- ✅ Grace period ambiguity — CONFIRMED, plus additional issues found (P1 #5, P1 #6)
- ✅ `marked_batches` positional indices — CONFIRMED (P0 #3)
- ✅ Ref-based debounce reads stale state — CONFIRMED CRITICAL (P0 #1, #2)

**Findings**:
- 4 P0 (critical) issues — data loss/corruption in multi-device scenarios
- 8 P1 (high priority) issues — edge cases, race conditions
- 4 P2 (technical debt) issues — performance, robustness

**Output**: [session-01-sync-audit.md](session-01-sync-audit.md)

---

### Session 2: State Consistency Review ✅
**Focus**: [TableContext.tsx](src/contexts/TableContext.tsx) + [AppContext.tsx](src/contexts/AppContext.tsx) + localStorage interactions

**Completed**: 2026-04-29

**Questions**:
- ✅ Are all state transitions atomic? **MOSTLY** — React 18 batching saves us; but atomicity depends on that guarantee (P1)
- ✅ Can localStorage and Directus drift out of sync? **YES, ~16ms window** — acceptable for this use case (P1-5)
- ✅ What happens if setState is called during debounce window? **No new issues** — already covered in Session 1
- ✅ Are optimistic updates (tempId → directusId) race-safe? **NO** — editingBillIndex positional race (P0-1), retry-cancel race (P0-3)

**Known Issues Verified**:
- ✅ Render-phase side effects in [OrderView.tsx:50-55](src/views/OrderView.tsx#L50-L55) — **Already fixed** (commit 9f8ff4f)
- ✅ Seated table state uses both array and Set — **Confirmed, by design** — correct pattern, no bug
- ✅ Bill optimistic updates could race with query invalidation — **Confirmed** — 2 P0 races found

**Findings**:
- 3 P0 (critical) issues — positional index race, shallow snapshot, retry-cancel race
- 5 P1 (high priority) issues — archiveRef staleness, non-atomic cleanup, edit-mode POS sync bypass
- 4 P2 (technical debt) issues — localStorage pattern, schema validation, dual seatedTables representation

**Output**: [session-02-state-consistency.md](session-02-state-consistency.md)

---

### Session 3: Payment Flow Integrity ⏳
**Focus**: [SplitContext.tsx](src/contexts/SplitContext.tsx) + [billFactory.ts](src/utils/billFactory.ts) + [useTableClose.ts](src/hooks/useTableClose.ts)

**Questions**:
- Can split flows create bills with invalid totals?
- What happens if gutschein exceeds bill total?
- Are all edge cases validated (zero guests, empty items, negative totals)?
- Can table close fail silently?

**Known Issues to Verify**:
- ⚠️ Empty order items in bill creation (no validation)
- ⚠️ Division by zero in equal split (guest count = 0)
- ⚠️ Gutschein can exceed total (negative bills)

**Output**: `session-03-payment-integrity.md`

---

### Session 4: Error Resilience Check ⏳
**Focus**: Error boundaries + retry logic + offline fallback + service layer error handling

**Questions**:
- Are all async operations wrapped in try-catch?
- Do failed writes surface to the user?
- Can the app recover from Directus downtime?
- Are error boundaries granular enough?

**Known Issues to Verify**:
- ✅ [deleteSession](src/services/directusSessions.ts#L50) missing error handling
- ✅ Single error boundary too broad (crashes entire app)
- ⚠️ No user feedback on bill creation failures beyond toast

**Output**: `session-04-error-resilience.md`

---

### Session 5: Performance Profiling ⏳
**Focus**: Re-render analysis + polling overhead + debounce tuning + memoization gaps

**Questions**:
- Are contexts causing unnecessary re-renders?
- Is 2-second polling too aggressive?
- Should debounce be longer than 500ms?
- Which computations need memoization?

**Known Issues to Verify**:
- ✅ AppContext combines 4 unrelated concerns (toast triggers bill re-renders)
- ✅ SplitContext derived values not memoized
- ⚠️ Table status computed for all tables on every render

**Output**: `session-05-performance.md`

---

### Session 6: Type Safety Sweep ⏳
**Focus**: `any` usage + missing interfaces + unsafe casts + TS strict mode gaps

**Questions**:
- Can we enable `strict: true` in tsconfig?
- Are all Directus DTOs properly typed?
- Can we remove all `any` casts?

**Known Issues to Verify**:
- ✅ `any` types in [AppContext.tsx:94](src/contexts/AppContext.tsx#L94), [DailySalesView.tsx:46,95](src/views/DailySalesView.tsx#L46)
- ✅ Loose typing in [getTableDestinations](src/views/TablesView.tsx#L14)
- ⚠️ SplitData should be typed union

**Output**: `session-06-type-safety.md`

---

## Confirmed High-Priority Fixes

### From Previous Analysis (CODE_ANALYSIS.md)

#### P0: Fix Immediately ✅ ALL COMPLETED 2026-04-29
1. ✅ **Render-phase side effects** — [OrderView.tsx:50-55](src/views/OrderView.tsx#L50-L55) (5 min)
   - ✅ Fixed: Subcategory filter state removed entirely (commit 9f8ff4f, Apr 24, 2026)
   - Was: Move searchQuery logic to useEffect
   - Violates React render purity

2. ✅ **Timer cleanup** — [useLongPress.ts](src/hooks/useLongPress.ts) (3 min)
   - ✅ Fixed 2026-04-29: Added cleanup effect to clear timeout on unmount
   - Prevents memory leaks

3. ✅ **Service error handling** — [directusSessions.ts:49-63](src/services/directusSessions.ts#L49-L63) (10 min)
   - ✅ Fixed 2026-04-29: Added try-catch, return `{ success, error }`
   - Call site updated in [useDirectusSync.ts:237](src/hooks/useDirectusSync.ts#L237)
   - Propagates errors to user

#### P1: High-Value Improvements (6-8 hours)
4. **Extract Directus client helpers** (2 hours)
   - Centralize fetch logic
   - Consistent error handling
   - Easier to test and mock

5. **Split TableContext sync mechanics** (3-4 hours)
   - Extract `useTableSync` hook (polling/debounce/conflict resolution)
   - Keep mutation logic in TableContext
   - Clearer boundaries, easier to test

6. ✅ **Memoize SplitContext derived values** (20 min)
   - ✅ Fixed 2026-04-29: All derived values wrapped in useMemo
   - [SplitContext.tsx:149-160](src/contexts/SplitContext.tsx#L149-L160)
   - Prevents re-computation on every render

#### P2: Code Quality
7. **Split AppContext** (3-4 hours)
   - Deferred until profiling shows toast → bill re-render is a real bottleneck
   - Split into: NavigationContext, UIContext, BillContext, DailySalesContext

8. ✅ **Extract swap logic helper** (15 min)
   - ✅ Fixed 2026-04-29: `swapTableState<T>` helper extracted
   - [TableContext.tsx:19-27](src/contexts/TableContext.tsx#L19-L27)
   - Removed ~28 duplicate lines

9. **Add input validation** (30 min)
   - Custom item price/qty bounds
   - Guest count > 0
   - Gutschein ≤ total

---

## Known Architectural Issues

### 1. Race Condition in Table State Sync
**Severity**: Medium (pragmatic but fragile in multi-device use)
**Location**: [TableContext.tsx:143-181](src/contexts/TableContext.tsx#L143-L181)

**Problem**: Ref-based debounce reads stale state during 500ms window. If remote poll happens mid-debounce, local writes can overwrite newer remote data.

**Scenario**:
1. User adds item (scheduleWrite(1) called)
2. Remote poll at T450ms merges state
3. Local debounce fires at T500ms, reads `ordersRef.current` (may be stale)
4. Directus write at T500ms loses remote changes

**Fix**: Use functional setState updates or implement version-based conflict resolution.

---

### 2. `marked_batches` Uses Positional Indices
**Severity**: Low (rare, only breaks on cross-device batch interleaving)
**Location**: [conflictDetection.ts](src/utils/conflictDetection.ts), Directus `table_sessions.marked_batches`

**Problem**: When two devices merge sessions and one has a batch whose timestamp falls between existing batches, the merged array is re-sorted and all subsequent indices shift. Stored marks now point to wrong batches.

**Example**:
- Device A: `sent_batches = [b0(t=1), b1(t=3)]`, `marked_batches = [1]` → b1 marked
- Device B: `sent_batches = [b0(t=1), b2(t=2)]`, `marked_batches = [0]` → b0 marked
- After merge + sort: `sent_batches = [b0(t=1), b2(t=2), b1(t=3)]`
- `marked_batches = [0, 1]` → marks b0 and b2, but b1 silently unmarked

**Fix**: Replace integer indices with batch timestamps. Change `marked_batches: number[]` to `marked_batches: string[]` (ISO timestamps). Requires one-time Directus migration.

---

### 3. Over-Centralized AppContext (Re-render Storm)
**Severity**: Low (optimization without measurement)
**Location**: [AppContext.tsx](src/contexts/AppContext.tsx)

**Problem**: Toast changes trigger bill card re-renders. AppContext combines 4 unrelated concerns:
1. Navigation (`view`, `activeTable`, `ticketTable`)
2. UI feedback (`toast`)
3. Date selection (Daily Sales)
4. Bill CRUD + edit mode

**Fix**: Split into 4 contexts — but **only if profiling shows real bottlenecks**. Current approach is acceptable unless proven problematic.

---

### 4. Conflict Resolution Grace Period Ambiguity
**Severity**: Low (pragmatic tradeoff)
**Location**: [TableContext.tsx:92-93](src/contexts/TableContext.tsx#L92-L93)

```tsx
const isLocallyOwned = (key: string) =>
  pendingWrites.current.has(key) || now - (lastWriteTime.current[key] ?? 0) < 3000;
```

**Gap**: If user makes change at T0, write scheduled at T500, remote read at T1500 → state is "locally owned" even though remote may have newer data. If write fails and retries, grace period extends further.

**Fix**: Version-based conflict resolution instead of time-based ownership.

---

## Edge Cases & Validation Gaps

### Empty Order Items in Bill Creation
**Location**: [billFactory.ts](src/utils/billFactory.ts)
**Problem**: No validation if `items` array is empty or all items have qty=0

**Fix**:
```tsx
export const createFullTableBill = (orders: OrderItem[], ...args): Bill => {
  const validItems = orders.filter(item => item.sentQty > 0);

  if (validItems.length === 0) {
    throw new Error("Cannot create bill with no items");
  }
  // ...
};
```

---

### Division by Zero in Split
**Location**: [SplitEqualView.tsx](src/views/SplitEqualView.tsx)
**Problem**: Guest count = 0 causes division by zero

**Fix**:
```tsx
const handleConfirm = () => {
  if (guestCount <= 0) {
    showToast("Guest count must be at least 1");
    return;
  }
  // ...
};
```

---

### Gutschein Amount Exceeds Total
**Location**: [Receipt.tsx](src/components/Receipt.tsx)
**Problem**: Bill could end up negative if gutschein > total

**Fix**:
```tsx
const finalTotal = Math.max(0, total - gutschein);
```

---

### Custom Item Input Validation
**Location**: [OrderView.tsx:89-94](src/views/OrderView.tsx#L89-L94)
**Problem**: No bounds checking on custom price/qty

**Fix**:
```tsx
const price = parseFloat(customPrice.replace(",", "."));
const qty = parseInt(customQty);

if (isNaN(price) || price < 0 || price > 1000) {
  showToast("Invalid price (0-1000€)");
  return;
}

if (isNaN(qty) || qty < 1 || qty > 100) {
  showToast("Invalid quantity (1-100)");
  return;
}
```

---

## Quick Wins — ✅ ALL COMPLETED 2026-04-29

**Status**: All 6 quick wins implemented
**Total Time**: ~68 minutes (actual: #1 already fixed Apr 24, #2-6 completed Apr 29)
**Detail Log**: See [QUICK_WINS_DETAILS.md](QUICK_WINS_DETAILS.md) (can be archived/deleted)

1. ✅ **Move searchQuery logic to useEffect** — Fixed commit 9f8ff4f (Apr 24, 2026)
   - Subcategory filter state removed entirely
   - [useSubcategoryState.ts](src/hooks/useSubcategoryState.ts) deleted

2. ✅ **Add timer cleanup** — [useLongPress.ts](src/hooks/useLongPress.ts) (3 min)
   - Added cleanup effect to clear timeout on unmount

3. ✅ **Add try-catch to deleteSession** — [directusSessions.ts:49-63](src/services/directusSessions.ts#L49-L63) (10 min)
   - Returns `{ success, error }` structure
   - Call site updated in [useDirectusSync.ts:237](src/hooks/useDirectusSync.ts#L237)

4. ✅ **Extract swapTableState helper** — [TableContext.tsx:19-27](src/contexts/TableContext.tsx#L19-L27) (15 min)
   - Generic `swapTableState<T>` helper reduces duplication
   - Removed ~28 duplicate lines

5. ✅ **Memoize SplitContext values** — [SplitContext.tsx:149-160](src/contexts/SplitContext.tsx#L149-L160) (20 min)
   - All derived values (selectedItems, selectedTotal, remainingTotal, currentGuestNum, lastPayment) wrapped in useMemo
   - Context value itself memoized

6. ✅ **Add ARIA labels to table grid** — [TableCard.tsx:69-88](src/components/TableCard.tsx#L69-L88) (20 min)
   - Accessible status announcements for screen readers
   - Includes table ID, status, destinations, swap mode state

---

## Session Output Template

Each session produces a markdown file with:

```markdown
# Session N: [Title]

**Date**: YYYY-MM-DD
**Duration**: Xh
**Files Reviewed**: [list]

## Issues Found

### P0: Critical (breaks revenue or causes data loss)
- [ ] Issue title — [file:line](link) — Description

### P1: High (blocks features or major UX degradation)
- [ ] Issue title — [file:line](link) — Description

### P2: Technical Debt (code quality, maintainability)
- [ ] Issue title — [file:line](link) — Description

## Quick Wins (< 30 min)
- [ ] Fix title — [file:line](link) — 5 min

## Refactor Candidates
- [ ] Refactor title — [file:line](link) — 2 hours

## Test Gaps
- [ ] Missing test for: [scenario]

## Automation Opportunities
- [ ] What: [ESLint rule / CI check / agent validation]
```

---

## Next Steps

1. ✅ ~~**Quick Wins (Original)**~~ — All 6 fixes completed (2026-04-29)
2. ✅ ~~**Session 1: Sync Correctness Audit**~~ — COMPLETED (2026-04-29)
   - Found: 4 P0, 8 P1, 4 P2 issues
   - Output: [session-01-sync-audit.md](session-01-sync-audit.md)
3. ✅ ~~**Fix P0 Issues from Session 1 (Phase 1 & 2)**~~ — COMPLETED (2026-04-29)
   - ✅ #1: Stale ref race in debounced writes — capture state inside timeout
   - ✅ #2: Ref sync race in conflict resolution — removed manual ref updates
   - 🟡 #3: Marked batches use positional indices — **DEFERRED** (requires migration)
   - ✅ #4: Table swap writes can race — added markAsLocallyOwned guard
   - Time: 2.25h actual (vs 4-6h estimated)
   - Tracker: [SESSION_01_TRACKER.md](SESSION_01_TRACKER.md)
4. **Integration Testing** (4 hours) — NEXT
   - 2-device concurrent edit tests
   - Offline→online conflict scenarios
   - Batch merge + marked batches verification
   - Table swap during poll
5. ✅ ~~**Session 2: State Consistency**~~ — COMPLETED (2026-04-29)
   - Found: 3 P0, 5 P1, 4 P2 issues
   - Root pattern: positional index handles used across async boundaries
   - Output: [session-02-state-consistency.md](session-02-state-consistency.md)
   - Tracker: [SESSION_02_TRACKER.md](SESSION_02_TRACKER.md)
6. **Fix P0-3: Marked Batches Migration** (3 hours) — schedule separately
   - Directus schema migration (optional, JSON accepts both)
   - Type updates (string[] instead of number[])
   - Code changes (8 files)
   - Data migration script
7. **Extract Directus client** (2 hours) — can proceed in parallel
8. **Continue sessions 3-6 as needed** — based on findings from sessions 1-2

**Recommended Next**: Integration testing (multi-device scenarios) — validate P0 fixes work in production-like conditions

---

## Automation Roadmap

### Linting & Type Safety
- [ ] Enable `strict: true` in tsconfig.json
- [ ] Add ESLint rule: no-render-phase-side-effects
- [ ] Add ESLint rule: require-cleanup-in-effects
- [ ] Add pre-commit hook: `tsc --noEmit`

### Testing (deferred)
- [ ] Unit tests for billFactory.ts
- [ ] Unit tests for conflictDetection.ts
- [ ] Integration tests for payment flows
- [ ] E2E tests for multi-device sync

### CI/CD
- [ ] GitHub Action: typecheck on PR
- [ ] GitHub Action: bundle size check
- [ ] GitHub Action: deployment smoke test

---

## What NOT to Worry About (Developer Feedback from Previous Analysis)

Based on prior comprehensive analysis, these items are **low priority** or **overstated concerns**:

### [NOTE] Provider Nesting is Fine
- Nesting itself is not the problem
- **Real issue**: Unstable context values and broad consumers
- **Fix**: Memoize context values first, don't restructure the tree

### [NOTE] Lazy Loading Views is Low Priority
- Current bundle: ~325 kB / ~90 kB gzip
- **Totally acceptable** for this app
- Time better spent elsewhere

### [NOTE] Hardcoded Credentials via Env Vars Doesn't Secure Frontend
- Env vars still end up in built JS
- **Real fix**: Server-side auth
- May be overkill for current use case

### [NOTE] Optimistic Bill Updates Are Working
- Temp IDs are the right basic pattern
- TanStack mutations would be cleaner, but current approach works
- **Not urgent** unless proven problematic

### [NOTE] Array State for Seated Tables is Fine
- Current approach is easier to serialize and compare
- No need to switch to Set state unless profiling shows issues
- Optimization without measurement

### [CONFIRM] Focus on These Instead
- ✅ Render-phase side effects (OrderView) — real React purity violation
- ✅ deleteSession missing error handling — real production issue
- ✅ Table sync conflict model — pragmatic but fragile
- ✅ TableContext too large — needs sync extraction
- ✅ Timer cleanup — prevents memory leaks

---

**Status**: Quick wins complete (2026-04-29) — Ready for deep dive sessions
**Next Session**: Session 1 (Sync Correctness Audit)
**Remaining Time**: 12-16 hours across 6 planned sessions
