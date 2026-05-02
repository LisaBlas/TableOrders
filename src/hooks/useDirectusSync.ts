import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllSessions, upsertSession, deleteSession, parseTableId, type TableSession } from "../services/directusSessions";
import type { Orders, SentBatches, GutscheinAmounts, TableId, MarkedBatchId } from "../types";
import { DEBOUNCE_DELAY_MS, POLL_INTERVAL_MS, OWNERSHIP_GRACE_MS } from "../config/appConfig";
import {
  readDirtySessionRecords,
  readSessionCache,
  writeSessionToCache,
  removeSessionFromCache,
  removeSessionDataFromCache,
  markSessionDirty,
  markSessionDeleted,
  updateDirtyLocalSession,
  clearSessionDirty,
  sessionHash,
  type CachedSession,
} from "../utils/sessionStorage";
import { detectDirtySessionConflicts, mergeSessions, type SessionConflict } from "../utils/conflictDetection";

interface SyncState {
  orders: Orders;
  seatedTablesArr: TableId[];
  sentBatches: SentBatches;
  gutscheinAmounts: GutscheinAmounts;
  markedBatches: Record<string, Set<MarkedBatchId>>;
}

interface SyncSetters {
  setOrders: Dispatch<SetStateAction<Orders>>;
  setSeatedTablesArr: Dispatch<SetStateAction<TableId[]>>;
  setSentBatches: Dispatch<SetStateAction<SentBatches>>;
  setGutscheinAmounts: Dispatch<SetStateAction<GutscheinAmounts>>;
  setMarkedBatches: Dispatch<SetStateAction<Record<string, Set<MarkedBatchId>>>>;
}

const jsonEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const tableIdsEqual = (a: TableId[], b: TableId[]) => {
  if (a.length !== b.length) return false;
  const bKeys = new Set(b.map(String));
  return a.every((id) => bKeys.has(String(id)));
};

const markedBatchesEqual = (
  a: Record<string, Set<MarkedBatchId>>,
  b: Record<string, Set<MarkedBatchId>>
) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const aSet = a[key] ?? new Set<MarkedBatchId>();
    const bSet = b[key] ?? new Set<MarkedBatchId>();
    if (aSet.size !== bSet.size) return false;
    for (const value of aSet) {
      if (!bSet.has(value)) return false;
    }
  }
  return true;
};

const hasSessionData = (session: CachedSession | undefined) =>
  !!session && (
    session.seated ||
    session.orders.length > 0 ||
    session.sent_batches.length > 0 ||
    session.gutschein != null ||
    session.marked_batches.length > 0
  );

