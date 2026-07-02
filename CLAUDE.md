# CLAUDE.md

This session-memory file is intentionally mirrored with its counterpart. Keep
both files aligned: they are first-session project memory for coding agents, not
changelogs or task lists. Detailed rules for what belongs here live in
`docs/DOCUMENTATION_MEMORY_RULES.md`.

## Project Summary
TableOrders is a mobile-first React restaurant order management app for table
status, order taking, bill splitting, daily sales, POS-crossing workflows,
analytics, temporary table overflow, and admin-only menu maintenance. It is an
operational front-of-house tool optimized for speed, clarity, and reliable
multi-device coordination through Directus-backed polling sync.

TableOrders is an order coordination layer, not a fiscal POS. Staff use it to
take orders and track tables during service, then manually enter sales into the
real POS at shift end. The app's receipts are internal working documents, so VAT
calculation, legal receipt formatting, and fiscal compliance are out of scope.

## Tech Stack And Architecture
- React 18 + TypeScript on Vite; the codebase is mixed TS/JS.
- State is primarily React Context: `AuthContext`, `AppContext`,
  `TableContext`, `MenuContext`, `SplitContext`, and `UIContext`.
- TanStack Query handles Directus server state and polling.
- Styling uses inline JS objects in `src/styles/appStyles.js` plus CSS custom
  properties from `src/index.css` and tokens in `src/styles/tokens.ts`. Do not
  introduce CSS-in-JS libraries or broad CSS rewrites.
- Directus at `https://cms.blasalviz.com` (SQLite) is the dev/staging instance.
  Production Directus runs at `https://cms.camidi.de` (PostgreSQL, Hetzner),
  live since 2026-07-01. CORS is configured on Directus; `VITE_DIRECTUS_URL`
  points to the active instance per environment.
- Auth is Directus-native: typed usernames are mapped to
  `{username}@camidi.com`, `/auth/login` returns a JWT stored as
  `sessionToken`, and `/users/me?fields=role.name` resolves `staff` or `admin`.
  The JWT is sent as `Authorization: Bearer` on Directus requests.

## Commands
```bash
npm ci
npm run dev
npm run build
npm run build:demo
npm run preview
npm run deploy:prod
npm run deploy:demo
npm run deploy:staging
npm test
npm.cmd run build
npm.cmd exec tsc -- --noEmit
```

Notes:
- Use `npm ci`, not `npm install`, unless the user explicitly approves
  dependency changes.
- Vite dev server defaults to `localhost:3000`.
- `npm run deploy:prod` builds the app and `scp`s `dist/` to the prod Hetzner VPS
  (`/var/www/camidi/` on `167.233.138.109`), then `chmod`s it over SSH using the
  `camidi-hetzner` key (see `package.json`). It is a manual step run from the
  developer's local machine (Windows — hence the `%USERPROFILE%` paths) and is
  decoupled from `git push origin main`; pushing to `main` never deploys prod
  by itself. Live in production since 2026-07-01.
- `npm run deploy:demo` publishes the demo build to the GitHub Pages `demo/` subfolder; this remains the demo deploy target.
- `npm run deploy:staging` builds (`.env` already points `VITE_DIRECTUS_URL` at
  the dev Directus, `cms.blasalviz.com`, so no special mode is needed) and
  `rsync`s `dist/` to `/var/www/tableorders-staging/`, served by nginx at
  `https://to-staging.blasalviz.com` (HTTP basic auth, config at
  `~/services/nginx-tableorders-staging.conf`). This runs locally on the VPS —
  no SSH. It exists so Slack/`claude-runner` (headless, phone-driven) sessions
  can build and deploy immediately for on-device testing.
- Run `npm run build` before considering code changes complete unless the task
  is docs-only. Use `npm.cmd` on PowerShell if `npm.ps1` is blocked.

## Deployment And Safety Rules
- Before source changes, pull latest `main` with `git pull origin main` when the
  working tree allows it. Do not overwrite or revert unrelated dirty work.
- Ask before installing dependencies, deleting files, clearing data, touching
  secrets/auth/production data, committing, pushing, or deploying — **except**
  `git commit`/`push` to the `staging` branch and `npm run deploy:staging`,
  which are pre-approved for headless/Slack sessions (see Branch Model below).
- Prod deployment (`npm run deploy:prod`) is decoupled from `main`: it runs
  manually from the developer's local machine over SSH and never fires on
  push or merge. Do not assume a merge to `main` is live in production —
  confirm with the user whether `deploy:prod` has actually been run.
