import type { OrderItem, Batch } from "../types";
import type { CachedSession } from "./sessionStorage";

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
    marked_batches: number[];
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
  return [...orders].sort((a, b) => a.id.localeCompare(b.id));
}

function sortedBatches(batches: Batch[]) {
  return [...batches]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((b) => ({ ...b, items: sortedOrders(b.items) }));
}

function sortedNums(nums: number[]) {
  return [...nums].sort((a, b) => a - b);
}

function hasConflict(local: CachedSession, remote: CachedSession): boolean {
  if (local.seated !== remote.seated) return true;
  if (local.gutschein !== remote.gutschein) return true;

  if (JSON.stringify(sortedOrders(local.orders)) !== JSON.stringify(sortedOrders(remote.orders)))
    return true;

  if (JSON.stringify(sortedBatches(local.sent_batches)) !== JSON.stringify(sortedBatches(remote.sent_batches)))
    return true;

  if (JSON.stringify(sortedNums(local.marked_batches)) !== JSON.stringify(sortedNums(remote.marked_batches)))
    return true;

  return false;
}

/**
 * Merge two sessions by combining their data
 * - Merge orders by item ID (keep both if different IDs, sum qty if same ID)
 * - Concat batches chronologically, deduplicated by timestamp
 * - Gutschein: Math.max (preserve whichever device has it set)
 * - Seated = true if either is seated
 * - Merge marked batches (union)
 */
export function mergeSessions(local: CachedSession, remote: CachedSession): CachedSession {
  // Merge orders: combine by item ID
  const orderMap = new Map<string, OrderItem>();

  [...local.orders, ...remote.orders].forEach((item) => {
    const existing = orderMap.get(item.id);
    if (existing) {
      // Same item exists - sum quantities
      existing.qty += item.qty;
      existing.sentQty += item.sentQty;
    } else {
      orderMap.set(item.id, { ...item });
    }
  });

  // Merge batches: deduplicate by timestamp, then sort chronologically
  const batchMap = new Map<string, Batch>();
  [...local.sent_batches, ...remote.sent_batches].forEach((b) => {
    if (!batchMap.has(b.timestamp)) batchMap.set(b.timestamp, b);
  });
  const mergedBatches = Array.from(batchMap.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Merge marked batches: union of both sets
  const mergedMarkedBatches = Array.from(
    new Set([...local.marked_batches, ...remote.marked_batches])
  );

  return {
    table_id: local.table_id,
    seated: local.seated || remote.seated,
    gutschein:
      local.gutschein !== null || remote.gutschein !== null
        ? Math.max(local.gutschein ?? 0, remote.gutschein ?? 0)
        : null,
    orders: Array.from(orderMap.values()),
    sent_batches: mergedBatches,
    marked_batches: mergedMarkedBatches,
  };
}
