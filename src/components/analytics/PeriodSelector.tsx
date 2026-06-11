import { useState } from "react";
import type { AnalyticsPeriod, DateRange } from "../../utils/analytics";
import { colors, radii } from "../../styles/tokens";
import { todayBusinessDate } from "../../services/directusBills";

interface Props {
  period: AnalyticsPeriod;
  customStart: string;
  customEnd: string;
  currentRange: DateRange;
  priorRange: DateRange;
  onPeriodChange: (p: AnalyticsPeriod) => void;
  onCustomRangeChange: (start: string, end: string) => void;
  embedded?: boolean;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function fmtDate(d: string): string {
  const [, m, day] = d.split("-").map(Number);
  return `${MONTHS[m - 1]} ${day}`;
}

function fmtRange(start: string, end: string): string {
  return start === end ? fmtDate(start) : `${fmtDate(start)}–${fmtDate(end)}`;
}

function parseDate(d: string): Date {
  const [year, month, day] = d.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getCalendarDays(monthDate: Date): (string | null)[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayOffset = (first.getDay() + 6) % 7;
  const days: (string | null)[] = Array.from({ length: mondayOffset }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(toDateString(new Date(year, month, day)));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
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
  embedded = false,
}: Props) {
  const today = todayBusinessDate();
  const [draftStart, setDraftStart] = useState(customStart);
  const [draftEnd, setDraftEnd] = useState(customEnd);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => parseDate(customEnd || today));
  const calendarDays = getCalendarDays(visibleMonth);
  const canApply = !!draftStart && !!draftEnd && draftStart <= draftEnd;
  const canGoNext = toDateString(addMonths(visibleMonth, 1)) <= toDateString(new Date(parseDate(today).getFullYear(), parseDate(today).getMonth(), 1));

  function handleSegment(p: AnalyticsPeriod) {
    onPeriodChange(p);
    if (p === "custom") {
      setDraftStart(customStart);
      setDraftEnd(customEnd);
      setVisibleMonth(parseDate(customEnd || today));
      setCalendarOpen(true);
      setSelectingEnd(false);
    }
  }

  function handleApply() {
    if (canApply) {
      onCustomRangeChange(draftStart, draftEnd);
      setCalendarOpen(false);
      setSelectingEnd(false);
    }
  }

  function handleCancel() {
    setDraftStart(customStart);
    setDraftEnd(customEnd);
    setVisibleMonth(parseDate(customEnd || today));
    setCalendarOpen(false);
    setSelectingEnd(false);
  }

  function handleDateClick(date: string) {
    if (date > today) return;

    if (!selectingEnd || !draftStart) {
      setDraftStart(date);
      setDraftEnd(date);
      setSelectingEnd(true);
      return;
    }

    if (date < draftStart) {
      setDraftEnd(draftStart);
      setDraftStart(date);
    } else {
      setDraftEnd(date);
    }
    setSelectingEnd(false);
  }

  return (
    <div
      style={{
        padding: embedded ? "12px 12px 10px" : undefined,
        borderBottom: embedded ? `1px solid ${colors.border}` : undefined,
      }}
    >
      {/* Segment row */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: embedded ? 0 : "10px 16px 0",
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
      <div style={{ padding: embedded ? "8px 0 0" : "5px 16px 0", fontSize: 12, color: colors.muted }}>
        {fmtRange(currentRange.start, currentRange.end)}
        <span style={{ margin: "0 5px" }}>·</span>
        vs {fmtRange(priorRange.start, priorRange.end)}
      </div>

      {calendarOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Select custom date range"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: colors.overlay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={handleCancel}
        >
          <div
            style={{
              width: "min(100%, 360px)",
              padding: 14,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.lg,
              background: colors.surface,
              boxShadow: "0 18px 48px rgba(0,0,0,0.22)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Custom range</div>
                <div style={{ marginTop: 3, fontSize: 12, color: colors.muted }}>
                  {draftStart && draftEnd ? fmtRange(draftStart, draftEnd) : "Select one day or a range"}
                </div>
              </div>
              <button
                onClick={handleCancel}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: radii.sm,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.fg,
                  fontSize: 18,
                  lineHeight: 1,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
                aria-label="Close calendar"
              >
                x
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <button
                onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
                style={calendarNavStyle}
                aria-label="Previous month"
              >
                {"<"}
              </button>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {MONTH_NAMES[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </span>
              <button
                onClick={() => canGoNext && setVisibleMonth((month) => addMonths(month, 1))}
                disabled={!canGoNext}
                style={{ ...calendarNavStyle, opacity: canGoNext ? 1 : 0.35, cursor: canGoNext ? "pointer" : "default" }}
                aria-label="Next month"
              >
                {">"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
              {WEEKDAYS.map((day, index) => (
                <div key={`${day}-${index}`} style={{ fontSize: 11, color: colors.muted, textAlign: "center", padding: "4px 0" }}>
                  {day}
                </div>
              ))}
              {calendarDays.map((date, index) => {
                const disabled = !date || date > today;
                const isStart = !!date && date === draftStart;
                const isEnd = !!date && date === draftEnd;
                const inRange = !!date && !!draftStart && !!draftEnd && date > draftStart && date < draftEnd;
                const selected = isStart || isEnd;

                return (
                  <button
                    key={date ?? `blank-${index}`}
                    onClick={() => date && handleDateClick(date)}
                    disabled={disabled}
                    style={{
                      height: 38,
                      border: "none",
                      borderRadius: selected ? radii.sm : 6,
                      background: selected ? colors.fg : inRange ? colors.chipBg : "transparent",
                      color: selected ? colors.surface : disabled ? colors.dimmed : colors.fg,
                      fontSize: 13,
                      fontWeight: selected ? 700 : 500,
                      fontFamily: "inherit",
                      cursor: disabled ? "default" : "pointer",
                      visibility: date ? "visible" : "hidden",
                    }}
                  >
                    {date ? parseDate(date).getDate() : ""}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: "8px 14px",
                  borderRadius: radii.sm,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.fg,
                  fontSize: 13,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!canApply}
                style={{
                  padding: "8px 16px",
                  borderRadius: radii.sm,
                  border: "none",
                  background: colors.fg,
                  color: colors.surface,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: canApply ? "pointer" : "default",
                  opacity: canApply ? 1 : 0.4,
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const calendarNavStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: radii.sm,
  border: `1px solid ${colors.border}`,
  background: colors.surface,
  color: colors.fg,
  fontSize: 18,
  lineHeight: 1,
  fontFamily: "inherit",
  cursor: "pointer",
};
