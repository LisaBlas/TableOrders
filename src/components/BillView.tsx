import { useTable } from "../contexts/TableContext";
import { S } from "../styles/appStyles";
import { BillTab } from "./BillTab";
import { ScreenHeader } from "./ScreenHeader";
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
      <ScreenHeader title={`Table ${resolveTableDisplayId(tableId)}`} left="back" onBack={onClose} />

      <BillTab tableId={tableId} sent={sent} />
    </div>
  );
}
