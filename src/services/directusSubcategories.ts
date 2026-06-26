import { IS_DEMO_MODE } from "../demo";
import * as demo from "../demo/demoServices";
import { directusFetch } from "./directusFetch";
import type { Subcategory } from "../types";

const CATEGORY_ID_TO_NAME: Record<number, string> = {
  1: "Food",
  2: "Drinks",
  3: "Wines",
  4: "Shop",
};

export async function fetchSubcategories(): Promise<Record<string, Subcategory[]>> {
  if (IS_DEMO_MODE) return demo.fetchSubcategories();
  const res = await directusFetch(
    "/items/subcategories?filter[active][_eq]=true&sort=category_id,sort_order&limit=-1"
  );
  if (!res.ok) throw new Error(`Directus ${res.status}`);
  const { data } = await res.json();

  const result: Record<string, Subcategory[]> = {};
  for (const row of data as { id: string; category_id: number; label: string }[]) {
    const catName = CATEGORY_ID_TO_NAME[row.category_id];
    if (!catName) continue;
    if (!result[catName]) result[catName] = [];
    result[catName].push({ id: row.id, label: row.label });
  }
  return result;
}
