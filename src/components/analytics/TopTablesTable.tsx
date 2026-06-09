import type { TableData } from "../../utils/analytics";
import type { TableId } from "../../types";
import { colors, radii } from "../../styles/tokens";

interface Props {
  tables: TableData[];
  resolveLabel: (id: TableId) => string;
}

export function TopTablesTable({ tables, resolveLabel }: Props) {
  if (tables.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: colors.surface,
        borderRadius: radii.lg,
        border: `1px solid ${colors.border}`,
        margin: "12px 16px 0",
        padding: "16px",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 14 }}>
        Top Tables
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {tables.map((t, i) => (
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
                Table {resolveLabel(t.tableId)}
              </div>
              <div style={{ fontSize: 11, color: colors.muted }}>
                {t.billCount} bill{t.billCount !== 1 ? "s" : ""} · €{t.avgBill.toFixed(0)} avg
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              €{t.revenue.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
