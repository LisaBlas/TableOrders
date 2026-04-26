import type { OrderItem, Batch } from "../types";

const KEY = "lastClosedSession";
const TTL_MS = 24 * 60 * 60 * 1000;

export interface ArchivedSession {
  tableId: string;
  closedAt: string;
  orders: OrderItem[];
  sentBatches: Batch[];
  gutschein: number | null;
  seated: boolean;
  markedBatches: number[];
  billTempId?: string;
}

export function saveClosedSession(session: ArchivedSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // localStorage quota exceeded — silently skip
  }
}

export function loadClosedSession(): ArchivedSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const session: ArchivedSession = JSON.parse(raw);
    if (Date.now() - new Date(session.closedAt).getTime() > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearClosedSession(): void {
  localStorage.removeItem(KEY);
}
