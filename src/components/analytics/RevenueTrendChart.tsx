import { useState, useEffect } from "react";
import type { DayData } from "../../utils/analytics";
import { fmtEurFull } from "../../utils/analytics";
import { colors, radii, chartColors } from "../../styles/tokens";

interface Props {
  days: DayData[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function shortLabel(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(d)}/${Number(m)}`;
}

function dayOfWeekLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DAY_LABELS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function RevenueTrendChart({ days }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const maxRevenue = Math.max(...days.map((d) => d.revenue), 1);

  useEffect(() => {
    const withIdx = days.map((d, i) => ({ r: d.revenue, i })).filter((x) => x.r > 0);
    const last = withIdx[withIdx.length - 1];
    setSelectedIdx(last?.i ?? null);
  }, [days.length]);

  const selected = selectedIdx !== null ? days[selectedIdx] : null;
  const showDayLabels = days.length <= 14;

  return (
    <div
      style={{
        background: colors.surface,
        borderRadius: radii.lg,
        border: `1px solid ${colors.border}`,
        padding: "16px 16px 12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: colors.muted }}>Revenue Trend</span>
        {maxRevenue > 1 && !selected && (
          <span style={{ fontSize: 12, color: colors.muted }}>
            Peak <b style={{ color: colors.fg }}>€{maxRevenue.toFixed(0)}</b>
          </span>
        )}
        {selected && (
          <button
            onClick={() => setSelectedIdx(null)}
            style={{
              fontSize: 11,
              color: colors.muted,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Selected day info strip */}
      {selected && (
        <div
          style={{
            background: colors.bg,
            borderRadius: radii.sm,
            padding: "8px 12px",
            marginBottom: 10,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            fontSize: 12,
          }}
        >
          <span style={{ fontWeight: 600 }}>{dayOfWeekLabel(selected.date)} {shortLabel(selected.date)}</span>
          <span style={{ color: colors.muted }}>Revenue <b style={{ color: colors.fg }}>{fmtEurFull(selected.revenue)}</b></span>
          <span style={{ color: colors.muted }}>Covers <b style={{ color: colors.fg }}>{selected.covers}</b></span>
          <span style={{ color: colors.muted }}>Avg Bill <b style={{ color: colors.fg }}>{fmtEurFull(selected.avgBill)}</b></span>
          <span style={{ color: colors.muted }}>Bills <b style={{ color: colors.fg }}>{selected.billCount}</b></span>
        </div>
      )}

      {/* Bars */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: days.length > 20 ? 2 : days.length > 10 ? 3 : 4,
          height: showDayLabels ? 92 : 80,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {days.map((day, i) => {
          const CHART_PX = 72;
          const barPx = day.revenue > 0
            ? Math.max(Math.round((day.revenue / maxRevenue) * CHART_PX), 3)
            : 1;
          const isSelected = selectedIdx === i;
          const hasData = day.revenue > 0;
          return (
            <div
              key={day.date}
              onClick={() => setSelectedIdx(isSelected ? null : i)}
              title={`${day.date}: €${day.revenue.toFixed(2)}`}
              style={{
                flex: 1,
                minWidth: days.length > 20 ? 6 : days.length > 10 ? 8 : 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 2,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: barPx,
                  background: isSelected
                    ? colors.fg
                    : hasData
                    ? chartColors.accent
                    : colors.border,
                  borderRadius: "2px 2px 0 0",
                  transition: "background 0.1s",
                  flexShrink: 0,
                }}
              />
              {showDayLabels && (
                <span
                  style={{
                    fontSize: 9,
                    color: isSelected ? colors.fg : colors.dimmed,
                    fontWeight: isSelected ? 700 : 400,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {dayOfWeekLabel(day.date).slice(0, 2)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* X-axis date labels for 7-day view */}
      {days.length <= 7 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          {days.map((day, i) => (
            <span
              key={day.date}
              style={{
                fontSize: 10,
                color: selectedIdx === i ? colors.fg : colors.dimmed,
                flex: 1,
                textAlign: "center",
              }}
            >
              {shortLabel(day.date)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
