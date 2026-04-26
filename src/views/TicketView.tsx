import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useTableOrder } from "../hooks/useTableOrder";
import { useSplit } from "../contexts/SplitContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { createFullTableBill } from "../utils/billFactory";
import { Receipt } from "../components/Receipt";
import { SplitOptions } from "../components/SplitOptions";
import { BackIcon } from "../components/icons";
import { S } from "../styles/appStyles";
import type { OrderItem } from "../types";

export function TicketView() {
  const app = useApp();
  const table = useTable();
  const { dispatch } = useSplit();
  const { isTablet, isTabletLandscape, isDesktop } = useBreakpoint();
  const tableId = app.ticketTable!;
  const { items: ticketItems, total: ticketTotal } = useTableOrder(tableId);

  const [confirmingClose, setConfirmingClose] = useState(false);
  const [showSplitOptions, setShowSplitOptions] = useState(false);

  const confirmClose = () => {
    const bill = createFullTableBill({
      tableId,
      orders: table.orders,
      gutschein: table.gutscheinAmounts[tableId] || 0,
    });

    app.addPaidBill(bill);
    table.cleanupTable(tableId);
    app.showToast(`Table ${tableId} closed — ${bill.total.toFixed(2)}€`);
    app.setOrderViewTab(null);
    app.setView("tables");
  };

  const initiateSplit = (mode: "equal" | "item") => {
    const sentItems = ticketItems
      .filter((o: OrderItem) => (o.sentQty || 0) > 0)
      .map((o: OrderItem) => ({ ...o, qty: o.sentQty || 0 }));
    const gutschein = table.gutscheinAmounts[tableId] || 0;

    if (mode === "equal") {
      dispatch({ type: "INITIATE_EQUAL", items: sentItems });
    } else {
      dispatch({ type: "INITIATE_ITEM", items: sentItems, gutschein });
    }
    app.setView("split");
  };

  // Responsive styles
  const headerStyle = isTablet || isTabletLandscape || isDesktop ? S.headerTablet : S.header;
  const ticketStyle = isTablet || isTabletLandscape || isDesktop ? S.ticketTablet : S.ticket;

  return (
    <div style={S.page}>
      <header style={headerStyle}>
        <button style={S.back} onClick={() => {
          app.setView("tables");
          setShowSplitOptions(false);
          setConfirmingClose(false);
        }}>
          <BackIcon size={22} />
        </button>
        <span style={S.headerTitle}>Table {tableId} — Bill</span>
        <span />
      </header>
      <div style={ticketStyle}>
        <Receipt tableId={tableId} items={ticketItems} />
      </div>

      <div style={S.ticketActions}>
        <button style={confirmingClose ? S.confirmCloseBtn : S.closeBtn} onClick={() => {
          if (confirmingClose) {
            setShowSplitOptions(false);
            confirmClose();
          } else {
            setConfirmingClose(true);
            setShowSplitOptions(true);
          }
        }}>
          {confirmingClose ? "Confirm close" : "Close table"}
        </button>
        {showSplitOptions && (
          <div style={S.splitOptions}>
            <div style={S.splitOptionsLabel}>Split the bill</div>
            <div style={S.splitBtns}>
              <SplitOptions
                onSplitEqual={() => initiateSplit("equal")}
                onSplitItem={() => initiateSplit("item")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

