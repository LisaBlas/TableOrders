import type { WeekdayData } from "../../utils/analytics";
import { daysBetween } from "../../utils/analytics";
import { colors, radii } from "../../styles/tokens";

interface Props {
  weekdays: WeekdayData[];
  start: string;
  end: string;
}

export function WeekdayPattern({ weekdays, start, end }: Props) {
  const rangeDays = daysBetween(start, end);
  const maxAvg = Math.max(...weekdays.map((w) => w.avgRevenue), 1);
  const shortSample = rangeDays < 28;

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Weekday Pattern</span>
        {shortSample && (
          <span style={{ fontSize: 11, color: colors.muted }}>Best with 4+ weeks of data</span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {weekdays.map((wd) => (
          <div key={wd.day} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: colors.muted, width: 28, flexShrink: 0 }}>{wd.label}</span>
            <div
              style={{
                flex: 1,
                height: 8,
                background: colors.bg,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(wd.avgRevenue / maxAvg) * 100}%`,
                  background: wd.avgRevenue > 0 ? "#b0a898" : colors.border,
                  borderRadius: 4,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: colors.muted, width: 50, textAlign: "right", flexShrink: 0 }}>
              {wd.avgRevenue > 0 ? `€${wd.avgRevenue.toFixed(0)}` : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
