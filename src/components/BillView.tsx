import { useTable } from "../contexts/TableContext";
import { S } from "../styles/appStyles";
import { BillTab } from "./BillTab";
import { BackIcon } from "./icons";
import type { TableId, OrderItem } from "../types";

interface BillViewProps {
  tableId: TableId;
  sent: OrderItem[];
  onClose: () => void;
}

export function BillView({ tableId, sent, onClose }: BillViewProps) {
  const { resolveTableDisplayId } = useTable();
  return (
    <div style={S.page}>
      <header style={S.billViewHeader}>
        <button style={S.back} onClick={onClose}>
          <BackIcon size={22} />
        </button>
        <span style={S.headerTitle}>Table {resolveTableDisplayId(tableId)}</span>
        <span />
      </header>

      <BillTab tableId={tableId} sent={sent} />
    </div>
  );
}
