# Recent Changes

Entries older than 7 days are pruned automatically.

## 2026-04-28 — useDirectusSync.ts: 8-bug sweep

- **False-positive conflict detection** (bug): `detectConflicts` ran every 2s poll comparing localStorage (written immediately) against Directus (written after 500ms debounce). This triggered the conflict UI during normal single-device use. Fixed: conflict check now only runs on offline→online transition, and excludes locally-owned tables.
- **`resolveConflict` persisted stale data** (serious bug): `scheduleWrite` reads refs to build its snapshot, but ref-syncing `useEffect`s run after render. Calling `scheduleWrite` immediately after `setState` meant localStorage and Directus received pre-resolution data. After the 3s grace period, the next remote poll would silently undo the conflict resolution. Fixed: refs are manually synced before calling `scheduleWrite` in `resolveConflict`.
- **`cancelAndDelete` leaked `retryCounts`** (bug): closing a table mid-retry left a stale non-zero count; re-opening the same table ID could hit MAX_RETRIES on the first write. Fixed: `delete retryCounts.current[key]` added to `cancelAndDelete`.
- **No unmount cleanup for write timers** (bug): retry loops survived component unmount, mutating dead refs. Fixed: cleanup `useEffect` clears all `writeTimers` on unmount.
- **`allKeys` missing `gutscheinAmounts`/`markedBatches` keys** (defensive): tables with only those fields set were silently dropped from the merge output. Fixed: both added to the `allKeys` spread.
- **Offline fallback re-ran on every failed poll** (minor): localStorage was read and all 5 setters called on every 2s tick while offline. Fixed: guarded with `wasOffline.current` so the load only happens once on the transition to offline.
- **Unnecessary `cacheMap` Map allocation** (minor): converted object to Map just to call `.forEach`. Replaced with `Object.entries(...).forEach`.
- **`let resolvedSession` + switch in `resolveConflict`** (code quality): fragile if the union type grows. Replaced with const ternary chain.
