import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderItem } from "../../types";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  scheduleWrite: vi.fn(),
  cancelAndDelete: vi.fn(),
  resolveConflict: vi.fn(),
  markAsLocallyOwned: vi.fn(),
}));

vi.mock("../AppContext", () => ({
  useApp: () => ({
    showToast: mocks.showToast,
  }),
}));

vi.mock("../MenuContext", () => ({
  useMenu: () => ({
    minQty2Ids: new Set<string>(),
  }),
}));

vi.mock("../../hooks/useDirectusSync", () => ({
  useDirectusSync: vi.fn(() => ({
    scheduleWrite: mocks.scheduleWrite,
    cancelAndDelete: mocks.cancelAndDelete,
    syncError: false,
    conflicts: [],
    resolveConflict: mocks.resolveConflict,
    markAsLocallyOwned: mocks.markAsLocallyOwned,
  })),
}));

import { TableProvider, useTable } from "../TableContext";

type TableApi = ReturnType<typeof useTable>;

const item = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: "item-1",
  name: "Fondue",
  price: 12,
  qty: 1,
  sentQty: 0,
  ...overrides,
});

function Capture({ onRender }: { onRender: (table: TableApi) => void }) {
  const table = useTable();
  useEffect(() => {
    onRender(table);
  });
  return null;
}

function renderTableProvider() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let current: TableApi | null = null;

  act(() => {
    root.render(
      <TableProvider>
        <Capture onRender={(table) => { current = table; }} />
      </TableProvider>
    );
  });

  return {
    get current() {
      if (!current) throw new Error("TableProvider did not render");
      return current;
    },
    cleanup() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("TableContext actions", () => {
  let rendered: ReturnType<typeof renderTableProvider> | null = null;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    rendered?.cleanup();
    rendered = null;
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("sendOrder derives the batch from current state and writes once", () => {
    rendered = renderTableProvider();

    act(() => {
      rendered!.current.addCustomItem(1, item({ id: "fondue", name: "Fondue", qty: 3, sentQty: 1 }));
    });

    mocks.scheduleWrite.mockClear();

    act(() => {
      rendered!.current.sendOrder(1);
    });

    const orders = rendered.current.orders["1"];
    const batches = rendered.current.sentBatches["1"];

    expect(orders).toEqual([item({ id: "fondue", name: "Fondue", qty: 3, sentQty: 3 })]);
    expect(batches).toHaveLength(1);
    expect(batches[0].id).toEqual(expect.any(String));
    expect(batches[0].items).toEqual([item({ id: "fondue", name: "Fondue", qty: 2, sentQty: 1 })]);
    expect(mocks.showToast).toHaveBeenCalledWith("Order sent!");
    expect(mocks.scheduleWrite).toHaveBeenCalledTimes(1);
    expect(mocks.scheduleWrite).toHaveBeenCalledWith(1);
  });

  it("sendOrder is a no-op when there are no unsent quantities", () => {
    rendered = renderTableProvider();

    act(() => {
      rendered!.current.addCustomItem(1, item({ id: "fondue", name: "Fondue", qty: 2, sentQty: 2 }));
    });

    mocks.scheduleWrite.mockClear();
    mocks.showToast.mockClear();

    act(() => {
      rendered!.current.sendOrder(1);
    });

    expect(rendered.current.sentBatches["1"]).toBeUndefined();
    expect(mocks.scheduleWrite).not.toHaveBeenCalled();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it("swapTables swaps all table-owned state and marks both tables locally owned first", () => {
    rendered = renderTableProvider();

    act(() => {
      rendered!.current.seatTable(1);
    });

    act(() => {
      rendered!.current.addCustomItem(1, item({ id: "table-1-item", name: "Table 1 Item" }));
    });

    act(() => {
      rendered!.current.sendOrder(1);
    });

    act(() => {
      rendered!.current.addCustomItem(2, item({ id: "table-2-item", name: "Table 2 Item" }));
    });

    act(() => {
      rendered!.current.applyGutschein(1, 5);
    });

    const table1BatchId = rendered.current.sentBatches["1"][0].id!;

    act(() => {
      rendered!.current.toggleMarkBatch(1, table1BatchId);
    });

    mocks.scheduleWrite.mockClear();
    mocks.markAsLocallyOwned.mockClear();

    act(() => {
      rendered!.current.swapTables(1, 2);
    });

    expect(mocks.markAsLocallyOwned).toHaveBeenCalledTimes(1);
    expect(mocks.markAsLocallyOwned).toHaveBeenCalledWith(1, 2);
    expect(rendered.current.orders["1"]).toEqual([item({ id: "table-2-item", name: "Table 2 Item" })]);
    expect(rendered.current.orders["2"]).toEqual([item({ id: "table-1-item", name: "Table 1 Item", sentQty: 1 })]);
    expect(rendered.current.sentBatches["1"]).toBeUndefined();
    expect(rendered.current.sentBatches["2"]).toHaveLength(1);
    expect(rendered.current.gutscheinAmounts["1"]).toBeUndefined();
    expect(rendered.current.gutscheinAmounts["2"]).toBe(5);
    expect(rendered.current.markedBatches["1"]).toBeUndefined();
    expect(rendered.current.markedBatches["2"].has(table1BatchId)).toBe(true);
    expect(rendered.current.seatedTables.has(1)).toBe(false);
    expect(rendered.current.seatedTables.has(2)).toBe(true);
    expect(mocks.scheduleWrite).toHaveBeenCalledTimes(2);
    expect(mocks.scheduleWrite).toHaveBeenNthCalledWith(1, 1);
    expect(mocks.scheduleWrite).toHaveBeenNthCalledWith(2, 2);
  });
});
