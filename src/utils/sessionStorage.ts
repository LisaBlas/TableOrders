import type { OrderItem, Batch } from "../types";
import { normalizeMarkedBatchIds, type RawMarkedBatchId } from "./batchMarks";

const SESSION_STORAGE_KEY = "table_sessions_cache";
const DIRTY_SESSION_STORAGE_KEY = "table_sessions_dirty";
const SYNC_META_STORAGE_KEY = "table_sessions_sync_meta";

export interface CachedSession {
  table_id: string;
  seated: boolean;
  gutschein: number | null;
  orders: OrderItem[];
  sent_batches: Batch[];
  marked_batches: string[];
}

export type SessionCache = Record<string, CachedSession>;

export type DirtyOperation = "upsert" | "delete";

export interface DirtySessionRecord {
  table_id: string;
  operation: DirtyOperation;
  base_hash: string | null;
  base_session: CachedSession | null;
  local_session: CachedSession | null;
  last_local_edit_at: string;
  client_id: string;
}

export type DirtySessionRecords = Record<string, DirtySessionRecord>;

export interface SessionSyncMeta {
  base_hashes: Record<string, string>;
  client_id: string;
}

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
    (typeof value.id === "string" || typeof value.id === "number") &&
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

function clientId(): string {
  try {
    const existing = localStorage.getItem("table_orders_client_id");
    if (existing) return existing;
    const next = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("table_orders_client_id", next);
    return next;
  } catch {
    return "unknown-client";
  }
}

function canonicalOrderItem(item: OrderItem) {
  return {
    id: String(item.id),
    name: item.name,
    price: item.price,
    qty: item.qty,
    sentQty: item.sentQty ?? 0,
    category: item.category ?? null,
    subcategory: item.subcategory ?? null,
    baseId: item.baseId ?? null,
    variantType: item.variantType ?? null,
    note: item.note ?? null,
    destination: item.destination ?? null,
    posId: item.posId ?? null,
    posName: item.posName ?? null,
  };
}

function orderKey(item: {
  id: string | number;
  price: number;
  note?: string | null;
  variantType?: string | null;
  destination?: string | null;
}): string {
  return [
    item.id,
    item.note ?? "",
    item.variantType ?? "",
    item.destination ?? "",
    item.price,
  ].join("|");
}

function batchKey(batch: Batch): string {
  return `${batch.id ?? ""}|${batch.timestamp}|${JSON.stringify(
    [...batch.items].map(canonicalOrderItem).sort((a, b) => orderKey(a).localeCompare(orderKey(b)))
  )}`;
}

function canonicalSession(session: CachedSession) {
  return {
    table_id: session.table_id,
    seated: session.seated,
    gutschein: session.gutschein,
    orders: [...session.orders].map(canonicalOrderItem).sort((a, b) => orderKey(a).localeCompare(orderKey(b))),
    sent_batches: [...session.sent_batches]
      .sort((a, b) => batchKey(a).localeCompare(batchKey(b)))
      .map((batch) => ({
        id: batch.id ?? null,
        timestamp: batch.timestamp,
        items: [...batch.items].map(canonicalOrderItem).sort((a, b) => orderKey(a).localeCompare(orderKey(b))),
      })),
    marked_batches: [...session.marked_batches].sort((a, b) => a.localeCompare(b)),
  };
}

export function sessionHash(session: CachedSession | null): string | null {
  if (!session) return null;
  return JSON.stringify(canonicalSession(session));
}

function readSyncMeta(): SessionSyncMeta {
  try {
    const raw = localStorage.getItem(SYNC_META_STORAGE_KEY);
    if (!raw) return { base_hashes: {}, client_id: clientId() };
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.base_hashes)) {
      return { base_hashes: {}, client_id: clientId() };
    }
    const base_hashes: Record<string, string> = {};
    Object.entries(parsed.base_hashes).forEach(([key, value]) => {
      if (typeof value === "string") base_hashes[key] = value;
    });
    return {
      base_hashes,
      client_id: typeof parsed.client_id === "string" ? parsed.client_id : clientId(),
    };
  } catch (e) {
    console.error("Failed to read session sync meta:", e);
    return { base_hashes: {}, client_id: clientId() };
  }
}

function writeSyncMeta(meta: SessionSyncMeta): void {
  try {
    localStorage.setItem(SYNC_META_STORAGE_KEY, JSON.stringify(meta));
  } catch (e) {
    console.error("Failed to write session sync meta:", e);
  }
}

