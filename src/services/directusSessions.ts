import type { TableId, OrderItem, Batch } from "../types";
import { normalizeMarkedBatchIds, type RawMarkedBatchId } from "../utils/batchMarks";

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL ?? "https://cms.blasalviz.com";

export interface TableSession {
  id: number;
  table_id: string;
  seated: boolean;
  gutschein: number | null;
  orders: OrderItem[];
  sent_batches: Batch[];
  marked_batches: string[];
}

interface RawTableSession extends Omit<TableSession, "marked_batches"> {
  marked_batches?: RawMarkedBatchId[];
}

export function parseTableId(id: string): TableId {
  const n = Number(id);
  return Number.isInteger(n) && String(n) === id ? n : id;
}

export async function fetchAllSessions(): Promise<TableSession[]> {
  const res = await fetch(`${DIRECTUS_URL}/items/table_sessions?limit=-1`);
  if (!res.ok) throw new Error(`sessions fetch ${res.status}`);
  const { data } = await res.json();
  return (data as RawTableSession[]).map((session) => ({
    ...session,
    orders: session.orders ?? [],
    sent_batches: session.sent_batches ?? [],
    marked_batches: normalizeMarkedBatchIds(session.marked_batches, session.sent_batches ?? []),
  }));
}

export async function upsertSession(
  directusId: number | null,
  data: Omit<TableSession, "id">
): Promise<number> {
  let resolvedId = directusId;

  if (!resolvedId) {
    const lookup = await fetch(
      `${DIRECTUS_URL}/items/table_sessions?filter[table_id][_eq]=${encodeURIComponent(data.table_id)}&limit=1`
    );
    if (!lookup.ok) throw new Error(`session lookup ${lookup.status}`);
    const { data: matches } = await lookup.json();
    resolvedId = Array.isArray(matches) && matches[0]?.id ? matches[0].id : null;
  }

  if (resolvedId) {
    const res = await fetch(`${DIRECTUS_URL}/items/table_sessions/${resolvedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`session PATCH ${res.status}`);
    return resolvedId;
  }
  const res = await fetch(`${DIRECTUS_URL}/items/table_sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`session POST ${res.status}`);
  return (await res.json()).data.id;
}

export async function deleteSession(directusId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${DIRECTUS_URL}/items/table_sessions/${directusId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
