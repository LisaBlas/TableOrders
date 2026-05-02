# Session 3: Payment Flow Integrity — Implementation Tracker

**Created**: 2026-05-02
**Audit Report**: [session-03-payment-integrity.md](session-03-payment-integrity.md)
**Status**: ✅ **Session 3 complete** — all P1 fixes + manual tests passed; unit tests and optional P2 remain

---

## Implementation Status

### Phase 1: Quick Wins (~22 min) — ✅ COMPLETE

| # | Issue | File | Time | Status |
|---|-------|------|------|--------|
| QW1 | Fix `o.qty` → `o.sentQty` for full-close subtotal | [useTableClose.ts:15](src/hooks/useTableClose.ts#L15) | 5 min | ✅ DONE |
| QW2 | Add NaN guard to parseFloat in all 3 payment inputs | [useTableClose.ts:19](src/hooks/useTableClose.ts#L19), [SplitEqualView.tsx:123](src/views/SplitEqualView.tsx#L123), [SplitConfirmView.tsx:135](src/views/SplitConfirmView.tsx#L135) | 10 min | ✅ DONE |
| QW3 | Cap guest count at 20 | [SplitEqualView.tsx:84](src/views/SplitEqualView.tsx#L84) | 2 min | ✅ DONE |
| QW4 | Normalize bill items via sentQty in useTableClose | [useTableClose.ts:33](src/hooks/useTableClose.ts#L33) | 5 min | ✅ DONE |

---

### Phase 2: P1 Fixes (~2h) — ✅ COMPLETE

| # | Issue | File | Time | Status |
|---|-------|------|------|--------|
| P1-1 | Race: cleanupTable before bill save confirmed | [RetryModal.tsx](src/components/RetryModal.tsx), [AppContext.tsx](src/contexts/AppContext.tsx) | 1h | ✅ DONE (Option A) |
| P1-2 | useTableClose uses `o.qty` not `o.sentQty` for subtotal | [useTableClose.ts:15](src/hooks/useTableClose.ts#L15) | — | ✅ DONE (covered by QW1) |
| P1-3 | Equal split rounding: displayed share ≠ amount used in tip math | [SplitEqualView.tsx:90,138](src/views/SplitEqualView.tsx#L90), [billFactory.ts:54-55](src/utils/billFactory.ts#L54-L55) | 45 min | ✅ DONE |

---

### Phase 3: P2 Technical Debt (~3h) — 🟡 OPTIONAL

| # | Issue | File | Time | Status |
|---|-------|------|------|--------|
| P2-4 | NaN guard on parseFloat | Multiple | — | ✅ DONE (covered by QW2) |
| P2-5 | No upper bound on guest count | [SplitEqualView.tsx:84](src/views/SplitEqualView.tsx#L84) | — | ✅ DONE (covered by QW3) |
| P2-6 | SplitDoneView dead code / double-bill hazard | [SplitDoneView.tsx](src/views/SplitDoneView.tsx) | 30 min | ⬜ TODO |
| P2-7 | calculateEqualSplitTip uses raw float | [billFactory.ts:54-55](src/utils/billFactory.ts#L54-L55) | — | ✅ DONE (covered by P1-3) |
| P2-8 | No warning when gutschein not assigned in item split | [SplitConfirmView.tsx:29](src/views/SplitConfirmView.tsx#L29) | 30 min | ⬜ TODO |
| P2-9 | Full-close bill items not normalized | [useTableClose.ts:33](src/hooks/useTableClose.ts#L33) | — | ✅ DONE (covered by QW4) |

---

## Testing Checklist

### Unit Tests — ⬜ NOT STARTED
- [ ] `getBillSubtotal`: verify uses `sentQty`, not `qty`
- [ ] `calculateEqualSplitTip`: €10/3 guests, each pays 3.33 → tip = 0, not −0.01
- [ ] `calculateEqualSplitTip`: €10/3 guests, last guest pays 3.34 → tip = 0
- [ ] Full-close bill total: qty=3 sentQty=2 → total = price × 2

### Integration Tests — ⬜ NOT STARTED
- [ ] Full close with partially-sent items → correct total
- [ ] Equal split €10 / 3 guests → displayed amounts sum to €10
- [ ] Equal split: each guest pays shown amount → tip = 0 (not negative)
- [ ] Item split: gutschein not selected → bill shows no discount
- [ ] Directus write fails on close → non-dismissible retry modal blocks UI until resolved

### Manual Tests — ✅ PASSED 2026-05-02
- [x] Order item qty=3, send 2, close table — verify receipt shows 2× price
- [x] Equal split 10€ / 3, each pays 3.33€ — verify tip shows +€0.00 not −€0.01
- [x] Set guest count to 20 — verify + button is disabled at max
- [ ] Item split with gutschein — verify waiter gets warning if gutschein not assigned (P2-8, not yet implemented)
- [x] Disconnect network mid-close — non-dismissible retry modal; bill saved on retry with toast

---

## Implementation Notes

### QW1 + P1-2: Fix sentQty in useTableClose

**Current** ([useTableClose.ts:15-35](src/hooks/useTableClose.ts#L15-L35)):
```typescript
const sentSubtotal = sent.reduce((s, o) => s + o.price * o.qty, 0);  // ❌ uses qty
// ...
items: sent.map((o: OrderItem) => ({ ...o })),  // ❌ raw items, not normalized
```

**Fix**:
```typescript
const sentSubtotal = sent.reduce((s, o) => s + o.price * (o.sentQty || 0), 0);  // ✅ sentQty
// ...
items: sent.map((o: OrderItem) => ({ ...o, qty: o.sentQty || 0 })),  // ✅ normalize qty
```

---

### P1-1: Race Condition Fix (Option A — Non-dismissible Retry)

**Current** (all 3 close paths):
```typescript
app.addPaidBill(bill);        // fires async Directus write
table.cleanupTable(tableId);  // runs immediately, deletes session
app.setView("tables");
```

**Fix Option A** (simplest): Make the retry toast/modal non-dismissible:
```typescript
// In AppContext bill save error handler:
// Instead of:
showToast("Failed to save bill — tap to retry");
// Use:
showRetryModal("Bill could not be saved — tap to retry (required)");
// where retryModal has no dismiss button
```

**Fix Option B** (robust): Persist pending bill to localStorage before cleanup:
```typescript
// Before cleanupTable:
savePendingBill(bill);  // localStorage key: 'pending_bills'
// In AppContext on successful Directus write:
removePendingBill(bill.tempId);
// On app load: check pending_bills, offer to retry
```

**Recommendation**: Option A (5 lines changed), Option B deferred for now.

---

### P1-3: Equal Split Rounding Fix

**Current** ([SplitEqualView.tsx:20](src/views/SplitEqualView.tsx#L20)):
```typescript
const equalShare = state.equalGuests > 0 ? billableTotal / state.equalGuests : 0;
// Displayed as equalShare.toFixed(2) — raw float used in calculations
```

**Fix**: Round to cents; distribute remainder to last guest:
```typescript
const equalShareCents = Math.floor((billableTotal / state.equalGuests) * 100);
const lastGuestExtra = Math.round(billableTotal * 100) - equalShareCents * state.equalGuests;
const equalShareRounded = equalShareCents / 100;
const lastGuestShare = (equalShareCents + lastGuestExtra) / 100;
```

Update display to show last guest's share separately. Update `calculateEqualSplitTip` to accept `equalShareRounded` instead of raw float.

---

### P2-6: SplitDoneView — Dead Code Assessment

**Confirmed**: SplitDoneView is unreachable. No view in the item split flow calls `app.setView("splitDone")`. `settleItemPayment()` in SplitConfirmView always navigates to "tables".

**Options**:
1. **Delete SplitDoneView** — cleanest, removes double-bill hazard entirely
2. **Wire it up** — make SplitDoneView the summary step before final close; move `addPaidBill` to SplitDoneView.closeSplitTable; remove it from SplitConfirmView.settleItemPayment

If deleted, also remove the "splitDone" case from the App router.

---

### P2-8: Gutschein Unassigned Warning

```typescript
// In settleItemPayment (SplitConfirmView.tsx:29):
const gutscheinLeft = state.remaining.some((i) => i.isGutschein);
if (gutscheinLeft && state.remaining.length > 0) {
  // remaining has only the gutschein — warn before finalizing
  showToast("Warning: Gutschein not assigned to any guest");
}
```

Or block "Done" if gutschein item remains unassigned.

---

## Decision Log

### 2026-05-02: Scope of Session 3

**Confirmed P0**: None found. All three "known issues" from REVIEW_PLAN.md were confirmed safe via guards in the code.

**Root Pattern**: Three independent issues with a common theme — the close path bypasses or inconsistently uses the bill factory utilities.

**Deferred**: SplitDoneView refactor (P2-6) — needs product decision (keep as summary step or delete).

---

## Git Strategy

```
main
  └─ fix/session-03-payment-integrity
       ├─ fix/pay-03-quick-wins           (QW1-4, ~22 min)
       ├─ fix/pay-03-sentqty-close        (P1-2, covered in QW1)
       ├─ fix/pay-03-equal-split-rounding (P1-3)
       └─ fix/pay-03-close-race           (P1-1, non-dismissible retry)
```

---

## Time Tracking

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| Audit (session) | 90 min | 90 min | ✅ Complete 2026-05-02 |
| Quick Wins | 22 min | ~22 min | ✅ Complete 2026-05-02 |
| P1 Fixes | ~2h | ~1h | ✅ Complete 2026-05-02 |
| P2 Fixes | ~3h | — | Optional (P2-6, P2-8 remain) |
| Testing | ~2h | ~30 min | Manual tests ✅; unit tests pending |
| **Total (excl. audit)** | **~7h** | **—** | — |

---

## Success Criteria

### Phase 1 (Quick Wins) Complete When:
- [x] Full-close subtotal uses `sentQty` (no overcharge)
- [x] Bill items stored with normalized qty
- [x] No NaN-vulnerable parseFloat calls
- [x] Guest count capped at 20

### Phase 2 (P1 Fixes) Complete When:
- [x] Bill save failure cannot be silently dismissed (Option A — non-dismissible retry modal)
- [ ] Bill recoverable after device crash mid-close (Option B — localStorage persistence, deferred)
- [x] Equal split: sum of displayed shares = bill total (no rounding shortfall)
- [x] Equal split: no-tip payment shows +€0.00, not −€0.01

### Session 3 Complete When:
- [x] All P1 issues fixed
- [x] All quick wins implemented
- [ ] Unit tests for rounding and sentQty
- [x] Manual test: equal split €10/3 passes
- [x] Manual test: partial-send full-close passes

---

**Last Updated**: 2026-05-02
**Next Steps**: Unit tests for `getBillSubtotal`, `calculateEqualSplitTip`, and full-close total. Then commit + deploy as combined RC (Sessions 1–3). Optional: P2-6 (delete SplitDoneView), P2-8 (gutschein warning), Option B localStorage persistence for crash recovery.
