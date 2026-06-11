import type { Bill, TableId } from "../types";
import { todayBusinessDate } from "../services/directusBills";
import { BUSINESS_DAY_START_HOUR } from "../config/appConfig";

// ── Date helpers ────────────────────────────────────────────────────────────

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(startStr: string, endStr: string): number {
  const [sy, sm, sd] = startStr.split("-").map(Number);
  const [ey, em, ed] = endStr.split("-").map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  return Math.round((end - start) / 86_400_000) + 1;
}

function businessDateFromTimestamp(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() - BUSINESS_DAY_START_HOUR * 3_600_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(shifted);
}

// ── Revenue / covers ────────────────────────────────────────────────────────

export function billRevenue(bill: Bill): number {
  return bill.total - (bill.gutschein ?? 0);
}

export function billCovers(bill: Bill): number {
  if (!bill.splitData) return 1;
  if ("guests" in bill.splitData) return bill.splitData.guests > 0 ? bill.splitData.guests : 1;
  return bill.splitData.payments.length > 0 ? bill.splitData.payments.length : 1;
}

// ── Period selector ─────────────────────────────────────────────────────────

export type AnalyticsPeriod = "last7" | "last30" | "thisMonth" | "custom";

export interface DateRange {
  start: string;
  end: string;
}

export interface PeriodBounds {
  current: DateRange;
  prior: DateRange;
}

export function getPeriodBounds(
  period: AnalyticsPeriod,
  customStart?: string,
  customEnd?: string,
): PeriodBounds {
  const today = todayBusinessDate();

  if (period === "last7") {
    const start = addDays(today, -6);
    const priorEnd = addDays(start, -1);
    const priorStart = addDays(priorEnd, -6);
    return { current: { start, end: today }, prior: { start: priorStart, end: priorEnd } };
  }

  if (period === "last30") {
    const start = addDays(today, -29);
    const priorEnd = addDays(start, -1);
    const priorStart = addDays(priorEnd, -29);
    return { current: { start, end: today }, prior: { start: priorStart, end: priorEnd } };
  }

  if (period === "thisMonth") {
    const [year, month] = today.split("-").map(Number);
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const priorEnd = addDays(start, -1);
    const priorYear = month === 1 ? year - 1 : year;
    const priorMonth = month === 1 ? 12 : month - 1;
    const priorStart = `${priorYear}-${String(priorMonth).padStart(2, "0")}-01`;
    return { current: { start, end: today }, prior: { start: priorStart, end: priorEnd } };
  }

  // custom (or fallback)
  const start = customStart ?? addDays(today, -6);
  const end = customEnd ?? today;
  const len = daysBetween(start, end);
  const priorEnd = addDays(start, -1);
  const priorStart = addDays(priorEnd, -(len - 1));
  return { current: { start, end }, prior: { start: priorStart, end: priorEnd } };
}

// ── KPI aggregation ─────────────────────────────────────────────────────────

export interface KpiData {
  revenue: number;
  covers: number;
  revPerCover: number;
  avgBill: number;
  avgTipPct: number;
  bills: number;
}

export interface KpiWithDeltas extends KpiData {
  revenueΔ: number | null;
  coversΔ: number | null;
  revPerCoverΔ: number | null;
  avgBillΔ: number | null;
  avgTipPctΔ: number | null;
  billsΔ: number | null;
}

export function aggregateKpis(rawBills: Bill[]): KpiData {
  const revenue = rawBills.reduce((s, b) => s + billRevenue(b), 0);
  const tips = rawBills.reduce((s, b) => s + (b.tip ?? 0), 0);
  const covers = rawBills.reduce((s, b) => s + billCovers(b), 0);
  const sessionIds = new Set(rawBills.map((b) => b.session_id).filter(Boolean));
  const legacyCount = rawBills.filter((b) => !b.session_id).length;
  return {
    revenue,
    covers,
    revPerCover: covers > 0 ? revenue / covers : 0,
    avgBill: rawBills.length ? revenue / rawBills.length : 0,
    avgTipPct: revenue > 0 ? (tips / revenue) * 100 : 0,
    bills: sessionIds.size + legacyCount,
  };
}

