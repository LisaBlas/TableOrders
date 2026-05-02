import { describe, it, expect } from "vitest";
import {
  getBillSubtotal,
  calculateEqualSplitTip,
  createFullTableBill,
} from "../billFactory";
import type { OrderItem, PaymentInput } from "../../types";

function makeItem(price: number, qty: number, sentQty: number): OrderItem {
  return { id: "test-id", name: "Test Item", price, qty, sentQty };
}

function pay(amount: string, confirmed: boolean): PaymentInput {
  return { amount, confirmed };
}

// ── getBillSubtotal ───────────────────────────────────────────────────────────

describe("getBillSubtotal", () => {
  it("uses sentQty, not qty", () => {
    // qty=3 means 3 ordered, sentQty=2 means 2 sent — only sent items are billed
    expect(getBillSubtotal([makeItem(5, 3, 2)])).toBe(10);
  });

  it("treats missing sentQty as 0", () => {
    const item = { ...makeItem(5, 3, 0) };
    expect(getBillSubtotal([item])).toBe(0);
  });

  it("sums multiple items by sentQty", () => {
    const items = [makeItem(10, 3, 2), makeItem(5, 4, 1)];
    expect(getBillSubtotal(items)).toBe(25); // 10*2 + 5*1
  });

  it("returns 0 for empty item list", () => {
    expect(getBillSubtotal([])).toBe(0);
  });
});

// ── calculateEqualSplitTip ────────────────────────────────────────────────────

describe("calculateEqualSplitTip — €10 / 3 guests (share=3.33, last=3.34)", () => {
  // equalShare=3.33 is the rounded-down per-guest amount passed from SplitEqualView.
  // lastGuestShare is computed inside the function: round((10 - 3.33*2)*100)/100 = 3.34.

  it("partial: 2 of 3 guests pay 3.33 → tip = 0 (not −0.01)", () => {
    // Before all guests confirm, expected = paid guests × equalShare → no rounding gap yet.
    const payments = [pay("3.33", true), pay("3.33", true), pay("", false)];
    expect(calculateEqualSplitTip(payments, 3.33, 3, 10)).toBe(0);
  });

  it("complete: all 3 confirm, last pays 3.34 → tip = 0", () => {
    // Last guest's default is lastGuestShare (3.34), absorbing the rounding remainder.
    const payments = [pay("3.33", true), pay("3.33", true), pay("3.34", true)];
    expect(calculateEqualSplitTip(payments, 3.33, 3, 10)).toBe(0);
  });

  it("guests pay extra → positive tip", () => {
    const payments = [pay("3.33", true), pay("3.33", true), pay("4.00", true)];
    expect(calculateEqualSplitTip(payments, 3.33, 3, 10)).toBeCloseTo(0.66, 10);
  });

  it("no confirmed payments → 0", () => {
    expect(calculateEqualSplitTip([pay("3.33", false)], 3.33, 3, 10)).toBe(0);
  });
});

describe("calculateEqualSplitTip — edge cases", () => {
  it("single guest pays exact amount → tip = 0", () => {
    expect(calculateEqualSplitTip([pay("10.00", true)], 10, 1, 10)).toBe(0);
  });

  it("single guest pays more → positive tip", () => {
    expect(calculateEqualSplitTip([pay("12.00", true)], 10, 1, 10)).toBeCloseTo(2, 10);
  });
});

// ── createFullTableBill ───────────────────────────────────────────────────────

describe("createFullTableBill", () => {
  it("qty=3 sentQty=2: bill total = price × sentQty (not × qty)", () => {
    const orders = { "1": [makeItem(5, 3, 2)] };
    const bill = createFullTableBill({ tableId: "1", orders });
    expect(bill.total).toBe(10); // 5*2=10, not 5*3=15
  });

  it("unsent items (sentQty=0) are excluded from the bill", () => {
    const orders = { "1": [makeItem(5, 3, 0)] };
    const bill = createFullTableBill({ tableId: "1", orders });
    expect(bill.total).toBe(0);
    expect(bill.items).toHaveLength(0);
  });

  it("gutschein reduces the total but not below zero", () => {
    const orders = { "1": [makeItem(5, 2, 2)] }; // subtotal=10
    const bill = createFullTableBill({ tableId: "1", orders, gutschein: 3 });
    expect(bill.total).toBe(7);
    expect(bill.subtotal).toBe(10);
    expect(bill.gutschein).toBe(3);
  });

  it("gutschein larger than subtotal clamps total to 0", () => {
    const orders = { "1": [makeItem(5, 2, 2)] }; // subtotal=10
    const bill = createFullTableBill({ tableId: "1", orders, gutschein: 15 });
    expect(bill.total).toBe(0);
  });

  it("bill items have qty normalized to sentQty", () => {
    const orders = { "1": [makeItem(5, 3, 2)] };
    const bill = createFullTableBill({ tableId: "1", orders });
    expect(bill.items[0].qty).toBe(2); // normalized from sentQty=2
  });
});
