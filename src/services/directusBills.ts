import type { Bill, OrderItem } from "../types";

const DIRECTUS_URL = (import.meta as any).env?.VITE_DIRECTUS_URL ?? "https://cms.blasalviz.com";

export function todayBerlinDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
}

// Returns UTC bounds for a full calendar day in Europe/Berlin time.
function berlinDayBoundsUTC(berlinDate: string): { gte: string; lte: string } {
  const [year, month, day] = berlinDate.split("-").map(Number);
  // Probe noon UTC to find the Berlin UTC offset (1 = CET, 2 = CEST)
  const noonUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const berlinNoonHour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", hour: "numeric", hour12: false }).format(noonUTC)
  );
  const offsetHours = berlinNoonHour - 12;
  const gte = new Date(Date.UTC(year, month - 1, day, -offsetHours, 0, 0, 0));
  const lte = new Date(Date.UTC(year, month - 1, day, 23 - offsetHours, 59, 59, 999));
  return { gte: gte.toISOString(), lte: lte.toISOString() };
}

function billFromDirectus(d: any): Bill {
  return {
    directusId: d.id,
    tableId: d.table_id,
    total: d.total,
    gutschein: d.gutschein ?? undefined,
    tip: d.tip ?? undefined,
    timestamp: d.timestamp,
    paymentMode: d.payment_mode,
    addedToPOS: d.added_to_pos ?? false,
    splitData: d.split_guests ? { guests: d.split_guests } : undefined,
    items: (d.items ?? []).map((item: any) => ({
      directusId: item.id,
      id: item.item_id ?? item.id,
      name: item.item_name,
      posId: item.pos_id ?? undefined,
      posName: item.pos_name ?? undefined,
      price: item.price,
      qty: item.qty,
      sentQty: item.qty,
      category: item.category ?? undefined,
      subcategory: item.subcategory ?? undefined,
      crossedQty: item.crossed_qty ?? 0,
    })),
  };
}

export async function fetchBillsByDate(berlinDate: string): Promise<Bill[]> {
  const { gte, lte } = berlinDayBoundsUTC(berlinDate);

  const billsRes = await fetch(
    `${DIRECTUS_URL}/items/bills`
    + `?filter[timestamp][_gte]=${gte}`
    + `&filter[timestamp][_lte]=${lte}`
    + `&fields=*`
    + `&sort=timestamp`
    + `&limit=-1`
  );
  if (!billsRes.ok) throw new Error(`Directus bills ${billsRes.status}`);
  const { data: bills } = await billsRes.json();
  if (bills.length === 0) return [];

  // Fetch items for those bills
  const ids = bills.map((b: any) => b.id).join(",");
  const itemsRes = await fetch(
    `${DIRECTUS_URL}/items/bill_items`
    + `?filter[bill_id][_in]=${ids}`
    + `&fields=*`
    + `&limit=-1`
  );
  if (!itemsRes.ok) throw new Error(`Directus bill_items ${itemsRes.status}`);
  const { data: items } = await itemsRes.json();

  // Map items onto their bills
  const itemsByBill: Record<string, any[]> = {};
  for (const item of items) {
    const bid = item.bill_id;
    if (!itemsByBill[bid]) itemsByBill[bid] = [];
    itemsByBill[bid].push(item);
  }

  return bills.map((b: any) => billFromDirectus({ ...b, items: itemsByBill[b.id] ?? [] }));
}

// Create a bill + all its items; returns the bill with directusIds populated
export async function createBillInDirectus(bill: Bill): Promise<Bill> {
  const billRes = await fetch(`${DIRECTUS_URL}/items/bills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table_id: bill.tableId,
      total: bill.total,
      gutschein: bill.gutschein ?? null,
      tip: (bill as any).tip ?? null,
      payment_mode: bill.paymentMode,
      timestamp: bill.timestamp,
      added_to_pos: false,
      split_guests: bill.splitData && "guests" in bill.splitData
        ? bill.splitData.guests
        : null,
    }),
  });
  if (!billRes.ok) throw new Error(`Create bill failed: ${billRes.status}`);
  const { data: billData } = await billRes.json();
  const billDirectusId: string = billData.id;

  // Batch-create all items
  const itemsPayload = bill.items.map((item) => ({
    bill_id: billDirectusId,
    item_id: item.id,
    item_name: item.name,
    pos_id: item.posId ?? null,
    pos_name: item.posName ?? null,
    price: item.price,
    qty: item.qty,
    category: (item as any).category ?? null,
    subcategory: item.subcategory ?? null,
    crossed_qty: 0,
  }));

  const itemsRes = await fetch(`${DIRECTUS_URL}/items/bill_items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(itemsPayload),
  });
  if (!itemsRes.ok) throw new Error(`Create bill items failed: ${itemsRes.status}`);
  const { data: itemsData } = await itemsRes.json();
  const itemsArray: any[] = Array.isArray(itemsData) ? itemsData : [itemsData];

  return {
    ...bill,
    directusId: billDirectusId,
    items: bill.items.map((item, i) => ({
      ...item,
      directusId: itemsArray[i]?.id,
    })),
  };
}

export async function patchBill(directusId: string, data: object): Promise<void> {
  const res = await fetch(`${DIRECTUS_URL}/items/bills/${directusId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH bill failed: ${res.status}`);
}

export async function patchBillItem(directusId: string, data: object): Promise<void> {
  const res = await fetch(`${DIRECTUS_URL}/items/bill_items/${directusId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH bill item failed: ${res.status}`);
}

