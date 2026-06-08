import type { CategoryData } from "../../utils/analytics";
import { colors, radii } from "../../styles/tokens";

interface Props {
  categories: CategoryData[];
}

export function CategoryBreakdown({ categories }: Props) {
  const maxRevenue = Math.max(...categories.map((c) => c.revenue), 1);

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
        Revenue Mix
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {categories.map((cat) => (
          <div key={cat.category}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{cat.category}</span>
              <span style={{ fontSize: 12, color: colors.muted }}>
                €{cat.revenue.toFixed(0)}{" "}
                <span style={{ color: colors.dimmed }}>{cat.pct.toFixed(0)}%</span>
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: colors.bg,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(cat.revenue / maxRevenue) * 100}%`,
                  background: cat.revenue > 0 ? "#b0a898" : colors.border,
                  borderRadius: 3,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
