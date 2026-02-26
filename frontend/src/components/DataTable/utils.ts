"use client";

import type {
  Column,
  ColumnDef,
  ColumnPinningState,
  Table,
} from "@tanstack/react-table";

export const getInitialFilterColumnId = <TData,>(
  columns: ColumnDef<TData, unknown>[],
) => {
  for (const column of columns) {
    if ("accessorKey" in column && column.accessorKey) {
      return String(column.accessorKey);
    }
    if ("id" in column && column.id) {
      return String(column.id);
    }
  }
  return "";
};

export const getPinnedStyles = <TData,>(
  column: Column<TData, unknown>,
  table: Table<TData>,
) => {
  const pinned = column.getIsPinned();
  if (!pinned) return undefined;

  if (pinned === "left") {
    const size = column.getSize();
    const leftColumns = table.getLeftLeafColumns();
    let offset = 0;
    for (const col of leftColumns) {
      if (col.id === column.id) break;
      offset += col.getSize();
    }
    return {
      position: "sticky" as const,
      left: offset,
      zIndex: 1,
      background: "var(--color-muted)",
      width: size,
      minWidth: size,
      maxWidth: size,
    };
  }

  if (pinned === "right") {
    const size = column.getSize();
    const rightColumns = table.getRightLeafColumns();
    let offset = 0;
    for (const col of rightColumns) {
      if (col.id === column.id) break;
      offset += col.getSize();
    }
    return {
      position: "sticky" as const,
      right: offset,
      zIndex: 1,
      background: "var(--color-muted)",
      width: size,
      minWidth: size,
      maxWidth: size,
    };
  }

  return undefined;
};

export const ensureActionsLeft = (next: ColumnPinningState) => {
  return {
    left: ["actions", ...(next.left ?? []).filter((id) => id !== "actions")],
    right: (next.right ?? []).filter((id) => id !== "actions"),
  };
};
