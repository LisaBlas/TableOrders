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
- **Inline styles** — pure JS objects via `S` object in `appStyles.js`, no CSS-in-JS library
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
├── contexts/
│   ├── AuthContext.tsx           # Authentication state + token management
│   ├── AppContext.tsx            # Global UI state + all paid-bill actions (syncs to Directus)
│   ├── TableContext.tsx          # All table/order state and actions (syncs to Directus table_sessions)
│   ├── MenuContext.tsx           # Live menu from Directus, falls back to constants.js
│   └── SplitContext.tsx          # Split payment state machine
├── hooks/
│   ├── useTableOrder.ts          # Derived order state for a specific table
│   ├── useLocalStorage.ts        # Persistent state hook
│   ├── useMenuItems.ts           # Filtered/grouped menu items for OrderView
│   └── useBreakpoint.ts          # Responsive breakpoint detection (mobile/tablet/desktop)
├── services/
│   ├── directusMenu.ts           # fetchMenu() — GET menu_items from Directus
│   ├── directusBills.ts          # fetchBillsByDate, createBillInDirectus, patchBill/Item, clearToday
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
│   ├── OrderBar.tsx              # Collapsible bottom slider (unsent items / sent batches)
│   ├── SentBatchCard.tsx         # Sent batch list (used in bill view)
│   ├── BillView.tsx              # Full bill breakdown
│   ├── BillCard.tsx              # Per-bill card in daily sales (supports edit mode + item crossing)
│   ├── BillTab.tsx               # Bill tab controls
│   ├── Modal.tsx                 # Generic confirm modal
│   ├── Toast.tsx                 # Auto-dismiss notification
│   ├── ErrorBoundary.tsx         # Top-level error boundary
│   ├── MenuItemCard.tsx          # Menu grid item
│   ├── MenuItemRow.tsx           # Menu list item
│   ├── MenuGrid.tsx              # Responsive menu grid component (subcategory grouping)
│   ├── NoteBottomSheet.tsx       # Item note input
│   ├── VariantBottomSheet.tsx    # Item variant picker
│   ├── Receipt.tsx               # Printable receipt
│   ├── SalesSummary.tsx          # Daily sales summary stats
│   └── icons.tsx                 # SVG icon components (BackIcon, BillIcon, SalesIcon)
├── data/
│   └── constants.js              # Tables config, static menu fallback, STATUS_CONFIG
├── utils/
│   ├── helpers.js                # getTableStatus, getItemDestination, formatting
│   ├── migration.ts              # Legacy bill migration (adds posId to pre-Directus bills)
│   ├── billFactory.ts            # Bill creation factories (createFullTableBill, createEqualSplitTableBill, etc.)
│   └── salesAggregation.ts       # POS entry aggregation for Daily Sales view
├── styles/
│   └── appStyles.js              # All inline style definitions (S object) + responsive variants
└── types/
    └── index.ts                  # Shared TypeScript types (Bill, OrderItem, TableSession, etc.)
```

## Data Model

### Table Sessions (persisted in Directus — `table_sessions` collection)
```js
{
  id: number,               // Auto-increment ID
  table_id: string,         // e.g., "1", "2", ..., "11"
  seated: boolean,          // Is table seated?
  gutschein: number | null, // Gutschein amount
  orders: OrderItem[],      // Full order state (unsent + sent)
  sent_batches: Batch[],    // Sent order batches with timestamps
  marked_batches: number[]  // Array of batch indices marked as delivered
}
```

### Orders (state — synced to table_sessions every 500ms)
```js
{
  [tableId]: [
    {
      id: string,           // Menu item UUID
      name: string,
      price: number,
      qty: number,          // Total quantity ordered
      sentQty: number,      // Quantity sent to kitchen
      posId?: string,       // POS system ID
      posName?: string,     // POS display name
      category?: string,
      subcategory?: string,
      destination?: string, // bar/counter/kitchen
      baseId?: string,      // Variant parent ID
      variantType?: string, // Variant type
      note?: string
    }
  ]
}
```

### Split Payment (state)
```js
{
  splitRemaining: [{ ...item, _uid, qty: 1 }], // expanded items
  splitSelected: Set<uid>,
  splitPayments: [{ guestNum, items, total }],
  splitMode: "equal" | "item"
}
```

### Paid Bills (persisted in Directus — `bills` + `bill_items` collections)
```js
// bills
{
  directusId: UUID,        // Directus record ID
  tempId?: string,         // Client-only optimistic ID (not persisted)
  tableId: number,
  total: number,
  gutschein?: number,
  tip?: number,
  timestamp: ISO string,   // UTC timestamp (Berlin day bounds used for filtering)
  paymentMode: "full" | "equal" | "item",
  splitData?: { guests: number },
  addedToPOS?: boolean,    // Bill marked as added to POS system
  cleared_at?: ISO string, // Soft delete timestamp (set by "Clear Daily Sales")
  items: [...]             // Populated via O2M from bill_items
}

