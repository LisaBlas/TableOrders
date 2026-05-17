import { useState, useEffect, useCallback, useMemo, type CSSProperties } from "react";
import { useApp } from "../contexts/AppContext";
import { useMenu } from "../contexts/MenuContext";
import { BackIcon } from "../components/icons";
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
import {
  FOOD_SUBCATEGORIES,
  DRINKS_SUBCATEGORIES,
  SHOP_SUBCATEGORIES,
} from "../data/constants";

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
}: {
  item: AdminMenuItem;
  onClose: () => void;
  onSaved: (patch: Partial<AdminMenuItem>) => void;
}) {
  const [form, setForm] = useState<EditForm>({
    name: item.name,
    shortName: item.short_name ?? "",
    subcategory: item.subcategory ?? "",
    posId: item.pos_id ?? "",
    price: item.price != null ? String(item.price) : "",
    minQty: String(item.min_qty ?? 1),
    variantPrices: Object.fromEntries(
      (item.variants ?? []).map((v) => [v.id, String(v.price)])
    ),
    newVariantRows: [],
    deletedVariantIds: new Set(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (!(item.variants?.length) && form.price !== "") {
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

      onSaved({
        name: form.name.trim(),
        short_name: form.shortName.trim() || null,
        subcategory: form.subcategory.trim() || null,
        pos_id: form.posId.trim() || null,
        min_qty: parseInt(form.minQty) || 1,
        ...(!(item.variants?.length) && form.price !== ""
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
          maxHeight: "85vh",
          overflowY: "auto",
          boxSizing: "border-box",
          fontFamily: "'DM Sans', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>
          Edit: {item.name}
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
        {!(item.variants?.length) && (
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

        {item.category?.name === "Wines" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Serving</span>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "3px 10px",
              borderRadius: 20, border: `1.5px solid ${colors.border}`,
              color: colors.secondary, background: colors.bg,
            }}>
              {item.variants?.some((v) => v.bottle_subcategory) ? "Has glass options" : "Bottle only"}
            </span>
          </div>
        )}

        {item.category?.name !== "Food" && (item.variants ?? []).length > 0 && (
          <div style={{ marginTop: 4, marginBottom: 14 }}>
            <div style={{ ...labelStyle, marginBottom: 10 }}>Variants</div>
            {/* Existing variants — price editable, deletable */}
            {item.variants.map((v) => {
              const markedForDeletion = form.deletedVariantIds.has(v.id);
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
                    style={{ ...inputStyle, width: 90 }}
                  />
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
                <div style={{ display: "grid", gridTemplateColumns: item.category?.name === "Wines" ? "1fr 80px 100px auto" : "1fr 80px auto", gap: 8, fontSize: 11, color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  <span>Label</span><span>Price</span>{item.category?.name === "Wines" && <span>Wine type</span>}<span />
                </div>
                {form.newVariantRows.map((row, i) => (
                  <VariantRowInput
                    key={i}
                    row={row}
                    index={i}
                    canRemove={true}
                    categoryName={item.category?.name ?? ""}
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
                  const catName = item.category?.name ?? "";
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
}: {
  row: VariantRowData;
  index: number;
  canRemove: boolean;
  categoryName: string;
  onChange: (patch: Partial<VariantRowData>) => void;
  onRemove: () => void;
}) {
  const variantOpts = VARIANT_OPTIONS[categoryName];
  const showWineType = categoryName === "Wines";
  const cols = showWineType ? "1fr 80px 100px auto" : "1fr 80px auto";
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
        const refreshed = await fetch(
          `${import.meta.env.VITE_DIRECTUS_URL ?? "https://cms.blasalviz.com"}/items/menu_items/${created.id}?fields=*,variants.*,category.name`,
          { headers: { Authorization: `Bearer ${import.meta.env.VITE_DIRECTUS_TOKEN ?? ""}` } }
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

// ── Section order ──────────────────────────────────────────────────────────

const SECTION_ORDER = ["Food", "Wines", "Drinks", "Shop"] as const;

// ── AdminView ──────────────────────────────────────────────────────────────

export function AdminView() {
  const { setView, showToast } = useApp();
  const { reloadMenu } = useMenu();
  const { isMobile, isTablet } = useBreakpoint();

  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [editItem, setEditItem] = useState<AdminMenuItem | null>(null);
  const [newItemCategoryId, setNewItemCategoryId] = useState<number | null>(null);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

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

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return items
      .filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.short_name ?? "").toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [query, items]);

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

  const gridCols = isMobile ? 1 : isTablet ? 2 : 3;

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

  const handleSearchSelect = (item: AdminMenuItem) => {
    setEditItem(item);
    setQuery("");
    setSearchOpen(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
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
        <button
          onClick={handleBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            color: colors.fg,
          }}
        >
          <BackIcon size={22} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 17, flex: 1 }}>Menu</span>
        <span style={{ fontSize: 12, color: colors.muted, fontWeight: 500 }}>Admin</span>
      </header>

      {/* ── Search bar ── */}
      {!loading && !loadError && (
        <div style={{ padding: "12px 16px 0", position: "relative" }}>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: colors.muted,
                fontSize: 16,
                pointerEvents: "none",
                lineHeight: 1,
              }}
            >
              ⌕
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              placeholder="Search items…"
              style={{
                ...inputStyle,
                paddingLeft: 34,
              }}
            />
            {query && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setQuery(""); setSearchOpen(false); }}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: colors.muted,
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 2,
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {searchOpen && searchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% - 2px)",
                left: 16,
                right: 16,
                background: colors.surface,
                border: `1.5px solid ${colors.border}`,
                borderRadius: radii.md,
                zIndex: 50,
                boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                overflow: "hidden",
              }}
            >
              {searchResults.map((item) => {
                const priceLabel = item.variants?.length
                  ? `${item.variants.length}v`
                  : item.price != null
                  ? `€${Number(item.price).toFixed(2)}`
                  : "—";
                return (
                  <button
                    key={item.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSearchSelect(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "11px 14px",
                      background: "none",
                      border: "none",
                      borderBottom: `1px solid ${colors.border}`,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: 500,
                        color: colors.fg,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: colors.muted,
                        background: colors.chipBg,
                        borderRadius: 4,
                        padding: "2px 6px",
                        flexShrink: 0,
                      }}
                    >
                      {item.category?.name ?? "?"}
                    </span>
                    <span style={{ fontSize: 13, color: colors.secondary, flexShrink: 0 }}>
                      {priceLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Loading / Error ── */}
      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 200,
            color: colors.muted,
            fontSize: 15,
          }}
        >
          Loading…
        </div>
      )}

      {loadError && (
        <div
          style={{
            padding: 16,
            background: colors.dangerBg,
            color: colors.danger,
            fontSize: 14,
          }}
        >
          Failed to load: {loadError}
        </div>
      )}

      {/* ── Sections grid ── */}
      {!loading && !loadError && (
        <div
          style={{
            padding: 16,
            display: "grid",
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gap: 16,
            alignItems: "start",
          }}
        >
          {sections.map(({ name, catId, sectionItems }) => {
            const collapsed = collapsedSections.has(name);
            const toggleCollapse = () =>
              setCollapsedSections((prev) => {
                const next = new Set(prev);
                collapsed ? next.delete(name) : next.add(name);
                return next;
              });
            return (
              <div
                key={name}
                style={{
                  background: colors.surface,
                  borderRadius: radii.lg,
                  border: `1px solid ${colors.border}`,
                  overflow: "hidden",
                }}
              >
                {/* Section header */}
                <div
                  style={{
                    padding: "11px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: collapsed ? "none" : `1px solid ${colors.border}`,
                    background: colors.bg,
                  }}
                >
                  <button
                    onClick={toggleCollapse}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flex: 1,
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: colors.dimmed,
                        transition: "transform 0.18s",
                        transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
                        display: "inline-block",
                        lineHeight: 1,
                      }}
                    >
                      ▾
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: colors.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {name}
                      <span style={{ marginLeft: 6, fontWeight: 400, color: colors.dimmed }}>
                        {sectionItems.length}
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setNewItemCategoryId(catId);
                      setShowNewItemModal(true);
                    }}
                    style={{
                      background: "none",
                      border: `1.5px solid ${colors.border}`,
                      borderRadius: 6,
                      width: 26,
                      height: 26,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: colors.secondary,
                      fontSize: 18,
                      lineHeight: 1,
                      padding: 0,
                      fontFamily: "inherit",
                    }}
                    title={`Add item to ${name}`}
                  >
                    +
                  </button>
                </div>

                {/* Items list */}
                {!collapsed && (
                  sectionItems.length === 0 ? (
                    <div
                      style={{
                        padding: "20px 16px",
                        color: colors.dimmed,
                        fontSize: 13,
                        textAlign: "center",
                      }}
                    >
                      No items
                    </div>
                  ) : (
                    sectionItems.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        toggling={toggling.has(item.id)}
                        onToggle={() => handleToggle(item)}
                        onEdit={() => setEditItem(item)}
                      />
                    ))
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {editItem && (
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
