import { useState, useEffect, useCallback } from "react";
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

const REMOVE_BTN: React.CSSProperties = {
  position: "absolute",
  top: 3,
  right: 4,
  width: 18,
  height: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "none",
  padding: 0,
  cursor: "pointer",
  color: colors.subtle,
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
  const [addFocused, setAddFocused] = useState(false);

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
      showToast(`"${label}" added`);
    } catch {
      showToast("Failed to add table");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={S.page}>
      <ScreenHeader
        title="Table Setup"
        left="back"
        onBack={() => setView("tables")}
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

            <div style={GRID}>
              {activeRecords.length === 0 && (
                <div style={{ gridColumn: "1 / -1", color: colors.subtle, fontSize: 14, paddingBottom: 4 }}>
                  No active tables yet
                </div>
              )}

              {activeRecords.map((r) => (
                <div
                  key={r.id}
                  style={editingId === r.id ? CHIP_EDITING : CHIP}
                  onClick={() => { if (editingId !== r.id) startEdit(r); }}
                >
                  {editingId === r.id ? (
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
                      color: colors.fg,
                      lineHeight: 1.1,
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}>
                      {r.label}
                    </span>
                  )}

                  {editingId !== r.id && (
                    <button
                      style={REMOVE_BTN}
                      disabled={saving}
                      onClick={(e) => { e.stopPropagation(); deactivate(r); }}
                      aria-label={`Remove ${r.label}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {/* Add chip */}
              <div
                style={{
                  ...CHIP_BASE,
                  border: `1.5px dashed ${addFocused || newLabel ? colors.fg : colors.border}`,
                  background: addFocused || newLabel ? colors.inputBg : "transparent",
                  cursor: "text",
                }}
              >
                <input
                  type="text"
                  placeholder="+"
                  maxLength={10}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onFocus={() => setAddFocused(true)}
                  onBlur={() => setAddFocused(false)}
                  onKeyDown={(e) => { if (e.key === "Enter") addTable(); }}
                  disabled={saving}
                  style={{
                    ...CHIP_INPUT,
                    fontSize: addFocused || newLabel ? 15 : 20,
                    fontWeight: addFocused || newLabel ? 600 : 400,
                    color: addFocused || newLabel ? colors.fg : colors.subtle,
                  }}
                />
              </div>
            </div>

            <div style={{
              padding: "10px 16px 0",
              fontSize: 12,
              color: colors.subtle,
            }}>
              Tap a table to rename · tap ✕ to remove
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