// bill_items
{
  directusId: UUID,
  bill_id: UUID,           // FK → bills
  item_id: string,         // Original menu item UUID
  item_name: string,
  pos_id?: string,
  pos_name?: string,
  price: number,
  qty: number,
  category?: string,
  subcategory?: string,
  crossed_qty: number      // Items entered into POS (0 by default; incremented via UI)
}
```

## Views (State Machine)
- `login` — Authentication form (blocks app until logged in)
- `tables` — Floor overview, table grid, daily sales button
- `order` — Menu selection, order building, send to kitchen
- `ticket` — Bill view, split options, close table
- `split` — Equal or item-based split flow
- `splitConfirm` — Guest payment confirmation (item split only)
- `splitDone` — Final split summary
- `close` — Destructive table close confirmation
- `dailySales` — Revenue summary, list of all paid bills, aggregated POS view, date picker, clear day action

## Key Behaviors
- **Authentication required** — App blocked until login with valid credentials
- **Real-time multi-device sync** — Table state (orders, batches, gutschein, seated) synced to Directus every 500ms (debounced); fetched every 2 seconds
- **Conflict resolution** — Remote state overwrites local after 3-second grace period; prevents race conditions during debounce window
- **Optimistic bill creation** — Bills added to cache immediately with `tempId`; replaced with `directusId` on successful Directus write
- **Unsent items** can be modified (qty +/-)
- **Sent items** are locked, shown in batch history
- **Table swap** — long-press (500ms) activates swap mode; tap destination table; all state swapped bidirectionally (orders, sentBatches, markedBatches, gutscheinAmounts, seated status)
- **Batch colour coding** — sent batch sections show a red left-border accent when pending delivery, green when marked; the collapsed slider shows a matching status dot
- **Split by item** expands qty > 1 into individual units for granular splitting
- **Clipboard integration** for order/ticket export (no kitchen backend)
- **Toast notifications** (2s auto-dismiss) for user feedback
- **Paid bills saved** to Directus automatically when table closes — cross-device, persistent
- **Menu loaded from Directus** on app start; static constants.js used as fallback if offline
- **Table sessions persisted to Directus** — orders, sentBatches, markedBatches, gutschein, seated status all survive refresh and sync across devices
- **Bill edit mode** — mutations are local-only until "Done"; Directus sync fires on exit; Cancel restores snapshot
- **Item-level POS crossing** — increment/decrement `crossed_qty` for individual items; syncs to Directus via `patchBillItem`
- **Clear Daily Sales** — soft-deletes today's bills (sets cleared_at); data preserved for analytics
- **Date picker** — view historical bills by Berlin timezone calendar day
- **Responsive layouts** — `useBreakpoint()` hook provides mobile/tablet/tabletLandscape/desktop breakpoints; adaptive grid/list views

## Limitations & Trade-offs
- **Hardcoded credentials** — Auth uses static username/password; no per-user roles or multi-tenant support
- **No backend** — orders copied to clipboard instead of sent to kitchen system
- **No print integration** — clipboard export only
- **Manual day reset** — "Clear Daily Sales" must be used manually at end of shift
- **Berlin timezone hardcoded** — `todayBerlinDate()` and `berlinDayBoundsUTC()` assume Europe/Berlin; not configurable
- **2-second polling overhead** — Table sessions refetch every 2s; could be optimized with WebSockets for lower latency
- **500ms debounce on writes** — Balance between responsiveness and API load; may feel sluggish on slow connections
- **No conflict merge strategy** — Remote state overwrites local; last-write-wins model (no operational transform)

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
- **Reversible actions** — Confirm destructive operations (close table, clear day)
- **Copy > integrate** — Clipboard export for rapid prototyping
- **Real-time sync** — Multi-device coordination via polling (eventual consistency model)

## Directus Collections
| Collection | Purpose |
|---|---|
| `categories` | Menu categories (name, sort_order) |
| `menu_items` | Menu items with M2O to categories |
| `menu_item_variants` | Size/type variants (small, large, bottle here, bottle to go) |
| `bills` | One record per payment — analytics source of truth |
| `bill_items` | One record per line item (FK → bills) |
| `table_sessions` | Real-time table state (orders, batches, gutschein, seated) — one record per active table |

Bills are never hard-deleted. `cleared_at` is set by "Clear Daily Sales".
Analytics queries filter by `timestamp` range and ignore `cleared_at`.

Table sessions are deleted when table closes (no historical tracking).

## Notes
- Restaurant name ("Käserei Camidi") hardcoded in ticket view (`BillTab.tsx`)
- 11 tables hardcoded (easy to change in constants.js)
- Euro currency symbol hardcoded (€)
- Menu categories: Food, Drinks, Wines, Shop (driven by Directus `categories` collection)
- Status colors defined in `STATUS_CONFIG` (constants.js): open=blue, seated=yellow, unconfirmed=red, confirmed=green — reused in batch colouring and swap mode highlights
- Table swap uses long-press (500ms threshold, `LONG_PRESS_MS` constant) — `longFiredRef` guards normal taps but is bypassed in swap mode to allow target selection
- `AppContext` exposes named bill action functions (`addPaidBill`, `clearTodayBills`, `markBillAddedToPOS`, `removePaidBillItem`, `restorePaidBillItem`, etc.) — do not manipulate `paidBills` directly
- Auth credentials stored in localStorage key `authToken` (JWT-like format but no server-side validation)
- Berlin timezone handling: `todayBerlinDate()` uses Intl.DateTimeFormat; `berlinDayBoundsUTC()` calculates UTC bounds accounting for DST
- Responsive breakpoints defined in `useBreakpoint()`: mobile < 768px, tablet 768-1023px, tabletLandscape 1024-1439px, desktop >= 1440px
- POS crossing tracked via `crossed_qty` field (incremented when item entered into POS, decremented if restored)
- Optimistic updates use `tempId` prefix to distinguish from `directusId` (replaced on successful write)
- Table state conflict resolution: `lastWriteTime` tracked per table; 3-second grace period before accepting remote overwrites