function isDirtySessionRecord(value: unknown): value is DirtySessionRecord {
  return (
    isRecord(value) &&
    typeof value.table_id === "string" &&
    (value.operation === "upsert" || value.operation === "delete") &&
    (value.base_hash === null || typeof value.base_hash === "string") &&
    (value.base_session === null || isCachedSession(value.base_session)) &&
    (value.local_session === null || isCachedSession(value.local_session)) &&
    typeof value.last_local_edit_at === "string" &&
    typeof value.client_id === "string"
  );
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
export function writeSessionToCache(tableId: string, session: CachedSession, updateBase = true): void {
  try {
    const cache = readSessionCache();
    cache[tableId] = session;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cache));
    if (updateBase) {
      const meta = readSyncMeta();
      meta.base_hashes[tableId] = sessionHash(session) ?? "";
      writeSyncMeta(meta);
    }
  } catch (e) {
    console.error("Failed to write session to cache:", e);
  }
}

export function readBaseHash(tableId: string): string | null {
  return readSyncMeta().base_hashes[tableId] ?? null;
}

export function readDirtySessionRecords(): DirtySessionRecords {
  try {
    const raw = localStorage.getItem(DIRTY_SESSION_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      const cache = readSessionCache();
      return Object.fromEntries(
        parsed
          .filter((key): key is string => typeof key === "string")
          .map((key) => {
            const localSession = cache[key] ?? null;
            return [key, {
              table_id: key,
              operation: "upsert" as const,
              base_hash: readBaseHash(key),
              base_session: null,
              local_session: localSession,
              last_local_edit_at: new Date().toISOString(),
              client_id: clientId(),
            }];
          })
      );
    }

    if (!isRecord(parsed)) return {};

    const records: DirtySessionRecords = {};
    Object.entries(parsed).forEach(([tableId, record]) => {
      if (isDirtySessionRecord(record)) {
        records[tableId] = {
          ...record,
          base_session: record.base_session ? normalizeCachedSession(record.base_session) : null,
          local_session: record.local_session ? normalizeCachedSession(record.local_session) : null,
        };
      }
    });
    return records;
  } catch (e) {
    console.error("Failed to read dirty session records:", e);
    return {};
  }
}

function writeDirtySessionRecords(records: DirtySessionRecords): void {
  try {
    if (Object.keys(records).length) {
      localStorage.setItem(DIRTY_SESSION_STORAGE_KEY, JSON.stringify(records));
    } else {
      localStorage.removeItem(DIRTY_SESSION_STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to write dirty session records:", e);
  }
}

export function markSessionDirty(
  tableId: string,
  localSession: CachedSession | null,
  baseSession: CachedSession | null
): void {
  try {
    const records = readDirtySessionRecords();
    const existing = records[tableId];
    const resolvedBase = existing?.base_session ?? baseSession;
    records[tableId] = {
      table_id: tableId,
      operation: "upsert",
      base_hash: existing?.base_hash ?? sessionHash(resolvedBase),
      base_session: resolvedBase,
      local_session: localSession,
      last_local_edit_at: new Date().toISOString(),
      client_id: existing?.client_id ?? clientId(),
    };
    writeDirtySessionRecords(records);
  } catch (e) {
    console.error("Failed to mark session dirty:", e);
  }
}

export function updateDirtyLocalSession(tableId: string, localSession: CachedSession): void {
  const records = readDirtySessionRecords();
  const existing = records[tableId];
  if (!existing || existing.operation === "delete") return;
  records[tableId] = {
    ...existing,
    local_session: localSession,
    last_local_edit_at: new Date().toISOString(),
  };
  writeDirtySessionRecords(records);
}

export function markSessionDeleted(tableId: string, baseSession: CachedSession | null): void {
  const records = readDirtySessionRecords();
  const existing = records[tableId];
  const resolvedBase = existing?.base_session ?? baseSession;
  records[tableId] = {
    table_id: tableId,
    operation: "delete",
    base_hash: existing?.base_hash ?? sessionHash(resolvedBase),
    base_session: resolvedBase,
    local_session: null,
    last_local_edit_at: new Date().toISOString(),
    client_id: existing?.client_id ?? clientId(),
  };
  writeDirtySessionRecords(records);
}

export function clearSessionDirty(tableId: string): void {
  try {
    const records = readDirtySessionRecords();
    delete records[tableId];
    writeDirtySessionRecords(records);
  } catch (e) {
    console.error("Failed to clear dirty session key:", e);
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
    clearSessionDirty(tableId);
    const meta = readSyncMeta();
    delete meta.base_hashes[tableId];
    writeSyncMeta(meta);
  } catch (e) {
    console.error("Failed to remove session from cache:", e);
  }
}

export function removeSessionDataFromCache(tableId: string): void {
  try {
    const cache = readSessionCache();
    delete cache[tableId];
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("Failed to remove session data from cache:", e);
  }
}

/**
 * Clear all sessions from localStorage
 */
export function clearSessionCache(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(DIRTY_SESSION_STORAGE_KEY);
    localStorage.removeItem(SYNC_META_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear session cache:", e);
  }
}
