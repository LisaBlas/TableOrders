# Recent Changes

Entries older than 7 days are pruned automatically.

## 2026-05-03 — CLAUDE.md documentation audit

Full codebase analysis vs docs. Updated CLAUDE.md:
- Added `config/appConfig.ts` to project structure (central runtime constants)
- Added 9 undocumented components: TableCard, BillHeader, ConflictResolutionModal, RetryModal, SwapSheet, CustomItemModal, GutscheinModal, PaymentPanel, SplitOptions
- Added 4 undocumented utils: batchGrouping, batchMarks, conflictDetection, sessionStorage
- Added `tokens.ts` to styles
- Corrected `constants.js` / `helpers.js` → `constants.ts` / `helpers.ts`
- Corrected table count (was "11 hardcoded", now accurate: 13 inside + 6 outside + dynamic)
- Added Key Behaviors: custom items, order destination routing, MIN_QTY_2_IDS, dynamic tables
- Added `dynamic_tables` to localStorage keys list
- Updated MenuContext description to include `minQty2Ids`
- Added `appConfig.ts` and `destination` field to Data Model section

## 2026-05-03 — Sessions 1–3 RC deployed

Combined hardening release candidate shipped to GitHub Pages:
- **Session 1**: sync fixes (stale-ref debounce, conflict-detection gating, stable batch IDs, swap race guard, write-failure recovery)
- **Session 2**: state consistency (bill edit by directusId, deep snapshot clone, atomic table cleanup)
- **Session 3**: payment integrity (sentQty in close/split, equal-split rounding, non-dismissible retry modal)
- Unit test suite added (vitest, 68 tests): billFactory, sessionStorage, conflictDetection, batchMarks, TableContext, useDirectusSync

## 2026-04-28 — useDirectusSync.ts: 8-bug sweep

- **False-positive conflict detection** (bug): `detectConflicts` ran every 2s poll comparing localStorage (written immediately) against Directus (written after 500ms debounce). This triggered the conflict UI during normal single-device use. Fixed: conflict check now only runs on offline→online transition, and excludes locally-owned tables.
- **`resolveConflict` persisted stale data** (serious bug): `scheduleWrite` reads refs to build its snapshot, but ref-syncing `useEffect`s run after render. Calling `scheduleWrite` immediately after `setState` meant localStorage and Directus received pre-resolution data. After the 3s grace period, the next remote poll would silently undo the conflict resolution. Fixed: refs are manually synced before calling `scheduleWrite` in `resolveConflict`.
- **`cancelAndDelete` leaked `retryCounts`** (bug): closing a table mid-retry left a stale non-zero count; re-opening the same table ID could hit MAX_RETRIES on the first write. Fixed: `delete retryCounts.current[key]` added to `cancelAndDelete`.
- **No unmount cleanup for write timers** (bug): retry loops survived component unmount, mutating dead refs. Fixed: cleanup `useEffect` clears all `writeTimers` on unmount.
- **`allKeys` missing `gutscheinAmounts`/`markedBatches` keys** (defensive): tables with only those fields set were silently dropped from the merge output. Fixed: both added to the `allKeys` spread.
- **Offline fallback re-ran on every failed poll** (minor): localStorage was read and all 5 setters called on every 2s tick while offline. Fixed: guarded with `wasOffline.current` so the load only happens once on the transition to offline.
- **Unnecessary `cacheMap` Map allocation** (minor): converted object to Map just to call `.forEach`. Replaced with `Object.entries(...).forEach`.
- **`let resolvedSession` + switch in `resolveConflict`** (code quality): fragile if the union type grows. Replaced with const ternary chain.
