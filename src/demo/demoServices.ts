import type { TableSession } from "../services/directusSessions";
import type { Bill } from "../types";
import { MENU, MIN_QTY_2_IDS } from "../data/constants";
import { DEMO_SESSIONS_KEY, DEMO_BILLS_KEY } from "./index";

function berlinDayBoundsUTC(berlinDate: string): { gte: string; lte: string } {
  const [year, month, day] = berlinDate.split("-").map(Number);
  const noonUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const berlinNoonHour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", hour: "numeric", hour12: false }).format(noonUTC)
  );
  const offsetHours = berlinNoonHour - 12;
  const gte = new Date(Date.UTC(year, month - 1, day, -offsetHours, 0, 0, 0));
  const lte = new Date(Date.UTC(year, month - 1, day, 23 - offsetHours, 59, 59, 999));
  return { gte: gte.toISOString(), lte: lte.toISOString() };
}

function readSessions(): TableSession[] {
  try {
    return JSON.parse(localStorage.getItem(DEMO_SESSIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeSessions(sessions: TableSession[]): void {
  localStorage.setItem(DEMO_SESSIONS_KEY, JSON.stringify(sessions));
}

function readBills(): Bill[] {
  try {
    return JSON.parse(localStorage.getItem(DEMO_BILLS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeBills(bills: Bill[]): void {
  localStorage.setItem(DEMO_BILLS_KEY, JSON.stringify(bills));
}

export async function fetchAllSessions(): Promise<TableSession[]> {
  return readSessions();
}

export async function upsertSession(
  directusId: number | null,
  data: Omit<TableSession, "id">
): Promise<number> {
  const sessions = readSessions();
  const existing = sessions.find((s) =>
    directusId ? s.id === directusId : s.table_id === data.table_id
  );
  if (existing) {
    writeSessions(sessions.map((s) => (s.id === existing.id ? { ...s, ...data } : s)));
    return existing.id;
  }
  const newId = Date.now();
  writeSessions([...sessions, { id: newId, ...data }]);
  return newId;
}

export async function deleteSession(directusId: number): Promise<{ success: boolean; error?: string }> {
  writeSessions(readSessions().filter((s) => s.id !== directusId));
  return { success: true };
}

export async function fetchBillsByDate(berlinDate: string): Promise<Bill[]> {
  const { gte, lte } = berlinDayBoundsUTC(berlinDate);
  const gteMs = new Date(gte).getTime();
  const lteMs = new Date(lte).getTime();
  return readBills().filter((b) => {
    const ts = new Date(b.timestamp).getTime();
    return ts >= gteMs && ts <= lteMs;
  });
}

export async function createBillInDirectus(bill: Bill): Promise<Bill> {
  const fakeId = `demo-bill-${Date.now()}`;
  const saved: Bill = {
    ...bill,
    directusId: fakeId,
    tempId: undefined,
    items: bill.items.map((item, i) => ({
      ...item,
      directusId: `${fakeId}-item-${i}`,
      crossedQty: item.crossedQty ?? 0,
    })),
  };
  writeBills([...readBills(), saved]);
  return saved;
}

export async function patchBill(directusId: string, data: object): Promise<void> {
  const d = data as Record<string, unknown>;
  writeBills(readBills().map((b) => {
    if (b.directusId !== directusId) return b;
    const patch: Partial<Bill> = {};
    if ("added_to_pos" in d) patch.addedToPOS = d.added_to_pos as boolean;
    return { ...b, ...patch };
  }));
}

export async function patchBillItem(directusId: string, data: object): Promise<void> {
  const d = data as Record<string, unknown>;
  writeBills(readBills().map((bill) => ({
    ...bill,
    items: bill.items.map((item) => {
      if (item.directusId !== directusId) return item;
      const patched = { ...item };
      if ("crossed_qty" in d) patched.crossedQty = d.crossed_qty as number;
      return patched;
    }),
  })));
}

export async function fetchMenu(): Promise<{ menu: Record<string, unknown[]>; minQty2Ids: Set<string> }> {
  return { menu: MENU as Record<string, unknown[]>, minQty2Ids: MIN_QTY_2_IDS as Set<string> };
}
