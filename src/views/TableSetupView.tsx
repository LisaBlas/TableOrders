import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { ScreenHeader } from "../components/ScreenHeader";
import {
  fetchAllPermanentTableRecords,
  createPermanentTable,
  patchPermanentTable,
  type PermanentTableRecord,
} from "../services/directusTables";
import { colors, radii } from "../styles/tokens";
import { S } from "../styles/appStyles";

// ── Helpers ────────────────────────────────────────────────────────────────

function chipFontSize(label: string): number {
  const len = label.length;
  if (len <= 3) return 20;
  if (len <= 6) return 15;
  if (len <= 9) return 12;
  return 10;
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

const GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))",
  gap: 10,
  padding: "0 16px",
};

const CHIP_BASE: React.CSSProperties = {
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
};

const CHIP: React.CSSProperties = {
  ...CHIP_BASE,
  background: colors.surface,
  border: `1.5px solid ${colors.border}`,
  cursor: "text",
};

const CHIP_EDITING: React.CSSProperties = {
  ...CHIP_BASE,
  background: colors.inputBg,
  border: `1.5px solid ${colors.fg}`,
};

const CHIP_INPUT: React.CSSProperties = {
  width: "100%",
  textAlign: "center",
  fontFamily: "inherit",
  color: colors.fg,
  background: "transparent",
  border: "none",
  outline: "none",
  padding: 0,
  caretColor: colors.fg,
};

const CORNER_BTN: React.CSSProperties = {
  position: "absolute",
  width: 18,
  height: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "none",
  padding: 0,
  cursor: "pointer",
  fontSize: 12,
  lineHeight: 1,
};

// ── Component ──────────────────────────────────────────────────────────────

