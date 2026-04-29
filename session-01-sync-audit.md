# Session 1: Sync Correctness Audit

**Date**: 2026-04-29
**Duration**: 90 min
**Files Reviewed**:
- [useDirectusSync.ts](src/hooks/useDirectusSync.ts)
- [directusSessions.ts](src/services/directusSessions.ts)
- [conflictDetection.ts](src/utils/conflictDetection.ts)
- [sessionStorage.ts](src/utils/sessionStorage.ts)
- [TableContext.tsx](src/contexts/TableContext.tsx)
- [appConfig.ts](src/config/appConfig.ts)

---

## Executive Summary

The sync infrastructure is **pragmatically functional for single-device use** but has **4 critical correctness issues** that can cause data loss or corruption in multi-device scenarios. The ref-based debounce pattern and positional batch indices are the highest-risk areas.

**Risk Level**: 🔴 **HIGH** for multi-device production use
**Recommendation**: Fix P0 issues before deploying to multiple devices

---

## Critical Issues (P0) — Fix Immediately

### 1. ❌ Stale Ref Race in Debounced Writes
**Severity**: P0 (data loss)
**Location**: [useDirectusSync.ts:179-220](src/hooks/useDirectusSync.ts#L179-L220)

**Problem**: `scheduleWrite` captures refs at call time (T0) but writes them 500ms later. If a remote poll updates state during the debounce window, the stale snapshot overwrites newer remote data.

**Scenario**:
```
T0ms:    User adds item → scheduleWrite() called → captures ordersRef (state A)
T450ms:  Remote poll receives update from Device B → setState (state B)
T500ms:  Debounce timeout fires → writes state A to Directus (overwrites B ❌)
```

**Impact**: Multi-device edits can be lost if they arrive during another device's debounce window.

**Fix**:
```typescript
// Option 1: Capture state inside timeout (not refs)
writeTimers.current[key] = setTimeout(async () => {
  const session = {
    table_id: key,
    seated: seatedTablesArr.some((id) => String(id) === key),  // Use state, not ref
    gutschein: gutscheinAmounts[key] ?? null,
    orders: orders[key] ?? [],
    sent_batches: sentBatches[key] ?? [],
    marked_batches: Array.from(markedBatches[key] ?? new Set<number>()),
  };
  // ... rest of write logic
}, DEBOUNCE_DELAY_MS);

// Option 2: Use functional setState updates everywhere to avoid refs
// (More invasive refactor)
```

**Test**: Two devices edit the same table 400ms apart; verify both edits persist.

---

### 2. ❌ Ref Sync Race in Conflict Resolution
**Severity**: P0 (state corruption)
**Location**: [useDirectusSync.ts:260-287](src/hooks/useDirectusSync.ts#L260-L287)

**Problem**: `resolveConflict` updates refs immediately (lines 262-270) but calls setState later (lines 273-284). If a remote poll happens in this gap, it reads the new refs but compares against old state, causing duplicate entries or lost updates.

**Scenario**:
```
T0:   resolveConflict() updates ordersRef to merged state
T1:   Remote poll useEffect fires → reads ordersRef (merged) but orders state (old)
T2:   Poll creates newOrders with duplicate entries
T3:   resolveConflict() calls setOrders (merged) → clobbered by T2
```

**Impact**: Conflict resolution can create duplicate orders or silently revert to pre-merge state.

**Fix**:
```typescript
const resolveConflict = useCallback((
  conflict: SessionConflict,
  resolution: "local" | "remote" | "merge"
) => {
  const { tableId } = conflict;
  const key = String(tableId);

  const resolvedSession: CachedSession =
    resolution === "local" ? conflict.local
    : resolution === "remote" ? conflict.remote
    : mergeSessions(conflict.local, conflict.remote);

  const tableIdParsed = parseTableId(key);

  // Apply resolved session to state FIRST
  setOrders((prev) => ({ ...prev, [key]: resolvedSession.orders }));
  setSeatedTablesArr((prev) => {
    const s = new Set(prev);
    if (resolvedSession.seated) s.add(tableIdParsed);
    else s.delete(tableIdParsed);
    return Array.from(s);
  });
  setSentBatches((prev) => ({ ...prev, [key]: resolvedSession.sent_batches }));
  setGutscheinAmounts((prev) => ({ ...prev, [key]: resolvedSession.gutschein ?? 0 }));
  setMarkedBatches((prev) => ({ ...prev, [key]: new Set(resolvedSession.marked_batches) }));

  // Sync refs in a useEffect (will run after render, when state is committed)
  // OR: Remove manual ref updates entirely — the ref-syncing useEffects (lines 40-44)
  // will update refs automatically after setState completes

  // Persist: schedule write AFTER state update
  scheduleWrite(tableIdParsed);

  // Remove from conflicts queue
  setConflicts((prev) => prev.filter((c) => c.tableId !== tableId));
}, [scheduleWrite, setOrders, setSeatedTablesArr, setSentBatches, setGutscheinAmounts, setMarkedBatches]);
```

**Test**: Trigger conflict resolution while polling is active; verify no duplicate orders appear.

---

### 3. ❌ Marked Batches Use Positional Indices (Confirmed from REVIEW_PLAN.md)
**Severity**: P0 (silent data loss)
**Location**: [conflictDetection.ts:121-124](src/utils/conflictDetection.ts#L121-L124)

**Problem**: `marked_batches` stores integer indices. When batches from two devices are merged and re-sorted by timestamp, all indices shift. Stored marks now point to wrong batches (or become out-of-bounds).

**Example**:
```
Device A: sent_batches = [b0(t=1), b1(t=3)], marked_batches = [1] → b1 marked ✓
Device B: sent_batches = [b0(t=1), b2(t=2)], marked_batches = [0] → b0 marked ✓

After merge:
  sent_batches = [b0(t=1), b2(t=2), b1(t=3)]  (sorted by timestamp)
  marked_batches = [0, 1]  (union of both)
  Result: b0 ✓, b2 ✗ (wrong!), b1 ✗ (silently unmarked!)
```

**Impact**: Kitchen staff lose track of which orders are delivered. Revenue loss if items are re-sent or forgotten.

**Fix**: Replace integer indices with batch timestamps (unique identifier).

**Migration Required**:
1. Add Directus migration to change `marked_batches` column type from `json` (array of ints) to `json` (array of strings)
2. Update all read/write code to use timestamps instead of indices
3. Add migration script to convert existing data (if any production data exists)

**Code Changes**:
```typescript
// types/index.ts
export interface TableSession {
  // ...
  marked_batches: string[];  // ISO timestamps, not indices
}

// useDirectusSync.ts:190
marked_batches: Array.from(markedBatchesRef.current[key] ?? new Set<string>()),

// TableContext.tsx:299-307
const toggleMarkBatch = useCallback((tableId: TableId, batchTimestamp: string) => {
  setMarkedBatches((prev) => {
    const tableMarks = prev[String(tableId)] || new Set<string>();
    const next = new Set(tableMarks);
    if (next.has(batchTimestamp)) next.delete(batchTimestamp);
    else next.add(batchTimestamp);
    return { ...prev, [String(tableId)]: next };
  });
  scheduleWrite(tableId);
}, [scheduleWrite]);

// Update all call sites to pass batch.timestamp instead of index
```

**Test**: Merge two devices with interleaved batch timestamps; verify marks persist on correct batches.

---

### 4. ❌ Table Swap Writes Can Race
**Severity**: P0 (partial swap)
**Location**: [TableContext.tsx:381-400](src/contexts/TableContext.tsx#L381-L400)

**Problem**: `swapTables` updates all state synchronously (lines 385-395) but schedules two independent debounced writes (lines 398-399). If a remote poll arrives between the two timer fires, one table's swapped state might be overwritten.

**Scenario**:
```
T0:     swapTables(1, 2) → updates local state for both tables
T0+1ms: scheduleWrite(1) → captures refs for table 1 (swapped state)
T0+2ms: scheduleWrite(2) → captures refs for table 2 (swapped state)
T450ms: Remote poll overwrites table 2 with remote data (pre-swap)
T500ms: Table 1 write fires → Directus has table 1 swapped ✓
T502ms: Table 2 write fires → Directus has table 2 swapped ✓
        BUT: If remote poll at T450 re-synced table 2, user sees partial swap locally
```

**Impact**: One table appears swapped, the other doesn't. Confusing UX, potential order sent to wrong table.

**Fix**: Pause sync during swap, or use a transaction-like pattern.

```typescript
const swapTables = useCallback((fromId: TableId, toId: TableId) => {
  const fk = String(fromId);
  const tk = String(toId);

  // Pause remote sync briefly (if we add a syncPaused mechanism)
  // OR: Mark both tables as "locally owned" by setting lastWriteTime to now
  lastWriteTime.current[fk] = Date.now();
  lastWriteTime.current[tk] = Date.now();

  // Update state atomically
  setOrders((prev) => swapTableState(prev, fk, tk));
  setSentBatches((prev) => swapTableState(prev, fk, tk));
  setMarkedBatches((prev) => swapTableState(prev, fk, tk));
  setGutscheinAmounts((prev) => swapTableState(prev, fk, tk));
  setSeatedTablesArr((prev) => {
    const s = new Set<TableId>(prev);
    const fromSeated = s.has(fromId);
    const toSeated = s.has(toId);
    if (toSeated) s.add(fromId); else s.delete(fromId);
    if (fromSeated) s.add(toId); else s.delete(toId);
    return Array.from(s);
  });

  showToast(`Table ${fromId} ⇄ Table ${toId}`);

  // Schedule writes immediately (no debounce, or very short)
  // Write both tables in the same API call (add bulk upsert endpoint)
  // OR: Accept that swap has a race window and document it
  scheduleWrite(fromId);
  scheduleWrite(toId);
}, [showToast, scheduleWrite]);
```

**Better Fix**: Add `bulkUpsertSessions` endpoint to Directus to write both tables atomically.

**Test**: Swap tables while another device is polling; verify both tables fully swapped on all devices.

---

## High Priority Issues (P1) — Fix Within Sprint

### 5. ⚠️ Grace Period Extends on Retry
**Severity**: P1 (blocks sync too long)
**Location**: [useDirectusSync.ts:209-212](src/hooks/useDirectusSync.ts#L209-L212)

**Problem**: On write failure, `lastWriteTime` is updated (line 211), extending the grace period by 500ms for each retry. After 3 retries, the grace period becomes 3000 + 1500 = 4500ms.

**Impact**: Remote updates blocked for 1.5 seconds longer than intended. In multi-device scenarios, other devices' changes are delayed.

**Fix**:
```typescript
// Don't update lastWriteTime on retry — keep it at original write time
if (attempts < MAX_RETRIES) {
  if (attempts === 1) showToast("Table state not saved - retrying");
  // lastWriteTime.current[key] = Date.now(); ❌ Remove this line
  scheduleWrite(tableId);
}
```

---

### 6. ⚠️ Conflict Detection Skipped for Locally Owned Tables
**Severity**: P1 (misses realistic conflicts)
**Location**: [useDirectusSync.ts:123-125](src/hooks/useDirectusSync.ts#L123-L125)

**Problem**: Tables with pending writes (or written in last 3 seconds) are excluded from conflict detection. If a device goes offline for 5 minutes while editing a table, then comes back online, no conflict is detected even if another device edited the same table.

**Impact**: Last-write-wins instead of prompting user to resolve, potentially losing work.

**Fix**: Track "last read from remote" timestamp separately from "last write" timestamp. Only skip conflict detection if table was written to **after** going offline.

```typescript
// Add new ref
const lastRemoteReadTime = useRef<Record<string, number>>({});

// Update on every remote read
useEffect(() => {
  if (!remoteSessions) return;
  remoteSessions.forEach((s) => {
    lastRemoteReadTime.current[s.table_id] = Date.now();
  });
  // ... rest of merge logic
}, [remoteSessions]);

// In conflict detection
if (wasOffline.current) {
  const unownedCache = Object.fromEntries(
    Object.entries(localCache).filter(([key]) => {
      // Only skip conflict detection if table was written AFTER last remote sync
      const lastWrite = lastWriteTime.current[key] ?? 0;
      const lastRead = lastRemoteReadTime.current[key] ?? 0;
      return lastWrite <= lastRead; // Include tables written before going offline
    })
  );
  // ...
}
```

---

### 7. ⚠️ Write Failure Leaves User in Limbo
**Severity**: P1 (data loss risk)
**Location**: [useDirectusSync.ts:213-217](src/hooks/useDirectusSync.ts#L213-L217)

**Problem**: After MAX_RETRIES failures, toast shows "Table state not saved" but user can continue editing. LocalStorage shows their edits, but Directus never gets them. If device crashes, data is lost.

**Impact**: Silent data loss if network issue persists or device fails.

**Fix**: Add visual indicator (banner) when writes are failing. Disable editing until sync resumes.

```typescript
// Add state
const [writeFailures, setWriteFailures] = useState<Set<string>>(new Set());

// In catch block
if (attempts >= MAX_RETRIES) {
  showToast("Table state not saved - check network");
  setWriteFailures((prev) => new Set(prev).add(key));
  delete retryCounts.current[key];
  pendingWrites.current.delete(key);
}

// On successful write
setWriteFailures((prev) => {
  const next = new Set(prev);
  next.delete(key);
  return next;
});

// Expose writeFailures in return value, display banner in UI
```

---

### 8. ⚠️ Order Merge Can Violate sentQty Invariant
**Severity**: P1 (data corruption)
**Location**: [conflictDetection.ts:101-110](src/utils/conflictDetection.ts#L101-L110)

**Problem**: When merging orders, qty and sentQty are summed. If both devices independently sent the same item, merged `sentQty > qty` is possible.

**Example**:
```
Device A: item X, qty=3, sentQty=2
Device B: item X, qty=3, sentQty=2
Merged:   item X, qty=6, sentQty=4 ✓ (6 total, 4 sent, 2 unsent)

But if both devices sent the SAME 2 items (not different ones):
  Actual kitchen received: 2 items (not 4)
  Bill shows: 4 items sent ❌
```

**Impact**: Overbilling customers or confusing batch tracking.

**Fix**: Order merge should be more conservative. Options:
1. **Max, not sum**: `sentQty = Math.max(a.sentQty, b.sentQty)` (assumes devices are in sync)
2. **Prompt user**: Show conflict modal for items with divergent sentQty
3. **Track batches, not sentQty**: Use batch membership as source of truth (requires refactor)

**Recommendation**: Option 2 (prompt user) for now.

---

### 9. ⚠️ Batch Deduplication Assumes Unique Timestamps
**Severity**: P1 (silent data loss)
**Location**: [conflictDetection.ts:113-119](src/utils/conflictDetection.ts#L113-L119)

**Problem**: Batch merge deduplicates by timestamp. If two devices send batches at the same millisecond, one is silently dropped.

**Impact**: Kitchen misses orders, revenue loss.

**Fix**: Deduplicate by content, not timestamp.

```typescript
const batchMap = new Map<string, Batch>();
[...local.sent_batches, ...remote.sent_batches].forEach((b) => {
  // Use content hash as key (timestamp + sorted item IDs)
  const key = `${b.timestamp}-${b.items.map(i => i.id).sort().join(',')}`;
  if (!batchMap.has(key)) batchMap.set(key, b);
});
```

---

### 10. ⚠️ sendOrder Reads Stale ordersRef
**Severity**: P1 (minor correctness issue)
**Location**: [TableContext.tsx:224-245](src/contexts/TableContext.tsx#L224-L245)

**Problem**: `sendOrder` reads `ordersRef.current` (line 225) which may be stale if a remote poll updated orders just before this call.

**Impact**: Rare edge case where sent batch doesn't include a just-added remote item.

**Fix**: Read from state parameter in functional update.

```typescript
const sendOrder = useCallback((tableId: TableId) => {
  setOrders((prevOrders) => {
    const current = prevOrders[String(tableId)] || [];
    const hasUnsent = current.some((o: OrderItem) => o.qty - (o.sentQty || 0) > 0);
    if (!hasUnsent) return prevOrders;

    const batchItems = current
      .filter((o: OrderItem) => o.qty - (o.sentQty || 0) > 0)
      .map((o: OrderItem) => ({ ...o, qty: o.qty - (o.sentQty || 0) }));

    const batch: Batch = { timestamp: new Date().toISOString(), items: batchItems };

    setSentBatches((prev) => ({
      ...prev,
      [String(tableId)]: [...(prev[String(tableId)] || []), batch],
    }));

    return {
      ...prevOrders,
      [String(tableId)]: (prevOrders[String(tableId)] || []).map((o: OrderItem) => ({ ...o, sentQty: o.qty })),
    };
  });
  showToast("Order sent!");
  scheduleWrite(tableId);
}, [showToast, scheduleWrite]);
```

---

### 11. ⚠️ cleanupTable Archives Before Checking Success
**Severity**: P1 (data loss risk)
**Location**: [TableContext.tsx:309-331](src/contexts/TableContext.tsx#L309-L331)

**Problem**: Archives session to localStorage (line 322), then clears state (lines 325-330). If archiving fails (localStorage full), state is still cleared and unrecoverable.

**Impact**: Rare but catastrophic if it happens during a busy shift.

**Fix**:
```typescript
try {
  saveClosedSession(session);
  setLastClosedSession(session);
} catch (e) {
  console.error("Failed to archive session:", e);
  showToast("Failed to close table - try again");
  return; // Abort cleanup
}
// ... proceed with clearing state
```

---

### 12. ⚠️ Missing Cleanup on Unmount
**Severity**: P1 (React warnings)
**Location**: [useDirectusSync.ts:54-56](src/hooks/useDirectusSync.ts#L54-L56)

**Problem**: Cleanup effect clears timers but doesn't prevent in-flight writes from calling setState after unmount.

**Impact**: React console warnings, potential crashes in dev mode.

**Fix**:
```typescript
const isMounted = useRef(true);

useEffect(() => {
  return () => {
    isMounted.current = false;
    Object.values(writeTimers.current).forEach(clearTimeout);
  };
}, []);

// In async write callback (line 210, 214)
if (!isMounted.current) return;
showToast("...");
```

---

## Technical Debt (P2) — Optimize When Proven Bottleneck

### 13. 📝 Inefficient Full State Merge on Every Poll
**Severity**: P2 (performance)
**Location**: [useDirectusSync.ts:150-174](src/hooks/useDirectusSync.ts#L150-L174)

**Problem**: Every 2-second poll recalculates entire state for all tables, even if nothing changed. Triggers 5 setState calls per poll (orders, seated, batches, gutschein, marked).

**Impact**: Unnecessary re-renders, wasted CPU on large restaurants (50+ tables).

**Fix**: Add shallow equality checks before setState.

```typescript
const ordersChanged = JSON.stringify(newOrders) !== JSON.stringify(ordersRef.current);
if (ordersChanged) setOrders(newOrders);
// ... repeat for each state slice
```

---

### 14. 📝 allKeys Collection is Expensive
**Severity**: P2 (performance)
**Location**: [useDirectusSync.ts:135-142](src/hooks/useDirectusSync.ts#L135-L142)

**Problem**: Builds Set from 5 sources (remote tables + 4 local state slices) every poll.

**Fix**: Maintain cached "active tables" set, updated on state changes.

---

### 15. 📝 No Validation of Cached Data
**Severity**: P2 (robustness)
**Location**: [sessionStorage.ts:19-28](src/utils/sessionStorage.ts#L19-L28)

**Problem**: `readSessionCache` parses JSON but doesn't validate structure. Corrupted localStorage crashes app on startup.

**Fix**: Add zod schema validation.

```typescript
import { z } from 'zod';

const cachedSessionSchema = z.object({
  table_id: z.string(),
  seated: z.boolean(),
  gutschein: z.number().nullable(),
  orders: z.array(z.any()), // Define full OrderItem schema
  sent_batches: z.array(z.any()),
  marked_batches: z.array(z.number()),
});

export function readSessionCache(): SessionCache {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);

    // Validate each session
    const validated: SessionCache = {};
    for (const [key, session] of Object.entries(parsed)) {
      const result = cachedSessionSchema.safeParse(session);
      if (result.success) {
        validated[key] = result.data;
      } else {
        console.warn(`Invalid cached session for ${key}, skipping:`, result.error);
      }
    }
    return validated;
  } catch (e) {
    console.error("Failed to read session cache:", e);
    return {};
  }
}
```

---

### 16. 📝 writeSessionToCache is Not Atomic
**Severity**: P2 (rare race condition)
**Location**: [sessionStorage.ts:33-41](src/utils/sessionStorage.ts#L33-L41)

**Problem**: Read-modify-write pattern (lines 35-37) has race window if called concurrently.

**Fix**: Debounce cache writes globally (one write per tick).

---

## Quick Wins (<30 min)

### ✅ 1. Add isMounted Guard (10 min)
[useDirectusSync.ts:54-56](src/hooks/useDirectusSync.ts#L54-L56) + async callbacks

```typescript
const isMounted = useRef(true);
useEffect(() => {
  return () => {
    isMounted.current = false;
    Object.values(writeTimers.current).forEach(clearTimeout);
  };
}, []);

// In lines 210, 214
if (!isMounted.current) return;
```

---

### ✅ 2. Remove lastWriteTime Update on Retry (3 min)
[useDirectusSync.ts:211](src/hooks/useDirectusSync.ts#L211)

```typescript
// Delete this line:
// lastWriteTime.current[key] = Date.now();
```

---

### ✅ 3. Add Try-Catch Around saveClosedSession (5 min)
[TableContext.tsx:322](src/contexts/TableContext.tsx#L322)

```typescript
try {
  saveClosedSession(session);
  setLastClosedSession(session);
} catch (e) {
  console.error("Failed to archive:", e);
  showToast("Failed to close table");
  return;
}
```

---

### ✅ 4. Add Console Warning for Stale Ref Pattern (15 min)
Add ESLint rule or runtime check to detect ref-based debounce anti-pattern.

---

## Refactor Candidates

### 🔄 1. Extract Sync Logic to Separate Hook (6 hours)
Split [useDirectusSync.ts](src/hooks/useDirectusSync.ts) into:
- `useRemoteSync` — polling, merge, conflict detection
- `useDebounce edWrites` — debounced upsert, retry logic
- `useConflictResolution` — conflict state + resolution

Benefits: Easier to test, clearer boundaries, reusable patterns.

---

### 🔄 2. Replace Positional marked_batches with Timestamps (3 hours)
**Includes**:
- Directus migration
- Type updates
- Code changes in 4 files
- Data migration script
- Regression tests

---

### 🔄 3. Add Bulk Upsert Endpoint for Table Swap (2 hours)
Directus custom endpoint: `POST /custom/bulk-upsert-sessions`

Benefits: Atomic swap, no race window.

---

### 🔄 4. Replace Ref-Based Debounce with State-Based (8 hours)
**Most impactful refactor** — eliminates P0 issue #1.

Approach: Use functional setState everywhere, remove all snapshot refs.

---

## Test Gaps

### 🧪 Missing Tests

1. **Concurrent edit race**: Two devices edit same table 400ms apart
2. **Conflict resolution during poll**: Trigger conflict modal while poll is active
3. **Batch merge with interleaved timestamps**: Verify marked batches persist correctly
4. **Table swap during poll**: Swap tables, poll fires mid-swap
5. **Write failure during grace period**: Simulate network failure, verify state recovers
6. **localStorage corruption**: Inject invalid JSON, verify app doesn't crash
7. **Offline for 5+ minutes**: Go offline, edit, come back online, verify conflict detected
8. **Rapid writes**: 10 edits in 1 second, verify all persist
9. **Simultaneous batches**: Two devices send batch at same millisecond
10. **sentQty invariant**: Verify qty >= sentQty always holds after merge

---

## Automation Opportunities

### 🤖 ESLint Rules

1. **no-ref-in-async-callback**: Detect refs used inside setTimeout/setInterval
2. **require-cleanup-in-effects**: Enforce cleanup functions for timers/listeners
3. **no-stale-closure**: Warn when setState is called in async function

### 🤖 Runtime Checks (Dev Mode)

1. **Invariant checker**: Assert `qty >= sentQty` after every state update
2. **Ref staleness detector**: Log warning when ref value differs from state value for >100ms
3. **Merge conflict logger**: Log all conflicts (even auto-resolved) for debugging

### 🤖 Integration Tests

1. **Multi-device simulator**: Playwright test that opens 2 tabs, simulates concurrent edits
2. **Offline simulator**: Service worker intercepts Directus calls, simulates network failure
3. **Stress test**: 50 tables, 1000 orders, verify no crashes or data loss

---

## Architecture Recommendations

### Short Term (Next Sprint)
1. ✅ Fix P0 issues #1, #2, #3, #4 (4-6 hours)
2. ✅ Add quick wins #1-3 (18 min)
3. ✅ Add integration test for multi-device edit (2 hours)

### Medium Term (Next Month)
1. 🔄 Refactor ref-based debounce → state-based (8 hours)
2. 🔄 Replace positional marked_batches with timestamps (3 hours)
3. 🤖 Add invariant checks + runtime logging (4 hours)

### Long Term (Future)
1. 🔄 Replace polling with WebSockets (2 weeks)
2. 🔄 Implement OT/CRDT for automatic conflict resolution (4 weeks)
3. 🤖 Add E2E test suite with Playwright (1 week)

---

## Verified Known Issues

### ✅ Grace Period Ambiguity
**Status**: CONFIRMED
**Location**: [TableContext.tsx:92-93](src/contexts/TableContext.tsx#L92-L93) (now [useDirectusSync.ts:114-115](src/hooks/useDirectusSync.ts#L114-L115))
**Finding**: Grace period extends on retry (P1 issue #5)

### ✅ Marked Batches Positional Indices
**Status**: CONFIRMED
**Finding**: Verified in [conflictDetection.ts:121-124](src/utils/conflictDetection.ts#L121-L124) (P0 issue #3)

### ✅ Ref-Based Debounce Reads Stale State
**Status**: CONFIRMED
**Finding**: Critical issue (P0 issue #1), affects all writes

---

## Summary

| Priority | Count | Est. Fix Time |
|----------|-------|---------------|
| P0       | 4     | 10-12 hours   |
| P1       | 8     | 12-16 hours   |
| P2       | 4     | 8-12 hours    |
| **Total** | **16** | **30-40 hours** |

**Critical Path**: Fix P0 issues before multi-device deployment. Issues #1 (stale ref) and #3 (marked batches) have highest revenue impact.

**Next Session**: Session 2 (State Consistency) should wait until P0 issues are fixed, as many state consistency issues stem from sync bugs.
