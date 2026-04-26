import type { OrderItem, Orders, SentBatches, TableId, TableStatus, ExpandedItem, Destination } from "../types";

export function getTableStatus(
  tableId: TableId,
  orders: Orders,
  seatedTables: Set<TableId> = new Set(),
  sentBatches: SentBatches = {},
  markedBatches: Record<string, Set<number>> = {}
): TableStatus {
  const order = orders[tableId as string];
  const batches = sentBatches[tableId as string] || [];
  const marked = markedBatches[tableId as string];

  if (batches.length > 0) {
    const allMarked = batches.every((_, idx) => marked?.has(idx));
    return allMarked ? "confirmed" : "unconfirmed";
  }

  if (seatedTables.has(tableId) || (order && order.length > 0)) return "seated";

  return "open";
}

export function expandItems(items: OrderItem[]): ExpandedItem[] {
  const expanded: ExpandedItem[] = [];
  let uniqueCounter = 0;
  items.forEach((item, itemIndex) => {
    for (let i = 0; i < item.qty; i++) {
      expanded.push({ ...item, _uid: `${item.id}_${itemIndex}_${i}_${uniqueCounter++}`, qty: 1 });
    }
  });
  return expanded;
}

export function consolidateItems(items: OrderItem[]): OrderItem[] {
  const consolidated = new Map<string, OrderItem>();

  items.forEach((item) => {
    if (consolidated.has(item.id)) {
      const existing = consolidated.get(item.id)!;
      existing.qty += item.qty;
    } else {
      consolidated.set(item.id, { ...item });
    }
  });

  return Array.from(consolidated.values());
}

export function getItemDestination(item: {
  id?: string | number;
  destination?: string;
  category?: string;
  subcategory?: string;
}): Destination {
  if (item.destination) return item.destination as Destination;

  const id = String(item.id ?? "");
  if (
    id.startsWith("wg") || id.startsWith("dr") || id.startsWith("te") || id.startsWith("co") ||
    id.endsWith("_bottle") || item.category === "Wines" || item.category === "Drinks" ||
    ["cognac", "calvados", "mirabelle", "jameson", "creme_calvados"].includes(id.split("-")[0]) ||
    id.includes("saft") || id.includes("schorle") || id.includes("wasser")
  ) {
    return "bar";
  }
  if (item.subcategory === "cheese" || item.category === "Shop" || id.startsWith("sh")) {
    return "counter";
  }
  return "kitchen";
}

export function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  items.forEach((item) => {
    const value = String(item[key]);
    if (!grouped[value]) {
      grouped[value] = [];
    }
    grouped[value].push(item);
  });
  return grouped;
}
