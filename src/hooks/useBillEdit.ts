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
      const editedItems = current.filter((o: OrderItem) => {
        const snap = billEditSnapshot.find((s: OrderItem) => s.id === o.id);
        if (!snap) return true;
        return o.sentQty !== snap.sentQty || o.qty !== snap.qty;
      });
      if (editedItems.length > 0) {
        const batchItems = editedItems
          .map((o: OrderItem) => {
            const snap = billEditSnapshot.find((s: OrderItem) => s.id === o.id);
            const prevSent = snap ? snap.sentQty || 0 : 0;
            const diff = (o.sentQty || 0) - prevSent;
            return { ...o, qty: Math.abs(diff) };
          })
          .filter((o: OrderItem) => o.qty > 0);

        if (batchItems.length > 0) {
          table.addBillEditBatch(tableId, batchItems);
        }
      }
    }
    setEditingBill(false);
    setBillEditSnapshot(null);
  };

  return { editingBill, startBillEdit, confirmBillEdit };
}
