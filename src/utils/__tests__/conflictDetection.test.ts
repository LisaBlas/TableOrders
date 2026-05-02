import { describe, it, expect } from "vitest";
import { mergeSessions, detectConflicts } from "../conflictDetection";
import type { CachedSession } from "../sessionStorage";
import type { Batch, OrderItem } from "../../types";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeItem(id: string, qty: number, sentQty = 0, price = 10): OrderItem {
  return { id, name: id, price, qty, sentQty };
}

function makeBatch(timestamp: string, items: OrderItem[], id?: string): Batch {
  return { id, timestamp, items };
}

function makeSession(overrides: Partial<CachedSession> = {}): CachedSession {
  return {
    table_id: "1",
    seated: false,
    gutschein: null,
    orders: [],
    sent_batches: [],
    marked_batches: [],
    ...overrides,
  };
}

// ── mergeSessions ─────────────────────────────────────────────────────────────

describe("mergeSessions — basic merge", () => {
  it("accumulates unsent qty from both devices for the same item", () => {
    // Both devices independently added 2 unsent burgers → merge gives 4
    const item = makeItem("burger", 2, 0);
    const local = makeSession({ orders: [item] });
    const remote = makeSession({ orders: [item] });
    const merged = mergeSessions(local, remote);
    expect(merged.orders).toHaveLength(1);
    expect(merged.orders[0].qty).toBe(4);
    expect(merged.orders[0].sentQty).toBe(0);
  });

  it("combines distinct items from both sessions", () => {
    const local = makeSession({ orders: [makeItem("burger", 1)] });
    const remote = makeSession({ orders: [makeItem("fries", 1)] });
    const merged = mergeSessions(local, remote);
    expect(merged.orders).toHaveLength(2);
  });

  it("seated = true if either is seated", () => {
    expect(mergeSessions(makeSession({ seated: true }), makeSession({ seated: false })).seated).toBe(true);
    expect(mergeSessions(makeSession({ seated: false }), makeSession({ seated: false })).seated).toBe(false);
  });

  it("gutschein = Math.max of both (prefer higher value)", () => {
    const result = mergeSessions(
      makeSession({ gutschein: 10 }),
      makeSession({ gutschein: 20 })
    );
    expect(result.gutschein).toBe(20);
  });

  it("gutschein = null only when both are null", () => {
    expect(mergeSessions(makeSession({ gutschein: null }), makeSession({ gutschein: null })).gutschein).toBeNull();
    expect(mergeSessions(makeSession({ gutschein: 5 }), makeSession({ gutschein: null })).gutschein).toBe(5);
  });
});

// ── sentQty invariant ─────────────────────────────────────────────────────────

describe("mergeSessions — sentQty <= qty invariant", () => {
  it("merged item always has sentQty <= qty", () => {
    const sentItem = makeItem("wine", 3, 2);
    const batch = makeBatch("2024-01-01T10:00:00.000Z", [makeItem("wine", 1, 0)]);
    const local = makeSession({ orders: [sentItem], sent_batches: [batch] });
    const remote = makeSession({ orders: [sentItem], sent_batches: [batch] });

    const merged = mergeSessions(local, remote);
    merged.orders.forEach((item) => {
      expect(item.sentQty).toBeLessThanOrEqual(item.qty);
    });
  });

  it("does not double-count sentQty when both devices have same batch", () => {
    const batch = makeBatch("2024-01-01T10:00:00.000Z", [makeItem("steak", 2, 0)], "batch-1");
    const order = makeItem("steak", 2, 2);
    const local = makeSession({ orders: [order], sent_batches: [batch] });
    const remote = makeSession({ orders: [order], sent_batches: [batch] });

    const merged = mergeSessions(local, remote);
    const steak = merged.orders.find((o) => o.id === "steak");
    expect(steak).toBeDefined();
    expect(steak!.sentQty).toBe(2);
    expect(steak!.qty).toBe(2);
  });

  it("accumulates unsent qty from both devices", () => {
    const local = makeSession({ orders: [makeItem("salad", 1, 0)] });
    const remote = makeSession({ orders: [makeItem("salad", 2, 0)] });
    const merged = mergeSessions(local, remote);
    const salad = merged.orders.find((o) => o.id === "salad");
    expect(salad!.qty).toBe(3);
    expect(salad!.sentQty).toBe(0);
  });
});

// ── batch deduplication ───────────────────────────────────────────────────────

