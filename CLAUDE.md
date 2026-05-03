# TableOrders — Restaurant Order Management System

## Project Overview
Mobile-first React app for restaurant table management, order taking, and bill processing.
Built for speed and simplicity — optimized for multi-device, front-of-house use with real-time synchronization.

## Core Features
1. **Authentication** — Token-based login (hardcoded credentials: `camidi` / `fonduefortwo`)
2. **Floor Management** — Visual table grid with real-time status (Open, Seated, Ordered, Confirmed)
3. **Table Swap** — Long-press any table to enter swap mode; tap a second table to exchange all state (orders, batches, gutschein, seated status) between both tables
4. **Order Taking** — Category-based menu with qty controls, unsent/sent order tracking
5. **Sent Batch Tracking** — Each sent batch is shown in a collapsible slider; batches are individually mark/unmark-able as delivered
6. **Bill Generation** — Per-table tickets with copy-to-clipboard for kitchen/payment
7. **Bill Splitting** — Two modes:
   - Equal split: divide total by guest count
   - Item split: per-item selection, round-by-round payment tracking
8. **Table Closing** — Receipt summary with category subtotals, destructive confirmation
9. **Daily Sales Tracking** — Persistent record of all paid bills with revenue totals, accessible from homepage
10. **POS Integration** — Item-level crossing tracker (mark items as entered into POS), aggregated POS view by item
11. **Historical Date Picker** — View sales for any past date, not just today
12. **Responsive Design** — Adaptive layouts for mobile, tablet portrait, tablet landscape, desktop
13. **Multi-Device Sync** — Real-time table state synchronization across devices via Directus polling

## Tech Stack
- **React 18** with TypeScript (Vite)
- **Inline styles** — `S` object in `appStyles.js`; design tokens (colors, radii) in `tokens.ts`
- **State** — React Context (AuthContext + AppContext + TableContext + MenuContext + SplitContext), TanStack Query for server state
- **Directus CMS** — headless CMS for menu data, paid bills, and table sessions (SQLite, REST API)
  - **Authentication** — Static token in `.env` file (VITE_DIRECTUS_TOKEN)
- **Real-time Sync** — 2-second polling for table sessions, 5-second polling for bills (today only)
- **DM Sans** font (Google Fonts)

