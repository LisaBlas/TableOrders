import { useTable } from "../contexts/TableContext";
import { groupByDestination, DESTINATIONS, DEST_LABELS } from "../utils/batchGrouping";
import { batchMarkId } from "../utils/batchMarks";
import { S } from "../styles/appStyles";
import type { Batch, TableId } from "../types";

interface SentBatchCardProps {
  batches: Batch[];
  tableId: TableId;
}

export function SentBatchCard({ batches, tableId }: SentBatchCardProps) {
  const table = useTable();

  if (batches.length === 0) return null;

  return (
    <div style={S.sentSectionsContainer}>
      {[...batches].reverse().map((batch, batchIdx) => {
        const actualBatchIdx = batches.length - 1 - batchIdx;
        const markId = batchMarkId(batch);
        const isMarked = table.markedBatches[String(tableId)]?.has(markId) || false;

        const batchByDest = groupByDestination(batch.items);
        const ts = typeof batch.timestamp === "string" ? new Date(batch.timestamp) : batch.timestamp;
        const accentColor = isMarked ? "#b8e6c8" : "#f0bfbf";
        const sectionStyle = { ...S.sentSection, ...(isMarked ? S.sentSectionMarked : S.sentSectionPending) };

        return (
          <div key={`${markId}-${actualBatchIdx}`}>
            <div style={S.sentDivider}>
              <div style={{ ...S.sentDividerLine, background: accentColor }} />
              <span style={S.sentDividerText}>
                Sent {ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <button
                style={{ ...S.markBtn, borderColor: accentColor }}
                onClick={() => table.toggleMarkBatch(tableId, markId)}
              >
                {isMarked ? "Unmark" : "Mark"}
              </button>
              <div style={{ ...S.sentDividerLine, background: accentColor }} />
            </div>
            {DESTINATIONS.map((dest) => batchByDest[dest].length > 0 && (
              <div key={dest} style={sectionStyle}>
                <span style={S.sentLabel}>{DEST_LABELS[dest]}</span>
                {batchByDest[dest].map((o) => (
                  <div key={o.id} style={S.sentItem}>
                    <span>{o.qty}× {o.name}</span>
                    <span style={S.sentPrice}>{(o.price * o.qty).toFixed(2)}€</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
