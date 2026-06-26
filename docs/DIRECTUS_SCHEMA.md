# Directus Schema Reference — TableOrders

**Current State:** Single-database Directus instance (SQLite) serving menu data, bills, and real-time table sessions.

---

## Collections Overview

| Collection | Purpose | Lifecycle |
|---|---|---|
| `categories` | Menu categories (Food, Drinks, Wines, Shop) | Static structure |
| `subcategories` | Filterable subcategories per category | Editable via Directus |
| `menu_items` | Menu items with pricing and POS mapping | Editable via CMS |
| `menu_item_variants` | Size/type variants (0.1L, 0.2L, bottle here/to-go) | Editable via CMS |
| `bills` | Paid bills (one per payment) | Never deleted (persistent) |
| `bill_items` | Line items per bill (FK → bills) | Immutable after creation |
| `table_sessions` | Real-time table state (orders, batches, gutschein) | Deleted on table close |

---

## Schema Details

### `subcategories`
**Purpose:** Filterable groupings within each category; displayed as filter chips in OrderView and as a select field in AdminView item editing.

```typescript
{
  id: string (PK),        // Compound slug: "{category}_{name}" e.g. "food_warm", "drinks_cocktail"
  category_id: number,    // FK → categories.id (1=Food, 2=Drinks, 3=Wines, 4=Shop)
  label: string,          // Display label shown in UI e.g. "🍽️ Warm Dishes"
  sort_order: number,     // Display order within category
  active: boolean,        // false = hidden from app (archived)
}
```

**Compound slug convention:** `{category_slug}_{subcategory_slug}` guarantees uniqueness across categories for multi-client deployments. Never use short slugs (`warm`, `cocktail`) — they are ambiguous. `menu_items.subcategory` must always store the compound form.

**Fetched by:** `src/services/directusSubcategories.ts`; cached in localStorage as `subcategories_cache`.

**Note:** `menu_item_variants.bottle_subcategory` is a separate field (wine type for bottle variants: "white", "red", etc.) and is not part of this collection.

---

### `categories`
**Purpose:** Top-level menu organization

```typescript
{
  id: number (PK),
  name: string,           // "Food", "Drinks", "Wines", "Shop"
  sort_order: number,     // Display order
  date_created: datetime,
  date_updated: datetime
}
```

**Relationships:**
- O2M → `menu_items.category_id`

**Current Data:**
- Food (sort_order: 1)
- Drinks (sort_order: 2)
- Wines (sort_order: 3)
- Shop (sort_order: 4)

---

### `menu_items`
**Purpose:** Menu items with pricing, POS mapping, optional variants

```typescript
{
  id: string (PK),        // e.g., "f1", "dr1", "wg1"
  name: string,           // "Aperol", "Picpoul", "Cheese Plate"
  short_name: string,     // Abbreviated display name; also used as posName in frontend
  category_id: number,    // FK → categories
  subcategory: string,    // Compound slug matching subcategories.id e.g. "food_cheese", "drinks_cocktail"
  price: decimal,         // Price if no variants (null if item has variants)
  pos_id: string,         // POS system ID (e.g., "73", "251")
  destination: string,    // "bar" | "counter" | "kitchen" (order routing)
  min_qty: number,        // Minimum order quantity (default 1; 2 for cheese plate, raclette, fondue)
  available: boolean,     // false = hidden from menu
  sort_order: number,     // Display order within category
  date_created: datetime,
  date_updated: datetime
}
```

**Relationships:**
- M2O → `categories.id`
- O2M → `menu_item_variants.item`

**Key Patterns:**
- No variants → `price` is set, `variants` array is empty
- Has variants → `price` is null, prices come from `menu_item_variants`
- `pos_name` is not stored on `menu_items`; the frontend uses `short_name` as the POS display name

**Example Queries:**
```javascript
// Fetch active menu with variants
GET /items/menu_items
  ?fields=*,variants.*,category.name
  &filter[available][_eq]=true
  &limit=-1
  &sort=category.sort_order,id
```

---

### `menu_item_variants`
**Purpose:** Size/location variants (wine by glass, bottle here/to-go)

```typescript
{
  id: number (PK),
  item: string,                 // FK → menu_items.id
  type: string,                 // "small", "large", "here", "togo"
  label: string,                // "0,1", "0,2", "Here", "To Go"
  price: decimal,               // Variant-specific price
  pos_id: string,               // Variant-specific POS ID (e.g., "251-1")
  pos_name: string,             // Variant-specific POS name
  bottle_subcategory: string,   // Bottle wine subcategory (e.g., "white", "red"); null for non-bottles
  is_default: boolean,          // True if this variant is pre-selected in the UI
  sort_order: number,
  date_created: datetime,
  date_updated: datetime
}
```

