import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { migratePaidBills } from "../utils/migration";
import {
  fetchBillsByDate,
  createBillInDirectus,
  patchBill,
  patchBillItem,
  todayBerlinDate,
} from "../services/directusBills";
import type { View, Bill, DailySalesTab, TableId } from "../types";

interface AppContextValue {
  // Navigation
  view: View;
  setView: (view: View) => void;
  activeTable: TableId | null;
  setActiveTable: (id: TableId | null) => void;
  ticketTable: TableId | null;
  setTicketTable: (id: TableId | null) => void;

  // Toast
  toast: string | null;
  showToast: (msg: string) => void;

  // Paid bills (read)
  paidBills: Bill[];

  // Date selection for Daily Sales
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // Bill actions (write — each syncs to Directus)
  addPaidBill: (bill: Bill) => void;
  markBillAddedToPOS: (billIndex: number) => void;
  restoreBillFromPOS: (billIndex: number) => void;
  removePaidBillItem: (billIndex: number, itemId: string) => void;
  restorePaidBillItem: (billIndex: number, itemId: string) => void;

  // Edit mode
  editingBillIndex: number | null;
  billSnapshot: Bill | null;
  enterBillEditMode: (billIndex: number) => void;
  exitBillEditMode: () => void;
  cancelBillEditMode: () => void;

