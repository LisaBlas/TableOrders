import { useState } from "react";
import type { AnalyticsPeriod, DateRange } from "../../utils/analytics";
import { colors, radii } from "../../styles/tokens";
import { todayBerlinDate } from "../../services/directusBills";

interface Props {
  period: AnalyticsPeriod;
  customStart: string;
  customEnd: string;
  currentRange: DateRange;
  priorRange: DateRange;
  onPeriodChange: (p: AnalyticsPeriod) => void;
  onCustomRangeChange: (start: string, end: string) => void;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(d: string): string {
  const [, m, day] = d.split("-").map(Number);
  return `${MONTHS[m - 1]} ${day}`;
}

function fmtRange(start: string, end: string): string {
  return `${fmtDate(start)}–${fmtDate(end)}`;
}

const SEGMENTS: { id: AnalyticsPeriod; label: string }[] = [
  { id: "last7", label: "Last 7" },
  { id: "last30", label: "Last 30" },
  { id: "thisMonth", label: "This month" },
  { id: "custom", label: "Custom" },
];

export function PeriodSelector({
  period,
  customStart,
  customEnd,
  currentRange,
  priorRange,
  onPeriodChange,
  onCustomRangeChange,
}: Props) {
  const today = todayBerlinDate();
  const [draftStart, setDraftStart] = useState(customStart);
  const [draftEnd, setDraftEnd] = useState(customEnd);

  function handleSegment(p: AnalyticsPeriod) {
    onPeriodChange(p);
    if (p === "custom") {
      setDraftStart(customStart);
      setDraftEnd(customEnd);
    }
  }

  function handleApply() {
    if (draftStart && draftEnd && draftStart <= draftEnd) {
      onCustomRangeChange(draftStart, draftEnd);
    }
  }

  return (
    <div>
      {/* Segment row */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "10px 16px 0",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        {SEGMENTS.map((seg) => {
          const active = period === seg.id;
          return (
            <button
              key={seg.id}
              onClick={() => handleSegment(seg.id)}
              style={{
                flexShrink: 0,
                padding: "6px 14px",
                borderRadius: radii.pill,
                border: `1px solid ${active ? colors.fg : colors.border}`,
                background: active ? colors.fg : colors.surface,
                color: active ? colors.surface : colors.fg,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {seg.label}
            </button>
          );
        })}
      </div>

      {/* Date range context row */}
      <div style={{ padding: "5px 16px 0", fontSize: 12, color: colors.muted }}>
        {fmtRange(currentRange.start, currentRange.end)}
        <span style={{ margin: "0 5px" }}>·</span>
        vs {fmtRange(priorRange.start, priorRange.end)}
      </div>

      {/* Custom date inputs */}
      {period === "custom" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            flexWrap: "wrap",
          }}
        >
          <label style={{ fontSize: 13, color: colors.muted, minWidth: 36 }}>Start</label>
          <input
            type="date"
            value={draftStart}
            max={draftEnd || today}
            onChange={(e) => setDraftStart(e.target.value)}
            style={dateInputStyle}
          />
          <label style={{ fontSize: 13, color: colors.muted, minWidth: 24 }}>End</label>
          <input
            type="date"
            value={draftEnd}
            min={draftStart}
            max={today}
            onChange={(e) => setDraftEnd(e.target.value)}
            style={dateInputStyle}
          />
          <button
            onClick={handleApply}
            disabled={!draftStart || !draftEnd || draftStart > draftEnd}
            style={{
              padding: "6px 16px",
              borderRadius: radii.sm,
              border: "none",
              background: colors.fg,
              color: colors.surface,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
              opacity: !draftStart || !draftEnd || draftStart > draftEnd ? 0.4 : 1,
            }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

const dateInputStyle: React.CSSProperties = {
  padding: "5px 8px",
  borderRadius: radii.sm,
  border: `1px solid ${colors.border}`,
  background: colors.inputBg,
  fontSize: 13,
  fontFamily: "inherit",
  color: colors.fg,
};
