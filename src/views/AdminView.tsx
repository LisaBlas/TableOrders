import { useState, useEffect, useCallback, useMemo, useRef, type CSSProperties } from "react";
import { useApp } from "../contexts/AppContext";
import { useMenu } from "../contexts/MenuContext";
import { BackIcon, TrashIcon, EditIcon, CheckIcon } from "../components/icons";
import { useBreakpoint } from "../hooks/useBreakpoint";
import {
  fetchAllCategories,
  fetchAllMenuItems,
  patchMenuItem,
  patchVariant,
  deleteVariant,
  createMenuItem,
  createVariant,
  type AdminMenuItem,
  type AdminCategory,
} from "../services/directusAdmin";
import { colors, radii } from "../styles/tokens";
import { S } from "../styles/appStyles";
import {
  FOOD_SUBCATEGORIES,
  DRINKS_SUBCATEGORIES,
  SHOP_SUBCATEGORIES,
} from "../data/constants";
import { directusFetch } from "../services/directusFetch";

// ── Constants ──────────────────────────────────────────────────────────────

const WINE_TYPES = ["white", "rosé", "red", "sparkling", "natural"];

const SUBCATEGORY_OPTIONS: Record<string, string[]> = {
  Food: FOOD_SUBCATEGORIES.map((s) => s.id),
  Drinks: DRINKS_SUBCATEGORIES.map((s) => s.id),
  Wines: WINE_TYPES,
  Shop: SHOP_SUBCATEGORIES.map((s) => s.id),
};

const VARIANT_OPTIONS: Record<string, { label: string; posIdSuffix: string }[]> = {
  Wines: [
    { label: "Here",      posIdSuffix: "" },
    { label: "Fl. To Go", posIdSuffix: "0" },
    { label: "0,1",       posIdSuffix: "1" },
    { label: "0,2",       posIdSuffix: "2" },
  ],
  Drinks: [
    { label: "0,2", posIdSuffix: "1" },
    { label: "0,4", posIdSuffix: "2" },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────

function groupByCategory(
  items: AdminMenuItem[]
): { cat: string; catId: number; items: AdminMenuItem[] }[] {
  const map = new Map<number, { cat: string; catId: number; items: AdminMenuItem[] }>();
  for (const item of items) {
    const catId = item.category?.id ?? 0;
    const catName = item.category?.name ?? "Other";
    if (!map.has(catId)) map.set(catId, { cat: catName, catId, items: [] });
    map.get(catId)!.items.push(item);
  }
  return Array.from(map.values());
}

// ── Shared styles ──────────────────────────────────────────────────────────

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: colors.muted,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 15,
  border: `1.5px solid ${colors.border}`,
  borderRadius: radii.sm,
  outline: "none",
  fontFamily: "inherit",
  background: colors.inputBg,
  boxSizing: "border-box",
};


// ── FieldInput ─────────────────────────────────────────────────────────────

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        step={type === "number" ? "0.01" : undefined}
        style={inputStyle}
      />
    </div>
  );
}

// ── AvailabilityToggle ─────────────────────────────────────────────────────

