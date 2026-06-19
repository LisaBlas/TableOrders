import type { CSSProperties } from "react";
import type { TableId } from "../types";
import { S } from "../styles/appStyles";
import { colors } from "../styles/tokens";

interface SwapSheetProps {
  sourceTable: TableId;
  targetTable: TableId | null;
  onConfirm: () => void;
  onCancel: () => void;
  headerText?: string;
  hintText?: string;
}

const cancelStyle: CSSProperties = {
  flex: 1,
  padding: "14px 0",
  borderRadius: 10,
  border: `1.5px solid ${colors.border}`,
  background: colors.bg,
  fontSize: 15,
  fontWeight: 600,
  color: colors.subtle,
  cursor: "pointer",
};

export function SwapSheet({ sourceTable, targetTable, onConfirm, onCancel, headerText, hintText }: SwapSheetProps) {
  const hasTarget = targetTable !== null;

  return (
    <div style={S.variantSheet}>
      <div style={S.variantSheetHeader}>{headerText ?? `Move Table ${sourceTable}`}</div>
      <div style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 20 }}>
        {hintText ?? (hasTarget ? `Table ${sourceTable} → Table ${targetTable}` : "Tap a table to select destination")}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={cancelStyle} onClick={onCancel}>
          Cancel
        </button>
        <button
          style={{
            flex: 1,
            padding: "14px 0",
            borderRadius: 10,
            border: "none",
            background: hasTarget ? colors.fg : colors.divider,
            fontSize: 15,
            fontWeight: 600,
            color: colors.surface,
            cursor: hasTarget ? "pointer" : "default",
          }}
          onClick={onConfirm}
          disabled={!hasTarget}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
