import { forceDemoReset } from "../demo";

export function DemoBanner() {
  function handleReset() {
    forceDemoReset();
    window.location.reload();
  }

  return (
    <div
      style={{
        background: "#7c4dff",
        color: "#fff",
        padding: "6px 16px",
        fontSize: 13,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        flexShrink: 0,
      }}
    >
      <span>Demo — all interactions are local only · resets every 10 min</span>
      <button
        onClick={handleReset}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.4)",
          color: "#fff",
          padding: "2px 10px",
          borderRadius: 4,
          fontSize: 12,
          cursor: "pointer",
          fontWeight: 500,
          lineHeight: "20px",
        }}
      >
        Reset now
      </button>
    </div>
  );
}
