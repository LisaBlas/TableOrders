import {
  createContext, useContext, useState, useCallback, useEffect, useMemo,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { useApp } from "./AppContext";
import { useMenu } from "./MenuContext";
import { useDirectusSync } from "../hooks/useDirectusSync";
import { parseTableId } from "../services/directusSessions";
import {
  markSessionDirty,
  readDirtySessionRecords,
  readSessionCache,
  updateDirtyLocalSession,
  writeSessionToCache,
  type CachedSession,
} from "../utils/sessionStorage";
import { createBatchId } from "../utils/batchMarks";
import type { SessionConflict } from "../utils/conflictDetection";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type {
  Orders, OrderItem, SentBatches, Batch, GutscheinAmounts,
  TableId, MenuItem, MenuItemVariant, MenuCategory, ExpandedItem, MarkedBatchId,
  DynamicTable,
} from "../types";

// ── Helper: Swap state between two tables ──
const swapTableState = <T,>(prev: Record<string, T>, fk: string, tk: string): Record<string, T> => {
  const n = { ...prev };
  const f = prev[fk];
  const t = prev[tk];
  if (t !== undefined) n[fk] = t; else delete n[fk];
  if (f !== undefined) n[tk] = f; else delete n[tk];
  return n;
};

interface TableContextValue {
  // State
  orders: Orders;
  seatedTables: Set<TableId>;
  sentBatches: SentBatches;
  gutscheinAmounts: GutscheinAmounts;
  markedBatches: Record<string, Set<MarkedBatchId>>;
  syncError: boolean;

  // Conflicts
  conflicts: SessionConflict[];
  resolveConflict: (conflict: SessionConflict, resolution: "local" | "remote" | "merge") => void;

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
  cleanupTable: (tableId: TableId) => void;
  removePaidItems: (tableId: TableId, paidItems: ExpandedItem[]) => void;
  toggleMarkBatch: (tableId: TableId, batchId: MarkedBatchId) => void;
  swapTables: (fromTableId: TableId, toTableId: TableId) => void;
  dynamicTables: DynamicTable[];
  addDynamicTable: (label: string, location: "inside" | "outside") => void;
  resolveTableDisplayId: (tableId: TableId) => string;
}

const TableContext = createContext<TableContextValue | null>(null);

function loadStoredTableState() {
  const sessions = new Map<string, CachedSession>();

  Object.entries(readSessionCache()).forEach(([key, session]) => {
    sessions.set(key, session);
  });

  Object.entries(readDirtySessionRecords()).forEach(([key, record]) => {
    if (record.operation === "delete") {
      sessions.delete(key);
      return;
    }
    if (record.local_session) sessions.set(key, record.local_session);
  });

  const initial = {
    orders: {} as Orders,
    seatedTablesArr: [] as TableId[],
    sentBatches: {} as SentBatches,
    gutscheinAmounts: {} as GutscheinAmounts,
    markedBatches: {} as Record<string, Set<MarkedBatchId>>,
  };

  sessions.forEach((session, key) => {
    if (session.orders.length) initial.orders[key] = session.orders;
    if (session.seated) initial.seatedTablesArr.push(parseTableId(key));
    if (session.sent_batches.length) initial.sentBatches[key] = session.sent_batches;
    if (session.gutschein != null) initial.gutscheinAmounts[key] = session.gutschein;
    if (session.marked_batches.length) initial.markedBatches[key] = new Set(session.marked_batches);
  });

  return initial;
}

export function TableProvider({ children }: { children: ReactNode }) {
  const { showToast } = useApp();
  const { minQty2Ids } = useMenu();
  const initialState = useMemo(() => loadStoredTableState(), []);

  // ── State ─────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Orders>(() => initialState.orders);
  const [seatedTablesArr, setSeatedTablesArr] = useState<TableId[]>(() => initialState.seatedTablesArr);
  const [sentBatches, setSentBatches] = useState<SentBatches>(() => initialState.sentBatches);
  const [gutscheinAmounts, setGutscheinAmounts] = useState<GutscheinAmounts>(() => initialState.gutscheinAmounts);
  const [markedBatches, setMarkedBatches] = useState<Record<string, Set<MarkedBatchId>>>(() => initialState.markedBatches);
  const [dynamicTables, setDynamicTables] = useLocalStorage<DynamicTable[]>("dynamic_tables", []);

  const seatedTables = useMemo(() => new Set<TableId>(seatedTablesArr), [seatedTablesArr]);

  // ── Directus sync (polling, debounced writes, conflict resolution) ─────────
  const { scheduleWrite, cancelAndDelete, syncError, conflicts, resolveConflict, markAsLocallyOwned } = useDirectusSync(
    { orders, seatedTablesArr, sentBatches, gutscheinAmounts, markedBatches },
    { setOrders, setSeatedTablesArr, setSentBatches, setGutscheinAmounts, setMarkedBatches },
    showToast
  );

  const persistDirtySession = useCallback((
    tableId: TableId,
    overrides: Partial<Omit<CachedSession, "table_id">> = {}
  ) => {
    const key = String(tableId);
    const session: CachedSession = {
      table_id: key,
      seated: seatedTablesArr.some((id) => String(id) === key),
      gutschein: gutscheinAmounts[key] ?? null,
      orders: orders[key] ?? [],
      sent_batches: sentBatches[key] ?? [],
      marked_batches: Array.from(markedBatches[key] ?? new Set<MarkedBatchId>()),
      ...overrides,
    };
    const existingDirty = readDirtySessionRecords()[key];
    const baseSession = existingDirty?.base_session ?? readSessionCache()[key] ?? null;
    markSessionDirty(key, session, baseSession);
    writeSessionToCache(key, session, false);
    updateDirtyLocalSession(key, session);
  }, [orders, seatedTablesArr, sentBatches, gutscheinAmounts, markedBatches]);

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

    const key = String(tableId);
    const current = orders[key] || [];
    const existing = note ? null : current.find((o: OrderItem) => o.id === orderItem.id);
    const nextOrders = existing
      ? current.map((o: OrderItem) =>
          o.id === orderItem.id ? { ...o, qty: o.qty + 1 } : o
        )
      : [...current, { ...orderItem, qty: minQty2Ids.has(item.id) ? 2 : 1, sentQty: 0 }];

    setOrders((prev) => ({ ...prev, [key]: nextOrders }));
    showToast(`+ ${baseOrderItem.name}`);
    scheduleWrite(tableId);
    persistDirtySession(tableId, { orders: nextOrders });
  }, [orders, showToast, minQty2Ids, scheduleWrite, persistDirtySession]);

  const addCustomItem = useCallback((tableId: TableId, item: OrderItem) => {
    const key = String(tableId);
    const nextOrders = [...(orders[key] || []), item];
    setOrders((prev) => ({ ...prev, [key]: nextOrders }));
    scheduleWrite(tableId);
    persistDirtySession(tableId, { orders: nextOrders });
  }, [orders, scheduleWrite, persistDirtySession]);

  const removeItem = useCallback((tableId: TableId, itemId: string) => {
    const key = String(tableId);
    const nextOrders = (orders[key] || [])
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
      .filter((o: OrderItem) => o.qty > 0);

    setOrders((prev) => ({ ...prev, [key]: nextOrders }));
    scheduleWrite(tableId);
    persistDirtySession(tableId, { orders: nextOrders });
  }, [orders, minQty2Ids, scheduleWrite, persistDirtySession]);

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
    const key = String(tableId);
    let nextBatch: Batch | null = null;
    let nextOrders: OrderItem[] | null = null;
    let nextSentBatches: Batch[] | null = null;

    flushSync(() => {
      setOrders((prev) => {
        const current = prev[key] || [];
        const batchItems = current
          .filter((o: OrderItem) => o.qty - (o.sentQty || 0) > 0)
          .map((o: OrderItem) => ({ ...o, qty: o.qty - (o.sentQty || 0) }));

        if (!batchItems.length) return prev;

        nextBatch = { id: createBatchId(), timestamp: new Date().toISOString(), items: batchItems };
        nextOrders = current.map((o: OrderItem) => ({ ...o, sentQty: o.qty }));
        return {
          ...prev,
          [key]: nextOrders,
        };
      });
    });

    if (!nextBatch) return;

    const batch = nextBatch;
    nextSentBatches = [...(sentBatches[key] || []), batch];
    setSentBatches((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), batch],
    }));
    showToast("Order sent!");
    scheduleWrite(tableId);
    persistDirtySession(tableId, {
      orders: nextOrders ?? orders[key] ?? [],
      sent_batches: nextSentBatches,
    });
  }, [orders, sentBatches, showToast, scheduleWrite, persistDirtySession]);

  const addBillEditBatch = useCallback((tableId: TableId, batchItems: OrderItem[]) => {
    if (!batchItems.length) return;
    const batch: Batch = { id: createBatchId(), timestamp: new Date().toISOString(), items: batchItems };
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

  const toggleMarkBatch = useCallback((tableId: TableId, batchId: MarkedBatchId) => {
    const key = String(tableId);
    const tableMarks = markedBatches[key] || new Set<MarkedBatchId>();
    const next = new Set(tableMarks);
    if (next.has(batchId)) next.delete(batchId); else next.add(batchId);

    setMarkedBatches((prev) => {
      return { ...prev, [key]: next };
    });
    scheduleWrite(tableId);
    persistDirtySession(tableId, { marked_batches: Array.from(next) });
  }, [markedBatches, scheduleWrite, persistDirtySession]);

  const resolveTableDisplayId = useCallback((tableId: TableId): string => {
    const key = String(tableId);
    if (key.startsWith("ext-")) {
      return dynamicTables.find((t) => t.id === key)?.label ?? key;
    }
    return key;
  }, [dynamicTables]);

  const addDynamicTable = useCallback((label: string, location: "inside" | "outside") => {
    const id = `ext-${label.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`;
    setDynamicTables((prev) => [...prev, { id, label, location }]);
  }, [setDynamicTables]);

  const cleanupTable = useCallback((tableId: TableId) => {
    const key = String(tableId);
    setOrders((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setSeatedTablesArr((prev) => prev.filter((id) => String(id) !== key));
    setSentBatches((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setGutscheinAmounts((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setMarkedBatches((prev) => { const n = { ...prev }; delete n[key]; return n; });
    cancelAndDelete(tableId);
    if (key.startsWith("ext-")) {
      setDynamicTables((prev) => prev.filter((t) => t.id !== key));
    }
  }, [cancelAndDelete, setDynamicTables]);

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

    // Mark both tables as locally owned to protect from remote poll overwrites during swap
    markAsLocallyOwned(fromId, toId);

    setOrders((prev) => swapTableState(prev, fk, tk));
    setSentBatches((prev) => swapTableState(prev, fk, tk));
    setMarkedBatches((prev) => swapTableState(prev, fk, tk));
    setGutscheinAmounts((prev) => swapTableState(prev, fk, tk));
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
  }, [showToast, scheduleWrite, markAsLocallyOwned]);

  return (
    <TableContext.Provider value={{
      orders, seatedTables, sentBatches, gutscheinAmounts, markedBatches, syncError,
      conflicts, resolveConflict,
      addItem, addCustomItem, removeItem, removeItemFromBill, addItemToBill,
      sendOrder, addBillEditBatch, removeBillEditItems, seatTable,
      applyGutschein, removeGutschein,
      cleanupTable, removePaidItems, toggleMarkBatch, swapTables,
      dynamicTables, addDynamicTable, resolveTableDisplayId,
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
