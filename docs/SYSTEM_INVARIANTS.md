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

`.env` files must never appear in source or git history. The client should use
`VITE_DIRECTUS_URL` only; Directus auth is user/JWT based and no static Directus
token should be added to `.env`, source, or service files.

## SI-5: Always pull before changes; prod deploy is manual and separate from `main`

Per agent workflow: `git pull origin main` before any code change. After
committing and pushing: `npm run deploy:demo` to update the GitHub Pages demo
build. Production deployment (`npm run deploy:prod`) is a separate, manual
step — it builds locally and `scp`s `dist/` to the prod Hetzner VPS
(`167.233.138.109:/var/www/camidi/`) over SSH from the developer's local
machine. Pushing to `main` does **not** deploy prod. Confirmed live in
production since 2026-07-01 — never assume `main` reflects what the
restaurant is running; ask before running `npm run deploy:prod`.

## SI-6: `staging` branch is for headless/Slack sessions only; `deploy:prod` never builds from it

`claude-runner` (headless `claude -p`, triggered via Slack/phone) works on the
`staging` branch: commits, pushes, and runs `npm run deploy:staging` (rsyncs
`dist/` to `/var/www/tableorders-staging/` on this VPS, served at
`https://to-staging.blasalviz.com`) without asking for confirmation each time.
This is safe because staging is isolated — it never touches `main` and
`deploy:prod` is hardcoded to build from `main` only. Merging anything from
`staging` into `main` requires an interactive session where the user reviews
the commits; that merge is the actual "promote to production" decision, not
the staging deploy itself. Do not let any automation fast-forward `main` to
`staging` or point `deploy:prod` at anything other than `main`.
