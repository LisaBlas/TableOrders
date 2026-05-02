import { useTable } from "../contexts/TableContext";
import { S } from "../styles/appStyles";
import type { SessionConflict } from "../utils/conflictDetection";

interface ConflictResolutionModalProps {
  conflict: SessionConflict;
  conflictIndex: number;
  totalConflicts: number;
  onResolve: (resolution: "local" | "remote" | "merge") => void;
}

export function ConflictResolutionModal({
  conflict,
  conflictIndex,
  totalConflicts,
  onResolve,
}: ConflictResolutionModalProps) {
  const { resolveTableDisplayId } = useTable();
  const { tableId, local, remote } = conflict;

  const localTotal = local.orders.reduce((sum, item) => sum + item.price * item.qty, 0);
  const remoteTotal = remote.orders.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div style={S.modalOverlay}>
      <div style={{ ...S.modalCard, maxWidth: 600, width: "90%" }} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalTitle}>
          Sync Conflict [{conflictIndex} of {totalConflicts}]
        </div>

        <div style={{ fontSize: 14, marginBottom: 16, color: "#666" }}>
          Table {resolveTableDisplayId(tableId)} was modified on multiple devices while offline. Choose which version to keep:
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {/* Local Device */}
          <div style={conflictColumnStyle}>
            <div style={conflictHeaderStyle}>Local (This Device)</div>
            <div style={conflictContentStyle}>
              {local.orders.length === 0 ? (
                <div style={emptyStateStyle}>No orders</div>
              ) : (
                <>
                  {local.orders.map((item, idx) => (
                    <div key={idx} style={itemRowStyle}>
                      <span>{item.name}</span>
                      <span style={{ color: "#666", fontSize: 13 }}>
                        {item.qty}× €{item.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {local.gutschein ? (
                    <div style={{ ...itemRowStyle, color: "#e67e22" }}>
                      <span>Gutschein</span>
                      <span>-€{local.gutschein.toFixed(2)}</span>
                    </div>
                  ) : null}
                </>
              )}
              {local.sent_batches.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
                  {local.sent_batches.length} batch(es) sent
                </div>
              )}
              <div style={totalRowStyle}>
                <strong>Total</strong>
                <strong>€{(localTotal - (local.gutschein ?? 0)).toFixed(2)}</strong>
              </div>
              {local.seated && <div style={statusBadgeStyle}>Seated</div>}
            </div>
          </div>

          {/* Remote Device */}
          <div style={conflictColumnStyle}>
            <div style={conflictHeaderStyle}>Remote (Other Device)</div>
            <div style={conflictContentStyle}>
              {remote.orders.length === 0 ? (
                <div style={emptyStateStyle}>No orders</div>
              ) : (
                <>
                  {remote.orders.map((item, idx) => (
                    <div key={idx} style={itemRowStyle}>
                      <span>{item.name}</span>
                      <span style={{ color: "#666", fontSize: 13 }}>
                        {item.qty}× €{item.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {remote.gutschein ? (
                    <div style={{ ...itemRowStyle, color: "#e67e22" }}>
                      <span>Gutschein</span>
                      <span>-€{remote.gutschein.toFixed(2)}</span>
                    </div>
                  ) : null}
                </>
              )}
              {remote.sent_batches.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
                  {remote.sent_batches.length} batch(es) sent
                </div>
              )}
              <div style={totalRowStyle}>
                <strong>Total</strong>
                <strong>€{(remoteTotal - (remote.gutschein ?? 0)).toFixed(2)}</strong>
              </div>
              {remote.seated && <div style={statusBadgeStyle}>Seated</div>}
            </div>
          </div>
        </div>

        <div style={{ ...S.modalActions, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <button style={S.modalCancelBtn} onClick={() => onResolve("local")}>
            Keep Local
          </button>
          <button
            style={{ ...S.modalConfirmBtn, background: "#3498db" }}
            onClick={() => onResolve("merge")}
          >
            Merge Both
          </button>
          <button style={S.modalConfirmBtn} onClick={() => onResolve("remote")}>
            Keep Remote
          </button>
        </div>
      </div>
    </div>
  );
}

const conflictColumnStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 8,
};

const conflictHeaderStyle = {
  fontWeight: 600,
  fontSize: 14,
  paddingBottom: 8,
  borderBottom: "1px solid #ddd",
};

const conflictContentStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
  fontSize: 14,
};

const itemRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "4px 0",
};

const totalRowStyle = {
  ...itemRowStyle,
  marginTop: 8,
  paddingTop: 8,
  borderTop: "1px solid #eee",
  fontSize: 15,
};

const emptyStateStyle = {
  color: "#999",
  fontStyle: "italic" as const,
  fontSize: 13,
};

const statusBadgeStyle = {
  display: "inline-block",
  padding: "2px 8px",
  background: "#fff3cd",
  border: "1px solid #ffc107",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  marginTop: 8,
  alignSelf: "flex-start" as const,
};
