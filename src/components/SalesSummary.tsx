import { ShareIcon } from "./icons";
import { S } from "../styles/appStyles";
import type { Bill } from "../types";

interface SalesSummaryProps {
  paidBills: Bill[];
  onShare?: () => void;
}

export function SalesSummary({ paidBills, onShare }: SalesSummaryProps) {
  const totalTips = paidBills.reduce((sum, bill) => sum + (bill.tip ?? 0), 0);
  const billsWithGutschein = paidBills.filter((bill) => bill.gutschein && bill.gutschein > 0);
  const totalGutschein = billsWithGutschein.reduce((sum, bill) => sum + (bill.gutschein || 0), 0);

  return (
    <div style={S.salesSummary}>
      <div style={S.salesSummaryRow}>
        <span style={S.salesLabel}>Bills closed</span>
        <span style={S.salesValue}>{paidBills.length}</span>
      </div>
      <div style={S.salesSummaryRow}>
        <span style={S.salesLabel}>Total items sold</span>
        <span style={S.salesValue}>
          {paidBills.reduce((sum, bill) => sum + bill.items.reduce((s, item) => s + item.qty, 0), 0)}
        </span>
      </div>
      {totalTips !== 0 && (
        <div style={S.salesSummaryRow}>
          <span style={S.salesLabel}>Total Tips</span>
          <span style={{ ...S.salesValue, color: totalTips >= 0 ? "#2d5a35" : "#c0392b" }}>
            {totalTips >= 0 ? `+${totalTips.toFixed(2)}€` : `${totalTips.toFixed(2)}€`}
          </span>
        </div>
      )}
      {totalGutschein > 0 && (
        <div style={S.salesSummaryRow}>
          <span style={S.salesLabel}>Vouchers ({billsWithGutschein.length})</span>
          <span style={{ ...S.salesValue, color: "#c0392b" }}>-{totalGutschein.toFixed(2)}€</span>
        </div>
      )}
      <div style={S.salesTotalRow}>
        <span style={S.salesTotalLabel}>Total Revenue</span>
        <span style={S.salesTotalAmt}>
          {paidBills.reduce((sum, bill) => sum + bill.total, 0).toFixed(2)}€
        </span>
      </div>
      {onShare && (
        <button
          onClick={onShare}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            marginTop: 12,
            fontSize: 15,
            fontWeight: 700,
            border: "none",
            borderRadius: S.sendBtn.borderRadius,
            padding: "13px",
            background: S.sendBtn.background,
            color: S.sendBtn.color,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <ShareIcon size={16} />
          Share
        </button>
      )}
    </div>
  );
}