**Relationships:**
- M2O → `menu_items.id`

**Example Data:**
```javascript
// Picpoul by glass (item_id: "wg1")
{ type: "small", label: "0,1", price: 3.50, pos_id: "251-1", is_default: true }
{ type: "large", label: "0,2", price: 6.50, pos_id: "251-2" }

// Picpoul bottle (item_id: "picpoul_bottle")
{ type: "here", label: "Here", price: 22.50, pos_id: "3101", bottle_subcategory: "white" }
{ type: "togo", label: "To Go", price: 11.50, pos_id: "3102", bottle_subcategory: "white" }
```

---

### `bills`
**Purpose:** Paid bills (analytics source of truth, never deleted)

```typescript
{
  id: uuid (PK),
  table_id: string,       // Static table id or temporary ext-* table id
  total: decimal,         // Final bill total (after gutschein)
  gutschein: decimal,     // Discount amount (nullable)
  tip: decimal,           // Tip amount (nullable)
  timestamp: datetime,    // UTC timestamp (filtered by Berlin day bounds)
  payment_mode: string,   // "full", "equal", "item"
  split_data: json,       // { guests: number } or { payments: SplitPayment[] }
  split_guests: number,   // Durable guest count for equal and item splits
  added_to_pos: boolean,  // Bill marked as entered into POS
  session_id: string,     // Shared across all bills from the same table close (nullable; legacy bills omit this)
  date_created: datetime,
  date_updated: datetime
}
```

**Relationships:**
- O2M → `bill_items.bill_id`

**Berlin Timezone Filtering:**
```javascript
// Get today's bills (Berlin timezone)
const { gte, lte } = businessDayBoundsUTC('2026-04-24');
const bills = await directus.request(
  readItems('bills', {
    filter: {
      timestamp: { _between: [gte, lte] }
    },
    fields: ['*', 'items.*']
  })
);
```

---

### `bill_items`
**Purpose:** Line items for each bill (immutable after creation, supports POS crossing)

```typescript
{
  id: uuid (PK),
  bill_id: uuid,          // FK → bills.id
  item_id: string,        // Original menu item ID (e.g., "f1", "dr1")
  item_name: string,      // Snapshot at payment time
  pos_id: string,         // POS ID (nullable)
  pos_name: string,       // POS display name (nullable)
  price: decimal,         // Price at payment time
  qty: number,            // Quantity ordered
  category: string,       // "Food", "Drinks", etc.
  subcategory: string,    // "cheese", "wine", etc. (nullable)
  crossed_qty: number,    // Items entered into POS (0 by default)
  date_created: datetime,
  date_updated: datetime
}
```

**Relationships:**
- M2O → `bills.id`

**POS Crossing Pattern:**
```javascript
// Increment crossed_qty (mark item as entered into POS)
await directus.request(
  updateItem('bill_items', itemId, {
    crossed_qty: currentQty + 1
  })
);

// Aggregate POS entries for Daily Sales
const posEntries = billItems.reduce((acc, item) => {
  const key = item.pos_id || 'unknown';
  acc[key] = (acc[key] || 0) + item.crossed_qty;
  return acc;
}, {});
```

---

### `table_sessions`
**Purpose:** Real-time table state (orders, batches, gutschein, seated) — deleted on table close

```typescript
{
  id: number (PK),
  table_id: string,       // Static table id or temporary ext-* table id
  seated: boolean,        // Is table seated?
  gutschein: decimal,     // Gutschein amount (nullable)
  orders: json,           // OrderItem[] (full order state)
  sent_batches: json,     // Batch[] (sent order batches with stable ids + timestamps)
  marked_batches: json,   // string[] (stable batch ids marked as delivered)
  date_created: datetime,
  date_updated: datetime
}
```

**Lifecycle:**
- Created: When table is first seated or order is added
- Updated: Every 500ms (debounced) when state changes
- Deleted: When table is closed via TicketView

**Sync Pattern (TableContext):**
```javascript
// Write (debounced 500ms)
const upsertSession = async (tableId, state) => {
  await directus.request(
    updateItem('table_sessions', sessionId, {
      orders: state.orders,
      sent_batches: state.sentBatches,
      marked_batches: state.markedBatches,
      gutschein: state.gutschein,
      seated: state.seated
    })
  );
};

// Read (polling every 2 seconds)
const sessions = await directus.request(
  readItems('table_sessions', {
    fields: ['*']
  })
);

// Conflict resolution: 3-second grace period
if (Date.now() - lastWriteTime > 3000) {
  // Accept remote state
  setOrders(remoteSession.orders);
}
```

---

## Migration Scripts

