import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useApp } from "./AppContext";
import { MENU, MIN_QTY_2_IDS } from "../data/constants";
import type { Orders, OrderItem, SentBatches, Batch, GutscheinAmounts, TableId, MenuItem, MenuItemVariant, MenuCategory } from "../types";

interface TableContextValue {
  // State
  orders: Orders;
  setOrders: React.Dispatch<React.SetStateAction<Orders>>;
  seatedTables: Set<TableId>;
  setSeatedTables: React.Dispatch<React.SetStateAction<Set<TableId>>>;
  sentBatches: SentBatches;
  setSentBatches: React.Dispatch<React.SetStateAction<SentBatches>>;
  gutscheinAmounts: GutscheinAmounts;
  setGutscheinAmounts: React.Dispatch<React.SetStateAction<GutscheinAmounts>>;
  markedBatches: Record<TableId, Set<number>>;
  setMarkedBatches: React.Dispatch<React.SetStateAction<Record<TableId, Set<number>>>>;

  // Actions
  addItem: (tableId: TableId, item: MenuItem, variant: MenuItemVariant | null, category: MenuCategory, note?: string) => void;
  removeItem: (tableId: TableId, itemId: string) => void;
  removeItemFromBill: (tableId: TableId, itemId: string) => void;
  addItemToBill: (tableId: TableId, itemId: string) => void;
  sendOrder: (tableId: TableId) => void;
  seatTable: (tableId: TableId) => void;
  applyGutschein: (tableId: TableId, amount: number) => void;
  removeGutschein: (tableId: TableId) => void;
  cleanupTable: (tableId: TableId) => void;
  toggleMarkBatch: (tableId: TableId, batchIndex: number) => void;
  swapTables: (fromTableId: TableId, toTableId: TableId) => void;
}

const TableContext = createContext<TableContextValue | null>(null);

