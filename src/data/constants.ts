import type { TableConfig, MenuItem, StatusConfig, Subcategory, TableStatus } from "../types";

export const TABLES: TableConfig[] = [
  { id: 1, label: "1" },
  { id: 2, label: "2" },
  { id: 3, label: "3" },
  { id: 4, label: "4" },
  { id: "MUT", label: "MUT" },
  { id: 10, label: "10" },
  { id: 11, label: "11" },
  { id: 12, label: "12" },
  { id: 13, label: "13" },
  { id: 14, label: "14" },
  { id: 15, label: "15" },
  { id: "ToGo", label: "To Go" },
  { id: "A", label: "A" },
  { id: "B", label: "B" },
  { id: "C", label: "C" },
  { id: "Left", label: "Left" },
  { id: "Mid", label: "Mid" },
  { id: "Right", label: "Right" },
];

// Empty fallback — menu is loaded from Directus and cached in localStorage.
// This is only reached on a cold-cache device when Directus is unreachable.
export const MENU: Record<string, MenuItem[]> = {};

export const STATUS_CONFIG: Record<TableStatus, StatusConfig> = {
  open:        { label: "Open",      dot: "var(--c-status-open-dot)",        bg: "var(--c-status-open-bg)",        border: "var(--c-status-open-border)",        text: "var(--c-status-open-text)" },
  seated:      { label: "Seated",    dot: "var(--c-status-seated-dot)",      bg: "var(--c-status-seated-bg)",      border: "var(--c-status-seated-border)",      text: "var(--c-status-seated-text)" },
  unconfirmed: { label: "Ordered",   dot: "var(--c-status-unconfirmed-dot)", bg: "var(--c-status-unconfirmed-bg)", border: "var(--c-status-unconfirmed-border)", text: "var(--c-status-unconfirmed-text)" },
  confirmed:   { label: "Confirmed", dot: "var(--c-status-confirmed-dot)",   bg: "var(--c-status-confirmed-bg)",   border: "var(--c-status-confirmed-border)",   text: "var(--c-status-confirmed-text)" },
};

export const FOOD_SUBCATEGORIES: Subcategory[] = [
  { id: "cheese", label: "🧀 Cheese Counter" },
  { id: "salads", label: "🥗 Salads" },
  { id: "warm", label: "🍽️ Warm Dishes" },
  { id: "extras", label: "🥔 Extras" },
  { id: "snacks", label: "🫒 Snacks" },
];

export const DRINKS_SUBCATEGORIES: Subcategory[] = [
  { id: "soft", label: "🥤 Soft" },
  { id: "bier", label: "🍺 Bier" },
  { id: "cocktail", label: "🍸 Cocktail" },
  { id: "schnaps", label: "🥃 Schnaps" },
  { id: "warm", label: "☕ Warm" },
];

export const BOTTLES_SUBCATEGORIES: Subcategory[] = [
  { id: "glass", label: "By the glass" },
  { id: "bottle", label: "Bottle only" },
];

export const SHOP_SUBCATEGORIES: Subcategory[] = [
  { id: "fish", label: "🐟 Fish" },
  { id: "spreads", label: "🍯 Spreads" },
  { id: "snacks", label: "🍪 Snacks" },
  { id: "bottles", label: "🍾 Bottles" },
];

// Populated from Directus (min_qty >= 2); empty until first successful menu load.
export const MIN_QTY_2_IDS: Set<string> = new Set();
