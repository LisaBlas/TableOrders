# Session 2: State Consistency Review

**Date**: 2026-04-29
**Duration**: ~90 min
**Status**: Audit complete, fixes pending
**Tracker**: [SESSION_02_TRACKER.md](SESSION_02_TRACKER.md)

## Files Reviewed

| File | Lines | Focus |
|------|-------|-------|
| [TableContext.tsx](src/contexts/TableContext.tsx) | 433 | Table state mutations, cleanup, reopen, swap |
| [AppContext.tsx](src/contexts/AppContext.tsx) | 349 | Bill optimistic updates, edit mode, patch sync |
| [useDirectusSync.ts](src/hooks/useDirectusSync.ts) | 609 | Write queue, cancel/delete, conflict resolution |
| [useLocalStorage.ts](src/hooks/useLocalStorage.ts) | 32 | localStorage sync wrapper |
| [closedSessionArchive.ts](src/utils/closedSessionArchive.ts) | 43 | Closed session TTL archive |
| [sessionStorage.ts](src/utils/sessionStorage.ts) | 65 | Session cache read/write/remove |
| [directusBills.ts](src/services/directusBills.ts) | 189 | Bill create/patch/delete, berlin date utils |
| [OrderView.tsx](src/views/OrderView.tsx) | ~400 | Verify render-phase fix from prior analysis |

---

## Known Issues Verified

