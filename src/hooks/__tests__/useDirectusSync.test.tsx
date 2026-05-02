import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Orders, SentBatches, GutscheinAmounts, MarkedBatchId, OrderItem } from "../../types";
import type { CachedSession } from "../../utils/sessionStorage";
import { readDirtySessionRecords, readSessionCache } from "../../utils/sessionStorage";
import { DEBOUNCE_DELAY_MS, OWNERSHIP_GRACE_MS, POLL_INTERVAL_MS } from "../../config/appConfig";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  fetchAllSessions: vi.fn(),
  upsertSession: vi.fn(),
  deleteSession: vi.fn(),
  refetchSessions: vi.fn(),
  query: {
    data: [] as any[] | undefined,
    isError: false,
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: mocks.query.data,
    isError: mocks.query.isError,
    refetch: mocks.refetchSessions,
  })),
}));

vi.mock("../../services/directusSessions", () => ({
  fetchAllSessions: mocks.fetchAllSessions,
  upsertSession: mocks.upsertSession,
  deleteSession: mocks.deleteSession,
  parseTableId: (id: string) => {
    const n = Number(id);
    return Number.isInteger(n) && String(n) === id ? n : id;
  },
}));

import { useDirectusSync } from "../useDirectusSync";

type HookApi = ReturnType<typeof useDirectusSync>;

interface HarnessValue {
  result: HookApi;
  state: {
    orders: Orders;
    seatedTablesArr: (number | string)[];
    sentBatches: SentBatches;
    gutscheinAmounts: GutscheinAmounts;
    markedBatches: Record<string, Set<MarkedBatchId>>;
  };
  setters: {
    setOrders: React.Dispatch<React.SetStateAction<Orders>>;
    setSeatedTablesArr: React.Dispatch<React.SetStateAction<(number | string)[]>>;
    setSentBatches: React.Dispatch<React.SetStateAction<SentBatches>>;
    setGutscheinAmounts: React.Dispatch<React.SetStateAction<GutscheinAmounts>>;
    setMarkedBatches: React.Dispatch<React.SetStateAction<Record<string, Set<MarkedBatchId>>>>;
  };
}

const item = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: "item-1",
  name: "Fondue",
  price: 12,
  qty: 1,
  sentQty: 0,
  ...overrides,
});

const session = (overrides: Partial<CachedSession> = {}): CachedSession => ({
  table_id: "1",
  seated: false,
  gutschein: null,
  orders: [],
  sent_batches: [],
  marked_batches: [],
  ...overrides,
});

function Harness({ onRender }: { onRender: (value: HarnessValue) => void }) {
  const [orders, setOrders] = useState<Orders>({});
  const [seatedTablesArr, setSeatedTablesArr] = useState<(number | string)[]>([]);
  const [sentBatches, setSentBatches] = useState<SentBatches>({});
  const [gutscheinAmounts, setGutscheinAmounts] = useState<GutscheinAmounts>({});
  const [markedBatches, setMarkedBatches] = useState<Record<string, Set<MarkedBatchId>>>({});

  const result = useDirectusSync(
    { orders, seatedTablesArr, sentBatches, gutscheinAmounts, markedBatches },
    { setOrders, setSeatedTablesArr, setSentBatches, setGutscheinAmounts, setMarkedBatches },
    vi.fn()
  );

  onRender({
    result,
    state: { orders, seatedTablesArr, sentBatches, gutscheinAmounts, markedBatches },
    setters: { setOrders, setSeatedTablesArr, setSentBatches, setGutscheinAmounts, setMarkedBatches },
  });

  return null;
}

function renderHarness() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let current: HarnessValue | null = null;
  const onRender = (value: HarnessValue) => { current = value; };

  act(() => {
    root.render(<Harness onRender={onRender} />);
  });

  return {
    get current() {
      if (!current) throw new Error("Harness did not render");
      return current;
    },
    rerender() {
      act(() => {
        root.render(<Harness onRender={onRender} />);
      });
    },
    cleanup() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

async function flushTimers(ms = 0) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
  });
}

