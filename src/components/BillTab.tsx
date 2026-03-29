import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { useSplit } from "../contexts/SplitContext";
import { Receipt } from "./Receipt";
import { Modal } from "./Modal";
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

  const [editingBill, setEditingBill] = useState(false);
  const [billEditSnapshot, setBillEditSnapshot] = useState<OrderItem[] | null>(null);
  const [showGutscheinModal, setShowGutscheinModal] = useState(false);
  const [gutscheinInput, setGutscheinInput] = useState("");
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const startBillEdit = () => {
    const current = table.orders[tableId] || [];
    setBillEditSnapshot(current.map((o: OrderItem) => ({ ...o })));
    setEditingBill(true);
  };

  const confirmBillEdit = () => {
    if (billEditSnapshot) {
      const current = table.orders[tableId] || [];
      const editedItems = current.filter((o: OrderItem) => {
        const snap = billEditSnapshot.find((s: OrderItem) => s.id === o.id);
        if (!snap) return true;
        return o.sentQty !== snap.sentQty || o.qty !== snap.qty;
      });
      if (editedItems.length > 0) {
        const batchItems = editedItems.map((o: OrderItem) => {
          const snap = billEditSnapshot.find((s: OrderItem) => s.id === o.id);
          const prevSent = snap ? snap.sentQty || 0 : 0;
          const diff = (o.sentQty || 0) - prevSent;
          return { ...o, qty: Math.abs(diff) };
        }).filter((o: OrderItem) => o.qty > 0);

        if (batchItems.length > 0) {
          table.setSentBatches((prev) => ({
            ...prev,
            [tableId]: [...(prev[tableId] || []), {
              timestamp: new Date().toISOString(),
              items: batchItems,
            }],
          }));
        }
      }
    }
    setEditingBill(false);
    setBillEditSnapshot(null);
  };

  const applyGutschein = () => {
    const amount = parseFloat(gutscheinInput);
    if (isNaN(amount) || amount <= 0) {
      app.showToast("⚠ Valid amount required");
      return;
    }
    table.applyGutschein(tableId, amount);
    setShowGutscheinModal(false);
    setGutscheinInput("");
  };

  const confirmClose = () => {
    const items = (table.orders[tableId] || []).filter((o: OrderItem) => (o.sentQty || 0) > 0);
    const subtotal = items.reduce((s: number, o: OrderItem) => s + o.price * (o.sentQty || 0), 0);
    const gutschein = table.gutscheinAmounts[tableId] || 0;
    const total = Math.max(0, subtotal - gutschein);
    const paid = paymentAmount ? parseFloat(paymentAmount) : total;
    const tip = paid - total;

    const bill = {
      tableId,
      items: items.map((o: OrderItem) => ({ ...o, qty: o.sentQty || 0 })),
      total,
      subtotal: gutschein > 0 ? subtotal : undefined,
      gutschein: gutschein > 0 ? gutschein : undefined,
      timestamp: new Date().toISOString(),
      paymentMode: "full" as const,
      tip: paymentConfirmed ? tip : undefined,
    };

    app.addPaidBill(bill);
    table.cleanupTable(tableId);
    app.showToast(`Table ${tableId} closed — ${total.toFixed(2)}€`);
    app.setView("tables");
  };

  const sentSubtotal = sent.reduce((s: number, o: OrderItem) => s + o.price * o.qty, 0);
  const gutschein = table.gutscheinAmounts[tableId] || 0;
  const total = Math.max(0, sentSubtotal - gutschein);

  return (
    <>
      <div style={S.ticket}>
        <div style={S.billHeader}>
          <div>
            <div style={S.closeReceiptBrand}>Käserei Camidi</div>
            <div style={S.closeReceiptMeta}>
              Table {tableId} · {new Date().toLocaleString("en-GB", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </div>
          </div>
          <div style={S.billHeaderActions}>
            <button
              style={editingBill ? S.billIconBtnActive : S.billIconBtn}
              onClick={() => editingBill ? confirmBillEdit() : startBillEdit()}
              title={editingBill ? "Done" : "Edit"}
            >
              {editingBill ? "✓" : "✏️"}
            </button>
            <button style={S.billIconBtn} onClick={() => setShowGutscheinModal(true)} title="Apply Gutschein">
              🎫
            </button>
          </div>
        </div>
        <Receipt
          tableId={tableId}
          items={sent}
          editMode={editingBill}
          gutschein={gutschein}
          onRemoveItem={(id: string) => table.removeItemFromBill(tableId, id)}
          onAddItem={(id: string) => table.addItemToBill(tableId, id)}
          onRemoveGutschein={() => table.removeGutschein(tableId)}
          skipHeader
        />
      </div>

      {confirmingClose && (
        <div style={{ ...S.splitOptions, marginBottom: "200px" }}>
          <div style={S.splitOptionsLabel}>Split the bill</div>
          <div style={S.splitBtns}>
            <button
              style={S.splitOptionBtn}
              onClick={() => {
                app.setTicketTable(tableId);
                const sentItems = sent.map((o: OrderItem) => ({ ...o }));
                splitDispatch({ type: "INITIATE_EQUAL", items: sentItems });
                app.setView("split");
              }}
            >
              <span style={S.splitOptionIcon}>⚖</span>
              <span style={S.splitOptionTitle}>Equal split</span>
              <span style={S.splitOptionSub}>Total ÷ guests</span>
            </button>
            <button
              style={S.splitOptionBtn}
              onClick={() => {
                app.setTicketTable(tableId);
                const sentItems = sent.map((o: OrderItem) => ({ ...o }));
                splitDispatch({ type: "INITIATE_ITEM", items: sentItems });
                app.setView("split");
              }}
            >
              <span style={S.splitOptionIcon}>☰</span>
              <span style={S.splitOptionTitle}>By item</span>
              <span style={S.splitOptionSub}>Pay round by round</span>
            </button>
          </div>
        </div>
      )}

      <div style={S.ticketActions}>
        {confirmingClose && (
          <div style={S.paymentSection}>
            <div style={S.paymentLabel}>Amount Paid</div>
            <div style={S.paymentInputRow}>
              <input
                type="number"
                placeholder={total.toFixed(2)}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                step="0.01" min="0"
                style={S.paymentInput}
                disabled={paymentConfirmed}
              />
              <button
                style={paymentConfirmed ? S.paymentCheckConfirmed : S.paymentCheck}
                onClick={() => {
                  const amount = paymentAmount && parseFloat(paymentAmount) > 0
                    ? parseFloat(paymentAmount) : total;
                  setPaymentAmount(amount.toString());
                  setPaymentConfirmed(true);
                }}
                disabled={paymentConfirmed}
              >✓</button>
            </div>
            {paymentConfirmed && (() => {
              const paid = parseFloat(paymentAmount);
              const tip = paid - total;
              return <div style={S.paymentTip}>Tip: {tip >= 0 ? `+${tip.toFixed(2)}€` : `${tip.toFixed(2)}€`}</div>;
            })()}
          </div>
        )}
        <button
          style={{
            ...(confirmingClose ? S.confirmCloseBtn : S.closeBtn),
            ...(confirmingClose && paymentAmount && !paymentConfirmed ? { opacity: 0.5, cursor: "not-allowed" } : {}),
          }}
          onClick={() => {
            if (confirmingClose) {
              confirmClose();
            } else {
              app.setTicketTable(tableId);
              setConfirmingClose(true);
              setPaymentAmount("");
              setPaymentConfirmed(false);
            }
          }}
          disabled={confirmingClose && !!paymentAmount && !paymentConfirmed}
        >
          {confirmingClose ? "Confirm close" : "Close table"}
        </button>
      </div>

      {showGutscheinModal && (
        <Modal
          title="Apply Gutschein"
          onClose={() => { setShowGutscheinModal(false); setGutscheinInput(""); }}
          onConfirm={applyGutschein}
          confirmText="Apply"
        >
          <div style={S.customModalForm}>
            <div style={S.customModalField}>
              <label style={S.customModalLabel}>Amount (€)</label>
              <input type="number" placeholder="0.00" value={gutscheinInput}
                onChange={(e) => setGutscheinInput(e.target.value)} step="0.01" min="0"
                style={S.customModalInput} autoFocus />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
