import type { KpiWithDeltas, DayData, CategoryData } from "../../utils/analytics";
import { computeInsights } from "../../utils/analytics";
import { colors } from "../../styles/tokens";

interface Props {
  kpis: KpiWithDeltas;
  days: DayData[];
  categories: CategoryData[];
  embedded?: boolean;
}

export function InsightStrip({ kpis, days, categories, embedded = false }: Props) {
  const insights = computeInsights(kpis, days, categories);
  if (insights.length === 0) return null;

  return (
    <div
      style={{
        padding: embedded ? "10px 12px" : "8px 16px",
        display: "flex",
        gap: embedded ? 8 : 16,
        flexWrap: "wrap",
        fontSize: 12,
        color: colors.muted,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {insights.map((text, i) => (
        <span
          key={i}
          style={
            embedded
              ? {
                  padding: "5px 8px",
                  borderRadius: 999,
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                }
              : undefined
          }
        >
          {text}
        </span>
      ))}
    </div>
  );
}
