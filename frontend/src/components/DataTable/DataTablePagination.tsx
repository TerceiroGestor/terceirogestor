"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTablePageSizeMenu } from "@/components/DataTable/DataTablePageSizeMenu";

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  showPagination: boolean;
  totalCount?: number;
};

export function DataTablePagination<TData>({
  table,
  showPagination,
  totalCount,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const coreRows = table.getCoreRowModel().rows.length;
  const filteredRows = table.getFilteredRowModel().rows.length;

  const isManualPagination = Boolean(table.options.manualPagination);

  const resolvedFilteredTotal =
    typeof totalCount === "number" ? totalCount : filteredRows;

  const derivedPageCount =
    resolvedFilteredTotal === 0
      ? 0
      : pageSize > 0
        ? Math.ceil(resolvedFilteredTotal / pageSize)
        : 1;

  const resolvedManualPageCount =
    typeof table.options.pageCount === "number" &&
    Number.isFinite(table.options.pageCount) &&
    table.options.pageCount > 0
      ? table.options.pageCount
      : 0;

  const pageCount = isManualPagination
    ? resolvedManualPageCount || derivedPageCount
    : derivedPageCount;
  const currentPage =
    pageCount === 0 ? 0 : Math.min(Math.max(pageIndex + 1, 1), pageCount);

  const pages = (() => {
    if (pageCount <= 0) return [];
    if (pageCount <= 1) return [0];
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i);

    const windowSize = 2;
    const start = Math.max(0, pageIndex - windowSize);
    const end = Math.min(pageCount - 1, pageIndex + windowSize);

    const candidates = new Set<number>([0, pageCount - 1]);
    for (let i = start; i <= end; i += 1) candidates.add(i);

    return Array.from(candidates).sort((a, b) => a - b);
  })();

  const canPrevious = pageCount > 0 && pageIndex > 0;
  const canNext = pageCount > 0 && pageIndex < pageCount - 1;

  React.useEffect(() => {
    if (!showPagination) return;
    if (pageCount <= 0) return;
    if (pageIndex <= pageCount - 1) return;
    table.setPageIndex(Math.max(pageCount - 1, 0));
  }, [pageCount, pageIndex, showPagination, table]);

  if (!showPagination) return null;

  return (
    <>
      {/* Mobile */}
      <div className="flex w-full items-center justify-between gap-2 sm:hidden">
        <DataTablePageSizeMenu table={table} />
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9"
            disabled={!canPrevious}
            onClick={() => table.previousPage()}
            aria-label="Página anterior"
            title="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="whitespace-nowrap text-[11px] text-muted-foreground">
            Página {currentPage} de {pageCount}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9"
            disabled={!canNext}
            onClick={() => table.nextPage()}
            aria-label="Próxima página"
            title="Próxima página"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="w-9" />
      </div>

      {/* Desktop */}
      <div className="hidden w-full grid-cols-[1fr_auto_1fr] items-center gap-2 sm:grid">
        <div className="flex items-center gap-2">
          <DataTablePageSizeMenu table={table} />
          <span className="whitespace-nowrap text-[11px] text-muted-foreground">
            Total:{" "}
            <span className="font-mono tabular-nums text-foreground">
              {(typeof totalCount === "number" ? totalCount : coreRows).toLocaleString(
                "pt-BR",
              )}
            </span>
          </span>
          <span className="whitespace-nowrap text-[11px] text-muted-foreground">
            Página:{" "}
            <span className="font-mono tabular-nums text-foreground">
              {currentPage}
            </span>{" "}
            de{" "}
            <span className="font-mono tabular-nums text-foreground">
              {pageCount}
            </span>
          </span>
          {typeof totalCount === "number" && totalCount !== coreRows ? (
            <span className="whitespace-nowrap text-[11px] text-muted-foreground">
              Na página:{" "}
              <span className="font-mono tabular-nums text-foreground">
                {coreRows.toLocaleString("pt-BR")}
              </span>
            </span>
          ) : filteredRows !== coreRows ? (
            <span className="whitespace-nowrap text-[11px] text-muted-foreground">
              Filtrados:{" "}
              <span className="font-mono tabular-nums text-foreground">
                {filteredRows.toLocaleString("pt-BR")}
              </span>
            </span>
          ) : null}
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={!canPrevious}
            onClick={() => table.previousPage()}
            aria-label="Página anterior"
            title="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-1">
            {pages.map((index, i) => {
              const prev = i > 0 ? pages[i - 1] : null;
              const showEllipsis = prev !== null && index - prev > 1;
              const isActive = pageIndex === index;
              const activeClassName = isActive
                ? "font-semibold shadow-sm ring-2 ring-ring ring-offset-1"
                : "";
              return (
                <React.Fragment key={index}>
                  {showEllipsis ? <span className="px-1">…</span> : null}
                  <Button
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    className={`h-8 min-w-8 px-2 ${activeClassName}`}
                    onClick={() => table.setPageIndex(index)}
                    aria-label={`Ir para página ${index + 1}`}
                    title={`Ir para página ${index + 1}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {index + 1}
                  </Button>
                </React.Fragment>
              );
            })}
          </div>

          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={!canNext}
            onClick={() => table.nextPage()}
            aria-label="Próxima página"
            title="Próxima página"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex items-center justify-end">
          <span className="whitespace-nowrap text-[11px] text-muted-foreground">
            Página {currentPage} de {pageCount}
          </span>
        </div>
      </div>
    </>
  );
}