- After an approved commit and push to `main`, run `npm run deploy:demo` for the
  demo build. Prod deploy is a separate, explicit action — ask before running
  `npm run deploy:prod`, since it pushes to the live restaurant.
- Avoid changing generated `dist/` or `dist-demo/` unless the task is deployment
  or build-artifact related.
- Keep docs and implementation aligned. If sync, deployment, data model, auth,
  demo mode, or table-management behavior changes, update both session-memory
  files together.

## Branch Model
- `main`: reviewed, human-approved code only. The only branch `deploy:prod` is
  ever built from. Interactive sessions (this VPS or the Windows machine) ask
  before committing/pushing here, per the safety rules above.
- `staging`: headless, phone/Slack-driven work via `claude-runner`. Those
  sessions commit and push to `staging` (not `main`) and run
  `npm run deploy:staging` after every change without asking, since staging is
  disposable and isolated from prod. Interactive sessions review `staging`'s
  commits and cherry-pick/merge what's worth keeping into `main` when the user
  is at their local machine — that merge decision, not the staging deploy, is
  the "what goes to production" gate.
- `deploy:prod` never reads from `staging`, directly or indirectly.

## Durable App Behavior
- Core views are `login`, `tables`, `order`, `ticket`, `split`,
  `splitConfirm`, `splitDone`, `dailySales`, `analytics`, and `admin`.
- Shell navigation applies to `tables`, `dailySales`, `analytics`, and `admin`.
  Wide layouts use a left sidebar; mobile shows a bottom nav only for Floor and
  Sales. Admin-only Analytics and Menu entries live in the sidebar on wide
  screens and in `ProfileMenu` on mobile.
- `UIContext` persists dark mode and text size in `ui_dark_mode` and
  `ui_text_scale`. Dark mode sets `data-theme` on `<html>`; text size uses
  app-level zoom values from `TEXT_SCALE_ZOOM`, with container height adjusted
  to avoid zoom clipping.
- `ScreenHeader` centralizes top bars. On shell views, wide layouts suppress
  redundant back/profile controls because navigation lives in the sidebar.
- `TABLES` is an empty fallback. Permanent tables are fetched from Directus
  `restaurant_tables`, cached in `permanent_tables_cache` (localStorage), and
  exposed as `permanentTables` in `TableContext`. The hardcoded list has been
  removed; the only scenario where `TABLES` matters is a cold-cache device with
  Directus unreachable on first load.
- Staff can add temporary overflow tables during service. They are local-only in
  `dynamic_tables`, use `ext-*` ids, are resolved through
  `resolveTableDisplayId`, and are removed when the table closes.
- Table swap uses a 500ms long press and swaps orders, sent batches, marked
  batches, Gutschein amounts, and seated status.
- Sent items are locked; only unsent quantities can be edited. Item splits
  expand quantities into individual units for granular payment.
- Clipboard export is the current kitchen/payment integration.
- Status colors come from `STATUS_CONFIG` and are reused for table status,
  batch status, and swap highlights.

## Data, Sync, And Bills
- Table sessions live in Directus `table_sessions`; orders write with a 500ms
  debounce and sessions poll every 2 seconds.
- Bills poll every 5 seconds for the selected business day. Bills are never
  deleted; table sessions are deleted on close, and close is irreversible
  in-app.
- A business day runs from `BUSINESS_DAY_START_HOUR` (5am Berlin) to 4:59:59am
  the next day. The cutoff is defined in `appConfig.ts` and applied in
  `directusBills.ts`, `analytics.ts`, and demo services. Berlin timezone is
  hardcoded.
- Dirty table state stores a last-synced base snapshot/hash and uses
  three-way base/local/remote comparison on offline or failed-write recovery.
  Normal online edits must not open conflict modals just because local differs
  from the last poll.
- Menu/order item IDs may be numeric from Directus/static data. Local cache and
  conflict validators must accept string and number IDs; normalize only for
  hashing/comparison.
- Bills are optimistic: temporary client IDs are replaced by Directus IDs after
  writes succeed.
- Bills carry `session_id`; all bills from one table close share one UUID.
  Analytics counts distinct session IDs so split bills do not inflate the
  Tables KPI; legacy bills without `session_id` each count as 1 table.
- Split metadata is persisted in `bills.split_data`; `split_guests` stores the
  durable guest count for equal and item splits.
