import { useState } from "react";
import type { ItemData } from "../../utils/analytics";
import { colors, radii } from "../../styles/tokens";

interface Props {
  items: ItemData[];
}

const PAGE_SIZE = 5;

export function TopItemsTable({ items }: Props) {
  const [sortBy, setSortBy] = useState<"revenue" | "qty">("revenue");
  const [expanded, setExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = Array.from(
    items.reduce((map, item) => {
      map.set(item.category, (map.get(item.category) ?? 0) + item.revenue);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  const filtered =
    selectedCategory === "all" ? items : items.filter((i) => i.category === selectedCategory);

  const sorted = [...filtered].sort((a, b) =>
    sortBy === "revenue" ? b.revenue - a.revenue : b.qty - a.qty,
  );
  const visible = expanded ? sorted : sorted.slice(0, PAGE_SIZE);

  function selectCategory(cat: string) {
    setSelectedCategory(cat);
    setExpanded(false);
  }

  return (
    <div
      style={{
        background: colors.surface,
        borderRadius: radii.lg,
        border: `1px solid ${colors.border}`,
        padding: "16px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: categories.length > 0 ? 10 : 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Top Items</span>
        <div style={{ display: "flex", gap: 6 }}>
          {(["revenue", "qty"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSortBy(mode)}
              style={{
                padding: "4px 10px",
                borderRadius: radii.pill,
                border: `1px solid ${sortBy === mode ? colors.fg : colors.border}`,
                background: sortBy === mode ? colors.fg : "none",
                color: sortBy === mode ? colors.surface : colors.fg,
                fontSize: 12,
                fontWeight: sortBy === mode ? 600 : 400,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              {mode === "revenue" ? "Revenue" : "Qty"}
            </button>
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            marginBottom: 14,
            paddingBottom: 2,
            scrollbarWidth: "none",
          }}
        >
          {(["all", ...categories] as const).map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => selectCategory(cat)}
                style={{
                  padding: "3px 10px",
                  borderRadius: radii.pill,
                  border: `1px solid ${active ? colors.fg : colors.border}`,
                  background: active ? colors.fg : "none",
                  color: active ? colors.surface : colors.muted,
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {cat === "all" ? "All" : cat}
              </button>
            );
          })}
        </div>
      )}

      {sorted.length === 0 ? (
        <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>No items in this period.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {visible.map((item, i) => (
            <div
              key={item.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <span style={{ fontSize: 12, color: colors.dimmed, width: 18, flexShrink: 0, textAlign: "right" }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 11, color: colors.muted }}>{item.category}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>€{item.revenue.toFixed(0)}</span>
                <span style={{ fontSize: 11, color: colors.dimmed }}>{item.pct.toFixed(0)}%</span>
              </div>
              <span style={{ fontSize: 12, color: colors.muted, flexShrink: 0, width: 32, textAlign: "right" }}>
                ×{item.qty}
              </span>
            </div>
          ))}
          {sorted.length > PAGE_SIZE && (
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                marginTop: 8,
                padding: "6px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: colors.muted,
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              {expanded ? "Show less" : `Show ${sorted.length - PAGE_SIZE} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
