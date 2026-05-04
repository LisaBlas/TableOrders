import { buildSeedSessions, buildSeedBills } from "./demoData";

export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export const DEMO_SESSIONS_KEY = "demo_sessions";
export const DEMO_BILLS_KEY = "demo_bills";

const DEMO_RESET_TS_KEY = "demo_last_reset";
const RESET_INTERVAL_MS = 10 * 60 * 1000;

function writeDemoState(): void {
  localStorage.setItem(DEMO_SESSIONS_KEY, JSON.stringify(buildSeedSessions()));
  localStorage.setItem(DEMO_BILLS_KEY, JSON.stringify(buildSeedBills()));
  localStorage.setItem(DEMO_RESET_TS_KEY, String(Date.now()));
  localStorage.setItem("authToken", "true");
  localStorage.removeItem("table_sessions_cache");
  localStorage.removeItem("table_sessions_dirty");
  localStorage.removeItem("table_sessions_sync_meta");
}

export function initDemoState(): void {
  const last = localStorage.getItem(DEMO_RESET_TS_KEY);
  if (!last || Date.now() - Number(last) > RESET_INTERVAL_MS) {
    writeDemoState();
  }
}

export function forceDemoReset(): void {
  writeDemoState();
}
