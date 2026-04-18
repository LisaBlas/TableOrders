import { useState } from "react";
import { MENU, FOOD_SUBCATEGORIES, DRINKS_SUBCATEGORIES, BOTTLES_SUBCATEGORIES, SHOP_SUBCATEGORIES } from "../data/constants";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useTableOrder } from "../hooks/useTableOrder";
import { groupBy } from "../utils/helpers";
import { S } from "../styles/appStyles";
import { Modal } from "../components/Modal";
import { MenuItemCard } from "../components/MenuItemCard";
import { VariantBottomSheet } from "../components/VariantBottomSheet";
import { NoteBottomSheet } from "../components/NoteBottomSheet";
import { OrderBar } from "../components/OrderBar";
import { BillView } from "../components/BillView";
import { BackIcon, BillIcon } from "../components/icons";
import type { MenuCategory, MenuItem, MenuItemVariant } from "../types";

export function OrderView() {
  const app = useApp();
  const table = useTable();
  const tableId = app.activeTable!;
  const { unsent, sent, unsentTotal, batches } = useTableOrder(tableId);

  // Local UI state
  const [activeCategory, setActiveCategory] = useState<string>("Food");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFoodSubcategory, setSelectedFoodSubcategory] = useState<string | null>(null);
  const [selectedDrinksSubcategory, setSelectedDrinksSubcategory] = useState<string | null>(null);
  const [selectedBottlesSubcategory, setSelectedBottlesSubcategory] = useState<string | null>(null);
  const [selectedShopSubcategory, setSelectedShopSubcategory] = useState<string | null>(null);
  const [orderBarExpanded, setOrderBarExpanded] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [userViewPreference, setUserViewPreference] = useState<'order' | 'bill' | null>(null);
  const [showVariantSheet, setShowVariantSheet] = useState(false);
  const [selectedItemForVariant, setSelectedItemForVariant] = useState<MenuItem | null>(null);
  const [showNoteSheet, setShowNoteSheet] = useState(false);
  const [noteSheetItem, setNoteSheetItem] = useState<MenuItem | null>(null);
  const [noteText, setNoteText] = useState("");

  // Only show bill view if user explicitly chose it (don't auto-switch)
  const showBillView = userViewPreference === 'bill';

  // Clear subcategories when searching
  if (searchQuery) {
    if (selectedFoodSubcategory) setSelectedFoodSubcategory(null);
    if (selectedDrinksSubcategory) setSelectedDrinksSubcategory(null);
    if (selectedBottlesSubcategory) setSelectedBottlesSubcategory(null);
    if (selectedShopSubcategory) setSelectedShopSubcategory(null);
  }

  const handleAddItem = (item: MenuItem, variant: MenuItemVariant | null = null, note?: string) => {
    table.addItem(tableId, item, variant, activeCategory as MenuCategory, note);
  };

  const handleCardTap = (item: MenuItem) => {
    if (item.variants && item.variants.length > 0) {
      // Tap: add the default "large" (0,2L) variant directly
      const defaultVariant = item.variants.find((v) => v.type === "large") ?? item.variants[0];
      handleAddItem(item, defaultVariant);
    } else {
      handleAddItem(item, null);
    }
  };

  const handleCardLongPress = (item: MenuItem) => {
    if (item.variants && item.variants.length > 0) {
      setSelectedItemForVariant(item);
      setShowVariantSheet(true);
    } else {
      setNoteSheetItem(item);
      setNoteText("");
      setShowNoteSheet(true);
    }
  };

  const handleSelectVariant = (variant: MenuItemVariant) => {
    if (selectedItemForVariant) {
      handleAddItem(selectedItemForVariant, variant);
    }
  };

  const addCustomItem = () => {
    const name = customName.trim();
    const price = parseFloat(customPrice.replace(",", "."));
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
    if (activeCategory === "Drinks") return selectedDrinksSubcategory;
    if (activeCategory === "Wines") return selectedBottlesSubcategory;
    if (activeCategory === "Shop") return selectedShopSubcategory;
    return null;
  };

  const clearAllSubcategories = () => {
    setSelectedFoodSubcategory(null);
    setSelectedDrinksSubcategory(null);
    setSelectedBottlesSubcategory(null);
    setSelectedShopSubcategory(null);
  };

  const setSubcategoryForCategory = (sub: string) => {
    if (activeCategory === "Food") setSelectedFoodSubcategory(sub);
    else if (activeCategory === "Drinks") setSelectedDrinksSubcategory(sub);
    else if (activeCategory === "Wines") setSelectedBottlesSubcategory(sub);
    else if (activeCategory === "Shop") setSelectedShopSubcategory(sub);
  };

  const getSubcategoryConfig = () => {
    if (activeCategory === "Food") return FOOD_SUBCATEGORIES;
    if (activeCategory === "Drinks") return DRINKS_SUBCATEGORIES;
    if (activeCategory === "Wines") return BOTTLES_SUBCATEGORIES;
    if (activeCategory === "Shop") return SHOP_SUBCATEGORIES;
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
          if (item.name.toLowerCase().includes(query) || (item.shortName && item.shortName.toLowerCase().includes(query))) {
            results.push({ ...item, category });
          }
        });
      });
      return results;
    }

    // Special handling for Bottles category: wines with glass sizes first, then static bottles
    if (activeCategory === "Wines") {
      const winesWithGlasses = (MENU as any)["Drinks"]
        ?.filter((item: any) => item.variants?.some((v: any) => v.bottleSubcategory))
        .map((item: any) => ({
          ...item,
          category: "Wines",
          subcategory: "glass",
          wineType: item.variants.find((v: any) => v.bottleSubcategory)?.bottleSubcategory,
        })) || [];

      const staticBottles = (MENU as any)["Wines"]?.map((item: any) => ({
        ...item,
        category: "Wines",
        subcategory: "bottle",
        wineType: item.subcategory,
      })) || [];

      return [...winesWithGlasses, ...staticBottles];
    }

    // Special handling for Drinks category: exclude wines entirely, hide bottle variants on others
    if (activeCategory === "Drinks") {
      let items = (MENU as any)["Drinks"]?.map((item: any) => {
        // Exclude wine items — they now live in the Bottles tab
        if (item.subcategory === "wine") return null;
        // If item has variants, filter out bottle variants
        if (item.variants) {
          const filteredVariants = item.variants.filter((v: any) => !v.bottleSubcategory);
          // Only include item if it has non-bottle variants
          if (filteredVariants.length > 0) {
            return {
              ...item,
              category: "Drinks",
              variants: filteredVariants
            };
          }
          return null;
        }
        // Regular items without variants
        return { ...item, category: "Drinks" };
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

  const renderMenuGrid = () => {
    const filteredItems = getFilteredItems();

    if (filteredItems.length === 0) {
      return (
        <div style={S.noResults}>
          <span style={S.noResultsText}>No items found for "{searchQuery}"</span>
        </div>
      );
    }

    // Group by subcategory and render with dividers
    const grouped = groupBy(filteredItems, "subcategory");

    return (
      <div style={S.grid4}>
        {Object.entries(grouped).map(([subcategoryId, items]: [string, any]) => {
          // Find subcategory label
          const subcategoryObj = subcategoryConfig.find((s: any) => s.id === subcategoryId);
          const subcategoryLabel = subcategoryObj?.label || subcategoryId;

          return (
            <div key={subcategoryId} style={{ gridColumn: "1 / -1", display: "contents" }}>
              {subcategoryConfig.length > 0 && <div style={S.subcategoryDivider}>{subcategoryLabel}</div>}
              {items.map((item: any) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  unsent={unsent}
                  showCategory={!!searchQuery}
                  onTap={handleCardTap}
                  onLongPress={handleCardLongPress}
                />
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  // Show BillView if active
  if (showBillView) {
    return <BillView tableId={tableId} sent={sent} onClose={() => setUserViewPreference('order')} />;
  }

  return (
    <div style={{ ...S.page, height: "100vh", overflow: "hidden" }}>
      <header style={S.header}>
        <button style={S.back} onClick={() => app.setView("tables")}>
          <BackIcon size={22} />
        </button>
        <span style={S.headerTitle}>Table {tableId}</span>
        <button style={S.ticketBtn} onClick={() => setUserViewPreference('bill')}>
          <BillIcon size={22} />
        </button>
      </header>

      {/* Category Tabs */}
      <div style={S.tabs}>
        <div style={S.tabsContainer}>
          {Object.keys(MENU).map((category, idx) => (
            <button
              key={category}
              style={{ ...S.tab, ...(activeCategory === category ? S.tabActive : {}) }}
              onClick={() => { setActiveCategory(category); clearAllSubcategories(); }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

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

      <div style={{ ...S.orderContent, paddingBottom: (unsent.length > 0 || batches.length > 0) ? 180 : 36 }}>
        {renderMenuGrid()}
      </div>

      {(unsent.length > 0 || batches.length > 0) && (
        <OrderBar
          tableId={tableId}
          unsent={unsent}
          batches={batches}
          expanded={orderBarExpanded}
          onToggleExpand={() => setOrderBarExpanded(!orderBarExpanded)}
          onAddItem={handleAddItem}
          onSendOrder={() => setOrderBarExpanded(true)}
        />
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
                <input type="text" inputMode="decimal" placeholder="0.00" value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)} style={S.customModalInput} />
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

      {/* Variant Bottom Sheet */}
      {showVariantSheet && selectedItemForVariant && (
        <VariantBottomSheet
          item={selectedItemForVariant}
          unsent={unsent}
          onSelectVariant={handleSelectVariant}
          onClose={() => {
            setShowVariantSheet(false);
            setSelectedItemForVariant(null);
          }}
          variants={selectedItemForVariant.variants!}
        />
      )}

      {/* Note Bottom Sheet */}
      {showNoteSheet && noteSheetItem && (
        <NoteBottomSheet
          item={noteSheetItem}
          note={noteText}
          onNoteChange={setNoteText}
          onConfirm={() => {
            const trimmed = noteText.trim();
            if (trimmed) handleAddItem(noteSheetItem, null, trimmed);
            else handleAddItem(noteSheetItem, null);
            setShowNoteSheet(false);
            setNoteSheetItem(null);
            setNoteText("");
          }}
          onClose={() => {
            setShowNoteSheet(false);
            setNoteSheetItem(null);
            setNoteText("");
          }}
        />
      )}
    </div>
  );
}
