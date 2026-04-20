import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { migratePaidBills } from "../utils/migration";
import { fetchTodayBills, saveTodayBills } from "../services/directusBills";
import type { View, Bill, DailySalesTab, TableId } from "../types";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

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

  // Paid bills
  paidBills: Bill[];
  setPaidBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  addPaidBill: (bill: Bill) => void;

  // Daily sales
  dailySalesTab: DailySalesTab;
  setDailySalesTab: (tab: DailySalesTab) => void;
  editingBillIndex: number | null;
  setEditingBillIndex: (idx: number | null) => void;
  billSnapshot: Bill | null;
  setBillSnapshot: (snap: Bill | null) => void;
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

  const BILLS_KEY = ["daily_sales", todayKey()];

  // Load today's bills from Directus; localStorage as offline fallback
  const { data: rawPaidBills = [] } = useQuery<Bill[]>({
    queryKey: BILLS_KEY,
    queryFn: async () => {
      try {
        const bills = await fetchTodayBills();
        return bills ?? [];
      } catch {
        try {
          return JSON.parse(localStorage.getItem("paidBills") || "[]");
        } catch { return []; }
      }
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Migrate legacy bills (bills created before posId field existed)
  const paidBills = useMemo(() => {
    if (rawPaidBills.length === 0) return rawPaidBills;
    const needsMigration = rawPaidBills.some((bill) =>
      bill.items.some((item) => !(item as any).posId)
    );
    return needsMigration ? migratePaidBills(rawPaidBills) : rawPaidBills;
  }, [rawPaidBills]);

  // Update query cache + persist to Directus in one call — no effect needed
  const setPaidBills = useCallback((update: React.SetStateAction<Bill[]>) => {
    const resolved = typeof update === "function" ? update(paidBills) : update;
    queryClient.setQueryData<Bill[]>(BILLS_KEY, resolved);
    saveTodayBills(resolved).catch((err) =>
      console.warn("Bills sync failed:", err.message)
    );
  }, [paidBills, queryClient]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const addPaidBill = useCallback((bill: Bill) => {
    setPaidBills((prev) => [...prev, bill]);
  }, [setPaidBills]);

  return (
    <AppContext.Provider value={{
      view, setView,
      activeTable, setActiveTable,
      ticketTable, setTicketTable,
      toast, showToast,
      paidBills, setPaidBills, addPaidBill,
      dailySalesTab, setDailySalesTab,
      editingBillIndex, setEditingBillIndex,
      billSnapshot, setBillSnapshot,
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
