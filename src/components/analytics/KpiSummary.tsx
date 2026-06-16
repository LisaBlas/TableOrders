import type { KpiWithDeltas } from "../../utils/analytics";
import { colors, radii } from "../../styles/tokens";

interface Props {
  kpis: KpiWithDeltas;
  comparisonLabel: string;
  wide?: boolean;
  embedded?: boolean;
}

export function KpiSummary({ kpis, comparisonLabel, wide, embedded = false }: Props) {
  return (
    <div
      style={{
        background: colors.surface,
        border: embedded ? "none" : `1px solid ${colors.border}`,
        borderRadius: embedded ? 0 : radii.lg,
        overflow: "hidden",
      }}
    >
      {comparisonLabel && (
        <div
          style={{
            padding: "8px 10px 4px",
            fontSize: 11,
            color: colors.muted,
            fontWeight: 500,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {comparisonLabel}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: wide ? "repeat(5, 1fr)" : "repeat(6, 1fr)",
          gap: 1,
          background: colors.border,
        }}
      >
        <KpiTile
          label="Revenue"
          value={`€${kpis.revenue.toFixed(0)}`}
          delta={kpis.revenueΔ}
          deltaType="pct"
          span={wide ? 1 : 2}
        />
        <KpiTile
          label="Avg Bill"
          value={`€${kpis.avgBill.toFixed(2)}`}
          delta={kpis.avgBillΔ}
          deltaType="pct"
          span={wide ? 1 : 2}
        />
        <KpiTile
          label="Avg Tip"
          value={`${kpis.avgTipPct.toFixed(1)}%`}
          delta={kpis.avgTipPctΔ}
          deltaType="abs"
          deltaSuffix="pp"
          span={wide ? 1 : 2}
        />
        <KpiTile
          label="Tables"
          value={String(kpis.bills)}
          delta={kpis.billsΔ}
          deltaType="abs"
          deltaSuffix=""
          span={wide ? 1 : 3}
        />
        <KpiTile
          label="Covers"
          value={String(kpis.covers)}
          delta={kpis.coversΔ}
          deltaType="abs"
          deltaSuffix=""
          span={wide ? 1 : 3}
        />
      </div>
    </div>
  );
}

interface TileProps {
  label: string;
  value: string;
  delta: number | null;
  deltaType: "pct" | "abs";
  deltaSuffix?: string;
  span?: number;
}

function KpiTile({ label, value, delta, deltaType, deltaSuffix = "%", span }: TileProps) {
  const positive = delta !== null && delta > 0;
  const negative = delta !== null && delta < 0;

  let deltaText = "no prior data";
  if (delta !== null) {
    const sign = delta > 0 ? "+" : "";
    if (deltaType === "pct") {
      deltaText = `${sign}${delta.toFixed(1)}%`;
    } else {
      deltaText = `${sign}${delta.toFixed(deltaType === "abs" && deltaSuffix === "pp" ? 1 : 0)}${deltaSuffix}`;
    }
  }

  return (
    <div
      style={{
        background: colors.surface,
        padding: "12px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        gridColumn: span ? `span ${span}` : undefined,
      }}
    >
      <span style={{ fontSize: 11, color: colors.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
        {value}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: positive ? colors.success : negative ? colors.danger : colors.muted,
        }}
      >
        {deltaText}
      </span>
    </div>
  );
}
