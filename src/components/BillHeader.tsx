import { S } from "../styles/appStyles";
import type { TableId } from "../types";

interface BillHeaderProps {
  tableId: TableId;
  editingBill: boolean;
  onEditToggle: () => void;
  onGutscheinOpen: () => void;
}

export function BillHeader({ tableId, editingBill, onEditToggle, onGutscheinOpen }: BillHeaderProps) {
  return (
    <div style={S.billHeader}>
      <div>
        <div style={S.closeReceiptBrand}>Käserei Camidi</div>
        <div style={S.closeReceiptMeta}>
          Table {tableId} ·{" "}
          {new Date().toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
      <div style={S.billHeaderActions}>
        <button
          style={editingBill ? S.billIconBtnActive : S.billIconBtn}
          onClick={onEditToggle}
          title={editingBill ? "Done" : "Edit"}
        >
          {editingBill ? "✓" : "✏️"}
        </button>
        <button style={S.billIconBtn} onClick={onGutscheinOpen} title="Apply Voucher">
          🎫
        </button>
      </div>
    </div>
  );
}
