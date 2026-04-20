# TableOrders — Restaurant Order Management System

## Project Overview
Mobile-first React app for restaurant table management, order taking, and bill processing.
Built for speed and simplicity — optimized for single-device, front-of-house use.

## Core Features
1. **Floor Management** — Visual table grid with real-time status (Open, Seated, Ordered, Confirmed)
2. **Table Swap** — Long-press any table to enter swap mode; tap a second table to exchange all state (orders, batches, gutschein, seated status) between both tables
3. **Order Taking** — Category-based menu with qty controls, unsent/sent order tracking
4. **Sent Batch Tracking** — Each sent batch is shown in a collapsible slider; batches are individually mark/unmark-able as delivered
5. **Bill Generation** — Per-table tickets with copy-to-clipboard for kitchen/payment
6. **Bill Splitting** — Two modes:
   - Equal split: divide total by guest count
   - Item split: per-item selection, round-by-round payment tracking
7. **Table Closing** — Receipt summary with category subtotals, destructive confirmation
8. **Daily Sales Tracking** — Persistent record of all paid bills with revenue totals, accessible from homepage

## Tech Stack
- **React 18** with TypeScript (Vite)
- **Inline styles** — pure JS objects via `S` object in `appStyles.js`, no CSS-in-JS library
- **State** — React Context (AppContext + TableContext + MenuContext + SplitContext), TanStack Query for server state
- **Directus CMS** — headless CMS for menu data and paid bills (SQLite, REST API)
- **DM Sans** font (Google Fonts)

## Project Structure
```
src/
├── main.jsx                      # Entry point
├── index.css                     # Global reset
├── App.tsx                       # Root: view routing + QueryClientProvider + context providers
├── contexts/
│   ├── AppContext.tsx             # Global UI state + all paid-bill actions (syncs to Directus)
│   ├── TableContext.tsx           # All table/order state and actions
│   ├── MenuContext.tsx            # Live menu from Directus, falls back to constants.js
│   └── SplitContext.tsx          # Split payment state machine
├── hooks/
│   ├── useTableOrder.ts          # Derived order state for a specific table
│   ├── useLocalStorage.ts        # Persistent state hook
│   └── useMenuItems.ts           # Filtered/grouped menu items for OrderView
├── services/
│   ├── directusMenu.ts           # fetchMenu() — GET menu_items from Directus
│   └── directusBills.ts          # fetchTodayBills, createBillInDirectus, patchBill/Item, clearToday
├── views/
│   ├── TablesView.tsx            # Floor grid, table swap (long-press), status legend
│   ├── OrderView.tsx             # Menu + order bar + sent batches
│   ├── TicketView.tsx            # Bill view
│   ├── DailySalesView.tsx        # Revenue summary (reads from Directus bills collection)
│   ├── SplitItemView.tsx         # Item-by-item split
│   ├── SplitEqualView.tsx        # Equal split
│   ├── SplitConfirmView.tsx      # Guest payment confirmation
│   └── SplitDoneView.tsx         # Final split summary
├── components/
│   ├── OrderBar.tsx              # Collapsible bottom slider (unsent items / sent batches)
│   ├── SentBatchCard.tsx         # Sent batch list (used in bill view)
│   ├── BillView.tsx              # Full bill breakdown
│   ├── BillCard.tsx              # Per-bill card in daily sales
│   ├── BillTab.tsx               # Bill tab controls
│   ├── Modal.tsx                 # Generic confirm modal
│   ├── Toast.tsx                 # Auto-dismiss notification
│   ├── ErrorBoundary.tsx         # Top-level error boundary
│   ├── MenuItemCard.tsx          # Menu grid item
│   ├── MenuItemRow.tsx           # Menu list item
│   ├── NoteBottomSheet.tsx       # Item note input
│   ├── VariantBottomSheet.tsx    # Item variant picker
│   ├── Receipt.tsx               # Printable receipt
│   └── SalesSummary.tsx          # Daily sales summary stats
├── data/
│   └── constants.js              # Tables config, static menu fallback, STATUS_CONFIG
├── utils/
│   ├── helpers.js                # getTableStatus, getItemDestination, formatting
│   └── migration.ts              # Legacy bill migration (adds posId to pre-Directus bills)
├── styles/
│   └── appStyles.js              # All inline style definitions (S object)
└── types/
    └── index.ts                  # Shared TypeScript types (Bill.directusId, OrderItem.directusId)
```

## Data Model
### Orders (state)
```js
{
  [tableId]: [
    { id, name, price, qty, sent: boolean }
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
  tableId: number,
  total: number,
  gutschein?: number,
  tip?: number,
  timestamp: ISO string,
  paymentMode: "full" | "equal" | "item",
  splitData?: { guests: number },
  addedToPOS?: boolean,
  // cleared_at set by "Clear Daily Sales" (soft delete — data preserved for analytics)
  items: [...]             // populated via O2M from bill_items
}

// bill_items
{
  directusId: UUID,
  bill_id: UUID,           // FK → bills
  item_id: string,         // original menu item UUID
  item_name: string,
  pos_id?: string,
  pos_name?: string,
  price: number,
  qty: number,
  category?: string,
  subcategory?: string,
  crossed_qty: number      // items entered into POS (operational tracking)
}
```

