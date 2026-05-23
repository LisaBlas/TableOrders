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
  const totalItemsSold = paidBills.reduce((sum, bill) => sum + bill.items.reduce((s, item) => s + item.qty, 0), 0);
  const totalRevenue = paidBills.reduce((sum, bill) => sum + bill.total, 0);
  const metricCards = [
    { label: "Bills closed", value: paidBills.length },
    { label: "Total items sold", value: totalItemsSold },
    {
      label: "Total Tips",
      value: totalTips >= 0 ? `+${totalTips.toFixed(2)}\u20ac` : `${totalTips.toFixed(2)}\u20ac`,
    },
    {
      label: `Vouchers (${billsWithGutschein.length})`,
      value: `-${totalGutschein.toFixed(2)}\u20ac`,
    },
  ];

  return (
    <div style={S.salesSummary}>
      <div style={S.salesMetricGrid}>
        {metricCards.map((metric) => (
          <div key={metric.label} style={S.salesMetricCard}>
            <span style={S.salesLabel}>{metric.label}</span>
            <span style={S.salesValue}>{metric.value}</span>
          </div>
        ))}
      </div>
      <div style={S.salesTotalRow}>
        <span style={S.salesTotalLabel}>Total Revenue</span>
        <span style={S.salesTotalAmt}>
          {totalRevenue.toFixed(2)}{"\u20ac"}
        </span>
      </div>
      {onShare && (
        <button onClick={onShare} style={S.salesShareButton}>
          <ShareIcon size={16} />
          Share
        </button>
      )}
    </div>
  );
}
