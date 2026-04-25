import type { CSSProperties } from "react";
import type { TableId, StatusConfig } from "../types";
import { S } from "../styles/appStyles";

const DESTINATION_EMOJI: Record<string, string> = { bar: "🍷", counter: "🧀", kitchen: "🍽️" };

interface TableCardProps {
  tableId: TableId;
  cfg: StatusConfig;
  isSource: boolean;
  isTarget: boolean;
  inSwapMode: boolean;
  destinations: string[];
  isWide: boolean;
  baseStyle: CSSProperties;
  staggerIndex?: number;
  onPointerDown?: () => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onClick: () => void;
}

export function TableCard({
  tableId,
  cfg,
  isSource,
  isTarget,
  inSwapMode,
  destinations,
  isWide,
  baseStyle,
  staggerIndex = 0,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onClick,
}: TableCardProps) {
  const cardBg = isSource ? "#fffbeb" : isTarget ? "#eff6ff" : cfg.bg;
  const cardBorder = isSource
    ? "2px solid #f59e0b"
    : isTarget
    ? "2px solid #3b82f6"
    : `1.5px solid ${cfg.border}`;
  const cardOpacity = inSwapMode && !isSource && !isTarget ? 0.5 : 1;
  const statusColor = isSource ? "#f59e0b" : isTarget ? "#3b82f6" : cfg.text;
  const statusLabel = isSource ? "moving" : isTarget ? "selected" : cfg.label;

  return (
    <button
      style={{
        ...baseStyle,
        background: cardBg,
        border: cardBorder,
        opacity: cardOpacity,
        transition: "opacity 0.2s ease, border 0.15s ease",
        userSelect: "none",
        WebkitUserSelect: "none",
        animation: "slideUpFade 0.4s ease-out",
        animationDelay: `${staggerIndex * 0.05}s`,
        animationFillMode: "backwards",
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {isSource && (
        <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.3px", marginBottom: 2 }}>
          MOVING
        </span>
      )}
      {isTarget && (
        <span style={{ fontSize: 10, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.3px", marginBottom: 2 }}>
          DESTINATION
        </span>
      )}
      {!isSource && !isTarget && <span style={{ ...S.tableDot, background: cfg.dot }} />}
      <span style={S.tableNum}>{tableId}</span>
      <span style={{ ...S.tableStatus, color: statusColor }}>{statusLabel}</span>
      {destinations.length > 0 && (
        <span
          style={{
            position: "absolute",
            top: 5,
            right: 6,
            fontSize: isWide ? 11 : 9,
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
