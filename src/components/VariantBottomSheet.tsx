import { useState, useRef } from "react";
import { S } from "../styles/appStyles";
import type { MenuItem, MenuItemVariant, OrderItem } from "../types";

interface VariantBottomSheetProps {
  item: MenuItem;
  unsent: OrderItem[];
  onSelectVariant: (variant: MenuItemVariant, note?: string) => void;
  onClose: () => void;
  variants?: MenuItemVariant[];
}

export function VariantBottomSheet({ item, unsent, onSelectVariant, onClose, variants: variantsProp }: VariantBottomSheetProps) {
  const variants = variantsProp ?? item.variants;
  const [note, setNote] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  if (!variants || variants.length === 0) return null;

  // Get unsent qty for a specific variant
  const getVariantUnsentQty = (variant: MenuItemVariant) => {
    const variantId = `${item.id}-${variant.type}`;
    const unsentItem = unsent.find((u) => u.id === variantId);
    return unsentItem?.qty || 0;
  };

  // Callback ref: delay focus so slide-up animation doesn't fight keyboard
  const inputRef = (el: HTMLInputElement | null) => {
    if (el) {
      timeoutRef.current = setTimeout(() => el.focus(), 150);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div style={S.variantSheetOverlay} onClick={onClose} />

      {/* Bottom sheet */}
      <div style={S.variantSheet}>
        <div style={S.variantSheetHeader}>{item.name}</div>

        {/* Note input */}
        <input
          ref={inputRef}
          type="text"
          placeholder="e.g. no walnuts, extra sauce…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
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

        {/* Variant buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {variants.map((variant) => {
            const unsentQty = getVariantUnsentQty(variant);

            return (
              <button
                key={variant.type}
                style={{ ...S.variantSheetBtn, flex: "1 1 auto", justifyContent: "center", marginBottom: 0 }}
                onClick={() => {
                  const trimmedNote = note.trim();
                  onSelectVariant(variant, trimmedNote || undefined);
                  onClose();
                }}
              >
                <span style={S.variantBtnLabel}>{variant.label}</span>

                {unsentQty > 0 && (
                  <span style={{ ...S.menuCardBadge, position: "absolute", top: 8, right: 8 }}>
                    ({unsentQty})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
