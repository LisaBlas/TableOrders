import { useState } from "react";
import type { DeadItemData } from "../../utils/analytics";
import { colors, radii } from "../../styles/tokens";

interface Props {
  items: DeadItemData[];
}

const PAGE_SIZE = 5;

export function ZeroSalesCard({ items }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const visible = expanded ? items : items.slice(0, PAGE_SIZE);

  return (
    <div
      style={{
        background: colors.surface,
        borderRadius: radii.lg,
        border: `1px solid ${colors.border}`,
        padding: "16px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>No Sales This Period</span>
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
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
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
            <span style={{ fontSize: 11, color: colors.dimmed, flexShrink: 0, marginLeft: 10 }}>
              {item.category}
            </span>
          </div>
        ))}
      </div>

      {items.length > PAGE_SIZE && (
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
          {expanded ? "Show less" : `Show ${items.length - PAGE_SIZE} more`}
        </button>
      )}
    </div>
  );
}
