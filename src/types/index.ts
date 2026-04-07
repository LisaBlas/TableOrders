import type { CSSProperties, ReactNode } from "react";

// ── Table ──

export type TableId = number | string;

export interface TableEntry {
  id: TableId;
  label: string;
  isDivider?: never;
}

export interface TableDivider {
  isDivider: true;
  label: string;
  id?: never;
}

export type TableConfig = TableEntry | TableDivider;

export type TableStatus = "open" | "taken" | "ordered";

export interface StatusConfig {
  label: string;
  dot: string;
  bg: string;
  border: string;
  text: string;
}

// ── Menu ──

export type MenuCategory = "Food" | "Drinks\u{1F377}" | "Bottles \u{1F37E}";

export interface MenuItemVariant {
  type: string;
  price: number;
  label: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price?: number;
  subcategory?: string;
  variants?: MenuItemVariant[];
}

export type MenuData = Record<MenuCategory, MenuItem[]>;

export interface Subcategory {
  id: string;
  label: string;
}

// ── Orders ──

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  sentQty: number;
  category?: MenuCategory;
  subcategory?: string;
  _uid?: string;
  crossed?: boolean;
}

export type Orders = Record<string, OrderItem[]>;

export interface Batch {
  timestamp: string;
  items: OrderItem[];
}

export type SentBatches = Record<string, Batch[]>;

export type Destination = "bar" | "counter" | "kitchen";

// ── Gutschein ──

export type GutscheinAmounts = Record<string, number>;

// ── Bill ──

export interface Bill {
  tableId: TableId;
  items: OrderItem[];
  total: number;
  subtotal?: number;
  gutschein?: number;
  timestamp: string;
  paymentMode: "full" | "equal" | "item";
  splitData?: EqualSplitData | ItemSplitData;
  addedToPOS?: boolean;
}

export interface EqualSplitData {
  guests: number;
}

export interface ItemSplitData {
  payments: SplitPayment[];
}

// ── Split Payment ──

export type SplitMode = "equal" | "item" | null;

export interface ExpandedItem extends OrderItem {
  _uid: string;
  qty: 1;
}

export interface SplitPayment {
  guestNum: number;
  items: OrderItem[];
  total: number;
  amountPaid?: number;
  tip?: number;
}

export interface PaymentInput {
  amount: string;
  confirmed: boolean;
}

// ── Views ──

export type View =
  | "tables"
  | "order"
  | "ticket"
  | "split"
  | "splitConfirm"
  | "splitDone"
  | "dailySales";

export type DailySalesTab = "chronological" | "total";
export type OrderTab = "order" | "bill";

// ── Styles ──

export type StyleMap = Record<string, CSSProperties>;

// ── Component Props ──

export interface ReceiptProps {
  tableId: TableId;
  items: OrderItem[];
  guestNum?: number | null;
  editMode?: boolean;
  gutschein?: number;
  onRemoveItem?: ((id: string) => void) | null;
  onAddItem?: ((id: string) => void) | null;
  onRemoveGutschein?: (() => void) | null;
  skipHeader?: boolean;
}

export interface ModalProps {
  title: string;
  children?: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  confirmStyle?: CSSProperties | null;
  closeOnBackdrop?: boolean;
}
