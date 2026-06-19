import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useLongPress } from "../hooks/useLongPress";
import { useTableSwap } from "../hooks/useTableSwap";
import { ScreenHeader } from "../components/ScreenHeader";
import { SwapSheet } from "../components/SwapSheet";
import {
  fetchAllPermanentTableRecords,
  createPermanentTable,
  patchPermanentTable,
  type PermanentTableRecord,
} from "../services/directusTables";
import { colors, radii } from "../styles/tokens";
import { S } from "../styles/appStyles";
import type { TableId } from "../types";

// ── Helpers ────────────────────────────────────────────────────────────────

function chipFontSize(label: string): number {
  const len = label.length;
  if (len <= 3) return 20;
  if (len <= 6) return 15;
  if (len <= 9) return 12;
  return 10;
}

function resolveGrid(bp: ReturnType<typeof useBreakpoint>): React.CSSProperties {
  if (bp.isDesktop) return S.gridDesktop;
  if (bp.isLaptop) return S.gridLaptop;
  if (bp.isTabletLandscape) return S.gridTabletLandscape;
  if (bp.isTablet) return S.gridTablet;
  return S.grid;
}

// ── Styles ─────────────────────────────────────────────────────────────────

const SECTION_LABEL: React.CSSProperties = {
  padding: "20px 16px 10px",
  fontSize: 12,
  fontWeight: 600,
  color: colors.subtle,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const ARCHIVE_BTN: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "20px 16px 10px",
  fontSize: 12,
  fontWeight: 600,
  color: colors.subtle,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  width: "100%",
  textAlign: "left",
};

const CHIP: React.CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: 72,
  borderRadius: radii.lg,
  padding: "6px 8px",
  userSelect: "none",
  WebkitUserSelect: "none",
  boxSizing: "border-box",
  background: colors.surface,
  border: `1.5px solid ${colors.border}`,
  cursor: "pointer",
};

const SHEET_INPUT: React.CSSProperties = {
  flex: 1,
  padding: "9px 12px",
  fontSize: 15,
  border: `1.5px solid ${colors.fg}`,
  borderRadius: radii.sm,
  outline: "none",
  fontFamily: "inherit",
  background: colors.inputBg,
  color: colors.fg,
  boxSizing: "border-box" as const,
};

// ── Component ──────────────────────────────────────────────────────────────

