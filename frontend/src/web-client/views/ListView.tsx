"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ListView<TData>({
  data,
  columns,
  enableRowSelection = false,
  renderCard,
  bulkActions,
  onSelectionChange,
  onRowClick,
  className,
  getRowId,
}: {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  enableRowSelection?: boolean;
  renderCard?: (row: TData) => React.ReactNode;
  bulkActions?: (selection: TData[]) => React.ReactNode;
  onSelectionChange?: (rows: TData[]) => void;
  onRowClick?: (row: TData) => void;
  className?: string;
  getRowId?: (row: TData, index: number) => string;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const selectionColumn = React.useMemo<ColumnDef<TData, unknown> | null>(() => {
    if (!enableRowSelection) return null;
    return {
      id: "__select__",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))}
            aria-label="Selecionar todos"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
            aria-label="Selecionar linha"
          />
        </div>
      ),
      size: 32,
    };
  }, [enableRowSelection]);

  const effectiveColumns = React.useMemo(
    () => (selectionColumn ? [selectionColumn, ...columns] : columns),
    [columns, selectionColumn],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: effectiveColumns,
    state: { sorting, rowSelection },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection,
    getRowId: getRowId
      ? (originalRow: TData, index: number) => getRowId(originalRow, index)
      : undefined,
  });

  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);

  React.useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedRows);
  }, [onSelectionChange, selectedRows]);

  return (
    <div className={cn("rounded-md border border-border/60 bg-background", className)}>
      {enableRowSelection && bulkActions && selectedRows.length ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2 text-xs">
          <div className="text-muted-foreground">
            Selecionados:{" "}
            <span className="font-mono tabular-nums text-foreground">
              {selectedRows.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">{bulkActions(selectedRows)}</div>
        </div>
      ) : null}

      {renderCard ? (
        <div className="grid gap-2 p-3 md:hidden">
          {data.length ? (
            data.map((row, index) => (
              <div key={getRowId?.(row, index) ?? String(index)}>
                {renderCard(row)}
              </div>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              Nenhum registro.
            </div>
          )}
        </div>
      ) : null}

      <div className={cn(renderCard ? "hidden md:block" : undefined)}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sort = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(canSort ? "cursor-pointer select-none" : undefined)}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {sort === "asc" ? (
                          <ChevronUp className="size-3.5 text-muted-foreground" />
                        ) : sort === "desc" ? (
                          <ChevronDown className="size-3.5 text-muted-foreground" />
                        ) : null}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={cn(onRowClick ? "cursor-pointer" : undefined)}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={effectiveColumns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  Nenhum registro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
