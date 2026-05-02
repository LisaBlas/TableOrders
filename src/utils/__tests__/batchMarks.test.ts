import { describe, it, expect } from "vitest";
import { batchMarkId, normalizeMarkedBatchIds } from "../batchMarks";
import type { Batch } from "../../types";

function makeBatch(timestamp: string, id?: string): Batch {
  return { id, timestamp, items: [] };
}

describe("batchMarkId", () => {
  it("returns batch.id when present", () => {
    const batch = makeBatch("2024-01-01T10:00:00.000Z", "uuid-abc");
    expect(batchMarkId(batch)).toBe("uuid-abc");
  });

  it("falls back to timestamp when id is absent", () => {
    const batch = makeBatch("2024-01-01T10:00:00.000Z");
    expect(batchMarkId(batch)).toBe("2024-01-01T10:00:00.000Z");
  });
});

describe("normalizeMarkedBatchIds", () => {
  it("passes string IDs through unchanged", () => {
    const result = normalizeMarkedBatchIds(["uuid-1", "uuid-2"], []);
    expect(result).toEqual(["uuid-1", "uuid-2"]);
  });

  it("converts numeric index to batch id", () => {
    const batches = [
      makeBatch("2024-01-01T10:00:00.000Z", "id-a"),
      makeBatch("2024-01-01T11:00:00.000Z", "id-b"),
    ];
    const result = normalizeMarkedBatchIds([0, 1], batches);
    expect(result).toEqual(["id-a", "id-b"]);
  });

  it("numeric index uses timestamp fallback when batch has no id", () => {
    const batches = [makeBatch("2024-01-01T10:00:00.000Z")];
    const result = normalizeMarkedBatchIds([0], batches);
    expect(result).toEqual(["2024-01-01T10:00:00.000Z"]);
  });

  it("drops out-of-bounds numeric indices", () => {
    const batches = [makeBatch("2024-01-01T10:00:00.000Z", "id-a")];
    const result = normalizeMarkedBatchIds([0, 5], batches);
    expect(result).toEqual(["id-a"]);
  });

  it("deduplicates marks that resolve to the same id", () => {
    const batches = [makeBatch("2024-01-01T10:00:00.000Z", "id-a")];
    const result = normalizeMarkedBatchIds(["id-a", 0], batches);
    expect(result).toEqual(["id-a"]);
  });

  it("handles null/undefined gracefully", () => {
    expect(normalizeMarkedBatchIds(null, [])).toEqual([]);
    expect(normalizeMarkedBatchIds(undefined, [])).toEqual([]);
  });

  it("skips empty strings", () => {
    const result = normalizeMarkedBatchIds(["", "id-a"], []);
    expect(result).toEqual(["id-a"]);
  });
});
