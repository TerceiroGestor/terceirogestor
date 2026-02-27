"use client";

import * as React from "react";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import type {
  Column,
  ColumnDef,
  ColumnPinningState,
  Row,
  RowSelectionState,
  SortingState,
  Table as TanstackTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight, ChevronUp, Columns2, MoreHorizontal, PinIcon, PinOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type GroupNode<TData> = {
  key: string;
  field: string;
  value: unknown;
  label: string;
  count: number;
  depth: number;
  children: GroupNode<TData>[] | null;
  rows: Row<TData>[] | null;
};

function defaultGroupLabel(_field: string, value: unknown) {
  const label = String(value ?? "").trim();
  return label ? label : "Sem valor";
}

function buildGroupNodes<TData>({
  rows,
  fields,
  depth,
  parentKey,
  resolveGroupLabel,
}: {
  rows: Row<TData>[];
  fields: string[];
  depth: number;
  parentKey: string;
  resolveGroupLabel: (field: string, value: unknown) => string;
}): GroupNode<TData>[] {
  if (!fields.length) return [];

  const field = fields[0]!;
  const map = new Map<string, { key: string; value: unknown; label: string; rows: Row<TData>[] }>();

  rows.forEach((row) => {
    const raw = row.original as Record<string, unknown>;
    const value = raw[field];
    const label = resolveGroupLabel(field, value);
    const rawKey = `${field}:${String(value ?? "").trim()}`;
    const key = parentKey ? `${parentKey}|${rawKey}` : rawKey;

    const current = map.get(key) ?? { key, value, label, rows: [] as Row<TData>[] };
    current.rows.push(row);
    map.set(key, current);
  });

  const nextFields = fields.slice(1);
  return Array.from(map.values())
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((group) => {
      const children =
        nextFields.length > 0
          ? buildGroupNodes<TData>({
              rows: group.rows,
              fields: nextFields,
              depth: depth + 1,
              parentKey: group.key,
              resolveGroupLabel,
            })
          : null;

      return {
        key: group.key,
        field,
        value: group.value,
        label: group.label,
        count: group.rows.length,
        depth,
        children,
        rows: nextFields.length ? null : group.rows,
      };
    });
}

function getPinnedStyles<TData>(
  column: Column<TData, unknown>,
  table: TanstackTable<TData>,
) {
  const pinningState = table.getState().columnPinning;
  const pinnedFromState: false | "left" | "right" =
    pinningState.left?.includes(column.id)
      ? "left"
      : pinningState.right?.includes(column.id)
        ? "right"
        : false;

  const pinnedFromApi =
    typeof column.getIsPinned === "function"
      ? (column.getIsPinned() as false | "left" | "right")
      : false;

  const pinned = pinnedFromState || pinnedFromApi;
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
      zIndex: 2,
      background: "var(--color-background)",
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
      zIndex: 2,
      background: "var(--color-background)",
      width: size,
      minWidth: size,
      maxWidth: size,
    };
  }

  return undefined;
}

