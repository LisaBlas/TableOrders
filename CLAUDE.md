# TableOrders — Restaurant Order Management System

## Project Overview
Mobile-first React app for restaurant table management, order taking, and bill processing.
Built for speed and simplicity — optimized for single-device, front-of-house use.

## Core Features
1. **Floor Management** — Visual table grid with real-time status (Open, Seated, Ordered)
2. **Order Taking** — Category-based menu with qty controls, unsent/sent order tracking
3. **Bill Generation** — Per-table tickets with copy-to-clipboard for kitchen/payment
4. **Bill Splitting** — Two modes:
   - Equal split: divide total by guest count
   - Item split: per-item selection, round-by-round payment tracking
5. **Table Closing** — Receipt summary with category subtotals, destructive confirmation
6. **Daily Sales Tracking** — Persistent record of all paid bills with revenue totals, accessible from homepage

## Tech Stack
- **React 18** (Vite)
- **Inline styles** (no CSS-in-JS library, pure JS objects for speed)
- **Local state** (useState) with **localStorage persistence** for paid bills only
- **DM Sans** font (Google Fonts)

## Project Structure
```
src/
├── App.jsx              # Main component with all views and logic
├── main.jsx             # Entry point
├── index.css            # Global reset
├── data/
│   └── constants.js     # Tables, menu items, status config
├── utils/
│   └── helpers.js       # Table status, item expansion, clipboard, formatting
└── styles/
    └── appStyles.js     # All inline style definitions (S object)
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

### Paid Bills (state, persisted in localStorage)
```js
[
  {
    tableId: number,
    items: [{ id, name, price, qty }],
    total: number,
    timestamp: ISO string,
    paymentMode: "full" | "equal" | "item",
    splitData?: { guests: number } | { payments: [...] }
  }
]
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
- **Sent items** are locked, shown separately
- **Split by item** expands qty > 1 into individual units for granular splitting
- **Clipboard integration** for order/ticket export (no backend)
- **Toast notifications** (2s auto-dismiss) for user feedback
- **Paid bills saved** automatically when table closes (full payment or after split)
- **localStorage persistence** for paid bills only (survives refresh)

## Limitations & Trade-offs
- **Limited persistence** — only paid bills persist in localStorage; active orders lost on refresh (intentional for prototype speed)
- **No backend** — orders copied to clipboard instead of sent to kitchen system
- **No auth/multi-device** — single-device, single-session use case
- **Hardcoded menu** — change requires code edit (constants.js)
- **No print integration** — clipboard export only
- **Manual day reset** — "Clear Daily Sales" must be used manually at end of shift

## Future Improvements (if productionizing)
1. **Persistence** — localStorage or backend (Firebase, Supabase)
2. **Kitchen integration** — WebSocket or polling for order status updates
3. **Receipt printing** — browser print API or thermal printer integration
4. **Menu editor** — Admin panel for menu CRUD
5. **Multi-table view** — Batch operations, server-assigned tables
6. **Payment integration** — Stripe Terminal, Square POS
7. **Analytics** — Sales tracking, popular items, avg ticket size
8. **Shift management** — Open/close shifts, cash reconciliation
9. **Tax calculation** — Configurable tax rates per item/category
10. **Tip handling** — Suggested tips, split tip allocation

## Development Commands
```bash
npm install        # Install dependencies
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm run preview    # Preview production build
```

## Design Principles
- **Mobile-first** — 480px max-width, touch-optimized
- **Speed over flexibility** — Inline styles, hardcoded config for fast iteration
- **Clarity over cleverness** — Direct state updates, explicit view switching
- **Reversible actions** — Confirm destructive operations (close table)
- **Copy > integrate** — Clipboard export for rapid prototyping

## Notes
- Restaurant name ("Käserei Camidi") hardcoded in ticket view
- 11 tables hardcoded (easy to change in constants.js)
- Euro currency symbol hardcoded (€)
- Menu structured as 4 categories: Starters, Mains, Desserts, Drinks
- Status colors use muted, accessible palette (green/yellow/red tints)