### Adding a New Field to `menu_items`
**Example: Add allergen information**

```sql
-- 1. Add column
ALTER TABLE menu_items ADD COLUMN allergens TEXT;

-- 2. Update existing items (optional)
UPDATE menu_items SET allergens = 'gluten,dairy' WHERE id = 'f1';
```

```javascript
// 3. Update TypeScript types (src/types/index.ts)
export interface MenuItem {
  id: string;
  name: string;
  // ... existing fields
  allergens?: string;  // NEW
}
```

```javascript
// 4. Use in frontend
const menu = await directus.request(
  readItems('menu_items', {
    fields: ['*', 'allergens']
  })
);
```

---

### Adding a New Collection
**Example: Add inventory tracking**

```sql
-- 1. Create table
CREATE TABLE inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL,
  stock_qty INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- 2. Create index
CREATE INDEX idx_inventory_item ON inventory(item_id);
```

```javascript
// 3. Directus will auto-detect the new collection on refresh
// No Directus config changes needed!

// 4. Query from frontend
const inventory = await directus.request(
  readItems('inventory', {
    filter: { stock_qty: { _lte: 5 } }  // Low stock items
  })
);
```

---


## Common Queries

### Fetch Full Menu (with variants and categories)
```javascript
GET /items/menu_items
  ?fields=*,variants.*,category.name
  &filter[available][_eq]=true
  &limit=-1
  &sort=category.sort_order,id
```

---

### Get Today's Revenue (Berlin Timezone)
```javascript
const { gte, lte } = businessDayBoundsUTC('2026-04-24');
const bills = await directus.request(
  readItems('bills', {
    filter: {
      timestamp: { _between: [gte, lte] }
    },
    aggregate: { sum: ['total'] }
  })
);
const revenue = bills[0].sum.total;
```

---

### Fetch Table Sessions (Real-Time Sync)
```javascript
const sessions = await directus.request(
  readItems('table_sessions', {
    fields: ['*']
  })
);

// Map to state
const sessionsMap = sessions.reduce((acc, session) => {
  acc[session.table_id] = {
    orders: session.orders || [],
    sentBatches: session.sent_batches || [],
    markedBatches: session.marked_batches || [],
    gutschein: session.gutschein,
    seated: session.seated
  };
  return acc;
}, {});
```

---

### Aggregate POS Entries (Daily Sales)
```javascript
const { gte, lte } = businessDayBoundsUTC('2026-04-24');
const bills = await directus.request(
  readItems('bills', {
    filter: {
      timestamp: { _between: [gte, lte] }
    },
    fields: ['items.*']
  })
);

// Aggregate crossed_qty by pos_id
const posEntries = bills.flatMap(b => b.items).reduce((acc, item) => {
  if (item.crossed_qty > 0) {
    const key = item.pos_id || 'unknown';
    acc[key] = {
      posId: item.pos_id,
      posName: item.pos_name,
      qty: (acc[key]?.qty || 0) + item.crossed_qty
    };
  }
  return acc;
}, {});
```

---

## Data Integrity Rules

1. **Never delete bills** — Persistent record for accounting and analytics
2. **Never mutate `bill_items` after creation** — Except `crossed_qty` (POS tracking)
3. **Delete `table_sessions` only on table close** — Not on app restart
4. **Use optimistic updates** — Add `tempId` prefix, replace with `directusId` on success
5. **Respect 3-second grace period** — Don't overwrite local state during debounce window
6. **Filter bills by Berlin business day** — Use `businessDayBoundsUTC()`, not naive UTC

---

## Future Schema Extensions

### Planned (Not Yet Implemented)
- `restaurant_tables` collection (dynamic table config)
- `allergens` field on `menu_items`
- `inventory` collection (stock tracking)
- `shifts` collection (open/close shifts, cash reconciliation)

### Out of Scope (Multi-Tenant)
- Per-client databases
- Client routing
- User roles/permissions
- Subdomain-based DB selection

---

## Maintenance Notes

**Directus Version:** 10.x (SQLite backend)
**Polling Intervals:**
- Table sessions: 2 seconds
- Bills (today only): 5 seconds

**Debounce Delays:**
- Table state writes: 500ms

**Timezone:** Europe/Berlin. Business days run from
`BUSINESS_DAY_START_HOUR` to the next day's cutoff and are handled by
`todayBusinessDate()` / `businessDayBoundsUTC()`.

**Auto-Generated Fields:**
- `date_created` — Set on insert
- `date_updated` — Updated on every write
- `id` — Auto-increment (numbers) or UUID (strings, as defined)

**Directus Admin UI:**
- Auto-detects schema changes on refresh
- No manual collection configuration needed for new tables/columns
- Supports drag-and-drop sort_order editing
