import { useState } from "react";
import { TABLES, STATUS_CONFIG } from "../data/constants";
import { getTableStatus } from "../utils/helpers";
import { useApp } from "../contexts/AppContext";
import { useTable } from "../contexts/TableContext";
import { S } from "../styles/appStyles";
import { Modal } from "../components/Modal";

export function TablesView() {
  const { setView, setActiveTable, showToast } = useApp();
  const { orders, seatedTables, seatTable } = useTable();
  const [seatConfirmTable, setSeatConfirmTable] = useState<string | number | null>(null);

  const handleTableClick = (tableId: string | number) => {
    const status = getTableStatus(tableId, orders, seatedTables);
    if (status === "open") {
      setSeatConfirmTable(tableId);
    } else {
      openTable(tableId);
    }
  };

  const openTable = (tableId: string | number) => {
    setActiveTable(tableId);
    const hasSentOrders = orders[tableId]?.some((o: any) => (o.sentQty || 0) > 0);
    setView("order");
  };

  const confirmSeatTable = () => {
    if (seatConfirmTable) {
      seatTable(seatConfirmTable);
      showToast(`Table ${seatConfirmTable} seated`);
      openTable(seatConfirmTable);
      setSeatConfirmTable(null);
    }
  };

  return (
    <div style={S.page}>
      <header style={S.header}>
        <span style={S.headerTitle}>Floor</span>
        <span style={S.headerSub}>
          {new Date().toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </span>
      </header>
      <div style={S.legend}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <span key={k} style={S.legendItem}>
            <span style={{ ...S.dot, background: v.dot }} />
            {v.label}
          </span>
        ))}
      </div>
      <button style={S.salesBtn} onClick={() => setView("dailySales")}>
        <span style={S.salesIcon}>📊</span>
        Daily Sales
      </button>
      <div style={S.grid}>
        {TABLES.map((t: any) => {
          if (t.isDivider) {
            return (
              <div key={t.label} style={{ ...S.sentDivider, gridColumn: "1 / -1", margin: "8px 0 4px" }}>
                <div style={S.sentDividerLine} />
                <span style={S.sentDividerText}>{t.label}</span>
                <div style={S.sentDividerLine} />
              </div>
            );
          }
          const status = getTableStatus(t.id, orders, seatedTables);
          const cfg = STATUS_CONFIG[status];
          return (
            <button
              key={t.id}
              style={{
                ...S.tableCard,
                background: cfg.bg,
                border: `1.5px solid ${cfg.border}`,
              }}
              onClick={() => handleTableClick(t.id)}
            >
              <span style={{ ...S.tableDot, background: cfg.dot }} />
              <span style={S.tableNum}>{t.id}</span>
              <span style={{ ...S.tableStatus, color: cfg.text }}>
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      {seatConfirmTable && (
        <Modal
          title={`Seat Table ${seatConfirmTable}?`}
          onClose={() => setSeatConfirmTable(null)}
          onConfirm={confirmSeatTable}
          confirmText="Seat Table"
        >
          <div style={S.modalMessage}>
            Mark this table as seated for incoming guests.
          </div>
        </Modal>
      )}
    </div>
  );
}
