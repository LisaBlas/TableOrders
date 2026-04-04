import { useState } from "react";
import { MENU, FOOD_SUBCATEGORIES, DRINKS_SUBCATEGORIES, BOTTLES_SUBCATEGORIES } from "../data/constants";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useTableOrder } from "../hooks/useTableOrder";
import { S } from "../styles/appStyles";
import { Modal } from "../components/Modal";
import { MenuItemRow } from "../components/MenuItemRow";
import { SentBatchCard } from "../components/SentBatchCard";
import { OrderBar } from "../components/OrderBar";
import { BillTab } from "../components/BillTab";
import type { MenuCategory } from "../types";

export function OrderView() {
  const app = useApp();
  const table = useTable();
  const tableId = app.activeTable!;
  const { unsent, sent, unsentTotal, batches } = useTableOrder(tableId);

  // Local UI state
  const [activeTab, setActiveTab] = useState<"order" | "bill">(() => {
    const hasSent = table.orders[tableId]?.some((o: any) => (o.sentQty || 0) > 0);
    return hasSent ? "bill" : "order";
  });
  const [activeCategory, setActiveCategory] = useState<string>("Food");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFoodSubcategory, setSelectedFoodSubcategory] = useState<string | null>(null);
  const [selectedDrinksSubcategory, setSelectedDrinksSubcategory] = useState<string | null>(null);
  const [selectedBottlesSubcategory, setSelectedBottlesSubcategory] = useState<string | null>(null);
  const [orderBarExpanded, setOrderBarExpanded] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQty, setCustomQty] = useState("1");

  // Clear subcategories when searching
  if (searchQuery) {
    if (selectedFoodSubcategory) setSelectedFoodSubcategory(null);
    if (selectedDrinksSubcategory) setSelectedDrinksSubcategory(null);
    if (selectedBottlesSubcategory) setSelectedBottlesSubcategory(null);
  }

  const handleAddItem = (item: any, variant: any = null) => {
    table.addItem(tableId, item, variant, activeCategory as MenuCategory);
  };

  const addCustomItem = () => {
    const name = customName.trim();
    const price = parseFloat(customPrice);
    const qty = parseInt(customQty);
    if (!name) { app.showToast("⚠ Item name required"); return; }
    if (isNaN(price) || price <= 0) { app.showToast("⚠ Valid price required"); return; }
    if (isNaN(qty) || qty < 1) { app.showToast("⚠ Valid quantity required"); return; }

    const customItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name, price, qty: 0, sentQty: 0,
    };
    table.setOrders((prev) => {
      const current = prev[tableId] || [];
      return { ...prev, [tableId]: [...current, { ...customItem, qty, sentQty: 0 }] };
    });
    app.showToast(`+ ${name} (${qty}×)`);
    setCustomName(""); setCustomPrice(""); setCustomQty("1"); setShowCustomModal(false);
  };

  // Subcategory helpers
  const getSelectedSubcategory = () => {
    if (activeCategory === "Food") return selectedFoodSubcategory;
    if (activeCategory === "Drinks🍷") return selectedDrinksSubcategory;
    if (activeCategory === "Bottles 🍾") return selectedBottlesSubcategory;
    return null;
  };

  const clearAllSubcategories = () => {
    setSelectedFoodSubcategory(null);
    setSelectedDrinksSubcategory(null);
    setSelectedBottlesSubcategory(null);
  };

  const setSubcategoryForCategory = (sub: string) => {
    if (activeCategory === "Food") setSelectedFoodSubcategory(sub);
    else if (activeCategory === "Drinks🍷") setSelectedDrinksSubcategory(sub);
    else if (activeCategory === "Bottles 🍾") setSelectedBottlesSubcategory(sub);
  };

  const getSubcategoryConfig = () => {
    if (activeCategory === "Food") return FOOD_SUBCATEGORIES;
    if (activeCategory === "Drinks🍷") return DRINKS_SUBCATEGORIES;
    if (activeCategory === "Bottles 🍾") return BOTTLES_SUBCATEGORIES;
    return [];
  };

  const selectedSubcategory = getSelectedSubcategory();
  const subcategoryConfig = getSubcategoryConfig();

  // Filter menu items
  const getFilteredItems = () => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const results: any[] = [];
      Object.entries(MENU).forEach(([category, items]: [string, any[]]) => {
        items.forEach((item: any) => {
          if (item.name.toLowerCase().includes(query)) {
            results.push({ ...item, category });
          }
        });
      });
      return results;
    }

    // Special handling for Bottles category: merge static bottles + drinks with bottle variants
    if (activeCategory === "Bottles 🍾") {
      const staticBottles = (MENU as any)["Bottles 🍾"]?.map((item: any) => ({
        ...item,
        category: "Bottles 🍾"
      })) || [];

      const drinksWithBottles = (MENU as any)["Drinks🍷"]
        ?.filter((item: any) => item.variants?.some((v: any) => v.bottleSubcategory))
        .map((item: any) => ({
          ...item,
          category: "Bottles 🍾",
          // Filter variants to show only bottle variants, and map subcategory
          variants: item.variants
            .filter((v: any) => v.bottleSubcategory)
            .map((v: any) => ({ ...v, subcategory: v.bottleSubcategory })),
          // Use bottle subcategory for filtering
          subcategory: item.variants.find((v: any) => v.bottleSubcategory)?.bottleSubcategory
        })) || [];

      let items = [...staticBottles, ...drinksWithBottles];

      if (selectedSubcategory) {
        items = items.filter((item: any) => item.subcategory === selectedSubcategory);
      }

      return items;
    }

    // Special handling for Drinks category: hide bottle variants
    if (activeCategory === "Drinks🍷") {
      let items = (MENU as any)["Drinks🍷"]?.map((item: any) => {
        // If item has variants, filter out bottle variants
        if (item.variants) {
          const filteredVariants = item.variants.filter((v: any) => !v.bottleSubcategory);
          // Only include item if it has non-bottle variants
          if (filteredVariants.length > 0) {
            return {
              ...item,
              category: "Drinks🍷",
              variants: filteredVariants
            };
          }
          return null; // Exclude items with only bottle variants
        }
        // Regular items without variants
        return { ...item, category: "Drinks🍷" };
      }).filter(Boolean) || [];

      if (selectedSubcategory) {
        items = items.filter((item: any) => item.subcategory === selectedSubcategory);
      }

      return items;
    }

    // Default category handling (Food, etc.)
    let items = (MENU as any)[activeCategory]?.map((item: any) => ({ ...item, category: activeCategory })) || [];
    if (selectedSubcategory) {
      items = items.filter((item: any) => item.subcategory === selectedSubcategory);
    }
    return items;
  };

  const renderMenuContent = () => {
    // Show subcategory tiles when no subcategory selected
    if (!searchQuery && !selectedSubcategory && subcategoryConfig.length > 0) {
      return (
        <div style={S.subcategoryGrid}>
          {subcategoryConfig.map(({ id, label }: any) => (
            <button key={id} style={S.subcategoryTile} onClick={() => setSubcategoryForCategory(id)}>
              <div style={S.subcategoryTileEmoji}>{label.split(" ")[0]}</div>
              <div>{label.substring(label.indexOf(" ") + 1)}</div>
            </button>
          ))}
        </div>
      );
    }

    const filteredItems = getFilteredItems();

    if (filteredItems.length === 0) {
      return (
        <div style={S.noResults}>
          <span style={S.noResultsText}>No items found for "{searchQuery}"</span>
        </div>
      );
    }

    return filteredItems.map((item: any) => (
      <MenuItemRow key={item.id} item={item} unsent={unsent} showCategory={!!searchQuery} onAddItem={handleAddItem} />
    ));
  };

  return (
    <div style={S.page}>
      <header style={S.header}>
        <button style={S.back} onClick={() => app.setView("tables")}>
          ← Back
        </button>
        <span style={S.headerTitle}>Table {tableId}</span>
        <span />
      </header>

      {/* Tabs */}
      <div style={S.tabs}>
        <div style={S.tabsContainer}>
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
          <div style={{
            ...S.tabIndicator,
            transform: activeTab === "bill" ? "translateX(100%)" : "translateX(0)",
          }} />
        </div>
      </div>

      {/* ORDER TAB */}
      {activeTab === "order" && (
        <>
          <div style={S.searchBar}>
            <button style={S.customAddBtn} onClick={() => setShowCustomModal(true)} title="Add custom item">+</button>
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={S.searchInputWithBtn}
            />
            {searchQuery && (
              <button style={S.searchClear} onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>

          {!searchQuery && (
            <div style={S.cats}>
              {Object.keys(MENU).map((cat) => (
                <button
                  key={cat}
                  style={{ ...S.catBtn, ...(activeCategory === cat ? S.catBtnActive : {}) }}
                  onClick={() => { setActiveCategory(cat); clearAllSubcategories(); }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {!searchQuery && selectedSubcategory && (
            <div style={{ padding: "12px 16px", background: "#fff", borderBottom: "1px solid #ebe9e3" }}>
              <button style={S.back} onClick={clearAllSubcategories}>← Back to categories</button>
            </div>
          )}

          <div style={S.orderContent}>
            <div style={S.menuList}>{renderMenuContent()}</div>
            <SentBatchCard batches={batches} />
          </div>

          {unsent.length > 0 && (
            <OrderBar
              tableId={tableId}
              unsent={unsent}
              unsentTotal={unsentTotal}
              expanded={orderBarExpanded}
              onToggleExpand={() => setOrderBarExpanded(!orderBarExpanded)}
              onAddItem={handleAddItem}
            />
          )}
        </>
      )}

      {/* BILL TAB */}
      {activeTab === "bill" && (
        <BillTab tableId={tableId} sent={sent} />
      )}

      {/* Custom Item Modal */}
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
              <input type="text" placeholder="e.g., Special request" value={customName}
                onChange={(e) => setCustomName(e.target.value)} style={S.customModalInput} autoFocus />
            </div>
            <div style={S.customModalRow}>
              <div style={S.customModalField}>
                <label style={S.customModalLabel}>Price (€)</label>
                <input type="number" placeholder="0.00" value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)} step="0.01" min="0" style={S.customModalInput} />
              </div>
              <div style={S.customModalFieldSmall}>
                <label style={S.customModalLabel}>Quantity</label>
                <input type="number" placeholder="1" value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)} min="1" style={S.customModalInput} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