## Project Structure
```
src/
├── main.jsx                      # Entry point
├── index.css                     # Global reset
├── App.tsx                       # Root: auth guard + view routing + QueryClientProvider + context providers
├── config/
│   └── appConfig.ts              # Central runtime constants (LONG_PRESS_MS, DEBOUNCE_DELAY_MS, POLL_INTERVAL_MS, OWNERSHIP_GRACE_MS, MAX_RETRIES, RESTAURANT_NAME, TIMEZONE)
├── contexts/
│   ├── AuthContext.tsx           # Authentication state + token management
│   ├── AppContext.tsx            # Global UI state + all paid-bill actions (syncs to Directus)
│   ├── TableContext.tsx          # All table/order state and actions (syncs to Directus table_sessions); exposes dynamicTables + addDynamicTable + resolveTableDisplayId
│   ├── MenuContext.tsx           # Live menu from Directus, falls back to constants.ts; exposes menu + minQty2Ids
│   └── SplitContext.tsx          # Split payment state machine
├── hooks/
│   ├── useTableOrder.ts          # Derived order state for a specific table
│   ├── useLocalStorage.ts        # Persistent state hook
│   ├── useMenuItems.ts           # Filtered/grouped menu items for OrderView
│   ├── useBreakpoint.ts          # Responsive breakpoint detection (mobile/tablet/desktop)
│   ├── useDirectusSync.ts        # Polling + debounced writes + conflict resolution for table sessions; exposes syncError
│   ├── useTableClose.ts          # Close flow logic (payment, tip, cleanupTable)
│   ├── useTableSwap.ts           # Long-press swap state machine
│   ├── useLongPress.ts           # Generic long-press hook (500ms threshold)
│   ├── useBillEdit.ts            # Bill edit mode helpers
│   └── useSubcategoryState.ts    # Subcategory expand/collapse state for menu
├── services/
│   ├── directusMenu.ts           # fetchMenu() — GET menu_items from Directus
│   ├── directusBills.ts          # fetchBillsByDate, createBillInDirectus, patchBill/Item
│   └── directusSessions.ts       # fetchTableSessions, upsertSession, deleteSession (real-time table state)
├── views/
│   ├── LoginView.tsx             # Authentication form
│   ├── TablesView.tsx            # Floor grid, table swap (long-press), status legend
│   ├── OrderView.tsx             # Menu + order bar + sent batches
│   ├── TicketView.tsx            # Bill view
│   ├── DailySalesView.tsx        # Revenue summary (reads from Directus bills collection) + POS aggregation view
│   ├── SplitItemView.tsx         # Item-by-item split
│   ├── SplitEqualView.tsx        # Equal split
│   ├── SplitConfirmView.tsx      # Guest payment confirmation
│   └── SplitDoneView.tsx         # Final split summary
├── components/
│   ├── TableCard.tsx             # Individual table card (status, swap highlighting, destination dot)
│   ├── OrderBar.tsx              # Collapsible bottom slider (unsent items / sent batches)
│   ├── SentBatchCard.tsx         # Sent batch list (used in bill view)
│   ├── BillView.tsx              # Full bill breakdown
│   ├── BillHeader.tsx            # Bill header: brand, date, edit toggle, gutschein button
│   ├── BillCard.tsx              # Per-bill card in daily sales (supports edit mode + item crossing)
│   ├── BillTab.tsx               # Bill tab controls
│   ├── Modal.tsx                 # Generic confirm modal
│   ├── Toast.tsx                 # Auto-dismiss notification
│   ├── ErrorBoundary.tsx         # Error boundary — full-page (default) or inline card (inline prop)
│   ├── ConflictResolutionModal.tsx # 3-way conflict UI (local / remote / merge)
│   ├── RetryModal.tsx            # Non-dismissible retry modal for write failures
│   ├── SwapSheet.tsx             # Swap confirmation bottom sheet
│   ├── CustomItemModal.tsx       # Freeform custom item creation (name, price, qty)
│   ├── GutscheinModal.tsx        # Voucher amount input modal
│   ├── PaymentPanel.tsx          # Payment amount input with tip display
│   ├── SplitOptions.tsx          # Split mode selector buttons (equal / by item)
│   ├── MenuItemCard.tsx          # Menu grid item
│   ├── MenuItemRow.tsx           # Menu list item
│   ├── MenuGrid.tsx              # Responsive menu grid component (subcategory grouping)
│   ├── NoteBottomSheet.tsx       # Item note input
│   ├── VariantBottomSheet.tsx    # Item variant picker
│   ├── Receipt.tsx               # Printable receipt
│   ├── SalesSummary.tsx          # Daily sales summary stats
│   └── icons.tsx                 # SVG icon components (BackIcon, BillIcon, SalesIcon)
├── data/
│   └── constants.ts              # Tables config (TABLES), static menu (MENU), STATUS_CONFIG, subcategory lists, MIN_QTY_2_IDS
├── utils/
│   ├── helpers.ts                # getTableStatus, getItemDestination, expandItems, consolidateItems
│   ├── batchGrouping.ts          # groupByDestination — splits order items into bar/counter/kitchen groups
│   ├── batchMarks.ts             # createBatchId, batchMarkId, normalizeMarkedBatchIds (legacy number→string migration)
│   ├── conflictDetection.ts      # detectDirtySessionConflicts, mergeSessions (3-way merge)
│   ├── sessionStorage.ts         # Full localStorage session layer: cache, dirty records, sync meta, sessionHash
│   ├── migration.ts              # Legacy bill migration (adds posId to pre-Directus bills)
│   ├── billFactory.ts            # Bill creation factories (createFullTableBill, createEqualSplitTableBill, etc.)
│   ├── salesAggregation.ts       # POS entry aggregation for Daily Sales view
│   └── fetchWithRetry.ts         # Exponential backoff retry helper (used by MenuContext)
├── styles/
│   ├── appStyles.js              # All inline style definitions (S object) + responsive variants
│   └── tokens.ts                 # Design tokens: colors palette + border radii
└── types/
    └── index.ts                  # Shared TypeScript types (Bill, OrderItem, TableSession, DynamicTable, Destination, etc.)
```