- Marked batches are stable string batch IDs, not positional array indices.
  Legacy numeric marks are migrated on read.
- Paid bills should be modified through named `AppContext` actions, not by
  mutating `paidBills` directly. Bill edit mode is local until "Done"; "Cancel"
  restores the snapshot.

## Menu, Admin, Analytics, And Demo
- `MenuContext` fetches menu and subcategories in parallel on app start (3
  retries, 800ms backoff). Both are cached in localStorage: `menu_cache` and
  `subcategories_cache`. On Directus failure the cached values are used; on
  cold-cache with no Directus, menu falls back to the empty `MENU` constant and
  subcategories fall back to `{}` (no filter chips shown).
- Subcategories live in the Directus `subcategories` collection and are fetched
  by `directusSubcategories.ts`. IDs use a compound slug convention:
  `{category}_{name}` (e.g. `food_warm`, `drinks_cocktail`, `wines_red`).
  This guarantees uniqueness across categories for multi-client use. The four
  constant arrays in `constants.ts` are now empty fallbacks only.
- `menu_items.subcategory` stores compound slugs matching `subcategories.id`.
  Do not use short slugs (`warm`, `cocktail`) — they are ambiguous across
  categories. `WINE_TYPES` in `AdminView` is a separate hardcoded list for
  `menu_item_variants.bottle_subcategory` and is intentionally not part of the
  subcategories collection.
- Subcategory management UI (add/rename/archive via AdminView) is not yet built.
  Currently subcategories are managed directly in Directus.
- Admin edits write through `directusAdmin.ts`; leaving `AdminView` after dirty
  edits calls `MenuContext.reloadMenu()` which re-fetches both menu and
  subcategories.
- `AdminView` groups menu items as Food, Wines, Drinks, Shop; supports search,
  collapse, optimistic availability toggles with rollback, item edits, variant
  price edits/additions/deletions, and new item creation.
- Simple menu items store `price` on `menu_items`; variant items use
  `menu_item_variants`. New items default to `available: true` and
  `sort_order: 99`.
- Daily Sales has Timeline and Sales tabs. The Sales tab contains revenue/POS
  summaries and an article crossing view sortable by category or POS ID.
- Analytics reads `bills` and `bill_items` over period ranges and computes KPI
  deltas, revenue timeline, category mix, top items, weekday pattern, peak
  hours, top tables, and deterministic insight text. Table labels must go
  through `resolveTableDisplayId` so dynamic table names render correctly.
- Demo mode is enabled by `VITE_DEMO_MODE=true`. Directus services route to
  `src/demo/demoServices.ts`, login is bypassed, `DemoBanner` is shown, and
  localStorage-backed seed sessions/bills reset after 10 minutes or via the demo
  reset action.

## Focused Docs
- Directus schemas and query assumptions: `docs/DIRECTUS_SCHEMA.md`.
- Hard sync/system invariants: `docs/SYSTEM_INVARIANTS.md`.
- Documentation memory rules: `docs/DOCUMENTATION_MEMORY_RULES.md`.

## Implementation Guidelines
- Keep the app mobile-first and touch-friendly.
- Preserve existing context/service boundaries before adding abstractions.
- Preserve optimistic update, rollback, snapshot, and retry behavior.
- Prefer focused changes over broad cleanup. This app is used operationally.
- Confirm destructive user actions in UI, especially closing tables and clearing
  sales.
- Be careful with Directus field names. They mirror production collections:
  `categories`, `subcategories`, `menu_items`, `menu_item_variants`, `bills`,
  `bill_items`, and `table_sessions`.

## Verification
- Primary verification for code changes: `npm run build`.
- Type-check with `npm.cmd exec tsc -- --noEmit`.
- Unit tests run with `npm test` and cover bill factories, session storage,
  conflict detection, batch marks, `TableContext`, and `useDirectusSync`.
- For UI behavior changes, run `npm run dev` and manually check affected flows
  at mobile and tablet/desktop widths.
- For sync, bill creation, POS crossing, clearing sales, split payments, or demo
  mode, verify the relevant service calls/cache updates and localStorage keys.

## Known Limitations
- No kitchen backend, print integration, payment integration, or shift
  management.
- Polling-based sync instead of WebSockets.
- Manual conflict resolution only; no OT/CRDT.
- Berlin timezone and permanent table list are not configurable.
- The Cloudflare Worker proxy is no longer in use. Do not add it back without
  changing `VITE_DIRECTUS_URL` and the auth flow.
