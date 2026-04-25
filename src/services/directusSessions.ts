import type { TableId, OrderItem, Batch } from "../types";

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL ?? "https://cms.blasalviz.com";

export interface TableSession {
  id: number;
  table_id: string;
  seated: boolean;
  gutschein: number | null;
  orders: OrderItem[];
  sent_batches: Batch[];
  marked_batches: number[];
}

export function parseTableId(id: string): TableId {
  const n = Number(id);
  return Number.isInteger(n) && String(n) === id ? n : id;
}

export async function fetchAllSessions(): Promise<TableSession[]> {
  const res = await fetch(`${DIRECTUS_URL}/items/table_sessions?limit=-1`);
  if (!res.ok) throw new Error(`sessions fetch ${res.status}`);
  const { data } = await res.json();
  return data;
}

export async function upsertSession(
  directusId: number | null,
  data: Omit<TableSession, "id">
): Promise<number> {
  if (directusId) {
    const res = await fetch(`${DIRECTUS_URL}/items/table_sessions/${directusId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`session PATCH ${res.status}`);
    return directusId;
  }
  const res = await fetch(`${DIRECTUS_URL}/items/table_sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`session POST ${res.status}`);
  return (await res.json()).data.id;
}

export async function deleteSession(directusId: number): Promise<void> {
  await fetch(`${DIRECTUS_URL}/items/table_sessions/${directusId}`, { method: "DELETE" });
}
