import type { HourData } from "../../utils/analytics";
import { colors, radii } from "../../styles/tokens";

interface Props {
  hours: HourData[];
}

export function PeakHoursChart({ hours }: Props) {
  const maxRevenue = Math.max(...hours.map((h) => h.revenue), 1);

  if (hours.length === 0) {
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
        Peak Hours
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {hours.map((h) => (
          <div key={h.hour} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: colors.muted, width: 38, flexShrink: 0 }}>
              {h.label}
            </span>
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
                  width: `${(h.revenue / maxRevenue) * 100}%`,
                  background: "#b0a898",
                  borderRadius: 4,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 12,
                color: colors.muted,
                width: 50,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              €{h.revenue.toFixed(0)}
            </span>
            <span
              style={{
                fontSize: 11,
                color: colors.dimmed,
                width: 28,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              ×{h.billCount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
