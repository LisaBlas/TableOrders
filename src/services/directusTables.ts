import { directusFetch } from "./directusFetch";
import type { TableConfig } from "../types";

export interface PermanentTableRecord {
  id: number;
  slug?: string;
  label: string;
  sort: number | null;
  active: boolean | null;
}

function toTableConfig(r: PermanentTableRecord): TableConfig {
  return { id: r.slug ?? String(r.id), label: r.label };
}

function isActive(r: PermanentTableRecord): boolean {
  return r.active !== false;
}

function sortRecords(records: PermanentTableRecord[]): PermanentTableRecord[] {
  return [...records].sort((a, b) => {
    const so = (a.sort ?? 0) - (b.sort ?? 0);
    return so !== 0 ? so : a.id - b.id;
  });
}

async function assertOk(res: Response, context: string): Promise<void> {
  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch { /* ignore */ }
    const msg = `[directusTables] ${context} — ${res.status} ${res.statusText}: ${body}`;
    console.error(msg);
    throw new Error(msg);
  }
}

export async function fetchPermanentTables(): Promise<TableConfig[]> {
  const res = await directusFetch(`/items/restaurant_tables?limit=-1`);
  await assertOk(res, "fetchActive");
  const { data } = await res.json();
  return sortRecords(data as PermanentTableRecord[]).filter(isActive).map(toTableConfig);
}

export async function fetchAllPermanentTableRecords(): Promise<PermanentTableRecord[]> {
  const res = await directusFetch(`/items/restaurant_tables?limit=-1`);
  await assertOk(res, "fetchAll");
  const { data } = await res.json();
  return sortRecords(data as PermanentTableRecord[]);
}

export async function createPermanentTable(
  label: string,
  sortOrder: number
): Promise<PermanentTableRecord> {
  const res = await directusFetch(`/items/restaurant_tables`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, sort: sortOrder, active: true }),
  });
  await assertOk(res, "create");
  const { data } = await res.json();
  return data as PermanentTableRecord;
}

export async function patchPermanentTable(
  id: number,
  patch: Partial<Pick<PermanentTableRecord, "slug" | "label" | "sort" | "active">>
): Promise<void> {
  const res = await directusFetch(`/items/restaurant_tables/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  await assertOk(res, `patch:${id}`);
}
