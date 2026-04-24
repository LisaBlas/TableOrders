import {
  createContext, useContext, useState, useCallback, useEffect, useRef, useMemo,
  type ReactNode,
} from "react";
import { useApp } from "./AppContext";
import { useMenu } from "./MenuContext";
import { useDirectusSync } from "../hooks/useDirectusSync";
import type {
  Orders, OrderItem, SentBatches, Batch, GutscheinAmounts,
  TableId, MenuItem, MenuItemVariant, MenuCategory, ExpandedItem,
} from "../types";

interface TableContextValue {
  // State
  orders: Orders;
  seatedTables: Set<TableId>;
  sentBatches: SentBatches;
  gutscheinAmounts: GutscheinAmounts;
  markedBatches: Record<string, Set<number>>;

  // Actions
  addItem: (tableId: TableId, item: MenuItem, variant: MenuItemVariant | null, category: MenuCategory, note?: string) => void;
  addCustomItem: (tableId: TableId, item: OrderItem) => void;
  removeItem: (tableId: TableId, itemId: string) => void;
  removeItemFromBill: (tableId: TableId, itemId: string) => void;
  addItemToBill: (tableId: TableId, itemId: string) => void;
  sendOrder: (tableId: TableId) => void;
  addBillEditBatch: (tableId: TableId, batchItems: OrderItem[]) => void;
  seatTable: (tableId: TableId) => void;
  applyGutschein: (tableId: TableId, amount: number) => void;
  removeGutschein: (tableId: TableId) => void;
  cleanupTable: (tableId: TableId) => void;
  removePaidItems: (tableId: TableId, paidItems: ExpandedItem[]) => void;
  toggleMarkBatch: (tableId: TableId, batchIndex: number) => void;
  swapTables: (fromTableId: TableId, toTableId: TableId) => void;
}

const TableContext = createContext<TableContextValue | null>(null);

