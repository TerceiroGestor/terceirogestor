"use client";

import * as React from "react";
import type { Column } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

type DataTableFilterSheetGroupsProps<TData> = {
  open: boolean;
  onToggle: () => void;
  columns: Column<TData, unknown>[];
};

export function DataTableFilterSheetGroups<TData>({
  open,
  onToggle,
  columns,
}: DataTableFilterSheetGroupsProps<TData>) {
  const columnLabel = React.useCallback(
    (column: Column<TData, unknown>) =>
      String(column.columnDef.header ?? column.id),
    [],
  );

  return (
    <details className="rounded-md border border-border" open={open}>
      <summary
        className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-medium"
        onClick={(event) => {
          event.preventDefault();
          onToggle();
        }}
      >
        Agrupar
        <span className="text-[11px] text-muted-foreground">
          {columns.filter((column) => column.getIsGrouped()).length}
        </span>
      </summary>
      <div className="border-t border-border px-3 pt-3 pb-0 max-h-40 overflow-y-auto flex flex-col">
        <div className="space-y-1.5">
          {columns.map((column) => (
            <label
              key={column.id}
              className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5 text-xs"
            >
              <span>{columnLabel(column)}</span>
              <input
                type="checkbox"
                checked={column.getIsGrouped()}
                onChange={() => column.toggleGrouping()}
              />
            </label>
          ))}
        </div>
        <div className="sticky bottom-0 -mx-3 mt-2 border-t border-border bg-background/95 px-3 py-2 backdrop-blur">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs w-full"
            onClick={() =>
              columns.forEach((column) => {
                if (column.getIsGrouped()) {
                  column.toggleGrouping();
                }
              })
            }
          >
            Limpar agrupamentos
          </Button>
        </div>
      </div>
    </details>
  );
}
