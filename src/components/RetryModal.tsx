import type { CSSProperties } from "react";

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
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  };

  const modalStyle: CSSProperties = {
    backgroundColor: "#fff",
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
    color: "#333",
  };

  const messageStyle: CSSProperties = {
    fontSize: "14px",
    color: "#666",
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
    backgroundColor: "#4CAF50",
    color: "#fff",
    width: "100%",
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={titleStyle}>⚠️ Bill Not Saved</div>
        <div style={messageStyle}>{message}</div>
        <button
          style={retryButtonStyle}
          onClick={onRetry}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#45a049"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#4CAF50"; }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
