import { useState, useCallback } from "react";
import type { TableId } from "../types";

export interface TableSwap {
  sourceTable: TableId | null;
  targetTable: TableId | null;
  isActive: boolean;
  activate: (tableId: TableId) => void;
  selectTarget: (tableId: TableId) => void;
  confirm: () => void;
  cancel: () => void;
}

export function useTableSwap(swapTables: (a: TableId, b: TableId) => void): TableSwap {
  const [sourceTable, setSourceTable] = useState<TableId | null>(null);
  const [targetTable, setTargetTable] = useState<TableId | null>(null);

  const activate = useCallback((tableId: TableId) => {
    setSourceTable(tableId);
    setTargetTable(null);
  }, []);

  const selectTarget = useCallback((tableId: TableId) => {
    setTargetTable(tableId);
  }, []);

  const confirm = useCallback(() => {
    if (sourceTable !== null && targetTable !== null) {
      swapTables(sourceTable, targetTable);
      setSourceTable(null);
      setTargetTable(null);
    }
  }, [sourceTable, targetTable, swapTables]);

  const cancel = useCallback(() => {
    setSourceTable(null);
    setTargetTable(null);
  }, []);

  return { sourceTable, targetTable, isActive: sourceTable !== null, activate, selectTarget, confirm, cancel };
}