## Views (State Machine)
- `tables` — Floor overview, table grid, daily sales button
- `order` — Menu selection, order building, send to kitchen
- `ticket` — Bill view, split options, close table
- `split` — Equal or item-based split flow
- `splitConfirm` — Guest payment confirmation (item split only)
- `splitDone` — Final split summary
- `close` — Destructive table close confirmation
- `dailySales` — Revenue summary, list of all paid bills, clear day action

## Key Behaviors
- **Unsent items** can be modified (qty +/-)
- **Sent items** are locked, shown in batch history
- **Table swap** — long-press (500ms) activates swap mode; tap destination table; all state swapped bidirectionally (orders, sentBatches, markedBatches, gutscheinAmounts, seated status)
- **Batch colour coding** — sent batch sections show a red left-border accent when pending delivery, green when marked; the collapsed slider shows a matching status dot
- **Split by item** expands qty > 1 into individual units for granular splitting
- **Clipboard integration** for order/ticket export (no backend)
- **Toast notifications** (2s auto-dismiss) for user feedback
- **Paid bills saved** to Directus automatically when table closes — cross-device, persistent
- **Menu loaded from Directus** on app start; static constants.js used as fallback if offline
- **localStorage** for active orders only (survives refresh); paid bills are in Directus
- **Bill edit mode** — mutations are local-only until "Done"; Directus sync fires on exit; Cancel restores snapshot
- **Clear Daily Sales** — soft-deletes today's bills (sets cleared_at); data preserved for analytics

## Limitations & Trade-offs
- **Partial persistence** — active orders persist in localStorage; sentBatches, markedBatches, gutscheinAmounts lost on refresh (in-memory only)
- **No backend** — orders copied to clipboard instead of sent to kitchen system
- **No auth** — Directus public API, no per-device auth; single-session use case
- **No print integration** — clipboard export only
- **Manual day reset** — "Clear Daily Sales" must be used manually at end of shift
- **UTC timestamps** — bills stored in UTC; at midnight local time, bills may span two UTC days (non-issue for typical restaurant hours)

## Future Improvements (if productionizing)
1. ~~**Persistence**~~ — ✅ Done via Directus (bills + menu)
2. ~~**Menu editor**~~ — ✅ Done via Directus admin UI
3. **Analytics dashboard** — Data is in Directus (`bills` + `bill_items`); build a read-only dashboard querying by date range, category, item
4. **Auth** — Add Directus user auth so only staff can write bills; currently public API
5. **Kitchen integration** — WebSocket or polling for order status updates
6. **Receipt printing** — browser print API or thermal printer integration
7. **Multi-table view** — Batch operations, server-assigned tables
8. **Payment integration** — Stripe Terminal, Square POS
9. **Shift management** — Open/close shifts, cash reconciliation
10. **Tax calculation** — Configurable tax rates per item/category

## Development Commands
```bash
npm install        # Install dependencies
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm run preview    # Preview production build
```

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
- **Mobile-first** — 480px max-width, touch-optimized
- **Speed over flexibility** — Inline styles, hardcoded config for fast iteration
- **Clarity over cleverness** — Direct state updates, explicit view switching
- **Reversible actions** — Confirm destructive operations (close table)
- **Copy > integrate** — Clipboard export for rapid prototyping

## Directus Collections
| Collection | Purpose |
|---|---|
| `categories` | Menu categories (name, sort_order) |
| `menu_items` | Menu items with M2O to categories |
| `menu_item_variants` | Size/type variants (small, large, bottle here, bottle to go) |
| `bills` | One record per payment — analytics source of truth |
| `bill_items` | One record per line item (FK → bills) |
Bills are never hard-deleted. `cleared_at` is set by "Clear Daily Sales".
Analytics queries filter by `timestamp` range and ignore `cleared_at`.

## Notes
- Restaurant name ("Käserei Camidi") hardcoded in ticket view (`BillTab.tsx`)
- 11 tables hardcoded (easy to change in constants.js)
- Euro currency symbol hardcoded (€)
- Menu categories: Food, Drinks, Wines, Shop (driven by Directus `categories` collection)
- Status colors defined in `STATUS_CONFIG` (constants.js): open=blue, seated=yellow, unconfirmed=red, confirmed=green — reused in batch colouring and swap mode highlights
- Table swap uses long-press (500ms threshold, `LONG_PRESS_MS` constant) — `longFiredRef` guards normal taps but is bypassed in swap mode to allow target selection
- `AppContext` exposes named bill action functions (`addPaidBill`, `clearTodayBills`, `markBillAddedToPOS`, etc.) — do not manipulate `paidBills` directly
