import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { Modal } from "./Modal";
import { S } from "../styles/appStyles";
import type { TableId } from "../types";

interface CustomItemModalProps {
  tableId: TableId;
  onClose: () => void;
}

export function CustomItemModal({ tableId, onClose }: CustomItemModalProps) {
  const app = useApp();
  const table = useTable();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");

  const handleConfirm = () => {
    const trimmedName = name.trim();
    const parsedPrice = parseFloat(price.replace(",", "."));
    const parsedQty = parseInt(qty);
    if (!trimmedName) { app.showToast("⚠ Item name required"); return; }
    if (isNaN(parsedPrice) || parsedPrice <= 0) { app.showToast("⚠ Valid price required"); return; }
    if (isNaN(parsedQty) || parsedQty < 1) { app.showToast("⚠ Valid quantity required"); return; }

    table.addCustomItem(tableId, {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: trimmedName,
      price: parsedPrice,
      qty: parsedQty,
      sentQty: 0,
      posId: "???",
      destination: "counter",
    });
    app.showToast(`+ ${trimmedName} (${parsedQty}×)`);
    onClose();
  };

  return (
    <Modal
      title="Add Custom Item"
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmText="Add to order"
      closeOnBackdrop={false}
    >
      <div style={S.customModalForm}>
        <div style={S.customModalField}>
          <label style={S.customModalLabel}>Item name</label>
          <input type="text" placeholder="e.g., Special request" value={name}
            onChange={(e) => setName(e.target.value)} style={S.customModalInput} autoFocus />
        </div>
        <div style={S.customModalRow}>
          <div style={S.customModalField}>
            <label style={S.customModalLabel}>Price (€)</label>
            <input type="text" inputMode="decimal" placeholder="0.00" value={price}
              onChange={(e) => setPrice(e.target.value)} style={S.customModalInput} />
          </div>
          <div style={S.customModalFieldSmall}>
            <label style={S.customModalLabel}>Quantity</label>
            <input type="number" placeholder="1" value={qty}
              onChange={(e) => setQty(e.target.value)} min="1" style={S.customModalInput} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
