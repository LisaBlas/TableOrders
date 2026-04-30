import type { OrderItem, Batch, MarkedBatchId } from "../types";
import { normalizeMarkedBatchIds, type RawMarkedBatchId } from "./batchMarks";

const KEY = "lastClosedSession";
const TTL_MS = 24 * 60 * 60 * 1000;

export interface ArchivedSession {
  tableId: string;
  closedAt: string;
  orders: OrderItem[];
  sentBatches: Batch[];
  gutschein: number | null;
  seated: boolean;
  markedBatches: MarkedBatchId[];
  billTempId?: string;
}

interface RawArchivedSession extends Omit<ArchivedSession, "markedBatches"> {
  markedBatches?: RawMarkedBatchId[];
}

export function saveClosedSession(session: ArchivedSession): void {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function loadClosedSession(): ArchivedSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: RawArchivedSession = JSON.parse(raw);
    const session: ArchivedSession = {
      ...parsed,
      markedBatches: normalizeMarkedBatchIds(parsed.markedBatches, parsed.sentBatches),
    };
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
