import type { KpiWithDeltas } from "../../utils/analytics";
import { colors, radii } from "../../styles/tokens";

interface Props {
  kpis: KpiWithDeltas;
}

export function KpiSummary({ kpis }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 1,
        background: colors.border,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        overflow: "hidden",
        margin: "12px 16px 0",
      }}
    >
      <KpiTile
        label="Revenue"
        value={`€${kpis.revenue.toFixed(0)}`}
        delta={kpis.revenueΔ}
        deltaType="pct"
      />
      <KpiTile
        label="Avg Bill"
        value={`€${kpis.avgBill.toFixed(2)}`}
        delta={kpis.avgBillΔ}
        deltaType="pct"
      />
      <KpiTile
        label="Covers"
        value={String(kpis.covers)}
        delta={kpis.coversΔ}
        deltaType="abs"
        deltaSuffix=""
      />
      <KpiTile
        label="Rev / Cover"
        value={kpis.covers > 0 ? `€${kpis.revPerCover.toFixed(2)}` : "—"}
        delta={kpis.revPerCoverΔ}
        deltaType="pct"
      />
      <KpiTile
        label="Avg Tip"
        value={`${kpis.avgTipPct.toFixed(1)}%`}
        delta={kpis.avgTipPctΔ}
        deltaType="abs"
        deltaSuffix="pp"
      />
      <KpiTile
        label="Bills"
        value={String(kpis.tables)}
        delta={kpis.tablesΔ}
        deltaType="abs"
        deltaSuffix=""
      />
    </div>
  );
}

interface TileProps {
  label: string;
  value: string;
  delta: number | null;
  deltaType: "pct" | "abs";
  deltaSuffix?: string;
  wide?: boolean;
}

function KpiTile({ label, value, delta, deltaType, deltaSuffix = "%", wide }: TileProps) {
  const positive = delta !== null && delta > 0;
  const negative = delta !== null && delta < 0;

  let deltaText = "—";
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
        gridColumn: wide ? "span 2" : undefined,
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
