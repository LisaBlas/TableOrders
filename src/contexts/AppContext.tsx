import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
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
  const [paidBills, setPaidBills] = useLocalStorage<Bill[]>("paidBills", []);
  const [dailySalesTab, setDailySalesTab] = useState<DailySalesTab>("chronological");
  const [editingBillIndex, setEditingBillIndex] = useState<number | null>(null);
  const [billSnapshot, setBillSnapshot] = useState<Bill | null>(null);
  const [deletingBillIndex, setDeletingBillIndex] = useState<number | null>(null);

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