## Data Model
→ Full schemas, query patterns, and integrity rules: [`docs/DIRECTUS_SCHEMA.md`](docs/DIRECTUS_SCHEMA.md)

Key shapes:
- **`table_sessions`** — active table state (orders, sentBatches, markedBatches, gutschein, seated); deleted on close
- **`bills` + `bill_items`** — one record per payment, never deleted; `bill_items.crossed_qty` tracks POS entries
- **`OrderItem`** — `qty` (total ordered) / `sentQty` (sent to kitchen); unsent = `qty - sentQty > 0`; `destination` field routes to bar/counter/kitchen
- **`Batch.id`** — stable string ID, never positional; `markedBatches` keyed by these
- **Split Payment** — `splitRemaining` expands qty > 1 into individual units; `splitPayments` records per-guest totals
- **`tempId`** — optimistic bill prefix (client-only); replaced with `directusId` on Directus write
- **`appConfig.ts`** — single source of truth for all timing/retry constants; change here, not inline

## Views (State Machine)
- `login` — Authentication form (blocks app until logged in)
- `tables` — Floor overview, table grid, daily sales button
- `order` — Menu selection, order building, send to kitchen
- `ticket` — Bill view, split options, close table (close confirmation is a Modal inside this view, not a separate route)
- `split` — Equal or item-based split flow
- `splitConfirm` — Guest payment confirmation (item split only)
- `splitDone` — Final split summary
- `dailySales` — Revenue summary, list of all paid bills, aggregated POS view, date picker

## Key Behaviors
- **Authentication required** — App blocked until login with valid credentials
- **Real-time multi-device sync** — Table state (orders, batches, gutschein, seated) synced to Directus every 500ms (debounced); fetched every 2 seconds
- **Conflict resolution** — Dirty local table sessions store a last-synced base snapshot/hash; reconnect uses three-way comparison (base/local/remote) before prompting
- **Conflict prompts are recovery-only** — Normal online table edits may create short-lived dirty local records for refresh safety, but conflict detection should only prompt during offline→online recovery or failed-write retry paths
- **Optimistic bill creation** — Bills added to cache immediately with `tempId`; replaced with `directusId` on successful Directus write
- **Split bill metadata** — Persisted in `bills.split_data` for both equal splits (`{ guests }`) and item splits (`{ payments }`); `split_guests` stores the durable guest count for both split modes
- **Unsent items** can be modified (qty +/-)
- **Sent items** are locked, shown in batch history
- **Custom items** — staff can add freeform items (name, price, qty) via `addCustomItem`; IDs prefixed `custom-{timestamp}`, never clash with menu IDs
- **Order destination routing** — `getItemDestination` auto-assigns each item to bar / counter / kitchen based on category/subcategory/id prefix; shown as emoji on `TableCard`; used in clipboard export grouping
- **MIN_QTY_2_IDS** — Cheese Plate, Raclette, Fondue, Fondue Alkoholfrei enforce a minimum qty of 2 per order; set is exported from `constants.ts` and passed through `MenuContext.minQty2Ids`
- **Dynamic tables** — `addDynamicTable(label, location)` creates ad-hoc tables beyond the hardcoded list; persisted to localStorage key `dynamic_tables`; `resolveTableDisplayId` resolves display names for both static and dynamic tables
- **Table swap** — long-press (500ms) activates swap mode; tap destination table; all state swapped bidirectionally (orders, sentBatches, markedBatches, gutscheinAmounts, seated status)
- **Batch colour coding** — sent batch sections show a red left-border accent when pending delivery, green when marked; the collapsed slider shows a matching status dot
- **Marked batches** are keyed by stable `Batch.id` strings, with legacy timestamp fallback; never store positional batch indices
- **Split by item** expands qty > 1 into individual units for granular splitting
- **Clipboard integration** for order/ticket export (no kitchen backend)
- **Toast notifications** (2s auto-dismiss) for user feedback
- **Paid bills saved** to Directus automatically when table closes — cross-device, persistent
- **Menu loaded from Directus** on app start; retried up to 3x (800ms exponential backoff) before falling back to static constants.ts
- **Offline indicator** — amber banner shown at the top of all views when the sessions polling query fails after TanStack Query's default retries (~7s of persistent failure)
- **Table close is irreversible in-app** — paid bills remain in Daily Sales/POS workflow; mistaken closes are handled manually by marking the bill as added to POS and recreating the table
- **Bill edit mode** — mutations are local-only until "Done"; Directus sync fires on exit; Cancel restores snapshot
- **Item-level POS crossing** — increment/decrement `crossed_qty` for individual items; syncs to Directus via `patchBillItem`
- **Date picker** — view historical bills by Berlin timezone calendar day
- **Responsive layouts** — `useBreakpoint()` hook provides mobile/tablet/tabletLandscape/desktop breakpoints; adaptive grid/list views

