import type { OrderItem, Batch } from "../types";
import { normalizeMarkedBatchIds, type RawMarkedBatchId } from "./batchMarks";

const SESSION_STORAGE_KEY = "table_sessions_cache";

export interface CachedSession {
  table_id: string;
  seated: boolean;
  gutschein: number | null;
  orders: OrderItem[];
  sent_batches: Batch[];
  marked_batches: string[];
}

export type SessionCache = Record<string, CachedSession>;

interface RawCachedSession extends Omit<CachedSession, "marked_batches"> {
  marked_batches: RawMarkedBatchId[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOrderItem(value: unknown): value is OrderItem {
  if (!isRecord(value)) return false;
  const hasValidSentQty = value.sentQty === undefined ||
    (typeof value.sentQty === "number" && Number.isFinite(value.sentQty));

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    typeof value.qty === "number" &&
    Number.isFinite(value.qty) &&
    hasValidSentQty
  );
}

function isBatch(value: unknown): value is Batch {
  return (
    isRecord(value) &&
    typeof value.timestamp === "string" &&
    Array.isArray(value.items) &&
    value.items.every(isOrderItem)
  );
}

function isCachedSession(value: unknown): value is RawCachedSession {
  if (!isRecord(value)) return false;
  const hasValidGutschein = value.gutschein === null ||
    (typeof value.gutschein === "number" && Number.isFinite(value.gutschein));

  return (
    typeof value.table_id === "string" &&
    typeof value.seated === "boolean" &&
    hasValidGutschein &&
    Array.isArray(value.orders) &&
    value.orders.every(isOrderItem) &&
    Array.isArray(value.sent_batches) &&
    value.sent_batches.every(isBatch) &&
    Array.isArray(value.marked_batches) &&
    value.marked_batches.every((batch) =>
      typeof batch === "string" ||
      (typeof batch === "number" && Number.isInteger(batch))
    )
  );
}

function normalizeOrderItem(item: OrderItem): OrderItem {
  return { ...item, sentQty: item.sentQty ?? 0 };
}

function normalizeCachedSession(session: RawCachedSession): CachedSession {
  return {
    ...session,
    orders: session.orders.map(normalizeOrderItem),
    sent_batches: session.sent_batches.map((batch) => ({
      ...batch,
      items: batch.items.map(normalizeOrderItem),
    })),
    marked_batches: normalizeMarkedBatchIds(session.marked_batches, session.sent_batches),
  };
}

/**
 * Read all table sessions from localStorage
 */
export function readSessionCache(): SessionCache {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      console.warn("Invalid session cache root, ignoring cached sessions");
      return {};
    }

    const cache: SessionCache = {};
    Object.entries(parsed).forEach(([tableId, session]) => {
      if (isCachedSession(session)) {
        cache[tableId] = normalizeCachedSession(session);
      } else {
        console.warn(`Invalid cached session for table ${tableId}, skipping`);
      }
    });
    return cache;
  } catch (e) {
    console.error("Failed to read session cache:", e);
    return {};
  }
}

/**
 * Write a single table session to localStorage
 */
export function writeSessionToCache(tableId: string, session: CachedSession): void {
  try {
    const cache = readSessionCache();
    cache[tableId] = session;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("Failed to write session to cache:", e);
  }
}

/**
 * Remove a table session from localStorage
 */
export function removeSessionFromCache(tableId: string): void {
  try {
    const cache = readSessionCache();
    delete cache[tableId];
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("Failed to remove session from cache:", e);
  }
}

/**
 * Clear all sessions from localStorage
 */
export function clearSessionCache(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear session cache:", e);
  }
}
