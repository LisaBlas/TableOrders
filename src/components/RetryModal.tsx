import type { CSSProperties } from "react";
import { colors } from "../styles/tokens";

interface RetryModalProps {
  message: string;
  onRetry: () => void;
}

export default function RetryModal({ message, onRetry }: RetryModalProps) {
  const overlayStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  };

  const modalStyle: CSSProperties = {
    backgroundColor: colors.surface,
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  };

  const titleStyle: CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "12px",
    color: colors.dark,
  };

  const messageStyle: CSSProperties = {
    fontSize: "14px",
    color: colors.secondary,
    marginBottom: "24px",
    lineHeight: 1.5,
  };

  const retryButtonStyle: CSSProperties = {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    backgroundColor: colors.success,
    color: "#fff",
    width: "100%",
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={titleStyle}>⚠️ Bill Not Saved</div>
        <div style={messageStyle}>{message}</div>
        <button style={retryButtonStyle} onClick={onRetry}>
          Retry
        </button>
      </div>
    </div>
  );
}