export function TableProvider({ children }: { children: ReactNode }) {
  const { showToast } = useApp();
  const { minQty2Ids } = useMenu();

  // ── State ─────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Orders>({});
  const [seatedTablesArr, setSeatedTablesArr] = useState<TableId[]>([]);
  const [sentBatches, setSentBatches] = useState<SentBatches>({});
  const [gutscheinAmounts, setGutscheinAmounts] = useState<GutscheinAmounts>({});
  const [markedBatches, setMarkedBatches] = useState<Record<string, Set<number>>>({});

  const seatedTables = useMemo(() => new Set<TableId>(seatedTablesArr), [seatedTablesArr]);

  // sendOrder reads orders synchronously before any setState fires
  const ordersRef = useRef(orders);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  // ── Directus sync (polling, debounced writes, conflict resolution) ─────────
  const { scheduleWrite, cancelAndDelete } = useDirectusSync(
    { orders, seatedTablesArr, sentBatches, gutscheinAmounts, markedBatches },
    { setOrders, setSeatedTablesArr, setSentBatches, setGutscheinAmounts, setMarkedBatches },
    showToast
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const seatTable = useCallback((tableId: TableId) => {
    setSeatedTablesArr((prev) => {
      const s = new Set<TableId>(prev);
      s.add(tableId);
      return Array.from(s);
    });
    scheduleWrite(tableId);
  }, [scheduleWrite]);

  const addItem = useCallback((tableId: TableId, item: MenuItem, variant: MenuItemVariant | null, category: MenuCategory, note?: string) => {
    if (!variant && item.price == null) {
      showToast("Item is missing a price");
      return;
    }

    const baseOrderItem = variant
      ? {
          id: `${item.id}-${variant.type}`,
          name: `${item.name} (${variant.label})`,
          shortName: item.shortName,
          price: variant.price,
          baseId: item.id,
          variantType: variant.type,
          subcategory: item.subcategory,
          category,
          posId: variant.posId,
          posName: item.shortName,
        }
      : {
          id: item.id,
          name: item.name,
          shortName: item.shortName,
          price: item.price ?? 0,
          subcategory: item.subcategory,
          posId: item.posId,
          posName: item.posName,
          category,
        };

    const orderItem = note
      ? { ...baseOrderItem, id: `${baseOrderItem.id}-note-${Date.now()}`, note }
      : baseOrderItem;

    setOrders((prev) => {
      const current = prev[String(tableId)] || [];
      const existing = note ? null : current.find((o: OrderItem) => o.id === orderItem.id);
      if (existing) {
        return {
          ...prev,
          [String(tableId)]: [
            ...current.filter((o: OrderItem) => o.id !== orderItem.id),
            { ...existing, qty: existing.qty + 1 },
          ],
        };
      }
      const initialQty = minQty2Ids.has(item.id) ? 2 : 1;
      return { ...prev, [String(tableId)]: [...current, { ...orderItem, qty: initialQty, sentQty: 0 }] };
    });
    showToast(`+ ${baseOrderItem.name}`);
    scheduleWrite(tableId);
  }, [showToast, minQty2Ids, scheduleWrite]);

  const addCustomItem = useCallback((tableId: TableId, item: OrderItem) => {
    setOrders((prev) => {
      const current = prev[String(tableId)] || [];
      return { ...prev, [String(tableId)]: [...current, item] };
    });
    scheduleWrite(tableId);
  }, [scheduleWrite]);

  const removeItem = useCallback((tableId: TableId, itemId: string) => {
    setOrders((prev) => {
      const current = prev[String(tableId)] || [];
      return {
        ...prev,
        [String(tableId)]: current
          .map((o: OrderItem) => {
            if (o.id === itemId) {
              const unsent = o.qty - (o.sentQty || 0);
              if (unsent > 0) {
                const newQty = o.qty - 1;
                if (newQty === 1 && minQty2Ids.has(o.id)) return { ...o, qty: 0 };
                return { ...o, qty: newQty };
              }
            }
            return o;
          })
          .filter((o: OrderItem) => o.qty > 0),
      };
    });
    scheduleWrite(tableId);
  }, [minQty2Ids, scheduleWrite]);

  const removeItemFromBill = useCallback((tableId: TableId, itemId: string) => {
    setOrders((prev) => {
      const current = prev[String(tableId)] || [];
      return {
        ...prev,
        [String(tableId)]: current
          .map((o: OrderItem) => {
            if (o.id === itemId && (o.sentQty || 0) > 0) {
              if (o.qty <= 2 && minQty2Ids.has(o.id)) return o;
              return { ...o, qty: o.qty - 1, sentQty: (o.sentQty || 0) - 1 };
            }
            return o;
          })
          .filter((o: OrderItem) => o.qty > 0),
      };
    });
    scheduleWrite(tableId);
  }, [minQty2Ids, scheduleWrite]);

  const addItemToBill = useCallback((tableId: TableId, itemId: string) => {
    setOrders((prev) => {
      const current = prev[String(tableId)] || [];
      return {
        ...prev,
        [String(tableId)]: current.map((o: OrderItem) =>
          o.id === itemId ? { ...o, qty: o.qty + 1, sentQty: (o.sentQty || 0) + 1 } : o
        ),
      };
    });
    scheduleWrite(tableId);
  }, [scheduleWrite]);

  const sendOrder = useCallback((tableId: TableId) => {
    const current = ordersRef.current[String(tableId)] || [];
    const hasUnsent = current.some((o: OrderItem) => o.qty - (o.sentQty || 0) > 0);
    if (!hasUnsent) return;

    const batchItems = current
      .filter((o: OrderItem) => o.qty - (o.sentQty || 0) > 0)
      .map((o: OrderItem) => ({ ...o, qty: o.qty - (o.sentQty || 0) }));

    const batch: Batch = { timestamp: new Date().toISOString(), items: batchItems };

    setSentBatches((prev) => ({
      ...prev,
      [String(tableId)]: [...(prev[String(tableId)] || []), batch],
    }));
    setOrders((prev) => ({
      ...prev,
      [String(tableId)]: (prev[String(tableId)] || []).map((o: OrderItem) => ({ ...o, sentQty: o.qty })),
    }));
    showToast("Order sent!");
    scheduleWrite(tableId);
  }, [showToast, scheduleWrite]);

  const addBillEditBatch = useCallback((tableId: TableId, batchItems: OrderItem[]) => {
    if (!batchItems.length) return;
    const batch: Batch = { timestamp: new Date().toISOString(), items: batchItems };
    setSentBatches((prev) => ({
      ...prev,
      [String(tableId)]: [...(prev[String(tableId)] || []), batch],
    }));
    scheduleWrite(tableId);
  }, [scheduleWrite]);

  const applyGutschein = useCallback((tableId: TableId, amount: number) => {
    setGutscheinAmounts((prev) => ({ ...prev, [String(tableId)]: amount }));
    showToast(`Gutschein ${amount.toFixed(2)}€ applied`);
    scheduleWrite(tableId);
  }, [showToast, scheduleWrite]);

  const removeGutschein = useCallback((tableId: TableId) => {
    setGutscheinAmounts((prev) => {
      const next = { ...prev };
      delete next[String(tableId)];
      return next;
    });
    showToast("Gutschein removed");
    scheduleWrite(tableId);
  }, [showToast, scheduleWrite]);

  const toggleMarkBatch = useCallback((tableId: TableId, batchIndex: number) => {
    setMarkedBatches((prev) => {
      const tableMarks = prev[String(tableId)] || new Set<number>();
      const next = new Set(tableMarks);
      if (next.has(batchIndex)) next.delete(batchIndex); else next.add(batchIndex);
      return { ...prev, [String(tableId)]: next };
    });
    scheduleWrite(tableId);
  }, [scheduleWrite]);

  const cleanupTable = useCallback((tableId: TableId) => {
    const key = String(tableId);
    setOrders((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setSeatedTablesArr((prev) => prev.filter((id) => String(id) !== key));
    setSentBatches((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setGutscheinAmounts((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setMarkedBatches((prev) => { const n = { ...prev }; delete n[key]; return n; });
    cancelAndDelete(tableId);
  }, [cancelAndDelete]);

  const removePaidItems = useCallback((tableId: TableId, paidItems: ExpandedItem[]) => {
    setOrders((prev) => {
      const current = prev[String(tableId)] || [];
      const paidCounts = new Map<string, number>();
      paidItems.forEach((item) => {
        paidCounts.set(item.id, (paidCounts.get(item.id) || 0) + 1);
      });
      return {
        ...prev,
        [String(tableId)]: current
          .map((o: OrderItem) => {
            const paid = paidCounts.get(o.id) || 0;
            return paid > 0
              ? { ...o, qty: o.qty - paid, sentQty: (o.sentQty || 0) - paid }
              : o;
          })
          .filter((o: OrderItem) => o.qty > 0),
      };
    });
    scheduleWrite(tableId);
  }, [scheduleWrite]);

  const swapTables = useCallback((fromId: TableId, toId: TableId) => {
    const fk = String(fromId);
    const tk = String(toId);

    setOrders((prev) => {
      const n = { ...prev };
      const f = prev[fk]; const t = prev[tk];
      if (t !== undefined) n[fk] = t; else delete n[fk];
      if (f !== undefined) n[tk] = f; else delete n[tk];
      return n;
    });
    setSentBatches((prev) => {
      const n = { ...prev };
      const f = prev[fk]; const t = prev[tk];
      if (t !== undefined) n[fk] = t; else delete n[fk];
      if (f !== undefined) n[tk] = f; else delete n[tk];
      return n;
    });
    setMarkedBatches((prev) => {
      const n = { ...prev };
      const f = prev[fk]; const t = prev[tk];
      if (t !== undefined) n[fk] = t; else delete n[fk];
      if (f !== undefined) n[tk] = f; else delete n[tk];
      return n;
    });
    setGutscheinAmounts((prev) => {
      const n = { ...prev };
      const f = prev[fk]; const t = prev[tk];
      if (t !== undefined) n[fk] = t; else delete n[fk];
      if (f !== undefined) n[tk] = f; else delete n[tk];
      return n;
    });
    setSeatedTablesArr((prev) => {
      const s = new Set<TableId>(prev);
      const fromSeated = s.has(fromId); const toSeated = s.has(toId);
      if (toSeated) s.add(fromId); else s.delete(fromId);
      if (fromSeated) s.add(toId); else s.delete(toId);
      return Array.from(s);
    });

    showToast(`Table ${fromId} ⇄ Table ${toId}`);
    scheduleWrite(fromId);
    scheduleWrite(toId);
  }, [showToast, scheduleWrite]);

  return (
    <TableContext.Provider value={{
      orders, seatedTables, sentBatches, gutscheinAmounts, markedBatches,
      addItem, addCustomItem, removeItem, removeItemFromBill, addItemToBill,
      sendOrder, addBillEditBatch, seatTable,
      applyGutschein, removeGutschein,
      cleanupTable, removePaidItems, toggleMarkBatch, swapTables,
    }}>
      {children}
    </TableContext.Provider>
  );
}

export function useTable() {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error("useTable must be used within TableProvider");
  return ctx;
}
