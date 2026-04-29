import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllSessions, upsertSession, deleteSession, parseTableId } from "../services/directusSessions";
import type { Orders, SentBatches, GutscheinAmounts, TableId } from "../types";
import { DEBOUNCE_DELAY_MS, POLL_INTERVAL_MS, OWNERSHIP_GRACE_MS, MAX_RETRIES } from "../config/appConfig";
import { readSessionCache, writeSessionToCache, removeSessionFromCache, type CachedSession } from "../utils/sessionStorage";
import { detectConflicts, mergeSessions, type SessionConflict } from "../utils/conflictDetection";

interface SyncState {
  orders: Orders;
  seatedTablesArr: TableId[];
  sentBatches: SentBatches;
  gutscheinAmounts: GutscheinAmounts;
  markedBatches: Record<string, Set<number>>;
}

interface SyncSetters {
  setOrders: Dispatch<SetStateAction<Orders>>;
  setSeatedTablesArr: Dispatch<SetStateAction<TableId[]>>;
  setSentBatches: Dispatch<SetStateAction<SentBatches>>;
  setGutscheinAmounts: Dispatch<SetStateAction<GutscheinAmounts>>;
  setMarkedBatches: Dispatch<SetStateAction<Record<string, Set<number>>>>;
}

export function useDirectusSync(
  state: SyncState,
  setters: SyncSetters,
  showToast: (msg: string) => void
) {
  const { orders, seatedTablesArr, sentBatches, gutscheinAmounts, markedBatches } = state;
  const { setOrders, setSeatedTablesArr, setSentBatches, setGutscheinAmounts, setMarkedBatches } = setters;

  // ── Snapshot refs — let async write callbacks read current state ──────────
  const ordersRef = useRef(orders);
  const seatedTablesArrRef = useRef(seatedTablesArr);
  const sentBatchesRef = useRef(sentBatches);
  const gutscheinRef = useRef(gutscheinAmounts);
  const markedBatchesRef = useRef(markedBatches);

  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { seatedTablesArrRef.current = seatedTablesArr; }, [seatedTablesArr]);
  useEffect(() => { sentBatchesRef.current = sentBatches; }, [sentBatches]);
  useEffect(() => { gutscheinRef.current = gutscheinAmounts; }, [gutscheinAmounts]);
  useEffect(() => { markedBatchesRef.current = markedBatches; }, [markedBatches]);

  // ── Sync bookkeeping refs ─────────────────────────────────────────────────
  const sessionIdMap = useRef<Record<string, number>>({});   // tableId → Directus record id
  const lastWriteTime = useRef<Record<string, number>>({});  // tableId → epoch ms of last write
  const pendingWrites = useRef(new Set<string>());           // tableIds with in-flight writes
  const writeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const retryCounts = useRef<Record<string, number>>({});
  const wasOffline = useRef(false);                          // Track offline→online transition
  const isMounted = useRef(true);                            // Track component mount state

  useEffect(() => {
    return () => {
      isMounted.current = false;
      Object.values(writeTimers.current).forEach(clearTimeout);
    };
  }, []);

  // ── Conflict management ───────────────────────────────────────────────────
  const [conflicts, setConflicts] = useState<SessionConflict[]>([]);
  const syncPaused = useRef(false);                          // Pause auto-sync during conflict resolution

  // ── Poll remote sessions every 2s ─────────────────────────────────────────
  const { data: remoteSessions, isError: syncError } = useQuery({
    queryKey: ["table_sessions"],
    queryFn: fetchAllSessions,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    staleTime: 1000,
  });

  // ── Merge remote → local, respecting the 3s local-ownership grace period ──
  // ── Falls back to localStorage if Directus is unavailable ──────────────────
  // ── Detects conflicts when transitioning from offline to online ────────────
  useEffect(() => {
    const now = Date.now();

    // If Directus failed, load from localStorage once on the transition to offline
    if (!remoteSessions) {
      if (!wasOffline.current) {
        wasOffline.current = true;

        const newOrders: Orders = {};
        const newSeated = new Set<TableId>();
        const newSentBatches: SentBatches = {};
        const newGutschein: GutscheinAmounts = {};
        const newMarkedBatches: Record<string, Set<number>> = {};

        Object.entries(readSessionCache()).forEach(([key, session]) => {
          const tableId = parseTableId(key);
          if (session.orders?.length) newOrders[key] = session.orders;
          if (session.seated) newSeated.add(tableId);
          if (session.sent_batches?.length) newSentBatches[key] = session.sent_batches;
          if (session.gutschein != null) newGutschein[key] = session.gutschein;
          if (session.marked_batches?.length) newMarkedBatches[key] = new Set(session.marked_batches);
        });

        setOrders(newOrders);
        setSeatedTablesArr(Array.from(newSeated));
        setSentBatches(newSentBatches);
        setGutscheinAmounts(newGutschein);
        setMarkedBatches(newMarkedBatches);
      }
      return;
    }

    // If sync is paused (conflict resolution in progress), skip merge
    if (syncPaused.current) return;

    // Normal path: merge remote Directus data
    const remoteMap = new Map(remoteSessions.map((s) => [s.table_id, s]));

    remoteSessions.forEach((s) => { sessionIdMap.current[s.table_id] = s.id; });

    const isLocallyOwned = (key: string) =>
      pendingWrites.current.has(key) || now - (lastWriteTime.current[key] ?? 0) < OWNERSHIP_GRACE_MS;

    // Detect conflicts only for tables we don't locally own — avoids false positives
    // from the 500ms debounce window where localStorage is ahead of Directus.
    // Only relevant after an offline→online transition when another device may have diverged.
    if (wasOffline.current) {
      wasOffline.current = false;
      const localCache = readSessionCache();
      const unownedCache = Object.fromEntries(
        Object.entries(localCache).filter(([key]) => !isLocallyOwned(key))
      );
      const detectedConflicts = detectConflicts(unownedCache, remoteSessions);
      if (detectedConflicts.length > 0) {
        console.log(`Detected ${detectedConflicts.length} sync conflict(s)`);
        setConflicts(detectedConflicts);
        syncPaused.current = true;
        return;
      }
    }

    const allKeys = new Set([
      ...remoteMap.keys(),
      ...Object.keys(ordersRef.current),
      ...seatedTablesArrRef.current.map(String),
      ...Object.keys(sentBatchesRef.current),
      ...Object.keys(gutscheinRef.current),
      ...Object.keys(markedBatchesRef.current),
    ]);

    const newOrders: Orders = {};
    const newSeated = new Set<TableId>();
    const newSentBatches: SentBatches = {};
    const newGutschein: GutscheinAmounts = {};
    const newMarkedBatches: Record<string, Set<number>> = {};

    allKeys.forEach((key) => {
      if (isLocallyOwned(key)) {
        const tableId = parseTableId(key);
        if (ordersRef.current[key]?.length) newOrders[key] = ordersRef.current[key];
        if (seatedTablesArrRef.current.some((id) => String(id) === key)) newSeated.add(tableId);
        if (sentBatchesRef.current[key]?.length) newSentBatches[key] = sentBatchesRef.current[key];
        if (gutscheinRef.current[key] != null) newGutschein[key] = gutscheinRef.current[key];
        if (markedBatchesRef.current[key]?.size) newMarkedBatches[key] = markedBatchesRef.current[key];
      } else {
        const session = remoteMap.get(key);
        if (!session) return; // deleted remotely — drop from local state
        const tableId = parseTableId(key);
        if (session.orders?.length) newOrders[key] = session.orders;
        if (session.seated) newSeated.add(tableId);
        if (session.sent_batches?.length) newSentBatches[key] = session.sent_batches;
        if (session.gutschein != null) newGutschein[key] = session.gutschein;
        if (session.marked_batches?.length) newMarkedBatches[key] = new Set(session.marked_batches);
      }
    });

    setOrders(newOrders);
    setSeatedTablesArr(Array.from(newSeated));
    setSentBatches(newSentBatches);
    setGutscheinAmounts(newGutschein);
    setMarkedBatches(newMarkedBatches);
  }, [remoteSessions, setOrders, setSeatedTablesArr, setSentBatches, setGutscheinAmounts, setMarkedBatches]);

  // ── Debounced write: batches rapid state changes into one Directus call ───
  // ── Also writes to localStorage immediately for offline resilience ─────────
  const scheduleWrite = useCallback((tableId: TableId) => {
    const key = String(tableId);
    pendingWrites.current.add(key);
    clearTimeout(writeTimers.current[key]);

    // Capture state snapshot for immediate localStorage write (offline resilience)
    const cacheSession = {
      table_id: key,
      seated: seatedTablesArrRef.current.some((id) => String(id) === key),
      gutschein: gutscheinRef.current[key] ?? null,
      orders: ordersRef.current[key] ?? [],
      sent_batches: sentBatchesRef.current[key] ?? [],
      marked_batches: Array.from(markedBatchesRef.current[key] ?? new Set<number>()),
    };

    // Write to localStorage immediately (no debounce)
    writeSessionToCache(key, cacheSession);

    // Debounced Directus write — capture FRESH state inside timeout
    writeTimers.current[key] = setTimeout(async () => {
      // Re-capture refs to get current state (not stale snapshot from T0)
      const session = {
        table_id: key,
        seated: seatedTablesArrRef.current.some((id) => String(id) === key),
        gutschein: gutscheinRef.current[key] ?? null,
        orders: ordersRef.current[key] ?? [],
        sent_batches: sentBatchesRef.current[key] ?? [],
        marked_batches: Array.from(markedBatchesRef.current[key] ?? new Set<number>()),
      };

      try {
        const newId = await upsertSession(sessionIdMap.current[key] ?? null, session);
        sessionIdMap.current[key] = newId;
        delete retryCounts.current[key];
        pendingWrites.current.delete(key);
        lastWriteTime.current[key] = Date.now();
      } catch (e) {
        if (!isMounted.current) return;

        const attempts = (retryCounts.current[key] ?? 0) + 1;
        retryCounts.current[key] = attempts;
        console.error(`Session write failed (attempt ${attempts}/${MAX_RETRIES}):`, e);

        if (attempts < MAX_RETRIES) {
          if (attempts === 1) showToast("Table state not saved - retrying");
          // Don't update lastWriteTime on retry — keeps original grace period
          scheduleWrite(tableId);
        } else {
          showToast("Table state not saved - check network");
          delete retryCounts.current[key];
          pendingWrites.current.delete(key);
        }
      }
    }, DEBOUNCE_DELAY_MS);
  }, [showToast]);

  // ── Cancel pending write and delete session from Directus + localStorage ──
  const cancelAndDelete = useCallback((tableId: TableId) => {
    const key = String(tableId);
    clearTimeout(writeTimers.current[key]);
    pendingWrites.current.delete(key);
    delete lastWriteTime.current[key];
    delete retryCounts.current[key];

    // Remove from localStorage
    removeSessionFromCache(key);

    // Remove from Directus
    const directusId = sessionIdMap.current[key];
    if (directusId) {
      delete sessionIdMap.current[key];
      deleteSession(directusId).then((result) => {
        if (!result.success) {
          console.error(`Failed to delete session: ${result.error}`);
        }
      });
    }
  }, []);

  // ── Resolve conflict and apply chosen resolution ──────────────────────────
  const resolveConflict = useCallback((
    conflict: SessionConflict,
    resolution: "local" | "remote" | "merge"
  ) => {
    const { tableId } = conflict;
    const key = String(tableId);

    const resolvedSession: CachedSession =
      resolution === "local" ? conflict.local
      : resolution === "remote" ? conflict.remote
      : mergeSessions(conflict.local, conflict.remote);

    const tableIdParsed = parseTableId(key);

    // Apply resolved session to state — refs will be synced by useEffects (lines 40-44)
    setOrders((prev) => ({ ...prev, [key]: resolvedSession.orders }));

    setSeatedTablesArr((prev) => {
      const s = new Set(prev);
      if (resolvedSession.seated) s.add(tableIdParsed);
      else s.delete(tableIdParsed);
      return Array.from(s);
    });

    setSentBatches((prev) => ({ ...prev, [key]: resolvedSession.sent_batches }));
    setGutscheinAmounts((prev) => ({ ...prev, [key]: resolvedSession.gutschein ?? 0 }));
    setMarkedBatches((prev) => ({ ...prev, [key]: new Set(resolvedSession.marked_batches) }));

    // Remove from conflicts queue
    setConflicts((prev) => prev.filter((c) => c.tableId !== tableId));

    // Persist after refs are synced (defer until next tick to ensure useEffects have run)
    setTimeout(() => {
      scheduleWrite(tableIdParsed);
    }, 0);
  }, [scheduleWrite, setOrders, setSeatedTablesArr, setSentBatches, setGutscheinAmounts, setMarkedBatches]);

  // Resume sync when all conflicts resolved
  useEffect(() => {
    if (conflicts.length === 0 && syncPaused.current) {
      syncPaused.current = false;
      console.log("All conflicts resolved, resuming sync");
    }
  }, [conflicts]);

  // ── Mark tables as locally owned (extends grace period) ───────────────────
  const markAsLocallyOwned = useCallback((...tableIds: TableId[]) => {
    const now = Date.now();
    tableIds.forEach((tableId) => {
      lastWriteTime.current[String(tableId)] = now;
    });
  }, []);

  return { scheduleWrite, cancelAndDelete, syncError, conflicts, resolveConflict, markAsLocallyOwned };
}
