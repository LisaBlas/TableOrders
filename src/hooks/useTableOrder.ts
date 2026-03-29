import { useMemo } from "react";
import { useTable } from "../contexts/TableContext";
import type { TableId, OrderItem } from "../types";

export function useTableOrder(tableId: TableId | null) {
  const { orders, sentBatches } = useTable();

  const items = useMemo(() => {
    if (!tableId) return [];
    return orders[tableId] || [];
  }, [orders, tableId]);

  const unsent = useMemo(() => {
    return items
      .map((o) => ({ ...o, qty: o.qty - (o.sentQty || 0) }))
      .filter((o) => o.qty > 0);
  }, [items]);

  const sent = useMemo(() => {
    return items
      .map((o) => ({ ...o, qty: o.sentQty || 0 }))
      .filter((o) => o.qty > 0);
  }, [items]);

  const total = useMemo(() => {
    return items.reduce((s, o) => s + o.price * o.qty, 0);
  }, [items]);

  const unsentTotal = useMemo(() => {
    return unsent.reduce((s, o) => s + o.price * o.qty, 0);
  }, [unsent]);

  const sentTotal = useMemo(() => {
    return sent.reduce((s, o) => s + o.price * o.qty, 0);
  }, [sent]);

  const batches = useMemo(() => {
    if (!tableId) return [];
    return sentBatches[tableId] || [];
  }, [sentBatches, tableId]);

  return { items, unsent, sent, total, unsentTotal, sentTotal, batches };
}
