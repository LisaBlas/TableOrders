TableOrders React Refactoring Plan
Context
The TableOrders app is feature-complete and ready for pre-production deployment. Currently, the entire application lives in a single 2,354-line App.jsx file with 26+ state variables, making it difficult to maintain, test, and extend with new menu data.

Why this refactor is needed:

Maintainability: 2,354 lines in one file is hard to navigate and modify confidently
Testability: Monolithic structure makes isolated testing impossible
Type safety: Adding TypeScript will catch bugs at compile-time (missing props, typos, state shape errors)
Scalability: Adding new menu items/tables requires hunting through massive file
Code reuse: Repeated patterns (modals, handlers) can be extracted for DRY
What prompted this:
User stated: "ready for pre-production, no more features to add, just more data" — indicating need for clean, maintainable structure to support data expansion.

Intended outcome:

Modern React architecture (TypeScript, hooks, context, composition)
Max 200 lines per file
Integration-tested components
Easy to add menu items/tables without touching core logic
Production-ready codebase
Architecture Overview
Component Structure
Extract 7 feature-based views from App.jsx:


src/views/
├── TablesView.tsx          (~200 lines) - Floor grid, status legend, daily sales button
├── OrderView.tsx           (~300 lines) - Dual-tab interface (Order/Bill tabs)
├── TicketView.tsx          (~150 lines) - Standalone bill view
├── SplitPaymentView.tsx    (~200 lines) - Item selection (equal/item modes)
├── SplitConfirmView.tsx    (~150 lines) - Guest payment entry
├── SplitDoneView.tsx       (~100 lines) - Final split summary
└── DailySalesView.tsx      (~250 lines) - Revenue tabs (chronological/total)
Extract 8 reusable components:


src/components/
├── Receipt.tsx             (✓ exists, add types)
├── Modal.tsx               (✓ exists, add types)
├── MenuItem.tsx            (~50 lines) - Menu item button with variant selection
├── OrderBar.tsx            (~100 lines) - Bottom unsent items bar
├── SentBatchCard.tsx       (~80 lines) - Sent order batch display
├── BillCard.tsx            (~60 lines) - Daily sales bill card
├── Toast.tsx               (~30 lines) - Toast notification
└── Header.tsx              (~50 lines) - Sticky header with back button
Why these boundaries?

Views map 1:1 to existing state machine values (minimal refactor risk)
Components appear 3+ times in current code (follows existing "extract on duplication" rule)
Each component is <150 lines (easy to understand at a glance)
State Management
Context Architecture (3 contexts)
1. TableContext (~200 lines) - Core business logic


interface TableContextValue {
  // State
  orders: Record<TableId, OrderItem[]>
  seatedTables: Set<TableId>
  activeTable: TableId | null
  sentBatches: Record<TableId, Batch[]>
  gutscheinAmounts: Record<TableId, number>

  // Actions
  addItem: (tableId: TableId, item: MenuItem, variant?: string) => void
  removeItem: (tableId: TableId, itemId: string) => void
  sendOrder: (tableId: TableId) => void
  seatTable: (tableId: TableId) => void
  closeTable: (tableId: TableId, bill: Bill) => void
  applyGutschein: (tableId: TableId, amount: number) => void
  // ... 8 more table actions
}
2. SplitContext (~150 lines) - Split payment state machine


type SplitState = {
  mode: "equal" | "item" | null
  stage: "idle" | "selecting" | "confirming" | "complete"
  remaining: ExpandedItem[]
  selected: Set<string>
  payments: Payment[]
  equalGuests: number
  equalPayments: PaymentInput[]
  itemPayments: Record<number, PaymentInput>
}

type SplitAction =
  | { type: 'INITIATE'; mode: 'equal' | 'item'; items: OrderItem[] }
  | { type: 'TOGGLE_ITEM'; uid: string }
  | { type: 'CONFIRM_GUEST' }
  | { type: 'CLOSE_SPLIT' }
  | { type: 'RESET' }