## Limitations & Trade-offs
- **Hardcoded credentials** — Auth uses static username/password; no per-user roles or multi-tenant support
- **No backend** — orders copied to clipboard instead of sent to kitchen system
- **No print integration** — clipboard export only
- **Berlin timezone hardcoded** — `todayBerlinDate()` and `berlinDayBoundsUTC()` assume Europe/Berlin; not configurable
- **2-second polling overhead** — Table sessions refetch every 2s; could be optimized with WebSockets for lower latency
- **500ms debounce on writes** — Balance between responsiveness and API load; may feel sluggish on slow connections
- **Manual conflict resolution only** — Dirty local table sessions are tracked with base/local/operation metadata in localStorage and conflicts prompt the user to choose local, remote, or merge before retrying. No OT/CRDT; normal online operation still uses a 3s local-ownership grace period around confirmed writes
- **Order IDs can be numeric** — Directus/static menu data may produce numeric `OrderItem.id` values. Session cache validators must accept string or number IDs; hash/canonical comparison can normalize IDs to strings

## Future Improvements (if productionizing)
1. ~~**Persistence**~~ — ✅ Done via Directus (bills + menu + table sessions)
2. ~~**Menu editor**~~ — ✅ Done via Directus admin UI
3. ~~**Auth**~~ — ✅ Done (basic token auth; could add roles/permissions)
4. ~~**Responsive design**~~ — ✅ Done (mobile/tablet/desktop breakpoints)
5. **Analytics dashboard** — Data is in Directus (`bills` + `bill_items`); build a read-only dashboard querying by date range, category, item
6. **Kitchen integration** — WebSocket or polling for order status updates (replace clipboard export)
7. **Receipt printing** — browser print API or thermal printer integration
8. **Multi-table view** — Batch operations, server-assigned tables
9. **Payment integration** — Stripe Terminal, Square POS
10. **Shift management** — Open/close shifts, cash reconciliation
11. **Tax calculation** — Configurable tax rates per item/category
12. **WebSocket sync** — Replace polling with WebSockets for lower latency
13. **User management** — Multi-user auth with roles (admin, staff, viewer)
14. **Timezone configuration** — Make timezone configurable instead of hardcoded Berlin

## Development Commands
```bash
npm install        # Install dependencies
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm.cmd run build  # Windows PowerShell fallback when npm.ps1 is blocked
npm.cmd exec tsc -- --noEmit  # Type-check without building
npm run preview    # Preview production build
npm test           # Run unit tests (vitest)
```

## Environment Setup
Create a `.env` file in the project root:
```env
VITE_DIRECTUS_URL=https://cms.blasalviz.com
VITE_DIRECTUS_TOKEN=your-directus-static-token-here
```

To get a Directus token:
1. Log into Directus admin panel
2. Go to Settings → Access Tokens
3. Create a new static token with read/write permissions for `bills`, `bill_items`, `menu_items`, `categories`, and `table_sessions` collections
4. Copy the token to `.env`
5. Restart the dev server

## Agent Rules
- **Always `git pull origin main` before making any code changes**, regardless of whether the request comes from the terminal or Slack. Never skip this step.
- After changes are committed and pushed, always run `npm run deploy` to publish to GitHub Pages.
- Hard system rules (ref snapshot timing, conflict detection gating, table cleanup) → [`docs/SYSTEM_INVARIANTS.md`](docs/SYSTEM_INVARIANTS.md)

