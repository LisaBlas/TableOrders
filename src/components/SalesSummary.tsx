import { S } from "../styles/appStyles";
import { colors } from "../styles/tokens";
import type { Bill } from "../types";

interface SalesSummaryProps {
  paidBills: Bill[];
}

export function SalesSummary({ paidBills }: SalesSummaryProps) {
  const totalTips = paidBills.reduce((sum, bill) => sum + (bill.tip ?? 0), 0);
  const billsWithGutschein = paidBills.filter((bill) => bill.gutschein && bill.gutschein > 0);
  const totalGutschein = billsWithGutschein.reduce((sum, bill) => sum + (bill.gutschein || 0), 0);
  const totalRevenue = paidBills.reduce((sum, bill) => sum + bill.total, 0);
  const tipSign = totalTips >= 0 ? "+" : "";

  const totalItems = paidBills.reduce((total, bill) =>
    total + bill.items.reduce((sum, item) => sum + item.qty, 0), 0);

  const itemsInPOS = paidBills.reduce((total, bill) => {
    if (bill.addedToPOS) {
      return total + bill.items.reduce((sum, item) => sum + item.qty, 0);
    }
    return total + bill.items.reduce((sum, item) => {
      const crossedQty = item.crossedQty ?? (item.crossed ? item.qty : 0);
      return sum + crossedQty;
    }, 0);
  }, 0);

  const tiles = [
    { label: "Revenue", value: `${totalRevenue.toFixed(2)}\u20ac`, strong: true },
    {
      label: "Tips",
      value: `${tipSign}${totalTips.toFixed(2)}\u20ac`,
      tone: totalTips >= 0 ? colors.success : colors.danger,
    },
    {
      label: "Vouchers",
      value: totalGutschein > 0 ? `-${totalGutschein.toFixed(2)}\u20ac` : "\u2014",
      sub: totalGutschein > 0 ? `${billsWithGutschein.length} bill${billsWithGutschein.length !== 1 ? "s" : ""}` : undefined,
    },
    { label: "Tables", value: String(paidBills.length) },
    { label: "Total items", value: String(totalItems) },
    { label: "In POS", value: String(itemsInPOS), tone: itemsInPOS === totalItems && totalItems > 0 ? colors.success : undefined },
  ];

  return (
    <div
      style={{
        ...S.salesSummary,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 1,
          background: colors.border,
        }}
      >
        {tiles.map((tile, idx) => (
          <div
            key={tile.label}
            style={{
              background: colors.surface,
              padding: "10px 12px",
              minHeight: 66,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 10, color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0 }}>
              {tile.label}
            </span>
            <span style={{ fontSize: tile.strong ? 19 : 17, fontWeight: 800, lineHeight: 1.05, color: tile.tone ?? colors.fg }}>
              {tile.value}
            </span>
            {tile.sub && (
              <span style={{ fontSize: 11, color: colors.muted, lineHeight: 1.15 }}>
                {tile.sub}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
