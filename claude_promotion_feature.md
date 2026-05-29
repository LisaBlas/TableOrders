# Promotion Feature — Claude Analysis & Implementation Plan

## Decisions Needed Before Writing Code

| # | Question | Why it matters |
|---|---|---|
| 1 | **Trigger scope**: specific item ID (e.g. `f_fondue`) or any item in a subcategory (e.g. all fondue variants)? | Determines whether `trigger_item_id` is a single string or a list/subcategory match |
| 2 | **Capping**: 1 fondue → 1 Zotz discount, or 2 fondues → 2 discounts? | Whether the engine loops over trigger qty or caps at 1 per order |
| 3 | **Visibility**: show in TicketView only (bill time), or also live in OrderView as items are added? | Live feedback needs a hook plumbed through `OrderView`; bill-time-only is simpler |
| 4 | **Admin CRUD now or later?**: manage promotions via `AdminView`, or manually insert in Directus for now? | Admin UI is ~1 extra day |

---

## Implementation Steps

### Step 1 — SQLite migration (run on Directus server)

```sql
-- New promotions collection
CREATE TABLE promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  trigger_item_id TEXT NOT NULL,
  target_item_id TEXT NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Auditability columns on existing bill_items
ALTER TABLE bill_items ADD COLUMN discount DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE bill_items ADD COLUMN discount_reason TEXT DEFAULT NULL;
```

Directus auto-detects both on UI refresh. No config changes needed.

---

### Step 2 — Types (`src/types/index.ts`)

- Add `Promotion` interface
- Add `discount?: number` and `discountReason?: string` to `OrderItem` (carries applied discount through to bill factory)
- `Bill.total` already is the final amount — promotion savings visible via item-level `discount` fields

---

### Step 3 — Promotions service (new `src/services/directusPromotions.ts`)

- `fetchPromotions(): Promise<Promotion[]>` — `GET /items/promotions?filter[active][_eq]=true`
- Mirrors the pattern in `directusMenu.ts`
- Include demo mode stub

---

### Step 4 — MenuContext (`src/contexts/MenuContext.tsx`)

- Fetch promotions alongside menu data (second `useQuery` keyed `["promotions"]`)
- Expose `promotions: Promotion[]` from `useMenu()`
- Same lifecycle as menu — fetched once on mount, refreshed when admin edits

---

### Step 5 — Promotion engine (new `src/utils/promotionEngine.ts`)

Pure function, no side effects:

```ts
// Returns a copy of items with `discount` + `discountReason` set on qualifying targets
evaluatePromotions(sentItems: OrderItem[], promotions: Promotion[]): OrderItem[]
```

Logic: for each active promotion, check if `triggerItemId` appears in `sentItems` (matching on `id` or `baseId`). If found, find the first un-discounted target item and apply `discount_amount`. Cap: 1 discount per target item per promo (unless decision 2 says proportional).

---

### Step 6 — `billFactory.ts` (`src/utils/billFactory.ts`)

- Add `promotions?: Promotion[]` parameter to `createFullTableBill`, `createEqualSplitTableBill`, `createItemSplitTableBill`
- Call `evaluatePromotions(items, promotions)` before computing subtotal
- `getBillSubtotal` subtracts `item.discount ?? 0` from each item's line total
- `baseTableBill` sets a `promoDiscount` field on the bill if any discounts were applied (for receipt display)

---

### Step 7 — `Receipt.tsx` (`src/components/Receipt.tsx`)

For each item where `item.discount > 0`, render a discount sub-row below the item line:

```
1×  Zotz Here           22.50€
    ↳ Fondue promo       -2.00€
```

Totals section becomes: `Subtotal → Promotions → Voucher → Total`

---

### Step 8 — `TicketView.tsx` (`src/views/TicketView.tsx`)

- Pull `promotions` from `useMenu()`
- Pass to `createFullTableBill` in `confirmClose`
- Pass to `initiateSplit` — thread through to `SplitContext`
  - Equal split: discount already in total, divides naturally
  - Item split: `ExpandedItem` carrying `discount` must follow the unit it's attached to (tricky part)

---

### Step 9 — `directusBills.ts` (`src/services/directusBills.ts`)

- `createBillInDirectus`: include `discount` and `discount_reason` in each item payload
- `billFromDirectus`: read `item.discount` and `item.discount_reason` back when rehydrating bills
- No new API calls or rollback logic needed

---

### Step 10 — Admin UI (optional, depends on decision 4)

- New collapsible "Promotions" section in `src/views/AdminView.tsx`
- CRUD via new helpers in `directusAdmin.ts` (`fetchPromotions`, `patchPromotion`, `createPromotion`)
- Toggle active/inactive (same optimistic pattern as menu item availability)
- Item picker for trigger + target (search over loaded menu items)

---

## Complexity Estimate

| Scope | Effort |
|---|---|
| Steps 1–9 (no admin UI) | ~2 days |
| Step 10 (admin UI) | +1 day |
| Item-split discount distribution (complex case) | +0.5 day |

The only genuinely tricky part is Step 8 for item splits: when a discounted item (`Zotz Here, −2€`) is expanded into individual units, the `discount` must follow the unit, not be lost in the expansion.

---

## Key Files Affected

| File | Change |
|---|---|
| `src/types/index.ts` | Add `Promotion`, extend `OrderItem` |
| `src/services/directusPromotions.ts` | New — fetch active promotions |
| `src/utils/promotionEngine.ts` | New — pure evaluation logic |
| `src/contexts/MenuContext.tsx` | Expose `promotions` |
| `src/utils/billFactory.ts` | Accept + apply promotions |
| `src/components/Receipt.tsx` | Display per-item discounts |
| `src/views/TicketView.tsx` | Pass promotions to bill creation and splits |
| `src/services/directusBills.ts` | Persist + read `discount`/`discount_reason` |
| `src/views/AdminView.tsx` | (optional) Promotions CRUD |
| `docs/DIRECTUS_SCHEMA.md` | Document new `promotions` collection + `bill_items` columns |