describe("mergeSessions — batch deduplication", () => {
  it("deduplicates identical batches from both devices", () => {
    const batch = makeBatch("2024-01-01T10:00:00.000Z", [makeItem("beer", 2)], "b1");
    const local = makeSession({ sent_batches: [batch] });
    const remote = makeSession({ sent_batches: [batch] });

    const merged = mergeSessions(local, remote);
    expect(merged.sent_batches).toHaveLength(1);
  });

  it("keeps distinct batches (same timestamp, different items)", () => {
    const ts = "2024-01-01T10:00:00.000Z";
    const batchA = makeBatch(ts, [makeItem("beer", 1)]);
    const batchB = makeBatch(ts, [makeItem("wine", 1)]);
    const local = makeSession({ sent_batches: [batchA] });
    const remote = makeSession({ sent_batches: [batchB] });

    const merged = mergeSessions(local, remote);
    expect(merged.sent_batches).toHaveLength(2);
  });

  it("keeps distinct batches (different timestamps)", () => {
    const batchA = makeBatch("2024-01-01T10:00:00.000Z", [makeItem("beer", 1)], "b1");
    const batchB = makeBatch("2024-01-01T11:00:00.000Z", [makeItem("beer", 1)], "b2");
    const local = makeSession({ sent_batches: [batchA] });
    const remote = makeSession({ sent_batches: [batchB] });

    const merged = mergeSessions(local, remote);
    expect(merged.sent_batches).toHaveLength(2);
  });
});

// ── marked batches survive merge ──────────────────────────────────────────────

describe("mergeSessions — marked_batches survive batch merge + re-sort", () => {
  it("marks on both devices are preserved in merged result", () => {
    const b0 = makeBatch("2024-01-01T10:00:00.000Z", [makeItem("beer", 1)], "b0");
    const b1 = makeBatch("2024-01-01T12:00:00.000Z", [makeItem("wine", 1)], "b1");
    const b2 = makeBatch("2024-01-01T11:00:00.000Z", [makeItem("steak", 1)], "b2");

    // Device A: has b0, b1 (b1 marked)
    const local = makeSession({
      sent_batches: [b0, b1],
      marked_batches: ["b1"],
    });
    // Device B: has b0, b2 (b0 marked)
    const remote = makeSession({
      sent_batches: [b0, b2],
      marked_batches: ["b0"],
    });

    // After merge, batches are re-sorted by timestamp: b0(t=10), b2(t=11), b1(t=12)
    const merged = mergeSessions(local, remote);

    expect(merged.sent_batches).toHaveLength(3);
    expect(merged.marked_batches).toContain("b0");
    expect(merged.marked_batches).toContain("b1");
    expect(merged.marked_batches).not.toContain("b2");
  });

  it("mark survives even when batch is re-sorted to a different position", () => {
    // b1 is originally index 1 in local, but after merge it shifts to a different position
    const b1 = makeBatch("2024-01-01T08:00:00.000Z", [makeItem("x", 1)], "b1");
    const bEarly = makeBatch("2024-01-01T06:00:00.000Z", [makeItem("y", 1)], "bEarly");

    const local = makeSession({ sent_batches: [b1], marked_batches: ["b1"] });
    const remote = makeSession({ sent_batches: [bEarly, b1], marked_batches: [] });

    const merged = mergeSessions(local, remote);
    // b1 is now at index 1 (sorted), not index 0; mark must still resolve
    expect(merged.marked_batches).toContain("b1");
  });

  it("marks union: all marks from both devices included", () => {
    const b1 = makeBatch("2024-01-01T10:00:00.000Z", [makeItem("a", 1)], "b1");
    const b2 = makeBatch("2024-01-01T11:00:00.000Z", [makeItem("b", 1)], "b2");

    const local = makeSession({ sent_batches: [b1, b2], marked_batches: ["b1"] });
    const remote = makeSession({ sent_batches: [b1, b2], marked_batches: ["b2"] });

    const merged = mergeSessions(local, remote);
    expect(merged.marked_batches).toContain("b1");
    expect(merged.marked_batches).toContain("b2");
  });
});

// ── detectConflicts ───────────────────────────────────────────────────────────

describe("detectConflicts", () => {
  function toRemote(s: CachedSession, id = 1) {
    return { id, ...s };
  }

  it("returns empty when local and remote match", () => {
    const session = makeSession({ table_id: "1", orders: [makeItem("beer", 1, 0)] });
    const conflicts = detectConflicts({ "1": session }, [toRemote(session)]);
    expect(conflicts).toHaveLength(0);
  });

  it("detects conflict when orders differ", () => {
    const local = makeSession({ table_id: "1", orders: [makeItem("beer", 1)] });
    const remote = makeSession({ table_id: "1", orders: [makeItem("wine", 1)] });
    const conflicts = detectConflicts({ "1": local }, [toRemote(remote)]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].tableId).toBe("1");
  });

  it("detects conflict when seated status differs", () => {
    const local = makeSession({ table_id: "1", seated: true });
    const remote = makeSession({ table_id: "1", seated: false });
    const conflicts = detectConflicts({ "1": local }, [toRemote(remote)]);
    expect(conflicts).toHaveLength(1);
  });

  it("returns no conflict when table has no remote data", () => {
    const local = makeSession({ table_id: "1", orders: [makeItem("beer", 1)] });
    const conflicts = detectConflicts({ "1": local }, []);
    expect(conflicts).toHaveLength(0);
  });

  it("detects conflict when gutschein differs", () => {
    const local = makeSession({ table_id: "1", gutschein: 10 });
    const remote = makeSession({ table_id: "1", gutschein: 20 });
    const conflicts = detectConflicts({ "1": local }, [toRemote(remote)]);
    expect(conflicts).toHaveLength(1);
  });
});
