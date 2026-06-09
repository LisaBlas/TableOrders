import type { KpiWithDeltas, DayData, CategoryData } from "../../utils/analytics";
import { computeInsights } from "../../utils/analytics";
import { colors } from "../../styles/tokens";

interface Props {
  kpis: KpiWithDeltas;
  days: DayData[];
  categories: CategoryData[];
}

export function InsightStrip({ kpis, days, categories }: Props) {
  const insights = computeInsights(kpis, days, categories);
  if (insights.length === 0) return null;

  return (
    <div
      style={{
        padding: "8px 16px",
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        fontSize: 12,
        color: colors.muted,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {insights.map((text, i) => (
        <span key={i}>{text}</span>
      ))}
    </div>
  );
}
