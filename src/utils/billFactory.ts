import type { Bill, OrderItem, PaymentInput, SplitPayment, TableId } from "../types";

type OrdersByTable = Record<string, OrderItem[]>;
type BillWithTip = Bill & { tip?: number };

export function getSentBillItems(orders: OrdersByTable, tableId: TableId): OrderItem[] {
  return (orders[String(tableId)] || []).filter((item) => (item.sentQty || 0) > 0);
}

export function getBillSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * (item.sentQty || 0), 0);
}

export function getBillTotal(subtotal: number, gutschein = 0): number {
  return Math.max(0, subtotal - gutschein);
}

export function toPaidBillItems(items: OrderItem[]): OrderItem[] {
  return items.map((item) => ({ ...item, qty: item.sentQty || 0 }));
}

function baseTableBill(tableId: TableId, items: OrderItem[], gutschein = 0) {
  const subtotal = getBillSubtotal(items);
  const total = getBillTotal(subtotal, gutschein);

  return {
    tableId,
    items: toPaidBillItems(items),
    total,
    subtotal: gutschein > 0 ? subtotal : undefined,
    gutschein: gutschein > 0 ? gutschein : undefined,
    timestamp: new Date().toISOString(),
  };
}

export function createFullTableBill(params: {
  tableId: TableId;
  orders: OrdersByTable;
  gutschein?: number;
}): Bill {
  const items = getSentBillItems(params.orders, params.tableId);
  return {
    ...baseTableBill(params.tableId, items, params.gutschein),
    paymentMode: "full",
  };
}

export function calculateEqualSplitTip(
  equalPayments: PaymentInput[],
  equalShare: number,
): number {
  const confirmedPayments = equalPayments.filter((payment) => payment.confirmed);
  const totalPaid = confirmedPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  return totalPaid > 0 ? totalPaid - confirmedPayments.length * equalShare : 0;
}

export function createEqualSplitTableBill(params: {
  tableId: TableId;
  orders: OrdersByTable;
  gutschein?: number;
  guests: number;
  equalPayments: PaymentInput[];
  equalShare: number;
}): BillWithTip {
  const items = getSentBillItems(params.orders, params.tableId);
  const tip = calculateEqualSplitTip(params.equalPayments, params.equalShare);

  return {
    ...baseTableBill(params.tableId, items, params.gutschein),
    paymentMode: "equal",
    splitData: { guests: params.guests },
    tip: tip !== 0 ? tip : undefined,
  };
}

export function calculateItemSplitTip(
  payments: SplitPayment[],
  itemPayments: Record<number, PaymentInput>,
): number {
  return payments
    .filter((payment) => itemPayments[payment.guestNum]?.confirmed)
    .reduce((sum, payment) => {
      const paid = parseFloat(itemPayments[payment.guestNum].amount);
      return sum + (paid - payment.total);
    }, 0);
}

export function createItemSplitTableBill(params: {
  tableId: TableId;
  orders: OrdersByTable;
  gutschein?: number;
  payments: SplitPayment[];
  itemPayments: Record<number, PaymentInput>;
}): BillWithTip {
  const items = getSentBillItems(params.orders, params.tableId);
  const tip = calculateItemSplitTip(params.payments, params.itemPayments);

  return {
    ...baseTableBill(params.tableId, items, params.gutschein),
    paymentMode: "item",
    splitData: { payments: params.payments },
    tip: tip !== 0 ? tip : undefined,
  };
}

