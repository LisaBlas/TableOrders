import { S } from "../styles/appStyles";
import type { ModalProps } from "../types";

export function Modal({
  title,
  children,
  onClose,
  onConfirm,
  cancelText = "Cancel",
  confirmText = "Confirm",
  confirmStyle = null,
  closeOnBackdrop = true,
}: ModalProps) {
  const handleBackdropClick = closeOnBackdrop ? onClose : undefined;
  const finalConfirmStyle = confirmStyle || S.modalConfirmBtn;

  return (
    <div style={S.modalOverlay} onClick={handleBackdropClick}>
      <div style={S.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalTitle}>{title}</div>
        {children}
        <div style={S.modalActions}>
          <button style={S.modalCancelBtn} onClick={onClose}>
            {cancelText}
          </button>
          <button style={finalConfirmStyle} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
