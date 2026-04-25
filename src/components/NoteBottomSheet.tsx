import { S } from "../styles/appStyles";
import type { MenuItem } from "../types";

interface NoteBottomSheetProps {
  item: MenuItem;
  note: string;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function NoteBottomSheet({ item, note, onNoteChange, onConfirm, onClose }: NoteBottomSheetProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onConfirm();
    if (e.key === "Escape") onClose();
  };

  return (
    <>
      <div style={S.variantSheetOverlay} onClick={onClose} />
      <div style={S.variantSheet}>
        <div style={S.variantSheetHeader}>{item.shortName || item.name}</div>
        <input
          type="text"
          placeholder="e.g. no walnuts, extra sauce…"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            padding: "14px 16px",
            fontSize: 15,
            border: "1.5px solid #ebe9e3",
            borderRadius: 10,
            background: "#f5f4f0",
            boxSizing: "border-box",
            outline: "none",
            fontFamily: "inherit",
            marginBottom: 14,
          }}
        />
        <button
          style={{
            width: "100%",
            padding: "14px 0",
            background: "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          onClick={onConfirm}
        >
          Add to order
        </button>
      </div>
    </>
  );
}
