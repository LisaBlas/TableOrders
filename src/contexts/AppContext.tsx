import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
import { migratePaidBills } from "../utils/migration";
import { fetchTodayBills, saveTodayBills } from "../services/directusBills";
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
  const [view, setView] = useState<View>("tables");
  const [activeTable, setActiveTable] = useState<TableId | null>(null);
  const [ticketTable, setTicketTable] = useState<TableId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [rawPaidBills, setRawPaidBills] = useState<Bill[]>([]);
  const [billsLoaded, setBillsLoaded] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dailySalesTab, setDailySalesTab] = useState<DailySalesTab>("chronological");
  const [editingBillIndex, setEditingBillIndex] = useState<number | null>(null);
  const [billSnapshot, setBillSnapshot] = useState<Bill | null>(null);
  const [deletingBillIndex, setDeletingBillIndex] = useState<number | null>(null);

  // On mount: load today's bills from Directus, fall back to localStorage
  useEffect(() => {
    fetchTodayBills()
      .then((bills) => {
        if (bills !== null) setRawPaidBills(bills);
      })
      .catch(() => {
        try {
          const local = JSON.parse(localStorage.getItem("paidBills") || "[]");
          if (local.length > 0) setRawPaidBills(local);
        } catch {}
      })
      .finally(() => setBillsLoaded(true));
  }, []);

  // Debounced sync to Directus on every bills change (skip until initial load completes)
  useEffect(() => {
    if (!billsLoaded) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      saveTodayBills(rawPaidBills).catch((err) =>
        console.warn("Bills sync failed:", err.message)
      );
    }, 800);
  }, [rawPaidBills, billsLoaded]);

  // Migrate legacy bills on first access (computed, no effect)
  const paidBills = useMemo(() => {
    if (rawPaidBills.length === 0) return rawPaidBills;
    const needsMigration = rawPaidBills.some((bill) =>
      bill.items.some((item) => !(item as any).posId)
    );
    return needsMigration ? migratePaidBills(rawPaidBills) : rawPaidBills;
  }, [rawPaidBills]);

  const setPaidBills = useCallback((update: React.SetStateAction<Bill[]>) => {
    const resolved = typeof update === 'function' ? update(paidBills) : update;
    setRawPaidBills(resolved);
  }, [paidBills, setRawPaidBills]);

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
