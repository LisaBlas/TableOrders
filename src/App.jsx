import { useState, useEffect } from "react";
import { TABLES, MENU, STATUS_CONFIG, FOOD_SUBCATEGORIES, DRINKS_SUBCATEGORIES, BOTTLES_SUBCATEGORIES } from "./data/constants";
import { getTableStatus, copyToClipboard, formatOrderText, consolidateItems, getItemDestination } from "./utils/helpers";
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
  const [activeTab, setActiveTab] = useState("order"); // "order" or "bill"
  const [searchQuery, setSearchQuery] = useState("");
  const [seatConfirmTable, setSeatConfirmTable] = useState(null);
  const [dailySalesTab, setDailySalesTab] = useState("chronological");
  const [editingBillIndex, setEditingBillIndex] = useState(null);
  const [billSnapshot, setBillSnapshot] = useState(null);
  const [deletingBillIndex, setDeletingBillIndex] = useState(null);
  const [confirmingClose, setConfirmingClose] = useState(false);

  // Track sent batches (each send creates a new batch with timestamp)
  const [sentBatches, setSentBatches] = useState({});

  // Custom item state
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [showCustomModal, setShowCustomModal] = useState(false);

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
    // Land on Bill tab if table has orders, Order tab if empty
    const hasOrders = orders[tableId] && orders[tableId].length > 0;
    setActiveTab(hasOrders ? "bill" : "order");
    setSearchQuery("");
    setCustomName("");
    setCustomPrice("");
    setCustomQty("1");
    setConfirmingClose(false);
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
        return {
          ...prev,
          [activeTable]: current.map((o) =>
            o.id === orderItem.id ? { ...o, qty: o.qty + 1 } : o
          ),
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

  const sendOrder = () => {
    const current = orders[activeTable] || [];
    const unsent = current.filter((o) => (o.qty - (o.sentQty || 0)) > 0);
    if (unsent.length === 0) return;

    const text = formatOrderText(activeTable, current);
    copyToClipboard(text);

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

    showToast("Order sent & copied!");
  };

  const openTicket = (tableId) => {
    setTicketTable(tableId);
    setView("ticket");
  };

  const confirmClose = (tableId) => {
    const items = orders[tableId] || [];
    const total = items.reduce((s, o) => s + o.price * o.qty, 0);

    // Save bill to paid bills
    setPaidBills((prev) => [
      ...prev,
      {
        tableId,
        items,
        total,
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
    showToast(`Table ${tableId} closed ✓`);
    setConfirmingClose(false);
    setView("tables");
    setTicketTable(null);
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

  const ticketItems = orders[ticketTable] || [];
  const ticketTotal = ticketItems.reduce((s, o) => s + o.price * o.qty, 0);

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
                  else if (activeCategory === "Bottles 🍾") subcategoryConfig = BOTTLES_SUBCATEGORIES;

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
                            // Check if item has variants
                            if (item.variants) {
                              return (
                                <div key={item.id} style={S.menuItem}>
                                  <div style={S.menuItemInfo}>
                                    <span style={S.menuItemName}>{item.name}</span>
                                  </div>
                                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                    {item.variants.map((variant) => (
                                      <button
                                        key={variant.type}
                                        style={S.variantBtn}
                                        onClick={() => addItem(item, variant)}
                                      >
                                        <span style={S.variantLabel}>{variant.label}</span>
                                        <span style={S.variantPrice}>
                                          {variant.price.toFixed(2)}€
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            // Standard item without variants
                            return (
                              <div key={item.id} style={S.menuItem}>
                                <div style={S.menuItemInfo}>
                                  <span style={S.menuItemName}>{item.name}</span>
                                  <span style={S.menuItemPrice}>
                                    {item.price.toFixed(2)}€
                                  </span>
                                </div>
                                <button style={S.addBtn} onClick={() => addItem(item)}>
                                  Add
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
                              {item.variants.map((variant) => (
                                <button
                                  key={variant.type}
                                  style={S.variantBtn}
                                  onClick={() => addItem(item, variant)}
                                >
                                  <span style={S.variantLabel}>{variant.label}</span>
                                  <span style={S.variantPrice}>
                                    {variant.price.toFixed(2)}€
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      // Standard item without variants
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
                          <button style={S.addBtn} onClick={() => addItem(item)}>
                            Add
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
                  <div style={S.orderBarList}>
                    {unsentItems.slice().reverse().map((o) => (
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
                <div style={S.divider} />
                {consolidateItems(currentOrder).map((o) => (
                  <div key={o.id} style={S.closeRowEditable}>
                    <button
                      style={S.closeRemoveBtn}
                      onClick={() => removeItemFromBill(o.id)}
                      title="Remove one"
                    >
                      −
                    </button>
                    <span style={S.closeQty}>{o.qty}×</span>
                    <span style={S.closeName}>{o.name}</span>
                    <span style={S.closeLinePrice}>
                      {(o.price * o.qty).toFixed(2)}€
                    </span>
                  </div>
                ))}
                <div style={S.perforationDivider} />
                <div style={S.closeTotalRow}>
                  <span>Total</span>
                  <span>{currentOrder.reduce((s, o) => s + o.price * o.qty, 0).toFixed(2)}€</span>
                </div>
              </div>

              <div style={S.ticketActions}>
                {!confirmingClose ? (
                  <button style={S.closeBtn} onClick={() => setConfirmingClose(true)}>
                    Close table
                  </button>
                ) : (
                  <button style={S.confirmCloseBtn} onClick={() => confirmClose(activeTable)}>
                    Confirm close
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
            <button style={S.back} onClick={() => {
              setView("tables");
              setConfirmingClose(false);
            }}>
              ← Back
            </button>
            <span style={S.headerTitle}>Table {ticketTable} — Bill</span>
            <span />
          </header>
          <div style={S.ticket}>
            <div style={S.closeReceiptBrand}>Käserei Camidi</div>
            <div style={S.closeReceiptMeta}>
              Table {ticketTable} · {new Date().toLocaleString("en-GB", {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div style={S.divider} />
            {consolidateItems(ticketItems).map((o) => (
              <div key={o.id} style={S.closeRow}>
                <span style={S.closeQty}>{o.qty}×</span>
                <span style={S.closeName}>{o.name}</span>
                <span style={S.closeLinePrice}>
                  {(o.price * o.qty).toFixed(2)}€
                </span>
              </div>
            ))}
            <div style={S.perforationDivider} />
            <div style={S.closeTotalRow}>
              <span>Total</span>
              <span>{ticketTotal.toFixed(2)}€</span>
            </div>
          </div>

          <div style={S.ticketActions}>
            {!confirmingClose ? (
              <button style={S.closeBtn} onClick={() => setConfirmingClose(true)}>
                Close table
              </button>
            ) : (
              <button style={S.confirmCloseBtn} onClick={() => confirmClose(ticketTable)}>
                Confirm close
              </button>
            )}
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
                            ? "Full payment"
                            : bill.paymentMode === "equal"
                            ? `Split ${bill.splitData.guests} ways`
                            : `Split by item (${bill.splitData.payments.length} guests)`}
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
                                    <span style={S.billTotal}>{item.qty} unit{item.qty > 1 ? "s" : ""}</span>
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
                                  <span style={S.billTotal}>{item.qty} unit{item.qty > 1 ? "s" : ""}</span>
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
                                <span style={S.billTotal}>{item.qty} unit{item.qty > 1 ? "s" : ""}</span>
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
        <div style={S.modalOverlay} onClick={cancelDeleteBill}>
          <div style={S.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>Delete Bill?</div>
            <div style={S.modalMessage}>
              Are you sure? This action cannot be undone.
            </div>
            <div style={S.modalActions}>
              <button style={S.modalCancelBtn} onClick={cancelDeleteBill}>
                Cancel
              </button>
              <button style={S.modalDeleteBtn} onClick={confirmDeleteBill}>
                Delete
              </button>
            </div>
          </div>
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

    </div>
  );
}
