# Promotion Feature - Codex Findings

## Feature Shape

The need is real and structurally sound if promotions stay separate from the
existing `gutschein` voucher flow.

The correct model is:

- `gutschein`: manual staff-entered voucher, flat bill-level reduction.
- `promotion`: rule-based item-linked discount, derived from the order and
  stored immutably on paid bill items.

Do not bolt promotions onto `gutschein`. That would be fast, but it would lose
auditability and make future reporting confusing.

## Current System Constraints

- Directus currently stores active table state in `table_sessions` and closed
  bills in `bills` plus `bill_items`.
- `table_sessions.gutschein` and `bills.gutschein` are blunt decimal fields.
  They do not record trigger item, discounted item, rule name, or reason.
- `bill_items` currently stores item price and POS metadata, but no item-level
  discount metadata.
- `OrderItem` has no promotion fields.
- `billFactory.ts` only knows about subtotal minus `gutschein`.
- `useTableClose.ts` has a separate direct bill creation path for full close,
  so full-payment promotion logic must not live only in `billFactory.ts` unless
  that path is refactored.
- `Receipt.tsx` consolidates items before display, so promotion display must be
  designed carefully to avoid hiding or double-counting item-level discounts.
- Item split is the trickiest path because `SplitContext` expands quantities
  into individual units.

## Recommended V1 Scope

Keep V1 intentionally narrow:

- Active flat discount rules only.
- Trigger item ID, with optional trigger variant type.
- Target item ID, with optional target variant type.
- Fixed euro discount amount.
- Automatic application.
- Visible before payment.
- Stored immutably on `bill_items`.
- Manual `gutschein` can stack after promotions.
- No percentage discounts, schedules, customer targeting, complex stacking,
  coupon codes, or staff approval flow in V1.

Recommended application rule:

```text
applications = min(triggerQty, targetQty, maxApplications if set)
discount = applications * discountAmount
```

Example:

```text
2 fondue + 3 Zotz bottles, 2 EUR off Zotz per fondue
=> discount applies to 2 Zotz bottles
=> total promotion discount = 4 EUR
```

## Directus Schema Proposal

Add a `promotions` collection:

```ts
{
  id: string | number,
  name: string,
  active: boolean,
  trigger_item_id: string,
  trigger_variant_type: string | null,
  target_item_id: string,
  target_variant_type: string | null,
  discount_amount: number,
  max_applications: number | null,
  sort_order: number,
  date_created: string,
  date_updated: string
}
```

Add fields to `bill_items`:

```ts
{
  original_price: number | null,
  discount_amount: number,       // total line discount
  discount_reason: string | null,
  promotion_id: string | null,
  promotion_name: string | null
}
```

Recommended pricing convention:

- Keep `bill_items.price` as the original unit price.
- Store the line-level promotion amount in `discount_amount`.
- Compute bill totals as gross item subtotal minus promotions minus
  `gutschein`.

This preserves POS mapping and makes daily sales reconciliation clearer.

## Frontend Implementation Steps

1. Add promotion types in `src/types/index.ts`.

   Needed types:

   - `PromotionRule`
   - `AppliedPromotion`
   - optional promotion fields on `OrderItem` or a bill-item-compatible type:
     `discountAmount`, `discountReason`, `promotionId`, `promotionName`,
     `originalPrice`.

2. Add `src/services/directusPromotions.ts`.

   Fetch active promotion rules from Directus:

   ```text
   /items/promotions?filter[active][_eq]=true&limit=-1&sort=sort_order,id
   ```

3. Add a small promotion loading boundary.

   Prefer a `PromotionContext` over putting this into `MenuContext`.
   Promotions are pricing policy, not menu structure.

4. Add `src/utils/promotionPricing.ts`.

   This should be a pure utility:

   - Input: order/bill items and active promotion rules.
   - Output: priced items, applied promotions, gross subtotal,
     promotion discount total, final total before/after `gutschein`.
   - Match by `baseId ?? id`.
   - Match variant-specific rules by `variantType`.
   - Do not mutate table orders.

5. Update `src/utils/billFactory.ts`.

   Bill creation should accept promotion pricing results and persist promotion
   metadata onto bill item snapshots.

   Formula:

   ```text
   subtotal = gross sent item total
   total = subtotal - promotionDiscountTotal - gutschein
   ```