function AvailabilityToggle({
  available,
  disabled,
  onToggle,
}: {
  available: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={disabled}
      style={{
        flexShrink: 0,
        width: 44,
        height: 26,
        borderRadius: 13,
        border: "none",
        background: available ? colors.success : "#ccc",
        cursor: disabled ? "default" : "pointer",
        position: "relative",
        transition: "background 0.2s",
        opacity: disabled ? 0.6 : 1,
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: available ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.18s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

// ── ItemRow ────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  toggling,
  onToggle,
  onEdit,
}: {
  item: AdminMenuItem;
  toggling: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const priceLabel = (item.variants?.length ?? 0) > 0
    ? (() => {
        const MAX = 2;
        const shown = item.variants.slice(0, MAX);
        const rest = item.variants.length - MAX;
        const parts = shown.map((v) => `${v.label} €${Number(v.price).toFixed(2)}`);
        if (rest > 0) parts.push(`+${rest}`);
        return parts.join(" · ");
      })()
    : item.price != null
    ? `€${Number(item.price).toFixed(2)}`
    : "—";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: `1px solid ${colors.border}`,
        background: colors.surface,
        opacity: item.available ? 1 : 0.5,
      }}
    >
      <AvailabilityToggle
        available={item.available}
        disabled={toggling}
        onToggle={onToggle}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 15,
            color: colors.fg,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
          {item.short_name && item.short_name !== item.name && (
            <span style={{ fontSize: 12, color: colors.muted }}>{item.short_name}</span>
          )}
          {item.subcategory && (
            <span style={{ fontSize: 11, color: colors.muted, background: colors.chipBg, borderRadius: 3, padding: "1px 5px" }}>
              {item.subcategory}
            </span>
          )}
        </div>
      </div>
      <span style={{ fontSize: 13, color: colors.secondary, flexShrink: 0, maxWidth: 140, textAlign: "right", lineHeight: 1.4 }}>
        {priceLabel}
      </span>
      <button
        onClick={onEdit}
        style={{
          background: "none",
          border: `1.5px solid ${colors.border}`,
          borderRadius: radii.sm,
          padding: "5px 11px",
          fontSize: 13,
          color: colors.secondary,
          cursor: "pointer",
          flexShrink: 0,
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <EditIcon size={12} />
        Edit
      </button>
    </div>
  );
}

// ── EditItemModal ──────────────────────────────────────────────────────────

interface EditForm {
  name: string;
  shortName: string;
  subcategory: string;
  posId: string;
  price: string;
  minQty: string;
  destination: string;
  variantPrices: Record<number, string>;
  newVariantRows: VariantRowData[];
  deletedVariantIds: Set<number>;
}

function EditItemModal({
  item,
  onClose,
  onSaved,
  mode = "sheet",
}: {
  item: AdminMenuItem;
  onClose: () => void;
  onSaved: (patch: Partial<AdminMenuItem>) => void;
  mode?: "sheet" | "panel";
}) {
  const derivedPosId =
    item.pos_id ??
    item.variants?.find((v) => v.label === "Here")?.pos_id ??
    "";

  const [form, setForm] = useState<EditForm>({
    name: item.name,
    shortName: item.short_name ?? "",
    subcategory: item.subcategory ?? "",
    posId: derivedPosId,
    price: item.price != null ? String(item.price) : "",
    minQty: String(item.min_qty ?? 1),
    destination: item.destination ?? "",
    variantPrices: Object.fromEntries(
      (item.variants ?? []).map((v) => [v.id, String(v.price)])
    ),
    newVariantRows: [],
    deletedVariantIds: new Set(),
  });
  const catName = item.category?.name ?? "";

  const initialGlass =
    catName === "Wines"
      ? (item.variants?.some((v) => v.label === "0,1" || v.label === "0,2") ?? false)
      : catName === "Drinks"
      ? (item.variants?.length ?? 0) > 0
      : false;

  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glassMode, setGlassMode] = useState(initialGlass);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const handleServingChange = (wantGlass: boolean) => {
    setGlassMode(wantGlass);
    if (wantGlass) {
      const glassLabels = catName === "Wines" ? ["0,1", "0,2"] : ["0,2", "0,4"];
      const existingLabels = new Set([
        ...(item.variants?.map((v) => v.label) ?? []),
        ...form.newVariantRows.map((r) => r.label),
      ]);
      const newRows = glassLabels
        .filter((l) => !existingLabels.has(l))
        .map((l) => ({ label: l, price: "", bottleSubcategory: "" }));
      setForm((f) => ({ ...f, newVariantRows: [...f.newVariantRows, ...newRows] }));
    } else {
      const glassLabels = new Set(catName === "Wines" ? ["0,1", "0,2"] : ["0,2", "0,4"]);
      setForm((f) => ({
        ...f,
        newVariantRows: f.newVariantRows.filter((r) => !glassLabels.has(r.label)),
        deletedVariantIds: new Set([
          ...f.deletedVariantIds,
          ...(item.variants?.filter((v) => glassLabels.has(v.label)).map((v) => v.id) ?? []),
        ]),
      }));
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const itemPatch: Record<string, unknown> = {
        name: form.name.trim(),
        short_name: form.shortName.trim() || null,
        subcategory: form.subcategory.trim() || null,
        pos_id: form.posId.trim() || null,
        min_qty: parseInt(form.minQty) || 1,
        destination: form.destination || null,
      };
      if (!(item.variants?.length) && !glassMode && form.price !== "") {
        itemPatch.price = parseFloat(form.price);
      }
      await patchMenuItem(item.id, itemPatch);

      for (const v of item.variants ?? []) {
        if (form.deletedVariantIds.has(v.id)) {
          await deleteVariant(v.id);
          continue;
        }
        const newPrice = parseFloat(form.variantPrices[v.id] ?? "");
        if (!isNaN(newPrice) && newPrice !== v.price) {
          await patchVariant(v.id, { price: newPrice });
        }
      }

      const validNewRows = form.newVariantRows.filter((r) => r.price !== "");
      const createdVariants = await Promise.all(
        validNewRows.map((row) =>
          createVariant({
            item_id: item.id,
            label: row.label.trim(),
            price: parseFloat(row.price),
            type: "",
            pos_id: null,
            pos_name: null,
            bottle_subcategory: row.bottleSubcategory || null,
            is_default: false,
          })
        )
      );

      const patch = {
        name: form.name.trim(),
        short_name: form.shortName.trim() || null,
        subcategory: form.subcategory.trim() || null,
        pos_id: form.posId.trim() || null,
        min_qty: parseInt(form.minQty) || 1,
        destination: form.destination || null,
        ...(!(item.variants?.length) && !glassMode && form.price !== ""
          ? { price: parseFloat(form.price) }
          : {}),
        variants: [
          ...(item.variants ?? [])
            .filter((v) => !form.deletedVariantIds.has(v.id))
            .map((v) => ({ ...v, price: parseFloat(form.variantPrices[v.id] ?? String(v.price)) })),
          ...createdVariants,
        ],
      };
      onSaved(patch);
      if (mode === "panel") {
        setSavedFlash(true);
        setTimeout(() => {
          if (mountedRef.current) { setSavedFlash(false); onClose(); }
        }, 1000);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const formContent = (
      <>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Edit: {item.name}</span>
          {mode === "panel" && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: colors.muted, lineHeight: 1, padding: "0 2px", fontFamily: "inherit" }}>×</button>
          )}
        </div>

        <FieldInput
          label="Name"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          autoFocus
        />
        <FieldInput
          label="Short name"
          value={form.shortName}
          onChange={(v) => setForm((f) => ({ ...f, shortName: v }))}
          placeholder="Optional"
        />
        {!(item.variants?.length) && !glassMode && (
          <FieldInput
            label="Price (€)"
            value={form.price}
            onChange={(v) => setForm((f) => ({ ...f, price: v }))}
            type="number"
          />
        )}

        {(catName === "Wines" || catName === "Drinks") && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {([false, true] as const).map((isGlass) => (
              <button
                key={String(isGlass)}
                onClick={() => handleServingChange(isGlass)}
                style={{
                  flex: 1,
                  padding: "9px",
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: radii.md,
                  border: `1.5px solid ${glassMode === isGlass ? colors.fg : colors.border}`,
                  background: glassMode === isGlass ? colors.fg : "none",
                  color: glassMode === isGlass ? "#fff" : colors.secondary,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {!isGlass
                  ? catName === "Wines" ? "Bottle only" : "Fixed price"
                  : "Has glass options"}
              </button>
            ))}
          </div>
        )}

        {catName !== "Food" && ((item.variants ?? []).length > 0 || glassMode) && (
          <div style={{ marginTop: 4, marginBottom: 14 }}>
            <div style={{ ...labelStyle, marginBottom: 10 }}>Variants</div>
            {/* Existing variants — price editable, deletable */}
            {item.variants.map((v) => {
              const markedForDeletion = form.deletedVariantIds.has(v.id);
              const variantSuffix = VARIANT_OPTIONS[catName]?.find((o) => o.label === v.label)?.posIdSuffix;
              const variantPosId = variantSuffix !== undefined ? `${form.posId}${variantSuffix}` : null;
              return (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, opacity: markedForDeletion ? 0.4 : 1 }}>
                  <span style={{ flex: 1, fontSize: 14, color: colors.fg, textDecoration: markedForDeletion ? "line-through" : "none" }}>{v.label}</span>
                  {v.bottle_subcategory && (
                    <span style={{ fontSize: 12, color: colors.muted, background: colors.chipBg, borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>
                      {v.bottle_subcategory}
                    </span>
                  )}
                  <input
                    type="number"
                    value={form.variantPrices[v.id] ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, variantPrices: { ...f.variantPrices, [v.id]: e.target.value } }))
                    }
                    step="0.01"
                    disabled={markedForDeletion}
                    style={{ ...inputStyle, width: 80 }}
                  />
                  {variantPosId !== null && (
                    <input
                      type="text"
                      value={variantPosId}
                      readOnly
                      tabIndex={-1}
                      style={{ ...inputStyle, width: 72, color: colors.muted, background: colors.chipBg, cursor: "default" }}
                    />
                  )}
                  <button
                    onClick={() =>
                      setForm((f) => {
                        const next = new Set(f.deletedVariantIds);
                        markedForDeletion ? next.delete(v.id) : next.add(v.id);
                        return { ...f, deletedVariantIds: next };
                      })
                    }
                    style={{
                      background: "none",
                      border: `1.5px solid ${markedForDeletion ? colors.border : colors.danger}`,
                      borderRadius: radii.sm,
                      width: 30,
                      height: 30,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: markedForDeletion ? colors.muted : colors.danger,
                      fontSize: 16,
                      padding: 0,
                      flexShrink: 0,
                    }}
                    title={markedForDeletion ? "Undo" : "Delete variant"}
                  >
                    {markedForDeletion ? "↩" : <TrashIcon size={14} />}
                  </button>
                </div>
              );
            })}
            {/* New variant rows */}
            {form.newVariantRows.length > 0 && (
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 10, marginTop: 6 }}>
                <div style={{ display: "grid", gridTemplateColumns: catName === "Wines" ? `1fr 80px 100px${form.posId ? " 72px" : ""} auto` : `1fr 80px${form.posId ? " 72px" : ""} auto`, gap: 8, fontSize: 11, color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  <span>Label</span><span>Price</span>{catName === "Wines" && <span>Wine type</span>}{form.posId && <span>POS ID</span>}<span />
                </div>
                {form.newVariantRows.map((row, i) => (
                  <VariantRowInput
                    key={i}
                    row={row}
                    index={i}
                    canRemove={true}
                    categoryName={catName}
                    basePosId={form.posId}
                    onChange={(patch) =>
                      setForm((f) => ({
                        ...f,
                        newVariantRows: f.newVariantRows.map((r, idx) => idx === i ? { ...r, ...patch } : r),
                      }))
                    }
                    onRemove={() =>
                      setForm((f) => ({ ...f, newVariantRows: f.newVariantRows.filter((_, idx) => idx !== i) }))
                    }
                  />
                ))}
              </div>
            )}
            {!VARIANT_OPTIONS[item.category?.name ?? ""] && (
              <button
                onClick={() => {
                  const defaultLabel = VARIANT_OPTIONS[catName]?.[0]?.label ?? "";
                  setForm((f) => ({ ...f, newVariantRows: [...f.newVariantRows, { label: defaultLabel, price: "", bottleSubcategory: "" }] }));
                }}
                style={{
                  background: "none",
                  border: `1.5px dashed ${colors.border}`,
                  borderRadius: radii.sm,
                  padding: "8px",
                  width: "100%",
                  fontSize: 14,
                  color: colors.muted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  marginTop: 4,
                }}
              >
                + Add variant
              </button>
            )}
          </div>
        )}

        {/* ── Advanced ── */}
        <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: 8, paddingTop: 4 }}>
          <button
            onClick={() => setShowAdvanced((s) => !s)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              padding: "8px 0",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: colors.muted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontFamily: "inherit",
              width: "100%",
            }}
          >
            <span style={{ fontSize: 10, display: "inline-block", lineHeight: 1, transform: showAdvanced ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }}>▾</span>
            Advanced
          </button>
          {showAdvanced && (
            <div style={{ paddingTop: 6 }}>
              <SubcategoryField
                categoryName={item.category?.name ?? ""}
                value={form.subcategory}
                onChange={(v) => setForm((f) => ({ ...f, subcategory: v }))}
              />
              <FieldInput
                label="POS ID"
                value={form.posId}
                onChange={(v) => setForm((f) => ({ ...f, posId: v }))}
                placeholder="Optional"
              />
              <FieldInput
                label="Min qty"
                value={form.minQty}
                onChange={(v) => setForm((f) => ({ ...f, minQty: v }))}
                type="number"
              />
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Destination</label>
                <select
                  value={form.destination}
                  onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                  style={{ ...inputStyle, appearance: "auto" }}
                >
                  <option value="">—</option>
                  <option value="bar">bar</option>
                  <option value="counter">counter</option>
                  <option value="kitchen">kitchen</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: colors.danger, fontSize: 13, marginBottom: 12, marginTop: 10 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={onClose} disabled={saving || savedFlash} style={S.modalCancelBtn}>
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || savedFlash}
            style={{
              ...S.modalConfirmBtn,
              background: savedFlash ? colors.success : colors.fg,
              transition: "background 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            {saving ? "Saving…" : savedFlash ? <><CheckIcon size={14} />Saved</> : "Save"}
          </button>
        </div>
      </>
  );

  if (mode === "panel") return (
    <div style={{ height: "100%", padding: "24px 20px 36px", overflowY: "auto", boxSizing: "border-box", background: colors.surface }}>
      {formContent}
    </div>
  );

  return (
    <>
      <div style={S.variantSheetOverlay} onClick={onClose} />
      <div style={{ ...S.variantSheet, padding: "24px 20px 36px", maxHeight: "85vh", overflowY: "auto", boxSizing: "border-box" }}>
        {formContent}
      </div>
    </>
  );
}

// ── SubcategoryField ───────────────────────────────────────────────────────

function SubcategoryField({
  categoryName,
  value,
  onChange,
}: {
  categoryName: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const options = SUBCATEGORY_OPTIONS[categoryName] ?? [];
  const fieldLabel = categoryName === "Wines" ? "Wine type" : "Subcategory";
  if (options.length === 0) {
    return (
      <FieldInput label={fieldLabel} value={value} onChange={onChange} placeholder="Optional" />
    );
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{fieldLabel}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, appearance: "auto" }}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// ── VariantRow ─────────────────────────────────────────────────────────────

interface VariantRowData {
  label: string;
  price: string;
  bottleSubcategory: string;
}

function VariantRowInput({
  row,
  index,
  canRemove,
  categoryName,
  onChange,
  onRemove,
  basePosId,
}: {
  row: VariantRowData;
  index: number;
  canRemove: boolean;
  categoryName: string;
  onChange: (patch: Partial<VariantRowData>) => void;
  onRemove: () => void;
  basePosId?: string;
}) {
  const variantOpts = VARIANT_OPTIONS[categoryName];
  const showWineType = categoryName === "Wines";
  const derivedSuffix = basePosId !== undefined
    ? VARIANT_OPTIONS[categoryName]?.find((o) => o.label === row.label)?.posIdSuffix
    : undefined;
  const derivedPosId = derivedSuffix !== undefined ? `${basePosId}${derivedSuffix}` : null;
  const cols = showWineType
    ? `1fr 80px 100px${derivedPosId !== null ? " 72px" : ""} auto`
    : `1fr 80px${derivedPosId !== null ? " 72px" : ""} auto`;
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8, alignItems: "center", marginBottom: 10 }}>
      {variantOpts ? (
        <select
          value={row.label}
          onChange={(e) => onChange({ label: e.target.value })}
          style={{ ...inputStyle, fontSize: 14, appearance: "auto" }}
        >
          {variantOpts.map((o) => (
            <option key={o.label} value={o.label}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={row.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Label"
          style={{ ...inputStyle, fontSize: 14 }}
        />
      )}
      <input
        type="number"
        value={row.price}
        onChange={(e) => onChange({ price: e.target.value })}
        placeholder="€"
        step="0.01"
        style={{ ...inputStyle, fontSize: 14 }}
      />
      {showWineType && (
        <select
          value={row.bottleSubcategory}
          onChange={(e) => onChange({ bottleSubcategory: e.target.value })}
          style={{ ...inputStyle, fontSize: 13, appearance: "auto" }}
        >
          <option value="">—</option>
          {WINE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}
      {derivedPosId !== null && (
        <input
          type="text"
          value={derivedPosId}
          readOnly
          tabIndex={-1}
          style={{ ...inputStyle, fontSize: 14, color: colors.muted, background: colors.chipBg, cursor: "default" }}
        />
      )}
      <button
        onClick={onRemove}
        disabled={!canRemove}
        style={{
          background: "none",
          border: `1.5px solid ${colors.border}`,
          borderRadius: radii.sm,
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: canRemove ? "pointer" : "default",
          color: canRemove ? colors.danger : colors.dimmed,
          fontSize: 18,
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ── FilterBar ──────────────────────────────────────────────────────────────

type AvailFilter = "all" | "available" | "unavailable";
type VariantFilter = "all" | "variants" | "simple";
type QualityFilter = "all" | "no-pos" | "no-price" | "min2";

function FilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: "5px 10px",
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 20,
            border: `1.5px solid ${value === o.value ? colors.fg : colors.border}`,
            background: value === o.value ? colors.fg : "none",
            color: value === o.value ? "#fff" : colors.secondary,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FilterBar({
  query,
  onQuery,
  categoryFilter,
  onCategoryFilter,
  availFilter,
  onAvailFilter,
  variantFilter,
  onVariantFilter,
  qualityFilter,
  onQualityFilter,
  categoryNames,
  onAddItem,
  isTableView,
}: {
  query: string;
  onQuery: (q: string) => void;
  categoryFilter: string;
  onCategoryFilter: (c: string) => void;
  availFilter: AvailFilter;
  onAvailFilter: (f: AvailFilter) => void;
  variantFilter: VariantFilter;
  onVariantFilter: (f: VariantFilter) => void;
  qualityFilter: QualityFilter;
  onQualityFilter: (f: QualityFilter) => void;
  categoryNames: string[];
  onAddItem: () => void;
  isTableView: boolean;
}) {
  const catOptions = [
    { value: "all", label: "All" },
    ...categoryNames.map((n) => ({ value: n, label: n })),
  ];
  const availOptions: { value: AvailFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "available", label: "On" },
    { value: "unavailable", label: "Off" },
  ];
  const variantOptions: { value: VariantFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "variants", label: "Variants" },
    { value: "simple", label: "Fixed price" },
  ];
  const qualityOptions: { value: QualityFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "no-pos", label: "No POS ID" },
    { value: "no-price", label: "No price" },
    { value: "min2", label: "Min qty > 1" },
  ];

  return (
    <div
      style={{
        padding: isTableView ? "8px 16px" : "10px 16px",
        borderBottom: `1px solid ${colors.border}`,
        background: colors.surface,
        display: "flex",
        flexDirection: isTableView ? "row" : "column",
        gap: 8,
        alignItems: isTableView ? "center" : "stretch",
        flexShrink: 0,
        flexWrap: isTableView ? "wrap" : undefined,
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center", flex: isTableView ? "none" : 1 }}>
        <div style={{ position: "relative", flex: 1, minWidth: isTableView ? 200 : 0 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: colors.muted, fontSize: 14, pointerEvents: "none", lineHeight: 1 }}>⌕</span>
          <input
            type="text"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search items…"
            style={{ ...inputStyle, paddingLeft: 28, paddingTop: 7, paddingBottom: 7, fontSize: 13 }}
          />
          {query && (
            <button onClick={() => onQuery("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: colors.muted, fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
          )}
        </div>
        {isTableView && (
          <button
            onClick={onAddItem}
            style={{ padding: "7px 14px", fontSize: 13, fontWeight: 700, background: colors.fg, color: "#fff", border: "none", borderRadius: radii.md, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            + Add item
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: isTableView ? 10 : 8, alignItems: "center", flexWrap: "wrap" }}>
        <FilterPills options={catOptions} value={categoryFilter} onChange={onCategoryFilter} />
        {isTableView && <span style={{ width: 1, height: 18, background: colors.border, flexShrink: 0 }} />}
        <FilterPills options={availOptions} value={availFilter} onChange={onAvailFilter} />
        {isTableView && <span style={{ width: 1, height: 18, background: colors.border, flexShrink: 0 }} />}
        <FilterPills options={variantOptions} value={variantFilter} onChange={onVariantFilter} />
        {isTableView && <span style={{ width: 1, height: 18, background: colors.border, flexShrink: 0 }} />}
        <FilterPills options={qualityOptions} value={qualityFilter} onChange={onQualityFilter} />
      </div>
    </div>
  );
}

// ── SortableHeader + MenuTable ─────────────────────────────────────────────

function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  style,
}: {
  label: string;
  sortKey: string;
  currentKey: string;
  currentDir: "asc" | "desc";
  onSort: (key: string) => void;
  style?: CSSProperties;
}) {
  const active = currentKey === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        padding: "8px 10px",
        textAlign: "left",
        fontSize: 11,
        fontWeight: 700,
        color: active ? colors.fg : colors.muted,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        background: colors.bg,
        borderBottom: `2px solid ${active ? colors.fg : colors.border}`,
        position: "sticky",
        top: 0,
        zIndex: 2,
        ...style,
      }}
    >
      {label}{active ? (currentDir === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );
}

function ProblemBadge({ label, severity }: { label: string; severity: "warn" | "error" }) {
  const isWarn = severity === "warn";
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 700,
      color: isWarn ? colors.warningText : colors.danger,
      background: isWarn ? colors.warningBg : colors.dangerBg,
      border: `1px solid ${isWarn ? colors.warningBorder : colors.danger}`,
      borderRadius: 4,
      padding: "1px 5px",
      lineHeight: 1.4,
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

function MenuTable({
  items,
  toggling,
  onToggle,
  onEdit,
  selectedId,
  sortKey,
  sortDir,
  onSort,
  duplicatePosIds,
}: {
  items: AdminMenuItem[];
  toggling: Set<string>;
  onToggle: (item: AdminMenuItem) => void;
  onEdit: (item: AdminMenuItem) => void;
  selectedId: string | null;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  duplicatePosIds: Set<string>;
}) {
  const sh = (label: string, key: string, extraStyle?: CSSProperties) => (
    <SortableHeader label={label} sortKey={key} currentKey={sortKey} currentDir={sortDir} onSort={onSort} style={extraStyle} />
  );

  const cellBase: CSSProperties = {
    padding: "8px 10px",
    fontSize: 13,
    borderBottom: `1px solid ${colors.border}`,
    verticalAlign: "middle",
    maxWidth: 160,
    overflow: "hidden",
  };

  const truncate: CSSProperties = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "block",
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
      <colgroup>
        <col style={{ width: 55 }} />
        <col />
        <col style={{ width: 82 }} />
        <col style={{ width: 110 }} />
        <col style={{ width: 220 }} />
        <col style={{ width: 90 }} />
        <col style={{ width: 72 }} />
      </colgroup>
      <thead>
        <tr>
          <th style={{ background: colors.bg, borderBottom: `2px solid ${colors.border}`, position: "sticky", top: 0, zIndex: 2 }} />
          {sh("Name", "name")}
          {sh("Category", "category")}
          {sh("Subcategory", "subcategory")}
          {sh("Price / Variants", "price")}
          {sh("POS ID", "pos_id")}
          <th style={{ background: colors.bg, borderBottom: `2px solid ${colors.border}`, position: "sticky", top: 0, zIndex: 2 }} />
        </tr>
      </thead>
      <tbody>
        {items.length === 0 && (
          <tr>
            <td colSpan={7} style={{ padding: "48px 20px", textAlign: "center", color: colors.muted, fontSize: 14 }}>
              No items match the current filters.
            </td>
          </tr>
        )}
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          const priceLabel = (item.variants?.length ?? 0) > 0
            ? (() => {
                const MAX = 3;
                const shown = item.variants.slice(0, MAX);
                const rest = item.variants.length - MAX;
                const parts = shown.map((v) => `${v.label} €${Number(v.price).toFixed(2)}`);
                if (rest > 0) parts.push(`+${rest}`);
                return parts.join(" · ");
              })()
            : item.price != null ? `€${Number(item.price).toFixed(2)}` : "—";
          const rowBg = isSelected ? colors.chipBg : colors.surface;
          const textColor = item.available ? colors.fg : colors.dimmed;
          const cell: CSSProperties = { ...cellBase, background: rowBg, color: textColor };
          const selectionBorder = `3px solid ${isSelected ? colors.fg : "transparent"}`;

          const hasNoPrice = item.price == null && (item.variants?.length ?? 0) === 0;
          const hasZeroVariant = item.variants?.some((v) => !v.price || v.price === 0) ?? false;
          const hasNoPosId = !item.pos_id && !(item.variants?.some((v) => v.pos_id));
          const hasDupPosId = !!item.pos_id && duplicatePosIds.has(item.pos_id);

          return (
            <tr key={item.id} style={{ cursor: "pointer" }} onClick={() => onEdit(item)}>
              <td
                style={{ ...cell, textAlign: "center", maxWidth: "none", borderLeft: selectionBorder, paddingLeft: 8 }}
                onClick={(e) => e.stopPropagation()}
              >
                <AvailabilityToggle
                  available={item.available}
                  disabled={toggling.has(item.id)}
                  onToggle={() => onToggle(item)}
                />
              </td>
              <td style={{ ...cell, verticalAlign: "top", paddingTop: 9 }}>
                <span style={{ ...truncate, fontWeight: 600 }}>{item.name}</span>
                {item.short_name && item.short_name !== item.name && (
                  <span style={{ ...truncate, fontSize: 11, color: colors.muted, marginTop: 1 }}>{item.short_name}</span>
                )}
                {(hasNoPrice || hasZeroVariant || hasNoPosId || hasDupPosId) && (
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 4 }}>
                    {hasNoPrice && <ProblemBadge label="No price" severity="error" />}
                    {hasZeroVariant && <ProblemBadge label="€0 variant" severity="error" />}
                    {hasNoPosId && <ProblemBadge label="No POS" severity="warn" />}
                    {hasDupPosId && <ProblemBadge label="Dup POS" severity="warn" />}
                  </div>
                )}
              </td>
              <td style={cell}>
                <span style={{ ...truncate, fontSize: 11, background: colors.chipBg, borderRadius: 4, padding: "2px 6px", display: "inline-block" }}>
                  {item.category?.name ?? "—"}
                </span>
              </td>
              <td style={cell}><span style={truncate}>{item.subcategory ?? "—"}</span></td>
              <td style={cell}><span style={{ ...truncate, fontSize: 12 }}>{priceLabel}</span></td>
              <td style={cell}><span style={{ ...truncate, fontFamily: "monospace", fontSize: 12 }}>{item.pos_id ?? "—"}</span></td>
              <td style={{ ...cell, maxWidth: "none" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                  style={{
                    background: isSelected ? colors.fg : "none",
                    color: isSelected ? "#fff" : colors.secondary,
                    border: `1.5px solid ${isSelected ? colors.fg : colors.border}`,
                    borderRadius: radii.sm,
                    padding: "4px 10px",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <EditIcon size={11} />
                  {isSelected ? "Editing" : "Edit"}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── NewItemModal ───────────────────────────────────────────────────────────

function NewItemModal({
  categories,
  defaultCategoryId,
  onClose,
  onCreated,
}: {
  categories: AdminCategory[];
  defaultCategoryId: number | null;
  onClose: () => void;
  onCreated: (item: AdminMenuItem) => void;
}) {
  const defaultCat = categories.find((c) => c.id === defaultCategoryId) ?? categories[0];
  const [categoryId, setCategoryId] = useState<number>(defaultCat?.id ?? 0);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [mode, setMode] = useState<"simple" | "variants">("simple");
  const [wineServing, setWineServing] = useState<"glass" | "bottle">("bottle");
  const [price, setPrice] = useState("");
  const [basePosId, setBasePosId] = useState("");
  const [variantRows, setVariantRows] = useState<VariantRowData[]>([
    { label: "Bottle", price: "", bottleSubcategory: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? "";

  const handleCategoryChange = (id: number) => {
    setCategoryId(id);
    setSubcategory("");
    setWineServing("bottle");
    setMode("simple");
  };

  const handleWineServingChange = (serving: "glass" | "bottle") => {
    setWineServing(serving);
    setMode("variants");
    if (serving === "glass") {
      setVariantRows([
        { label: "Here",      price: "", bottleSubcategory: "" },
        { label: "Fl. To Go", price: "", bottleSubcategory: "" },
        { label: "0,1",       price: "", bottleSubcategory: "" },
        { label: "0,2",       price: "", bottleSubcategory: "" },
      ]);
    } else {
      setVariantRows([
        { label: "Here",      price: "", bottleSubcategory: "" },
        { label: "Fl. To Go", price: "", bottleSubcategory: "" },
      ]);
    }
  };

  const handleModeChange = (m: "simple" | "variants") => {
    setMode(m);
    if (m === "variants" && categoryName === "Drinks") {
      setVariantRows([
        { label: "0,2", price: "", bottleSubcategory: "" },
        { label: "0,4", price: "", bottleSubcategory: "" },
      ]);
    }
  };

  const updateVariantRow = (i: number, patch: Partial<VariantRowData>) => {
    setVariantRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const removeVariantRow = (i: number) => {
    setVariantRows((rows) => rows.filter((_, idx) => idx !== i));
  };

  const create = async () => {
    if (!name.trim() || !categoryId) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createMenuItem({
        name: name.trim(),
        short_name: shortName.trim() || null,
        price: mode === "simple" && price !== "" ? parseFloat(price) : null,
        subcategory: subcategory || null,
        pos_id: basePosId.trim() || null,
        destination: null,
        min_qty: 1,
        available: true,
        sort_order: 99,
        category: categoryId,
      });

      if (mode === "variants") {
        const validRows = variantRows.filter((r) => r.price !== "");
        for (const row of validRows) {
          const suffix = (VARIANT_OPTIONS[categoryName] ?? []).find((o) => o.label === row.label)?.posIdSuffix ?? "";
          const posId = basePosId.trim() ? `${basePosId.trim()}${suffix}` : null;
          await createVariant({
            item_id: created.id,
            label: row.label,
            price: parseFloat(row.price),
            type: "",
            pos_id: posId,
            pos_name: null,
            bottle_subcategory: row.bottleSubcategory || null,
            is_default: false,
          });
        }
        // Re-fetch the item so variants are included in the returned object
        const refreshed = await directusFetch(
          `/items/menu_items/${created.id}?fields=*,variants.*,category.name`
        ).then((r) => r.json()).then((r) => ({ ...r.data, variants: r.data.variants ?? [] }));
        onCreated(refreshed);
      } else {
        onCreated(created);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = name.trim() &&
    (mode === "simple" || variantRows.some((r) => r.price !== ""));

  return (
    <>
      <div style={S.variantSheetOverlay} onClick={onClose} />
      <div style={{ ...S.variantSheet, padding: "24px 20px 36px", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>New Item</div>

        {/* Mode toggle — hidden for Food, wine serving for Wines, generic for others */}
        {categoryName !== "Food" && <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {categoryName === "Wines" ? (
            (["bottle", "glass"] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleWineServingChange(s)}
                style={{
                  flex: 1,
                  padding: "9px",
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: radii.md,
                  border: `1.5px solid ${wineServing === s ? colors.fg : colors.border}`,
                  background: wineServing === s ? colors.fg : "none",
                  color: wineServing === s ? "#fff" : colors.secondary,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {s === "bottle" ? "Bottle only" : "Has glass options"}
              </button>
            ))
          ) : (
            (["simple", "variants"] as const).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                style={{
                  flex: 1,
                  padding: "9px",
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: radii.md,
                  border: `1.5px solid ${mode === m ? colors.fg : colors.border}`,
                  background: mode === m ? colors.fg : "none",
                  color: mode === m ? "#fff" : colors.secondary,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {m === "simple" ? "Fixed price" : "With variants"}
              </button>
            ))
          )}
        </div>}

        {/* Category */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Category</label>
          <select
            value={categoryId}
            onChange={(e) => handleCategoryChange(Number(e.target.value))}
            style={{ ...inputStyle, appearance: "auto" }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <SubcategoryField categoryName={categoryName} value={subcategory} onChange={setSubcategory} />
        <FieldInput label="Name" value={name} onChange={setName} autoFocus />
        <FieldInput label="Short name" value={shortName} onChange={setShortName} placeholder="Optional" />
        <FieldInput
          label={mode === "variants" ? "Base POS ID" : "POS ID"}
          value={basePosId}
          onChange={setBasePosId}
          placeholder={mode === "variants" ? "e.g. 1234 — suffixes appended per variant" : "Optional"}
        />

        {mode === "simple" && (
          <FieldInput label="Price (€)" value={price} onChange={setPrice} type="number" />
        )}

        {mode === "variants" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Variants</label>
              <div style={{ display: "grid", gridTemplateColumns: categoryName === "Wines" ? "1fr 80px 100px 32px" : "1fr 80px 32px", gap: 8, fontSize: 11, color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span>Label</span>
                <span>Price</span>
                {categoryName === "Wines" && <span>Wine type</span>}
                <span />
              </div>
            </div>
            {variantRows.map((row, i) => (
              <VariantRowInput
                key={i}
                row={row}
                index={i}
                canRemove={variantRows.length > 1}
                categoryName={categoryName}
                onChange={(patch) => updateVariantRow(i, patch)}
                onRemove={() => removeVariantRow(i)}
              />
            ))}
            {!VARIANT_OPTIONS[categoryName] && (
              <button
                onClick={() => {
                  const defaultLabel = VARIANT_OPTIONS[categoryName]?.[0]?.label ?? "";
                  setVariantRows((r) => [...r, { label: defaultLabel, price: "", bottleSubcategory: "" }]);
                }}
                style={{
                  background: "none",
                  border: `1.5px dashed ${colors.border}`,
                  borderRadius: radii.sm,
                  padding: "8px",
                  width: "100%",
                  fontSize: 14,
                  color: colors.muted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  marginTop: 4,
                }}
              >
                + Add variant
              </button>
            )}
          </div>
        )}

        {error && (
          <div style={{ color: colors.danger, fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={onClose} disabled={saving} style={S.modalCancelBtn}>Cancel</button>
          <button
            onClick={create}
            disabled={saving || !canSubmit}
            style={{ ...S.modalConfirmBtn, opacity: !canSubmit ? 0.5 : 1 }}
          >
            {saving ? "Creating…" : "Add Item"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Section order ──────────────────────────────────────────────────────────

const SECTION_ORDER = ["Food", "Wines", "Drinks", "Shop"] as const;

// ── AdminView ──────────────────────────────────────────────────────────────

export function AdminView() {
  const { setView, showToast } = useApp();
  const { reloadMenu } = useMenu();
  const { isMobile, isTablet } = useBreakpoint();
  const isTableView = !isMobile && !isTablet;

  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [editItem, setEditItem] = useState<AdminMenuItem | null>(null);
  const [newItemCategoryId, setNewItemCategoryId] = useState<number | null>(null);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailFilter>("all");
  const [variantFilter, setVariantFilter] = useState<VariantFilter>("all");
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>("all");

  useEffect(() => {
    Promise.all([fetchAllCategories(), fetchAllMenuItems()])
      .then(([cats, menuItems]) => { setCategories(cats); setItems(menuItems); })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const duplicatePosIds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (item.pos_id) counts.set(item.pos_id, (counts.get(item.pos_id) ?? 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id));
  }, [items]);

  const [sortKey, setSortKey] = useState("sort_order");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const groups = useMemo(() => groupByCategory(items), [items]);
  const sectionMap = useMemo(
    () => new Map(groups.map((g) => [g.cat, g])),
    [groups]
  );
  const sections = useMemo(
    () =>
      SECTION_ORDER.map((name) => ({
        name,
        catId: sectionMap.get(name)?.catId ?? categories.find((c) => c.name === name)?.id ?? null,
        sectionItems: sectionMap.get(name)?.items ?? [],
      })),
    [sectionMap, categories]
  );

  const filteredSorted = useMemo(() => {
    let result = items;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q) || (i.short_name ?? "").toLowerCase().includes(q));
    }
    if (categoryFilter !== "all") result = result.filter((i) => i.category?.name === categoryFilter);
    if (availabilityFilter !== "all") result = result.filter((i) => availabilityFilter === "available" ? i.available : !i.available);
    if (variantFilter !== "all") result = result.filter((i) => variantFilter === "variants" ? (i.variants?.length ?? 0) > 0 : (i.variants?.length ?? 0) === 0);
    if (qualityFilter === "no-pos") result = result.filter((i) => !i.pos_id && !i.variants?.some((v) => v.pos_id));
    if (qualityFilter === "no-price") result = result.filter((i) => i.price == null && (i.variants?.length ?? 0) === 0);
    if (qualityFilter === "min2") result = result.filter((i) => (i.min_qty ?? 1) > 1);
    return [...result].sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0;
      switch (sortKey) {
        case "name": av = a.name; bv = b.name; break;
        case "category": av = a.category?.name ?? ""; bv = b.category?.name ?? ""; break;
        case "subcategory": av = a.subcategory ?? ""; bv = b.subcategory ?? ""; break;
        case "price": av = a.price ?? (a.variants?.length ?? 0); bv = b.price ?? (b.variants?.length ?? 0); break;
        case "pos_id": av = a.pos_id ?? ""; bv = b.pos_id ?? ""; break;
        case "destination": av = a.destination ?? ""; bv = b.destination ?? ""; break;
        case "min_qty": av = a.min_qty ?? 1; bv = b.min_qty ?? 1; break;
        case "sort_order": av = a.sort_order; bv = b.sort_order; break;
        default: av = a.sort_order; bv = b.sort_order;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [items, query, categoryFilter, availabilityFilter, variantFilter, qualityFilter, sortKey, sortDir]);

  const mobileSections = useMemo(() => {
    const q = query.toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        sectionItems: s.sectionItems.filter((item) => {
          const matchSearch = !query.trim() || item.name.toLowerCase().includes(q) || (item.short_name ?? "").toLowerCase().includes(q);
          const matchAvail = availabilityFilter === "all" || (availabilityFilter === "available" ? item.available : !item.available);
          const matchVariant = variantFilter === "all" || (variantFilter === "variants" ? (item.variants?.length ?? 0) > 0 : (item.variants?.length ?? 0) === 0);
          const matchQuality = qualityFilter === "all"
            || (qualityFilter === "no-pos" && !item.pos_id && !item.variants?.some((v) => v.pos_id))
            || (qualityFilter === "no-price" && item.price == null && (item.variants?.length ?? 0) === 0)
            || (qualityFilter === "min2" && (item.min_qty ?? 1) > 1);
          return matchSearch && matchAvail && matchVariant && matchQuality;
        }),
      }))
      .filter((s) => categoryFilter === "all" || s.name === categoryFilter);
  }, [sections, query, categoryFilter, availabilityFilter, variantFilter, qualityFilter]);

  const gridCols = isMobile ? 1 : 2;

  const handleBack = () => {
    if (dirty) reloadMenu();
    setView("tables");
  };

  const handleToggle = useCallback(
    async (item: AdminMenuItem) => {
      const newAvailable = !item.available;
      setToggling((t) => new Set(t).add(item.id));
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, available: newAvailable } : i))
      );
      try {
        await patchMenuItem(item.id, { available: newAvailable });
        setDirty(true);
        showToast(`${item.name} ${newAvailable ? "enabled" : "disabled"}`);
      } catch {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, available: item.available } : i))
        );
        showToast("Save failed — try again");
      } finally {
        setToggling((t) => {
          const next = new Set(t);
          next.delete(item.id);
          return next;
        });
      }
    },
    [showToast]
  );

  const handleSaved = useCallback(
    (id: string, patch: Partial<AdminMenuItem>) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      setDirty(true);
      showToast("Saved");
    },
    [showToast]
  );

  const handleCreated = useCallback(
    (newItem: AdminMenuItem) => {
      setItems((prev) => [...prev, newItem]);
      setDirty(true);
      showToast("Item added");
    },
    [showToast]
  );

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <div
      style={{
        background: colors.bg,
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        ...(isTableView
          ? { height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }
          : { minHeight: "100vh" }),
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          flexShrink: 0,
          zIndex: 10,
          background: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          height: 56,
          gap: 12,
        }}
      >
        <button onClick={handleBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: colors.fg }}>
          <BackIcon size={22} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 17, flex: 1 }}>Menu</span>
        <span style={{ fontSize: 12, color: colors.muted, fontWeight: 500 }}>Admin</span>
      </header>

      {/* ── Filter bar ── */}
      {!loading && !loadError && (
        <FilterBar
          query={query}
          onQuery={setQuery}
          categoryFilter={categoryFilter}
          onCategoryFilter={setCategoryFilter}
          availFilter={availabilityFilter}
          onAvailFilter={setAvailabilityFilter}
          variantFilter={variantFilter}
          onVariantFilter={setVariantFilter}
          qualityFilter={qualityFilter}
          onQualityFilter={setQualityFilter}
          categoryNames={categories.map((c) => c.name)}
          onAddItem={() => { setNewItemCategoryId(null); setShowNewItemModal(true); }}
          isTableView={isTableView}
        />
      )}

      {/* ── Loading / Error ── */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, color: colors.muted, fontSize: 15 }}>
          Loading…
        </div>
      )}
      {loadError && (
        <div style={{ padding: 16, background: colors.dangerBg, color: colors.danger, fontSize: 14 }}>
          Failed to load: {loadError}
        </div>
      )}

      {/* ── Desktop: sortable table + side panel ── */}
      {!loading && !loadError && isTableView && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", minWidth: 0 }}>
            <MenuTable
              items={filteredSorted}
              toggling={toggling}
              onToggle={handleToggle}
              onEdit={setEditItem}
              selectedId={editItem?.id ?? null}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              duplicatePosIds={duplicatePosIds}
            />
          </div>
          {editItem && (
            <div style={{ width: 420, borderLeft: `1px solid ${colors.border}`, overflowY: "auto", flexShrink: 0 }}>
              <EditItemModal
                item={editItem}
                mode="panel"
                onClose={() => setEditItem(null)}
                onSaved={(patch) => {
                  handleSaved(editItem.id, patch);
                  setEditItem(null);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Mobile: category sections ── */}
      {!loading && !loadError && !isTableView && (
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: 16, alignItems: "start" }}>
          {mobileSections.map(({ name, catId, sectionItems }) => {
            const collapsed = collapsedSections.has(name);
            const toggleCollapse = () =>
              setCollapsedSections((prev) => {
                const next = new Set(prev);
                collapsed ? next.delete(name) : next.add(name);
                return next;
              });
            return (
              <div key={name} style={{ background: colors.surface, borderRadius: radii.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
                <div style={{ padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: collapsed ? "none" : `1px solid ${colors.border}`, background: colors.bg }}>
                  <button
                    onClick={toggleCollapse}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, flex: 1, textAlign: "left", fontFamily: "inherit" }}
                  >
                    <span style={{ fontSize: 10, color: colors.dimmed, transition: "transform 0.18s", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", display: "inline-block", lineHeight: 1 }}>▾</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {name}
                      <span style={{ marginLeft: 6, fontWeight: 400, color: colors.dimmed }}>{sectionItems.length}</span>
                    </span>
                  </button>
                  <button
                    onClick={() => { setNewItemCategoryId(catId); setShowNewItemModal(true); }}
                    style={{ background: "none", border: `1.5px solid ${colors.border}`, borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: colors.secondary, fontSize: 18, lineHeight: 1, padding: 0, fontFamily: "inherit" }}
                    title={`Add item to ${name}`}
                  >+</button>
                </div>
                {!collapsed && (
                  sectionItems.length === 0
                    ? <div style={{ padding: "20px 16px", color: colors.dimmed, fontSize: 13, textAlign: "center" }}>No items</div>
                    : sectionItems.map((item) => (
                        <ItemRow key={item.id} item={item} toggling={toggling.has(item.id)} onToggle={() => handleToggle(item)} onEdit={() => setEditItem(item)} />
                      ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Mobile edit sheet ── */}
      {!isTableView && editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={(patch) => {
            handleSaved(editItem.id, patch);
            setEditItem(null);
          }}
        />
      )}

      {showNewItemModal && (
        <NewItemModal
          categories={categories}
          defaultCategoryId={newItemCategoryId}
          onClose={() => setShowNewItemModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
