import {
  createContext, useContext, useState, useCallback, useEffect, useRef, useMemo,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "./AppContext";
import { useMenu } from "./MenuContext";
import { fetchAllSessions, upsertSession, deleteSession, parseTableId } from "../services/directusSessions";
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

  const [orders, setOrders] = useState<Orders>({});
  const [seatedTablesArr, setSeatedTablesArr] = useState<TableId[]>([]);
  const [sentBatches, setSentBatches] = useState<SentBatches>({});
  const [gutscheinAmounts, setGutscheinAmounts] = useState<GutscheinAmounts>({});
  const [markedBatches, setMarkedBatches] = useState<Record<string, Set<number>>>({});

  const seatedTables = useMemo(() => new Set<TableId>(seatedTablesArr), [seatedTablesArr]);

  // ── Refs for async reads in debounced writes ──────────────────────────────
  const ordersRef = useRef(orders);
  const seatedTablesArrRef = useRef(seatedTablesArr);
  const sentBatchesRef = useRef(sentBatches);
  const gutscheinRef = useRef(gutscheinAmounts);
  const markedBatchesRef = useRef(markedBatches);

  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { seatedTablesArrRef.current = seatedTablesArr; }, [seatedTablesArr]);
  useEffect(() => { sentBatchesRef.current = sentBatches; }, [sentBatches]);
  useEffect(() => { gutscheinRef.current = gutscheinAmounts; }, [gutscheinAmounts]);
  useEffect(() => { markedBatchesRef.current = markedBatches; }, [markedBatches]);

  // ── Directus sync refs ────────────────────────────────────────────────────
  const sessionIdMap = useRef<Record<string, number>>({});   // tableId → Directus record id
  const lastWriteTime = useRef<Record<string, number>>({});  // tableId → epoch ms of last write
  const pendingWrites = useRef(new Set<string>());           // tableIds with scheduled writes
  const writeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const retryCountsRef = useRef<Record<string, number>>({});

  // ── Poll remote sessions ──────────────────────────────────────────────────
  const { data: remoteSessions } = useQuery({
    queryKey: ["table_sessions"],
    queryFn: fetchAllSessions,
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    staleTime: 1000,
  });

  // ── Merge remote state ────────────────────────────────────────────────────
  useEffect(() => {
    if (!remoteSessions) return;

    const now = Date.now();
    const remoteMap = new Map(remoteSessions.map((s) => [s.table_id, s]));

    // Update Directus ID map
    remoteSessions.forEach((s) => { sessionIdMap.current[s.table_id] = s.id; });

    const isLocallyOwned = (key: string) =>
      pendingWrites.current.has(key) || now - (lastWriteTime.current[key] ?? 0) < 3000;

    // All table IDs known to either side
    const allKeys = new Set([
      ...remoteMap.keys(),
      ...Object.keys(ordersRef.current),
      ...seatedTablesArrRef.current.map(String),
      ...Object.keys(sentBatchesRef.current),
    ]);

    const newOrders: Orders = {};
    const newSeated = new Set<TableId>();
    const newSentBatches: SentBatches = {};
    const newGutschein: GutscheinAmounts = {};
    const newMarkedBatches: Record<string, Set<number>> = {};

    allKeys.forEach((key) => {
      if (isLocallyOwned(key)) {
        // Keep local state for this table
        const tableId = parseTableId(key);
        if (ordersRef.current[key]?.length) newOrders[key] = ordersRef.current[key];
        if (seatedTablesArrRef.current.some((id) => String(id) === key)) newSeated.add(tableId);
        if (sentBatchesRef.current[key]?.length) newSentBatches[key] = sentBatchesRef.current[key];
        if (gutscheinRef.current[key] != null) newGutschein[key] = gutscheinRef.current[key];
        if (markedBatchesRef.current[key]?.size) newMarkedBatches[key] = markedBatchesRef.current[key];
      } else {
        const session = remoteMap.get(key);
        if (!session) return; // deleted remotely — exclude from new state

        const tableId = parseTableId(key);
        if (session.orders?.length) newOrders[key] = session.orders;
        if (session.seated) newSeated.add(tableId);
        if (session.sent_batches?.length) newSentBatches[key] = session.sent_batches;
        if (session.gutschein != null) newGutschein[key] = session.gutschein;
        if (session.marked_batches?.length) newMarkedBatches[key] = new Set(session.marked_batches);
      }
    });

    setOrders(newOrders);
    setSeatedTablesArr(Array.from(newSeated));
    setSentBatches(newSentBatches);
    setGutscheinAmounts(newGutschein);
    setMarkedBatches(newMarkedBatches);
  }, [remoteSessions]);

  // ── Debounced write to Directus ───────────────────────────────────────────
  const scheduleWrite = useCallback((tableId: TableId) => {
    const key = String(tableId);
    pendingWrites.current.add(key);
    clearTimeout(writeTimers.current[key]);
    writeTimers.current[key] = setTimeout(async () => {
      const session = {
        table_id: key,
        seated: seatedTablesArrRef.current.some((id) => String(id) === key),
        gutschein: gutscheinRef.current[key] ?? null,
        orders: ordersRef.current[key] ?? [],
        sent_batches: sentBatchesRef.current[key] ?? [],
        marked_batches: Array.from(markedBatchesRef.current[key] ?? new Set<number>()),
      };

      try {
        const newId = await upsertSession(sessionIdMap.current[key] ?? null, session);
        sessionIdMap.current[key] = newId;
        // Success: clear retry count and release ownership
        delete retryCountsRef.current[key];
        pendingWrites.current.delete(key);
        lastWriteTime.current[key] = Date.now();
      } catch (e) {
        const attempts = (retryCountsRef.current[key] ?? 0) + 1;
        retryCountsRef.current[key] = attempts;
        console.error(`Session write failed (attempt ${attempts}/3):`, e);

        if (attempts < 3) {
          // Show toast only on first failure
          if (attempts === 1) {
            showToast("Table state not saved - retrying");
          }
          // Refresh lastWriteTime to maintain local ownership during retry
          lastWriteTime.current[key] = Date.now();
          // Retry immediately
          scheduleWrite(tableId);
        } else {
          // Final failure: show hard error and release ownership
          showToast("Table state not saved - check network");
          delete retryCountsRef.current[key];
          pendingWrites.current.delete(key);
        }
      }
    }, 500);
  }, [showToast]);

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

    // Cancel any pending write and delete from Directus
    clearTimeout(writeTimers.current[key]);
    pendingWrites.current.delete(key);
    delete lastWriteTime.current[key];
    const directusId = sessionIdMap.current[key];
    if (directusId) {
      delete sessionIdMap.current[key];
      deleteSession(directusId).catch(console.error);
    }
  }, []);

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
