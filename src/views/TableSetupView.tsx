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
import { TrashIcon, CheckIcon, PlusIcon } from "../components/icons";

// ── Styles ─────────────────────────────────────────────────────────────────

const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 16px",
  borderBottom: `1px solid ${colors.border}`,
  background: colors.surface,
};

const LABEL_INPUT: React.CSSProperties = {
  flex: 1,
  fontSize: 15,
  fontWeight: 500,
  fontFamily: "inherit",
  color: colors.fg,
  background: "transparent",
  border: "none",
  outline: "none",
  padding: 0,
};

const LABEL_INPUT_EDITING: React.CSSProperties = {
  ...LABEL_INPUT,
  background: colors.inputBg,
  border: `1.5px solid ${colors.border}`,
  borderRadius: radii.sm,
  padding: "4px 8px",
};

const ICON_BTN: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: radii.sm,
  border: "none",
  background: "none",
  cursor: "pointer",
  padding: 0,
  flexShrink: 0,
};

const ARROW_BTN: React.CSSProperties = {
  ...ICON_BTN,
  fontSize: 14,
  color: colors.subtle,
  width: 28,
  height: 28,
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

  const move = async (index: number, direction: -1 | 1) => {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= activeRecords.length) return;

    const reordered = [...activeRecords];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    const updates = reordered.map((r, i) => ({ id: r.id, sort: (i + 1) * 10 }));

    const sortMap = new Map(updates.map((u) => [u.id, u.sort]));
    setRecords((prev) =>
      prev.map((r) => sortMap.has(r.id) ? { ...r, sort: sortMap.get(r.id)! } : r)
    );

    try {
      await Promise.all(updates.map((u) => patchPermanentTable(u.id, { sort: u.sort })));
      reloadTablesConfig();
    } catch {
      showToast("Failed to reorder — refreshing");
      load();
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

  const handleBack = () => {
    setView("tables");
  };

  return (
    <div style={S.page}>
      <ScreenHeader
        title="Table Setup"
        left="back"
        onBack={handleBack}
      />

      <div style={{ padding: "0 0 32px" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: colors.subtle, fontSize: 14 }}>
            Loading…
          </div>
        ) : (
          <>
            {/* Active tables */}
            <div style={{
              margin: "16px 16px 0",
              borderRadius: radii.lg,
              border: `1px solid ${colors.border}`,
              overflow: "hidden",
            }}>
              {activeRecords.length === 0 && (
                <div style={{ ...ROW, color: colors.subtle, fontSize: 14 }}>
                  No active tables
                </div>
              )}
              {activeRecords.map((r, i) => (
                <div key={r.id} style={ROW}>
                  {/* Up / Down */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <button
                      style={{ ...ARROW_BTN, opacity: i === 0 ? 0.25 : 1 }}
                      disabled={i === 0 || saving}
                      onClick={() => move(i, -1)}
                      aria-label="Move up"
                    >▲</button>
                    <button
                      style={{ ...ARROW_BTN, opacity: i === activeRecords.length - 1 ? 0.25 : 1 }}
                      disabled={i === activeRecords.length - 1 || saving}
                      onClick={() => move(i, 1)}
                      aria-label="Move down"
                    >▼</button>
                  </div>

                  {/* Label */}
                  {editingId === r.id ? (
                    <input
                      autoFocus
                      maxLength={10}
                      style={LABEL_INPUT_EDITING}
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onBlur={() => commitEdit(r)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(r);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                  ) : (
                    <span
                      style={{ ...LABEL_INPUT, cursor: "text" }}
                      onClick={() => startEdit(r)}
                    >
                      {r.label}
                    </span>
                  )}

                  {/* Edit confirm */}
                  {editingId === r.id && (
                    <button
                      style={{ ...ICON_BTN, color: colors.success }}
                      onClick={() => commitEdit(r)}
                      aria-label="Confirm rename"
                    >
                      <CheckIcon size={16} color={colors.success} />
                    </button>
                  )}

                  {/* Deactivate */}
                  {editingId !== r.id && (
                    <button
                      style={{ ...ICON_BTN, color: colors.danger }}
                      disabled={saving}
                      onClick={() => deactivate(r)}
                      aria-label={`Remove ${r.label}`}
                    >
                      <TrashIcon size={16} color={colors.danger} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add new table */}
            <div style={{
              margin: "12px 16px 0",
              borderRadius: radii.lg,
              border: `1px solid ${colors.border}`,
              overflow: "hidden",
              background: colors.surface,
            }}>
              <div style={{ ...ROW, borderBottom: "none", gap: 8 }}>
                <input
                  type="text"
                  placeholder="New table name…"
                  maxLength={10}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addTable(); }}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontFamily: "inherit",
                    color: colors.fg,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    padding: 0,
                  }}
                />
                <button
                  style={{
                    ...ICON_BTN,
                    background: newLabel.trim() ? colors.fg : colors.chipBg,
                    color: newLabel.trim() ? colors.bg : colors.subtle,
                    borderRadius: radii.pill,
                    width: 28,
                    height: 28,
                    opacity: saving ? 0.5 : 1,
                  }}
                  disabled={!newLabel.trim() || saving}
                  onClick={addTable}
                  aria-label="Add table"
                >
                  <PlusIcon size={16} />
                </button>
              </div>
            </div>

            {/* Inactive tables */}
            {inactiveRecords.length > 0 && (
              <>
                <div style={{
                  padding: "20px 16px 8px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.subtle,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>
                  Inactive
                </div>
                <div style={{
                  margin: "0 16px",
                  borderRadius: radii.lg,
                  border: `1px solid ${colors.border}`,
                  overflow: "hidden",
                }}>
                  {inactiveRecords.map((r) => (
                    <div key={r.id} style={{ ...ROW, opacity: 0.55 }}>
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: colors.fg }}>
                        {r.label}
                      </span>
                      <button
                        style={{ ...ICON_BTN, fontSize: 13, color: colors.fg, background: colors.chipBg, borderRadius: radii.sm }}
                        disabled={saving}
                        onClick={() => reactivate(r)}
                      >
                        Restore
                      </button>
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