function ColumnMenu<TData>({
  column,
  table,
}: {
  column: Column<TData, unknown>;
  table: TanstackTable<TData>;
}) {
  const canSort = column.getCanSort?.() ?? false;
  const canHide = column.getCanHide?.() ?? true;
  const pinningState = table.getState().columnPinning;
  const pinnedFromState: false | "left" | "right" =
    pinningState.left?.includes(column.id)
      ? "left"
      : pinningState.right?.includes(column.id)
        ? "right"
        : false;
  const pinnedFromApi =
    typeof column.getIsPinned === "function"
      ? (column.getIsPinned() as false | "left" | "right")
      : false;
  const isPinned = pinnedFromState || pinnedFromApi;

  const pinLeft = () => table.setColumnPinning((prev: ColumnPinningState) => {
    const left = (prev.left ?? []).filter((id) => id !== column.id);
    const right = (prev.right ?? []).filter((id) => id !== column.id);
    return { left: [...left, column.id], right };
  });

  const pinRight = () => table.setColumnPinning((prev: ColumnPinningState) => {
    const left = (prev.left ?? []).filter((id) => id !== column.id);
    const right = (prev.right ?? []).filter((id) => id !== column.id);
    return { left, right: [...right, column.id] };
  });

  const unpin = () => table.setColumnPinning((prev: ColumnPinningState) => ({
    left: (prev.left ?? []).filter((id) => id !== column.id),
    right: (prev.right ?? []).filter((id) => id !== column.id),
  }));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-60 hover:opacity-100"
          title="Opções da coluna"
          aria-label="Opções da coluna"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => column.toggleSorting(false)} disabled={!canSort}>
          Ordenar A–Z
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(true)} disabled={!canSort}>
          Ordenar Z–A
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.clearSorting?.()} disabled={!canSort}>
          Limpar ordenação
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => column.toggleVisibility(false)} disabled={!canHide}>
          Ocultar coluna
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={pinLeft}>
          <PinIcon className="mr-2 size-4" />
          Fixar à esquerda
        </DropdownMenuItem>
        <DropdownMenuItem onClick={pinRight}>
          <PinIcon className="mr-2 size-4" />
          Fixar à direita
        </DropdownMenuItem>
        <DropdownMenuItem onClick={unpin} disabled={!isPinned}>
          <PinOff className="mr-2 size-4" />
          Soltar coluna
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ColumnsMenu<TData>({ table }: { table: TanstackTable<TData> }) {
  const columns = table
    .getAllLeafColumns()
    .filter((col) => col.id !== "__select__" && (col.getCanHide?.() ?? true));

  if (!columns.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-2 px-2 text-xs text-muted-foreground hover:text-foreground"
          title="Colunas"
          aria-label="Colunas"
        >
          <Columns2 className="size-4" />
          <span className="hidden sm:inline">Colunas</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        {columns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.id}
            checked={col.getIsVisible?.() ?? true}
            onCheckedChange={(checked) => col.toggleVisibility?.(Boolean(checked))}
          >
            {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
  groupByFields,
  resolveGroupLabel = defaultGroupLabel,
  enableColumnTools = true,
  initialColumnVisibility,
  initialColumnPinning,
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
  groupByFields?: string[] | null;
  resolveGroupLabel?: (field: string, groupValue: unknown) => string;
  enableColumnTools?: boolean;
  initialColumnVisibility?: VisibilityState;
  initialColumnPinning?: ColumnPinningState;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    () => initialColumnVisibility ?? {},
  );
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(
    () => initialColumnPinning ?? {},
  );

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
    state: { sorting, rowSelection, columnVisibility, columnPinning },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    enableColumnPinning: true,
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

  const groupFields = React.useMemo(
    () => groupByFields?.filter(Boolean) ?? [],
    [groupByFields],
  );

  const grouped = React.useMemo(() => {
    if (!groupFields.length) return null;
    const rows = table.getRowModel().rows;
    return buildGroupNodes<TData>({
      rows,
      fields: groupFields,
      depth: 0,
      parentKey: "",
      resolveGroupLabel,
    });
  }, [groupFields, resolveGroupLabel, table]);

  const [openByKey, setOpenByKey] = React.useState<Record<string, boolean>>({});
  const isOpen = React.useCallback((key: string) => openByKey[key] ?? true, [openByKey]);
  const toggle = React.useCallback((key: string) => {
    setOpenByKey((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  }, []);

  const visibleColumnsCount = table.getVisibleLeafColumns().length;

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
          {grouped ? (
            <div className="space-y-2">
              {(() => {
                const renderGroupCards = (node: GroupNode<TData>) => {
                  const open = isOpen(node.key);
                  const hasChildren = Boolean(node.children?.length);
                  const hasRows = Boolean(node.rows?.length);

                  return (
                    <div key={node.key} className="space-y-2">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-sm px-1 py-1 text-left hover:bg-muted/20"
                        onClick={() => toggle(node.key)}
                        style={{ paddingLeft: 4 + node.depth * 14 }}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <ChevronRight
                            className={cn(
                              "size-4 shrink-0 text-muted-foreground transition-transform",
                              open ? "rotate-90" : undefined,
                            )}
                          />
                          <div className="min-w-0 truncate text-xs font-semibold text-foreground">
                            {node.label}
                          </div>
                        </div>
                        <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          {node.count}
                        </div>
                      </button>

                      {open ? (
                        hasChildren ? (
                          <div className="space-y-2">{node.children!.map(renderGroupCards)}</div>
                        ) : hasRows ? (
                          <div className="grid gap-2">
                            {node.rows!.map((r) => (
                              <div key={r.id}>{renderCard(r.original)}</div>
                            ))}
                          </div>
                        ) : null
                      ) : null}
                    </div>
                  );
                };

                return grouped.map(renderGroupCards);
              })()}
            </div>
          ) : data.length ? (
            data.map((row, index) => (
              <div key={getRowId?.(row, index) ?? String(index)}>{renderCard(row)}</div>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              Nenhum registro.
            </div>
          )}
        </div>
      ) : null}

      <div className={cn(renderCard ? "hidden md:block" : undefined)}>
        {enableColumnTools ? (
          <div className="flex items-center justify-end border-b border-border/60 px-2 py-1">
            <ColumnsMenu table={table} />
          </div>
        ) : null}
        <UiTable>
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sort = header.column.getIsSorted();
                  const pinnedStyles = getPinnedStyles(header.column, table);
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(canSort ? "cursor-pointer select-none" : undefined)}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      style={pinnedStyles}
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
                        {enableColumnTools && header.column.id !== "__select__" ? (
                          <span
                            className="ml-auto"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <ColumnMenu column={header.column} table={table} />
                          </span>
                        ) : null}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {grouped ? (
              (() => {
                const renderNode = (node: GroupNode<TData>) => {
                  const open = isOpen(node.key);
                  const hasChildren = Boolean(node.children?.length);
                  const hasRows = Boolean(node.rows?.length);

                  return (
                    <React.Fragment key={node.key}>
                      <TableRow className="bg-muted/10">
                        <TableCell colSpan={visibleColumnsCount}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-sm px-1 py-1 text-left hover:bg-muted/20"
                            onClick={() => toggle(node.key)}
                            style={{ paddingLeft: 4 + node.depth * 14 }}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <ChevronRight
                                className={cn(
                                  "size-4 shrink-0 text-muted-foreground transition-transform",
                                  open ? "rotate-90" : undefined,
                                )}
                              />
                              <div className="min-w-0 truncate text-xs font-semibold text-foreground">
                                {node.label}
                              </div>
                            </div>
                            <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                              {node.count}
                            </div>
                          </button>
                        </TableCell>
                      </TableRow>

                      {open ? (
                        hasChildren ? (
                          node.children!.map(renderNode)
                        ) : hasRows ? (
                          node.rows!.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() ? "selected" : undefined}
                              className={cn(onRowClick ? "cursor-pointer" : undefined)}
                              onClick={() => onRowClick?.(row.original)}
                            >
                              {row.getVisibleCells().map((cell) => {
                                const pinnedStyles = getPinnedStyles(cell.column, table);
                                return (
                                  <TableCell key={cell.id} style={pinnedStyles}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))
                        ) : null
                      ) : null}
                    </React.Fragment>
                  );
                };

                return grouped.map(renderNode);
              })()
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={cn(onRowClick ? "cursor-pointer" : undefined)}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const pinnedStyles = getPinnedStyles(cell.column, table);
                    return (
                      <TableCell key={cell.id} style={pinnedStyles}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
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
        </UiTable>
      </div>
    </div>
  );
}

