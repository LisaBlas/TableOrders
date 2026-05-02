import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import type { OrderItem, TableId } from "../types";

export function useTableClose(tableId: TableId, sent: OrderItem[], isLargeScreen: boolean) {
  const app = useApp();
  const table = useTable();
  const displayId = table.resolveTableDisplayId(tableId);

  const [confirmingClose, setConfirmingClose] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const gutschein = table.gutscheinAmounts[tableId] || 0;
  const sentSubtotal = sent.reduce((s, o) => s + o.price * (o.sentQty || 0), 0);
  const total = Math.max(0, sentSubtotal - gutschein);

  const handleConfirmPayment = () => {
    const parsedPaymentAmount = parseFloat(paymentAmount);
    const amount =
      !Number.isNaN(parsedPaymentAmount) && parsedPaymentAmount > 0 ? parsedPaymentAmount : total;
    setPaymentAmount(amount.toString());
    setPaymentConfirmed(true);
  };

  const submitClose = () => {
    const tempId = crypto.randomUUID();
    const parsedPaymentAmount = parseFloat(paymentAmount);
    const paid =
      !Number.isNaN(parsedPaymentAmount) && parsedPaymentAmount > 0 ? parsedPaymentAmount : total;
    const tip = paid - total;

    app.addPaidBill({
      tempId,
      tableId: displayId,
      items: sent.map((o: OrderItem) => ({ ...o, qty: o.sentQty || 0 })),
      total,
      subtotal: gutschein > 0 ? sentSubtotal : undefined,
      gutschein: gutschein > 0 ? gutschein : undefined,
      timestamp: new Date().toISOString(),
      paymentMode: "full",
      tip: paymentConfirmed ? tip : undefined,
    });

    table.cleanupTable(tableId);
    app.showToast(`Table ${displayId} closed — ${total.toFixed(2)}€`);
    app.setOrderViewTab(null);
    app.setView("tables");
  };

  const handleCloseClick = () => {
    if (confirmingClose) {
      submitClose();
    } else {
      app.setTicketTable(tableId);
      setConfirmingClose(true);
      setPaymentAmount("");
      setPaymentConfirmed(false);
      if (!isLargeScreen) {
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 80);
      }
    }
  };

  const isCloseDisabled = confirmingClose && !!paymentAmount && !paymentConfirmed;

  return {
    confirmingClose,
    paymentAmount,
    setPaymentAmount,
    paymentConfirmed,
    gutschein,
    total,
    handleCloseClick,
    handleConfirmPayment,
    isCloseDisabled,
  };
}
