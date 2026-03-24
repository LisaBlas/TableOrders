import { useState, useEffect } from "react";
import { TABLES, MENU, STATUS_CONFIG, FOOD_SUBCATEGORIES, DRINKS_SUBCATEGORIES, WINES_SUBCATEGORIES } from "./data/constants";
import { getTableStatus, expandItems, copyToClipboard, formatTicketText, formatOrderText } from "./utils/helpers";
import { S } from "./styles/appStyles";

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
  const [closedReceipt, setClosedReceipt] = useState(null);
  const [activeTab, setActiveTab] = useState("order"); // "order" or "bill"
  const [searchQuery, setSearchQuery] = useState("");
  const [seatConfirmTable, setSeatConfirmTable] = useState(null);
  const [dailySalesTab, setDailySalesTab] = useState("chronological");

  // Custom item state
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Split state
  const [splitRemaining, setSplitRemaining] = useState([]);
  const [splitSelected, setSplitSelected] = useState(new Set());
  const [splitPayments, setSplitPayments] = useState([]);
  const [splitMode, setSplitMode] = useState(null);
  const [equalGuests, setEqualGuests] = useState(2);
  const [showSplitOptions, setShowSplitOptions] = useState(false);

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
    setActiveTab("order");
    setShowSplitOptions(false);
    setSearchQuery("");
    setCustomName("");
    setCustomPrice("");
    setCustomQty("1");
    setView("order");
  };

  const addItem = (item) => {
    setOrders((prev) => {
      const current = prev[activeTable] || [];
      const existing = current.find((o) => o.id === item.id && !o.sent);
      if (existing) {
        return {
          ...prev,
          [activeTable]: current.map((o) =>
            o.id === item.id && !o.sent ? { ...o, qty: o.qty + 1 } : o
          ),
        };
      }
      return { ...prev, [activeTable]: [...current, { ...item, qty: 1, sent: false }] };
    });
    showToast(`+ ${item.name}`);
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
      sent: false
    };

    // Add to order using existing logic
    setOrders((prev) => {
      const current = prev[activeTable] || [];
      return { ...prev, [activeTable]: [...current, { ...customItem, qty }] };
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
          .map((o) => (o.id === itemId && !o.sent ? { ...o, qty: o.qty - 1 } : o))
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
          .map((o) => (o.id === itemId ? { ...o, qty: o.qty - 1 } : o))
          .filter((o) => o.qty > 0),
      };
    });
  };

  const sendOrder = () => {
    const current = orders[activeTable] || [];
    const unsent = current.filter((o) => !o.sent);
    if (unsent.length === 0) return;
    const text = formatOrderText(activeTable, unsent);
    copyToClipboard(text);
    setOrders((prev) => ({
      ...prev,
      [activeTable]: current.map((o) => (o.sent ? o : { ...o, sent: true })),
    }));
    showToast("Order sent & copied!");
  };

  const openTicket = (tableId) => {
    setTicketTable(tableId);
    setShowSplitOptions(false);
    setView("ticket");
  };

  const initiateClose = (tableId = ticketTable) => {
    const items = orders[tableId] || [];
    const total = items.reduce((s, o) => s + o.price * o.qty, 0);
    setClosedReceipt({ tableId, items, total, time: new Date() });
    setView("close");
  };

  const confirmClose = () => {
    // Save bill to paid bills
    setPaidBills((prev) => [
      ...prev,
      {
        tableId: closedReceipt.tableId,
        items: closedReceipt.items,
        total: closedReceipt.total,
        timestamp: new Date().toISOString(),
        paymentMode: "full",
      },
    ]);

    setOrders((prev) => {
      const next = { ...prev };
      delete next[closedReceipt.tableId];
      return next;
    });
    setSeatedTables((prev) => {
      const next = new Set(prev);
      next.delete(closedReceipt.tableId);
      return next;
    });
    showToast(`Table ${closedReceipt.tableId} closed ✓`);
    setView("tables");
    setTicketTable(null);
    setClosedReceipt(null);
  };

  const copyTicket = (tableId, items) => {
    const text = formatTicketText(tableId, items);
    copyToClipboard(text);
    showToast("Ticket copied!");
  };

  const clearDailySales = () => {
    if (confirm("Clear all daily sales? This cannot be undone.")) {
      setPaidBills([]);
      showToast("Daily sales cleared");
    }
  };

  // ── SPLIT ──────────────────────────────────────────────
  const initiateSplit = (mode, tableId = ticketTable) => {
    const items = orders[tableId] || [];
    setSplitRemaining(expandItems(items));
    setSplitSelected(new Set());
    setSplitPayments([]);
    setSplitMode(mode);
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
    setView(newRemaining.length === 0 ? "splitDone" : "splitConfirm");
  };

  const nextSplitGuest = () => {
    setSplitSelected(new Set());
    setView("split");
  };

  const closeSplitTable = () => {
    const items = orders[ticketTable] || [];
    const total = items.reduce((s, o) => s + o.price * o.qty, 0);

    // Save bill to paid bills
    setPaidBills((prev) => [
      ...prev,
      {
        tableId: ticketTable,
        items: items,
        total: total,
        timestamp: new Date().toISOString(),
        paymentMode: splitMode === "equal" ? "equal" : "item",
        splitData: splitMode === "item" ? { payments: splitPayments } : { guests: equalGuests },
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
    showToast(`Table ${ticketTable} closed ✓`);
    setView("tables");
    setTicketTable(null);
    setSplitRemaining([]);
    setSplitSelected(new Set());
    setSplitPayments([]);
    setSplitMode(null);
  };

  const currentOrder = orders[activeTable] || [];
  const unsentItems = currentOrder.filter((o) => !o.sent);
  const sentItems = currentOrder.filter((o) => o.sent);
  const unsentTotal = unsentItems.reduce((s, o) => s + o.price * o.qty, 0);

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
        <div style={S.modalOverlay} onClick={cancelSeatTable}>
          <div style={S.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>Seat Table {seatConfirmTable}?</div>
            <div style={S.modalMessage}>
              Mark this table as seated for incoming guests.
            </div>
            <div style={S.modalActions}>
              <button style={S.modalCancelBtn} onClick={cancelSeatTable}>
                Cancel
              </button>
              <button style={S.modalConfirmBtn} onClick={confirmSeatTable}>
                Seat Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ORDER ── */}
      {view === "order" && (
        <div style={S.page}>
          <header style={S.header}>
            <button style={S.back} onClick={() => setView("tables")}>
              ← Back
            </button>
            <span style={S.headerTitle}>Table {activeTable}</span>
            <span />
          </header>

          {/* Tabs */}
          <div style={S.tabs}>
            <button
              style={{ ...S.tab, ...(activeTab === "order" ? S.tabActive : {}) }}
              onClick={() => setActiveTab("order")}
            >
              Order
            </button>
            <button
              style={{ ...S.tab, ...(activeTab === "bill" ? S.tabActive : {}) }}
              onClick={() => setActiveTab("bill")}
            >
              Bill
            </button>
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
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Scrollable container for menu and sent items */}
              <div style={S.orderContent}>
                <div style={S.menuList}>
                {(() => {
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
                  }

                  // Get subcategory config based on active category
                  let subcategoryConfig = null;
                  if (activeCategory === "Food") subcategoryConfig = FOOD_SUBCATEGORIES;
                  else if (activeCategory === "Drinks🍷") subcategoryConfig = DRINKS_SUBCATEGORIES;
                  else if (activeCategory === "Wines 🍾") subcategoryConfig = WINES_SUBCATEGORIES;

                  // Group by subcategory if config exists and no search
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
                            const inOrder = unsentItems.find((o) => o.id === item.id);
                            return (
                              <div key={item.id} style={S.menuItem}>
                                <div style={S.menuItemInfo}>
                                  <span style={S.menuItemName}>{item.name}</span>
                                  <span style={S.menuItemPrice}>
                                    {item.price.toFixed(2)}€
                                  </span>
                                </div>
                                <div style={S.qtyControl}>
                                  {inOrder ? (
                                    <>
                                      <button
                                        style={S.qtyBtn}
                                        onClick={() => removeItem(item.id)}
                                      >
                                        −
                                      </button>
                                      <span style={S.qtyNum}>{inOrder.qty}</span>
                                      <button style={S.qtyBtn} onClick={() => addItem(item)}>
                                        +
                                      </button>
                                    </>
                                  ) : (
                                    <button style={S.addBtn} onClick={() => addItem(item)}>
                                      Add
                                    </button>
                                  )}
                                </div>
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
                      const inOrder = unsentItems.find((o) => o.id === item.id);
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
                          <div style={S.qtyControl}>
                            {inOrder ? (
                              <>
                                <button
                                  style={S.qtyBtn}
                                  onClick={() => removeItem(item.id)}
                                >
                                  −
                                </button>
                                <span style={S.qtyNum}>{inOrder.qty}</span>
                                <button style={S.qtyBtn} onClick={() => addItem(item)}>
                                  +
                                </button>
                              </>
                            ) : (
                              <button style={S.addBtn} onClick={() => addItem(item)}>
                                Add
                              </button>
                            )}
                          </div>
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

                {/* Sent items section - inside scrollable area */}
                {sentItems.length > 0 && (
                  <div style={S.sentSection}>
                    <span style={S.sentLabel}>Sent to kitchen</span>
                    {sentItems.map((o) => (
                      <div key={o.id} style={S.sentItem}>
                        <span>
                          {o.qty}× {o.name}
                        </span>
                        <span style={S.sentPrice}>
                          {(o.price * o.qty).toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order bar - fixed at bottom */}
              {unsentItems.length > 0 && (
                <div style={S.orderBar}>
                  <div style={S.orderBarItems}>
                    {unsentItems.map((o) => (
                      <span key={o.id} style={S.orderBarChip}>
                        {o.qty}× {o.name}
                      </span>
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
                <div style={S.ticketHeader}>
                  <span style={S.ticketRestaurant}>Käserei Camidi</span>
                  <span style={S.ticketDate}>
                    {new Date().toLocaleString("en-GB")}
                  </span>
                </div>
                <div style={S.divider} />
                {currentOrder.map((o) => (
                  <div key={o.id} style={S.ticketRowEditable}>
                    <button
                      style={S.ticketRemoveBtn}
                      onClick={() => removeItemFromBill(o.id)}
                      title="Remove one"
                    >
                      −
                    </button>
                    <span style={S.ticketQty}>{o.qty}×</span>
                    <span style={S.ticketName}>{o.name}</span>
                    <span style={S.ticketPrice}>
                      {(o.price * o.qty).toFixed(2)}€
                    </span>
                  </div>
                ))}
                <div style={S.divider} />
                <div style={S.ticketTotal}>
                  <span>Total</span>
                  <span>{currentOrder.reduce((s, o) => s + o.price * o.qty, 0).toFixed(2)}€</span>
                </div>
              </div>

              {/* Split options */}
              {showSplitOptions && (
                <div style={S.splitOptions}>
                  <div style={S.splitOptionsLabel}>Split the bill</div>
                  <div style={S.splitBtns}>
                    <button
                      style={S.splitOptionBtn}
                      onClick={() => {
                        setTicketTable(activeTable);
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

              <div style={S.ticketActions}>
                <button
                  style={S.copyBtn}
                  onClick={() => copyTicket(activeTable, currentOrder)}
                >
                  Copy ticket
                </button>
                {!showSplitOptions ? (
                  <button style={S.closeBtn} onClick={() => setShowSplitOptions(true)}>
                    Payment
                  </button>
                ) : (
                  <button style={S.closeBtn} onClick={() => {
                    setTicketTable(activeTable);
                    initiateClose(activeTable);
                  }}>
                    Close table
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TICKET ── */}
      {view === "ticket" && (
        <div style={S.page}>
          <header style={S.header}>
            <button style={S.back} onClick={() => setView("tables")}>
              ← Back
            </button>
            <span style={S.headerTitle}>Table {ticketTable} — Bill</span>
            <span />
          </header>
          <div style={S.ticket}>
            <div style={S.ticketHeader}>
              <span style={S.ticketRestaurant}>Käserei Camidi</span>
              <span style={S.ticketDate}>
                {new Date().toLocaleString("en-GB")}
              </span>
            </div>
            <div style={S.divider} />
            {ticketItems.map((o) => (
              <div key={o.id} style={S.ticketRow}>
                <span style={S.ticketQty}>{o.qty}×</span>
                <span style={S.ticketName}>{o.name}</span>
                <span style={S.ticketPrice}>
                  {(o.price * o.qty).toFixed(2)}€
                </span>
              </div>
            ))}
            <div style={S.divider} />
            <div style={S.ticketTotal}>
              <span>Total</span>
              <span>{ticketTotal.toFixed(2)}€</span>
            </div>
          </div>

          {/* Split options */}
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

          <div style={S.ticketActions}>
            <button
              style={S.copyBtn}
              onClick={() => copyTicket(ticketTable, ticketItems)}
            >
              Copy ticket
            </button>
            {!showSplitOptions ? (
              <button style={S.closeBtn} onClick={() => setShowSplitOptions(true)}>
                Payment
              </button>
            ) : (
              <button style={S.closeBtn} onClick={() => initiateClose()}>
                Close table
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── EQUAL SPLIT ── */}
      {view === "split" && splitMode === "equal" && (
        <div style={S.page}>
          <header style={S.header}>
            <button style={S.back} onClick={() => setView("ticket")}>
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
                    <span style={S.equalGuestAmt}>
                      {equalShare.toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={S.ticketActions}>
            <button
              style={S.copyBtn}
              onClick={() => {
                const lines = Array.from({ length: equalGuests })
                  .map((_, i) => `Guest ${i + 1}: ${equalShare.toFixed(2)}€`)
                  .join("\n");
                copyToClipboard(
                  `SPLIT — Table ${ticketTable}\nTotal: ${ticketTotal.toFixed(
                    2
                  )}€ ÷ ${equalGuests}\n\n${lines}`
                );
                showToast("Split copied!");
              }}
            >
              Copy split
            </button>
            <button style={S.closeBtn} onClick={() => initiateClose()}>
              Close table
            </button>
          </div>
        </div>
      )}

      {/* ── ITEM SPLIT: SELECT ── */}
      {view === "split" && splitMode === "item" && (
        <div style={S.page}>
          <header style={S.header}>
            <button style={S.back} onClick={() => setView("ticket")}>
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
                    border: selected
                      ? "1.5px solid #a3c4a8"
                      : "1.5px solid #ebe9e3",
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
                  {splitSelected.size} item{splitSelected.size > 1 ? "s" : ""}{" "}
                  selected
                </span>
                <span
                  style={{
                    ...S.orderBarChip,
                    background: "#e8f3e9",
                    color: "#2d5a35",
                  }}
                >
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
            <span style={S.headerTitle}>Guest {lastPayment.guestNum} — Paid</span>
            <span />
          </header>
          <div style={S.splitConfirmCard}>
            <div style={S.splitConfirmBadge}>✓</div>
            <div style={S.splitConfirmAmt}>
              {lastPayment.total.toFixed(2)}€
            </div>
            <div style={S.splitConfirmSub}>
              Guest {lastPayment.guestNum} paid
            </div>
            <div style={S.divider} />
            {lastPayment.items.map((item, idx) => (
              <div key={idx} style={S.splitConfirmRow}>
                <span style={S.splitConfirmName}>{item.name}</span>
                <span style={S.splitConfirmPrice}>
                  {item.price.toFixed(2)}€
                </span>
              </div>
            ))}
          </div>
          <div style={S.splitRemainingBanner}>
            <div>
              <div style={S.splitRemainingLabel}>Still to pay</div>
              <div style={S.splitRemainingItems}>
                {splitRemaining.length} item
                {splitRemaining.length > 1 ? "s" : ""}
              </div>
            </div>
            <span style={S.splitRemainingAmt}>
              {splitRemainingTotal.toFixed(2)}€
            </span>
          </div>
          <div style={{ padding: "0 16px 24px" }}>
            <button style={S.sendBtn} onClick={nextSplitGuest}>
              Next guest →
            </button>
          </div>
        </div>
      )}

      {/* ── SPLIT DONE ── */}
      {view === "splitDone" && (
        <div style={S.page}>
          <header style={S.header}>
            <span />
            <span style={S.headerTitle}>
              Bill Settled — Table {ticketTable}
            </span>
            <span />
          </header>
          <div style={S.splitDoneCard}>
            <div style={S.splitDoneBadge}>✓</div>
            <div style={S.splitDoneTitle}>All paid</div>
            <div style={S.splitDoneSub}>
              {splitPayments.length} guest{splitPayments.length > 1 ? "s" : ""} ·{" "}
              {ticketTotal.toFixed(2)}€ total
            </div>
            <div style={S.divider} />
            {splitPayments.map((p) => (
              <div key={p.guestNum} style={S.splitDoneRow}>
                <span style={S.splitDoneGuest}>Guest {p.guestNum}</span>
                <div style={S.splitDoneItems}>
                  {p.items.map((item, idx) => (
                    <span key={idx} style={S.splitDoneItemChip}>
                      {item.name}
                    </span>
                  ))}
                </div>
                <span style={S.splitDoneAmt}>{p.total.toFixed(2)}€</span>
              </div>
            ))}
            <div style={S.divider} />
            <div style={S.splitDoneTotal}>
              <span>Total collected</span>
              <span>
                {splitPayments.reduce((s, p) => s + p.total, 0).toFixed(2)}€
              </span>
            </div>
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
                  {[...paidBills].reverse().map((bill, idx) => (
                    <div key={idx} style={S.billCard}>
                      <div style={S.billCardHeader}>
                        <span style={S.billTableNum}>Table {bill.tableId}</span>
                        <span style={S.billTotal}>{bill.total.toFixed(2)}€</span>
                      </div>
                      <div style={S.billMeta}>
                        {new Date(bill.timestamp).toLocaleString("en-GB")} ·{" "}
                        {bill.paymentMode === "full"
                          ? "Full payment"
                          : bill.paymentMode === "equal"
                          ? `Split ${bill.splitData.guests} ways`
                          : `Split by item (${bill.splitData.payments.length} guests)`}
                      </div>
                      <div style={S.billItemsList}>
                        {bill.items.map((item) => (
                          <div key={item.id} style={S.billItem}>
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
                  ))}
                </div>
              )}

              {/* Total Tab Content */}
              {dailySalesTab === "total" && (() => {
                // Aggregate items across all bills and enrich with category/subcategory info
                const itemsMap = new Map();
                paidBills.forEach((bill) => {
                  bill.items.forEach((item) => {
                    if (!itemsMap.has(item.id)) {
                      // Find item in menu to get category and subcategory
                      let category = null;
                      let subcategory = null;

                      for (const [cat, items] of Object.entries(MENU)) {
                        const found = items.find(i => i.id === item.id);
                        if (found) {
                          category = cat;
                          subcategory = found.subcategory;
                          break;
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
                  const cat = item.category || "Other";
                  const subcat = item.subcategory || "other";

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
                  "Wines 🍾": WINES_SUBCATEGORIES
                };

                return (
                  <div style={S.billsList}>
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
                                    <span style={S.billTotal}>{item.revenue.toFixed(2)}€</span>
                                  </div>
                                  <div style={S.billMeta}>
                                    {item.qty} unit{item.qty > 1 ? "s" : ""} sold · {(item.revenue / item.qty).toFixed(2)}€ each
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
                                  <span style={S.billTotal}>{item.revenue.toFixed(2)}€</span>
                                </div>
                                <div style={S.billMeta}>
                                  {item.qty} unit{item.qty > 1 ? "s" : ""} sold · {(item.revenue / item.qty).toFixed(2)}€ each
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                    })}
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

      {/* ── CUSTOM ITEM MODAL ── */}
      {showCustomModal && (
        <div style={S.modalOverlay}>
          <div style={S.modalCard}>
            <div style={S.modalTitle}>Add Custom Item</div>
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
            <div style={S.modalActions}>
              <button
                style={S.modalCancelBtn}
                onClick={() => setShowCustomModal(false)}
              >
                Cancel
              </button>
              <button
                style={S.modalConfirmBtn}
                onClick={addCustomItem}
              >
                Add to order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CLOSE CONFIRM ── */}
      {view === "close" && closedReceipt && (
        <div style={S.page}>
          <header style={S.header}>
            <button style={S.back} onClick={() => setView("ticket")}>
              ← Back
            </button>
            <span style={S.headerTitle}>
              Close Table {closedReceipt.tableId}
            </span>
            <span />
          </header>
          <div style={S.closeReceipt}>
            <div style={S.closeReceiptTitle}>Receipt Summary</div>
            <div style={S.closeReceiptMeta}>
              {closedReceipt.time.toLocaleString("en-GB")}
            </div>
            <div style={S.divider} />
            {closedReceipt.items.map((o) => (
              <div key={o.id} style={S.closeRow}>
                <span style={S.closeQty}>{o.qty}×</span>
                <span style={S.closeName}>{o.name}</span>
                <span style={S.closeLinePrice}>
                  {(o.price * o.qty).toFixed(2)}€
                </span>
              </div>
            ))}
            <div style={S.divider} />
            {Object.entries(MENU).map(([cat, items]) => {
              const catItems = closedReceipt.items.filter((o) =>
                items.some((i) => i.id === o.id)
              );
              if (catItems.length === 0) return null;
              const catTotal = catItems.reduce(
                (s, o) => s + o.price * o.qty,
                0
              );
              return (
                <div key={cat} style={S.subtotalRow}>
                  <span style={S.subtotalLabel}>{cat}</span>
                  <span>{catTotal.toFixed(2)}€</span>
                </div>
              );
            })}
            <div style={{ ...S.divider, margin: "8px 0 12px" }} />
            <div style={S.closeTotalRow}>
              <span>Total</span>
              <span>{closedReceipt.total.toFixed(2)}€</span>
            </div>
          </div>
          <div style={S.closeWarning}>
            <span style={S.closeWarningIcon}>⚠</span>
            <span>
              This will clear all orders for Table {closedReceipt.tableId}. This
              cannot be undone.
            </span>
          </div>
          <div style={S.ticketActions}>
            <button
              style={S.copyBtn}
              onClick={() => copyTicket(closedReceipt.tableId, closedReceipt.items)}
            >
              Copy receipt
            </button>
            <button style={S.confirmCloseBtn} onClick={confirmClose}>
              Confirm close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
