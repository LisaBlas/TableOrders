const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL ?? "https://cms.blasalviz.com";

function transformItem(item: any, categoryName: string) {
  const base = {
    id: item.id,
    name: item.name,
    shortName: item.short_name,
    subcategory: item.subcategory,
    posId: item.pos_id,
    posName: item.short_name,
    destination: item.destination,
    minQty: item.min_qty ?? 1,
    available: item.available,
    category: categoryName,
  };

  if (item.variants && item.variants.length > 0) {
    return {
      ...base,
      variants: item.variants.map((v: any) => ({
        type: v.type,
        label: v.label,
        price: v.price,
        posId: v.pos_id,
        posName: item.short_name,
        bottleSubcategory: v.bottle_subcategory,
      })),
    };
  }

  return { ...base, price: item.price };
}

export async function fetchMenu(): Promise<{ menu: Record<string, any[]>; minQty2Ids: Set<string> }> {
  const url = `${DIRECTUS_URL}/items/menu_items?fields=*,variants.*,category.name&filter[available][_eq]=true&limit=-1&sort=category.sort_order,id`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Directus ${res.status}`);
  const { data } = await res.json();

  const menu: Record<string, any[]> = {};
  const minQty2Ids = new Set<string>();

  for (const item of data) {
    const categoryName: string = item.category?.name ?? "Other";
    if (!menu[categoryName]) menu[categoryName] = [];
    const transformed = transformItem(item, categoryName);
    menu[categoryName].push(transformed);
    if ((item.min_qty ?? 1) >= 2) minQty2Ids.add(item.id);
  }

  return { menu, minQty2Ids };
}
