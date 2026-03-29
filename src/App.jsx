import { useState, useEffect } from "react";
import { TABLES, MENU, STATUS_CONFIG, FOOD_SUBCATEGORIES, DRINKS_SUBCATEGORIES, BOTTLES_SUBCATEGORIES } from "./data/constants";
import { getTableStatus, getItemDestination, expandItems } from "./utils/helpers";
import { S } from "./styles/appStyles";
import { Receipt } from "./components/Receipt";
import { Modal } from "./components/Modal";

export default function App() {
  // Active orders with localStorage persistence
  const [orders, setOrders] = useState(() => {
    try {
      const stored = localStorage.getItem("orders");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Seated tables with localStorage persistence
  const [seatedTables, setSeatedTables] = useState(() => {
    try {
      const stored = localStorage.getItem("seatedTables");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [activeTable, setActiveTable] = useState(null);
  const [view, setView] = useState("tables");
  const [activeCategory, setActiveCategory] = useState("Food");
  const [toast, setToast] = useState(null);
  const [ticketTable, setTicketTable] = useState(null);
  const [activeTab, setActiveTab] = useState("order"); // "order" or "bill"
  const [searchQuery, setSearchQuery] = useState("");
  const [seatConfirmTable, setSeatConfirmTable] = useState(null);
  const [selectedFoodSubcategory, setSelectedFoodSubcategory] = useState(null);
  const [selectedDrinksSubcategory, setSelectedDrinksSubcategory] = useState(null);
  const [selectedBottlesSubcategory, setSelectedBottlesSubcategory] = useState(null);
  const [dailySalesTab, setDailySalesTab] = useState("chronological");
  const [editingBillIndex, setEditingBillIndex] = useState(null);
  const [billSnapshot, setBillSnapshot] = useState(null);
  const [deletingBillIndex, setDeletingBillIndex] = useState(null);
  const [confirmingClose, setConfirmingClose] = useState(false);

  // Split state
  const [splitRemaining, setSplitRemaining] = useState([]);
  const [splitSelected, setSplitSelected] = useState(new Set());
  const [splitPayments, setSplitPayments] = useState([]);
  const [splitMode, setSplitMode] = useState(null);
  const [equalGuests, setEqualGuests] = useState(2);
  const [showSplitOptions, setShowSplitOptions] = useState(false);

  // Track sent batches (each send creates a new batch with timestamp)
  const [sentBatches, setSentBatches] = useState({});

  // Bill editing and gutschein state
  const [editingBill, setEditingBill] = useState(false);
  const [billEditSnapshot, setBillEditSnapshot] = useState(null);
  const [gutscheinAmounts, setGutscheinAmounts] = useState({});
  const [showGutscheinModal, setShowGutscheinModal] = useState(false);
  const [gutscheinInput, setGutscheinInput] = useState("");

  // Payment/tip state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [equalSplitPayments, setEqualSplitPayments] = useState([{ amount: "", confirmed: false }]);
  const [itemSplitPayments, setItemSplitPayments] = useState({}); // { [guestNum]: { amount, confirmed } }

  // Custom item state
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [orderBarExpanded, setOrderBarExpanded] = useState(false);

  // Paid bills state with localStorage persistence
  const [paidBills, setPaidBills] = useState(() => {
    try {
      const stored = localStorage.getItem("paidBills");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever paidBills changes
  useEffect(() => {
    localStorage.setItem("paidBills", JSON.stringify(paidBills));
  }, [paidBills]);

  // Save to localStorage whenever orders change
  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  // Save to localStorage whenever seatedTables changes
  useEffect(() => {
    localStorage.setItem("seatedTables", JSON.stringify(Array.from(seatedTables)));
  }, [seatedTables]);

  // Clear selected subcategories when searching
  useEffect(() => {
    if (searchQuery) {
      if (selectedFoodSubcategory) setSelectedFoodSubcategory(null);
      if (selectedDrinksSubcategory) setSelectedDrinksSubcategory(null);
      if (selectedBottlesSubcategory) setSelectedBottlesSubcategory(null);
    }
  }, [searchQuery, selectedFoodSubcategory, selectedDrinksSubcategory, selectedBottlesSubcategory]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleTableClick = (tableId) => {
    const status = getTableStatus(tableId, orders, seatedTables);

    if (status === "open") {
      // Show confirmation to seat the table
      setSeatConfirmTable(tableId);
    } else {
      // Table is already seated or has orders, open directly
      openTable(tableId);
    }
  };

  const confirmSeatTable = () => {
    if (seatConfirmTable) {
      setSeatedTables((prev) => new Set(prev).add(seatConfirmTable));
      showToast(`Table ${seatConfirmTable} seated`);
      openTable(seatConfirmTable);
      setSeatConfirmTable(null);
    }
  };

  const cancelSeatTable = () => {
    setSeatConfirmTable(null);
  };

  const openTable = (tableId) => {
    setActiveTable(tableId);
    setActiveCategory("Food");
    // Land on Bill tab if table has sent orders, Order tab otherwise
    const hasSentOrders = orders[tableId] && orders[tableId].some(o => (o.sentQty || 0) > 0);
    setActiveTab(hasSentOrders ? "bill" : "order");
    setSearchQuery("");
    setCustomName("");
    setCustomPrice("");
    setCustomQty("1");
    setConfirmingClose(false);
    setEditingBill(false);
    setShowGutscheinModal(false);
    setGutscheinInput("");
    setShowSplitOptions(false);
    setPaymentAmount("");
    setPaymentConfirmed(false);
    setEqualSplitPayments([{ amount: "", confirmed: false }]);
    setItemSplitPayments({});
    setOrderBarExpanded(false);
    setView("order");
  };

  const addItem = (item, variant = null) => {
    // Find category for this item
    let itemCategory = activeCategory;
    if (!variant && !itemCategory) {
      for (const [cat, items] of Object.entries(MENU)) {
        if (items.find(i => i.id === item.id)) {
          itemCategory = cat;
          break;
        }
      }
    }

    // Create composite item for variants
    const orderItem = variant
      ? {
          id: `${item.id}-${variant.type}`,
          name: `${item.name} (${variant.label})`,
          price: variant.price,
          baseId: item.id,
          variantType: variant.type,
          subcategory: item.subcategory,
          category: itemCategory,
        }
      : { ...item, category: itemCategory };

    setOrders((prev) => {
      const current = prev[activeTable] || [];
      const existing = current.find((o) => o.id === orderItem.id);
      if (existing) {
        // Move existing item to end (most recent) with updated quantity
        return {
          ...prev,
          [activeTable]: [
            ...current.filter((o) => o.id !== orderItem.id),
            { ...existing, qty: existing.qty + 1 }
          ],
        };
      }
      return { ...prev, [activeTable]: [...current, { ...orderItem, qty: 1, sentQty: 0 }] };
    });
    showToast(`+ ${orderItem.name}`);
  };

  const addCustomItem = () => {
    const name = customName.trim();
    const price = parseFloat(customPrice);
    const qty = parseInt(customQty);

    // Validation
    if (!name) {
      showToast("⚠ Item name required");
      return;
    }
    if (isNaN(price) || price <= 0) {
      showToast("⚠ Valid price required");
      return;
    }
    if (isNaN(qty) || qty < 1) {
      showToast("⚠ Valid quantity required");
      return;
    }

    // Create custom item with unique ID
    const customItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      price,
      qty: 0, // Will be set by addItem logic
      sentQty: 0
    };

    // Add to order using existing logic
    setOrders((prev) => {
      const current = prev[activeTable] || [];
      return { ...prev, [activeTable]: [...current, { ...customItem, qty, sentQty: 0 }] };
    });

    showToast(`+ ${name} (${qty}×)`);

    // Reset form and close modal
    setCustomName("");
    setCustomPrice("");
    setCustomQty("1");
    setShowCustomModal(false);
  };

  const removeItem = (itemId) => {
    setOrders((prev) => {
      const current = prev[activeTable] || [];
      return {
        ...prev,
        [activeTable]: current
          .map((o) => {
            if (o.id === itemId) {
              const unsent = o.qty - (o.sentQty || 0);
              // Only allow removal if there are unsent items
              if (unsent > 0) {
                return { ...o, qty: o.qty - 1 };
              }
            }
            return o;
          })
          .filter((o) => o.qty > 0),
      };
    });
  };

  const removeItemFromBill = (itemId) => {
    setOrders((prev) => {
      const current = prev[activeTable] || [];
      const item = current.find((o) => o.id === itemId);
      if (!item) return prev;

      showToast(`− ${item.name}`);

      return {
        ...prev,
        [activeTable]: current
          .map((o) => {
            if (o.id === itemId) {
              const newQty = o.qty - 1;
              // Reduce sentQty if we're removing sent items
              const newSentQty = Math.min(o.sentQty || 0, newQty);
              return { ...o, qty: newQty, sentQty: newSentQty };
            }
            return o;
          })
          .filter((o) => o.qty > 0),
      };
    });
  };

  const addItemToBill = (itemId) => {
    setOrders((prev) => {
      const current = prev[activeTable] || [];
      const item = current.find((o) => o.id === itemId);
      if (!item) return prev;

      showToast(`+ ${item.name}`);

      return {
        ...prev,
        [activeTable]: current.map((o) => {
          if (o.id === itemId) {
            const newQty = o.qty + 1;
            const newSentQty = (o.sentQty || 0) + 1;
            return { ...o, qty: newQty, sentQty: newSentQty };
          }
          return o;
        }),
      };
    });
  };

  const applyGutschein = () => {
    const amount = parseFloat(gutscheinInput);
    if (isNaN(amount) || amount < 0) {
      showToast("⚠ Valid amount required");
      return;
    }

    setGutscheinAmounts((prev) => ({
      ...prev,
      [activeTable]: amount,
    }));

    showToast(`Gutschein applied: ${amount.toFixed(2)}€`);
    setShowGutscheinModal(false);
    setGutscheinInput("");
  };

  const removeGutschein = () => {
    setGutscheinAmounts((prev) => {
      const next = { ...prev };
      delete next[activeTable];
      return next;
    });
    showToast("Gutschein removed");
  };

  const startBillEdit = () => {
    // Take snapshot when entering edit mode
    const current = orders[activeTable] || [];
    setBillEditSnapshot(current.map(o => ({ id: o.id, sentQty: o.sentQty || 0 })));
    setEditingBill(true);
  };

  const confirmBillEdit = () => {
    const current = orders[activeTable] || [];

    // Find items with increased sentQty during edit session
    const itemsAddedDuringEdit = [];
    if (billEditSnapshot) {
      current.forEach(item => {
        const snapItem = billEditSnapshot.find(s => s.id === item.id);
        const oldSentQty = snapItem ? snapItem.sentQty : 0;
        const newSentQty = item.sentQty || 0;
        const qtyAdded = newSentQty - oldSentQty;

        if (qtyAdded > 0) {
          itemsAddedDuringEdit.push({
            ...item,
            qty: qtyAdded  // Only the added quantity
          });
        }
      });
    }

    // Create a new batch for items added during edit
    if (itemsAddedDuringEdit.length > 0) {
      setSentBatches((prev) => {
        const tableBatches = prev[activeTable] || [];
        return {
          ...prev,
          [activeTable]: [
            ...tableBatches,
            {
              timestamp: new Date(),
              items: itemsAddedDuringEdit,
            },
          ],
        };
      });
    }

    // Also send any unsent items from Order tab
    const unsent = current.filter((o) => (o.qty - (o.sentQty || 0)) > 0);
    if (unsent.length > 0) {
      sendOrder();
    }

    setBillEditSnapshot(null);
    setEditingBill(false);
  };

  const sendOrder = () => {
    const current = orders[activeTable] || [];
    const unsent = current.filter((o) => (o.qty - (o.sentQty || 0)) > 0);
    if (unsent.length === 0) return;

    // Create new batch with timestamp and unsent items
    const newBatch = {
      timestamp: new Date(),
      items: unsent.map(o => ({ ...o, qty: o.qty - (o.sentQty || 0) }))
    };

    setSentBatches((prev) => ({
      ...prev,
      [activeTable]: [...(prev[activeTable] || []), newBatch]
    }));

    setOrders((prev) => ({
      ...prev,
      [activeTable]: current.map((o) => ({ ...o, sentQty: o.qty })),
    }));

    showToast("Order sent!");
  };

  const openTicket = (tableId) => {
    setTicketTable(tableId);
    setView("ticket");
  };

  const confirmClose = (tableId) => {
    const items = orders[tableId] || [];
    const subtotal = items.reduce((s, o) => s + o.price * o.qty, 0);
    const gutschein = gutscheinAmounts[tableId] || 0;
    const total = Math.max(0, subtotal - gutschein);

    // Calculate tip if payment amount was entered
    const paid = paymentConfirmed && paymentAmount ? parseFloat(paymentAmount) : null;
    const tip = paid !== null ? paid - total : null;

    // Save bill to paid bills (including gutschein and tip info)
    setPaidBills((prev) => [
      ...prev,
      {
        tableId,
        items,
        total,
        subtotal,
        gutschein: gutschein > 0 ? gutschein : undefined,
        amountPaid: paid !== null ? paid : undefined,
        tip: tip !== null ? tip : undefined,
        timestamp: new Date().toISOString(),
        paymentMode: "full",
      },
    ]);

    setOrders((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });
    setSeatedTables((prev) => {
      const next = new Set(prev);
      next.delete(tableId);
      return next;
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
    showToast(`Table ${tableId} closed ✓`);
    setConfirmingClose(false);
    setEditingBill(false);
    setPaymentAmount("");
    setPaymentConfirmed(false);
    setView("tables");
    setTicketTable(null);
  };

  // ── SPLIT ──────────────────────────────────────────────
  const initiateSplit = (mode, tableId = ticketTable) => {
    const items = orders[tableId] || [];
    setSplitRemaining(expandItems(items));
    setSplitSelected(new Set());
    setSplitPayments([]);
    setSplitMode(mode);
    setItemSplitPayments({});
    setView("split");
  };

  const toggleSplitItem = (uid) => {
    setSplitSelected((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };

  const selectAllRemaining = () =>
    setSplitSelected(new Set(splitRemaining.map((i) => i._uid)));

  const confirmSplitPayment = () => {
    const paid = splitRemaining.filter((i) => splitSelected.has(i._uid));
    const total = paid.reduce((s, i) => s + i.price, 0);
    const guestNum = splitPayments.length + 1;
    const newPayments = [...splitPayments, { guestNum, items: paid, total }];
    const newRemaining = splitRemaining.filter((i) => !splitSelected.has(i._uid));
    setSplitPayments(newPayments);
    setSplitRemaining(newRemaining);
    setSplitSelected(new Set());
    // Always go to splitConfirm, even for last guest
    setView("splitConfirm");
  };

  const nextSplitGuest = () => {
    setSplitSelected(new Set());
    setView("split");
  };

  const closeSplitTable = () => {
    const items = orders[ticketTable] || [];
    const total = items.reduce((s, o) => s + o.price * o.qty, 0);

    // Calculate tips
    let totalPaid = null;
    let totalTip = null;
    let payments = null;
    let guestPayments = null;

    if (splitMode === "equal") {
      const confirmedPayments = equalSplitPayments.filter(p => p.confirmed);
      // Only calculate tips if all guests have paid
      if (confirmedPayments.length === equalGuests) {
        payments = confirmedPayments.map(p => parseFloat(p.amount));
        totalPaid = payments.reduce((sum, p) => sum + p, 0);
        totalTip = totalPaid - total;
      }
    } else if (splitMode === "item") {
      // Calculate tips for item split
      guestPayments = splitPayments.map(payment => {
        const guestPaymentData = itemSplitPayments[payment.guestNum];
        if (guestPaymentData?.confirmed) {
          const paid = parseFloat(guestPaymentData.amount);
          const tip = paid - payment.total;
          return {
            ...payment,
            amountPaid: paid,
            tip: tip
          };
        }
        return payment;
      });

      // Calculate totals - only if all guests have paid
      const paidAmounts = guestPayments
        .filter(p => p.amountPaid !== undefined)
        .map(p => p.amountPaid);

      if (paidAmounts.length === splitPayments.length) {
        totalPaid = paidAmounts.reduce((sum, p) => sum + p, 0);
        totalTip = totalPaid - total;
      }
    }

    setPaidBills((prev) => [
      ...prev,
      {
        tableId: ticketTable,
        items,
        total,
        timestamp: new Date().toISOString(),
        paymentMode: splitMode === "equal" ? "equal" : "item",
        splitData: splitMode === "item" ? { payments: guestPayments || splitPayments } : { guests: equalGuests },
        amountPaid: totalPaid !== null ? totalPaid : undefined,
        tip: totalTip !== null ? totalTip : undefined,
        payments: payments !== null ? payments : undefined,
      },
    ]);
    setOrders((prev) => {
      const next = { ...prev };
      delete next[ticketTable];
      return next;
    });
    setSeatedTables((prev) => {
      const next = new Set(prev);
      next.delete(ticketTable);
      return next;
    });
    setSentBatches((prev) => {
      const next = { ...prev };
      delete next[ticketTable];
      return next;
    });
    showToast(`Table ${ticketTable} closed ✓`);
    setView("tables");
    setTicketTable(null);
    setShowSplitOptions(false);
    setSplitRemaining([]);
    setSplitSelected(new Set());
    setSplitPayments([]);
    setSplitMode(null);
    setEqualSplitPayments([{ amount: "", confirmed: false }]);
    setItemSplitPayments({});
  };

  const clearDailySales = () => {
    if (confirm("Clear all daily sales? This cannot be undone.")) {
      setPaidBills([]);
      showToast("Daily sales cleared");
    }
  };

  const removePaidBillItem = (billIndex, itemId) => {
    setPaidBills((prev) => {
      const updated = [...prev];
      const bill = { ...updated[billIndex] };

      // Find the item and decrease quantity
      const itemIdx = bill.items.findIndex(i => i.id === itemId);
      if (itemIdx === -1) return prev;

      const item = bill.items[itemIdx];
      const newQty = item.qty - 1;

      if (newQty <= 0) {
        // Remove item completely
        bill.items = bill.items.filter((_, idx) => idx !== itemIdx);
        showToast(`Removed ${item.name}`);
      } else {
        // Decrease quantity
        bill.items = bill.items.map((itm, idx) =>
          idx === itemIdx ? { ...itm, qty: newQty } : itm
        );
        showToast(`− ${item.name}`);
      }

      // Recalculate total
      bill.total = bill.items.reduce((sum, itm) => sum + itm.price * itm.qty, 0);

      // If no items left, remove the bill
      if (bill.items.length === 0) {
        updated.splice(billIndex, 1);
        showToast("Bill removed (no items left)");
      } else {
        updated[billIndex] = bill;
      }

      return updated;
    });
  };

  const deletePaidBill = (billIndex) => {
    setPaidBills((prev) => {
      const updated = [...prev];
      const bill = updated[billIndex];
      updated.splice(billIndex, 1);
      showToast(`Table ${bill.tableId} bill deleted`);
      return updated;
    });
  };

  const enterEditMode = (billIndex) => {
    // Save a snapshot of the current bill state
    setBillSnapshot(JSON.parse(JSON.stringify(paidBills[billIndex])));
    setEditingBillIndex(billIndex);
  };

  const cancelEditMode = () => {
    // Restore the bill from snapshot
    if (billSnapshot && editingBillIndex !== null) {
      setPaidBills((prev) => {
        const updated = [...prev];
        updated[editingBillIndex] = billSnapshot;
        return updated;
      });
      showToast("Changes cancelled");
    }
    setBillSnapshot(null);
    setEditingBillIndex(null);
  };

  const exitEditMode = () => {
    // Exit edit mode without restoring (changes are kept)
    setBillSnapshot(null);
    setEditingBillIndex(null);
  };

  const confirmDeleteBill = () => {
    if (deletingBillIndex !== null) {
      deletePaidBill(deletingBillIndex);
      setBillSnapshot(null);
      setEditingBillIndex(null);
      setDeletingBillIndex(null);
    }
  };

  const cancelDeleteBill = () => {
    setDeletingBillIndex(null);
  };

  const currentOrder = orders[activeTable] || [];
  const unsentItems = currentOrder
    .map((o) => ({ ...o, qty: o.qty - (o.sentQty || 0) }))
    .filter((o) => o.qty > 0);

  const unsentTotal = unsentItems.reduce((s, o) => s + o.price * o.qty, 0);
  const tableBatches = sentBatches[activeTable] || [];

  // For bill display - only show sent items with their sent quantities
  const sentItems = currentOrder
    .map((o) => ({ ...o, qty: o.sentQty || 0 }))
    .filter((o) => o.qty > 0);

  const ticketItems = orders[ticketTable] || [];
  const ticketTotal = ticketItems.reduce((s, o) => s + o.price * o.qty, 0);
  const equalShare = equalGuests > 0 ? ticketTotal / equalGuests : 0;
  const currentGuestNum = splitPayments.length + 1;
  const lastPayment = splitPayments[splitPayments.length - 1];
  const splitSelectedTotal = splitRemaining
    .filter((i) => splitSelected.has(i._uid))
    .reduce((s, i) => s + i.price, 0);
  const splitRemainingTotal = splitRemaining.reduce((s, i) => s + i.price, 0);

  return (
    <div style={S.root}>
      {toast && <div style={S.toast}>{toast}</div>}

      {/* ── TABLES ── */}
      {view === "tables" && (
        <div style={S.page}>
          <header style={S.header}>
            <span style={S.headerTitle}>Floor</span>
            <span style={S.headerSub}>
              {new Date().toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
          </header>
          <div style={S.legend}>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <span key={k} style={S.legendItem}>
                <span style={{ ...S.dot, background: v.dot }} />
                {v.label}
              </span>
            ))}
          </div>
          <button style={S.salesBtn} onClick={() => setView("dailySales")}>
            <span style={S.salesIcon}>📊</span>
            Daily Sales
          </button>
          <div style={S.grid}>
            {TABLES.map((t) => {
              if (t.isDivider) {
                return (
                  <div key={t.label} style={{ ...S.sentDivider, gridColumn: "1 / -1", margin: "8px 0 4px" }}>
                    <div style={S.sentDividerLine} />
                    <span style={S.sentDividerText}>{t.label}</span>
                    <div style={S.sentDividerLine} />
                  </div>
                );
              }
              const status = getTableStatus(t.id, orders, seatedTables);
              const cfg = STATUS_CONFIG[status];
              return (
                <button
                  key={t.id}
                  style={{
                    ...S.tableCard,
                    background: cfg.bg,
                    border: `1.5px solid ${cfg.border}`,
                  }}
                  onClick={() => handleTableClick(t.id)}
                >
                  <span style={{ ...S.tableDot, background: cfg.dot }} />
                  <span style={S.tableNum}>{t.id}</span>
                  <span style={{ ...S.tableStatus, color: cfg.text }}>
                    {cfg.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SEAT CONFIRMATION ── */}
      {seatConfirmTable && (
        <Modal
          title={`Seat Table ${seatConfirmTable}?`}
          onClose={cancelSeatTable}
          onConfirm={confirmSeatTable}
          confirmText="Seat Table"
        >
          <div style={S.modalMessage}>
            Mark this table as seated for incoming guests.
          </div>
        </Modal>
      )}

      {/* ── ORDER ── */}
      {view === "order" && (
        <div style={S.page}>
          <header style={S.header}>
            <button style={S.back} onClick={() => {
              setView("tables");
              setConfirmingClose(false);
            }}>
              ← Back
            </button>
            <span style={S.headerTitle}>Table {activeTable}</span>
            <span />
          </header>

          {/* Tabs */}
          <div style={S.tabs}>
            <div style={S.tabsContainer}>
              <button
                style={{ ...S.tab, ...(activeTab === "order" ? S.tabActive : {}) }}
                onClick={() => {
                  setActiveTab("order");
                  setConfirmingClose(false);
                }}
              >
                Order
              </button>
              <button
                style={{ ...S.tab, ...(activeTab === "bill" ? S.tabActive : {}) }}
                onClick={() => {
                  setActiveTab("bill");
                  setConfirmingClose(false);
                }}
              >
                Bill
              </button>
              <div style={{
                ...S.tabIndicator,
                transform: activeTab === "bill" ? "translateX(100%)" : "translateX(0)"
              }} />
            </div>
          </div>

          {/* Order Tab Content */}
          {activeTab === "order" && (
            <>
              {/* Search Bar with Add Custom Button */}
              <div style={S.searchBar}>
                <button
                  style={S.customAddBtn}
                  onClick={() => setShowCustomModal(true)}
                  title="Add custom item"
                >
                  +
                </button>
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={S.searchInputWithBtn}
                />
                {searchQuery && (
                  <button
                    style={S.searchClear}
                    onClick={() => setSearchQuery("")}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Categories - only show when not searching */}
              {!searchQuery && (
                <div style={S.cats}>
                  {Object.keys(MENU).map((cat) => (
                    <button
                      key={cat}
                      style={{
                        ...S.catBtn,
                        ...(activeCategory === cat ? S.catBtnActive : {}),
                      }}
                      onClick={() => {
                        setActiveCategory(cat);
                        setSelectedFoodSubcategory(null);
                        setSelectedDrinksSubcategory(null);
                        setSelectedBottlesSubcategory(null);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Back button - show when any subcategory is selected */}
              {!searchQuery && (
                (activeCategory === "Food" && selectedFoodSubcategory) ||
                (activeCategory === "Drinks🍷" && selectedDrinksSubcategory) ||
                (activeCategory === "Bottles 🍾" && selectedBottlesSubcategory)
              ) && (
                <div style={{ padding: "12px 16px", background: "#fff", borderBottom: "1px solid #ebe9e3" }}>
                  <button
                    style={S.back}
                    onClick={() => {
                      setSelectedFoodSubcategory(null);
                      setSelectedDrinksSubcategory(null);
                      setSelectedBottlesSubcategory(null);
                    }}
                  >
                    ← Back to categories
                  </button>
                </div>
              )}

              {/* Scrollable container for menu and sent items */}
              <div style={S.orderContent}>
                <div style={S.menuList}>
                {(() => {
                  // Show subcategory tiles for Food when no subcategory is selected
                  if (!searchQuery && activeCategory === "Food" && !selectedFoodSubcategory) {
                    return (
                      <div style={S.subcategoryGrid}>
                        {FOOD_SUBCATEGORIES.map(({ id, label }) => (
                          <button
                            key={id}
                            style={S.subcategoryTile}
                            onClick={() => setSelectedFoodSubcategory(id)}
                          >
                            <div style={S.subcategoryTileEmoji}>
                              {label.split(" ")[0]}
                            </div>
                            <div>{label.substring(label.indexOf(" ") + 1)}</div>
                          </button>
                        ))}
                      </div>
                    );
                  }

                  // Show subcategory tiles for Drinks when no subcategory is selected
                  if (!searchQuery && activeCategory === "Drinks🍷" && !selectedDrinksSubcategory) {
                    return (
                      <div style={S.subcategoryGrid}>
                        {DRINKS_SUBCATEGORIES.map(({ id, label }) => (
                          <button
                            key={id}
                            style={S.subcategoryTile}
                            onClick={() => setSelectedDrinksSubcategory(id)}
                          >
                            <div style={S.subcategoryTileEmoji}>
                              {label.split(" ")[0]}
                            </div>
                            <div>{label.substring(label.indexOf(" ") + 1)}</div>
                          </button>
                        ))}
                      </div>
                    );
                  }

                  // Show subcategory tiles for Bottles when no subcategory is selected
                  if (!searchQuery && activeCategory === "Bottles 🍾" && !selectedBottlesSubcategory) {
                    return (
                      <div style={S.subcategoryGrid}>
                        {BOTTLES_SUBCATEGORIES.map(({ id, label }) => (
                          <button
                            key={id}
                            style={S.subcategoryTile}
                            onClick={() => setSelectedBottlesSubcategory(id)}
                          >
                            <div style={S.subcategoryTileEmoji}>
                              {label.split(" ")[0]}
                            </div>
                            <div>{label.substring(label.indexOf(" ") + 1)}</div>
                          </button>
                        ))}
                      </div>
                    );
                  }

                  // Filter items based on search
                  let itemsToShow = [];

                  if (searchQuery) {
                    // Search across all categories
                    const query = searchQuery.toLowerCase();
                    Object.entries(MENU).forEach(([category, items]) => {
                      items.forEach((item) => {
                        if (item.name.toLowerCase().includes(query)) {
                          itemsToShow.push({ ...item, category });
                        }
                      });
                    });
                  } else {
                    // Show items from active category
                    itemsToShow = MENU[activeCategory].map((item) => ({
                      ...item,
                      category: activeCategory,
                    }));

                    // Filter by selected subcategory if applicable
                    if (activeCategory === "Food" && selectedFoodSubcategory) {
                      itemsToShow = itemsToShow.filter(
                        (item) => item.subcategory === selectedFoodSubcategory
                      );
                    }
                    if (activeCategory === "Drinks🍷" && selectedDrinksSubcategory) {
                      itemsToShow = itemsToShow.filter(
                        (item) => item.subcategory === selectedDrinksSubcategory
                      );
                    }
                    if (activeCategory === "Bottles 🍾" && selectedBottlesSubcategory) {
                      itemsToShow = itemsToShow.filter(
                        (item) => item.subcategory === selectedBottlesSubcategory
                      );
                    }
                  }

                  // Get subcategory config based on active category
                  // Don't show subcategory separators when a specific subcategory is selected
                  let subcategoryConfig = null;
                  if (activeCategory === "Food" && !selectedFoodSubcategory) subcategoryConfig = FOOD_SUBCATEGORIES;
                  else if (activeCategory === "Drinks🍷" && !selectedDrinksSubcategory) subcategoryConfig = DRINKS_SUBCATEGORIES;
                  else if (activeCategory === "Bottles 🍾" && !selectedBottlesSubcategory) subcategoryConfig = BOTTLES_SUBCATEGORIES;

                  // Group by subcategory if config exists and no search
                  // For Food, only group if no specific subcategory is selected
                  if (subcategoryConfig && !searchQuery) {
                    // Group items by subcategory
                    const groupedItems = {};
                    subcategoryConfig.forEach(({ id }) => {
                      groupedItems[id] = [];
                    });

                    itemsToShow.forEach((item) => {
                      const subcat = item.subcategory || "other";
                      if (!groupedItems[subcat]) groupedItems[subcat] = [];
                      groupedItems[subcat].push(item);
                    });

                    // Render with separators
                    return subcategoryConfig.map(({ id, label }) => {
                      const items = groupedItems[id] || [];
                      if (items.length === 0) return null;

                      return (
                        <div key={id}>
                          <div style={S.subcategorySeparator}>{label}</div>
                          {items.map((item) => {
                            // Check if item has variants
                            if (item.variants) {
                              return (
                                <div key={item.id} style={S.menuItem}>
                                  <div style={S.menuItemInfo}>
                                    <span style={S.menuItemName}>{item.name}</span>
                                  </div>
                                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                    {(activeCategory === "Bottles 🍾" ? item.variants.slice().reverse() : item.variants).map((variant) => {
                                      const variantId = `${item.id}-${variant.type}`;
                                      const unsentQty = unsentItems.find(o => o.id === variantId)?.qty || 0;
                                      return (
                                        <button
                                          key={variant.type}
                                          style={S.variantBtn}
                                          onClick={() => addItem(item, variant)}
                                        >
                                          <span style={S.variantLabel}>{variant.label}{unsentQty > 0 && ` (${unsentQty})`}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }

                            // Standard item without variants
                            const unsentQty = unsentItems.find(o => o.id === item.id)?.qty || 0;
                            return (
                              <div key={item.id} style={S.menuItem}>
                                <div style={S.menuItemInfo}>
                                  <span style={S.menuItemName}>{item.name}</span>
                                  <span style={S.menuItemPrice}>
                                    {item.price.toFixed(2)}€
                                  </span>
                                </div>
                                <button style={S.variantBtn} onClick={() => addItem(item)}>
                                  <span style={S.variantLabel}>Add{unsentQty > 0 && ` (${unsentQty})`}</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    });
                  }

                  // Default rendering (search results or non-Food categories)
                  return itemsToShow.length > 0 ? (
                    itemsToShow.map((item) => {
                      // Check if item has variants
                      if (item.variants) {
                        return (
                          <div key={item.id} style={S.menuItem}>
                            <div style={S.menuItemInfo}>
                              <span style={S.menuItemName}>
                                {item.name}
                                {searchQuery && (
                                  <span style={S.menuItemCategory}>
                                    {" "}· {item.category}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {(item.category === "Bottles 🍾" ? item.variants.slice().reverse() : item.variants).map((variant) => {
                                const variantId = `${item.id}-${variant.type}`;
                                const unsentQty = unsentItems.find(o => o.id === variantId)?.qty || 0;
                                return (
                                  <button
                                    key={variant.type}
                                    style={S.variantBtn}
                                    onClick={() => addItem(item, variant)}
                                  >
                                    <span style={S.variantLabel}>{variant.label}{unsentQty > 0 && ` (${unsentQty})`}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // Standard item without variants
                      const unsentQty = unsentItems.find(o => o.id === item.id)?.qty || 0;
                      return (
                        <div key={item.id} style={S.menuItem}>
                          <div style={S.menuItemInfo}>
                            <span style={S.menuItemName}>
                              {item.name}
                              {searchQuery && (
                                <span style={S.menuItemCategory}>
                                  {" "}· {item.category}
                                </span>
                              )}
                            </span>
                            <span style={S.menuItemPrice}>
                              {item.price.toFixed(2)}€
                            </span>
                          </div>
                          <button style={S.variantBtn} onClick={() => addItem(item)}>
                            <span style={S.variantLabel}>Add{unsentQty > 0 && ` (${unsentQty})`}</span>
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div style={S.noResults}>
                      <span style={S.noResultsText}>
                        No items found for "{searchQuery}"
                      </span>
                    </div>
                  );
                })()}
                </div>

                {/* Sent batches - each send creates a new timestamped section */}
                {tableBatches.length > 0 && (
                  <div style={S.sentSectionsContainer}>
                    {[...tableBatches].reverse().map((batch, batchIdx) => {
                      // Group batch items by destination
                      const batchByDestination = { bar: [], counter: [], kitchen: [] };
                      batch.items.forEach((item) => {
                        const destination = getItemDestination(item);
                        batchByDestination[destination].push(item);
                      });

                      return (
                        <div key={batchIdx}>
                          {/* Timestamp divider for this batch */}
                          <div style={S.sentDivider}>
                            <div style={S.sentDividerLine} />
                            <span style={S.sentDividerText}>
                              Sent {batch.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div style={S.sentDividerLine} />
                          </div>

                          {/* Bar items */}
                          {batchByDestination.bar.length > 0 && (
                            <div style={S.sentSection}>
                              <span style={S.sentLabel}>🍷 Bar</span>
                              {batchByDestination.bar.map((o) => (
                                <div key={o.id} style={S.sentItem}>
                                  <span>{o.qty}× {o.name}</span>
                                  <span style={S.sentPrice}>{(o.price * o.qty).toFixed(2)}€</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Counter items */}
                          {batchByDestination.counter.length > 0 && (
                            <div style={S.sentSection}>
                              <span style={S.sentLabel}>🧀 Counter </span>
                              {batchByDestination.counter.map((o) => (
                                <div key={o.id} style={S.sentItem}>
                                  <span>{o.qty}× {o.name}</span>
                                  <span style={S.sentPrice}>{(o.price * o.qty).toFixed(2)}€</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Kitchen items */}
                          {batchByDestination.kitchen.length > 0 && (
                            <div style={S.sentSection}>
                              <span style={S.sentLabel}>🍽️ Kitchen </span>
                              {batchByDestination.kitchen.map((o) => (
                                <div key={o.id} style={S.sentItem}>
                                  <span>{o.qty}× {o.name}</span>
                                  <span style={S.sentPrice}>{(o.price * o.qty).toFixed(2)}€</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order bar - fixed at bottom */}
              {unsentItems.length > 0 && (
                <div style={S.orderBar}>
                  {/* Swipe handle */}
                  <div
                    style={S.orderBarHandle}
                    onClick={() => setOrderBarExpanded(!orderBarExpanded)}
                  >
                    <div style={S.orderBarHandleLine} />
                    {unsentItems.length > 1 && (
                      <span style={S.orderBarHandleText}>
                        {orderBarExpanded ? "Show less" : `${unsentItems.length} items`}
                      </span>
                    )}
                  </div>

                  <div style={orderBarExpanded ? S.orderBarList : S.orderBarListCollapsed}>
                    {(orderBarExpanded ? unsentItems.slice().reverse() : unsentItems.slice(-1)).map((o) => (
                      <div key={o.id} style={S.orderBarItemWrapper}>
                        <div style={S.orderBarItem}>
                          <div style={S.orderBarItemInfo}>
                            <div style={S.orderBarItemName}>{o.name}</div>
                            <div style={S.orderBarItemPrice}>
                              {o.price.toFixed(2)}€
                            </div>
                          </div>
                          <div style={S.orderBarItemControls}>
                            <button
                              style={S.orderBarQtyBtn}
                              onClick={() => removeItem(o.id)}
                            >
                              −
                            </button>
                            <span style={S.orderBarQtyNum}>{o.qty}</span>
                            <button
                              style={S.orderBarQtyBtn}
                              onClick={() => addItem(
                                o.baseId
                                  ? MENU[o.category]?.find(i => i.id === o.baseId) || o
                                  : o,
                                o.variantType
                                  ? MENU[o.category]?.find(i => i.id === o.baseId)?.variants.find(v => v.type === o.variantType)
                                  : null
                              )}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button style={S.sendBtn} onClick={sendOrder}>
                    Send — {unsentTotal.toFixed(2)}€
                  </button>
                </div>
              )}
            </>
          )}

          {/* Bill Tab Content */}
          {activeTab === "bill" && (
            <>
              <div style={S.ticket}>
                <div style={S.billHeader}>
                  <div>
                    <div style={S.closeReceiptBrand}>Käserei Camidi</div>
                    <div style={S.closeReceiptMeta}>
                      Table {activeTable} · {new Date().toLocaleString("en-GB", {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div style={S.billHeaderActions}>
                    <button
                      style={editingBill ? S.billIconBtnActive : S.billIconBtn}
                      onClick={() => editingBill ? confirmBillEdit() : startBillEdit()}
                      title={editingBill ? "Done" : "Edit"}
                    >
                      {editingBill ? "✓" : "✏️"}
                    </button>
                    <button
                      style={S.billIconBtn}
                      onClick={() => setShowGutscheinModal(true)}
                      title="Apply Gutschein"
                    >
                      🎫
                    </button>
                  </div>
                </div>
                <Receipt
                  tableId={activeTable}
                  items={sentItems}
                  editMode={editingBill}
                  gutschein={gutscheinAmounts[activeTable] || 0}
                  onRemoveItem={removeItemFromBill}
                  onAddItem={addItemToBill}
                  onRemoveGutschein={removeGutschein}
                  skipHeader
                />
              </div>

              {/* Split Options - Right under bill */}
              {confirmingClose && (
                <div style={{ ...S.splitOptions, marginBottom: "200px" }}>
                  <div style={S.splitOptionsLabel}>Split the bill</div>
                  <div style={S.splitBtns}>
                    <button
                      style={S.splitOptionBtn}
                      onClick={() => {
                        setTicketTable(activeTable);
                        setEqualSplitPayments([{ amount: "", confirmed: false }]);
                        initiateSplit("equal", activeTable);
                      }}
                    >
                      <span style={S.splitOptionIcon}>⚖</span>
                      <span style={S.splitOptionTitle}>Equal split</span>
                      <span style={S.splitOptionSub}>Total ÷ guests</span>
                    </button>
                    <button
                      style={S.splitOptionBtn}
                      onClick={() => {
                        setTicketTable(activeTable);
                        initiateSplit("item", activeTable);
                      }}
                    >
                      <span style={S.splitOptionIcon}>☰</span>
                      <span style={S.splitOptionTitle}>By item</span>
                      <span style={S.splitOptionSub}>Pay round by round</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sticky bottom: Payment + Button */}
              <div style={S.ticketActions}>
                {confirmingClose && (() => {
                  const subtotal = sentItems.reduce((s, o) => s + o.price * o.qty, 0);
                  const gutschein = gutscheinAmounts[activeTable] || 0;
                  const total = Math.max(0, subtotal - gutschein);

                  return (
                    <div style={S.paymentSection}>
                      <div style={S.paymentLabel}>Amount Paid</div>
                      <div style={S.paymentInputRow}>
                        <input
                          type="number"
                          placeholder={total.toFixed(2)}
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          step="0.01"
                          min="0"
                          style={S.paymentInput}
                          disabled={paymentConfirmed}
                        />
                        <button
                          style={paymentConfirmed ? S.paymentCheckConfirmed : S.paymentCheck}
                          onClick={() => {
                            const amount = paymentAmount && parseFloat(paymentAmount) > 0
                              ? parseFloat(paymentAmount)
                              : total;
                            setPaymentAmount(amount.toString());
                            setPaymentConfirmed(true);
                          }}
                          disabled={paymentConfirmed}
                        >
                          ✓
                        </button>
                      </div>
                      {paymentConfirmed && (() => {
                        const paid = parseFloat(paymentAmount);
                        const tip = paid - total;
                        return (
                          <div style={S.paymentTip}>
                            Tip: {tip >= 0 ? `+${tip.toFixed(2)}€` : `${tip.toFixed(2)}€`}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
                <button
                  style={{
                    ...(confirmingClose ? S.confirmCloseBtn : S.closeBtn),
                    ...(confirmingClose && paymentAmount && !paymentConfirmed ? { opacity: 0.5, cursor: "not-allowed" } : {})
                  }}
                  onClick={() => {
                    if (confirmingClose) {
                      setShowSplitOptions(false);
                      confirmClose(activeTable);
                    } else {
                      setTicketTable(activeTable);
                      setConfirmingClose(true);
                      setShowSplitOptions(true);
                      setPaymentAmount("");
                      setPaymentConfirmed(false);
                    }
                  }}
                  disabled={confirmingClose && paymentAmount && !paymentConfirmed}
                >
                  {confirmingClose ? "Confirm close" : "Close table"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TICKET ── */}
      {view === "ticket" && (
        <div style={S.page}>
          <header style={S.header}>
            <button style={S.back} onClick={() => {
              setView("tables");
              setShowSplitOptions(false);
              setConfirmingClose(false);
            }}>
              ← Back
            </button>
            <span style={S.headerTitle}>Table {ticketTable} — Bill</span>
            <span />
          </header>
          <div style={S.ticket}>
            <Receipt
              tableId={ticketTable}
              items={ticketItems}
            />
          </div>

          <div style={S.ticketActions}>
            <button style={confirmingClose ? S.confirmCloseBtn : S.closeBtn} onClick={() => {
              if (confirmingClose) {
                setShowSplitOptions(false);
                confirmClose(ticketTable);
              } else {
                setConfirmingClose(true);
                setShowSplitOptions(true);
              }
            }}>
              {confirmingClose ? "Confirm close" : "Close table"}
            </button>
            {showSplitOptions && (
              <div style={S.splitOptions}>
                <div style={S.splitOptionsLabel}>Split the bill</div>
                <div style={S.splitBtns}>
                  <button
                    style={S.splitOptionBtn}
                    onClick={() => initiateSplit("equal")}
                  >
                    <span style={S.splitOptionIcon}>⚖</span>
                    <span style={S.splitOptionTitle}>Equal split</span>
                    <span style={S.splitOptionSub}>Total ÷ guests</span>
                  </button>
                  <button
                    style={S.splitOptionBtn}
                    onClick={() => initiateSplit("item")}
                  >
                    <span style={S.splitOptionIcon}>☰</span>
                    <span style={S.splitOptionTitle}>By item</span>
                    <span style={S.splitOptionSub}>Pay round by round</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EQUAL SPLIT ── */}
      {view === "split" && splitMode === "equal" && (
        <div style={S.page}>
          <header style={S.header}>
            <button style={S.back} onClick={() => { setView("ticket"); setShowSplitOptions(false); }}>
              ← Back
            </button>
            <span style={S.headerTitle}>Equal Split — Table {ticketTable}</span>
            <span />
          </header>
          <div style={S.equalCard}>
            <div style={S.equalTotalLine}>
              <span style={S.equalTotalLabel}>Bill total</span>
              <span style={S.equalTotalAmt}>{ticketTotal.toFixed(2)}€</span>
            </div>
            <div style={S.divider} />
            <div style={S.guestCountRow}>
              <span style={S.guestCountLabel}>Number of guests</span>
              <div style={S.guestCounter}>
                <button
                  style={S.guestCountBtn}
                  onClick={() => setEqualGuests(Math.max(1, equalGuests - 1))}
                >
                  −
                </button>
                <span style={S.guestCountNum}>{equalGuests}</span>
                <button
                  style={S.guestCountBtn}
                  onClick={() => setEqualGuests(equalGuests + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div style={S.divider} />
            <div style={S.equalShareRow}>
              <span style={S.equalShareLabel}>Each guest pays</span>
              <span style={S.equalShareAmt}>{equalShare.toFixed(2)}€</span>
            </div>
            {equalGuests > 1 && (
              <div style={S.equalBreakdown}>
                {Array.from({ length: equalGuests }).map((_, i) => (
                  <div key={i} style={S.equalGuestRow}>
                    <span style={S.equalGuestChip}>Guest {i + 1}</span>
                    <span style={S.equalGuestAmt}>{equalShare.toFixed(2)}€</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky bottom: Payment + Button */}
          <div style={S.ticketActions}>
            <div style={S.paymentSection}>
              <div style={S.paymentLabel}>Amount Paid</div>
              {equalSplitPayments.map((payment, idx) => (
                <div
                  key={idx}
                  style={idx === equalSplitPayments.length - 1 ? S.paymentItemLast : S.paymentItem}
                >
                  <div style={S.paymentInputRow}>
                    <input
                      type="number"
                      placeholder={equalShare.toFixed(2)}
                      value={payment.amount}
                      onChange={(e) => {
                        const updated = [...equalSplitPayments];
                        updated[idx] = { ...updated[idx], amount: e.target.value };
                        setEqualSplitPayments(updated);
                      }}
                      step="0.01"
                      min="0"
                      style={S.paymentInput}
                      disabled={payment.confirmed}
                    />
                    <button
                      style={payment.confirmed ? S.paymentCheckConfirmed : S.paymentCheck}
                      onClick={() => {
                        if (!payment.confirmed) {
                          const amount = payment.amount && parseFloat(payment.amount) > 0
                            ? parseFloat(payment.amount)
                            : equalShare;
                          const updated = [...equalSplitPayments];
                          updated[idx] = { amount: amount.toString(), confirmed: true };
                          setEqualSplitPayments(updated);
                          // Add new empty payment input
                          setEqualSplitPayments([...updated, { amount: "", confirmed: false }]);
                        }
                      }}
                      disabled={payment.confirmed}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              ))}
              {(() => {
                const confirmedPayments = equalSplitPayments.filter(p => p.confirmed);
                if (confirmedPayments.length > 0) {
                  const totalPaid = confirmedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                  const expectedTotal = confirmedPayments.length * equalShare;
                  const totalTip = totalPaid - expectedTotal;
                  return (
                    <div style={S.paymentTip}>
                      Total Tip: {totalTip >= 0 ? `+${totalTip.toFixed(2)}€` : `${totalTip.toFixed(2)}€`}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <button
              style={{
                ...S.closeBtn,
                ...(equalSplitPayments.some(p => p.amount && !p.confirmed) ? { opacity: 0.5, cursor: "not-allowed" } : {})
              }}
              onClick={closeSplitTable}
              disabled={equalSplitPayments.some(p => p.amount && !p.confirmed)}
            >
              Close table
            </button>
          </div>
        </div>
      )}

      {/* ── ITEM SPLIT: SELECT ── */}
      {view === "split" && splitMode === "item" && (
        <div style={S.page}>
          <header style={S.header}>
            <button style={S.back} onClick={() => { setView("ticket"); setShowSplitOptions(false); }}>
              ← Back
            </button>
            <span style={S.headerTitle}>Guest {currentGuestNum}</span>
            <button style={S.selectAllBtn} onClick={selectAllRemaining}>
              All
            </button>
          </header>

          {splitPayments.length > 0 && (
            <div style={S.splitProgress}>
              {splitPayments.map((p) => (
                <span key={p.guestNum} style={S.splitProgressChip}>
                  G{p.guestNum} — {p.total.toFixed(2)}€
                </span>
              ))}
              <span style={S.splitProgressRemaining}>
                Left: {splitRemainingTotal.toFixed(2)}€
              </span>
            </div>
          )}

          <div style={S.splitItemList}>
            {splitRemaining.map((item) => {
              const selected = splitSelected.has(item._uid);
              return (
                <button
                  key={item._uid}
                  style={{
                    ...S.splitItem,
                    background: selected ? "#f0f7f1" : "#fff",
                    border: selected ? "1.5px solid #a3c4a8" : "1.5px solid #ebe9e3",
                  }}
                  onClick={() => toggleSplitItem(item._uid)}
                >
                  <span
                    style={{
                      ...S.splitItemCheck,
                      background: selected ? "#2d5a35" : "#e8e8e6",
                      color: selected ? "#fff" : "transparent",
                    }}
                  >
                    ✓
                  </span>
                  <span style={S.splitItemName}>{item.name}</span>
                  <span style={S.splitItemPrice}>{item.price.toFixed(2)}€</span>
                </button>
              );
            })}
          </div>

          {splitSelected.size > 0 && (
            <div style={S.orderBar}>
              <div style={S.orderBarItems}>
                <span style={S.orderBarChip}>
                  {splitSelected.size} item{splitSelected.size > 1 ? "s" : ""} selected
                </span>
                <span style={{ ...S.orderBarChip, background: "#e8f3e9", color: "#2d5a35" }}>
                  Remaining after: {(splitRemainingTotal - splitSelectedTotal).toFixed(2)}€
                </span>
              </div>
              <button style={S.sendBtn} onClick={confirmSplitPayment}>
                Guest {currentGuestNum} pays — {splitSelectedTotal.toFixed(2)}€
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SPLIT CONFIRM ── */}
      {view === "splitConfirm" && lastPayment && (
        <div style={S.page}>
          <header style={S.header}>
            <span />
            <span style={S.headerTitle}>Guest {lastPayment.guestNum} — pays</span>
            <span />
          </header>

          {/* Bill Receipt */}
          <div style={S.ticket}>
            <Receipt
              tableId={ticketTable}
              items={lastPayment.items}
              guestNum={lastPayment.guestNum}
            />
          </div>

          {/* Sticky bottom: Payment + Still to pay + Button */}
          <div style={S.ticketActions}>
            <div style={S.paymentSection}>
              <div style={S.paymentLabel}>Amount Paid</div>
              <div style={S.paymentInputRow}>
                <input
                  type="number"
                  placeholder={lastPayment.total.toFixed(2)}
                  value={itemSplitPayments[lastPayment.guestNum]?.amount || ""}
                  onChange={(e) => {
                    setItemSplitPayments(prev => ({
                      ...prev,
                      [lastPayment.guestNum]: {
                        amount: e.target.value,
                        confirmed: false
                      }
                    }));
                  }}
                  step="0.01"
                  min="0"
                  style={S.paymentInput}
                  disabled={itemSplitPayments[lastPayment.guestNum]?.confirmed}
                />
                <button
                  style={itemSplitPayments[lastPayment.guestNum]?.confirmed ? S.paymentCheckConfirmed : S.paymentCheck}
                  onClick={() => {
                    const payment = itemSplitPayments[lastPayment.guestNum];
                    const amount = payment?.amount && parseFloat(payment.amount) > 0
                      ? parseFloat(payment.amount)
                      : lastPayment.total;

                    setItemSplitPayments(prev => ({
                      ...prev,
                      [lastPayment.guestNum]: {
                        amount: amount.toString(),
                        confirmed: true
                      }
                    }));
                  }}
                  disabled={itemSplitPayments[lastPayment.guestNum]?.confirmed}
                >
                  ✓
                </button>
              </div>
              {itemSplitPayments[lastPayment.guestNum]?.confirmed && (() => {
                const paid = parseFloat(itemSplitPayments[lastPayment.guestNum].amount);
                const tip = paid - lastPayment.total;
                return (
                  <div style={S.paymentTip}>
                    Tip: {tip >= 0 ? `+${tip.toFixed(2)}€` : `${tip.toFixed(2)}€`}
                  </div>
                );
              })()}
            </div>

            {/* Still to pay banner */}
            {splitRemaining.length > 0 && (
              <div style={S.splitRemainingBanner}>
                <div>
                  <div style={S.splitRemainingLabel}>Still to pay</div>
                  <div style={S.splitRemainingItems}>
                    {splitRemaining.length} item{splitRemaining.length > 1 ? "s" : ""}
                  </div>
                </div>
                <span style={S.splitRemainingAmt}>{splitRemainingTotal.toFixed(2)}€</span>
              </div>
            )}

            {splitRemaining.length > 0 ? (
              <button
                style={{
                  ...S.sendBtn,
                  ...(itemSplitPayments[lastPayment.guestNum]?.amount && !itemSplitPayments[lastPayment.guestNum]?.confirmed ? { opacity: 0.5, cursor: "not-allowed" } : {})
                }}
                onClick={nextSplitGuest}
                disabled={itemSplitPayments[lastPayment.guestNum]?.amount && !itemSplitPayments[lastPayment.guestNum]?.confirmed}
              >
                Next guest →
              </button>
            ) : (
              <button
                style={{
                  ...S.sendBtn,
                  ...(itemSplitPayments[lastPayment.guestNum]?.amount && !itemSplitPayments[lastPayment.guestNum]?.confirmed ? { opacity: 0.5, cursor: "not-allowed" } : {})
                }}
                onClick={() => setView("splitDone")}
                disabled={itemSplitPayments[lastPayment.guestNum]?.amount && !itemSplitPayments[lastPayment.guestNum]?.confirmed}
              >
                Confirm
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── SPLIT DONE ── */}
      {view === "splitDone" && (
        <div style={S.page}>
          <header style={S.header}>
            <span />
            <span style={S.headerTitle}>Bill Settled — Table {ticketTable}</span>
            <span />
          </header>
          <div style={S.splitDoneCard}>
            <div style={S.splitDoneBadge}>✓</div>
            <div style={S.splitDoneTitle}>All paid</div>
            <div style={S.splitDoneSub}>
              {splitPayments.length} guest{splitPayments.length > 1 ? "s" : ""} · {ticketTotal.toFixed(2)}€ total
            </div>
            <div style={S.divider} />
            {splitPayments.map((p) => (
              <div key={p.guestNum} style={S.splitDoneRow}>
                <span style={S.splitDoneGuest}>Guest {p.guestNum}</span>
                <div style={S.splitDoneItems}>
                  {p.items.map((item, idx) => (
                    <span key={idx} style={S.splitDoneItemChip}>{item.name}</span>
                  ))}
                </div>
                <span style={S.splitDoneAmt}>{p.total.toFixed(2)}€</span>
              </div>
            ))}
            <div style={S.divider} />
            <div style={S.splitDoneTotal}>
              <span>Total collected</span>
              <span>{splitPayments.reduce((s, p) => s + p.total, 0).toFixed(2)}€</span>
            </div>
            {(() => {
              // Calculate total tips from all guests
              const guestsWithPayment = splitPayments.filter(p =>
                itemSplitPayments[p.guestNum]?.confirmed
              );

              if (guestsWithPayment.length > 0) {
                const totalTip = guestsWithPayment.reduce((sum, p) => {
                  const paid = parseFloat(itemSplitPayments[p.guestNum].amount);
                  const tip = paid - p.total;
                  return sum + tip;
                }, 0);

                return (
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 15,
                    color: totalTip >= 0 ? "#2d5a35" : "#c0392b",
                    marginTop: 8,
                    fontWeight: 600
                  }}>
                    <span>Total tip</span>
                    <span>{totalTip >= 0 ? `+${totalTip.toFixed(2)}€` : `${totalTip.toFixed(2)}€`}</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <div style={S.ticketActions}>
            <button style={S.closeBtn} onClick={closeSplitTable}>
              Close table
            </button>
          </div>
        </div>
      )}

      {/* ── DAILY SALES ── */}
      {view === "dailySales" && (
        <div style={S.page}>
          <header style={S.header}>
            <button style={S.back} onClick={() => setView("tables")}>
              ← Back
            </button>
            <span style={S.headerTitle}>Daily Sales</span>
            <span />
          </header>

          {paidBills.length === 0 ? (
            <div style={S.emptyState}>
              <div style={S.emptyStateIcon}>📊</div>
              <div style={S.emptyStateText}>
                No sales yet today.
                <br />
                Closed bills will appear here.
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div style={S.tabs}>
                <button
                  style={{ ...S.tab, ...(dailySalesTab === "chronological" ? S.tabActive : {}) }}
                  onClick={() => setDailySalesTab("chronological")}
                >
                  Chronological
                </button>
                <button
                  style={{ ...S.tab, ...(dailySalesTab === "total" ? S.tabActive : {}) }}
                  onClick={() => setDailySalesTab("total")}
                >
                  Total
                </button>
              </div>

              <div style={S.salesSummary}>
                <div style={S.salesSummaryRow}>
                  <span style={S.salesLabel}>Bills closed</span>
                  <span style={S.salesValue}>{paidBills.length}</span>
                </div>
                <div style={S.salesSummaryRow}>
                  <span style={S.salesLabel}>Total items sold</span>
                  <span style={S.salesValue}>
                    {paidBills.reduce(
                      (sum, bill) =>
                        sum + bill.items.reduce((s, item) => s + item.qty, 0),
                      0
                    )}
                  </span>
                </div>
                {(() => {
                  const totalTips = paidBills.reduce((sum, bill) =>
                    sum + (bill.tip !== undefined ? bill.tip : 0), 0
                  );
                  if (totalTips !== 0) {
                    return (
                      <div style={S.salesSummaryRow}>
                        <span style={S.salesLabel}>Total Tips</span>
                        <span style={{ ...S.salesValue, color: totalTips >= 0 ? "#2d5a35" : "#c0392b" }}>
                          {totalTips >= 0 ? `+${totalTips.toFixed(2)}€` : `${totalTips.toFixed(2)}€`}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
                {(() => {
                  const billsWithGutschein = paidBills.filter(bill => bill.gutschein && bill.gutschein > 0);
                  const totalGutschein = billsWithGutschein.reduce((sum, bill) => sum + bill.gutschein, 0);
                  if (totalGutschein > 0) {
                    return (
                      <div style={S.salesSummaryRow}>
                        <span style={S.salesLabel}>
                          Gutscheins ({billsWithGutschein.length})
                        </span>
                        <span style={{ ...S.salesValue, color: "#c0392b" }}>
                          -{totalGutschein.toFixed(2)}€
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div style={S.salesTotalRow}>
                  <span style={S.salesTotalLabel}>Total Revenue</span>
                  <span style={S.salesTotalAmt}>
                    {paidBills.reduce((sum, bill) => sum + bill.total, 0).toFixed(2)}€
                  </span>
                </div>
              </div>

              {/* Chronological Tab Content */}
              {dailySalesTab === "chronological" && (
                <div style={S.billsList}>
                  {[...paidBills].reverse().map((bill, reverseIdx) => {
                    // Calculate original index in paidBills array
                    const billIndex = paidBills.length - 1 - reverseIdx;
                    const isEditing = editingBillIndex === billIndex;

                    return (
                      <div key={reverseIdx} style={S.billCard}>
                        <div style={S.billCardHeader}>
                          <span style={S.billTableNum}>Table {bill.tableId}</span>
                          {!isEditing ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={S.billTotal}>{bill.total.toFixed(2)}€</span>
                              <button
                                style={S.editBillBtn}
                                onClick={() => enterEditMode(billIndex)}
                              >
                                Edit
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                style={S.doneEditBtn}
                                onClick={exitEditMode}
                              >
                                Done
                              </button>
                              <button
                                style={S.cancelEditBtn}
                                onClick={cancelEditMode}
                              >
                                Cancel
                              </button>
                              <button
                                style={S.deleteBillBtnIcon}
                                onClick={() => setDeletingBillIndex(billIndex)}
                                title="Delete this bill"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                        <div style={S.billMeta}>
                          {new Date(bill.timestamp).toLocaleString("en-GB")} ·{" "}
                          {bill.paymentMode === "full"
                            ? bill.gutschein
                              ? `Full payment (Gutschein: ${bill.gutschein.toFixed(2)}€)`
                              : "Full payment"
                            : bill.paymentMode === "equal"
                            ? `Split ${bill.splitData.guests} ways`
                            : `Split by item (${bill.splitData.payments.length} guests)`}
                          {bill.tip !== undefined && (
                            <span style={{ color: bill.tip >= 0 ? "#2d5a35" : "#c0392b" }}>
                              {" "}· Tip: {bill.tip >= 0 ? `+${bill.tip.toFixed(2)}€` : `${bill.tip.toFixed(2)}€`}
                            </span>
                          )}
                        </div>
                        <div style={S.billItemsList}>
                          {bill.items.map((item) => (
                            <div key={item.id} style={isEditing ? S.billItemEditable : S.billItem}>
                              {isEditing && (
                                <button
                                  style={S.billItemRemoveBtn}
                                  onClick={() => removePaidBillItem(billIndex, item.id)}
                                  title="Remove one"
                                >
                                  −
                                </button>
                              )}
                              <span style={S.billItemName}>
                                <span style={S.billItemQty}>{item.qty}×</span>
                                {item.name}
                              </span>
                              <span style={S.billItemPrice}>
                                {(item.price * item.qty).toFixed(2)}€
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total Tab Content */}
              {dailySalesTab === "total" && (() => {
                // Aggregate items across all bills and enrich with category/subcategory info
                const itemsMap = new Map();
                paidBills.forEach((bill) => {
                  bill.items.forEach((item) => {
                    if (!itemsMap.has(item.id)) {
                      // Use stored category/subcategory first, fallback to MENU lookup
                      let category = item.category || null;
                      let subcategory = item.subcategory || null;

                      // Fallback: look up in MENU if not stored
                      if (!category || !subcategory) {
                        const lookupId = item.baseId || item.id;
                        for (const [cat, items] of Object.entries(MENU)) {
                          const found = items.find(i => i.id === lookupId);
                          if (found) {
                            category = category || cat;
                            subcategory = subcategory || found.subcategory;
                            break;
                          }
                        }
                      }

                      itemsMap.set(item.id, {
                        name: item.name,
                        qty: 0,
                        revenue: 0,
                        category,
                        subcategory
                      });
                    }

                    const existing = itemsMap.get(item.id);
                    existing.qty += item.qty;
                    existing.revenue += item.price * item.qty;
                  });
                });

                // Convert to array
                const aggregatedItems = Array.from(itemsMap.values());

                // Group by category and subcategory
                const categorizedItems = {};
                Object.keys(MENU).forEach(cat => {
                  categorizedItems[cat] = {};
                });

                aggregatedItems.forEach(item => {
                  const cat = item.category || "Ad-hoc Items";
                  const subcat = item.subcategory || "custom";

                  if (!categorizedItems[cat]) categorizedItems[cat] = {};
                  if (!categorizedItems[cat][subcat]) categorizedItems[cat][subcat] = [];

                  categorizedItems[cat][subcat].push(item);
                });

                // Sort items within each subcategory by quantity (descending)
                Object.values(categorizedItems).forEach(subcats => {
                  Object.values(subcats).forEach(items => {
                    items.sort((a, b) => b.qty - a.qty);
                  });
                });

                // Get subcategory configs
                const subcatConfigs = {
                  "Food": FOOD_SUBCATEGORIES,
                  "Drinks🍷": DRINKS_SUBCATEGORIES,
                  "Bottles 🍾": BOTTLES_SUBCATEGORIES
                };

                return (
                  <div style={S.billsList}>
                    {/* Render menu categories first */}
                    {Object.keys(MENU).map(category => {
                      const categoryItems = categorizedItems[category];
                      const subcatConfig = subcatConfigs[category];

                      // Check if category has any items
                      const hasItems = Object.values(categoryItems).some(items => items.length > 0);
                      if (!hasItems) return null;

                      if (subcatConfig) {
                        // Render with subcategory separators
                        return subcatConfig.map(({ id, label }) => {
                          const items = categoryItems[id] || [];
                          if (items.length === 0) return null;

                          return (
                            <div key={`${category}-${id}`}>
                              <div style={S.subcategorySeparator}>{label}</div>
                              {items.map((item, idx) => (
                                <div key={idx} style={S.billCard}>
                                  <div style={S.billCardHeader}>
                                    <span style={S.billTableNum}>{item.name}</span>
                                    <span style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", textAlign: "center", minWidth: 36 }}>{item.qty}</span>
                                  </div>
                                  <div style={S.billMeta}>
                                    {item.revenue.toFixed(2)}€ total · {(item.revenue / item.qty).toFixed(2)}€ each
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        });
                      } else {
                        // Render without subcategory separators (for categories without subcategories)
                        const allItems = Object.values(categoryItems).flat();
                        if (allItems.length === 0) return null;

                        return (
                          <div key={category}>
                            <div style={S.subcategorySeparator}>{category}</div>
                            {allItems.map((item, idx) => (
                              <div key={idx} style={S.billCard}>
                                <div style={S.billCardHeader}>
                                  <span style={S.billTableNum}>{item.name}</span>
                                  <span style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", textAlign: "center", minWidth: 36 }}>{item.qty}</span>
                                </div>
                                <div style={S.billMeta}>
                                  {item.revenue.toFixed(2)}€ total · {(item.revenue / item.qty).toFixed(2)}€ each
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                    })}

                    {/* Render ad-hoc/custom items at the end */}
                    {categorizedItems["Ad-hoc Items"] && (() => {
                      const customItems = Object.values(categorizedItems["Ad-hoc Items"]).flat();
                      if (customItems.length === 0) return null;

                      return (
                        <div key="ad-hoc">
                          <div style={S.subcategorySeparator}>Ad-hoc Items</div>
                          {customItems.map((item, idx) => (
                            <div key={idx} style={S.billCard}>
                              <div style={S.billCardHeader}>
                                <span style={S.billTableNum}>{item.name}</span>
                                <span style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", textAlign: "center", minWidth: 36 }}>{item.qty}</span>
                              </div>
                              <div style={S.billMeta}>
                                {item.revenue.toFixed(2)}€ total · {(item.revenue / item.qty).toFixed(2)}€ each
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              <button style={S.clearDayBtn} onClick={clearDailySales}>
                Clear Daily Sales
              </button>
            </>
          )}
        </div>
      )}

      {/* ── DELETE BILL CONFIRMATION ── */}
      {deletingBillIndex !== null && (
        <Modal
          title="Delete Bill?"
          onClose={cancelDeleteBill}
          onConfirm={confirmDeleteBill}
          confirmText="Delete"
          confirmStyle={S.modalDeleteBtn}
        >
          <div style={S.modalMessage}>
            Are you sure? This action cannot be undone.
          </div>
        </Modal>
      )}

      {/* ── CUSTOM ITEM MODAL ── */}
      {showCustomModal && (
        <Modal
          title="Add Custom Item"
          onClose={() => setShowCustomModal(false)}
          onConfirm={addCustomItem}
          confirmText="Add to order"
          closeOnBackdrop={false}
        >
          <div style={S.customModalForm}>
            <div style={S.customModalField}>
              <label style={S.customModalLabel}>Item name</label>
              <input
                type="text"
                placeholder="e.g., Special request"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={S.customModalInput}
                autoFocus
              />
            </div>
            <div style={S.customModalRow}>
              <div style={S.customModalField}>
                <label style={S.customModalLabel}>Price (€)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  style={S.customModalInput}
                />
              </div>
              <div style={S.customModalFieldSmall}>
                <label style={S.customModalLabel}>Quantity</label>
                <input
                  type="number"
                  placeholder="1"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  min="1"
                  style={S.customModalInput}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── GUTSCHEIN MODAL ── */}
      {showGutscheinModal && (
        <Modal
          title="Apply Gutschein"
          onClose={() => {
            setShowGutscheinModal(false);
            setGutscheinInput("");
          }}
          onConfirm={applyGutschein}
          confirmText="Apply"
        >
          <div style={S.customModalForm}>
            <div style={S.customModalField}>
              <label style={S.customModalLabel}>Amount (€)</label>
              <input
                type="number"
                placeholder="0.00"
                value={gutscheinInput}
                onChange={(e) => setGutscheinInput(e.target.value)}
                step="0.01"
                min="0"
                style={S.customModalInput}
                autoFocus
              />
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
