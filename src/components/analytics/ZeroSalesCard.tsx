import { useState } from "react";
import type { DeadItemData } from "../../utils/analytics";
import { colors, radii } from "../../styles/tokens";

interface Props {
  items: DeadItemData[];
}

const PAGE_SIZE = 5;

export function ZeroSalesCard({ items }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (items.length === 0) return null;

  const categories = Array.from(
    items.reduce((map, item) => {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  const filtered = selectedCategory === "all" ? items : items.filter((i) => i.category === selectedCategory);
  const visible = expanded ? filtered : filtered.slice(0, PAGE_SIZE);

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
      <span style={{ fontSize: 12, fontWeight: 500, color: colors.muted, display: "block", marginBottom: 10 }}>
        No Sales
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: 14,
          marginLeft: -16,
          marginRight: -16,
        }}
      >
        {/* Category tabs — scrollable */}
        <div style={{ display: "flex", flex: 1, overflowX: "auto", scrollbarWidth: "none", paddingLeft: 16 }}>
          {(["all", ...categories] as const).map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => selectCategory(cat)}
                style={{
                  padding: "9px 10px",
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${active ? colors.fg : "transparent"}`,
                  marginBottom: -1,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? colors.fg : colors.muted,
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

        {/* Count badge — pinned right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            borderLeft: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: colors.muted,
              background: colors.inputBg,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.pill,
              padding: "2px 8px",
            }}
          >
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {visible.map((item) => (
          <div
            key={`${item.category}:${item.name}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "7px 0",
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
              {item.name}
            </span>
            {selectedCategory === "all" && (
              <span style={{ fontSize: 11, color: colors.dimmed, flexShrink: 0, marginLeft: 10 }}>
                {item.category}
              </span>
            )}
          </div>
        ))}
      </div>

      {filtered.length > PAGE_SIZE && (
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
          {expanded ? "Show less" : `Show ${filtered.length - PAGE_SIZE} more`}
        </button>
      )}
    </div>
  );
}
