import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { Modal } from "./Modal";
import { S } from "../styles/appStyles";
import type { TableId } from "../types";

interface GutscheinModalProps {
  tableId: TableId;
  onClose: () => void;
}

export function GutscheinModal({ tableId, onClose }: GutscheinModalProps) {
  const app = useApp();
  const table = useTable();
  const [input, setInput] = useState("");

  const handleApply = () => {
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) {
      app.showToast("⚠ Valid amount required");
      return;
    }
    table.applyGutschein(tableId, amount);
    onClose();
  };

  return (
    <Modal
      title="Apply Voucher"
      onClose={onClose}
      onConfirm={handleApply}
      confirmText="Apply"
    >
      <div style={S.customModalForm}>
        <div style={S.customModalField}>
          <label style={S.customModalLabel}>Amount (€)</label>
          <input
            type="number"
            placeholder="0.00"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            step="0.01"
            min="0"
            style={S.customModalInput}
            autoFocus
          />
        </div>
      </div>
    </Modal>
  );
}
