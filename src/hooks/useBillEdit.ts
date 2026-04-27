import { useState } from "react";
import { useTable } from "../contexts/TableContext";
import type { OrderItem, TableId } from "../types";

export function useBillEdit(tableId: TableId) {
  const table = useTable();
  const [editingBill, setEditingBill] = useState(false);
  const [billEditSnapshot, setBillEditSnapshot] = useState<OrderItem[] | null>(null);

  const startBillEdit = () => {
    const current = table.orders[tableId] || [];
    setBillEditSnapshot(current.map((o: OrderItem) => ({ ...o })));
    setEditingBill(true);
  };

  const confirmBillEdit = () => {
    if (billEditSnapshot) {
      const current = table.orders[tableId] || [];
      const increments: OrderItem[] = [];
      const decrements: { id: string; qty: number }[] = [];

      for (const o of current) {
        const snap = billEditSnapshot.find((s: OrderItem) => s.id === o.id);
        const prevSent = snap ? snap.sentQty || 0 : 0;
        const diff = (o.sentQty || 0) - prevSent;
        if (diff > 0) increments.push({ ...o, qty: diff });
        else if (diff < 0) decrements.push({ id: o.id, qty: -diff });
      }

      // Items fully removed (in snapshot but gone from current orders)
      for (const snap of billEditSnapshot) {
        if (!current.find((o: OrderItem) => o.id === snap.id) && (snap.sentQty || 0) > 0) {
          decrements.push({ id: snap.id, qty: snap.sentQty });
        }
      }

      if (increments.length > 0) table.addBillEditBatch(tableId, increments);
      if (decrements.length > 0) table.removeBillEditItems(tableId, decrements);
    }
    setEditingBill(false);
    setBillEditSnapshot(null);
  };

  return { editingBill, startBillEdit, confirmBillEdit };
}