6. Refactor `src/hooks/useTableClose.ts`.

   This path currently builds full bills directly. It should use the same bill
   factory path as other full close flows, otherwise promotions will be missed.

7. Update `src/services/directusBills.ts`.

   - Read promotion fields from Directus bill items.
   - Write promotion fields when creating bill items.
   - Preserve compatibility with older bills where these fields are missing.

8. Update receipt and bill UI.

   Touchpoints:

   - `src/components/Receipt.tsx`
   - `src/components/BillTab.tsx`
   - `src/components/BillCard.tsx`
   - split summary views where totals are shown

   UI should show:

   - original item line price
   - promotion discount under the affected line or as a grouped promo row
   - manual voucher separately as `Voucher`
   - final total

9. Update split flows.

   Equal split:

   - Use total after promotions and after `gutschein`.

   Item split:

   - Prefer attaching discount to the target units when items are expanded.
   - The guest selecting the discounted Zotz should receive the Zotz discount.
   - Keep the existing fake `__gutschein__` item separate for manual vouchers.

10. Update daily sales and POS aggregation.

    `src/utils/salesAggregation.ts` currently calculates revenue from
    `item.price * qty`.

    Recommended reporting model:

    - POS crossing remains quantity-based at gross item price.
    - Promotions appear as a separate discount/reconciliation total.
    - Net revenue should subtract item-level discounts.

11. Update demo mode.

    `src/demo/demoServices.ts` should preserve promotion fields on saved bills.
    Optionally seed one demo promotion.

12. Add tests.

    Minimum test cases:

    - one trigger, one target
    - more targets than triggers
    - more triggers than targets
    - variant-specific target
    - inactive rule ignored
    - `max_applications`
    - promotion plus `gutschein`
    - full close bill creation
    - equal split total
    - item split discount follows selected target item

## Suggested Build Order

1. Directus schema migration and permissions.
2. Types and promotion service.
3. Pure `promotionPricing.ts` with tests.
4. Bill factory integration.
5. Full close and split flow integration.
6. Receipt, BillCard, and Daily Sales UI.
7. Demo services.
8. Docs update: `docs/DIRECTUS_SCHEMA.md`, `AGENTS.md`, and `CLAUDE.md` if
   behavior is confirmed.
9. Verification:

   ```bash
   npm.cmd exec tsc -- --noEmit
   npm test
   npm run build
   ```

## Open Business Questions

These should be answered before implementation starts:

1. Should the discount apply once per order, once per trigger item, or once per
   target item?

   Recommended V1: once per matched trigger-target pair, capped by available
   target quantity and optional `max_applications`.

2. Which Zotz bottle variants qualify?

   The schema should support variant-specific rules. For the real Camidi rule,
   confirm whether it applies to `here`, `togo`, or both.

3. Can promotions stack with manual `gutschein`?

   Recommended V1: yes. Promotions are item-linked; `gutschein` is a manual
   bill-level voucher applied after promotions.

4. Should staff confirm promotions?

   Recommended V1: no. Apply automatically and make it visible before payment.

5. How should POS reconciliation work?

   Recommended V1: keep POS crossing quantity-based and show promotions as a
   separate discount total in Daily Sales. Do not create fake POS items unless
   the external POS requires an explicit discount article.

6. Should admin users manage promotions in-app now?

   Recommended V1 decision point:

   - Fastest clean implementation: create/edit promotion rules in Directus UI.
   - Productized implementation: add an AdminView promotions tab after the core
     pricing flow works.

7. Are promotions allowed on custom items?

   Recommended V1: no. Only Directus menu items and variants should qualify.

8. What happens if a promotion is disabled after an order is started?

   Recommended V1: evaluate active rules at payment time, and show the same
   derived state in the bill view. Once a bill is paid, stored bill item
   metadata is immutable.

## Key Design Decision

Do not store live promotion state in `table_sessions` unless a future offline
requirement proves it necessary.

Promotions should be derived from:

```text
current order items + active promotion rules
```

Then promotion metadata should be persisted only at payment time on
`bill_items`.

This keeps active table sync simpler and avoids stale promotion JSON in
multi-device polling.