interface SplitContextValue {
  state: SplitState
  dispatch: React.Dispatch<SplitAction>
  // Derived state
  selectedTotal: number
  remainingTotal: number
  canConfirm: boolean
}
Uses useReducer for explicit state transitions, prevents impossible states (can't have both equal/item mode active).

3. AppContext (~100 lines) - Global UI state


interface AppContextValue {
  // State
  view: View
  toast: string | null
  paidBills: Bill[]
  dailySalesTab: "chronological" | "total"

  // View-specific UI state
  activeCategory: string
  activeTab: "order" | "bill"
  searchQuery: string
  editingBill: boolean
  showCustomModal: boolean
  // ... 6 more UI flags

  // Actions
  navigate: (view: View, params?: Record<string, any>) => void
  showToast: (message: string) => void
  clearDailySales: () => void
}
Why 3 contexts?

Separate concerns (business logic / split flow / UI state)
SplitContext only mounts when needed (auto-resets on unmount)
Avoids prop drilling while keeping context overhead minimal
Provider hierarchy:


<AppProvider>
  <TableProvider>
    <Router />  {/* Routes to views based on AppContext.view */}
  </TableProvider>
</AppProvider>

// SplitProvider wraps split views only
{view.startsWith('split') && (
  <SplitProvider>
    <SplitPaymentView />
  </SplitProvider>
)}
Custom Hooks (5 hooks)
1. useLocalStorage (~50 lines)


function useLocalStorage<T>(
  key: string,
  initialValue: T,
  schema?: (value: unknown) => value is T
): [T, React.Dispatch<React.SetStateAction<T>>]
Replaces 3 separate localStorage patterns (orders, seatedTables, paidBills). Adds error handling and optional Zod schema validation.

2. useTableOrder (~80 lines)


function useTableOrder(tableId: TableId | null) {
  return {
    items: OrderItem[]
    unsent: OrderItem[]      // Computed: items where qty - sentQty > 0
    sent: OrderItem[]        // Computed: items where sentQty > 0
    total: number
    unsentTotal: number
    addItem, removeItem, sendOrder  // Actions from TableContext
  }
}
Encapsulates derived state logic (unsent/sent separation), uses useMemo to prevent recalculation every render.

3. useBillEdit (~60 lines)


function useBillEdit(tableId: TableId) {
  return {
    editMode: boolean
    snapshot: OrderItem[] | null
    startEdit: () => void
    confirmEdit: () => void
    cancelEdit: () => void
  }
}
Isolates bill edit snapshot logic (currently scattered across 3 handlers in App.jsx).

4. useMenuSearch (~80 lines)


function useMenuSearch(category: string) {
  return {
    searchQuery: string
    setSearchQuery: (q: string) => void
    selectedSubcategory: string | null
    setSelectedSubcategory: (sub: string | null) => void
    filteredItems: MenuItem[]  // useMemo: filters by query + subcategory
  }
}
Consolidates 3 subcategory states (Food, Drinks, Bottles) + search logic.

5. useSplitPayment (~70 lines)


function useSplitPayment() {
  const { state, dispatch } = useSplit()
  return {
    ...state,
    // Derived state
    selectedItems: ExpandedItem[]
    selectedTotal: number
    canConfirm: boolean
    // Wrapped actions
    toggleItem: (uid: string) => dispatch({ type: 'TOGGLE_ITEM', uid })
    confirmGuest: () => dispatch({ type: 'CONFIRM_GUEST' })
  }
}
Wraps SplitContext with derived state + validation. Hides reducer complexity from UI.

TypeScript Migration
Approach
Incremental file-by-file migration:

Add tsconfig.json with allowJs: true (allows mixing .js/.ts)
Rename files to .tsx as you extract them
Start with strictest types (no any), loosen only if necessary
Use Zod for runtime validation of localStorage data
Key Type Definitions

// src/types/index.ts (~150 lines)

type TableId = number | string

interface MenuItem {
  id: string
  name: string
  price: number
  category: "Food" | "Drinks🍷" | "Bottles 🍾"
  subcategory?: string
  variants?: MenuItemVariant[]
}

interface MenuItemVariant {
  type: string
  price: number
  label: string
}

interface OrderItem extends MenuItem {
  qty: number
  sentQty: number
  _uid?: string  // For split payment (expandItems adds this)
}

interface Batch {
  timestamp: string
  items: OrderItem[]
  destination: "bar" | "counter" | "kitchen"
}

interface Bill {
  tableId: TableId
  items: OrderItem[]
  total: number
  subtotal?: number
  gutschein?: number
  timestamp: string
  paymentMode: "full" | "equal" | "item"
  splitData?: { guests: number } | { payments: Payment[] }
}

interface Payment {
  guestNum: number
  items: OrderItem[]
  total: number
  amountPaid: number
  tip: number
}

type View =
  | "tables"
  | "order"
  | "ticket"
  | "split"
  | "splitConfirm"
  | "splitDone"
  | "dailySales"
Benefits:

Catch typos (tableId vs tableID) at compile-time
Prevent missing props in components
Autocomplete for menu items, variants, states
Self-documenting code (types explain data shape)
Testing Strategy
Integration-First Approach
1. Component Integration Tests (React Testing Library)
Test components as users see them: render → user events → state changes.


// src/views/__tests__/OrderView.test.tsx
describe('OrderView', () => {
  it('adds item to order when clicked', () => {
    render(
      <TableProvider>
        <OrderView tableId={1} />
      </TableProvider>
    )

    fireEvent.click(screen.getByText('Cheese Plate'))
    expect(screen.getByText('1× Cheese Plate')).toBeInTheDocument()
    expect(screen.getByText('11.00€')).toBeInTheDocument()
  })

  it('separates unsent and sent items across tabs', () => {
    // Setup: add items, send some, keep some unsent
    // Assert: Order tab shows unsent, Bill tab shows sent
  })
})

// src/components/__tests__/MenuItem.test.tsx
describe('MenuItem', () => {
  it('renders variant buttons for items with variants', () => {
    const item = { id: 'wg1', name: 'Picpoul', variants: [...] }
    render(<MenuItem item={item} onAdd={mockFn} />)

    expect(screen.getByText('Small (4€)')).toBeInTheDocument()
    expect(screen.getByText('Large (8€)')).toBeInTheDocument()
  })
})
Coverage targets:

All views: render without crashing, basic interactions
OrderView: add/remove items, send order, tab switching
BillView: edit mode, gutschein, close table
DailySales: edit/delete bills, clear day
Split flows: item selection, payment entry, completion
2. Targeted Unit Tests (complex hooks only)


// src/hooks/__tests__/useTableOrder.test.ts
describe('useTableOrder', () => {
  it('computes unsent items correctly', () => {
    const { result } = renderHook(() => useTableOrder(1), {
      wrapper: ({ children }) => (
        <TableProvider initialOrders={{ 1: mockItems }}>
          {children}
        </TableProvider>
      )
    })

    expect(result.current.unsent).toHaveLength(2)
    expect(result.current.sent).toHaveLength(1)
  })
})

// src/contexts/__tests__/SplitContext.test.ts
describe('SplitContext reducer', () => {
  it('transitions from idle to selecting on INITIATE', () => {
    const state = splitReducer(initialState, { type: 'INITIATE', mode: 'item', items })
    expect(state.stage).toBe('selecting')
    expect(state.mode).toBe('item')
  })

  it('prevents selecting items in idle stage', () => {
    const state = splitReducer(initialState, { type: 'TOGGLE_ITEM', uid: '123' })
    expect(state.selected.size).toBe(0)  // No-op in idle stage
  })
})
What to unit test:

useTableOrder derived state (unsent/sent/total calculations)
useSplitPayment derived state (selectedTotal, canConfirm validation)
SplitContext reducer (all state transitions)
Helper functions (getTableStatus, expandItems, consolidateItems)
What NOT to unit test:

Simple hooks (useMenuSearch - covered by view tests)
Presentational components (Receipt, Toast - visual regression only)
Context providers (covered by integration tests)
3. E2E Tests (Playwright - critical flows only)


// e2e/order-lifecycle.spec.ts
test('complete order flow: seat → order → send → close', async ({ page }) => {
  await page.goto('/')

  // Seat table
  await page.click('text=Table 1')
  await page.click('text=Confirm')
  expect(await page.textContent('.toast')).toContain('Table 1 seated')

  // Add items
  await page.click('text=Cheese Plate')
  await page.click('text=Wine (Small)')

  // Send order
  await page.click('text=Send (2 items)')
  expect(await page.textContent('.toast')).toContain('sent')

  // Close table
  await page.click('text=Bill')
  await page.click('text=Close Table')
  await page.click('text=Confirm')
  expect(await page.textContent('.toast')).toContain('closed')
})

// e2e/split-payment.spec.ts
test('item split: allocate items across 2 guests', async ({ page }) => {
  // Setup: table with 3 items
  // Guest 1: select 2 items, enter payment
  // Guest 2: remaining item, enter payment
  // Assert: split summary shows both guests, table closes
})

// e2e/gutschein.spec.ts
test('apply gutschein discount to bill', async ({ page }) => {
  // Setup: table with 20€ total
  // Apply 5€ gutschein
  // Assert: subtotal 20€, gutschein -5€, total 15€
})
Coverage targets (5 critical flows):

Full order lifecycle (seat → order → send → close)
Item split payment (2+ guests)
Equal split payment
Gutschein application
Daily sales persistence (close table, refresh, data still there)
Testing Timeline
Phase 1-2 (Pure components, hooks): Add unit tests as you extract
Phase 3-5 (Contexts, views): Add integration tests per view
Phase 7 (After all extraction done): Add E2E tests for critical flows
Ongoing: Visual regression (screenshot before/after each phase)
Migration Phases (Incremental, 2-3 Days)
Phase 1: Setup TypeScript (2 hours)
Goal: Enable TypeScript without breaking existing code

Tasks:

 Add tsconfig.json with allowJs: true, strict: true
 Install types: @types/react, @types/node
 Create src/types/index.ts with core type definitions
 Rename existing extracted files: Receipt.jsx → Receipt.tsx, Modal.jsx → Modal.tsx
 Add prop types to Receipt and Modal
Verification: npm run build succeeds, app runs without errors

Phase 2: Extract Pure Components (3 hours)
Goal: Extract reusable UI without touching state

Tasks:

 Extract MenuItem.tsx with variant selection logic
 Extract Toast.tsx from inline div
 Extract Header.tsx with back button + title + actions slots
 Add integration tests for each component
Files modified:

src/components/MenuItem.tsx (new)
src/components/Toast.tsx (new)
src/components/Header.tsx (new)
src/App.jsx (replace inline JSX with components)
Verification: Visual regression (screenshot comparison), integration tests pass

Phase 3: Create Custom Hooks (4 hours)
Goal: Encapsulate derived state logic

Tasks:

 Implement useLocalStorage.ts with Zod validation
 Replace 3 localStorage patterns in App.jsx
 Implement useTableOrder.ts with unsent/sent/total derivation
 Replace inline derived state in App.jsx (lines 708-729)
 Add unit tests for both hooks
Files modified:

src/hooks/useLocalStorage.ts (new)
src/hooks/useTableOrder.ts (new)
src/App.jsx (use hooks instead of inline calculations)
Verification: Unit tests pass, localStorage persistence still works (manual test: add order, refresh, data persists)

Phase 4: Create TableContext (4 hours)
Goal: Centralize table/order state

Tasks:

 Create TableContext.tsx with orders, seatedTables, sentBatches, gutscheinAmounts
 Move 12 table-related handlers from App.jsx to context
 Wire TableProvider in App.jsx (wrap existing views)
 Update useTableOrder to consume TableContext
 Add integration tests for TableContext actions
Files modified:

src/contexts/TableContext.tsx (new)
src/App.jsx (wrap with provider, remove local state)
Verification: E2E test (full order flow: add → send → close), no regressions

Phase 5: Create AppContext (2 hours)
Goal: Centralize view navigation and global UI state

Tasks:

 Create AppContext.tsx with view, toast, paidBills, dailySalesTab
 Move navigation logic + showToast + clearDailySales to context
 Wire AppProvider in App.jsx
 Update all view components to use navigate() from context
Files modified:

src/contexts/AppContext.tsx (new)
src/App.jsx (wrap with provider, delegate navigation)
Verification: Navigation still works (click table → order view → back → tables view)

Phase 6: Extract Main Views (5 hours)
Goal: Break App.jsx into feature-based view components

Tasks:

 Extract TablesView.tsx (floor grid, lines 736-793 in current App.jsx)
 Extract OrderView.tsx (dual-tab interface, lines 810-1451)
 Extract TicketView.tsx (standalone bill, lines 1452-1509)
 Extract DailySalesView.tsx (revenue tabs, lines 1892-2255)
 Add integration tests for each view
Files modified:

src/views/TablesView.tsx (new)
src/views/OrderView.tsx (new)
src/views/TicketView.tsx (new)
src/views/DailySalesView.tsx (new)
src/App.tsx (now just provider setup + router, ~150 lines)
Verification: All views render, navigation works, visual regression

Phase 7: Create SplitContext + Views (5 hours)
Goal: Isolate complex split payment logic

Tasks:

 Create SplitContext.tsx with useReducer state machine
 Define SplitState type and SplitAction union
 Implement reducer with state transitions (idle → selecting → confirming → complete)
 Extract SplitPaymentView.tsx (item selection, lines 1512-1708)
 Extract SplitConfirmView.tsx (payment entry, lines 1710-1821)
 Extract SplitDoneView.tsx (summary, lines 1823-1890)
 Implement useSplitPayment.ts hook
 Add unit tests for reducer, integration tests for views
Files modified:

src/contexts/SplitContext.tsx (new)
src/hooks/useSplitPayment.ts (new)
src/views/SplitPaymentView.tsx (new)
src/views/SplitConfirmView.tsx (new)
src/views/SplitDoneView.tsx (new)
src/App.tsx (conditional SplitProvider wrapper)
Verification: E2E tests for both split modes (equal + item), unit tests for reducer transitions

Phase 8: Extract Remaining Components + Hooks (3 hours)
Goal: Finish component extraction

Tasks:

 Extract OrderBar.tsx (unsent items bar)
 Extract SentBatchCard.tsx (sent batches by destination)
 Extract BillCard.tsx (daily sales bill card)
 Implement useBillEdit.ts (snapshot logic)
 Implement useMenuSearch.ts (search + subcategory filtering)
 Add integration tests for new components
Files modified:

src/components/OrderBar.tsx (new)
src/components/SentBatchCard.tsx (new)
src/components/BillCard.tsx (new)
src/hooks/useBillEdit.ts (new)
src/hooks/useMenuSearch.ts (new)
src/views/OrderView.tsx (use new components)
src/views/DailySalesView.tsx (use BillCard)
Verification: Visual regression, integration tests pass

Phase 9: Add E2E Tests + Optimization (3 hours)
Goal: Ensure critical flows work end-to-end, optimize performance

Tasks:

 Add Playwright E2E tests for 5 critical flows (see Testing Strategy above)
 Profile with React DevTools Profiler
 Add useMemo to expensive computations (filteredItems, consolidatedItems)
 Add useCallback to handler props passed to children
 Add React.memo to pure components if needed (MenuItem, Receipt)
Files modified:

e2e/ (new test files)
Various hooks/components (add memoization)
Verification: All E2E tests pass, no performance regressions (profile before/after)

Final File Structure

src/
├── App.tsx                     (~150 lines) - Providers + router
├── main.jsx                    (✓ no change)
├── index.css                   (✓ no change)
│
├── types/
│   └── index.ts                (~150 lines) - TypeScript definitions
│
├── views/
│   ├── TablesView.tsx          (~200 lines)
│   ├── OrderView.tsx           (~300 lines)
│   ├── TicketView.tsx          (~150 lines)
│   ├── SplitPaymentView.tsx    (~200 lines)
│   ├── SplitConfirmView.tsx    (~150 lines)
│   ├── SplitDoneView.tsx       (~100 lines)
│   └── DailySalesView.tsx      (~250 lines)
│
├── components/
│   ├── Receipt.tsx             (~100 lines)
│   ├── Modal.tsx               (~30 lines)
│   ├── Header.tsx              (~50 lines)
│   ├── MenuItem.tsx            (~50 lines)
│   ├── OrderBar.tsx            (~100 lines)
│   ├── SentBatchCard.tsx       (~80 lines)
│   ├── BillCard.tsx            (~60 lines)
│   └── Toast.tsx               (~30 lines)
│
├── contexts/
│   ├── TableContext.tsx        (~200 lines)
│   ├── SplitContext.tsx        (~150 lines)
│   └── AppContext.tsx          (~100 lines)
│
├── hooks/
│   ├── useTableOrder.ts        (~80 lines)
│   ├── useLocalStorage.ts      (~50 lines)
│   ├── useSplitPayment.ts      (~70 lines)
│   ├── useBillEdit.ts          (~60 lines)
│   └── useMenuSearch.ts        (~80 lines)
│
├── data/
│   └── constants.js            (✓ no change)
│
├── utils/
│   └── helpers.js              (✓ no change)
│
└── styles/
    └── appStyles.js            (✓ no change, keep S object)
Metrics:

Before: 1 file (2,354 lines), 26 state vars, 13 handlers
After: 30 files, max 300 lines/file, avg ~120 lines/file
App.tsx: ~150 lines (just providers + router)
Critical Files to Modify
High Priority (Core Refactor)
src/App.jsx → src/App.tsx - Main extraction source, becomes thin router
src/contexts/TableContext.tsx - NEW, core business logic (orders, tables, gutschein)
src/contexts/SplitContext.tsx - NEW, complex split state machine
src/hooks/useTableOrder.ts - NEW, derived state (unsent/sent/total)
src/views/OrderView.tsx - NEW, most complex view (dual tabs, menu, bill)
Medium Priority (Supporting)
src/contexts/AppContext.tsx - NEW, global UI state (view, toast, paidBills)
src/hooks/useSplitPayment.ts - NEW, wraps split reducer with derived state
src/views/SplitPaymentView.tsx - NEW, item selection for split
src/views/DailySalesView.tsx - NEW, revenue tabs with edit/delete
src/types/index.ts - NEW, TypeScript definitions
Low Priority (Polish)
src/components/MenuItem.tsx - NEW, extracted menu item button
src/components/OrderBar.tsx - NEW, extracted unsent items bar
src/hooks/useLocalStorage.ts - NEW, localStorage wrapper with validation
Verification Steps (After Each Phase)
Build Verification

npm run build              # TypeScript compiles without errors
npm run dev                # App starts, no console errors
Manual Testing Checklist
 Seat table → Table status changes to "taken"
 Add items → Items appear in order bar
 Send order → Items move from Order tab to Bill tab
 Edit bill → +/- buttons work, snapshot restores on cancel
 Apply gutschein → Subtotal/total calculated correctly
 Split payment (equal) → Divide by guests, close table
 Split payment (item) → Allocate items per guest, close table
 Close table → Bill saved to Daily Sales
 Refresh page → Paid bills persist, active orders clear (intentional)
 Clear daily sales → All bills removed after confirmation
Automated Testing

npm run test               # Integration tests pass (React Testing Library)
npm run test:e2e           # E2E tests pass (Playwright)
Performance Verification
Profile with React DevTools Profiler before/after
Target: No regressions (Time to Interactive <2s, same as current)
Check: Large bill (50 items) renders in <100ms
Risk Mitigation
Risk	Impact	Mitigation
Breaking qty/sentQty duality	High	E2E test covering Order→Bill tab transition, manual test before commit
Split state machine breaks	High	Unit tests for all reducer transitions, E2E for both split modes
localStorage schema change	Medium	Zod validation in useLocalStorage, test with existing data before refactor
TypeScript compilation errors	Medium	Incremental migration (allowJs: true), start with any types if stuck
Context re-render performance	Low	Profile after Phase 4-5, add useMemo/React.memo if needed
Rollback strategy: Each phase keeps app functional. If phase fails, revert to previous commit.

Success Metrics (Post-Refactor)
Code health: Max file size <300 lines, avg ~120 lines
Test coverage: >70% for hooks/contexts (integration tests), 100% E2E for critical flows
Performance: No regressions (Time to Interactive <2s)
Maintainability: New developer can add menu item in <15 min (vs 2hr now)
Type safety: Zero any types (except external libs), compile-time error detection
Next Steps After Refactor
Once refactor complete, consider (not in scope for this plan):

Backend integration - Replace localStorage with API (Supabase, Firebase)
Real-time updates - WebSocket for kitchen display sync
Offline support - Service worker for offline-first
Receipt printing - Browser print API or thermal printer integration
Analytics - Track popular items, avg ticket size, revenue trends
