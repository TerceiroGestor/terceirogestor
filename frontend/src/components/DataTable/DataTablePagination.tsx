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

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      {/* Mobile */}
      <div className="flex w-full items-center justify-between gap-2 sm:hidden">
        <Button
          size="sm"
          variant="outline"
          className="h-9 px-3"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Anterior
        </Button>
        <span className="truncate">
          PÃ¡gina {Math.min(pageCount, pageIndex + 1)} de {pageCount}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-9 px-3"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          PrÃ³xima
        </Button>
      </div>

      {/* Desktop */}
      <div className="hidden items-center gap-1 sm:flex">
        {Array.from({ length: pageCount }, (_, index) => (
          <Button
            key={index}
            size="sm"
            variant={pageIndex === index ? "default" : "outline"}
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
