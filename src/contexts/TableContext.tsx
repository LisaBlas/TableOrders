import {
  createContext, useContext, useState, useCallback, useEffect, useRef, useMemo,
  type ReactNode,
} from "react";
import { useApp } from "./AppContext";
import { useMenu } from "./MenuContext";
import { useDirectusSync } from "../hooks/useDirectusSync";
import { parseTableId } from "../services/directusSessions";
import {
  saveClosedSession, loadClosedSession, clearClosedSession,
  type ArchivedSession,
} from "../utils/closedSessionArchive";
import type { SessionConflict } from "../utils/conflictDetection";
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
  syncError: boolean;

  // Conflicts
  conflicts: SessionConflict[];
  resolveConflict: (conflict: SessionConflict, resolution: "local" | "remote" | "merge") => void;

  // Closed session recovery
  lastClosedSession: ArchivedSession | null;
  reopenLastClosed: () => void;

  // Actions
  addItem: (tableId: TableId, item: MenuItem, variant: MenuItemVariant | null, category: MenuCategory, note?: string) => void;
  addCustomItem: (tableId: TableId, item: OrderItem) => void;
  removeItem: (tableId: TableId, itemId: string) => void;
  removeItemFromBill: (tableId: TableId, itemId: string) => void;
  addItemToBill: (tableId: TableId, itemId: string) => void;
  sendOrder: (tableId: TableId) => void;
  addBillEditBatch: (tableId: TableId, batchItems: OrderItem[]) => void;
  removeBillEditItems: (tableId: TableId, decrements: { id: string; qty: number }[]) => void;
  seatTable: (tableId: TableId) => void;
  applyGutschein: (tableId: TableId, amount: number) => void;
  removeGutschein: (tableId: TableId) => void;
  cleanupTable: (tableId: TableId, billTempId?: string) => void;
  removePaidItems: (tableId: TableId, paidItems: ExpandedItem[]) => void;
  toggleMarkBatch: (tableId: TableId, batchIndex: number) => void;
  swapTables: (fromTableId: TableId, toTableId: TableId) => void;
}

const TableContext = createContext<TableContextValue | null>(null);

export function TableProvider({ children }: { children: ReactNode }) {
  const { showToast, cancelBillByTempId } = useApp();
  const { minQty2Ids } = useMenu();

  // ── State ─────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Orders>({});
  const [seatedTablesArr, setSeatedTablesArr] = useState<TableId[]>([]);
  const [sentBatches, setSentBatches] = useState<SentBatches>({});
  const [gutscheinAmounts, setGutscheinAmounts] = useState<GutscheinAmounts>({});
  const [markedBatches, setMarkedBatches] = useState<Record<string, Set<number>>>({});

  const seatedTables = useMemo(() => new Set<TableId>(seatedTablesArr), [seatedTablesArr]);

  const [lastClosedSession, setLastClosedSession] = useState<ArchivedSession | null>(() => loadClosedSession());

  // Snapshot ref used by cleanupTable to archive state before clearing
  const archiveRef = useRef({ orders, seatedTablesArr, sentBatches, gutscheinAmounts, markedBatches });
  useEffect(() => {
    archiveRef.current = { orders, seatedTablesArr, sentBatches, gutscheinAmounts, markedBatches };
  }, [orders, seatedTablesArr, sentBatches, gutscheinAmounts, markedBatches]);

  // sendOrder reads orders synchronously before any setState fires
  const ordersRef = useRef(orders);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  // ── Directus sync (polling, debounced writes, conflict resolution) ─────────
  const { scheduleWrite, cancelAndDelete, syncError, conflicts, resolveConflict } = useDirectusSync(
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
          [String(tableId)]: current.map((o: OrderItem) =>
            o.id === orderItem.id ? { ...o, qty: o.qty + 1 } : o
          ),
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

  const removeBillEditItems = useCallback((tableId: TableId, decrements: { id: string; qty: number }[]) => {
    const key = String(tableId);
    setSentBatches((prev) => {
      const batches = (prev[key] || []).map((b) => ({ ...b, items: [...b.items] }));

      for (const { id, qty } of decrements) {
        let remaining = qty;
        for (let i = batches.length - 1; i >= 0 && remaining > 0; i--) {
          const itemIdx = batches[i].items.findIndex((o) => o.id === id);
          if (itemIdx === -1) continue;
          const item = batches[i].items[itemIdx];
          const toRemove = Math.min(item.qty, remaining);
          remaining -= toRemove;
          if (item.qty - toRemove <= 0) {
            batches[i].items.splice(itemIdx, 1);
          } else {
            batches[i].items[itemIdx] = { ...item, qty: item.qty - toRemove };
          }
        }
      }

      return { ...prev, [key]: batches.filter((b) => b.items.length > 0) };
    });
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

  const cleanupTable = useCallback((tableId: TableId, billTempId?: string) => {
    const key = String(tableId);
    const snap = archiveRef.current;
    const session: ArchivedSession = {
      tableId: key,
      closedAt: new Date().toISOString(),
      orders: snap.orders[key] ?? [],
      sentBatches: snap.sentBatches[key] ?? [],
      gutschein: snap.gutscheinAmounts[key] ?? null,
      seated: snap.seatedTablesArr.some((id) => String(id) === key),
      markedBatches: Array.from(snap.markedBatches[key] ?? new Set<number>()),
      billTempId,
    };
    saveClosedSession(session);
    setLastClosedSession(session);

    setOrders((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setSeatedTablesArr((prev) => prev.filter((id) => String(id) !== key));
    setSentBatches((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setGutscheinAmounts((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setMarkedBatches((prev) => { const n = { ...prev }; delete n[key]; return n; });
    cancelAndDelete(tableId);
  }, [cancelAndDelete]);

  const reopenLastClosed = useCallback(() => {
    const session = lastClosedSession;
    if (!session) return;
    const key = session.tableId;
    const tableId = parseTableId(key);

    if (session.orders.length) setOrders((prev) => ({ ...prev, [key]: session.orders }));
    setSeatedTablesArr((prev) => {
      const without = prev.filter((id) => String(id) !== key);
      return session.seated ? [...without, tableId] : without;
    });
    if (session.sentBatches.length) setSentBatches((prev) => ({ ...prev, [key]: session.sentBatches }));
    if (session.gutschein != null) setGutscheinAmounts((prev) => ({ ...prev, [key]: session.gutschein! }));
    if (session.markedBatches.length) {
      setMarkedBatches((prev) => ({ ...prev, [key]: new Set(session.markedBatches) }));
    }

    if (session.billTempId) {
      cancelBillByTempId(session.billTempId);
    }
    clearClosedSession();
    setLastClosedSession(null);
    scheduleWrite(tableId);
    showToast(`Table ${key} reopened`);
  }, [lastClosedSession, cancelBillByTempId, scheduleWrite, showToast]);

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
      orders, seatedTables, sentBatches, gutscheinAmounts, markedBatches, syncError,
      conflicts, resolveConflict,
      lastClosedSession, reopenLastClosed,
      addItem, addCustomItem, removeItem, removeItemFromBill, addItemToBill,
      sendOrder, addBillEditBatch, removeBillEditItems, seatTable,
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
