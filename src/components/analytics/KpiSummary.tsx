import type { KpiWithDeltas } from "../../utils/analytics";
import { colors, radii } from "../../styles/tokens";

interface Props {
  kpis: KpiWithDeltas;
  comparisonLabel: string;
  wide?: boolean;
}

export function KpiSummary({ kpis, comparisonLabel, wide }: Props) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
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
          gridTemplateColumns: wide ? "repeat(5, 1fr)" : "repeat(2, 1fr)",
          gap: 1,
          background: colors.border,
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
        {wide ? (
          <>
            <KpiTile
              label="Avg Tip"
              value={`${kpis.avgTipPct.toFixed(1)}%`}
              delta={kpis.avgTipPctΔ}
              deltaType="abs"
              deltaSuffix="pp"
            />
            <KpiTile
              label="Tables"
              value={String(kpis.bills)}
              delta={kpis.billsΔ}
              deltaType="abs"
              deltaSuffix=""
            />
            <KpiTile
              label="Covers"
              value={String(kpis.covers)}
              delta={kpis.coversΔ}
              deltaType="abs"
              deltaSuffix=""
            />
          </>
        ) : (
          <>
            <KpiTile
              label="Tables"
              value={String(kpis.bills)}
              delta={kpis.billsΔ}
              deltaType="abs"
              deltaSuffix=""
            />
            <KpiTile
              label="Covers"
              value={String(kpis.covers)}
              delta={kpis.coversΔ}
              deltaType="abs"
              deltaSuffix=""
            />
            <KpiTile
              label="Avg Tip"
              value={`${kpis.avgTipPct.toFixed(1)}%`}
              delta={kpis.avgTipPctΔ}
              deltaType="abs"
              deltaSuffix="pp"
              wide
            />
          </>
        )}
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
  wide?: boolean;
}

function KpiTile({ label, value, delta, deltaType, deltaSuffix = "%", wide }: TileProps) {
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
