import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useSplit } from "../contexts/SplitContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useBillEdit } from "../hooks/useBillEdit";
import { useTableClose } from "../hooks/useTableClose";
import { Receipt } from "./Receipt";
import { BillHeader } from "./BillHeader";
import { PaymentPanel } from "./PaymentPanel";
import { SplitOptions } from "./SplitOptions";
import { GutscheinModal } from "./GutscheinModal";
import { S } from "../styles/appStyles";
import type { OrderItem, TableId } from "../types";

interface BillTabProps {
  tableId: TableId;
  sent: OrderItem[];
}

export function BillTab({ tableId, sent }: BillTabProps) {
  const app = useApp();
  const table = useTable();
  const { dispatch: splitDispatch } = useSplit();
  const { isTablet, isTabletLandscape, isDesktop } = useBreakpoint();
  const isLargeScreen = isTablet || isTabletLandscape || isDesktop;

  const [showGutscheinModal, setShowGutscheinModal] = useState(false);
  const { editingBill, startBillEdit, confirmBillEdit } = useBillEdit(tableId);
  const {
    confirmingClose,
    paymentAmount,
    setPaymentAmount,
    paymentConfirmed,
    gutschein,
    total,
    handleCloseClick,
    handleConfirmPayment,
    isCloseDisabled,
  } = useTableClose(tableId, sent, isLargeScreen);

  const handleEditToggle = () => (editingBill ? confirmBillEdit() : startBillEdit());

  const handleSplitEqual = () => {
    app.setTicketTable(tableId);
    splitDispatch({ type: "INITIATE_EQUAL", items: sent.map((o) => ({ ...o })) });
    app.setView("split");
  };

  const handleSplitItem = () => {
    app.setTicketTable(tableId);
    splitDispatch({ type: "INITIATE_ITEM", items: sent.map((o) => ({ ...o })) });
    app.setView("split");
  };

  const receipt = (
    <Receipt
      tableId={tableId}
      items={sent}
      editMode={editingBill}
      gutschein={gutschein}
      onRemoveItem={(id) => table.removeItemFromBill(tableId, id)}
      onAddItem={(id) => table.addItemToBill(tableId, id)}
      onRemoveGutschein={() => table.removeGutschein(tableId)}
      skipHeader
    />
  );

  const gutscheinModal = showGutscheinModal && (
    <GutscheinModal tableId={tableId} onClose={() => setShowGutscheinModal(false)} />
  );

  if (!isLargeScreen) {
    return (
      <>
        <div style={S.ticket}>
          <BillHeader
            tableId={tableId}
            editingBill={editingBill}
            onEditToggle={handleEditToggle}
            onGutscheinOpen={() => setShowGutscheinModal(true)}
          />
          {receipt}
        </div>

        {confirmingClose && (
          <div style={{ ...S.splitOptions, marginBottom: "220px" }}>
            <div style={S.splitOptionsLabel}>Split the bill</div>
            <div style={S.splitBtns}>
              <SplitOptions onSplitEqual={handleSplitEqual} onSplitItem={handleSplitItem} />
            </div>
          </div>
        )}

        <div style={S.ticketActions}>
          {confirmingClose && (
            <div style={S.paymentSection}>
              <PaymentPanel
                total={total}
                paymentAmount={paymentAmount}
                paymentConfirmed={paymentConfirmed}
                onChange={setPaymentAmount}
                onConfirm={handleConfirmPayment}
              />
            </div>
          )}
          <button
            style={{
              ...(confirmingClose ? S.confirmCloseBtn : S.closeBtn),
              ...(isCloseDisabled ? { opacity: 0.5, cursor: "not-allowed" } : {}),
            }}
            onClick={handleCloseClick}
            disabled={isCloseDisabled}
          >
            {confirmingClose ? "Confirm close" : "Close table"}
          </button>
        </div>

        {gutscheinModal}
      </>
    );
  }

  return (
    <div style={isDesktop ? S.billContainerTabletLandscape : S.billContainerTablet}>
      {/* Left column: Receipt */}
      <div style={S.billReceiptColumn}>
        <div style={isDesktop ? S.billActionsCardLandscape : S.billActionsCard}>
          <BillHeader
            tableId={tableId}
            editingBill={editingBill}
            onEditToggle={handleEditToggle}
            onGutscheinOpen={() => setShowGutscheinModal(true)}
          />
          {receipt}
        </div>
      </div>

      {/* Right column: Actions sidebar */}
      <div style={isDesktop ? S.billActionsColumnLandscape : S.billActionsColumn}>
        <div style={isDesktop ? S.billActionsCardLandscape : S.billActionsCard}>
          <div style={S.billActionsLabel}>Split the bill</div>
          <SplitOptions onSplitEqual={handleSplitEqual} onSplitItem={handleSplitItem} />
        </div>

        {confirmingClose && (
          <div style={isDesktop ? S.billActionsCardLandscape : S.billActionsCard}>
            <PaymentPanel
              total={total}
              paymentAmount={paymentAmount}
              paymentConfirmed={paymentConfirmed}
              onChange={setPaymentAmount}
              onConfirm={handleConfirmPayment}
            />
          </div>
        )}

        <button
          style={{
            ...(confirmingClose ? S.billPrimaryActionConfirm : S.billPrimaryAction),
            ...(isCloseDisabled ? { opacity: 0.5, cursor: "not-allowed" } : {}),
          }}
          onClick={handleCloseClick}
          disabled={isCloseDisabled}
        >
          {confirmingClose ? "Confirm close" : "Close table"}
        </button>
      </div>

      {gutscheinModal}
    </div>
  );
}