export function TableSetupView() {
  const { setView, showToast } = useApp();
  const { reloadTablesConfig } = useTable();
  const bp = useBreakpoint();

  const [records, setRecords] = useState<PermanentTableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [showNewTableInput, setShowNewTableInput] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PermanentTableRecord | null>(null);
  const [sheetLabel, setSheetLabel] = useState("");
  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const newTableInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllPermanentTableRecords();
      setRecords(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg.slice(0, 80));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const activeRecords = records
    .filter((r) => r.active !== false)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id);
  const archivedRecords = records.filter((r) => r.active === false);

  const executeSwap = useCallback(async (aId: TableId, bId: TableId) => {
    const a = records.find((r) => r.id === Number(aId));
    const b = records.find((r) => r.id === Number(bId));
    if (!a || !b) return;
    const sortA = a.sort ?? 0;
    const sortB = b.sort ?? 0;
    setRecords((prev) => prev.map((r) => {
      if (r.id === a.id) return { ...r, sort: sortB };
      if (r.id === b.id) return { ...r, sort: sortA };
      return r;
    }));
    try {
      await Promise.all([
        patchPermanentTable(a.id, { sort: sortB }),
        patchPermanentTable(b.id, { sort: sortA }),
      ]);
      reloadTablesConfig();
    } catch {
      showToast("Failed to reorder — refreshing");
      load();
    }
  }, [records, reloadTablesConfig, showToast, load]);

  const swap = useTableSwap(executeSwap);

  const activateSwap = useCallback((id: TableId) => {
    setSelectedRecord(null);
    swap.activate(id);
  }, [swap.activate]);

  const { start: startLongPress, cancel: cancelLongPress, didFireRef: longFiredRef } =
    useLongPress<TableId>(activateSwap);

  const closeSheet = () => setSelectedRecord(null);

  const handleChipClick = (r: PermanentTableRecord) => {
    if (swap.isActive) {
      if (r.id !== swap.sourceTable) swap.selectTarget(r.id);
      return;
    }
    if (longFiredRef.current) return;
    cancelLongPress();
    setSelectedRecord(r);
    setSheetLabel(r.label);
  };

  const handleSheetRename = async () => {
    if (!selectedRecord) return;
    const trimmed = sheetLabel.trim();
    if (!trimmed || trimmed === selectedRecord.label) { closeSheet(); return; }
    setSaving(true);
    try {
      await patchPermanentTable(selectedRecord.id, { label: trimmed });
      setRecords((prev) => prev.map((t) => t.id === selectedRecord.id ? { ...t, label: trimmed } : t));
      reloadTablesConfig();
      closeSheet();
    } catch {
      showToast("Failed to rename table");
    } finally {
      setSaving(false);
    }
  };

  const handleSheetArchive = async () => {
    if (!selectedRecord) return;
    const r = selectedRecord;
    closeSheet();
    setSaving(true);
    try {
      await patchPermanentTable(r.id, { active: false });
      setRecords((prev) => prev.map((t) => t.id === r.id ? { ...t, active: false } : t));
      reloadTablesConfig();
      showToast(`"${r.label}" archived`);
    } catch {
      showToast("Failed to archive table");
    } finally {
      setSaving(false);
    }
  };

  const handleSheetReorder = () => {
    if (!selectedRecord) return;
    activateSwap(selectedRecord.id);
  };

  const reactivate = async (r: PermanentTableRecord) => {
    setSaving(true);
    try {
      await patchPermanentTable(r.id, { active: true });
      setRecords((prev) => prev.map((t) => t.id === r.id ? { ...t, active: true } : t));
      reloadTablesConfig();
      showToast(`"${r.label}" restored`);
    } catch {
      showToast("Failed to restore table");
    } finally {
      setSaving(false);
    }
  };

  const addTable = async () => {
    const label = newLabel.trim();
    if (!label) return;
    const maxOrder = activeRecords.reduce((m, r) => Math.max(m, r.sort ?? 0), 0);
    setSaving(true);
    try {
      const created = await createPermanentTable(label, maxOrder + 10);
      setRecords((prev) => [...prev, created]);
      reloadTablesConfig();
      setNewLabel("");
      setShowNewTableInput(false);
      showToast(`"${label}" added`);
    } catch {
      showToast("Failed to add table");
    } finally {
      setSaving(false);
    }
  };

  const gridStyle = resolveGrid(bp);
  const isSwapMode = swap.isActive;
  const sourceLabel = activeRecords.find((r) => r.id === swap.sourceTable)?.label;
  const targetLabel = activeRecords.find((r) => r.id === swap.targetTable)?.label;
  const swapHintText = swap.targetTable !== null && targetLabel
    ? `${sourceLabel} ↔ ${targetLabel}`
    : "Tap another table to swap positions";

  return (
    <div style={S.page}>
      <ScreenHeader
        title="Table Setup"
        left="back"
        onBack={() => setView("tables")}
        right={
          !isSwapMode && (
            <button
              style={{ ...S.headerActionBtn, opacity: saving ? 0.5 : 1 }}
              disabled={saving}
              onClick={() => {
                setSelectedRecord(null);
                setNewLabel("");
                setShowNewTableInput(true);
                setTimeout(() => newTableInputRef.current?.focus(), 0);
              }}
            >
              + New table
            </button>
          )
        }
      />

      <div style={{ paddingBottom: 32 }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: colors.subtle, fontSize: 14 }}>
            Loading…
          </div>
        ) : (
          <>
            <div style={SECTION_LABEL}>Active</div>

            {showNewTableInput && (
              <div style={{ padding: "0 16px 12px", display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  ref={newTableInputRef}
                  type="text"
                  placeholder="Table name"
                  maxLength={10}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTable();
                    if (e.key === "Escape") { setShowNewTableInput(false); setNewLabel(""); }
                  }}
                  onBlur={() => { if (!newLabel.trim()) setShowNewTableInput(false); }}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    fontSize: 15,
                    border: `1.5px solid ${colors.fg}`,
                    borderRadius: radii.sm,
                    outline: "none",
                    fontFamily: "inherit",
                    background: colors.inputBg,
                    color: colors.fg,
                    boxSizing: "border-box" as const,
                  }}
                />
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={addTable}
                  disabled={saving || !newLabel.trim()}
                  style={{
                    padding: "9px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    background: colors.fg,
                    color: colors.bg,
                    border: "none",
                    borderRadius: radii.sm,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    opacity: !newLabel.trim() ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                >
                  Add
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setShowNewTableInput(false); setNewLabel(""); }}
                  style={{
                    padding: "9px 12px",
                    fontSize: 14,
                    background: "none",
                    color: colors.subtle,
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: radii.sm,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    flexShrink: 0,
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            <div style={gridStyle}>
              {activeRecords.length === 0 && (
                <div style={{ gridColumn: "1 / -1", color: colors.subtle, fontSize: 14, paddingBottom: 4 }}>
                  No active tables yet
                </div>
              )}

              {activeRecords.map((r) => {
                const isSource = swap.sourceTable === r.id;
                const isTarget = swap.targetTable === r.id;

                return (
                  <div
                    key={r.id}
                    style={{
                      ...CHIP,
                      ...(isSource && {
                        background: colors.infoBg,
                        border: `1.5px solid ${colors.info}`,
                      }),
                      ...(isTarget && {
                        background: colors.successBg,
                        border: `1.5px solid ${colors.success}`,
                      }),
                      ...(isSwapMode && !isSource && !isTarget && { opacity: 0.6 }),
                    }}
                    onPointerDown={!isSwapMode ? () => startLongPress(r.id) : undefined}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    onPointerCancel={cancelLongPress}
                    onClick={() => handleChipClick(r)}
                  >
                    <span style={{
                      fontSize: chipFontSize(r.label),
                      fontWeight: 700,
                      color: isSource ? colors.info : isTarget ? colors.success : colors.fg,
                      lineHeight: 1.1,
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}>
                      {r.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "10px 16px 0", fontSize: 12, color: isSwapMode ? colors.info : colors.subtle }}>
              {isSwapMode ? "Tap another table to swap positions" : "Tap to edit · Hold to reorder"}
            </div>

            {/* Archived section */}
            {archivedRecords.length > 0 && (
              <>
                <button
                  style={ARCHIVE_BTN}
                  onClick={() => setArchivedExpanded((v) => !v)}
                  aria-expanded={archivedExpanded}
                >
                  <span style={{
                    display: "inline-block",
                    transform: archivedExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                    fontSize: 14,
                    lineHeight: 1,
                  }}>›</span>
                  Archived
                  <span style={{ fontWeight: 400, opacity: 0.7 }}>({archivedRecords.length})</span>
                </button>

                {archivedExpanded && (
                  <div style={gridStyle}>
                    {archivedRecords.map((r) => (
                      <div
                        key={r.id}
                        style={{ ...CHIP, opacity: 0.5 }}
                        onClick={() => reactivate(r)}
                      >
                        <span style={{
                          fontSize: chipFontSize(r.label),
                          fontWeight: 700,
                          color: colors.fg,
                          lineHeight: 1.1,
                          textAlign: "center",
                          wordBreak: "break-all",
                        }}>
                          {r.label}
                        </span>
                        <span style={{ fontSize: 10, color: colors.subtle, marginTop: 4 }}>restore</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Table action bottom sheet */}
      {selectedRecord && (
        <>
          <div style={S.variantSheetOverlay} onClick={closeSheet} />
          <div style={S.variantSheet}>
            <div style={S.variantSheetHeader}>{selectedRecord.label}</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: colors.subtle,
                marginBottom: 8,
                letterSpacing: "0.04em",
                textTransform: "uppercase" as const,
              }}>
                Rename
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  maxLength={10}
                  value={sheetLabel}
                  onChange={(e) => setSheetLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSheetRename();
                    if (e.key === "Escape") closeSheet();
                  }}
                  disabled={saving}
                  style={SHEET_INPUT}
                />
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSheetRename}
                  disabled={saving || !sheetLabel.trim()}
                  style={{
                    padding: "9px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    background: colors.fg,
                    color: colors.bg,
                    border: "none",
                    borderRadius: radii.sm,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    opacity: !sheetLabel.trim() ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                >
                  Save
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleSheetArchive}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "13px 0",
                  borderRadius: radii.md,
                  border: `1.5px solid ${colors.border}`,
                  background: colors.surface,
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.danger,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Archive
              </button>
              <button
                onClick={handleSheetReorder}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "13px 0",
                  borderRadius: radii.md,
                  border: `1.5px solid ${colors.border}`,
                  background: colors.surface,
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.fg,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Reorder
              </button>
            </div>
          </div>
        </>
      )}

      {/* Swap sheet */}
      {isSwapMode && (
        <SwapSheet
          sourceTable={swap.sourceTable!}
          targetTable={swap.targetTable}
          headerText={sourceLabel ? `Reorder: ${sourceLabel}` : undefined}
          hintText={swapHintText}
          onConfirm={swap.confirm}
          onCancel={swap.cancel}
        />
      )}
    </div>
  );
}
