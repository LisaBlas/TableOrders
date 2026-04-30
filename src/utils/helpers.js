export function getTableStatus(tableId, orders, seatedTables = new Set(), sentBatches = {}, markedBatches = {}) {
  const order = orders[tableId];
  const batches = sentBatches[tableId] || [];
  const marked = markedBatches[tableId]; // Set<string> | undefined

  if (batches.length > 0) {
    const allMarked = batches.every((batch) => marked?.has(batch.id ?? batch.timestamp));
    return allMarked ? "confirmed" : "unconfirmed";
  }

  // No sent batches — check if table is active (seated or has pending items)
  if (seatedTables.has(tableId) || (order && order.length > 0)) return "seated";

  return "open";
}

// Expand items so qty > 1 becomes N individual lines for per-item splitting
export function expandItems(items) {
  const expanded = [];
  let uniqueCounter = 0;
  items.forEach((item, itemIndex) => {
    for (let i = 0; i < item.qty; i++) {
      expanded.push({ ...item, _uid: `${item.id}_${itemIndex}_${i}_${uniqueCounter++}`, qty: 1 });
    }
  });
  return expanded;
}

// Consolidate items with same ID by summing their quantities
export function consolidateItems(items) {
  const consolidated = new Map();

  items.forEach((item) => {
    if (consolidated.has(item.id)) {
      const existing = consolidated.get(item.id);
      existing.qty += item.qty;
    } else {
      consolidated.set(item.id, { ...item });
    }
  });

  return Array.from(consolidated.values());
}

// Determine destination for an item (Bar, Counter, Kitchen)
export function getItemDestination(item) {
  // Use destination field from Directus if available
  if (item.destination) return item.destination;

  // Legacy fallback for static menu items with string IDs
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

// Group items by a property (e.g., subcategory)
export function groupBy(items, key) {
  const grouped = {};
  items.forEach((item) => {
    const value = item[key];
    if (!grouped[value]) {
      grouped[value] = [];
    }
    grouped[value].push(item);
  });
  return grouped;
}
