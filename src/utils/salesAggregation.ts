import type { Bill, OrderItem } from "../types";

export interface PosEntry {
  posId: string;
  posName: string;
  qty: number;
  revenue: number;
  items: string[];
}

function addToMap(
  map: Map<string, PosEntry>,
  posId: string,
  posName: string,
  item: OrderItem,
  qty: number,
) {
  if (qty <= 0) return;

  const key = `${posId}::${posName}::${item.name}`;
  if (!map.has(key)) {
    map.set(key, { posId, posName, qty: 0, revenue: 0, items: [] });
  }

  const entry = map.get(key)!;
  entry.qty += qty;
  entry.revenue += item.price * qty;
  if (!entry.items.includes(item.name)) entry.items.push(item.name);
}

function parsePos(id: string) {
  const parts = id.split("-");
  return { base: parseInt(parts[0]) || 0, suffix: parseInt(parts[1]) || 0 };
}

function sortPosEntries(map: Map<string, PosEntry>) {
  return Array.from(map.values()).sort((a, b) => {
    const posA = parsePos(a.posId);
    const posB = parsePos(b.posId);
    return posA.base !== posB.base ? posA.base - posB.base : posA.suffix - posB.suffix;
  });
}

export function isMissingPosId(id: string) {
  return id === "NO_POS_ID" || id === "0000";
}

export function aggregateDailySales(paidBills: Bill[]) {
  const activeMap = new Map<string, PosEntry>();

  paidBills.forEach((bill) => {
    const billRemoved = !!bill.addedToPOS;

    bill.items.forEach((item) => {
      const posId = item.posId || "NO_POS_ID";
      const posName = item.posName || item.shortName || item.name;
      const crossedCount = item.crossedQty ?? (item.crossed ? item.qty : 0);
      const activeCount = billRemoved ? 0 : item.qty - crossedCount;

      addToMap(activeMap, posId, posName, item, activeCount);
    });
  });

  const activeAll = sortPosEntries(activeMap);

  // Include bills that are fully marked as added OR have any crossed items
  const billsWithCrossedItems = paidBills.filter((bill) => {
    if (bill.addedToPOS) return true;
    return bill.items.some((item) => {
      const crossedQty = item.crossedQty ?? (item.crossed ? item.qty : 0);
      return crossedQty > 0;
    });
  });

  return {
    addedToPOSBills: billsWithCrossedItems,
    withPosId: activeAll.filter((item) => !isMissingPosId(item.posId)),
    missingPosId: activeAll.filter((item) => isMissingPosId(item.posId)),
  };
}

