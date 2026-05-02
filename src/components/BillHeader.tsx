import { useTable } from "../contexts/TableContext";
import { S } from "../styles/appStyles";
import { EditIcon, CheckIcon, VoucherIcon } from "./icons";
import type { TableId } from "../types";

interface BillHeaderProps {
  tableId: TableId;
  editingBill: boolean;
  onEditToggle: () => void;
  onGutscheinOpen: () => void;
}

export function BillHeader({ tableId, editingBill, onEditToggle, onGutscheinOpen }: BillHeaderProps) {
  const { resolveTableDisplayId } = useTable();
  return (
    <div style={S.billHeader}>
      <div>
        <div style={S.closeReceiptBrand}>Käserei Camidi</div>
        <div style={S.closeReceiptMeta}>
          Table {resolveTableDisplayId(tableId)} ·{" "}
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
          {editingBill ? <CheckIcon size={16} /> : <EditIcon size={16} />}
        </button>
        <button style={S.billIconBtn} onClick={onGutscheinOpen} title="Apply Voucher">
          <VoucherIcon size={16} />
        </button>
      </div>
    </div>
  );
}
