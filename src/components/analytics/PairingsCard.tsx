import { useState } from "react";
import type { PairingData } from "../../utils/analytics";
import { colors, radii } from "../../styles/tokens";

interface Props {
  pairings: PairingData[];
}

const PAGE_SIZE = 5;

const CATEGORY_COLOR: Record<string, string> = {
  Food:   "#8a9a6a",
  Wines:  "#9a6a6a",
  Drinks: "#6a7a9a",
  Shop:   "#8a7a6a",
};

export function PairingsCard({ pairings }: Props) {
  const [sortBy, setSortBy] = useState<"lift" | "count">("lift");
  const [expanded, setExpanded] = useState(false);

  const sorted = [...pairings].sort((a, b) =>
    sortBy === "lift"
      ? b.lift - a.lift || b.count - a.count
      : b.count - a.count || b.lift - a.lift,
  );
  const visible = expanded ? sorted : sorted.slice(0, PAGE_SIZE);

  return (
    <div
      style={{
        background: colors.surface,
        borderRadius: radii.lg,
        border: `1px solid ${colors.border}`,
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div>
          <span
            style={{ fontSize: 12, fontWeight: 500, color: colors.muted, display: "block" }}
          >
            Top Pairings
          </span>
          <span style={{ fontSize: 11, color: colors.dimmed }}>
            Ordered at the same table
          </span>
        </div>

        {pairings.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {(["lift", "count"] as const).map((mode) => {
              const active = sortBy === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setSortBy(mode)}
                  style={{
                    padding: "3px 7px",
                    borderRadius: radii.pill,
                    border: `1px solid ${active ? colors.fg : colors.border}`,
                    background: active ? colors.fg : "none",
                    color: active ? colors.surface : colors.muted,
                    fontSize: 11,
                    fontWeight: active ? 600 : 400,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {mode === "lift" ? "Lift" : "Count"}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {pairings.length === 0 ? (
        <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>
          Not enough data yet. Try a longer period.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {visible.map((pair) => (
            <div
              key={`${pair.itemA}\x00${pair.itemB}`}
              style={{
                padding: "10px 0",
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {pair.itemA}
                  <span style={{ color: colors.dimmed, fontWeight: 400, margin: "0 4px" }}>
                    +
                  </span>
                  {pair.itemB}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: colors.fg,
                    background: colors.chipBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radii.pill,
                    padding: "1px 6px",
                    flexShrink: 0,
                  }}
                >
                  {pair.lift.toFixed(1)}×
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: CATEGORY_COLOR[pair.categoryA] ?? colors.muted,
                    }}
                  >
                    {pair.categoryA}
                  </span>
                  <span style={{ fontSize: 10, color: colors.dimmed }}>·</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: CATEGORY_COLOR[pair.categoryB] ?? colors.muted,
                    }}
                  >
                    {pair.categoryB}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: colors.dimmed }}>
                  {pair.count} tables
                </span>
              </div>
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
