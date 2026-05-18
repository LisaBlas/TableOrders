# AGENTS.md

## Project Summary
TableOrders is a mobile-first React restaurant order management app for table
status, order taking, bill splitting, daily sales, POS-crossing workflows, and
admin-only menu maintenance. It is optimized for fast front-of-house use across
multiple devices with Directus-backed polling sync.

Keep changes practical, inspectable, and low-ceremony. This is an operational
tool, so preserve speed, clarity, and reliability over speculative abstraction.

**Architectural role:** This app is an order coordination layer, not a fiscal POS. It sits between waitstaff and an external POS system (e.g. a scale-integrated cheese POS). Staff use it to take orders and track tables during service; at end of shift they manually enter daily sales into the real POS, which handles tax calculation and legal receipts. The app's "receipts" are internal working documents for staff, not fiscal documents issued to customers. This means VAT calculation, legal receipt formatting, and fiscal compliance are out of scope.

## Tech Stack
- React 18 + TypeScript on Vite.
- Mixed TS/JS codebase: `main.jsx`, `constants.js`, `helpers.js`, and
  `appStyles.js` remain JavaScript; most app logic is TypeScript/TSX.
- State is mostly React Context:
  `AuthContext`, `AppContext`, `TableContext`, `MenuContext`, `SplitContext`.
- TanStack Query handles Directus server state and polling.
- Styling is inline JS objects in `src/styles/appStyles.js` via the `S` object.
  Do not introduce CSS-in-JS libraries or broad CSS rewrites.
- Directus stores menu items, menu item variants, paid bills, bill items, and
  table sessions.
- All Directus calls go directly to `https://cms.blasalviz.com`. CORS is
  configured on Directus (`CORS_ENABLED=true`, `CORS_ORIGIN=https://lisablas.github.io`).
  `VITE_DIRECTUS_URL` points to the Directus instance.
- Auth is Directus-native: login maps username → `{username}@camidi.com`, calls
  Directus `/auth/login`, then `/users/me?fields=role.name` to resolve the app
  role. The Directus JWT is stored in localStorage (`sessionToken`) and sent as
  `Authorization: Bearer` on every request. Directus users: `camidi@camidi.com`
  (role: `staff`), `admin@camidi.com` (role: `admin`).

## Commands
```bash
npm ci             # use this, not npm install — installs exactly from lockfile
npm run dev
npm run build
npm run preview
npm run deploy
npm.cmd run build
npm.cmd exec tsc -- --noEmit
```

Notes:
- Dev server defaults to Vite, currently `localhost:3000` via
  `vite.config.js`.
- `npm run deploy` builds via `predeploy` and publishes `dist` to GitHub Pages.
- Run `npm run build` before considering code changes complete unless the task
  is docs-only.
- On Windows PowerShell, use `npm.cmd` when `npm.ps1` is blocked by execution
  policy.

## Deployment Rules
- Before source changes, pull latest `main`:
  `git pull origin main`.
- Sessions 1–3 hardening RC deployed to GitHub Pages on 2026-05-03. This is
  now the production baseline.
- Ask before committing, pushing, or deploying.
- After an approved commit and push to `main`, run `npm run deploy`.
- Do not touch secrets, credentials, auth files, or production data without
  explicit approval.

## Architecture Map
```text
src/
  App.tsx                  Root providers, auth guard, view routing
  main.jsx                 Vite entry point
  contexts/
    AuthContext.tsx        Hardcoded login and token state
    AppContext.tsx         Global UI state and paid-bill actions
    TableContext.tsx       Table/order state and Directus session sync
    MenuContext.tsx        Directus menu fetch with constants fallback
    SplitContext.tsx       Split payment state machine
  services/
    directusMenu.ts        Menu reads
    directusAdmin.ts       Admin menu CRUD for menu_items/menu_item_variants
    directusBills.ts       Bills and bill item reads/writes
    directusSessions.ts    Table session reads/writes
  views/                   Route-like app screens
  components/              Reusable UI and bill/order components
  hooks/                   Derived table/menu/breakpoint/localStorage hooks
  data/constants.js        Tables, static menu fallback, status config
  styles/appStyles.js      Central inline style object
  utils/                   Formatting, bill factories, migration, aggregation
  types/index.ts           Shared domain types
```

## Core Workflows
- `login`: blocks app until Directus credentials pass (`camidi` or `admin`, passwords in Directus).
- `tables`: floor grid, status legend, daily sales access, long-press table swap.
- `order`: category menu, quantity controls, unsent order bar, sent batches.
- `ticket`: bill review, split options, close table.
- `split`, `splitConfirm`, `splitDone`: equal and item-based payment flows.
- `dailySales`: historical bills, revenue summary, POS aggregation, clear day.
- `admin`: admin-only in-app Directus menu editor.

## Data And Sync Rules
- Table sessions live in Directus `table_sessions`.
- Orders sync to Directus with a 500ms debounce and are fetched every 2 seconds.
- Bills for the active day poll every 5 seconds.
- Dirty table state stores a last-synced base snapshot/hash and uses three-way
  base/local/remote comparison on reconnect before prompting for conflict
  resolution. Remote table state can still overwrite clean local state after
  the 3-second write grace period.
- Conflict detection must be gated to real offline/failed-write recovery paths.
  Normal online edits also create short-lived dirty records for durability, but
  must not open conflict modals just because local differs from the last poll.
- Menu/order item IDs may be numeric from Directus/static data. Local cache and
  conflict validators must accept both string and number IDs; normalize IDs only
  for hashing/comparison, not by rejecting numeric cached sessions.
