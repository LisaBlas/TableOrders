import type { Bill } from "../types";

const DIRECTUS_URL = (import.meta as any).env?.VITE_DIRECTUS_URL ?? "https://cms.blasalviz.com";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Cache the Directus record ID for today to avoid repeated GET lookups
let _cache: { date: string; id: string } | null = null;

export async function fetchTodayBills(): Promise<Bill[] | null> {
  const date = todayStr();
  const res = await fetch(
    `${DIRECTUS_URL}/items/daily_sales?filter[date][_eq]=${date}&limit=1`
  );
  if (!res.ok) throw new Error(`Directus ${res.status}`);
  const { data } = await res.json();
  if (data.length === 0) return null;
  _cache = { date, id: data[0].id };
  return data[0].bills ?? [];
}

export async function saveTodayBills(bills: Bill[]): Promise<void> {
  const date = todayStr();

  // Use cached record ID if it's for today
  if (_cache && _cache.date === date) {
    const res = await fetch(`${DIRECTUS_URL}/items/daily_sales/${_cache.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bills }),
    });
    if (!res.ok) throw new Error(`Directus PATCH ${res.status}`);
    return;
  }

  // Look up the record for today
  const checkRes = await fetch(
    `${DIRECTUS_URL}/items/daily_sales?filter[date][_eq]=${date}&limit=1&fields=id`
  );
  if (!checkRes.ok) throw new Error(`Directus GET ${checkRes.status}`);
  const { data } = await checkRes.json();

  if (data.length > 0) {
    _cache = { date, id: data[0].id };
    const res = await fetch(`${DIRECTUS_URL}/items/daily_sales/${_cache.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bills }),
    });
    if (!res.ok) throw new Error(`Directus PATCH ${res.status}`);
  } else {
    const res = await fetch(`${DIRECTUS_URL}/items/daily_sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, bills }),
    });
    if (!res.ok) throw new Error(`Directus POST ${res.status}`);
    const created = await res.json();
    _cache = { date, id: created.data?.id };
  }
}
