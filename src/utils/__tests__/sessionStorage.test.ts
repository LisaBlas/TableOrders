import { describe, it, expect, beforeEach } from "vitest";
import {
  readSessionCache,
  writeSessionToCache,
  removeSessionFromCache,
  markSessionDirty,
  readDirtySessionRecords,
  clearSessionCache,
} from "../sessionStorage";
import type { CachedSession } from "../sessionStorage";

function makeSession(tableId = "1"): CachedSession {
  return {
    table_id: tableId,
    seated: false,
    gutschein: null,
    orders: [],
    sent_batches: [],
    marked_batches: [],
  };
}

beforeEach(() => {
  localStorage.clear();
});

// ── readSessionCache ──────────────────────────────────────────────────────────

describe("readSessionCache", () => {
  it("returns {} when localStorage is empty", () => {
    expect(readSessionCache()).toEqual({});
  });

  it("returns {} on corrupted JSON", () => {
    localStorage.setItem("table_sessions_cache", "not-json{{{");
    expect(readSessionCache()).toEqual({});
  });

  it("returns {} when cache root is not an object", () => {
    localStorage.setItem("table_sessions_cache", JSON.stringify([1, 2, 3]));
    expect(readSessionCache()).toEqual({});
  });

  it("skips invalid sessions but keeps valid ones", () => {
    const valid = makeSession("1");
    const invalid = { table_id: 42, seated: "yes" };
    localStorage.setItem("table_sessions_cache", JSON.stringify({ "1": valid, "2": invalid }));
    const cache = readSessionCache();
    expect(Object.keys(cache)).toEqual(["1"]);
  });

  it("accepts OrderItem with numeric id (backward compat)", () => {
    const sessionWithNumericId = {
      ...makeSession("1"),
      orders: [{ id: 123, name: "beer", price: 4, qty: 1, sentQty: 0 }],
    };
    localStorage.setItem("table_sessions_cache", JSON.stringify({ "1": sessionWithNumericId }));
    const cache = readSessionCache();
    expect(cache["1"]).toBeDefined();
    expect(cache["1"].orders[0].id).toBe(123);
  });

  it("normalizes missing sentQty to 0", () => {
    const raw = {
      ...makeSession("1"),
      orders: [{ id: "x", name: "x", price: 5, qty: 1 }],
    };
    localStorage.setItem("table_sessions_cache", JSON.stringify({ "1": raw }));
    const cache = readSessionCache();
    expect(cache["1"].orders[0].sentQty).toBe(0);
  });

  it("converts legacy numeric marked_batches to string batch ids", () => {
    const session = {
      ...makeSession("1"),
      sent_batches: [
        { id: "batch-0", timestamp: "2024-01-01T10:00:00.000Z", items: [] },
        { id: "batch-1", timestamp: "2024-01-01T11:00:00.000Z", items: [] },
      ],
      marked_batches: [1],
    };
    localStorage.setItem("table_sessions_cache", JSON.stringify({ "1": session }));
    const cache = readSessionCache();
    expect(cache["1"].marked_batches).toEqual(["batch-1"]);
  });

  it("keeps string batch ids unchanged", () => {
    const session = {
      ...makeSession("1"),
      sent_batches: [{ id: "batch-0", timestamp: "2024-01-01T10:00:00.000Z", items: [] }],
      marked_batches: ["batch-0"],
    };
    localStorage.setItem("table_sessions_cache", JSON.stringify({ "1": session }));
    const cache = readSessionCache();
    expect(cache["1"].marked_batches).toEqual(["batch-0"]);
  });
});

// ── writeSessionToCache / readSessionCache roundtrip ─────────────────────────

describe("writeSessionToCache + readSessionCache roundtrip", () => {
  it("writes and reads a session back", () => {
    const session = makeSession("5");
    writeSessionToCache("5", session);
    const cache = readSessionCache();
    expect(cache["5"]).toMatchObject({ table_id: "5", seated: false });
  });

  it("merges multiple tables without clobbering", () => {
    writeSessionToCache("1", makeSession("1"));
    writeSessionToCache("2", makeSession("2"));
    const cache = readSessionCache();
    expect(Object.keys(cache)).toContain("1");
    expect(Object.keys(cache)).toContain("2");
  });
});

// ── removeSessionFromCache ────────────────────────────────────────────────────

describe("removeSessionFromCache", () => {
  it("removes only the specified table", () => {
    writeSessionToCache("1", makeSession("1"));
    writeSessionToCache("2", makeSession("2"));
    removeSessionFromCache("1");
    const cache = readSessionCache();
    expect(cache["1"]).toBeUndefined();
    expect(cache["2"]).toBeDefined();
  });
});

// ── markSessionDirty / readDirtySessionRecords ────────────────────────────────

describe("markSessionDirty + readDirtySessionRecords", () => {
  it("records a dirty upsert entry", () => {
    const session = makeSession("3");
    markSessionDirty("3", session, null);
    const records = readDirtySessionRecords();
    expect(records["3"]).toBeDefined();
    expect(records["3"].operation).toBe("upsert");
    expect(records["3"].local_session).toMatchObject({ table_id: "3" });
  });

  it("preserves original base_hash on subsequent dirty marks", () => {
    const base = makeSession("3");
    markSessionDirty("3", base, base);
    const firstHash = readDirtySessionRecords()["3"].base_hash;

    const updated = { ...base, seated: true };
    markSessionDirty("3", updated, null);
    const secondHash = readDirtySessionRecords()["3"].base_hash;

    expect(secondHash).toBe(firstHash);
  });

  it("returns {} when dirty store is empty", () => {
    expect(readDirtySessionRecords()).toEqual({});
  });

  it("returns {} on corrupted dirty store JSON", () => {
    localStorage.setItem("table_sessions_dirty", "bad-json}}");
    expect(readDirtySessionRecords()).toEqual({});
  });
});

// ── clearSessionCache ─────────────────────────────────────────────────────────

describe("clearSessionCache", () => {
  it("wipes all session keys from localStorage", () => {
    writeSessionToCache("1", makeSession("1"));
    markSessionDirty("1", makeSession("1"), null);
    clearSessionCache();
    expect(localStorage.getItem("table_sessions_cache")).toBeNull();
    expect(localStorage.getItem("table_sessions_dirty")).toBeNull();
    expect(localStorage.getItem("table_sessions_sync_meta")).toBeNull();
  });
});
