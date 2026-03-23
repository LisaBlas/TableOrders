export function getTableStatus(tableId, orders, seatedTables = new Set()) {
  const order = orders[tableId];
  const hasOrders = order && order.length > 0;

  if (hasOrders) {
    const hasOrdered = order.some((item) => item.sent);
    if (hasOrdered) return "ordered";
    return "taken";
  }

  // No orders - check if table is seated
  if (seatedTables.has(tableId)) return "taken";

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

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text).catch(() => {});
}

export function formatTicketText(tableId, items) {
  const total = items.reduce((s, o) => s + o.price * o.qty, 0);
  return `TICKET — Table ${tableId}\n${"─".repeat(28)}\n${items
    .map((o) => `${o.qty}x ${o.name.padEnd(22)} ${(o.price * o.qty).toFixed(2)}€`)
    .join("\n")}\n${"─".repeat(28)}\nTOTAL  ${total.toFixed(2)}€`;
}

export function formatOrderText(tableId, items) {
  return `ORDER — Table ${tableId}\n${new Date().toLocaleTimeString()}\n\n${items
    .map((o) => `${o.qty}x  ${o.name}  (${(o.price * o.qty).toFixed(2)}€)`)
    .join("\n")}`;
}
