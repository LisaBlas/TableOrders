import { directusFetch, DIRECTUS_URL } from "./directusFetch";

function getHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

export interface AdminCategory {
  id: number;
  name: string;
  sort_order: number;
}

export interface AdminVariant {
  id: number;
  type: string;
  label: string;
  price: number;
  pos_id: string | null;
  pos_name: string | null;
  is_default?: boolean;
  bottle_subcategory?: string | null;
}

export interface AdminMenuItem {
  id: string;
  name: string;
  short_name: string | null;
  subcategory: string | null;
  price: number | null;
  available: boolean;
  sort_order: number;
  pos_id: string | null;
  destination: string | null;
  min_qty: number;
  category: { id: number; name: string } | null;
  variants: AdminVariant[];
}

export async function fetchAllMenuItems(): Promise<AdminMenuItem[]> {
  // fields=* returns category_id as a scalar; category.name resolves the name
  const res = await directusFetch(
    `/items/menu_items` +
    `?fields=*,variants.*,category.id,category.name` +
    `&limit=-1` +
    `&sort=category.sort_order,id`,
    { headers: getHeaders() }
  );
  if (!res.ok) throw new Error(`Directus ${res.status}`);
  const { data } = await res.json();
  return (data as AdminMenuItem[]).map((item) => ({
    ...item,
    variants: item.variants ?? [],
  }));
}

export async function deleteVariant(id: number): Promise<void> {
  const res = await directusFetch(`/items/menu_item_variants/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Directus ${res.status}`);
}

export async function patchMenuItem(id: string, patch: Record<string, unknown>): Promise<void> {
  const res = await directusFetch(`/items/menu_items/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Directus ${res.status}`);
}

export async function patchVariant(id: number, patch: Record<string, unknown>): Promise<void> {
  const res = await directusFetch(`/items/menu_item_variants/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Directus ${res.status}`);
}

export async function createVariant(data: {
  item_id: string;
  label: string;
  price: number;
  type: string;
  pos_id: string | null;
  pos_name: string | null;
  bottle_subcategory: string | null;
  is_default: boolean;
}): Promise<AdminVariant> {
  const res = await directusFetch(`/items/menu_item_variants`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Directus ${res.status}`);
  const { data: created } = await res.json();
  return created as AdminVariant;
}

export async function createMenuItem(data: {
  name: string;
  short_name: string | null;
  price: number | null;
  subcategory: string | null;
  pos_id: string | null;
  destination: string | null;
  min_qty: number;
  available: boolean;
  sort_order: number;
  category: number;
}): Promise<AdminMenuItem> {
  const res = await directusFetch(`/items/menu_items`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Directus ${res.status}`);
  const { data: created } = await res.json();

  // Re-fetch with nested fields so the returned item matches AdminMenuItem shape
  const fullRes = await directusFetch(
    `/items/menu_items/${created.id}?fields=*,variants.*,category.name`,
    { headers: getHeaders() }
  );
  if (!fullRes.ok) return { ...created, variants: [] };
  const { data: full } = await fullRes.json();
  return { ...full, variants: full.variants ?? [] } as AdminMenuItem;
}