describe("useDirectusSync", () => {
  let rendered: { current: HarnessValue; cleanup: () => void; rerender: () => void } | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    mocks.query.data = [];
    mocks.query.isError = false;
    mocks.fetchAllSessions.mockResolvedValue([]);
    mocks.upsertSession.mockResolvedValue(101);
    mocks.deleteSession.mockResolvedValue({ success: true });
    mocks.refetchSessions.mockResolvedValue({});
  });

  afterEach(() => {
    rendered?.cleanup();
    rendered = null;
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("writes the latest committed state when the debounce fires", async () => {
    rendered = renderHarness();

    act(() => {
      rendered!.current.result.scheduleWrite(1);
      rendered!.current.setters.setOrders({ "1": [item({ qty: 2 })] });
      rendered!.current.setters.setSeatedTablesArr([1]);
      rendered!.current.setters.setGutscheinAmounts({ "1": 5 });
    });

    await flushTimers(0);
    await flushTimers(DEBOUNCE_DELAY_MS);

    expect(mocks.upsertSession).toHaveBeenCalledTimes(1);
    expect(mocks.upsertSession).toHaveBeenCalledWith(null, {
      table_id: "1",
      seated: true,
      gutschein: 5,
      orders: [item({ qty: 2 })],
      sent_batches: [],
      marked_batches: [],
    });
  });

  it("keeps a failed write dirty and surfaces syncError for retry recovery", async () => {
    rendered = renderHarness();
    mocks.upsertSession.mockRejectedValueOnce(new Error("network down"));

    act(() => {
      rendered!.current.setters.setOrders({ "1": [item()] });
      rendered!.current.result.scheduleWrite(1);
    });

    await flushTimers(0);
    await flushTimers(DEBOUNCE_DELAY_MS);

    expect(rendered.current.result.syncError).toBe(true);
    expect(readDirtySessionRecords()["1"]).toMatchObject({ operation: "upsert" });
    expect(readSessionCache()["1"].orders).toEqual([item()]);
  });

  it("does not extend ownership grace by immediately re-entering the debounce retry path", async () => {
    rendered = renderHarness();
    mocks.upsertSession.mockRejectedValueOnce(new Error("network down"));
    mocks.fetchAllSessions.mockReturnValue(new Promise(() => {}));

    act(() => {
      rendered!.current.setters.setOrders({ "1": [item()] });
      rendered!.current.result.scheduleWrite(1);
    });

    await flushTimers(0);
    await flushTimers(DEBOUNCE_DELAY_MS);
    expect(mocks.upsertSession).toHaveBeenCalledTimes(1);

    await flushTimers(POLL_INTERVAL_MS + DEBOUNCE_DELAY_MS * 3);

    expect(mocks.upsertSession).toHaveBeenCalledTimes(1);
    expect(readDirtySessionRecords()["1"]).toMatchObject({ operation: "upsert" });
  });

  it("applies remote conflict resolution without scheduling another write", async () => {
    rendered = renderHarness();
    const local = session({ orders: [item({ id: "local", name: "Local" })] });
    const remote = session({ orders: [item({ id: "remote", name: "Remote" })] });
    const conflict = { tableId: "1", local, remote, base: null };

    act(() => {
      rendered!.current.result.resolveConflict(conflict, "remote");
    });

    await flushTimers(DEBOUNCE_DELAY_MS);

    expect(rendered.current.state.orders["1"]).toEqual(remote.orders);
    expect(mocks.upsertSession).not.toHaveBeenCalled();
    expect(readSessionCache()["1"].orders).toEqual(remote.orders);
  });

  it("persists local conflict resolution after state refs have synced", async () => {
    rendered = renderHarness();
    const local = session({ seated: true, orders: [item({ id: "local", name: "Local" })] });
    const remote = session({ orders: [item({ id: "remote", name: "Remote" })] });
    const conflict = { tableId: "1", local, remote, base: null };

    act(() => {
      rendered!.current.result.resolveConflict(conflict, "local");
    });

    await flushTimers(0);
    await flushTimers(DEBOUNCE_DELAY_MS);

    expect(rendered.current.state.orders["1"]).toEqual(local.orders);
    expect(mocks.upsertSession).toHaveBeenCalledWith(null, local);
  });

  it("markAsLocallyOwned prevents a fresh remote poll from overwriting local table state", async () => {
    mocks.query.data = [{
      id: 1,
      table_id: "1",
      seated: false,
      gutschein: null,
      orders: [item({ id: "remote", name: "Remote" })],
      sent_batches: [],
      marked_batches: [],
    }];
    rendered = renderHarness();

    act(() => {
      rendered!.current.setters.setOrders({ "1": [item({ id: "local", name: "Local" })] });
      rendered!.current.result.markAsLocallyOwned(1);
    });

    rendered.rerender();

    expect(rendered.current.state.orders["1"]).toEqual([item({ id: "local", name: "Local" })]);

    await flushTimers(OWNERSHIP_GRACE_MS);

    mocks.query.data = [...mocks.query.data!];
    rendered.rerender();

    expect(rendered.current.state.orders["1"]).toEqual(mocks.query.data![0].orders);
  });
});