const remoteToCachedSession = (session: Omit<TableSession, "id">): CachedSession => ({
  table_id: session.table_id,
  seated: session.seated,
  gutschein: session.gutschein,
  orders: session.orders ?? [],
  sent_batches: session.sent_batches ?? [],
  marked_batches: session.marked_batches ?? [],
});

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
  const remoteSessionsRef = useRef<TableSession[] | undefined>(undefined);

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
  const failedWriteKeys = useRef(new Set<string>());
  const retryingFailedWrites = useRef(new Set<string>());
  const [hasFailedWrites, setHasFailedWrites] = useState(false);
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
  const { data: remoteSessions, isError: syncError, refetch: refetchSessions } = useQuery({
    queryKey: ["table_sessions"],
    queryFn: fetchAllSessions,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    staleTime: 1000,
  });

  useEffect(() => { remoteSessionsRef.current = remoteSessions; }, [remoteSessions]);

  useEffect(() => {
    const triggerReconnectSync = () => {
      const hasDirtySessions = Object.keys(readDirtySessionRecords()).length > 0;
      if (!hasDirtySessions && failedWriteKeys.current.size === 0) return;

      wasOffline.current = true;
      void refetchSessions();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") triggerReconnectSync();
    };

    window.addEventListener("online", triggerReconnectSync);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("online", triggerReconnectSync);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refetchSessions]);

  useEffect(() => {
    const existingCache = readSessionCache();
    const dirtyRecords = readDirtySessionRecords();
    Object.entries(dirtyRecords).forEach(([key, record]) => {
      if (record.operation === "delete") return;

      const session = {
        table_id: key,
        seated: seatedTablesArr.some((id) => String(id) === key),
        gutschein: gutscheinAmounts[key] ?? null,
        orders: orders[key] ?? [],
        sent_batches: sentBatches[key] ?? [],
        marked_batches: Array.from(markedBatches[key] ?? new Set<MarkedBatchId>()),
      };

      if (!hasSessionData(session) && hasSessionData(existingCache[key])) return;

      writeSessionToCache(key, session, false);
      updateDirtyLocalSession(key, session);
    });
  }, [orders, seatedTablesArr, sentBatches, gutscheinAmounts, markedBatches]);

  const readCurrentSession = useCallback((key: string): CachedSession => ({
    table_id: key,
    seated: seatedTablesArrRef.current.some((id) => String(id) === key),
    gutschein: gutscheinRef.current[key] ?? null,
    orders: ordersRef.current[key] ?? [],
    sent_batches: sentBatchesRef.current[key] ?? [],
    marked_batches: Array.from(markedBatchesRef.current[key] ?? new Set<MarkedBatchId>()),
  }), []);

  const persistLocalSnapshot = useCallback((key: string) => {
    const session = readCurrentSession(key);
    writeSessionToCache(key, session, false);
    updateDirtyLocalSession(key, session);
    return session;
  }, [readCurrentSession]);

  // ── Merge remote → local, respecting the 3s local-ownership grace period ──
  // ── Falls back to localStorage if Directus is unavailable ──────────────────
  // ── Detects conflicts when transitioning from offline to online ────────────
  useEffect(() => {
    const now = Date.now();

    // If Directus failed, load from localStorage once on the transition to offline.
    // This runs before the data check because TanStack Query can retain stale
    // data from a previous successful poll after a later refetch fails.
    if (syncError) {
      if (!wasOffline.current) {
        wasOffline.current = true;

        const newOrders: Orders = {};
        const newSeated = new Set<TableId>();
        const newSentBatches: SentBatches = {};
        const newGutschein: GutscheinAmounts = {};
        const newMarkedBatches: Record<string, Set<MarkedBatchId>> = {};

        const dirtyRecords = readDirtySessionRecords();
        const cache = readSessionCache();
        const offlineSessions = new Map<string, CachedSession>();

        Object.entries(cache).forEach(([key, session]) => {
          offlineSessions.set(key, session);
        });

        Object.entries(dirtyRecords).forEach(([key, record]) => {
          if (record.operation === "delete") {
            offlineSessions.delete(key);
            return;
          }
          if (record.local_session) offlineSessions.set(key, record.local_session);
        });

        Object.entries(ordersRef.current).forEach(([key, value]) => {
          if (value.length) offlineSessions.set(key, readCurrentSession(key));
        });
        seatedTablesArrRef.current.forEach((id) => offlineSessions.set(String(id), readCurrentSession(String(id))));
        Object.keys(sentBatchesRef.current).forEach((key) => offlineSessions.set(key, readCurrentSession(key)));
        Object.keys(gutscheinRef.current).forEach((key) => offlineSessions.set(key, readCurrentSession(key)));
        Object.keys(markedBatchesRef.current).forEach((key) => offlineSessions.set(key, readCurrentSession(key)));

        offlineSessions.forEach((session, key) => {
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

    // While the first query is still loading, do nothing. Treating initial
    // undefined data as offline makes every reload look like a reconnect.
    if (!remoteSessions) {
      return;
    }

    // If sync is paused (conflict resolution in progress), skip merge
    if (syncPaused.current) return;

    // Normal path: merge remote Directus data
    const remoteMap = new Map(remoteSessions.map((s) => [s.table_id, s]));

    remoteSessions.forEach((s) => { sessionIdMap.current[s.table_id] = s.id; });

    const dirtyRecords = readDirtySessionRecords();
    const durableDirtyKeys = new Set(Object.keys(dirtyRecords));
    const reconnectingFromOffline = wasOffline.current;
    const hasFailedWritesNow = failedWriteKeys.current.size > 0;
    const shouldReadLocalCache = wasOffline.current ||
      failedWriteKeys.current.size > 0 ||
      durableDirtyKeys.size > 0;
    const localCache = shouldReadLocalCache ? readSessionCache() : {};
    const dirtyUpsertKeys = new Set(
      Object.entries(dirtyRecords)
        .filter(([, record]) => record.operation === "upsert" && hasSessionData(record.local_session ?? localCache[record.table_id]))
        .map(([key]) => key)
    );
    const dirtyDeleteKeys = new Set(
      Object.entries(dirtyRecords)
        .filter(([, record]) => record.operation === "delete")
        .map(([key]) => key)
    );

    durableDirtyKeys.forEach((key) => {
      if (!dirtyUpsertKeys.has(key) && !dirtyDeleteKeys.has(key) && !pendingWrites.current.has(key) && !failedWriteKeys.current.has(key)) {
        clearSessionDirty(key);
      }
    });

    const isLocallyOwned = (key: string) =>
      pendingWrites.current.has(key) ||
      failedWriteKeys.current.has(key) ||
      (reconnectingFromOffline && dirtyUpsertKeys.has(key)) ||
      now - (lastWriteTime.current[key] ?? 0) < OWNERSHIP_GRACE_MS;

    // Detect conflicts for dirty local sessions before retrying or accepting
    // remote state. Dirty keys persist through refreshes after offline edits.
    if (reconnectingFromOffline || hasFailedWritesNow) {
      const includePendingWrites = wasOffline.current;
      wasOffline.current = false;
      const dirtyCandidates = { ...dirtyRecords };
      [...failedWriteKeys.current, ...(includePendingWrites ? pendingWrites.current : [])].forEach((key) => {
        const localSession = hasSessionData(readCurrentSession(key)) ? readCurrentSession(key) : localCache[key];
        if (!localSession) return;
        dirtyCandidates[key] = dirtyCandidates[key] ?? {
          table_id: key,
          operation: "upsert",
          base_hash: sessionHash(remoteMap.get(key) ? remoteToCachedSession(remoteMap.get(key)!) : null),
          base_session: remoteMap.get(key) ? remoteToCachedSession(remoteMap.get(key)!) : null,
          local_session: localSession,
          last_local_edit_at: new Date().toISOString(),
          client_id: "runtime",
        };
      });
      const detectedConflicts = detectDirtySessionConflicts(dirtyCandidates, remoteSessions);
      if (detectedConflicts.length > 0) {
        console.log(`Detected ${detectedConflicts.length} sync conflict(s)`);
        setConflicts(detectedConflicts);
        syncPaused.current = true;
        return;
      }
    } else {
      wasOffline.current = false;
    }

    const allKeys = new Set([
      ...remoteMap.keys(),
      ...Object.keys(ordersRef.current),
      ...seatedTablesArrRef.current.map(String),
      ...Object.keys(sentBatchesRef.current),
      ...Object.keys(gutscheinRef.current),
      ...Object.keys(markedBatchesRef.current),
      ...dirtyUpsertKeys,
    ]);

    const newOrders: Orders = {};
    const newSeated = new Set<TableId>();
    const newSentBatches: SentBatches = {};
    const newGutschein: GutscheinAmounts = {};
    const newMarkedBatches: Record<string, Set<MarkedBatchId>> = {};

    allKeys.forEach((key) => {
      if (dirtyDeleteKeys.has(key)) {
        removeSessionDataFromCache(key);
        return;
      }

      if (isLocallyOwned(key)) {
        const dirtySession = dirtyRecords[key]?.local_session;
        const cachedSession = dirtySession ?? localCache[key];
        const tableId = parseTableId(key);
        const localOrders = dirtySession?.orders ?? ordersRef.current[key] ?? cachedSession?.orders;
        const localSentBatches = dirtySession?.sent_batches ?? sentBatchesRef.current[key] ?? cachedSession?.sent_batches;
        const localGutschein = dirtySession?.gutschein ?? gutscheinRef.current[key] ?? cachedSession?.gutschein;
        const localMarkedBatches = dirtySession?.marked_batches
          ? new Set(dirtySession.marked_batches)
          : markedBatchesRef.current[key] ??
            (cachedSession?.marked_batches ? new Set(cachedSession.marked_batches) : undefined);
        const localSeated = dirtySession?.seated ||
          seatedTablesArrRef.current.some((id) => String(id) === key) ||
          cachedSession?.seated;

        if (localOrders?.length) newOrders[key] = localOrders;
        if (localSeated) newSeated.add(tableId);
        if (localSentBatches?.length) newSentBatches[key] = localSentBatches;
        if (localGutschein != null) newGutschein[key] = localGutschein;
        if (localMarkedBatches?.size) newMarkedBatches[key] = localMarkedBatches;
      } else {
        const session = remoteMap.get(key);
        if (!session) {
          // Deleted remotely - drop from local state and offline cache.
          removeSessionFromCache(key);
          return;
        }
        const tableId = parseTableId(key);
        if (session.orders?.length) newOrders[key] = session.orders;
        if (session.seated) newSeated.add(tableId);
        if (session.sent_batches?.length) newSentBatches[key] = session.sent_batches;
        if (session.gutschein != null) newGutschein[key] = session.gutschein;
        if (session.marked_batches?.length) newMarkedBatches[key] = new Set(session.marked_batches);
        writeSessionToCache(key, remoteToCachedSession(session));
      }
    });

    const newSeatedArr = Array.from(newSeated);
    if (!jsonEqual(newOrders, ordersRef.current)) setOrders(newOrders);
    if (!tableIdsEqual(newSeatedArr, seatedTablesArrRef.current)) setSeatedTablesArr(newSeatedArr);
    if (!jsonEqual(newSentBatches, sentBatchesRef.current)) setSentBatches(newSentBatches);
    if (!jsonEqual(newGutschein, gutscheinRef.current)) setGutscheinAmounts(newGutschein);
    if (!markedBatchesEqual(newMarkedBatches, markedBatchesRef.current)) setMarkedBatches(newMarkedBatches);

    failedWriteKeys.current.forEach((key) => {
      if (pendingWrites.current.has(key) || retryingFailedWrites.current.has(key)) return;

      retryingFailedWrites.current.add(key);
      setTimeout(() => {
        scheduleWrite(parseTableId(key));
      }, 0);
    });

    dirtyUpsertKeys.forEach((key) => {
      if (pendingWrites.current.has(key) || retryingFailedWrites.current.has(key)) return;

      retryingFailedWrites.current.add(key);
      setTimeout(() => {
        scheduleWrite(parseTableId(key));
      }, 0);
    });

    dirtyDeleteKeys.forEach((key) => {
      if (pendingWrites.current.has(key) || retryingFailedWrites.current.has(key)) return;

      const directusId = sessionIdMap.current[key] ?? remoteMap.get(key)?.id;
      if (!directusId) {
        clearSessionDirty(key);
        removeSessionDataFromCache(key);
        return;
      }

      retryingFailedWrites.current.add(key);
      deleteSession(directusId).then((result) => {
        retryingFailedWrites.current.delete(key);
        if (result.success) {
          delete sessionIdMap.current[key];
          failedWriteKeys.current.delete(key);
          clearSessionDirty(key);
          removeSessionFromCache(key);
          setHasFailedWrites(failedWriteKeys.current.size > 0);
        } else {
          failedWriteKeys.current.add(key);
          setHasFailedWrites(true);
        }
      });
    });
  }, [remoteSessions, syncError, setOrders, setSeatedTablesArr, setSentBatches, setGutscheinAmounts, setMarkedBatches]);

  // ── Debounced write: batches rapid state changes into one Directus call ───
  // ── Also writes to localStorage immediately for offline resilience ─────────
  const scheduleWrite = useCallback((tableId: TableId) => {
    const key = String(tableId);
    pendingWrites.current.add(key);
    clearTimeout(writeTimers.current[key]);

    // Persist the dirty marker immediately. A state effect writes the committed
    // table snapshot to localStorage after React applies the edit.
    const existingDirtyRecord = readDirtySessionRecords()[key];
    const remoteBase = remoteSessionsRef.current?.find((s) => s.table_id === key);
    const baseSession = existingDirtyRecord?.base_session ??
      (remoteBase ? remoteToCachedSession(remoteBase) : readSessionCache()[key] ?? null);
    markSessionDirty(key, existingDirtyRecord?.local_session ?? null, baseSession);

    setTimeout(() => {
      const record = readDirtySessionRecords()[key];
      if (isMounted.current && record?.operation === "upsert" && !record.local_session) {
        persistLocalSnapshot(key);
      }
    }, 0);

    // Debounced Directus write — capture FRESH state inside timeout
    const writeToDirectus = async () => {
      const existingDirty = readDirtySessionRecords()[key];
      const session = existingDirty?.operation === "upsert" && existingDirty.local_session
        ? existingDirty.local_session
        : persistLocalSnapshot(key);

      try {
        const dirtyRecord = readDirtySessionRecords()[key];
        const shouldCheckConflictBeforeWrite = failedWriteKeys.current.has(key);
        if (dirtyRecord && shouldCheckConflictBeforeWrite) {
          const freshRemoteSessions = await fetchAllSessions();
          remoteSessionsRef.current = freshRemoteSessions;
          freshRemoteSessions.forEach((s) => { sessionIdMap.current[s.table_id] = s.id; });

          const detectedConflicts = detectDirtySessionConflicts({ [key]: dirtyRecord }, freshRemoteSessions);
          if (detectedConflicts.length > 0) {
            setConflicts((prev) => prev.some((c) => c.tableId === key)
              ? prev
              : [...prev, detectedConflicts[0]]);
            syncPaused.current = true;
            pendingWrites.current.delete(key);
            retryingFailedWrites.current.delete(key);
            failedWriteKeys.current.add(key);
            setHasFailedWrites(true);
            return;
          }
        }

        const newId = await upsertSession(sessionIdMap.current[key] ?? null, session);
        sessionIdMap.current[key] = newId;
        writeSessionToCache(key, session);
        pendingWrites.current.delete(key);
        retryingFailedWrites.current.delete(key);
        failedWriteKeys.current.delete(key);
        clearSessionDirty(key);
        setHasFailedWrites(failedWriteKeys.current.size > 0);
        lastWriteTime.current[key] = Date.now();
      } catch (e) {
        if (!isMounted.current) return;

        console.error("Session write failed:", e);
        showToast("Table state saved locally - will retry when connection returns");
        pendingWrites.current.delete(key);
        retryingFailedWrites.current.delete(key);
        failedWriteKeys.current.add(key);
        setHasFailedWrites(true);
      }
    };

    writeTimers.current[key] = setTimeout(writeToDirectus, DEBOUNCE_DELAY_MS);
  }, [persistLocalSnapshot, showToast]);

  // ── Cancel pending write and delete session from Directus + localStorage ──
  const cancelAndDelete = useCallback((tableId: TableId) => {
    const key = String(tableId);
    clearTimeout(writeTimers.current[key]);
    pendingWrites.current.delete(key);
    retryingFailedWrites.current.delete(key);
    delete lastWriteTime.current[key];

    const remoteBase = remoteSessionsRef.current?.find((s) => s.table_id === key);
    const baseSession = remoteBase ? remoteToCachedSession(remoteBase) : readSessionCache()[key] ?? readCurrentSession(key);
    markSessionDeleted(key, hasSessionData(baseSession) ? baseSession : null);
    removeSessionDataFromCache(key);

    // Remove from Directus
    const directusId = sessionIdMap.current[key] ?? remoteBase?.id;
    if (directusId) {
      deleteSession(directusId).then((result) => {
        if (result.success) {
          delete sessionIdMap.current[key];
          failedWriteKeys.current.delete(key);
          clearSessionDirty(key);
          removeSessionFromCache(key);
          setHasFailedWrites(failedWriteKeys.current.size > 0);
        } else {
          failedWriteKeys.current.add(key);
          setHasFailedWrites(true);
          console.error(`Failed to delete session: ${result.error}`);
        }
      });
    } else if (!hasSessionData(baseSession)) {
      failedWriteKeys.current.delete(key);
      clearSessionDirty(key);
      setHasFailedWrites(failedWriteKeys.current.size > 0);
    } else {
      failedWriteKeys.current.add(key);
      setHasFailedWrites(true);
    }
  }, [readCurrentSession]);

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

    clearTimeout(writeTimers.current[key]);
    pendingWrites.current.delete(key);
    retryingFailedWrites.current.delete(key);
    failedWriteKeys.current.delete(key);
    clearSessionDirty(key);
    setHasFailedWrites(failedWriteKeys.current.size > 0);

    // Apply resolved session to state — refs will be synced by useEffects (lines 40-44)
    setOrders((prev) => {
      const next = { ...prev };
      if (resolvedSession.orders.length) next[key] = resolvedSession.orders;
      else delete next[key];
      return next;
    });

    setSeatedTablesArr((prev) => {
      const s = new Set(prev);
      if (resolvedSession.seated) s.add(tableIdParsed);
      else s.delete(tableIdParsed);
      return Array.from(s);
    });

    setSentBatches((prev) => {
      const next = { ...prev };
      if (resolvedSession.sent_batches.length) next[key] = resolvedSession.sent_batches;
      else delete next[key];
      return next;
    });
    setGutscheinAmounts((prev) => {
      const next = { ...prev };
      if (resolvedSession.gutschein != null) next[key] = resolvedSession.gutschein;
      else delete next[key];
      return next;
    });
    setMarkedBatches((prev) => {
      const next = { ...prev };
      if (resolvedSession.marked_batches.length) next[key] = new Set(resolvedSession.marked_batches);
      else delete next[key];
      return next;
    });

    // Remove from conflicts queue
    setConflicts((prev) => prev.filter((c) => c.tableId !== tableId));

    if (resolution === "remote") {
      writeSessionToCache(key, resolvedSession);
      lastWriteTime.current[key] = Date.now();
      return;
    }

    markSessionDirty(key, resolvedSession, conflict.remote);
    writeSessionToCache(key, resolvedSession, false);

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

  return { scheduleWrite, cancelAndDelete, syncError: syncError || hasFailedWrites, conflicts, resolveConflict, markAsLocallyOwned };
}
