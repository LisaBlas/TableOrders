import type { Bill, OrderItem } from "../types";

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL ?? "https://cms.blasalviz.com";
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN ?? "";

if (!DIRECTUS_TOKEN) {
  console.error("❌ DIRECTUS TOKEN MISSING! Check .env file");
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (DIRECTUS_TOKEN) {
    headers["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`;
  }
  return headers;
}

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

  const headers = getHeaders();
  const res = await fetch(
    `${DIRECTUS_URL}/items/bills`
    + `?filter[timestamp][_gte]=${gte}`
    + `&filter[timestamp][_lte]=${lte}`
    + `&fields=*,items.*`
    + `&sort=timestamp`
    + `&limit=-1`,
    { headers }
  );

  if (!res.ok) throw new Error(`Directus bills ${res.status}`);
  const { data: bills } = await res.json();

  return bills.map((b: any) => billFromDirectus(b));
}

// Create a bill + all its items; returns the bill with directusIds populated
export async function createBillInDirectus(bill: Bill): Promise<Bill> {
  const billRes = await fetch(`${DIRECTUS_URL}/items/bills`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      table_id: bill.tableId,
      total: Math.round(bill.total * 100) / 100,
      gutschein: bill.gutschein ?? null,
      tip: bill.tip ?? null,
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

  // Validate Directus response
  if (!billData?.id) {
    throw new Error("Directus did not return bill ID");
  }

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
    category: item.category ?? null,
    subcategory: item.subcategory ?? null,
    crossed_qty: 0,
  }));

  const itemsRes = await fetch(`${DIRECTUS_URL}/items/bill_items`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(itemsPayload),
  });

  if (!itemsRes.ok) {
    // Rollback: delete the orphaned bill before throwing
    try {
      await fetch(`${DIRECTUS_URL}/items/bills/${billDirectusId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
    } catch (rollbackErr) {
      console.error("Rollback failed:", rollbackErr);
    }
    throw new Error(`Create bill items failed: ${itemsRes.status}`);
  }

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
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH bill failed: ${res.status}`);
}

export async function patchBillItem(directusId: string, data: object): Promise<void> {
  const res = await fetch(`${DIRECTUS_URL}/items/bill_items/${directusId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH bill item failed: ${res.status}`);
}

export async function deleteBill(billDirectusId: string, itemDirectusIds: string[]): Promise<void> {
  if (itemDirectusIds.length) {
    await fetch(`${DIRECTUS_URL}/items/bill_items`, {
      method: "DELETE",
      headers: getHeaders(),
      body: JSON.stringify(itemDirectusIds),
    });
  }
  const res = await fetch(`${DIRECTUS_URL}/items/bills/${billDirectusId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`DELETE bill failed: ${res.status}`);
}

