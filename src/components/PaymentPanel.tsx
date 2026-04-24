import { S } from "../styles/appStyles";

interface PaymentPanelProps {
  total: number;
  paymentAmount: string;
  paymentConfirmed: boolean;
  onChange: (val: string) => void;
  onConfirm: () => void;
}

export function PaymentPanel({
  total,
  paymentAmount,
  paymentConfirmed,
  onChange,
  onConfirm,
}: PaymentPanelProps) {
  const tip = paymentConfirmed ? parseFloat(paymentAmount) - total : null;

  return (
    <>
      <div style={S.paymentLabel}>Amount Paid</div>
      <div style={S.paymentInputRow}>
        <input
          type="number"
          placeholder={total.toFixed(2)}
          value={paymentAmount}
          onChange={(e) => onChange(e.target.value)}
          step="0.01"
          min="0"
          style={S.paymentInput}
          disabled={paymentConfirmed}
        />
        <button
          style={paymentConfirmed ? S.paymentCheckConfirmed : S.paymentCheck}
          onClick={onConfirm}
          disabled={paymentConfirmed}
        >
          ✓
        </button>
      </div>
      {tip !== null && (
        <div style={S.paymentTip}>
          Tip: {tip >= 0 ? `+${tip.toFixed(2)}€` : `${tip.toFixed(2)}€`}
        </div>
      )}
    </>
  );
}
