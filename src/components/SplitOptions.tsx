import { S } from "../styles/appStyles";

interface SplitOptionsProps {
  onSplitEqual: () => void;
  onSplitItem: () => void;
}

export function SplitOptions({ onSplitEqual, onSplitItem }: SplitOptionsProps) {
  return (
    <>
      <button style={S.splitOptionBtn} onClick={onSplitEqual}>
        <span style={S.splitOptionIcon}>⚖</span>
        <span style={S.splitOptionTitle}>Equal split</span>
        <span style={S.splitOptionSub}>Total ÷ guests</span>
      </button>
      <button style={S.splitOptionBtn} onClick={onSplitItem}>
        <span style={S.splitOptionIcon}>☰</span>
        <span style={S.splitOptionTitle}>By item</span>
        <span style={S.splitOptionSub}>Pay round by round</span>
      </button>
    </>
  );
}
