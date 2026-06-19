import { useTable } from "../contexts/TableContext";
import { S } from "../styles/appStyles";
import { colors } from "../styles/tokens";
import { EditIcon, VoucherIcon } from "./icons";
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
        {editingBill ? (
          <div
            style={{
              ...S.billIconBtn,
              width: "auto",
              padding: "0 10px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "default",
              color: colors.muted,
            }}
          >
            Editing...
          </div>
        ) : (
          <button style={S.billIconBtn} onClick={onEditToggle} title="Edit">
            <EditIcon size={16} />
          </button>
        )}
        <button style={S.billIconBtn} onClick={onGutscheinOpen} title="Apply Voucher">
          <VoucherIcon size={16} />
        </button>
      </div>
    </div>
  );
}