## Deployment Workflow (GitHub Pages)
```bash
# 1. Pull latest source code
git pull origin main

# 2. Make your changes to source files
# (edit src/*, data/*, etc.)

# 3. Commit to main
git add .
git commit -m "Your changes"
git push origin main

# 4. Build + deploy to gh-pages (one command)
npm run deploy
```

## Design Principles
- **Responsive-first** — Mobile (0-767px), tablet portrait (768-1023px), tablet landscape (1024-1439px), desktop (1440px+)
- **Speed over flexibility** — Inline styles, hardcoded config for fast iteration
- **Clarity over cleverness** — Direct state updates, explicit view switching
- **Reversible actions** — Confirm destructive operations (close table)
- **Real-time sync** — Multi-device coordination via polling (eventual consistency model)

## Directus Schema
→ Full schemas: [`docs/DIRECTUS_SCHEMA.md`](docs/DIRECTUS_SCHEMA.md)

Collections: `categories`, `menu_items`, `menu_item_variants`, `bills`, `bill_items`, `table_sessions`
- Bills: **never deleted** — persistent record for accounting and analytics
- Table sessions: **deleted on close** — no historical tracking

## Notes
- Restaurant name ("Käserei Camidi") is defined in two places: hardcoded directly in `BillHeader.tsx`; imported from `appConfig.ts` (`RESTAURANT_NAME`) in `Receipt.tsx`. Both must be updated if the name changes — `BillTab.tsx` itself contains neither (it renders `BillHeader`)
- Tables defined in `constants.ts` (`TABLES` array): Inside — 1, 2, 3, 4, MUT, 10–15, ToGo (13 slots); Outside — A, B, C, Left, Mid, Right (6 slots); plus user-created dynamic tables via `addDynamicTable`
- Euro currency symbol hardcoded (€)
- Menu categories: Food, Drinks, Wines, Shop — "Wines" view combines wines by glass (from `Drinks` key, filtered by `bottleSubcategory`) and static bottles (from `Wines` key); `useMenuItems` handles the merge
- Status colors defined in `STATUS_CONFIG` (`constants.ts`): open=blue, seated=yellow, unconfirmed=red, confirmed=green — reused in batch colouring and swap mode highlights
- Table swap uses long-press (500ms threshold, `LONG_PRESS_MS` in `appConfig.ts`) — `longFiredRef` guards normal taps but is bypassed in swap mode to allow target selection
- `AppContext` exposes named bill action functions (`addPaidBill`, `markBillAddedToPOS`, `removePaidBillItem`, `restorePaidBillItem`, etc.) — do not manipulate `paidBills` directly
- Auth credentials stored in localStorage key `authToken` (JWT-like format but no server-side validation)
- localStorage keys in use: `authToken` (auth), `paidBills` (offline bill fallback), `table_orders_client_id` (stable sync client id), `table_sessions_cache` (offline table state), `table_sessions_dirty` (dirty upsert/delete records with base/local snapshots), `table_sessions_sync_meta` (last synced base hashes), `dynamic_tables` (user-created table slots)
- `syncError` boolean exposed from `TableContext` — sourced from `useDirectusSync` → `useQuery` `isError` on the sessions poll
- `ErrorBoundary` accepts `inline` prop: when true renders a compact "Something went wrong / Try again" card that resets boundary state instead of a full-page reload screen
- Berlin timezone: `todayBerlinDate()` + `berlinDayBoundsUTC()` (DST-aware); bills filtered by Berlin calendar day, not UTC
- Responsive breakpoints defined in `useBreakpoint()`: mobile < 768px, tablet 768-1023px, tabletLandscape 1024-1439px, desktop >= 1440px
- Offline-sync: when refresh loses local orders, verify cached session validation — numeric item IDs can cause valid-looking localStorage sessions to be silently rejected
- Implementation rules (ref snapshot timing, conflict detection gates, table cleanup) → [`docs/SYSTEM_INVARIANTS.md`](docs/SYSTEM_INVARIANTS.md)
- Sync architecture decisions and edge cases → [`docs/MEMORY.md`](docs/MEMORY.md)
- Recent changes log → [`docs/RECENT_CHANGES.md`](docs/RECENT_CHANGES.md)
