import { useState, useEffect, useCallback, useMemo, type CSSProperties, type ReactNode } from "react";
import { useApp } from "../contexts/AppContext";
import { useMenu } from "../contexts/MenuContext";
import { ScreenHeader } from "../components/ScreenHeader";
import { useBreakpoint } from "../hooks/useBreakpoint";
import {
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
import { FilterIcon } from "../components/icons";
import {
  FOOD_SUBCATEGORIES,
  DRINKS_SUBCATEGORIES,
  SHOP_SUBCATEGORIES,
  BOTTLES_SUBCATEGORIES,
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

function getVariantType(categoryName: string, label: string): string {
  if (label === "Here") return "here";
  if (label === "Fl. To Go") return "togo";
  if (categoryName === "Wines") {
    if (label === "0,1") return "small";
    if (label === "0,2") return "large";
  }
  if (categoryName === "Drinks") {
    if (label === "0,2") return "small";
    if (label === "0,4") return "large";
  }
  return label.trim().toLowerCase().replace(/\s+/g, "_");
}

function getVariantPosId(categoryName: string, label: string, basePosId: string): string | null {
  const suffix = VARIANT_OPTIONS[categoryName]?.find((o) => o.label === label)?.posIdSuffix;
  const base = basePosId.trim();
  return base && suffix !== undefined ? `${base}${suffix}` : null;
}

function getVariantPosName(label: string, shortName: string, name: string): string {
  const base = shortName.trim() || name.trim();
  if (label === "Here") return `${base} Fl.`;
  if (label === "Fl. To Go") return `${base} Fl. To Go`;
  return `${base} ${label}`;
}

function getWineVariantRows(serving: "glass" | "bottle"): VariantRowData[] {
  const bottleRows = [
    { label: "Here",      price: "", bottleSubcategory: "" },
    { label: "Fl. To Go", price: "", bottleSubcategory: "" },
  ];
  return serving === "glass"
    ? [
        ...bottleRows,
        { label: "0,1", price: "", bottleSubcategory: "" },
        { label: "0,2", price: "", bottleSubcategory: "" },
      ]
    : bottleRows;
}

function isStandardWineVariant(label: string): boolean {
  return label === "Here" || label === "Fl. To Go" || label === "0,1" || label === "0,2";
}

function isStandardDrinkVariant(label: string): boolean {
  return label === "0,2" || label === "0,4";
}

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

const primaryBtnStyle: CSSProperties = {
  flex: 1,
  padding: "13px",
  fontSize: 15,
  fontWeight: 600,
  background: colors.fg,
  color: "#fff",
  border: "none",
  borderRadius: radii.md,
  cursor: "pointer",
  fontFamily: "inherit",
};

const secondaryBtnStyle: CSSProperties = {
  flex: 1,
  padding: "13px",
  fontSize: 15,
  fontWeight: 600,
  background: "none",
  color: colors.secondary,
  border: `1.5px solid ${colors.border}`,
  borderRadius: radii.md,
  cursor: "pointer",
  fontFamily: "inherit",
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
        background: available ? colors.success : colors.border,
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
  const priceLabel =
    item.variants?.length
      ? `${item.variants.length} variant${item.variants.length !== 1 ? "s" : ""}`
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
        {item.short_name && item.short_name !== item.name && (
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>
            {item.short_name}
          </div>
        )}
      </div>
      <span style={{ fontSize: 14, color: colors.secondary, flexShrink: 0 }}>
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
        }}
      >
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
  const [error, setError] = useState<string | null>(null);
  const [glassMode, setGlassMode] = useState(initialGlass);

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
        .map((l) => ({ label: l, price: "", bottleSubcategory: form.subcategory || item.subcategory || "" }));
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
            item: item.id,
            label: row.label.trim(),
            price: parseFloat(row.price),
            type: getVariantType(catName, row.label),
            pos_id: getVariantPosId(catName, row.label, form.posId),
            pos_name: getVariantPosName(row.label, form.shortName, form.name),
            bottle_subcategory: catName === "Wines" ? (form.subcategory || item.subcategory || null) : (row.bottleSubcategory || null),
            is_default: false,
          })
        )
      );

      onSaved({
        name: form.name.trim(),
        short_name: form.shortName.trim() || null,
        subcategory: form.subcategory.trim() || null,
        pos_id: form.posId.trim() || null,
        min_qty: parseInt(form.minQty) || 1,
        ...(!(item.variants?.length) && !glassMode && form.price !== ""
          ? { price: parseFloat(form.price) }
          : {}),
        variants: [
          ...(item.variants ?? [])
            .filter((v) => !form.deletedVariantIds.has(v.id))
            .map((v) => ({ ...v, price: parseFloat(form.variantPrices[v.id] ?? String(v.price)) })),
          ...createdVariants,
        ],
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const formBody = (
      <div
        style={{
          background: colors.surface,
          ...(mode === "sheet"
            ? { borderRadius: `${radii.xl}px ${radii.xl}px 0 0`, maxHeight: "85vh", width: "100%" }
            : { height: "100%" }),
          padding: "24px 20px 36px",
          overflowY: "auto",
          boxSizing: "border-box",
          fontFamily: "'DM Sans', sans-serif",
        }}
        onClick={mode === "sheet" ? (e) => e.stopPropagation() : undefined}
      >
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
        {!(item.variants?.length) && !glassMode && (
          <FieldInput
            label="Price (€)"
            value={form.price}
            onChange={(v) => setForm((f) => ({ ...f, price: v }))}
            type="number"
          />
        )}
        <FieldInput
          label="Min qty"
          value={form.minQty}
          onChange={(v) => setForm((f) => ({ ...f, minQty: v }))}
          type="number"
        />

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
                    {markedForDeletion ? "↩" : "×"}
                  </button>
                </div>
              );
            })}
            {/* New variant rows */}
            {form.newVariantRows.length > 0 && (
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 10, marginTop: 6 }}>
                <div style={{ display: "grid", gridTemplateColumns: `1fr 80px${form.posId ? " 72px" : ""} auto`, gap: 8, fontSize: 11, color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  <span>Label</span><span>Price</span>{form.posId && <span>POS ID</span>}<span />
                </div>
                {form.newVariantRows.map((row, i) => (
                  <VariantRowInput
                    key={i}
                    row={row}
                    index={i}
                    canRemove={true}
                    categoryName={catName}
                    basePosId={form.posId}
                    hideWineType
                    lockLabel={
                      (catName === "Wines" && isStandardWineVariant(row.label)) ||
                      (catName === "Drinks" && isStandardDrinkVariant(row.label))
                    }
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

        {error && (
          <div style={{ color: colors.danger, fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={onClose} disabled={saving} style={secondaryBtnStyle}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} style={primaryBtnStyle}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
  );

  if (mode === "panel") return formBody;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: colors.overlay,
        display: "flex",
        alignItems: "flex-end",
        zIndex: 200,
      }}
      onClick={onClose}
    >
      {formBody}
    </div>
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
  hideWineType = false,
  lockLabel = false,
}: {
  row: VariantRowData;
  index: number;
  canRemove: boolean;
  categoryName: string;
  onChange: (patch: Partial<VariantRowData>) => void;
  onRemove: () => void;
  basePosId?: string;
  hideWineType?: boolean;
  lockLabel?: boolean;
}) {
  const variantOpts = VARIANT_OPTIONS[categoryName];
  const showWineType = categoryName === "Wines" && !hideWineType;
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
          disabled={lockLabel}
          onChange={(e) => onChange({ label: e.target.value })}
          style={{ ...inputStyle, fontSize: 14, appearance: "auto", cursor: lockLabel ? "default" : "pointer" }}
        >
          {variantOpts.map((o) => (
            <option key={o.label} value={o.label}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={row.label}
          readOnly={lockLabel}
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

const SUBCATEGORY_LABELS: Record<string, { value: string; label: string }[]> = {
  Food: FOOD_SUBCATEGORIES.map((s) => ({ value: s.id, label: s.label })),
  Drinks: DRINKS_SUBCATEGORIES.map((s) => ({ value: s.id, label: s.label })),
  Wines: BOTTLES_SUBCATEGORIES.map((s) => ({ value: s.id, label: s.label })),
  Shop: SHOP_SUBCATEGORIES.map((s) => ({ value: s.id, label: s.label })),
};

type AvailFilter = "all" | "available" | "unavailable";
type VariantFilter = "all" | "variants" | "simple";

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
            color: value === o.value ? colors.bg : colors.secondary,
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

function MenuTable({
  items,
  toggling,
  onToggle,
  onEdit,
  selectedId,
  sortKey,
  sortDir,
  onSort,
}: {
  items: AdminMenuItem[];
  toggling: Set<string>;
  onToggle: (item: AdminMenuItem) => void;
  onEdit: (item: AdminMenuItem) => void;
  selectedId: string | null;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
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
        <col style={{ width: 52 }} />
        <col />
        <col style={{ width: 82 }} />
        <col style={{ width: 100 }} />
        <col style={{ width: 110 }} />
        <col style={{ width: 80 }} />
        <col style={{ width: 72 }} />
        <col style={{ width: 52 }} />
        <col style={{ width: 48 }} />
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
          {sh("Dest.", "destination")}
          {sh("Min", "min_qty")}
          {sh("Sort", "sort_order")}
          <th style={{ background: colors.bg, borderBottom: `2px solid ${colors.border}`, position: "sticky", top: 0, zIndex: 2 }} />
        </tr>
      </thead>
      <tbody>
        {items.length === 0 && (
          <tr>
            <td colSpan={10} style={{ padding: "48px 20px", textAlign: "center", color: colors.muted, fontSize: 14 }}>
              No items match the current filters.
            </td>
          </tr>
        )}
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          const priceLabel = (item.variants?.length ?? 0) > 0
            ? `${item.variants.length} variant${item.variants.length !== 1 ? "s" : ""}`
            : item.price != null ? `€${Number(item.price).toFixed(2)}` : "—";
          const rowBg = isSelected ? colors.chipBg : colors.surface;
          const textColor = item.available ? colors.fg : colors.dimmed;
          const cell: CSSProperties = { ...cellBase, background: rowBg, color: textColor };

          return (
            <tr key={item.id}>
              <td style={{ ...cell, textAlign: "center", maxWidth: "none" }}>
                <AvailabilityToggle
                  available={item.available}
                  disabled={toggling.has(item.id)}
                  onToggle={() => onToggle(item)}
                />
              </td>
              <td style={cell}>
                <span style={{ ...truncate, fontWeight: 600 }}>{item.name}</span>
                {item.short_name && item.short_name !== item.name && (
                  <span style={{ ...truncate, fontSize: 11, color: colors.muted, marginTop: 1 }}>{item.short_name}</span>
                )}
              </td>
              <td style={cell}>
                <span style={{ ...truncate, fontSize: 11, background: colors.chipBg, borderRadius: 4, padding: "2px 6px", display: "inline-block" }}>
                  {item.category?.name ?? "—"}
                </span>
              </td>
              <td style={cell}><span style={truncate}>{item.subcategory ?? "—"}</span></td>
              <td style={cell}><span style={truncate}>{priceLabel}</span></td>
              <td style={cell}><span style={{ ...truncate, fontFamily: "monospace", fontSize: 12 }}>{item.pos_id ?? "—"}</span></td>
              <td style={cell}><span style={truncate}>{item.destination ?? "—"}</span></td>
              <td style={{ ...cell, textAlign: "center" }}>{item.min_qty ?? 1}</td>
              <td style={{ ...cell, textAlign: "center", color: colors.muted }}>{item.sort_order}</td>
              <td style={{ ...cell, maxWidth: "none" }}>
                <button
                  onClick={() => onEdit(item)}
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
                  }}
                >
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
  const isDefaultWine = defaultCat?.name === "Wines";
  const [categoryId, setCategoryId] = useState<number>(defaultCat?.id ?? 0);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [mode, setMode] = useState<"simple" | "variants">(isDefaultWine ? "variants" : "simple");
  const [wineServing, setWineServing] = useState<"glass" | "bottle">("bottle");
  const [price, setPrice] = useState("");
  const [basePosId, setBasePosId] = useState("");
  const [variantRows, setVariantRows] = useState<VariantRowData[]>(
    isDefaultWine ? getWineVariantRows("bottle") : [{ label: "Bottle", price: "", bottleSubcategory: "" }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? "";

  const handleCategoryChange = (id: number) => {
    const nextCategoryName = categories.find((c) => c.id === id)?.name ?? "";
    setCategoryId(id);
    setSubcategory("");
    setWineServing("bottle");
    if (nextCategoryName === "Wines") {
      setMode("variants");
      setVariantRows(getWineVariantRows("bottle"));
    } else {
      setMode("simple");
      setVariantRows([{ label: "Bottle", price: "", bottleSubcategory: "" }]);
    }
  };

  const handleWineServingChange = (serving: "glass" | "bottle") => {
    setWineServing(serving);
    setMode("variants");
    setVariantRows(getWineVariantRows(serving));
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
            item: created.id,
            label: row.label,
            price: parseFloat(row.price),
            type: getVariantType(categoryName, row.label),
            pos_id: posId,
            pos_name: getVariantPosName(row.label, shortName, name),
            bottle_subcategory: categoryName === "Wines" ? (subcategory || null) : (row.bottleSubcategory || null),
            is_default: false,
          });
        }
        // Re-fetch the item so variants are included in the returned object
        const refreshed = await directusFetch(
          `/items/menu_items/${created.id}?fields=*,variants.*,category.id,category.name`
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

  const hasRequiredWineBottlePrices =
    categoryName !== "Wines" ||
    ["Here", "Fl. To Go"].every((label) =>
      variantRows.some((row) => row.label === label && row.price !== "")
    );

  const canSubmit = name.trim() &&
    (mode === "simple" || variantRows.some((r) => r.price !== "")) &&
    hasRequiredWineBottlePrices;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: colors.overlay,
        display: "flex",
        alignItems: "flex-end",
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.surface,
          borderRadius: `${radii.xl}px ${radii.xl}px 0 0`,
          padding: "24px 20px 36px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxSizing: "border-box",
          fontFamily: "'DM Sans', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 32px", gap: 8, fontSize: 11, color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span>Label</span>
                <span>Price</span>
                <span />
              </div>
            </div>
            {variantRows.map((row, i) => (
              <VariantRowInput
                key={i}
                row={row}
                index={i}
                canRemove={
                  variantRows.length > 1 &&
                  !(categoryName === "Wines" && isStandardWineVariant(row.label)) &&
                  !(categoryName === "Drinks" && isStandardDrinkVariant(row.label))
                }
                categoryName={categoryName}
                hideWineType={categoryName === "Wines"}
                lockLabel={
                  (categoryName === "Wines" && isStandardWineVariant(row.label)) ||
                  (categoryName === "Drinks" && isStandardDrinkVariant(row.label))
                }
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
          <button onClick={onClose} disabled={saving} style={secondaryBtnStyle}>Cancel</button>
          <button
            onClick={create}
            disabled={saving || !canSubmit}
            style={{ ...primaryBtnStyle, opacity: !canSubmit ? 0.5 : 1 }}
          >
            {saving ? "Creating…" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FilterDropdown ─────────────────────────────────────────────────────────

function FilterDropdown({
  open,
  onToggle,
  isTableView,
  hasActiveFilters,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  isTableView: boolean;
  hasActiveFilters: boolean;
  children: ReactNode;
}) {
  return (
    <div style={{ position: "relative" }}>
      <button
        style={{
          ...S.headerActionBtn,
          ...(hasActiveFilters && { color: colors.info, border: `1.5px solid ${colors.info}` }),
        }}
        onClick={onToggle}
        aria-label="Filter menu items"
      >
        <FilterIcon size={16} />
        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Filters</span>
      </button>
      {open && isTableView && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 199 }}
            onClick={onToggle}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              zIndex: 200,
              width: 280,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.lg,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              padding: "16px",
            }}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

// ── Section order ──────────────────────────────────────────────────────────

const SECTION_ORDER = ["Food", "Wines", "Drinks", "Shop"] as const;

// ── AdminView ──────────────────────────────────────────────────────────────

export function AdminView() {
  const { setView, showToast } = useApp();
  const { reloadMenu } = useMenu();
  const { isTabletLandscape, isLaptop, isDesktop } = useBreakpoint();
  const isWideShell = isDesktop || isLaptop || isTabletLandscape;
  const isTableView = isWideShell;

  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [editItem, setEditItem] = useState<AdminMenuItem | null>(null);
  const [newItemCategoryId, setNewItemCategoryId] = useState<number | null>(null);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Food");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailFilter>("all");
  const [variantFilter, setVariantFilter] = useState<VariantFilter>("all");

  useEffect(() => {
    fetchAllMenuItems()
      .then(setItems)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categories: AdminCategory[] = useMemo(() => {
    const seen = new Map<number, AdminCategory>();
    for (const item of items) {
      const id = item.category?.id ?? 0;
      if (!seen.has(id)) {
        seen.set(id, { id, name: item.category?.name ?? "Other", sort_order: 0 });
      }
    }
    return Array.from(seen.values());
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
        catId: sectionMap.get(name)?.catId ?? null,
        sectionItems: sectionMap.get(name)?.items ?? [],
      })),
    [sectionMap]
  );

  const filteredSorted = useMemo(() => {
    let result = items;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q) || (i.short_name ?? "").toLowerCase().includes(q));
    }
    if (categoryFilter !== "all") result = result.filter((i) => i.category?.name === categoryFilter);
    if (subcategoryFilter !== "all") result = result.filter((i) => i.subcategory === subcategoryFilter);
    if (availabilityFilter !== "all") result = result.filter((i) => availabilityFilter === "available" ? i.available : !i.available);
    if (variantFilter !== "all") result = result.filter((i) => variantFilter === "variants" ? (i.variants?.length ?? 0) > 0 : (i.variants?.length ?? 0) === 0);
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
  }, [items, query, categoryFilter, subcategoryFilter, availabilityFilter, variantFilter, sortKey, sortDir]);

  const mobileSections = useMemo(() => {
    const q = query.toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        sectionItems: s.sectionItems.filter((item) => {
          const matchSearch = !query.trim() || item.name.toLowerCase().includes(q) || (item.short_name ?? "").toLowerCase().includes(q);
          const matchSubcat = subcategoryFilter === "all" || item.subcategory === subcategoryFilter;
          const matchAvail = availabilityFilter === "all" || (availabilityFilter === "available" ? item.available : !item.available);
          const matchVariant = variantFilter === "all" || (variantFilter === "variants" ? (item.variants?.length ?? 0) > 0 : (item.variants?.length ?? 0) === 0);
          return matchSearch && matchSubcat && matchAvail && matchVariant;
        }),
      }))
      .filter((s) => categoryFilter === "all" || s.name === categoryFilter);
  }, [sections, query, categoryFilter, subcategoryFilter, availabilityFilter, variantFilter]);

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

  const hasActiveFilters = categoryFilter !== "all" || subcategoryFilter !== "all" || availabilityFilter !== "all" || variantFilter !== "all";

  const renderFilterSections = (showCategory = true) => {
    const subcatKey = showCategory ? categoryFilter : activeCategory;
    const showSubcat = (showCategory ? subcatKey !== "all" : true) && !!SUBCATEGORY_LABELS[subcatKey];
    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Filters</span>
          {hasActiveFilters && (
            <button
              onClick={() => { setCategoryFilter("all"); setSubcategoryFilter("all"); setAvailabilityFilter("all"); setVariantFilter("all"); }}
              style={{ background: "none", border: "none", fontSize: 13, color: colors.info, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, padding: 0 }}
            >
              Clear all
            </button>
          )}
        </div>
        {showCategory && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Category</div>
            <FilterPills
              options={[{ value: "all", label: "All" }, ...categories.map((c) => ({ value: c.name, label: c.name }))]}
              value={categoryFilter}
              onChange={(c) => { setCategoryFilter(c); setSubcategoryFilter("all"); }}
            />
          </div>
        )}
        {showSubcat && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Subcategory</div>
            <FilterPills
              options={[{ value: "all", label: "All" }, ...SUBCATEGORY_LABELS[subcatKey]]}
              value={subcategoryFilter}
              onChange={setSubcategoryFilter}
            />
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Availability</div>
          <FilterPills
            options={[{ value: "all", label: "All" }, { value: "available", label: "On" }, { value: "unavailable", label: "Off" }]}
            value={availabilityFilter}
            onChange={setAvailabilityFilter}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Type</div>
          <FilterPills
            options={[{ value: "all", label: "All" }, { value: "variants", label: "Variants" }, { value: "simple", label: "Fixed price" }]}
            value={variantFilter}
            onChange={setVariantFilter}
          />
        </div>
      </>
    );
  };

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
          ? { height: "100%", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }
          : { minHeight: "100%" }),
      }}
    >
      {/* ── Header ── */}
      <ScreenHeader
        title="Menu"
        left="back"
        onBack={handleBack}
        hideBackOnWide
        right={
          !loading && !loadError ? (
            <FilterDropdown
              open={showFilterSheet}
              onToggle={() => setShowFilterSheet((v) => !v)}
              isTableView={isTableView}
              hasActiveFilters={hasActiveFilters}
            >
              {renderFilterSections()}
            </FilterDropdown>
          ) : undefined
        }
        style={{ zIndex: 10 }}
      />

      {/* ── Search bar ── */}
      {!loading && !loadError && (
        <div style={S.searchBar}>
          <button
            style={S.customAddBtn}
            onClick={() => {
              const activeSec = mobileSections.find((s) => s.name === activeCategory);
              setNewItemCategoryId(isTableView ? null : (activeSec?.catId ?? null));
              setShowNewItemModal(true);
            }}
            title="Add item"
          >+</button>
          <input
            type="text"
            placeholder="Search items…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={S.searchInputWithBtn}
          />
          {query && (
            <button style={S.searchClear} onClick={() => setQuery("")}>✕</button>
          )}
        </div>
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

      {/* ── Mobile: category tabs + flat list ── */}
      {!loading && !loadError && !isTableView && (() => {
        const activeItems = mobileSections.find((s) => s.name === activeCategory)?.sectionItems ?? [];
        return (
          <>
            <div style={S.tabs}>
              <div style={S.tabsContainer}>
                {SECTION_ORDER.map((name) => (
                  <button
                    key={name}
                    style={{ ...S.tab, ...(activeCategory === name ? S.tabActive : {}) }}
                    onClick={() => setActiveCategory(name)}
                  >
                    {name}
                  </button>
                ))}
                <div
                  style={{
                    ...S.tabIndicator,
                    width: "25%",
                    transform: `translateX(${SECTION_ORDER.indexOf(activeCategory) * 100}%)`,
                  }}
                />
              </div>
            </div>
            {activeItems.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center", color: colors.dimmed, fontSize: 14 }}>
                No items
              </div>
            ) : (
              <div style={{ background: colors.surface }}>
                {activeItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    toggling={toggling.has(item.id)}
                    onToggle={() => handleToggle(item)}
                    onEdit={() => setEditItem(item)}
                  />
                ))}
              </div>
            )}
          </>
        );
      })()}

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

      {/* ── Filter sheet (mobile only) ── */}
      {showFilterSheet && !isTableView && (
        <>
          <div style={S.variantSheetOverlay} onClick={() => setShowFilterSheet(false)} />
          <div style={S.variantSheet}>
            {renderFilterSections(false)}
          </div>
        </>
      )}
    </div>
  );
}
