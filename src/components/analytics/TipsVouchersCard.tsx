import type { TipVoucherData } from "../../utils/analytics";
import { colors, radii } from "../../styles/tokens";

interface Props {
  data: TipVoucherData;
}

export function TipsVouchersCard({ data }: Props) {
  if (data.totalTips === 0 && data.totalVouchers === 0) return null;

  return (
    <div
      style={{
        background: colors.surface,
        borderRadius: radii.lg,
        border: `1px solid ${colors.border}`,
        padding: "16px",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 500, color: colors.muted, display: "block", marginBottom: 14 }}>
        Tips & Vouchers
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: colors.border, borderRadius: radii.sm, overflow: "hidden" }}>
        <StatBlock
          label="Tips collected"
          primary={`€${data.totalTips.toFixed(0)}`}
          detail={
            data.billsWithTips > 0
              ? `${data.avgTipPct.toFixed(1)}% avg · ${data.billsWithTips} bill${data.billsWithTips !== 1 ? "s" : ""}`
              : "None recorded"
          }
        />
        <StatBlock
          label="Vouchers redeemed"
          primary={data.totalVouchers > 0 ? `€${data.totalVouchers.toFixed(0)}` : "—"}
          detail={
            data.billsWithVouchers > 0
              ? `${data.billsWithVouchers} bill${data.billsWithVouchers !== 1 ? "s" : ""}`
              : "None redeemed"
          }
        />
      </div>
    </div>
  );
}

function StatBlock({ label, primary, detail }: { label: string; primary: string; detail: string }) {
  return (
    <div
      style={{
        background: colors.surface,
        padding: "12px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: colors.muted,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
        {primary}
      </span>
      <span style={{ fontSize: 12, color: colors.muted }}>{detail}</span>
    </div>
  );
}
