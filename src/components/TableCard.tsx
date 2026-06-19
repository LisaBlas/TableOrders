import type { CSSProperties } from "react";
import type { TableId, StatusConfig } from "../types";
import { S } from "../styles/appStyles";
import { swapColors } from "../styles/tokens";

const DESTINATION_EMOJI: Record<string, string> = { bar: "🍷", counter: "🧀", kitchen: "🍽️" };

function tableLabelFontSize(label: string): number {
  const len = label.length;
  if (len <= 3) return 22;
  if (len <= 6) return 17;
  if (len <= 9) return 13;
  return 11;
}

type SwapStatus = "none" | "source" | "target" | "dimmed";

function getSwapStyles(swapStatus: SwapStatus, cfg: StatusConfig) {
  if (swapStatus === "source") {
    return {
      bg: swapColors.sourceBg,
      border: `2px solid ${swapColors.sourceBorder}`,
      statusColor: swapColors.sourceBorder,
      statusLabel: "moving",
    };
  }
  if (swapStatus === "target") {
    return {
      bg: swapColors.targetBg,
      border: `2px solid ${swapColors.targetBorder}`,
      statusColor: swapColors.targetBorder,
      statusLabel: "selected",
    };
  }
  return {
    bg: cfg.bg,
    border: `1.5px solid ${cfg.border}`,
    statusColor: cfg.text,
    statusLabel: cfg.label,
  };
}

interface TableCardStyle {
  base: CSSProperties;
  isWide: boolean;
}

interface TableCardHandlers {
  onPointerDown?: () => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onClick: () => void;
}

interface TableCardProps {
  tableId: TableId;
  label?: string;
  cfg: StatusConfig;
  swapStatus: SwapStatus;
  destinations: string[];
  style: TableCardStyle;
  handlers: TableCardHandlers;
}

export function TableCard({
  tableId,
  label,
  cfg,
  swapStatus,
  destinations,
  style,
  handlers,
}: TableCardProps) {
  const { bg, border, statusColor, statusLabel } = getSwapStyles(swapStatus, cfg);
  const cardOpacity = swapStatus === "dimmed" ? 0.5 : 1;

  return (
    <button
      style={{
        ...style.base,
        background: bg,
        border: border,
        opacity: cardOpacity,
        transition: "opacity 0.2s ease, border 0.15s ease",
        userSelect: "none",
        WebkitUserSelect: "none",
        animation: "slideUpFade 0.15s ease-out",
        animationFillMode: "backwards",
      }}
      onPointerDown={handlers.onPointerDown}
      onPointerUp={handlers.onPointerUp}
      onPointerLeave={handlers.onPointerLeave}
      onPointerCancel={handlers.onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
      onClick={handlers.onClick}
    >
      {swapStatus === "source" && (
        <span style={{ fontSize: 10, fontWeight: 700, color: swapColors.sourceBorder, letterSpacing: "0.3px", marginBottom: 2 }}>
          MOVING
        </span>
      )}
      {swapStatus === "target" && (
        <span style={{ fontSize: 10, fontWeight: 700, color: swapColors.targetBorder, letterSpacing: "0.3px", marginBottom: 2 }}>
          DESTINATION
        </span>
      )}
      {swapStatus === "none" && <span style={{ ...S.tableDot, background: cfg.dot }} />}
      <span style={{ ...S.tableNum, fontSize: tableLabelFontSize(label ?? String(tableId)) }}>
        {label ?? tableId}
      </span>
      <span style={{ ...S.tableStatus, color: statusColor }}>{statusLabel}</span>
      {destinations.length > 0 && (
        <span
          style={{
            position: "absolute",
            top: 5,
            right: 6,
            fontSize: style.isWide ? 11 : 9,
            letterSpacing: 1,
            lineHeight: 1,
          }}
        >
          {destinations.map((d) => DESTINATION_EMOJI[d]).join("")}
        </span>
      )}
    </button>
  );
}