  // Daily sales UI
  dailySalesTab: DailySalesTab;
  setDailySalesTab: (tab: DailySalesTab) => void;
  deletingBillIndex: number | null;
  setDeletingBillIndex: (idx: number | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("tables");
  const [activeTable, setActiveTable] = useState<TableId | null>(null);
  const [ticketTable, setTicketTable] = useState<TableId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dailySalesTab, setDailySalesTab] = useState<DailySalesTab>("chronological");
  const [editingBillIndex, setEditingBillIndex] = useState<number | null>(null);
  const [billSnapshot, setBillSnapshot] = useState<Bill | null>(null);
  const [deletingBillIndex, setDeletingBillIndex] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayBerlinDate);

  const BILLS_KEY = ["bills", selectedDate];
  const isToday = selectedDate === todayBerlinDate();

  const { data: rawPaidBills = [] } = useQuery<Bill[]>({
    queryKey: BILLS_KEY,
    queryFn: async () => {
      try {
        return await fetchBillsByDate(selectedDate);
      } catch {
        if (isToday) {
          try {
            return JSON.parse(localStorage.getItem("paidBills") || "[]");
          } catch { return []; }
        }
        return [];
      }
    },
    staleTime: 5_000,
    refetchInterval: isToday ? 5_000 : false,
    refetchOnWindowFocus: true,
  });

  // Migrate legacy bills (bills created before posId field existed)
  const paidBills = useMemo(() => {
    if (rawPaidBills.length === 0) return rawPaidBills;
    const needsMigration = rawPaidBills.some((bill) =>
      bill.items.some((item) => !(item as any).posId)
    );
    return needsMigration ? migratePaidBills(rawPaidBills) : rawPaidBills;
  }, [rawPaidBills]);

  const setCachedBills = useCallback((bills: Bill[]) => {
    queryClient.setQueryData<Bill[]>(BILLS_KEY, bills);
  }, [queryClient, selectedDate]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // Add a new paid bill: optimistic add → create in Directus → update cache with IDs.
  // Always targets today's cache key regardless of the selected date in Daily Sales.
  const addPaidBill = useCallback((bill: Bill) => {
    const todayKey = ["bills", todayBerlinDate()];
    const current = queryClient.getQueryData<Bill[]>(todayKey) ?? [];
    queryClient.setQueryData<Bill[]>(todayKey, [...current, bill]);
    createBillInDirectus(bill)
      .then((savedBill) => {
        const latest = queryClient.getQueryData<Bill[]>(todayKey) ?? [];
        queryClient.setQueryData<Bill[]>(todayKey, latest.map((b) =>
          b.timestamp === savedBill.timestamp && b.tableId === savedBill.tableId
            ? savedBill
            : b
        ));
      })
      .catch((err) => console.warn("Failed to save bill to Directus:", err.message));
  }, [queryClient]);

  const markBillAddedToPOS = useCallback((billIndex: number) => {
    const updated = paidBills.map((b, i) =>
      i === billIndex ? { ...b, addedToPOS: true } : b
    );
    setCachedBills(updated);
    setEditingBillIndex(null);
    setBillSnapshot(null);
    const bill = paidBills[billIndex];
    if (bill?.directusId) {
      patchBill(bill.directusId, { added_to_pos: true }).catch((err) =>
        console.warn("Failed to patch bill:", err.message)
      );
    }
  }, [paidBills, setCachedBills]);

  const restoreBillFromPOS = useCallback((billIndex: number) => {
    const bill = paidBills[billIndex];
    const restoredItems = bill.items.map(({ crossedQty: _, crossed: __, ...rest }) => rest);
    const restoredBill = { ...bill, addedToPOS: false, items: restoredItems };
    setCachedBills(paidBills.map((b, i) => i === billIndex ? restoredBill : b));
    if (bill?.directusId) {
      patchBill(bill.directusId, { added_to_pos: false }).catch((err) =>
        console.warn("Failed to patch bill:", err.message)
      );
      restoredItems.forEach((item) => {
        if (item.directusId) {
          patchBillItem(item.directusId, { crossed_qty: 0 }).catch((err) =>
            console.warn("Failed to patch bill item:", err.message)
          );
        }
      });
    }
  }, [paidBills, setCachedBills]);

  const removePaidBillItem = useCallback((billIndex: number, itemId: string) => {
    const bill = paidBills[billIndex];
    const updatedItems = bill.items.map((o) =>
      o.id === itemId
        ? { ...o, crossedQty: Math.min((o.crossedQty ?? 0) + 1, o.qty) }
        : o
    );
    setCachedBills(paidBills.map((b, i) =>
      i === billIndex ? { ...b, items: updatedItems } : b
    ));
    const item = updatedItems.find((o) => o.id === itemId);
    if (item?.directusId) {
      patchBillItem(item.directusId, { crossed_qty: item.crossedQty }).catch((err) =>
        console.warn("Failed to patch bill item:", err.message)
      );
    }
  }, [paidBills, setCachedBills]);

  const restorePaidBillItem = useCallback((billIndex: number, itemId: string) => {
    const bill = paidBills[billIndex];
    const updatedItems = bill.items.map((o) =>
      o.id === itemId
        ? { ...o, crossedQty: Math.max((o.crossedQty ?? 0) - 1, 0), crossed: false }
        : o
    );
    setCachedBills(paidBills.map((b, i) =>
      i === billIndex ? { ...b, items: updatedItems } : b
    ));
    const item = updatedItems.find((o) => o.id === itemId);
    if (item?.directusId) {
      patchBillItem(item.directusId, { crossed_qty: item.crossedQty }).catch((err) =>
        console.warn("Failed to patch bill item:", err.message)
      );
    }
  }, [paidBills, setCachedBills]);

  // Edit mode: mutations during edit are local only; sync happens on exit
  const enterBillEditMode = useCallback((billIndex: number) => {
    setBillSnapshot({ ...paidBills[billIndex] });
    setEditingBillIndex(billIndex);
  }, [paidBills]);

  const exitBillEditMode = useCallback(() => {
    // Sync the current state of the edited bill to Directus
    if (editingBillIndex !== null) {
      const bill = paidBills[editingBillIndex];
      if (bill?.directusId) {
        patchBill(bill.directusId, { added_to_pos: bill.addedToPOS ?? false }).catch((err) =>
          console.warn("Failed to sync bill on exit:", err.message)
        );
        bill.items.forEach((item) => {
          if (item.directusId) {
            patchBillItem(item.directusId, { crossed_qty: item.crossedQty ?? 0 }).catch((err) =>
              console.warn("Failed to sync bill item on exit:", err.message)
            );
          }
        });
      }
    }
    setEditingBillIndex(null);
    setBillSnapshot(null);
  }, [editingBillIndex, paidBills]);

  const cancelBillEditMode = useCallback(() => {
    if (billSnapshot !== null && editingBillIndex !== null) {
      setCachedBills(paidBills.map((b, i) => i === editingBillIndex ? billSnapshot : b));
    }
    setEditingBillIndex(null);
    setBillSnapshot(null);
  }, [billSnapshot, editingBillIndex, paidBills, setCachedBills]);

  return (
    <AppContext.Provider value={{
      view, setView,
      activeTable, setActiveTable,
      ticketTable, setTicketTable,
      toast, showToast,
      paidBills,
      selectedDate, setSelectedDate,
      addPaidBill,
      markBillAddedToPOS,
      restoreBillFromPOS,
      removePaidBillItem,
      restorePaidBillItem,
      editingBillIndex,
      billSnapshot,
      enterBillEditMode,
      exitBillEditMode,
      cancelBillEditMode,
      dailySalesTab, setDailySalesTab,
      deletingBillIndex, setDeletingBillIndex,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
