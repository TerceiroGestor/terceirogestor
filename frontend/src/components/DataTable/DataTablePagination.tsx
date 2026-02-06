"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  showPagination: boolean;
};

export function DataTablePagination<TData>({
  table,
  showPagination,
}: DataTablePaginationProps<TData>) {
  if (!showPagination) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        {Array.from({ length: table.getPageCount() }, (_, index) => (
          <Button
            key={index}
            size="sm"
            variant={
              table.getState().pagination.pageIndex === index
                ? "default"
                : "outline"
            }
            className="h-8 min-w-8 px-2"
            onClick={() => table.setPageIndex(index)}
          >
            {index + 1}
          </Button>
        ))}
      </div>
    </div>
  );
}
