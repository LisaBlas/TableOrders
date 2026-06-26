import type { TableConfig, MenuItem, StatusConfig, Subcategory, TableStatus } from "../types";

export const TABLES: TableConfig[] = [];

// Empty fallback — menu is loaded from Directus and cached in localStorage.
// This is only reached on a cold-cache device when Directus is unreachable.
export const MENU: Record<string, MenuItem[]> = {};

export const STATUS_CONFIG: Record<TableStatus, StatusConfig> = {
  open:        { label: "Open",      dot: "var(--c-status-open-dot)",        bg: "var(--c-status-open-bg)",        border: "var(--c-status-open-border)",        text: "var(--c-status-open-text)" },
  seated:      { label: "Seated",    dot: "var(--c-status-seated-dot)",      bg: "var(--c-status-seated-bg)",      border: "var(--c-status-seated-border)",      text: "var(--c-status-seated-text)" },
  unconfirmed: { label: "Ordered",   dot: "var(--c-status-unconfirmed-dot)", bg: "var(--c-status-unconfirmed-bg)", border: "var(--c-status-unconfirmed-border)", text: "var(--c-status-unconfirmed-text)" },
  confirmed:   { label: "Confirmed", dot: "var(--c-status-confirmed-dot)",   bg: "var(--c-status-confirmed-bg)",   border: "var(--c-status-confirmed-border)",   text: "var(--c-status-confirmed-text)" },
};

export const FOOD_SUBCATEGORIES: Subcategory[] = [];
export const DRINKS_SUBCATEGORIES: Subcategory[] = [];
export const BOTTLES_SUBCATEGORIES: Subcategory[] = [];
export const SHOP_SUBCATEGORIES: Subcategory[] = [];

// Populated from Directus (min_qty >= 2); empty until first successful menu load.
export const MIN_QTY_2_IDS: Set<string> = new Set();