export function computeDeltas(current: KpiData, prior: KpiData): KpiWithDeltas {
  const pct = (curr: number, prev: number): number | null =>
    prev === 0 ? null : ((curr - prev) / prev) * 100;
  const noPrior = prior.bills === 0;

  return {
    ...current,
    revenueΔ: pct(current.revenue, prior.revenue),
    coversΔ: noPrior ? null : current.covers - prior.covers,
    revPerCoverΔ: pct(current.revPerCover, prior.revPerCover),
    avgBillΔ: pct(current.avgBill, prior.avgBill),
    avgTipPctΔ: noPrior ? null : current.avgTipPct - prior.avgTipPct,
    billsΔ: noPrior ? null : current.bills - prior.bills,
  };
}

// ── Revenue trend ───────────────────────────────────────────────────────────

export interface DayData {
  date: string;
  revenue: number;
  covers: number;
  avgBill: number;
  billCount: number;
}

export function buildDayTimeline(bills: Bill[], start: string, end: string): DayData[] {
  const map = new Map<string, DayData>();

  for (const bill of bills) {
    const date = businessDateFromTimestamp(bill.timestamp);
    const rev = billRevenue(bill);
    const existing = map.get(date);
    if (existing) {
      existing.revenue += rev;
      existing.covers += billCovers(bill);
      existing.billCount += 1;
      existing.avgBill = existing.revenue / existing.billCount;
    } else {
      map.set(date, { date, revenue: rev, covers: billCovers(bill), avgBill: rev, billCount: 1 });
    }
  }

  const result: DayData[] = [];
  let cur = start;
  while (cur <= end) {
    result.push(map.get(cur) ?? { date: cur, revenue: 0, covers: 0, avgBill: 0, billCount: 0 });
    cur = addDays(cur, 1);
  }
  return result;
}

// ── Category breakdown ──────────────────────────────────────────────────────

export type DisplayCategory = "Food" | "Wines" | "Drinks" | "Shop";

export const CATEGORY_ORDER: DisplayCategory[] = ["Food", "Wines", "Drinks", "Shop"];

function toDisplayCategory(cat?: string): DisplayCategory {
  if (!cat) return "Food";
  // Directus category names (plain strings from category.name)
  if (cat === "Wines") return "Wines";
  if (cat === "Drinks") return "Drinks";
  if (cat === "Shop") return "Shop";
  if (cat === "Food") return "Food";
  // Legacy TypeScript enum values (emoji-suffixed, may appear in older stored bills)
  if (cat.startsWith("Bottles")) return "Wines";
  if (cat.startsWith("Drinks")) return "Drinks";
  return "Food";
}

export interface CategoryData {
  category: DisplayCategory;
  revenue: number;
  pct: number;
}

export function groupByCategory(bills: Bill[]): CategoryData[] {
  const totals: Record<DisplayCategory, number> = { Food: 0, Wines: 0, Drinks: 0, Shop: 0 };
  let total = 0;

  for (const bill of bills) {
    for (const item of bill.items) {
      const rev = item.price * item.qty;
      const cat = toDisplayCategory(item.category);
      totals[cat] += rev;
      total += rev;
    }
  }

  return CATEGORY_ORDER.map((cat) => ({
    category: cat,
    revenue: totals[cat],
    pct: total > 0 ? (totals[cat] / total) * 100 : 0,
  }));
}

// ── Top items ────────────────────────────────────────────────────────────────

export interface ItemData {
  name: string;
  revenue: number;
  qty: number;
  category: DisplayCategory;
  pct: number;
}

export function getTopItems(bills: Bill[], sortBy: "revenue" | "qty", limit = 20): ItemData[] {
  const map = new Map<string, Omit<ItemData, "pct">>();
  let totalRevenue = 0;

  for (const bill of bills) {
    for (const item of bill.items) {
      const existing = map.get(item.name);
      const rev = item.price * item.qty;
      totalRevenue += rev;
      if (existing) {
        existing.revenue += rev;
        existing.qty += item.qty;
      } else {
        map.set(item.name, {
          name: item.name,
          revenue: rev,
          qty: item.qty,
          category: toDisplayCategory(item.category),
        });
      }
    }
  }

  return [...map.values()]
    .sort((a, b) => (sortBy === "revenue" ? b.revenue - a.revenue : b.qty - a.qty))
    .slice(0, limit)
    .map((item) => ({ ...item, pct: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0 }));
}