- Bills are optimistic: temporary client IDs are replaced by Directus IDs after
  writes succeed.
- Split bill metadata is persisted in `bills.split_data` for both equal
  (`{ guests }`) and item splits (`{ payments }`). `split_guests` stores the
  durable guest count for both split modes.
- Marked batches are stored as stable string batch IDs, not positional array
  indices. Legacy numeric marks are migrated on read by mapping index to batch.
- Paid bills should be modified through named `AppContext` actions, not by
  mutating `paidBills` directly.
- Bill edit mode is local until "Done"; "Cancel" restores the snapshot.
- Bills are never deleted — persistent record for accounting and analytics.
- Table sessions are deleted when a table closes, and table close is not
  reversible in-app.
- Berlin timezone is intentionally hardcoded for day boundaries.
- Admin menu edits write directly to Directus `menu_items` and
  `menu_item_variants` through `directusAdmin.ts`. When leaving `AdminView`,
  dirty menu edits call `MenuContext.reloadMenu()` so the order flow sees the
  updated menu.

## Important Domain Behaviors
- Auth uses Directus native login. `AuthContext` maps the typed username to
  `{username}@camidi.com` and calls Directus `/auth/login`. The returned JWT is
  stored as `sessionToken` in localStorage; the resolved role (`staff`/`admin`)
  is stored as `authRole`. Role comes from `GET /users/me?fields=role.name` —
  Directus role named `admin` sets `isAdmin: true`, everything else is staff.
- `TablesView` shows the Menu admin entry only when `AuthContext.isAdmin` is
  true; `AdminView` itself is routed as `view === "admin"`.
- Restaurant name is hardcoded in `BillTab.tsx`.
- There are 11 hardcoded tables in `constants.js`.
- Currency is hardcoded as EUR display text.
- Status colors come from `STATUS_CONFIG` and are reused for table status,
  batch status, and swap highlights.
- Table swap uses a 500ms long press and swaps orders, sent batches, marked
  batches, gutschein amounts, and seated status.
- Sent items are locked. Only unsent quantities can be edited.
- Item split expands quantities into individual units for granular payment.
- Clipboard export is the current kitchen/payment integration.
- POS crossing uses `crossed_qty` on bill items.
- `AdminView` groups menu items as Food, Wines, Drinks, Shop; supports search,
  section collapse, optimistic availability toggles with rollback, item edits,
  variant price edits/additions/deletions, and new item creation. Simple items
  store `price` on `menu_items`; variant items create rows in
  `menu_item_variants`. New items default to `available: true` and
  `sort_order: 99`.

## Implementation Guidelines
- Keep the app mobile-first and touch-friendly.
- Preserve existing inline style patterns. Add styles to `S` when shared or
  substantial; local inline objects are acceptable for tiny one-off adjustments.
- Use existing contexts, hooks, factories, and service modules before adding new
  abstractions.
- Keep state transitions explicit and readable. Avoid clever reducer rewrites
  unless the existing flow is being intentionally refactored.
- Maintain optimistic update behavior and rollback/snapshot behavior where
  already present.
- Prefer focused changes over broad cleanup. This app is used operationally.
- Confirm destructive user actions in UI, especially closing tables and clearing
  sales.
- Be careful with Directus field names. They mirror production collections:
  `categories`, `menu_items`, `menu_item_variants`, `bills`, `bill_items`,
  `table_sessions`.
- For menu admin changes, preserve the existing `directusAdmin.ts` service
  boundary and the local optimistic/rollback behavior in `AdminView`.

## Testing And Verification
- Primary verification is `npm run build`.
- Type-check with `npm.cmd exec tsc -- --noEmit`.
- Sessions 1–3 RC manually verified 2026-05-03 and deployed. Unit tests run
  via `npm test` (vitest); covers billFactory, sessionStorage, conflictDetection,
  batchMarks, TableContext, and useDirectusSync.
- For UI behavior changes, run `npm run dev` and manually check the affected
  flow at mobile and tablet/desktop widths.
- For sync, bill creation, POS crossing, clearing sales, or split payments,
  verify the relevant Directus service calls and cache updates.
- For offline conflict work, inspect localStorage keys `table_sessions_dirty`,
  `table_sessions_cache`, and `table_sessions_sync_meta` on the reconnecting
  device.
- Run `npm test` for the unit test suite (vitest, ~68 tests, ~1s).

## Known Limitations
- Auth is server-validated via Directus; credentials and roles managed in Directus, not in code.
- No kitchen backend, print integration, payment integration, or shift
  management.
- Polling-based sync instead of WebSockets.
- Manual conflict resolution model with local/remote/merge choices; no OT/CRDT.
- Berlin timezone and table count are not configurable.

## Cloudflare Worker
The `worker/` directory is no longer in use. Auth and CORS are handled directly
by Directus. Do not add a Worker proxy back without updating `VITE_DIRECTUS_URL`
and the auth flow in `AuthContext.tsx`.

## Agent Safety Notes
- Ask before installing dependencies.
- Ask before deleting files, clearing data, committing, pushing, or deploying.
- Do not overwrite user work in a dirty tree.
- Avoid changing generated `dist/` unless the task is specifically deployment
  or build artifact related.
- Keep docs and implementation aligned: if sync, deployment, or data model
  behavior changes, update this file and `CLAUDE.md` if needed.
- Never add `VITE_DIRECTUS_TOKEN` to `.env` or service files — token is managed
  exclusively as a Cloudflare Worker secret.
