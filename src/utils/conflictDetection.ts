import type { OrderItem, Batch } from "../types";
import type { CachedSession } from "./sessionStorage";
import { batchMarkId } from "./batchMarks";

export interface SessionConflict {
  tableId: string;
  local: CachedSession;
  remote: CachedSession;
}

/**
 * Detect conflicts between local cache and remote sessions
 * A conflict exists when both local and remote have data for the same table
 * and the data differs (different orders, batches, gutschein, or seated status)
 */
export function detectConflicts(
  localCache: Record<string, CachedSession>,
  remoteSessions: Array<{
    id: number;
    table_id: string;
    seated: boolean;
    gutschein: number | null;
    orders: OrderItem[];
    sent_batches: Batch[];
    marked_batches: string[];
  }>
): SessionConflict[] {
  const conflicts: SessionConflict[] = [];
  const remoteMap = new Map(remoteSessions.map((s) => [s.table_id, s]));

  // Check each local session for conflicts
  Object.entries(localCache).forEach(([tableId, localSession]) => {
    const remoteSession = remoteMap.get(tableId);

    if (!remoteSession) {
      // No remote data - no conflict (local is source of truth)
      return;
    }

    // Check if data differs
    if (hasConflict(localSession, remoteSession)) {
      conflicts.push({
        tableId,
        local: localSession,
        remote: {
          table_id: remoteSession.table_id,
          seated: remoteSession.seated,
          gutschein: remoteSession.gutschein,
          orders: remoteSession.orders,
          sent_batches: remoteSession.sent_batches,
          marked_batches: remoteSession.marked_batches,
        },
      });
    }
  });

  return conflicts;
}

function sortedOrders(orders: OrderItem[]) {
  return [...orders].sort((a, b) => orderKey(a).localeCompare(orderKey(b)));
}

function sortedBatches(batches: Batch[]) {
  return [...batches]
    .sort((a, b) => batchKey(a).localeCompare(batchKey(b)))
    .map((b) => ({ ...b, items: sortedOrders(b.items) }));
}

function sortedStrings(values: string[]) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function hasConflict(local: CachedSession, remote: CachedSession): boolean {
  if (local.seated !== remote.seated) return true;
  if (local.gutschein !== remote.gutschein) return true;

  if (JSON.stringify(sortedOrders(local.orders)) !== JSON.stringify(sortedOrders(remote.orders)))
    return true;

  if (JSON.stringify(sortedBatches(local.sent_batches)) !== JSON.stringify(sortedBatches(remote.sent_batches)))
    return true;

  if (JSON.stringify(sortedStrings(local.marked_batches)) !== JSON.stringify(sortedStrings(remote.marked_batches)))
    return true;

  return false;
}

function orderKey(item: OrderItem): string {
  return [
    item.id,
    item.note ?? "",
    item.variantType ?? "",
    item.price,
  ].join("|");
}

function batchKey(batch: Batch): string {
  return `${batch.timestamp}|${JSON.stringify(sortedOrders(batch.items))}`;
}

function mergeMarkedBatches(
  local: CachedSession,
  remote: CachedSession,
  mergedBatches: Batch[]
): string[] {
  const mergedBatchMap = new Map(mergedBatches.map((batch) => [batchKey(batch), batch]));
  const markIds = new Set<string>();

  [local, remote].forEach((session) => {
    session.marked_batches.forEach((markId) => {
      const sourceBatch = session.sent_batches.find((batch) => batchMarkId(batch) === markId);
      if (!sourceBatch) {
        markIds.add(markId);
        return;
      }

      const mergedBatch = mergedBatchMap.get(batchKey(sourceBatch));
      markIds.add(mergedBatch ? batchMarkId(mergedBatch) : markId);
    });
  });

  return Array.from(markIds);
}

function sumBatchSentQty(batches: Batch[]) {
  const counts = new Map<string, number>();

  batches.forEach((batch) => {
    batch.items.forEach((item) => {
      const key = orderKey(item);
      counts.set(key, (counts.get(key) ?? 0) + item.qty);
    });
  });

  return counts;
}

function mergeOrdersWithSentInvariant(
  localOrders: OrderItem[],
  remoteOrders: OrderItem[],
  mergedBatches: Batch[]
): OrderItem[] {
  const orderMap = new Map<string, OrderItem>();
  const unsentCounts = new Map<string, number>();
  const sentCounts = sumBatchSentQty(mergedBatches);

  [...localOrders, ...remoteOrders].forEach((item) => {
    const key = orderKey(item);
    if (!orderMap.has(key)) orderMap.set(key, { ...item });

    const unsentQty = Math.max(0, item.qty - (item.sentQty ?? 0));
    unsentCounts.set(key, (unsentCounts.get(key) ?? 0) + unsentQty);

    const previousSent = sentCounts.get(key) ?? 0;
    sentCounts.set(key, Math.max(previousSent, item.sentQty ?? 0));
  });

  return Array.from(orderMap.entries())
    .map(([key, item]) => {
      const sentQty = sentCounts.get(key) ?? 0;
      const unsentQty = unsentCounts.get(key) ?? 0;
      return {
        ...item,
        sentQty,
        qty: sentQty + unsentQty,
      };
    })
    .filter((item) => item.qty > 0);
}

/**
 * Merge two sessions by combining their data
 * - Merge orders by item key, preserving sentQty <= qty from merged batches
 * - Concat batches chronologically, deduplicated by full batch content
 * - Gutschein: Math.max (preserve whichever device has it set)
 * - Seated = true if either is seated
 * - Merge marked batches (union)
 */
export function mergeSessions(local: CachedSession, remote: CachedSession): CachedSession {
  // Merge batches: deduplicate exact duplicates, then sort chronologically.
  const batchMap = new Map<string, Batch>();
  [...local.sent_batches, ...remote.sent_batches].forEach((b) => {
    const key = batchKey(b);
    if (!batchMap.has(key)) batchMap.set(key, { ...b, items: sortedOrders(b.items) });
  });
  const mergedBatches = Array.from(batchMap.values()).sort(
    (a, b) => batchKey(a).localeCompare(batchKey(b))
  );

  const mergedOrders = mergeOrdersWithSentInvariant(local.orders, remote.orders, mergedBatches);

  const mergedMarkedBatches = mergeMarkedBatches(local, remote, mergedBatches);

  return {
    table_id: local.table_id,
    seated: local.seated || remote.seated,
    gutschein:
      local.gutschein !== null || remote.gutschein !== null
        ? Math.max(local.gutschein ?? 0, remote.gutschein ?? 0)
        : null,
    orders: mergedOrders,
    sent_batches: mergedBatches,
    marked_batches: mergedMarkedBatches,
  };
}
