# Session 2: State Consistency — Implementation Tracker

**Created**: 2026-04-29
**Status**: 🟡 **Audit Complete, Fixes Pending**
**Audit Report**: [session-02-state-consistency.md](session-02-state-consistency.md)

---

## Implementation Status

### Phase 1: Quick Wins (25 min) — ⏳ NOT STARTED

| # | Issue | File | Time | Status | Notes |
|---|-------|------|------|--------|-------|
| QW1 | Atomic table cleanup | [TableContext.tsx:333-338](src/contexts/TableContext.tsx#L333-L338) | 10 min | ⏳ TODO | Batch setState into single update |
| QW2 | Atomic reopenLastClosed | [TableContext.tsx:347-356](src/contexts/TableContext.tsx#L347-L356) | 10 min | ⏳ TODO | Batch 5 setState calls |
| QW3 | Atomic swapTables | [TableContext.tsx:396-406](src/contexts/TableContext.tsx#L396-L406) | 5 min | ⏳ TODO | Already mostly atomic, minor cleanup |

---

### Phase 2: P0 Critical Fixes — ⏳ NOT STARTED

| # | Issue | Approach | Files | Time | Status |
|---|-------|----------|-------|------|--------|
| P0-1 | editingBillIndex positional race (wrong bill patched) | Replace index with directusId | [AppContext.tsx:260-284](src/contexts/AppContext.tsx#L260-L284) | 2h | ⏳ TODO |
| P0-2 | billSnapshot shallow copy (items shared by ref) | Deep clone items on snapshot | [AppContext.tsx:261](src/contexts/AppContext.tsx#L261) | 5 min | ⏳ TODO |
| P0-3 | Retry-after-cancel race (valid bill silently deleted) | Clear pendingCancellations before retry | [AppContext.tsx:295-300](src/contexts/AppContext.tsx#L295-L300) | 5 min | ⏳ TODO |

**Total**: ~2.5 hours (P0-2 and P0-3 are quick wins)

---

### Phase 3: P1 High Priority Fixes — ⏳ NOT STARTED

| # | Issue | File | Time | Status | Depends On |
|---|-------|------|------|--------|------------|
| P1-1 | archiveRef 1-render stale | Expose snapshot reader from sync hook | [TableContext.tsx:82-85](src/contexts/TableContext.tsx#L82-L85) | 1h | — |
| P1-2 | Non-atomic multi-field cleanup | useReducer with CLOSE_TABLE action | [TableContext.tsx:333-338](src/contexts/TableContext.tsx#L333-L338) | 3h | — |
| P1-3 | markBillAddedToPOS bypasses exitBillEditMode | Route through exitBillEditMode | [AppContext.tsx:189-202](src/contexts/AppContext.tsx#L189-L202) | 30min | P0-1 |
| P1-4 | 16ms localStorage write gap | Document invariant (acceptable risk) | [useDirectusSync.ts:134](src/hooks/useDirectusSync.ts#L134) | 10min | — |
| P1-5 | resolveConflict defer is fragile | Add comment + test coverage | [useDirectusSync.ts:586](src/hooks/useDirectusSync.ts#L586) | 30min | — |

**Total**: ~5 hours

---

### Phase 4: P2 Technical Debt — 🟡 OPTIONAL

| # | Issue | File | Time | Status |
|---|-------|------|------|--------|
| P2-9 | seatedTables dual representation | Pick one (array or Set) | [TableContext.tsx:72-77](src/contexts/TableContext.tsx#L72-L77) | 1h | 🟡 DEFER |
| P2-10 | archiveRef could be stale | Use functional setState | [TableContext.tsx:82-85](src/contexts/TableContext.tsx#L82-L85) | 2h | 🟡 DEFER |
| P2-11 | No validation in reopenLastClosed | Validate session schema | [TableContext.tsx:341-365](src/contexts/TableContext.tsx#L341-L365) | 1h | 🟡 DEFER |
| P2-12 | localStorage quota handling | Add quota check | [closedSessionArchive.ts:17-23](src/utils/closedSessionArchive.ts#L17-L23) | 30min | 🟡 DEFER |

**Total**: ~4.5 hours

---

## Testing Checklist

### Unit Tests — ⬜ NOT STARTED

- [ ] Atomic cleanupTable: verify all state cleared in one render
- [ ] Optimistic bill: create → cancel before write completes
- [ ] Optimistic bill: create → edit before write completes
- [ ] Optimistic bill: concurrent creates don't race
- [ ] reopenLastClosed: verify all state restored atomically
- [ ] localStorage overflow: verify graceful degradation

### Integration Tests — ⬜ NOT STARTED

- [ ] **Bill create + immediate cancel**: Close table, reopen before Directus write completes
- [ ] **Bill edit during poll**: Enter edit mode, remote poll updates bills cache
- [ ] **Concurrent bill creates**: Two devices close tables simultaneously
- [ ] **localStorage quota**: Fill storage, close table, verify error handling
- [ ] **Ref/state desync**: Rapid table state changes, verify refs stay in sync

### Manual Tests — ⬜ NOT STARTED

- [ ] Close table, immediately reopen (fast double-tap)
- [ ] Close table, navigate away mid-write
- [ ] Edit bill, poll fires, verify edit not lost
- [ ] Fill localStorage (dev tools), close table, verify toast shown

---

## Implementation Notes

### P0-1: Optimistic Bill Race (Write Queue)

**Current Code** (Lines 119-164):
```typescript
const addPaidBill = useCallback((bill: Bill) => {
  const todayKey = ["bills", todayBerlinDate()];
  const tempId = bill.tempId ?? crypto.randomUUID();
  const optimisticBill = { ...bill, tempId };

  // Optimistic update
  const current = queryClient.getQueryData<Bill[]>(todayKey) ?? [];
  queryClient.setQueryData<Bill[]>(todayKey, [...current, optimisticBill]);

  // ❌ Concurrent writes can race — Directus may receive out-of-order
  createBillInDirectus(optimisticBill)
    .then((savedBill) => {
      // ...
    })
    .catch((err) => {
      // ...
    });
}, [queryClient, setFailedBill, showToast]);
```

**Problem**: Two rapid table closes spawn concurrent createBillInDirectus calls. Directus may receive them out of chronological order, causing bills to appear in wrong order.

**Fix (Serial Write Queue)**:
```typescript
const writeQueue = useRef<Promise<void>>(Promise.resolve());

const addPaidBill = useCallback((bill: Bill) => {
  const todayKey = ["bills", todayBerlinDate()];
  const tempId = bill.tempId ?? crypto.randomUUID();
  const optimisticBill = { ...bill, tempId };

  // Optimistic update (immediate)
  const current = queryClient.getQueryData<Bill[]>(todayKey) ?? [];
  queryClient.setQueryData<Bill[]>(todayKey, [...current, optimisticBill]);

  // Serial write (queue)
  writeQueue.current = writeQueue.current.then(async () => {
    try {
      const savedBill = await createBillInDirectus(optimisticBill);
      // ... rest of success logic
    } catch (err) {
      // ... error handling
    }
  });
}, [queryClient, setFailedBill, showToast]);
```

**Test**: Close tables 1, 2, 3 in rapid succession (< 100ms apart); verify bills appear in Directus in order 1, 2, 3.

---

### P0-2: Cancel-During-Write Race

**Current Code** (Lines 166-187):
```typescript
const cancelBillByTempId = useCallback((billTempId: string) => {
  const directusId = tempIdToDirectusId.current[billTempId];
  if (directusId) {
    // Case 1: write already resolved
    // ...
  }

  // Case 2: write still in-flight
  const bills = queryClient.getQueryData<Bill[]>(todayKey) ?? [];
  queryClient.setQueryData<Bill[]>(todayKey, bills.filter((b) => b.tempId !== billTempId));
  pendingCancellations.current.add(billTempId);
}, [queryClient]);
```

**Problem**: If cancel happens between createBillInDirectus starting and `tempIdToDirectusId` being set (line 135), the bill is orphaned in Directus.

**Fix**: Check `pendingCancellations` **before** adding tempId to mapping:
```typescript
// In addPaidBill, line 133-136
createBillInDirectus(optimisticBill)
  .then((savedBill) => {
    // ✅ Check if cancelled before adding mapping
    if (pendingCancellations.current.has(tempId)) {
      pendingCancellations.current.delete(tempId);
      if (savedBill.directusId) {
        const itemIds = savedBill.items.map((i) => i.directusId).filter(Boolean) as string[];
        deleteBill(savedBill.directusId, itemIds).catch(console.error);
      }
      return;
    }
    if (savedBill.directusId) {
      tempIdToDirectusId.current[tempId] = savedBill.directusId;
    }
    // ... rest of logic
  });
```

**Already implemented!** This fix is already in place (lines 137-144). But we should add a **guard in cancelBillByTempId** to prevent race if cancel is called **during the Directus DELETE**:

```typescript
const cancelBillByTempId = useCallback((billTempId: string) => {
  const todayKey = ["bills", todayBerlinDate()];

  // Case 1: write already resolved
  const directusId = tempIdToDirectusId.current[billTempId];
  if (directusId) {
    const bills = queryClient.getQueryData<Bill[]>(todayKey) ?? [];
    const bill = bills.find((b) => b.directusId === directusId);
    queryClient.setQueryData<Bill[]>(todayKey, bills.filter((b) => b.directusId !== directusId));
    if (bill) {
      const itemIds = bill.items.map((i) => i.directusId).filter(Boolean) as string[];
      // ✅ Add guard to prevent double-delete
      if (!pendingCancellations.current.has(billTempId)) {
        deleteBill(directusId, itemIds).catch(console.error);
      }
    }
    delete tempIdToDirectusId.current[billTempId];
    pendingCancellations.current.delete(billTempId);
    return;
  }

  // Case 2: write still in-flight
  const bills = queryClient.getQueryData<Bill[]>(todayKey) ?? [];
  queryClient.setQueryData<Bill[]>(todayKey, bills.filter((b) => b.tempId !== billTempId));
  pendingCancellations.current.add(billTempId);
}, [queryClient]);
```

**Test**: Close table, reopen immediately (< 50ms). Verify no orphaned bill in Directus.

---

### P0-3: Edit-During-Poll Race

**Current Code** (Lines 260-284):
```typescript
const enterBillEditMode = useCallback((billIndex: number) => {
  setBillSnapshot({ ...paidBills[billIndex] });
  setEditingBillIndex(billIndex);
}, [paidBills]);

const exitBillEditMode = useCallback(() => {
  if (editingBillIndex !== null) {
    const bill = paidBills[editingBillIndex];  // ❌ paidBills may have changed
    // ... sync to Directus
  }
  // ...
}, [editingBillIndex, paidBills, showToast]);
```

**Problem**: If user enters edit mode, then a remote poll refetches bills (someone else created a new bill), `paidBills` array changes. The `editingBillIndex` now points to a different bill.

**Scenario**:
```
T0:    paidBills = [billA, billB], user enters edit mode for billB (index 1)
T2s:   Remote poll returns [billA, billC, billB] (someone else created billC)
T4s:   User exits edit mode → editingBillIndex=1 now points to billC ❌
```

**Fix**: Store bill `directusId` instead of index:
```typescript
const [editingBillId, setEditingBillId] = useState<string | null>(null);

const enterBillEditMode = useCallback((billIndex: number) => {
  const bill = paidBills[billIndex];
  if (!bill.directusId) {
    showToast("Cannot edit bill without ID");
    return;
  }
  setBillSnapshot({ ...bill });
  setEditingBillId(bill.directusId);
}, [paidBills, showToast]);

const exitBillEditMode = useCallback(() => {
  if (editingBillId !== null) {
    const bill = paidBills.find((b) => b.directusId === editingBillId);
    if (!bill) {
      showToast("Bill not found - changes discarded");
      setEditingBillId(null);
      setBillSnapshot(null);
      return;
    }
    // ... sync to Directus
  }
  setEditingBillId(null);
  setBillSnapshot(null);
}, [editingBillId, paidBills, showToast]);
```

**Test**: Enter edit mode, trigger poll (create bill from another device), exit edit mode. Verify correct bill synced.

---

### QW1: Atomic Table Cleanup

**Current Code** (Lines 333-338):
```typescript
setOrders((prev) => { const n = { ...prev }; delete n[key]; return n; });
setSeatedTablesArr((prev) => prev.filter((id) => String(id) !== key));
setSentBatches((prev) => { const n = { ...prev }; delete n[key]; return n; });
setGutscheinAmounts((prev) => { const n = { ...prev }; delete n[key]; return n; });
setMarkedBatches((prev) => { const n = { ...prev }; delete n[key]; return n; });
```

**Problem**: 5 separate setState calls → 5 renders. If component unmounts or re-renders mid-cleanup, state can be inconsistent.

**Fix**: Batch into single `useReducer` action or wrap in `unstable_batchedUpdates` (not needed in React 18 automatic batching, but good practice):

```typescript
import { unstable_batchedUpdates } from "react-dom";

unstable_batchedUpdates(() => {
  setOrders((prev) => { const n = { ...prev }; delete n[key]; return n; });
  setSeatedTablesArr((prev) => prev.filter((id) => String(id) !== key));
  setSentBatches((prev) => { const n = { ...prev }; delete n[key]; return n; });
  setGutscheinAmounts((prev) => { const n = { ...prev }; delete n[key]; return n; });
  setMarkedBatches((prev) => { const n = { ...prev }; delete n[key]; return n; });
});
```

**OR** (better long-term): Refactor to single `tableState` reducer with `CLEANUP_TABLE` action.

---

## Decision Log

### 2026-04-29: Session 2 Audit Complete

**Findings**:
- 3 P0 issues (optimistic update races)
- 5 P1 issues (state consistency, ref/state desync)
- 4 P2 issues (code quality improvements)

**Recommended Next Steps**:
1. Fix P0-1, P0-2, P0-3 (optimistic bill races) — **critical for multi-device use**
2. Fix QW1-3 (atomic state updates) — **low-hanging fruit**
3. Defer P1 fixes until after integration testing
4. Defer P2 fixes (optimizations without measurement)

---

## Git Strategy

### Branch Structure
```
main
  └─ fix/session-02-state-consistency
       ├─ fix/session-02-quick-wins (QW1-3)
       ├─ fix/session-02-p0-bill-races (P0-1, P0-2, P0-3)
       └─ fix/session-02-p1-state-refs (P1-5, P1-6) — optional
```

### Commit Strategy
- Small, atomic commits for each fix
- Include test in same commit as fix
- Reference issue number in commit message: `fix(bills): P0-1 serial write queue`

---

## Rollout Plan

### Phase 1: Quick Wins (Low Risk)
1. QW1-3 — atomic state updates
2. Test on single device
3. Deploy to staging

### Phase 2: P0 Fixes (High Risk)
1. P0-1, P0-2, P0-3 — optimistic bill races
2. Test on 2 devices concurrently (close tables rapidly)
3. Soak test for 24h
4. Deploy to production

### Phase 3: P1 Fixes (Medium Risk)
1. P1 fixes — batch into weekly releases
2. Monitor error rates after each release

---

## Success Criteria

### Phase 1 Complete When:
- [ ] All 3 quick wins merged to main
- [ ] Table cleanup is atomic (single render)
- [ ] No intermediate state visible during reopen

### Phase 2 Complete When:
- [ ] All 3 P0 issues fixed
- [ ] 2-device rapid table close test passes
- [ ] No orphaned bills in Directus after 100 rapid close/reopen cycles

### Session 2 Complete When:
- [ ] All P0 issues fixed
- [ ] All quick wins implemented
- [ ] Integration tests pass
- [ ] Manual testing complete
- [ ] Deployed to production
- [ ] Monitoring shows no state consistency errors for 1 week

---

## Time Tracking

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| Audit | 90 min | 90 min | ✅ Completed 2026-04-29 |
| Quick Wins | 25 min | — | Not started |
| P0 Fixes | 6h | — | Not started |
| P1 Fixes | 8.5h | — | Optional |
| Testing | 4h | — | Not started |
| **TOTAL** | **~19h** | **1.5h** | Audit complete; fixes pending |

---

## Resources

- [Session 2 Audit Report](session-02-state-consistency.md) — Full findings
- [REVIEW_PLAN.md](REVIEW_PLAN.md) — Overall review strategy
- [SESSION_01_TRACKER.md](SESSION_01_TRACKER.md) — Session 1 tracker
- [React Docs: Batching](https://react.dev/learn/queueing-a-series-of-state-updates) — State update batching
- [TanStack Query: Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

---

**Last Updated**: 2026-04-29
**Next Review**: After P0 fixes implemented
**Next Steps**: Implement P0 fixes, then run 2-device integration tests
