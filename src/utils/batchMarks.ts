import type { Batch, MarkedBatchId } from "../types";

export type RawMarkedBatchId = MarkedBatchId | number;

export function createBatchId(): MarkedBatchId {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function batchMarkId(batch: Batch): MarkedBatchId {
  return batch.id ?? batch.timestamp;
}

export function normalizeMarkedBatchIds(
  markedBatches: RawMarkedBatchId[] | null | undefined,
  sentBatches: Batch[] = []
): MarkedBatchId[] {
  if (!Array.isArray(markedBatches)) return [];

  const ids = new Set<MarkedBatchId>();
  markedBatches.forEach((mark) => {
    if (typeof mark === "string" && mark.length > 0) {
      ids.add(mark);
      return;
    }

    if (typeof mark === "number" && Number.isInteger(mark)) {
      const batch = sentBatches[mark];
      if (batch) ids.add(batchMarkId(batch));
    }
  });

  return Array.from(ids);
}
