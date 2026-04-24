import type { CSSProperties } from "react";
import type { TableId } from "../types";
import { S } from "../styles/appStyles";

interface SwapSheetProps {
  sourceTable: TableId;
  targetTable: TableId | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const cancelStyle: CSSProperties = {
  flex: 1,
  padding: "14px 0",
  borderRadius: 10,
  border: "1.5px solid #ddd",
  background: "#f5f4f0",
  fontSize: 15,
  fontWeight: 600,
  color: "#555",
  cursor: "pointer",
};

export function SwapSheet({ sourceTable, targetTable, onConfirm, onCancel }: SwapSheetProps) {
  const hasTarget = targetTable !== null;

  return (
    <div style={S.variantSheet}>
      <div style={S.variantSheetHeader}>Move Table {sourceTable}</div>
      <div style={{ fontSize: 14, color: "#888", textAlign: "center", marginBottom: 20 }}>
        {hasTarget ? `Table ${sourceTable} → Table ${targetTable}` : "Tap a table to select destination"}
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
            background: hasTarget ? "#1a1a1a" : "#ccc",
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
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
