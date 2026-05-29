Our restaurant owner sometimes makes promotions such as : when clients have a fondue they get 2€ off the Zotz wine bottle. But currently this doesn't fit our frontend or database schema. I've had a short claude session about this, here it is:

## The Problem, Precisely

The promotion you're describing is a **conditional item discount**: if item A is in the order, item B gets X€ off. The current system has no concept of this.

---

## Where the Schema Breaks Down

### 1. The gutschein field is too blunt
table_sessions.gutschein and bills.gutschein are single decimal values — just a flat reduction on the total. They carry no metadata about why the discount was applied, which item triggered it, or which item received it. Using this for promotions would require staff to manually calculate and type the amount, with zero auditability.

### 2. bill_items has no discount column
The bill_items row for the Zotz bottle only has price (a snapshot at payment time). If you apply a 2€ promo, you'd either:
- Store the already-reduced price → **loses the original price and audit trail**
- Or silently add the 2€ to gutschein → **indistinguishable from a manual voucher**

There's no original_price, discount, or discount_reason field.

### 3. OrderItem (the in-flight type) has no discount concept
The orders: json blob in table_sessions holds OrderItem[]. These objects track qty, sentQty, price, etc., but no discount state. So there's nowhere to represent "this Zotz bottle currently has a 2€ promo applied" before payment.

### 4. No promotions rule engine exists
There's no promotions collection and no frontend logic to evaluate "does the current order qualify for any promotion?" The billFactory.ts that builds bill_items at close time would need an injection point for promotion calculations.

### 5. UI has no affordance for promotions
Neither OrderView, TicketView, nor BillView / BillCard show applied discounts at item level. The GutscheinModal handles the only current discount flow, but it's freeform and not item-linked.

---

## The Subtleties Worth Thinking About

Before any implementation, a few business rule questions that the current schema forces you to answer explicitly:

| Question | Why it matters |
|---|---|
| Apply per bottle or once per order? | 2 fondues + 3 Zotz → discount 3 bottles? Or capped at 1? |
| Which Zotz variant? Here only, or to-go too? | The bottle likely has here/togo variants — do both qualify? |
| Promotion + gutschein stacking? | Can a customer use both a promo and a manual voucher? |
| Staff-triggered or automatic? | Auto-detect on order makes sense but raises "who confirms it?" |
| POS crossing impact? | If the Zotz is entered at full price in POS, how do you reconcile the 2€ diff? |

---

## What a Clean Solution Would Require

At minimum, three things need to change:

1. **A promotions collection** — defines trigger item ID(s), target item ID(s), discount type (flat/percent), amount, and active flag. Lives in Directus.

2. **discount + discount_reason on bill_items** — to record what was deducted and why, immutably at payment time.

3. **A promotion evaluation pass in the frontend** — either reactive (recomputes as items are added to the order in OrderView) or applied at close time in billFactory.ts. Given the real-time sync model, reactive is better so staff sees the discount before payment.

The gutschein field would remain for manual vouchers; promotions would be a distinct, traceable mechanism.

---

**Bottom line:** The current schema conflates "voucher entered by staff" with any notion of discount. Promotions are structurally different — they're rule-based, item-linked, and should be auditable. Right now there's nowhere in the DB or the frontend to represent that relationship cleanly.


Me: Do you feel that such an implementation would be gimmicky or rather structurally sound? Is that a feature that future clients might use?

Honest take: **the need is real, but the risk is in how you scope it.**

---

## Is It Gimmicky?

No — and here's why. Conditional item discounts are a core commercial pattern in exactly the venues TableOrders targets:

- **Cheese shops / fondues** — food + wine pairing deals are bread and butter (Camidi is the proof)
- **Wine bars** — "bottle of X with a charcuterie board → 3€ off" is a standard upsell tactic
- **Small restaurants** — seasonal combo menus, prix-fixe-adjacent promos

This isn't a feature someone dreamed up. A real client asked for it on day one of using the product. That's about as strong a signal as you get.

The gimmicky risk is if you over-engineer it — building a full rule engine with stacking logic, percentage discounts, time windows, and per-user targeting for a restaurant that has 11 tables and two staff credentials. That would be premature complexity.

---

## Is It Structurally Sound?

Yes, if you keep the scope tight. The minimal structurally sound version is:

- A promotions collection in Directus (configurable by the admin without a developer)
- Simple flat rules: trigger item ID → target item ID → discount amount → active flag
- One evaluation pass at bill-close time, recorded immutably on bill_items
- Visible in TicketView before payment so staff can explain it to the guest

That's maybe 3–4 days of work, adds one table to the schema, and covers 95% of real-world restaurant promotion patterns.

What makes it structurally unsound is if you bolt it onto gutschein — that path trades short-term speed for permanent auditability debt.

---

## Would Future Clients Use It?

**Yes — and it's actually a differentiator in the segment you're targeting.**

Mainstream POS systems (Square, Lightspeed, SumUp) handle promotions, but they handle them at payment time, invisibly to floor staff. TableOrders shows the discount during service — the waiter sees it before the bill is printed, which is when it matters for guest conversation. That's a UX gap the big players have.

For a small wine bar owner evaluating the product, "I can set up a food-wine pairing promo that staff see in real time" is a concrete, memorable selling point. Much more so than "multi-device sync" which they expect as table stakes.

---