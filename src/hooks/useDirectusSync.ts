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

    // If Directus failed, use localStorage fallback
    if (!remoteSessions) {
      wasOffline.current = true;

      const cachedSessions = readSessionCache();
      const cacheMap = new Map<string, CachedSession>(Object.entries(cachedSessions));

      const newOrders: Orders = {};
      const newSeated = new Set<TableId>();
      const newSentBatches: SentBatches = {};
      const newGutschein: GutscheinAmounts = {};
      const newMarkedBatches: Record<string, Set<number>> = {};

      cacheMap.forEach((session, key) => {
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
      return;
    }

    // ── Detect conflicts on offline→online transition OR when conflicts exist ──
    if (wasOffline.current && remoteSessions.length > 0) {
      wasOffline.current = false;
    }

    // Always check for conflicts (not just on transition) to catch race conditions
    if (!syncPaused.current) {
      const localCache = readSessionCache();
      const detectedConflicts = detectConflicts(localCache, remoteSessions);

      if (detectedConflicts.length > 0) {
        console.log(`Detected ${detectedConflicts.length} sync conflict(s)`);
        setConflicts(detectedConflicts);
        syncPaused.current = true;
        return; // Pause sync until conflicts resolved
      }
    }

    // If sync is paused (conflict resolution in progress), skip merge
    if (syncPaused.current) return;

    // Normal path: merge remote Directus data
    const remoteMap = new Map(remoteSessions.map((s) => [s.table_id, s]));

    remoteSessions.forEach((s) => { sessionIdMap.current[s.table_id] = s.id; });

    const isLocallyOwned = (key: string) =>
      pendingWrites.current.has(key) || now - (lastWriteTime.current[key] ?? 0) < OWNERSHIP_GRACE_MS;

    const allKeys = new Set([
      ...remoteMap.keys(),
      ...Object.keys(ordersRef.current),
      ...seatedTablesArrRef.current.map(String),
      ...Object.keys(sentBatchesRef.current),
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

    const session = {
      table_id: key,
      seated: seatedTablesArrRef.current.some((id) => String(id) === key),
      gutschein: gutscheinRef.current[key] ?? null,
      orders: ordersRef.current[key] ?? [],
      sent_batches: sentBatchesRef.current[key] ?? [],
      marked_batches: Array.from(markedBatchesRef.current[key] ?? new Set<number>()),
    };

    // Write to localStorage immediately (no debounce)
    writeSessionToCache(key, session);

    // Debounced Directus write
    writeTimers.current[key] = setTimeout(async () => {
      try {
        const newId = await upsertSession(sessionIdMap.current[key] ?? null, session);
        sessionIdMap.current[key] = newId;
        delete retryCounts.current[key];
        pendingWrites.current.delete(key);
        lastWriteTime.current[key] = Date.now();
      } catch (e) {
        const attempts = (retryCounts.current[key] ?? 0) + 1;
        retryCounts.current[key] = attempts;
        console.error(`Session write failed (attempt ${attempts}/${MAX_RETRIES}):`, e);

        if (attempts < MAX_RETRIES) {
          if (attempts === 1) showToast("Table state not saved - retrying");
          lastWriteTime.current[key] = Date.now();
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

    // Remove from localStorage
    removeSessionFromCache(key);

    // Remove from Directus
    const directusId = sessionIdMap.current[key];
    if (directusId) {
      delete sessionIdMap.current[key];
      deleteSession(directusId).catch(console.error);
    }
  }, []);

  // ── Resolve conflict and apply chosen resolution ──────────────────────────
  const resolveConflict = useCallback((
    conflict: SessionConflict,
    resolution: "local" | "remote" | "merge"
  ) => {
    const { tableId } = conflict;
    const key = String(tableId);

    let resolvedSession: CachedSession;

    switch (resolution) {
      case "local":
        resolvedSession = conflict.local;
        break;
      case "remote":
        resolvedSession = conflict.remote;
        break;
      case "merge":
        resolvedSession = mergeSessions(conflict.local, conflict.remote);
        break;
    }

    // Apply resolved session to state
    setOrders((prev) => ({
      ...prev,
      [key]: resolvedSession.orders,
    }));

    setSeatedTablesArr((prev) => {
      const s = new Set(prev);
      if (resolvedSession.seated) s.add(parseTableId(key));
      else s.delete(parseTableId(key));
      return Array.from(s);
    });

    setSentBatches((prev) => ({
      ...prev,
      [key]: resolvedSession.sent_batches,
    }));

    setGutscheinAmounts((prev) => ({
      ...prev,
      [key]: resolvedSession.gutschein ?? 0,
    }));

    setMarkedBatches((prev) => ({
      ...prev,
      [key]: new Set(resolvedSession.marked_batches),
    }));

    // Write resolved session to both localStorage and Directus
    writeSessionToCache(key, resolvedSession);
    scheduleWrite(parseTableId(key));

    // Remove from conflicts queue
    setConflicts((prev) => prev.filter((c) => c.tableId !== tableId));
  }, [scheduleWrite, setOrders, setSeatedTablesArr, setSentBatches, setGutscheinAmounts, setMarkedBatches]);

  // Resume sync when all conflicts resolved
  useEffect(() => {
    if (conflicts.length === 0 && syncPaused.current) {
      syncPaused.current = false;
      console.log("All conflicts resolved, resuming sync");
    }
  }, [conflicts]);

  return { scheduleWrite, cancelAndDelete, syncError, conflicts, resolveConflict };
}
