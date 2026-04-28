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

/**
 * Check if two sessions have conflicting data
 */
function hasConflict(local: CachedSession, remote: CachedSession): boolean {
  // Check seated status
  if (local.seated !== remote.seated) return true;

  // Check gutschein
  if (local.gutschein !== remote.gutschein) return true;

  // Check orders (compare by stringifying to detect differences)
  if (JSON.stringify(local.orders) !== JSON.stringify(remote.orders)) return true;

  // Check sent batches
  if (JSON.stringify(local.sent_batches) !== JSON.stringify(remote.sent_batches)) return true;

  // Check marked batches
  if (JSON.stringify(local.marked_batches) !== JSON.stringify(remote.marked_batches)) return true;

  return false;
}

/**
 * Merge two sessions by combining their data
 * - Merge orders by item ID (keep both if different IDs, sum qty if same ID)
 * - Concat batches chronologically
 * - Sum gutschein
 * - Seated = true if either is seated
 * - Merge marked batches
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

  // Merge batches: concat and sort by timestamp
  const mergedBatches = [...local.sent_batches, ...remote.sent_batches].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Merge marked batches: union of both sets
  const mergedMarkedBatches = Array.from(
    new Set([...local.marked_batches, ...remote.marked_batches])
  );

  return {
    table_id: local.table_id,
    seated: local.seated || remote.seated,
    gutschein: (local.gutschein ?? 0) + (remote.gutschein ?? 0),
    orders: Array.from(orderMap.values()),
    sent_batches: mergedBatches,
    marked_batches: mergedMarkedBatches,
  };
}
