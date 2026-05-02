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
import RetryModal from "../components/RetryModal";

interface AppContextValue {
  // Navigation
  view: View;
  setView: (view: View) => void;
  activeTable: TableId | null;
  setActiveTable: (id: TableId | null) => void;
  ticketTable: TableId | null;
  setTicketTable: (id: TableId | null) => void;
  orderViewTab: 'order' | 'bill' | null;
  setOrderViewTab: (tab: 'order' | 'bill' | null) => void;

  // Toast
  toast: string | null;
  showToast: (msg: string) => void;

  // Paid bills (read)
  paidBills: Bill[];

  // Date selection for Daily Sales
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // Bill actions (write — each syncs to Directus)
  addPaidBill: (bill: Bill, onSuccess?: () => void) => void;
  markBillAddedToPOS: (billIndex: number) => void;
  restoreBillFromPOS: (billIndex: number) => void;
  removePaidBillItem: (billIndex: number, itemId: string) => void;
  restorePaidBillItem: (billIndex: number, itemId: string) => void;

  // Edit mode
  editingBillId: string | null;
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
  const [orderViewTab, setOrderViewTab] = useState<'order' | 'bill' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dailySalesTab, setDailySalesTab] = useState<DailySalesTab>("chronological");
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [billSnapshot, setBillSnapshot] = useState<Bill | null>(null);
  const [deletingBillIndex, setDeletingBillIndex] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayBerlinDate);
  const [failedBill, setFailedBill] = useState<{ bill: Bill; error: string } | null>(null);

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
      bill.items.some((item) => !item.posId)
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
  const addPaidBill = useCallback((bill: Bill, onSuccess?: () => void) => {
    const todayKey = ["bills", todayBerlinDate()];

    // Backstop: generate tempId if missing (race-condition fix)
    const tempId = bill.tempId ?? crypto.randomUUID();
    const optimisticBill = { ...bill, tempId };

    // Optimistic update
    const current = queryClient.getQueryData<Bill[]>(todayKey) ?? [];
    queryClient.setQueryData<Bill[]>(todayKey, [...current, optimisticBill]);

    createBillInDirectus(optimisticBill)
      .then((savedBill) => {
        const latest = queryClient.getQueryData<Bill[]>(todayKey) ?? [];
        queryClient.setQueryData<Bill[]>(todayKey, latest.map((b) =>
          b.tempId === tempId
            ? { ...savedBill, tempId: undefined }
            : b
        ));
        onSuccess?.();
      })
      .catch((err) => {
        showToast("Failed to save bill to server");
        // Remove optimistic bill from cache
        const latest = queryClient.getQueryData<Bill[]>(todayKey) ?? [];
        queryClient.setQueryData<Bill[]>(todayKey, latest.filter((b) => b.tempId !== tempId));
        // Show retry modal
        setFailedBill({
          bill: optimisticBill,
          error: err.message || "Failed to save bill to server",
        });
      });
  }, [queryClient, setFailedBill, showToast]);

  const syncBillToDirectus = useCallback((bill: Bill) => {
    if (!bill.directusId) return;

    patchBill(bill.directusId, { added_to_pos: bill.addedToPOS ?? false }).catch(() =>
      showToast("Failed to sync bill")
    );
    bill.items.forEach((item) => {
      if (item.directusId) {
        patchBillItem(item.directusId, { crossed_qty: item.crossedQty ?? 0 }).catch(() =>
          showToast("Failed to sync item")
        );
      }
    });
  }, [showToast]);

  const markBillAddedToPOS = useCallback((billIndex: number) => {
    const bill = paidBills[billIndex];
    if (!bill) return;
    const updatedBill = { ...bill, addedToPOS: true };
    const updated = paidBills.map((b, i) =>
      i === billIndex ? updatedBill : b
    );
    setCachedBills(updated);

    if (editingBillId === bill.directusId) {
      syncBillToDirectus(updatedBill);
      setEditingBillId(null);
      setBillSnapshot(null);
      return;
    }

    if (updatedBill.directusId) {
      patchBill(updatedBill.directusId, { added_to_pos: true }).catch(() =>
        showToast("Failed to sync bill status")
      );
    }
  }, [editingBillId, paidBills, setCachedBills, showToast, syncBillToDirectus]);

  const restoreBillFromPOS = useCallback((billIndex: number) => {
    const bill = paidBills[billIndex];
    const restoredItems = bill.items.map(({ crossedQty: _, crossed: __, ...rest }) => rest);
    const restoredBill = { ...bill, addedToPOS: false, items: restoredItems };
    setCachedBills(paidBills.map((b, i) => i === billIndex ? restoredBill : b));
    if (bill?.directusId) {
      patchBill(bill.directusId, { added_to_pos: false }).catch((err) =>
        showToast("Failed to restore bill from POS")
      );
      restoredItems.forEach((item) => {
        if (item.directusId) {
          patchBillItem(item.directusId, { crossed_qty: 0 }).catch((err) =>
            showToast("Failed to restore item from POS")
          );
        }
      });
    }
  }, [paidBills, setCachedBills, showToast]);

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
        showToast("Failed to sync item update")
      );
    }
  }, [paidBills, setCachedBills, showToast]);

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
        showToast("Failed to sync item restore")
      );
    }
  }, [paidBills, setCachedBills, showToast]);

  // Edit mode: mutations during edit are local only; sync happens on exit
  const enterBillEditMode = useCallback((billIndex: number) => {
    const bill = paidBills[billIndex];
    if (!bill?.directusId) {
      showToast("Cannot edit bill before it has synced");
      return;
    }
    setBillSnapshot({ ...bill, items: bill.items.map((item) => ({ ...item })) });
    setEditingBillId(bill.directusId);
  }, [paidBills, showToast]);

  const exitBillEditMode = useCallback(() => {
    // Sync the current state of the edited bill to Directus
    if (editingBillId !== null) {
      const bill = paidBills.find((b) => b.directusId === editingBillId);
      if (bill) {
        syncBillToDirectus(bill);
      } else {
        showToast("Bill no longer available");
      }
    }
    setEditingBillId(null);
    setBillSnapshot(null);
  }, [editingBillId, paidBills, showToast, syncBillToDirectus]);

  const cancelBillEditMode = useCallback(() => {
    if (billSnapshot !== null && editingBillId !== null) {
      setCachedBills(paidBills.map((bill) =>
        bill.directusId === editingBillId ? billSnapshot : bill
      ));
    }
    setEditingBillId(null);
    setBillSnapshot(null);
  }, [billSnapshot, editingBillId, paidBills, setCachedBills]);

  // Retry modal handlers
  const handleRetryBill = useCallback(() => {
    if (!failedBill) return;
    const bill = failedBill;
    setFailedBill(null);
    addPaidBill(bill.bill, () => showToast(`Bill saved — Table ${bill.bill.tableId}`));
  }, [failedBill, addPaidBill, showToast]);

  return (
    <AppContext.Provider value={{
      view, setView,
      activeTable, setActiveTable,
      ticketTable, setTicketTable,
      orderViewTab, setOrderViewTab,
      toast, showToast,
      paidBills,
      selectedDate, setSelectedDate,
      addPaidBill,
      markBillAddedToPOS,
      restoreBillFromPOS,
      removePaidBillItem,
      restorePaidBillItem,
      editingBillId,
      billSnapshot,
      enterBillEditMode,
      exitBillEditMode,
      cancelBillEditMode,
      dailySalesTab, setDailySalesTab,
      deletingBillIndex, setDeletingBillIndex,
    }}>
      {children}
      {failedBill && (
        <RetryModal
          message={`Bill for Table ${failedBill.bill.tableId} could not be saved — tap Retry to recover this payment.`}
          onRetry={handleRetryBill}
        />
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