// ── Weekday pattern ──────────────────────────────────────────────────────────

export interface WeekdayData {
  day: number; // 0 = Mon … 6 = Sun
  label: string;
  avgRevenue: number;
  dayCount: number;
}

export function groupByWeekday(bills: Bill[], start: string, end: string): WeekdayData[] {
  const buckets: { total: number; count: number }[] = Array.from({ length: 7 }, () => ({
    total: 0,
    count: 0,
  }));

  const timeline = buildDayTimeline(bills, start, end);

  for (const day of timeline) {
    const [y, m, d] = day.date.split("-").map(Number);
    const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun
    const weekday = jsDay === 0 ? 6 : jsDay - 1; // Mon=0 … Sun=6
    buckets[weekday].total += day.revenue;
    buckets[weekday].count += 1;
  }

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((label, i) => ({
    day: i,
    label,
    avgRevenue: buckets[i].count > 0 ? buckets[i].total / buckets[i].count : 0,
    dayCount: buckets[i].count,
  }));
}

// ── Insight strip ───────────────────────────────────────────────────────────

const _DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const _MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function computeInsights(
  kpis: KpiWithDeltas,
  days: DayData[],
  categories: CategoryData[],
): string[] {
  const insights: string[] = [];

  if (kpis.revenueΔ !== null) {
    const dir = kpis.revenueΔ >= 0 ? "up" : "down";
    insights.push(`Revenue ${dir} ${Math.abs(kpis.revenueΔ).toFixed(1)}% vs previous period`);
  }

  let bestDay: DayData | undefined;
  for (const d of days) {
    if (!bestDay || d.revenue > bestDay.revenue) bestDay = d;
  }
  if (bestDay && bestDay.revenue > 0) {
    const [y, m, day] = bestDay.date.split("-").map(Number);
    const dow = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
    insights.push(`Best day: ${_DOW[dow]} ${_MON[m - 1]} ${day}, €${bestDay.revenue.toFixed(0)}`);
  }

  const topCat = [...categories].sort((a, b) => b.revenue - a.revenue)[0];
  if (topCat && topCat.revenue > 0) {
    insights.push(`Top category: ${topCat.category}, ${topCat.pct.toFixed(0)}% of item revenue`);
  }

  return insights;
}

// ── Peak hours ───────────────────────────────────────────────────────────────

export interface HourData {
  hour: number;
  label: string;
  revenue: number;
  billCount: number;
}

function berlinHour(iso: string): number {
  return Number(
    new Intl.DateTimeFormat("en-CA", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Europe/Berlin",
    }).format(new Date(iso)),
  );
}

export function groupByHour(bills: Bill[]): HourData[] {
  const buckets: { revenue: number; billCount: number }[] = Array.from({ length: 24 }, () => ({
    revenue: 0,
    billCount: 0,
  }));

  for (const bill of bills) {
    const h = berlinHour(bill.timestamp);
    if (h >= 0 && h < 24) {
      buckets[h].revenue += billRevenue(bill);
      buckets[h].billCount += 1;
    }
  }

  return buckets
    .map((b, h) => ({ hour: h, label: `${String(h).padStart(2, "0")}:00`, ...b }))
    .filter((b) => b.billCount > 0);
}

// ── Top tables ────────────────────────────────────────────────────────────────

export interface TableData {
  tableId: TableId;
  revenue: number;
  billCount: number;
  avgBill: number;
}

export function groupByTable(bills: Bill[]): TableData[] {
  const map = new Map<string, TableData>();

  for (const bill of bills) {
    const key = String(bill.tableId);
    const rev = billRevenue(bill);
    const existing = map.get(key);
    if (existing) {
      existing.revenue += rev;
      existing.billCount += 1;
      existing.avgBill = existing.revenue / existing.billCount;
    } else {
      map.set(key, { tableId: bill.tableId, revenue: rev, billCount: 1, avgBill: rev });
    }
  }

  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

// ── Formatting helpers ───────────────────────────────────────────────────────

export function fmtEur(value: number): string {
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(1)}k`;
  }
  return `€${value.toFixed(0)}`;
}

export function fmtEurFull(value: number): string {
  return `€${value.toFixed(2)}`;
}

export function fmtPct(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
