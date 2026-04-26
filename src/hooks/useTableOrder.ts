import { useMemo } from "react";
import { useTable } from "../contexts/TableContext";
import type { TableId } from "../types";

export function useTableOrder(tableId: TableId | null) {
  const { orders, sentBatches } = useTable();

  const items = useMemo(() => {
    if (!tableId) return [];
    return orders[tableId] || [];
  }, [orders, tableId]);

  const unsent = items
    .map((o) => ({ ...o, qty: o.qty - (o.sentQty || 0) }))
    .filter((o) => o.qty > 0);

  const sent = items
    .map((o) => ({ ...o, qty: o.sentQty || 0 }))
    .filter((o) => o.qty > 0);

  const total = items.reduce((s, o) => s + o.price * o.qty, 0);
  const unsentTotal = unsent.reduce((s, o) => s + o.price * o.qty, 0);
  const sentTotal = sent.reduce((s, o) => s + o.price * o.qty, 0);

  const batches = useMemo(() => {
    if (!tableId) return [];
    return sentBatches[tableId] || [];
  }, [sentBatches, tableId]);

  return { items, unsent, sent, total, unsentTotal, sentTotal, batches };
}
