import { S } from "../styles/appStyles";
import type { MenuItem, MenuItemVariant, OrderItem } from "../types";

interface VariantBottomSheetProps {
  item: MenuItem;
  unsent: OrderItem[];
  onSelectVariant: (variant: MenuItemVariant) => void;
  onClose: () => void;
  variants?: MenuItemVariant[];
}

export function VariantBottomSheet({ item, unsent, onSelectVariant, onClose, variants: variantsProp }: VariantBottomSheetProps) {
  const variants = variantsProp ?? item.variants;
  if (!variants || variants.length === 0) return null;

  // Get unsent qty for a specific variant
  const getVariantUnsentQty = (variant: MenuItemVariant) => {
    const variantId = `${item.id}-${variant.type}`;
    const unsentItem = unsent.find((u) => u.id === variantId);
    return unsentItem?.qty || 0;
  };

  return (
    <>
      {/* Backdrop */}
      <div style={S.variantSheetOverlay} onClick={onClose} />

      {/* Bottom sheet */}
      <div style={S.variantSheet}>
        <div style={S.variantSheetHeader}>{item.name}</div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {variants.map((variant) => {
            const unsentQty = getVariantUnsentQty(variant);

            return (
              <button
                key={variant.type}
                style={{ ...S.variantBtn, flex: "1 1 auto", justifyContent: "center", marginBottom: 0 }}
                onClick={() => {
                  onSelectVariant(variant);
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
