import type { OrderItem, Batch } from "../types";

const SESSION_STORAGE_KEY = "table_sessions_cache";

export interface CachedSession {
  table_id: string;
  seated: boolean;
  gutschein: number | null;
  orders: OrderItem[];
  sent_batches: Batch[];
  marked_batches: number[];
}

export type SessionCache = Record<string, CachedSession>;

/**
 * Read all table sessions from localStorage
 */
export function readSessionCache(): SessionCache {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
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
