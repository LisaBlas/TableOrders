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
  const lowData = rangeDays < 14;
  const showSampleCount = rangeDays >= 28;

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
        <span style={{ fontSize: 13, fontWeight: 600 }}>Weekday Pattern</span>
        {lowData && (
          <span style={{ fontSize: 12, color: colors.danger, fontWeight: 500 }}>Not enough data</span>
        )}
        {!lowData && rangeDays < 28 && (
          <span style={{ fontSize: 11, color: colors.muted }}>Best with 4+ weeks</span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {weekdays.map((wd) => (
          <div key={wd.day} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: colors.muted }}>{wd.label}</span>
              {showSampleCount && wd.dayCount > 0 && (
                <span style={{ fontSize: 10, color: colors.dimmed, marginLeft: 3 }}>×{wd.dayCount}</span>
              )}
            </div>
            <div
              style={{
                flex: 1,
                height: 8,
                background: colors.bg,
                borderRadius: 4,
                overflow: "hidden",
                opacity: lowData ? 0.4 : 1,
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