export function TableSetupView() {
  const { setView, showToast } = useApp();
  const { reloadTablesConfig } = useTable();

  const [records, setRecords] = useState<PermanentTableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [showNewTableInput, setShowNewTableInput] = useState(false);
  const [swapSourceId, setSwapSourceId] = useState<number | null>(null);
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
  const inactiveRecords = records.filter((r) => r.active === false);

  const startEdit = (r: PermanentTableRecord) => {
    setSwapSourceId(null);
    setEditingId(r.id);
    setEditLabel(r.label);
  };

  const commitEdit = async (r: PermanentTableRecord) => {
    const trimmed = editLabel.trim();
    if (!trimmed || trimmed === r.label) {
      setEditingId(null);
      return;
    }
    setSaving(true);
    try {
      await patchPermanentTable(r.id, { label: trimmed });
      setRecords((prev) => prev.map((t) => t.id === r.id ? { ...t, label: trimmed } : t));
      reloadTablesConfig();
    } catch {
      showToast("Failed to rename table");
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  const executeSwap = async (a: PermanentTableRecord, b: PermanentTableRecord) => {
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
  };

  const handleChipClick = (r: PermanentTableRecord) => {
    if (swapSourceId !== null) {
      if (swapSourceId === r.id) {
        setSwapSourceId(null);
      } else {
        const source = activeRecords.find((x) => x.id === swapSourceId);
        if (source) executeSwap(source, r);
        setSwapSourceId(null);
      }
      return;
    }
    startEdit(r);
  };

  const handleSwapBtn = (e: React.MouseEvent, r: PermanentTableRecord) => {
    e.stopPropagation();
    if (swapSourceId === r.id) {
      setSwapSourceId(null);
    } else if (swapSourceId !== null) {
      const source = activeRecords.find((x) => x.id === swapSourceId);
      if (source) executeSwap(source, r);
      setSwapSourceId(null);
    } else {
      setEditingId(null);
      setSwapSourceId(r.id);
    }
  };

  const deactivate = async (r: PermanentTableRecord) => {
    setSaving(true);
    try {
      await patchPermanentTable(r.id, { active: false });
      setRecords((prev) => prev.map((t) => t.id === r.id ? { ...t, active: false } : t));
      reloadTablesConfig();
      showToast(`"${r.label}" removed from floor`);
    } catch {
      showToast("Failed to remove table");
    } finally {
      setSaving(false);
    }
  };

  const reactivate = async (r: PermanentTableRecord) => {
    setSaving(true);
    try {
      await patchPermanentTable(r.id, { active: true });
      setRecords((prev) => prev.map((t) => t.id === r.id ? { ...t, active: true } : t));
      reloadTablesConfig();
      showToast(`"${r.label}" restored to floor`);
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

  const isSwapMode = swapSourceId !== null;

  return (
    <div style={S.page}>
      <ScreenHeader
        title="Table Setup"
        left="back"
        onBack={() => setView("tables")}
        right={
          !isSwapMode && (
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: 600,
                background: colors.fg,
                color: "#fff",
                border: "none",
                borderRadius: radii.sm,
                cursor: "pointer",
                fontFamily: "inherit",
                opacity: saving ? 0.5 : 1,
                whiteSpace: "nowrap",
              }}
              disabled={saving}
              onClick={() => {
                setSwapSourceId(null);
                setEditingId(null);
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
            {/* Active tables */}
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
                  onBlur={() => { if (!newLabel.trim()) { setShowNewTableInput(false); } }}
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
                    color: "#fff",
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

            <div style={GRID}>
              {activeRecords.length === 0 && (
                <div style={{ gridColumn: "1 / -1", color: colors.subtle, fontSize: 14, paddingBottom: 4 }}>
                  No active tables yet
                </div>
              )}

              {activeRecords.map((r) => {
                const isSource = swapSourceId === r.id;
                const isEditing = editingId === r.id;

                return (
                  <div
                    key={r.id}
                    style={{
                      ...(isEditing ? CHIP_EDITING : CHIP),
                      ...(isSource && {
                        background: colors.infoBg,
                        border: `1.5px solid ${colors.info}`,
                      }),
                      ...(isSwapMode && !isSource && !isEditing && {
                        cursor: "pointer",
                      }),
                    }}
                    onClick={() => { if (!isEditing) handleChipClick(r); }}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        maxLength={10}
                        style={{ ...CHIP_INPUT, fontSize: 15, fontWeight: 600 }}
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onBlur={() => commitEdit(r)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit(r);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      <span style={{
                        fontSize: chipFontSize(r.label),
                        fontWeight: 700,
                        color: isSource ? colors.info : colors.fg,
                        lineHeight: 1.1,
                        textAlign: "center",
                        wordBreak: "break-all",
                      }}>
                        {r.label}
                      </span>
                    )}

                    {/* ✕ deactivate — hidden in swap mode and while editing */}
                    {!isEditing && !isSwapMode && (
                      <button
                        style={{ ...CORNER_BTN, top: 3, right: 4, color: colors.subtle }}
                        disabled={saving}
                        onClick={(e) => { e.stopPropagation(); deactivate(r); }}
                        aria-label={`Remove ${r.label}`}
                      >
                        ✕
                      </button>
                    )}

                    {/* ⇅ reorder — hidden while editing */}
                    {!isEditing && (
                      <button
                        style={{
                          ...CORNER_BTN,
                          bottom: 3,
                          left: 4,
                          color: isSource ? colors.info : colors.subtle,
                          fontSize: 13,
                        }}
                        onClick={(e) => handleSwapBtn(e, r)}
                        aria-label={isSource ? "Cancel reorder" : "Reorder"}
                      >
                        ⇅
                      </button>
                    )}
                  </div>
                );
              })}

            </div>

            <div style={{ padding: "10px 16px 0", fontSize: 12, color: isSwapMode ? colors.info : colors.subtle }}>
              {isSwapMode
                ? "Tap another table to swap positions · tap ⇅ again to cancel"
                : "Tap to rename · ⇅ to reorder · ✕ to remove"}
            </div>

            {/* Inactive tables */}
            {inactiveRecords.length > 0 && (
              <>
                <div style={SECTION_LABEL}>Inactive</div>
                <div style={GRID}>
                  {inactiveRecords.map((r) => (
                    <div
                      key={r.id}
                      style={{ ...CHIP, opacity: 0.5, cursor: "pointer" }}
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
