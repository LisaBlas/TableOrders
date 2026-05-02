import { useState, useRef } from "react";
import { useMenu } from "../contexts/MenuContext";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useTableOrder } from "../hooks/useTableOrder";
import { useMenuItems } from "../hooks/useMenuItems";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { FOOD_SUBCATEGORIES, DRINKS_SUBCATEGORIES, BOTTLES_SUBCATEGORIES, SHOP_SUBCATEGORIES } from "../data/constants";
import { S } from "../styles/appStyles";
import { MenuGrid } from "../components/MenuGrid";
import { VariantBottomSheet } from "../components/VariantBottomSheet";
import { NoteBottomSheet } from "../components/NoteBottomSheet";
import { OrderBar } from "../components/OrderBar";
import { BillView } from "../components/BillView";
import { CustomItemModal } from "../components/CustomItemModal";
import { BackIcon, BillIcon } from "../components/icons";
import type { MenuCategory, MenuItem, MenuItemVariant } from "../types";

export function OrderView() {
  const app = useApp();
  const table = useTable();
  const { menu: MENU } = useMenu();
  const { isTablet, isTabletLandscape, isDesktop } = useBreakpoint();
  const tableId = app.activeTable!;
  const { unsent, sent, batches } = useTableOrder(tableId);

  // Local UI state
  const [activeCategory, setActiveCategory] = useState<string>("Food");
  const [searchQuery, setSearchQuery] = useState("");
  const SUBCATEGORY_CONFIG: Record<string, typeof FOOD_SUBCATEGORIES> = {
    Food: FOOD_SUBCATEGORIES, Drinks: DRINKS_SUBCATEGORIES, Wines: BOTTLES_SUBCATEGORIES, Shop: SHOP_SUBCATEGORIES,
  };
  const subcategoryConfig = SUBCATEGORY_CONFIG[activeCategory] ?? [];
  const [orderBarExpanded, setOrderBarExpanded] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showVariantSheet, setShowVariantSheet] = useState(false);
  const [selectedItemForVariant, setSelectedItemForVariant] = useState<MenuItem | null>(null);
  const [showNoteSheet, setShowNoteSheet] = useState(false);
  const [noteSheetItem, setNoteSheetItem] = useState<MenuItem | null>(null);
  const [noteText, setNoteText] = useState("");

  // Only show bill view if user explicitly chose it (don't auto-switch)
  const showBillView = app.orderViewTab === 'bill';

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

  const handleSelectVariant = (variant: MenuItemVariant, note?: string) => {
    handleAddItem(selectedItemForVariant!, variant, note);
  };

  // Get filtered menu items via hook
  const filteredItems = useMenuItems({ activeCategory, searchQuery });

  // Per-category items for sliding panes (categories are fixed for this restaurant)
  const foodItems = useMenuItems({ activeCategory: "Food", searchQuery: "" });
  const drinksItems = useMenuItems({ activeCategory: "Drinks", searchQuery: "" });
  const winesItems = useMenuItems({ activeCategory: "Wines", searchQuery: "" });
  const shopItems = useMenuItems({ activeCategory: "Shop", searchQuery: "" });
  const categoryItems: Record<string, ReturnType<typeof useMenuItems>> = {
    Food: foodItems, Drinks: drinksItems, Wines: winesItems, Shop: shopItems,
  };

  const categories = Object.keys(MENU);
  const catIndex = categories.indexOf(activeCategory);
  const paneWidthPct = 100 / categories.length;

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && catIndex < categories.length - 1) setActiveCategory(categories[catIndex + 1]);
    else if (dx > 0 && catIndex > 0) setActiveCategory(categories[catIndex - 1]);
  };

  // Show BillView if active
  if (showBillView) {
    return <BillView tableId={tableId} sent={sent} onClose={() => app.setOrderViewTab('order')} />;
  }

  // Responsive styles
  const headerStyle = isTablet || isTabletLandscape || isDesktop ? S.headerTablet : S.header;

  return (
    <div style={{ ...S.page, height: "100vh", overflow: "hidden" }}>
      <header style={headerStyle}>
        <button style={S.back} onClick={() => {
          app.setOrderViewTab(null);
          app.setView("tables");
        }}>
          <BackIcon size={22} />
        </button>
        <span style={S.headerTitle}>Table {table.resolveTableDisplayId(tableId)}</span>
        <button style={S.ticketBtn} onClick={() => app.setOrderViewTab('bill')}>
          <BillIcon size={22} />
        </button>
      </header>

      {/* Category Tabs */}
      <div style={S.tabs}>
        <div style={S.tabsContainer}>
          {Object.keys(MENU).map((category) => (
            <button
              key={category}
              style={{ ...S.tab, ...(activeCategory === category ? S.tabActive : {}) }}
              onClick={() => setActiveCategory(category)}
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

      {searchQuery ? (
        <div style={{ ...S.orderContent, paddingBottom: (unsent.length > 0 || batches.length > 0) ? 180 : 36 }}>
          <MenuGrid
            filteredItems={filteredItems}
            subcategoryConfig={subcategoryConfig}
            searchQuery={searchQuery}
            unsent={unsent}
            onTap={handleCardTap}
            onLongPress={handleCardLongPress}
          />
        </div>
      ) : (
        <div
          style={{ flex: 1, overflow: "hidden", minHeight: 0, touchAction: "pan-y" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div style={{
            display: "flex",
            width: `${categories.length * 100}%`,
            height: "100%",
            transform: `translateX(${-catIndex * paneWidthPct}%)`,
            transition: "transform 0.3s ease-out",
          }}>
            {categories.map((cat) => (
              <div
                key={cat}
                style={{
                  ...S.orderContent,
                  width: `${paneWidthPct}%`,
                  height: "100%",
                  flex: "none",
                  paddingBottom: (unsent.length > 0 || batches.length > 0) ? 180 : 36,
                }}
              >
                <MenuGrid
                  filteredItems={categoryItems[cat] ?? []}
                  subcategoryConfig={SUBCATEGORY_CONFIG[cat] ?? []}
                  searchQuery=""
                  unsent={unsent}
                  onTap={handleCardTap}
                  onLongPress={handleCardLongPress}
                />
              </div>
            ))}
          </div>
        </div>
      )}

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
        <CustomItemModal tableId={tableId} onClose={() => setShowCustomModal(false)} />
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
