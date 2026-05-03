# System Invariants

Hard rules that must not be violated. Discovered through bugs and design decisions.

## SI-1: Ensure refs are current before `scheduleWrite` fires

`scheduleWrite` reads refs at call time. Refs are updated by `useEffect` hooks, which run after render — not synchronously after `setState`. If `scheduleWrite` is called in the same synchronous block as a batch of `setState` calls (and no further `scheduleWrite` call is expected to correct the data), the snapshot will be stale and the wrong data will be persisted.

**Required**: either defer the `scheduleWrite` call via `setTimeout(0)` so that ref-syncing effects run first, or manually sync all affected refs before calling it. `resolveConflict` uses the defer approach (`setTimeout(0)`) — do not revert it to a direct call.

## SI-2: Conflict detection must only run on offline→online transition or failed-write recovery

Running conflict detection on every poll produces false positives during normal use because localStorage is always ahead of Directus by the debounce window (up to 500ms). Detection is gated on `reconnectingFromOffline || hasFailedWritesNow` (`useDirectusSync.ts`, merge effect). Only dirty-session records are inspected (`detectDirtySessionConflicts`) — tables not in `dirtyRecords` are ignored. Locally-owned tables (in `pendingWrites`, within `OWNERSHIP_GRACE_MS`, or with `failedWriteKeys`) are handled separately via the `isLocallyOwned` guard in the normal merge path, not excluded from conflict detection itself.

## SI-3: `cancelAndDelete` must clear all per-table tracking state

Table IDs are reused across sessions. When a table is closed, the following must be cleared synchronously at the top of `cancelAndDelete`:
- `clearTimeout(writeTimers.current[key])`
- `pendingWrites.current.delete(key)`
- `retryingFailedWrites.current.delete(key)`
- `delete lastWriteTime.current[key]`

`sessionIdMap.current[key]` and `failedWriteKeys.current` are cleared in the async `deleteSession` success callback — this is intentional, since a failed delete means the session still exists remotely and must be retried. Leaving any of the synchronous fields populated causes the next session on the same table to inherit stale state (e.g. the next write skips the debounce, or a retry loop fires immediately).

## SI-4: Never commit secrets or `.env` to git

`.env` files are `chmod 600`. The Directus static token lives in `.env` and must never appear in source or git history.

## SI-5: Always pull before changes, deploy after push

Per agent workflow: `git pull origin main` before any code change. After committing and pushing: `npm run deploy` to publish to GitHub Pages. Never skip either step.