| Issue | Status | Finding |
|-------|--------|---------|
| Render-phase side effects in [OrderView.tsx:50-55](src/views/OrderView.tsx#L50-L55) | ✅ **Already fixed** | No side effects in render. Subcategory filter state was removed in commit 9f8ff4f |
| Seated table state uses both array and Set | ✅ **Confirmed, by design** | `seatedTablesArr` (array state) + `seatedTables` (memoized Set view). Array is source of truth. No bug. |
| Bill optimistic updates could race with query invalidation | ⚠️ **Confirmed — P0 bug found** | Two distinct race windows identified (see P0-1, P0-3 below) |

---

## Issues Found

### P0: Critical (breaks revenue or causes data loss)

---

#### P0-1: editingBillIndex is positional — shifts when poll updates cache
**Location**: [AppContext.tsx:260-284](src/contexts/AppContext.tsx#L260-L284)
**Severity**: P0 — silently patches wrong bill to Directus

```typescript
// enterBillEditMode stores a positional index
const enterBillEditMode = useCallback((billIndex: number) => {
  setBillSnapshot({ ...paidBills[billIndex] });
  setEditingBillIndex(billIndex);   // ← stored as index, not id
}, [paidBills]);

// exitBillEditMode reads paidBills[editingBillIndex] — array may have shifted
const exitBillEditMode = useCallback(() => {
  if (editingBillIndex !== null) {
    const bill = paidBills[editingBillIndex];  // ← wrong bill if array shifted
    if (bill?.directusId) {
      patchBill(bill.directusId, { added_to_pos: bill.addedToPOS ?? false });
      bill.items.forEach((item) => {
        if (item.directusId) patchBillItem(item.directusId, { crossed_qty: item.crossedQty ?? 0 });
      });
    }
  }
}, [editingBillIndex, paidBills, showToast]);
```

**Race window**: Bills are refetched every 5 seconds (`refetchInterval: isToday ? 5_000 : false`). Between `enterBillEditMode` and `exitBillEditMode`, the TanStack Query cache can be updated by:
1. Another device creating a bill (new entry appended — low risk since sorted by timestamp)
2. Another device deleting a bill (entry removed — all subsequent indices shift)
3. A failed create removing its optimistic entry (line 156 — removes by tempId)
4. `addPaidBill` inserting an optimistic entry (line 130 — appended to end — low risk)

**Concrete failure scenario**:
```
T0:   paidBills = [billA, billB]
T0:   User enters edit mode for billB (index 1)
T3s:  Poll: billA deleted on another device → paidBills = [billB]
T5s:  User exits edit mode → editingBillIndex=1 → paidBills[1] is undefined
      → No patch fires (bill?.directusId guard saves us here)
      BUT: billB's edit-mode changes are silently discarded without error
```

**Alternative worse scenario** (if a new bill was inserted before billB):
```
T0:   paidBills = [billA, billB]
T0:   User enters edit mode for billA (index 0), marks items as crossed in POS
T2s:  Poll: new billC (timestamp < billA) inserted → paidBills = [billC, billA, billB]
      (only happens with clock skew between devices — bills sorted by timestamp)
T5s:  User exits edit mode → editingBillIndex=0 → bill = paidBills[0] = billC
      → billC.directusId patched with billA's POS data ❌ SILENT WRONG PATCH
```

**Fix**: Store `directusId` instead of index in edit mode. Find by ID on exit.

```typescript
// Replace editingBillIndex: number | null with editingBillId: string | null
const enterBillEditMode = useCallback((billIndex: number) => {
  const bill = paidBills[billIndex];
  if (!bill?.directusId) return;  // can't edit a bill still resolving
  setBillSnapshot({ ...bill, items: bill.items.map(i => ({ ...i })) });
  setEditingBillId(bill.directusId);
}, [paidBills]);

const exitBillEditMode = useCallback(() => {
  if (editingBillId !== null) {
    const bill = paidBills.find((b) => b.directusId === editingBillId);
    if (!bill) {
      setEditingBillId(null); setBillSnapshot(null);
      return;
    }
    patchBill(bill.directusId, { added_to_pos: bill.addedToPOS ?? false });
    bill.items.forEach((item) => {
      if (item.directusId) patchBillItem(item.directusId, { crossed_qty: item.crossedQty ?? 0 });
    });
  }
  setEditingBillId(null);
  setBillSnapshot(null);
}, [editingBillId, paidBills, showToast]);
```

**Note**: All callers that use `editingBillIndex` as an index (`markBillAddedToPOS`, `removePaidBillItem`, `cancelBillEditMode`, `BillCard`) must be updated to use `editingBillId` + `paidBills.findIndex`.

---

#### P0-2: billSnapshot is a shallow copy — items share object references
**Location**: [AppContext.tsx:261](src/contexts/AppContext.tsx#L261)
**Severity**: P0 — `cancelBillEditMode` restore could contain mutated item references

```typescript
setBillSnapshot({ ...paidBills[billIndex] });  // ← shallow copy only
```

`bill.items` is an array of objects. The spread copies the array reference, but array elements (item objects) are shared between the snapshot and the live cache.

**In practice**: `removePaidBillItem` and `restorePaidBillItem` use `.map()` which creates new arrays and new item objects. They do NOT mutate in place. So the current code works correctly.

**But**: If any future mutation path (e.g. a new bill edit operation) modifies item objects in place instead of replacing via `.map()`, the snapshot would silently reflect those changes and `cancelBillEditMode` would fail to restore.

**Fix**: Deep clone items on snapshot creation:
```typescript
const enterBillEditMode = useCallback((billIndex: number) => {
  const bill = paidBills[billIndex];
  setBillSnapshot({ ...bill, items: bill.items.map(i => ({ ...i })) });
  setEditingBillIndex(billIndex);
}, [paidBills]);
```

---

#### P0-3: Retry-after-cancel race can silently delete a valid new bill
**Location**: [AppContext.tsx:295-300](src/contexts/AppContext.tsx#L295-L300)
**Severity**: P0 — bill disappears from Directus silently after retry

**Setup**: `failedBill.bill` retains the original `tempId`. `addPaidBill` uses `bill.tempId ?? crypto.randomUUID()` — it reuses the original tempId on retry.

**Race**:
```
T0:  Close table → addPaidBill(bill) → tempId="abc", create starts
T1:  Directus times out → setFailedBill({bill, tempId: "abc"})
T2:  User taps "Reopen table" → reopenLastClosed() → cancelBillByTempId("abc")
     → "abc" not yet in tempIdToDirectusId (write failed) → pendingCancellations.add("abc")
T3:  User taps "Retry" → handleRetryBill() → addPaidBill(failedBill.bill)
     → failedBill.bill.tempId = "abc" → addPaidBill reuses tempId "abc"
     → second create succeeds → line 137: pendingCancellations.has("abc") = true
     → newly created bill is DELETED from Directus ❌
     → table was successfully reopened, but the bill for the payment is gone
```

**Fix**: Clear `pendingCancellations` entry before retrying, OR generate a fresh tempId on retry:
```typescript
const handleRetryBill = useCallback(() => {
  if (!failedBill) return;
  setFailedBill(null);
  // Clear any stale cancel marker from a previous reopen, then retry
  pendingCancellations.current.delete(failedBill.tempId);
  // Fresh tempId to avoid any stale cancel markers
  addPaidBill({ ...failedBill.bill, tempId: undefined });
}, [failedBill, addPaidBill]);
```

---

### P1: High (blocks features or major UX degradation)

---

#### P1-1: archiveRef is 1-render stale in cleanupTable
**Location**: [TableContext.tsx:82-85](src/contexts/TableContext.tsx#L82-L85), [TableContext.tsx:309-339](src/contexts/TableContext.tsx#L309-L339)
**Severity**: P1 — closed session archive captures slightly stale state

```typescript
// archiveRef updated AFTER render via useEffect
const archiveRef = useRef({ orders, seatedTablesArr, sentBatches, gutscheinAmounts, markedBatches });
useEffect(() => {
  archiveRef.current = { ... };
}, [orders, seatedTablesArr, sentBatches, gutscheinAmounts, markedBatches]);

// cleanupTable reads archiveRef synchronously
const cleanupTable = useCallback((tableId: TableId, billTempId?: string) => {
  const snap = archiveRef.current;  // ← may be 1 render behind
  // ...
  saveClosedSession(session);       // saves stale state
});
```

**Concrete failure scenario** (extremely unlikely in practice):
```
T0:  User adds last item → setOrders fires → React schedules render
T0:  (same event batch) User taps Close Table → cleanupTable runs
     archiveRef.current = state from PREVIOUS render (before item was added)
     → archived session is missing the last item
     → Reopen Last Closed restores session without that item
```

In practice, CloseTable is in TicketView and OrderView is a different view — the user must navigate between them, which involves multiple renders. So archiveRef will always be current by the time cleanupTable is called through normal navigation.

**Fix** (safer pattern): Read directly from state refs instead of the archiveRef:
```typescript
// cleanupTable can use the same refs already maintained by useDirectusSync
const cleanupTable = useCallback((tableId: TableId, billTempId?: string) => {
  const key = String(tableId);
  const session: ArchivedSession = {
    tableId: key,
    closedAt: new Date().toISOString(),
    orders: ordersRef.current[key] ?? [],
    sentBatches: sentBatchesRef.current[key] ?? [],
    gutschein: gutscheinAmountsRef.current[key] ?? null,
    seated: seatedTablesArrRef.current.some((id) => String(id) === key),
    markedBatches: Array.from(markedBatchesRef.current[key] ?? new Set<number>()),
    billTempId,
  };
  // ...
});
```

But `ordersRef`/`sentBatchesRef` etc. live in `useDirectusSync`, not in `TableContext`. The cleanest solution is to pass them via the sync hook return value, or expose a `readCurrentSnapshot(tableId)` helper from the sync hook.

---

#### P1-2: Non-atomic multi-field state cleanup
**Location**: [TableContext.tsx:333-338](src/contexts/TableContext.tsx#L333-L338), [TableContext.tsx:347-356](src/contexts/TableContext.tsx#L347-L356), [TableContext.tsx:396-406](src/contexts/TableContext.tsx#L396-L406)
**Severity**: P1 — intermediate states visible to React during transition

Three operations fire 5 separate setState calls:

```typescript
// cleanupTable: 5 calls
setOrders((prev) => { const n = { ...prev }; delete n[key]; return n; });
setSeatedTablesArr((prev) => prev.filter((id) => String(id) !== key));
setSentBatches((prev) => { const n = { ...prev }; delete n[key]; return n; });
setGutscheinAmounts((prev) => { const n = { ...prev }; delete n[key]; return n; });
setMarkedBatches((prev) => { const n = { ...prev }; delete n[key]; return n; });
```

React 18 auto-batches all setState calls in any context (event handlers, timeouts, async code). So these WILL be batched into a single render in practice.

**However**: This guarantee breaks if `flushSync` is ever called (e.g. in tests or for a future animation), or if a re-render is triggered between these calls by a concurrent feature (React 18 concurrent mode). It also creates a conceptual "clean up all five fields for table X" operation that has no single point of failure — if any of the 5 calls throws, the table is partially cleaned.

**Fix** (best): Consolidate into a `useReducer` with a `CLOSE_TABLE` action. This also enables clean testing. See Refactor Candidates.

**Fix** (quick win): Document the React 18 batching dependency explicitly, add a comment.

---

#### P1-3: markBillAddedToPOS silently exits edit mode without syncing in-progress changes
**Location**: [AppContext.tsx:189-202](src/contexts/AppContext.tsx#L189-L202)
**Severity**: P1 — edit-mode item changes discarded without warning

```typescript
const markBillAddedToPOS = useCallback((billIndex: number) => {
  const updated = paidBills.map((b, i) =>
    i === billIndex ? { ...b, addedToPOS: true } : b
  );
  setCachedBills(updated);
  setEditingBillIndex(null);  // ← forcefully exits edit mode
  setBillSnapshot(null);       // ← discards snapshot
  // ...                        // ← does NOT call exitBillEditMode()
}, [paidBills, setCachedBills, showToast]);
```

If a user is mid-edit (e.g. in the process of crossing items one by one in edit mode) and calls `markBillAddedToPOS` (which exits edit mode), `exitBillEditMode` is never called. The Directus patch that syncs the full edit-mode state (all `crossed_qty` values) is never fired.

The `setCachedBills` call does preserve the current `paidBills` state (including any mutations made during edit mode), so the React cache is correct. But those changes are **not persisted to Directus** — no `patchBillItem` calls fire for items already modified in this edit session.

**Fix**: Route through `exitBillEditMode()` instead of clearing edit state directly:
```typescript
const markBillAddedToPOS = useCallback((billIndex: number) => {
  const updated = paidBills.map((b, i) =>
    i === billIndex ? { ...b, addedToPOS: true } : b
  );
  setCachedBills(updated);
  if (editingBillIndex === billIndex) {
    exitBillEditMode();  // syncs in-progress item changes to Directus
  } else {
    setEditingBillIndex(null);
    setBillSnapshot(null);
  }
  // ...
}, [paidBills, setCachedBills, editingBillIndex, exitBillEditMode, showToast]);
```

**Note**: With P0-1 fix (editingBillId), this becomes a check on `editingBillId === bill.directusId`.

---

#### P1-4: resolveConflict setState → scheduleWrite uses a 0ms defer that may race with the merge-effect
**Location**: [useDirectusSync.ts:586-588](src/hooks/useDirectusSync.ts#L586-L588)
**Severity**: P1 — write after conflict resolution may race with the next poll

```typescript
// Persist after refs are synced (defer until next tick to ensure useEffects have run)
setTimeout(() => {
  scheduleWrite(tableIdParsed);
}, 0);
```

The comment acknowledges that `scheduleWrite` reads from `*Ref.current` values, so the defer ensures `useEffect` ref sync fires first. But if the poll fires in the same microtask queue window (which it can — `useQuery` callbacks are async), the merge effect (lines 175-417) could run before `scheduleWrite` and overwrite the resolved state.

**Scenario**:
```
T0:  Conflict resolved → 5 setState calls fire → React re-render scheduled
T0+: setTimeout(scheduleWrite, 0) queued
T0+: TanStack Query onSuccess fires (poll just completed) → merge useEffect queued
T1:  React renders with resolved state
T1+: Merge effect runs (remoteSessions just updated) → overwrites resolved state ❌
T1+: scheduleWrite fires → saves the overwritten (wrong) state to Directus
```

`syncPaused.current = false` is set in `useEffect` watching `conflicts`. That effect fires AFTER the render that sets `conflicts = []` (from the `setConflicts` filter in `resolveConflict`). So there's a window between `resolveConflict` returning and `syncPaused` being cleared where the merge effect CAN run if remoteSessions updates.

Actually — looking at the code again:
- `resolveConflict` calls `setConflicts((prev) => prev.filter(...))` but does NOT call `syncPaused.current = false` itself
- `syncPaused` is set to false in a separate useEffect (lines 592-597) that watches `conflicts.length`
- `syncPaused.current = true` was set when conflict was detected and it guards the merge effect: `if (syncPaused.current) return;`
- So the merge is blocked until `syncPaused.current = false` which happens AFTER the conflicts-cleared render
- The `setTimeout(scheduleWrite, 0)` fires in the same macrotask queue as the render, before the next poll interval

This is actually safe as designed. The `syncPaused` guard prevents the merge from running until after the conflict is cleared. Minor note: this sequence is fragile and the comment could be clearer.

**Mark as P2** — no bug found, but sequence is non-obvious.

---

#### P1-5: useLocalStorage hook not used for table state — cache consistency depends on manual writes
**Location**: [sessionStorage.ts](src/utils/sessionStorage.ts), [useDirectusSync.ts:151](src/hooks/useDirectusSync.ts#L151)
**Severity**: P1 — two different cache write paths with different semantics

There are two localStorage write mechanisms in this codebase:

1. **`useLocalStorage` hook**: Writes synchronously on every `setState` call (inside the updater). Used for `authToken`.

2. **`writeSessionToCache` / `updateDirtyLocalSession`**: Writes explicitly in `useDirectusSync` at specific points:
   - On every state dependency change (via the `useEffect` at line 134-154 of `useDirectusSync`)
   - After successful Directus writes (line 472)
   - On `persistLocalSnapshot()` calls (inside `scheduleWrite` and `writeToDirectus`)

**Implication**: Table session localStorage writes are NOT synchronous with React state updates. There is a window — between React re-render and the `useEffect` firing — where React state is ahead of the localStorage cache. If the browser tab crashes or is force-closed in this window, the last state update is lost.

**Size of window**: Typically < 16ms (one frame). Very small in practice.

**Mitigation already in place**: `markSessionDirty` is called in `scheduleWrite` BEFORE the debounce fires, using `persistLocalSnapshot`. This means the dirty marker + local snapshot lands in localStorage fast (in the same macrotask as the scheduleWrite call). So the real risk is: a crash in the < 16ms between setState and scheduleWrite.

**Verdict**: Acceptable for this use case. The 16ms window is negligible for a restaurant POS. No fix required, but document the invariant.

---

### P2: Technical Debt

---

#### P2-1: writeSessionToCache uses read-modify-write without a lock
**Location**: [sessionStorage.ts:33-41](src/utils/sessionStorage.ts#L33-L41)
**Severity**: P2 — no real risk in single-threaded JS, but pattern is fragile

```typescript
export function writeSessionToCache(tableId: string, session: CachedSession): void {
  const cache = readSessionCache();   // read entire cache
  cache[tableId] = session;           // mutate
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cache));  // write entire cache
}
```

JavaScript is single-threaded; there is no actual race. But:
1. Two rapid calls to `writeSessionToCache` for different tables will each read the full cache, update their own key, and write back. Since calls execute sequentially (not concurrently), each call overwrites the result of the previous one — which is correct, since call 2 reads the result written by call 1.
2. This only breaks if localStorage writes were async (they're not) or if SharedWorkers were involved (they're not here).

**No action required**, but a module-scoped cache variable (`let _cache: SessionCache | null = null`) with invalidation would be faster and clearer.

---

#### P2-2: Closed session archive does not validate schema on load
**Location**: [closedSessionArchive.ts:25-37](src/utils/closedSessionArchive.ts#L25-L37)
**Severity**: P2 — malformed localStorage causes a silent null return

```typescript
export function loadClosedSession(): ArchivedSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const session: ArchivedSession = JSON.parse(raw);  // no validation
    if (Date.now() - new Date(session.closedAt).getTime() > TTL_MS) { ... }
    return session;
  } catch {
    return null;  // parse error → silent null
  }
}
```

If localStorage contains a malformed session (partial write, format change from older app version), `JSON.parse` succeeds but the returned object may be missing required fields. The TTL check accesses `session.closedAt` — if missing, `new Date(undefined)` returns `Invalid Date`, `getTime()` returns `NaN`, and the TTL check is always false (NaN > number = false), so the malformed session is returned.

`reopenLastClosed` then iterates over `session.orders`, `session.sentBatches`, etc. — if these are undefined, it silently skips them (optional chaining + length checks). The table is "reopened" but with empty state.

**Fix**: Add a lightweight schema check on load:
```typescript
function isValidSession(s: unknown): s is ArchivedSession {
  if (!s || typeof s !== "object") return false;
  const obj = s as Record<string, unknown>;
  return typeof obj.tableId === "string"
    && typeof obj.closedAt === "string"
    && Array.isArray(obj.orders)
    && Array.isArray(obj.sentBatches);
}
```

---

#### P2-3: seatedTables dual representation adds cognitive overhead
**Location**: [TableContext.tsx:72-77](src/contexts/TableContext.tsx#L72-L77)
**Severity**: P2 — works correctly, adds complexity

```typescript
const [seatedTablesArr, setSeatedTablesArr] = useState<TableId[]>([]);
// ...
const seatedTables = useMemo(() => new Set<TableId>(seatedTablesArr), [seatedTablesArr]);
```

Two representations of the same fact:
- Internal mutations always use `setSeatedTablesArr` (array)
- External interface exposes `seatedTables` (Set)
- `useDirectusSync` takes `seatedTablesArr` as a prop and also exposes `setSeatedTablesArr`

This is correct and the design is intentional (arrays serialize, Sets don't), but creates confusion about which to use where. Any new code reading `seatedTablesArr` instead of `seatedTables` would get a different type (array vs Set), and vice versa. The `useDirectusSync` receives `seatedTablesArr` for serialization but that's not obvious from the call site.

**No action required** per prior analysis note in REVIEW_PLAN.md. Document the invariant in a comment.

---

#### P2-4: paidBills migration runs on every render when any bill lacks posId
**Location**: [AppContext.tsx:102-108](src/contexts/AppContext.tsx#L102-L108)
**Severity**: P2 — unnecessary compute on bill views

```typescript
const paidBills = useMemo(() => {
  if (rawPaidBills.length === 0) return rawPaidBills;
  const needsMigration = rawPaidBills.some((bill) =>
    bill.items.some((item) => !item.posId)  // ← scans ALL items on every rawPaidBills change
  );
  return needsMigration ? migratePaidBills(rawPaidBills) : rawPaidBills;
}, [rawPaidBills]);
```

`rawPaidBills` changes every 5 seconds (poll). If any bill item lacks `posId`, every poll triggers `migratePaidBills`. This is a `O(bills × items)` scan on every refetch.

For a restaurant with hundreds of bills and many items each, this runs constantly during the Daily Sales view (which always shows today's refetching bills). Probably acceptable at current scale.

**Fix** (if profiling shows bottleneck): Run migration once at startup, persist migrated bills back to Directus. After migration, no bills will lack `posId`, so the scan returns false immediately. Alternatively, add a `hasMigratedBills` flag to localStorage.

---

## Quick Wins (< 30 min)

| # | Fix | Location | Time | Notes |
|---|-----|----------|------|-------|
| QW-1 | Deep clone `items` in `billSnapshot` | [AppContext.tsx:261](src/contexts/AppContext.tsx#L261) | 2 min | Prevents future shallow-copy bugs |
| QW-2 | Validate `ArchivedSession` schema on load | [closedSessionArchive.ts:25](src/utils/closedSessionArchive.ts#L25) | 10 min | Simple type guard |
| QW-3 | Clear `pendingCancellations` before retry | [AppContext.tsx:295-300](src/contexts/AppContext.tsx#L295-L300) | 5 min | Fixes P0-3 |
| QW-4 | Add comment on React 18 batching dependency | [TableContext.tsx:333](src/contexts/TableContext.tsx#L333) | 1 min | Documents the invariant |
| QW-5 | Document seatedTablesArr / seatedTables contract | [TableContext.tsx:72](src/contexts/TableContext.tsx#L72) | 2 min | Prevents future misuse |

---

## Refactor Candidates

### RC-1: Replace editingBillIndex with editingBillId (fixes P0-1)
**Files**: [AppContext.tsx](src/contexts/AppContext.tsx), [BillCard.tsx](src/components/BillCard.tsx), [DailySalesView.tsx](src/views/DailySalesView.tsx)
**Effort**: ~2 hours
**Benefit**: Eliminates positional index race; code becomes positionally stable

Steps:
1. Replace `editingBillIndex: number | null` with `editingBillId: string | null` in state + interface
2. Update `enterBillEditMode` to store `bill.directusId`
3. Update `exitBillEditMode` + `cancelBillEditMode` to find by ID
4. Update all callers that pass `billIndex` or use `editingBillIndex` for array access

---

### RC-2: Extract table state into useReducer (fixes P1-2)
**Files**: [TableContext.tsx](src/contexts/TableContext.tsx)
**Effort**: 3-4 hours
**Benefit**: Atomic transitions, single action dispatch, testable reducer logic

```typescript
type TableAction =
  | { type: "CLOSE_TABLE"; tableId: string }
  | { type: "REOPEN_TABLE"; session: ArchivedSession }
  | { type: "SWAP_TABLES"; from: string; to: string }
  | { type: "SEND_ORDER"; tableId: string; batch: Batch }
  | // ... other mutations

function tableReducer(state: TableState, action: TableAction): TableState { ... }
```

All multi-field updates become single `dispatch()` calls. `useDirectusSync` receives the full state snapshot via a single derived value.

---

### RC-3: Route bill edit exit through a single function (fixes P1-3)
**Files**: [AppContext.tsx](src/contexts/AppContext.tsx)
**Effort**: 30 min
**Benefit**: Centralised exit logic, no silent Directus sync bypasses

Create a single `commitBillEdit(action: "exit" | "cancel" | "pos")` function that handles all exit paths consistently. Replaces `exitBillEditMode`, `cancelBillEditMode`, and the manual state clears in `markBillAddedToPOS`/`restoreBillFromPOS`.

---

## Test Gaps

| Scenario | Risk | Priority |
|----------|------|----------|
| Enter edit mode → remote poll adds new bill → exit edit mode (verify correct bill patched) | P0-1 | P0 |
| Close table → Directus fails → reopen table → retry bill (verify bill not deleted) | P0-3 | P0 |
| Close table with unsaved last item (verify archive captures it) | P1-1 | P1 |
| `cancelBillEditMode` with in-place-mutated items (verify snapshot restore is clean) | P0-2 | P1 |
| Load malformed `lastClosedSession` from localStorage (verify graceful degradation) | P2-2 | P2 |
| Rapid `removePaidBillItem` calls (verify no double-decrement) | — | P1 |

---

## Automation Opportunities

- **ESLint**: Lint for `useCallback` deps that include array index derived from state (pattern: `const x = arr[index]` inside callback with `index` from state)
- **ESLint**: Warn on `{ ...obj }` shallow copy of objects with known nested arrays (requires type information, TSLint plugin)
- **Unit test**: `closedSessionArchive.loadClosedSession` with malformed data
- **Unit test**: `cleanupTable` + `reopenLastClosed` round-trip atomicity

---

## State Consistency Summary

### How localStorage ↔ React ↔ Directus Stays Consistent

```
User action
    │
    ▼
setState (React state updated immediately)
    │
    ├──▶ useEffect (134-154): writes dirty marker + snapshot to localStorage
    │    (fires after render, ~16ms delay — acceptable window)
    │
    ├──▶ scheduleWrite (debounced 500ms): marks dirty immediately,
    │    then fires writeToDirectus after 500ms
    │         │
    │         └──▶ upsertSession → Directus
    │                   │
    │                   └──▶ on success: writeSessionToCache + clearDirty
    │
    └──▶ Poll every 2s: mergeRemote() — only updates React if changed
         (respects 3s grace period for locally-owned tables)
```

**Key invariant**: localStorage is always written before Directus. If Directus write fails, localStorage still has the latest state and the dirty marker survives reload, triggering a retry on reconnect.

**Known drift scenario**: Crash in the ~16ms between setState and the useEffect's localStorage write. The state is lost unless a dirty marker already exists from a prior action.

---

## Comparison to Session 1 Findings

| Aspect | Session 1 (Sync) | Session 2 (State) |
|--------|-----------------|-------------------|
| Scope | Write queue, conflict detection, polling | Bill edit mode, optimistic updates, cleanup |
| P0 issues found | 4 | 3 |
| Root cause pattern | Stale ref reads, positional indices | Positional array indices, shallow copies |
| Common theme | Both sessions reveal positional-index fragility: `marked_batches` (S1) + `editingBillIndex` (S2) |
| Structural risk | Concurrent multi-device writes | Concurrent poll + user edit |

**Recommendation**: Both P0-1 from Session 1 (stale ref race) and P0-1 here (editingBillIndex) stem from the same root: using stale/positional handles instead of stable IDs. A broader audit of "any index or ref used across an async boundary" would catch similar patterns proactively.

---

**Next Session**: [Session 3 — Payment Flow Integrity](REVIEW_PLAN.md) — SplitContext + billFactory + useTableClose