export function TableProvider({ children }: { children: ReactNode }) {
  const { showToast } = useApp();

  const [orders, setOrders] = useLocalStorage<Orders>("orders", {});
  const [seatedTablesArr, setSeatedTablesArr] = useLocalStorage<(string | number)[]>("seatedTables", []);
  const [sentBatches, setSentBatches] = useState<SentBatches>({});
  const [gutscheinAmounts, setGutscheinAmounts] = useState<GutscheinAmounts>({});
  const [markedBatches, setMarkedBatches] = useState<Record<TableId, Set<number>>>({});

  // Wrap seatedTables as Set for the API, backed by localStorage array
  const seatedTables = new Set<TableId>(seatedTablesArr);
  const setSeatedTables: React.Dispatch<React.SetStateAction<Set<TableId>>> = (action) => {
    if (typeof action === "function") {
      setSeatedTablesArr((prev) => {
        const prevSet = new Set<TableId>(prev);
        const next = action(prevSet);
        return Array.from(next);
      });
    } else {
      setSeatedTablesArr(Array.from(action));
    }
  };

  const seatTable = useCallback((tableId: TableId) => {
    setSeatedTablesArr((prev) => {
      const s = new Set<TableId>(prev);
      s.add(tableId);
      return Array.from(s);
    });
  }, [setSeatedTablesArr]);

  const addItem = useCallback((tableId: TableId, item: MenuItem, variant: MenuItemVariant | null, category: MenuCategory, note?: string) => {
    const baseOrderItem = variant
      ? {
          id: `${item.id}-${variant.type}`,
          name: `${item.name} (${variant.label})`,
          shortName: variant.shortName
            ? `${item.shortName || item.name} (${variant.label})`
            : item.shortName,
          price: variant.price,
          baseId: item.id,
          variantType: variant.type,
          subcategory: item.subcategory,
          category,
          posId: variant.posId,
          posName: variant.posName,
        }
      : { ...item, category };

    // Items with a note get a unique id so they never merge with the base item
    const orderItem = note
      ? { ...baseOrderItem, id: `${baseOrderItem.id}-note-${Date.now()}`, note }
      : baseOrderItem;

    setOrders((prev) => {
      const current = prev[tableId] || [];
      const existing = note ? null : current.find((o: OrderItem) => o.id === orderItem.id);
      if (existing) {
        return {
          ...prev,
          [tableId]: [
            ...current.filter((o: OrderItem) => o.id !== orderItem.id),
            { ...existing, qty: existing.qty + 1 },
          ],
        };
      }
      const initialQty = MIN_QTY_2_IDS.has(item.id) ? 2 : 1;
      return { ...prev, [tableId]: [...current, { ...orderItem, qty: initialQty, sentQty: 0 }] };
    });
    showToast(`+ ${baseOrderItem.name}`);
  }, [setOrders, showToast]);

  const removeItem = useCallback((tableId: TableId, itemId: string) => {
    setOrders((prev) => {
      const current = prev[tableId] || [];
      return {
        ...prev,
        [tableId]: current
          .map((o: OrderItem) => {
            if (o.id === itemId) {
              const unsent = o.qty - (o.sentQty || 0);
              if (unsent > 0) {
                const newQty = o.qty - 1;
                // Min-2 items can't land on qty=1; skip straight to 0 (full removal)
                if (newQty === 1 && MIN_QTY_2_IDS.has(o.id)) return { ...o, qty: 0 };
                return { ...o, qty: newQty };
              }
            }
            return o;
          })
          .filter((o: OrderItem) => o.qty > 0),
      };
    });
  }, [setOrders]);

  const removeItemFromBill = useCallback((tableId: TableId, itemId: string) => {
    setOrders((prev) => {
      const current = prev[tableId] || [];
      return {
        ...prev,
        [tableId]: current
          .map((o: OrderItem) => {
            if (o.id === itemId && (o.sentQty || 0) > 0) {
              // Min-2 items can't be decremented below 2
              if (o.qty <= 2 && MIN_QTY_2_IDS.has(o.id)) return o;
              return { ...o, qty: o.qty - 1, sentQty: (o.sentQty || 0) - 1 };
            }
            return o;
          })
          .filter((o: OrderItem) => o.qty > 0),
      };
    });
  }, [setOrders]);

  const addItemToBill = useCallback((tableId: TableId, itemId: string) => {
    setOrders((prev) => {
      const current = prev[tableId] || [];
      return {
        ...prev,
        [tableId]: current.map((o: OrderItem) => {
          if (o.id === itemId) {
            return { ...o, qty: o.qty + 1, sentQty: (o.sentQty || 0) + 1 };
          }
          return o;
        }),
      };
    });
  }, [setOrders]);

  const sendOrder = useCallback((tableId: TableId) => {
    // Read current orders to build batch (outside updater to avoid side effects in strict mode)
    const current = orders[tableId] || [];
    const hasUnsent = current.some((o: OrderItem) => o.qty - (o.sentQty || 0) > 0);
    if (!hasUnsent) return;

    const batchItems = current
      .filter((o: OrderItem) => o.qty - (o.sentQty || 0) > 0)
      .map((o: OrderItem) => ({ ...o, qty: o.qty - (o.sentQty || 0) }));

    const batch: Batch = {
      timestamp: new Date().toISOString(),
      items: batchItems,
    };

    setSentBatches((prevBatches) => ({
      ...prevBatches,
      [tableId]: [...(prevBatches[tableId] || []), batch],
    }));

    setOrders((prev) => ({
      ...prev,
      [tableId]: (prev[tableId] || []).map((o: OrderItem) => ({ ...o, sentQty: o.qty })),
    }));

    showToast("Order sent!");
  }, [orders, setOrders, showToast]);

  const applyGutschein = useCallback((tableId: TableId, amount: number) => {
    setGutscheinAmounts((prev) => ({ ...prev, [tableId]: amount }));
    showToast(`Gutschein ${amount.toFixed(2)}€ applied`);
  }, [showToast]);

  const removeGutschein = useCallback((tableId: TableId) => {
    setGutscheinAmounts((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });
    showToast("Gutschein removed");
  }, [showToast]);

  const toggleMarkBatch = useCallback((tableId: TableId, batchIndex: number) => {
    setMarkedBatches((prev) => {
      const tableMarks = prev[tableId] || new Set<number>();
      const next = new Set(tableMarks);
      if (next.has(batchIndex)) {
        next.delete(batchIndex);
      } else {
        next.add(batchIndex);
      }
      return { ...prev, [tableId]: next };
    });
  }, [setMarkedBatches]);

  const swapTables = useCallback((fromTableId: TableId, toTableId: TableId) => {
    // True swap: exchange all state between both tables
    setOrders((prev) => {
      const next = { ...prev };
      const fromData = prev[fromTableId];
      const toData = prev[toTableId];
      if (toData !== undefined) next[fromTableId] = toData; else delete next[fromTableId];
      if (fromData !== undefined) next[toTableId] = fromData; else delete next[toTableId];
      return next;
    });

    setSentBatches((prev) => {
      const next = { ...prev };
      const fromData = prev[fromTableId];
      const toData = prev[toTableId];
      if (toData !== undefined) next[fromTableId] = toData; else delete next[fromTableId];
      if (fromData !== undefined) next[toTableId] = fromData; else delete next[toTableId];
      return next;
    });

    setMarkedBatches((prev) => {
      const next = { ...prev };
      const fromData = prev[fromTableId];
      const toData = prev[toTableId];
      if (toData !== undefined) next[fromTableId] = toData; else delete next[fromTableId];
      if (fromData !== undefined) next[toTableId] = fromData; else delete next[toTableId];
      return next;
    });

    setGutscheinAmounts((prev) => {
      const next = { ...prev };
      const fromData = prev[fromTableId];
      const toData = prev[toTableId];
      if (toData !== undefined) next[fromTableId] = toData; else delete next[fromTableId];
      if (fromData !== undefined) next[toTableId] = fromData; else delete next[toTableId];
      return next;
    });

    setSeatedTablesArr((prev) => {
      const s = new Set<TableId>(prev);
      const fromSeated = s.has(fromTableId);
      const toSeated = s.has(toTableId);
      if (toSeated) s.add(fromTableId); else s.delete(fromTableId);
      if (fromSeated) s.add(toTableId); else s.delete(toTableId);
      return Array.from(s);
    });

    showToast(`Table ${fromTableId} ⇄ Table ${toTableId}`);
  }, [setOrders, setSentBatches, setMarkedBatches, setSeatedTablesArr, setGutscheinAmounts, showToast]);

  const cleanupTable = useCallback((tableId: TableId) => {
    setOrders((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });
    setSeatedTablesArr((prev) => {
      const s = new Set<TableId>(prev);
      s.delete(tableId);
      return Array.from(s);
    });
    setSentBatches((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });
    setGutscheinAmounts((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });
    setMarkedBatches((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });
  }, [setOrders, setSeatedTablesArr, setSentBatches, setMarkedBatches]);

  return (
    <TableContext.Provider value={{
      orders, setOrders,
      seatedTables, setSeatedTables,
      sentBatches, setSentBatches,
      gutscheinAmounts, setGutscheinAmounts,
      markedBatches, setMarkedBatches,
      addItem, removeItem, removeItemFromBill, addItemToBill,
      sendOrder, seatTable,
      applyGutschein, removeGutschein,
      cleanupTable, toggleMarkBatch, swapTables,
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
