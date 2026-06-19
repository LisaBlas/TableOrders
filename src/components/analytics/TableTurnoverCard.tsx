import { useState } from "react";
import type { TableTurnoverData } from "../../utils/analytics";
import type { TableId } from "../../types";
import { colors, radii } from "../../styles/tokens";

interface Props {
  tables: TableTurnoverData[];
  resolveLabel: (id: TableId) => string;
}

const PAGE_SIZE = 5;

export function TableTurnoverCard({ tables, resolveLabel }: Props) {
  const [sortBy, setSortBy] = useState<"turns" | "revenue">("turns");
  const [expanded, setExpanded] = useState(false);

  if (tables.length === 0) return null;

  const sorted = [...tables].sort((a, b) =>
    sortBy === "turns"
      ? b.turnsPerDay - a.turnsPerDay || b.totalRevenue - a.totalRevenue
      : b.revenuePerSession - a.revenuePerSession || b.turnsPerDay - a.turnsPerDay,
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
            Table Turnover
          </span>
          <span style={{ fontSize: 11, color: colors.dimmed }}>
            Sessions per day
          </span>
        </div>

        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {(["turns", "revenue"] as const).map((mode) => {
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
                {mode === "turns" ? "Turns" : "€/visit"}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {visible.map((t, i) => {
          const label = resolveLabel(t.tableId);
          const turnsLabel =
            t.turnsPerDay >= 1
              ? `${t.turnsPerDay.toFixed(1)}/day`
              : `${(t.turnsPerDay * 7).toFixed(1)}/wk`;

          return (
            <div
              key={String(t.tableId)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: colors.dimmed,
                  width: 18,
                  flexShrink: 0,
                  textAlign: "right",
                }}
              >
                {i + 1}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  Table {label}
                </div>
                <div style={{ fontSize: 11, color: colors.muted }}>
                  {t.sessions} session{t.sessions !== 1 ? "s" : ""}
                  {t.coversPerSession > 0 &&
                    ` · ${t.coversPerSession.toFixed(1)} guests avg`}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  flexShrink: 0,
                  gap: 1,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {turnsLabel}
                </span>
                <span style={{ fontSize: 11, color: colors.dimmed }}>
                  €{t.revenuePerSession.toFixed(0)}/visit
                </span>
              </div>
            </div>
          );
        })}
      </div>

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
  );
}
