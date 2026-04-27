import { S } from "../styles/appStyles";
import { useMenu } from "../contexts/MenuContext";
import { consolidateItems } from "../utils/helpers";
import { RESTAURANT_NAME } from "../config/appConfig";
import type { ReceiptProps } from "../types";

export function Receipt({
  tableId,
  items,
  guestNum = null,
  editMode = false,
  gutschein = 0,
  onRemoveItem = null,
  onAddItem = null,
  onRemoveGutschein = null,
  skipHeader = false,
}: ReceiptProps) {
  const { minQty2Ids } = useMenu();
  const consolidatedItems = consolidateItems(items);
  const subtotal = items.reduce((s, o) => s + o.price * o.qty, 0);
  const total = Math.max(0, subtotal - gutschein);

  return (
    <>
      {!skipHeader && (
        <>
          <div style={S.closeReceiptBrand}>{RESTAURANT_NAME}</div>
          <div style={S.closeReceiptMeta}>
            Table {tableId}
            {guestNum && ` · Guest ${guestNum}`}
            {' · '}
            {new Date().toLocaleString("en-GB", {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </>
      )}
      <div style={S.divider} />

      {consolidatedItems.map((o) => (
        <div key={o.id} style={editMode ? S.closeRowEditable : S.closeRow}>
          {editMode && onRemoveItem && (
            <button
              style={S.closeRemoveBtn}
              onClick={() => onRemoveItem(o.id)}
              title="Remove one"
              disabled={o.qty <= 2 && minQty2Ids.has(o.id)}
            >
              −
            </button>
          )}
          <span style={S.closeQty}>{o.qty}×</span>
          {editMode && onAddItem && (
            <button
              style={S.closeAddBtn}
              onClick={() => onAddItem(o.id)}
              title="Add one"
            >
              +
            </button>
          )}
          <span style={S.closeName}>{o.name}</span>
          <span style={S.closeLinePrice}>
            {(o.price * o.qty).toFixed(2)}€
          </span>
        </div>
      ))}

      <div style={S.perforationDivider} />

      {gutschein > 0 && (
        <>
          <div style={S.closeSubtotalRow}>
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)}€</span>
          </div>
          <div style={S.closeGutscheinRow}>
            <span>Voucher</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>-{gutschein.toFixed(2)}€</span>
              {editMode && onRemoveGutschein && (
                <button
                  style={S.removeGutscheinBtn}
                  onClick={onRemoveGutschein}
                  title="Remove voucher"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <div style={S.closeTotalRow}>
        <span>Total</span>
        <span>{total.toFixed(2)}€</span>
      </div>
    </>
  );
}
