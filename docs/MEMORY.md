# Memory — Decisions & Learned Patterns

## Sync architecture: ref snapshot timing

`scheduleWrite` reads refs synchronously at call time to build its session snapshot. Refs are synced from React state via `useEffect`, which runs *after* render — not immediately after `setState`. This means calling `scheduleWrite` right after a batch of `setState` calls will produce a snapshot that is one render behind.

This is safe in the normal user-interaction flow because:
1. The debounce timer (500ms) is always cancelled and re-set on each call, so only the last snapshot fires.
2. By the time the timer fires (500ms later), all renders + effects have completed and refs are current for retry paths.
3. localStorage is written immediately with the slightly-stale snapshot, which is corrected on the next `scheduleWrite` call.

**Exception — `resolveConflict`**: this is the one place where `scheduleWrite` is called after `setState` with no expectation of a subsequent call. The stale snapshot would be written to localStorage and Directus, and after the ownership grace period expires, the next remote poll would undo the conflict resolution. Fix: manually sync all refs before calling `scheduleWrite` in `resolveConflict`.

**Rule: any code path that calls `scheduleWrite` immediately after `setState` and does NOT expect a subsequent `scheduleWrite` to correct the data must manually sync the refs first.**

## Conflict detection: scope and gating

Conflict detection compares localStorage vs Directus. Because localStorage is written immediately and Directus is written after a 500ms debounce, any active write creates a window where the two diverge. Running `detectConflicts` unconditionally on every poll produces false positives during normal use.

Correct approach:
- Only run conflict detection on the offline→online transition (`wasOffline.current` gate).
- Before running, filter out locally-owned tables (`pendingWrites` or within `OWNERSHIP_GRACE_MS`) — these divergences are expected and not real conflicts.

## Offline fallback: one-time load on transition

While offline, the 2s poll keeps firing. Re-reading localStorage and calling all 5 setters on every tick is redundant — React state is already kept current by user actions (setters) and `scheduleWrite` keeps localStorage current. Load from localStorage only once, on the first detection of offline state (`wasOffline.current` guard), then return early on subsequent offline ticks.

## `cancelAndDelete` must clear all bookkeeping for a table

Table IDs are reused (1–11). When a table is closed, ALL tracking state for that key must be cleared: `writeTimers`, `pendingWrites`, `lastWriteTime`, `retryCounts`, `sessionIdMap`. Missing any one of them can cause the next session on the same table to inherit stale state.
