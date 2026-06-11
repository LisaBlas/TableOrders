import { useTable } from "../contexts/TableContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
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
  const { isTablet, isTabletLandscape, isDesktop } = useBreakpoint();
  const headerStyle = isTablet || isTabletLandscape || isDesktop ? S.headerTablet : S.header;

  return (
    <div style={S.page}>
      <header style={headerStyle}>
        <button style={S.back} onClick={onClose}>
          <BackIcon size={22} />
        </button>
        <span style={S.headerTitle}>Table {resolveTableDisplayId(tableId)}</span>
        <span style={S.headerSpacer} />
      </header>

      <BillTab tableId={tableId} sent={sent} />
    </div>
  );
}
