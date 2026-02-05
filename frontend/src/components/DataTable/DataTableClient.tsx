"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Column,
  type FilterFn,
  type GroupingState,
  type SortingState,
  type VisibilityState,
  type ColumnPinningState,
  type PaginationState,
  type Row,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  PinOff,
  PinIcon,
  GripVertical,
  Printer,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableToolbar } from "@/components/DataTable/DataTableToolbar";
import { DataTableFilterSheet } from "@/components/DataTable/DataTableFilterSheet";
import { Button } from "@/components/ui/button";
import { DataTableActionMenu } from "@/components/DataTable/DataTableActionMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSafeSetters } from "@/components/DataTable/hooks/useSafeSetters";

export type DataTableClientProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  searchPlaceholder?: string;
  groupableColumns?: string[];
  rowActions?: {
    id: string;
    label: string;
    destructive?: boolean;
    onSelect: (row: TData) => void;
  }[];
  summaryCards?: {
    totalLabel?: string;
    filteredLabel?: string;
    groupedLabel?: string;
  };
  showExportMenu?: boolean;
  exportLabels?: {
    title?: string;
    pdf?: string;
    csv?: string;
  };
  actions?: (ctx: {
    visibleColumnIds: string[];
    visibleColumns: Column<TData, unknown>[];
    rows: Row<TData>[];
    getRowValue: (row: Row<TData>, columnId: string) => unknown;
    grouping: string[];
    exportCsv: () => void;
    exportPdf: () => void;
  }) => React.ReactNode;
};

type AdvancedFilter = {
  columnId: string;
  operator:
    | "equals"
    | "contains"
    | "gt"
    | "lt"
    | "gte"
    | "lte"
    | "starts"
    | "ends";
  value: string;
};

const DEFAULT_PINNING: ColumnPinningState = { left: ["actions"] };
const DEFAULT_PAGE_SIZE = 10;

const getInitialFilterColumnId = <TData,>(
  columns: ColumnDef<TData, any>[],
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

export function DataTableClient<TData>({
  columns,
  data,
  searchPlaceholder = "Search...",
  groupableColumns = [],
  rowActions = [],
  summaryCards,
  showExportMenu = false,
  exportLabels,
  actions,
}: DataTableClientProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [grouping, setGrouping] = React.useState<GroupingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(
    DEFAULT_PINNING,
  );
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [advancedFilters, setAdvancedFilters] = React.useState<
    AdvancedFilter[]
  >(() => {
    const initialColumnId = getInitialFilterColumnId(columns);
    return initialColumnId
      ? [
          {
            columnId: initialColumnId,
            operator: "equals",
            value: "",
          },
        ]
      : [];
  });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const {
    mountedRef,
    safeSetSorting,
    safeSetGlobalFilter,
    safeSetColumnFilters,
    safeSetGrouping,
    safeSetColumnVisibility,
    safeSetColumnPinning,
    safeSetPagination,
    safeSetAdvancedFilters,
    safeSetFiltersOpen,
  } = useSafeSetters<AdvancedFilter>({
    setSorting,
    setGlobalFilter,
    setColumnFilters,
    setGrouping,
    setColumnVisibility,
    setColumnPinning,
    setPagination,
    setAdvancedFilters,
    setFiltersOpen,
  });

  React.useEffect(() => {
    if (!mountedRef.current) return;
    if (grouping.length > 0) {
      const fullSize = Math.max(data.length, 1);
      if (pagination.pageSize !== fullSize || pagination.pageIndex !== 0) {
        safeSetPagination({ pageIndex: 0, pageSize: fullSize });
      }
      return;
    }
    if (pagination.pageSize !== DEFAULT_PAGE_SIZE && data.length >= DEFAULT_PAGE_SIZE) {
      safeSetPagination((prev) => ({ ...prev, pageSize: DEFAULT_PAGE_SIZE }));
    }
  }, [data.length, grouping.length, pagination.pageIndex, pagination.pageSize, safeSetPagination]);

  const filterFn = React.useCallback<FilterFn<TData>>(
    (row, columnId, filterValue) => {
      const typedFilter = filterValue as AdvancedFilter | undefined;
      if (!typedFilter || typedFilter.value.trim() === "") return true;
      const rawValue = row.getValue(columnId);
      if (rawValue === undefined || rawValue === null) return false;

      const operator = typedFilter.operator;
      const filterRaw = typedFilter.value.trim();
      const rowValue =
        typeof rawValue === "number"
          ? rawValue
          : String(rawValue).toLowerCase();

      if (operator === "contains") {
        return String(rowValue).includes(filterRaw.toLowerCase());
      }

      if (operator === "equals") {
        if (typeof rowValue === "number") {
          const numeric = Number(filterRaw);
          return Number.isNaN(numeric) ? false : rowValue === numeric;
        }
        return String(rowValue) === filterRaw.toLowerCase();
      }

      if (operator === "starts") {
        return String(rowValue).startsWith(filterRaw.toLowerCase());
      }

      if (operator === "ends") {
        return String(rowValue).endsWith(filterRaw.toLowerCase());
      }

      const rowNumber =
        typeof rowValue === "number" ? rowValue : Number(rowValue);
      const filterNumber = Number(filterRaw);
      if (Number.isNaN(rowNumber) || Number.isNaN(filterNumber)) {
        return false;
      }
      if (operator === "gt") return rowNumber > filterNumber;
      if (operator === "gte") return rowNumber >= filterNumber;
      if (operator === "lte") return rowNumber <= filterNumber;
      return rowNumber < filterNumber;
    },
    [],
  );

  const columnsWithFilter = React.useMemo<ColumnDef<TData, any>[]>(() => {
    const withFilter = columns.map((column) => ({
      ...column,
      filterFn,
    }));

    const hasActionsColumn = withFilter.some((column) => column.id === "actions");
    if (!rowActions.length || hasActionsColumn) return withFilter;

    return [
      ...withFilter,
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DataTableActionMenu
            items={rowActions.map((action) => ({
              label: action.label,
              destructive: action.destructive,
              onSelect: () => action.onSelect(row.original as TData),
            }))}
          />
        ),
        enableSorting: false,
        size: 56,
        minSize: 56,
        maxSize: 56,
      } as ColumnDef<TData, any>,
    ];
  }, [columns, filterFn, rowActions]);

  const table = useReactTable({
    data,
    columns: columnsWithFilter,
    defaultColumn: {
      minSize: 80,
      size: 160,
      maxSize: 360,
    },
    state: {
      sorting,
      globalFilter,
      columnFilters,
      grouping,
      columnVisibility,
      columnPinning,
      pagination,
    },
    onSortingChange: safeSetSorting,
    onColumnFiltersChange: safeSetColumnFilters,
    onGroupingChange: safeSetGrouping,
    onColumnVisibilityChange: safeSetColumnVisibility,
    onColumnPinningChange: safeSetColumnPinning,
    onPaginationChange: safeSetPagination,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: grouping.length ? undefined : getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      if (value === undefined || value === null) return false;
      return String(value)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());
    },
    filterFns: {
      advanced: filterFn,
    },
  });

  const filterableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanFilter());
  const allGroupable = table
    .getAllLeafColumns()
    .filter(
      (column) =>
        (typeof column.getCanGroup === "function"
          ? column.getCanGroup()
          : true) && column.getCanFilter(),
    );

  const groupable =
    groupableColumns.length > 0
      ? (groupableColumns
          .map((columnId) => table.getColumn(columnId))
          .filter(Boolean) as Column<TData, unknown>[])
      : (allGroupable as Column<TData, unknown>[]);
  const visibleColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide());
  const visibleColumnIds = React.useMemo(
    () =>
      visibleColumns
        .filter((column) => column.getIsVisible())
        .map((column) => column.id),
    [visibleColumns],
  );
  const rowModel = grouping.length ? table.getExpandedRowModel() : table.getRowModel();
  const filteredRows =
    table.getFilteredRowModel().flatRows ?? table.getFilteredRowModel().rows;
  const showPagination = grouping.length === 0;
  const filteredCount =
    table.getFilteredRowModel().flatRows?.length ??
    table.getFilteredRowModel().rows.length;
  const groupCount = React.useMemo(() => {
    if (grouping.length === 0) return 0;
    const countGroups = (rows: Row<TData>[]) => {
      let count = 0;
      rows.forEach((row) => {
        if (row.getIsGrouped()) count += 1;
        if (row.subRows?.length) count += countGroups(row.subRows);
      });
      return count;
    };
    return countGroups(rowModel.rows);
  }, [grouping.length, rowModel.rows]);
  const getRowValue = React.useCallback(
    (row: Row<TData>, columnId: string) => row.getValue(columnId),
    [],
  );

  const getColumnHeader = React.useCallback(
    (columnId: string) => {
      const column = table.getColumn(columnId);
      if (!column) return columnId;
      const header = column.columnDef.header;
      return typeof header === "string" ? header : columnId;
    },
    [table],
  );

  const groupLabels = React.useMemo(() => {
    if (grouping.length === 0) return "";
    return grouping
      .map((columnId) => getColumnHeader(columnId))
      .filter(Boolean)
      .join(", ");
  }, [grouping, getColumnHeader]);

  const toCsvValue = React.useCallback((value: unknown) => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }, []);

  const getSelectedExportColumns = React.useCallback(() => {
    const left = table
      .getLeftLeafColumns()
      .map((column) => column.id)
      .filter((id) => id !== "actions");
    const right = table
      .getRightLeafColumns()
      .map((column) => column.id)
      .filter((id) => id !== "actions");
    const allVisible = visibleColumnIds.filter((id) => id !== "actions");
    const pinned = new Set([...left, ...right]);
    const center = allVisible.filter((id) => !pinned.has(id));
    return [...left, ...center, ...right];
  }, [table, visibleColumnIds]);

  const buildExportRows = React.useCallback(() => {
    const selectedColumns = getSelectedExportColumns();
    const headers = selectedColumns.map((columnId) =>
      getColumnHeader(columnId),
    );

    const collectRows = (items: Row<TData>[]) => {
      const result: string[][] = [];
      items.forEach((row) => {
        const values = selectedColumns.map((columnId, index) => {
          const value = getRowValue(row, columnId);
          const stringValue = toCsvValue(value ?? "");
          if (index === 0 && row.depth > 0) {
            return `${"  ".repeat(row.depth)}${stringValue}`;
          }
          return stringValue;
        });
        result.push(values);
        if (row.subRows?.length) {
          result.push(...collectRows(row.subRows));
        }
      });
      return result;
    };

    return { headers, rows: collectRows(rowModel.rows) };
  }, [
    getColumnHeader,
    getRowValue,
    getSelectedExportColumns,
    rowModel.rows,
    toCsvValue,
  ]);

  const buildPdfRows = React.useCallback(() => {
    const selectedColumns = getSelectedExportColumns();
    const headers = selectedColumns.map((columnId) =>
      getColumnHeader(columnId),
    );
    const columnHeaderMap = new Map(
      selectedColumns.map((columnId) => [columnId, getColumnHeader(columnId)]),
    );

    const collectRows = (items: Row<TData>[]) => {
      const result: {
        cells: string[];
        isGroup: boolean;
        depth: number;
        label?: string;
      }[] = [];

      items.forEach((row) => {
        const groupingColumnId = (row as any).groupingColumnId as
          | string
          | undefined;
        const isGroupRow = Boolean(groupingColumnId);
        if (isGroupRow && groupingColumnId) {
          const headerLabel =
            columnHeaderMap.get(groupingColumnId) ?? groupingColumnId;
          const value = String(getRowValue(row, groupingColumnId) ?? "");
          result.push({
            cells: [],
            isGroup: true,
            depth: row.depth,
            label: `${headerLabel}: ${value} (${row.subRows?.length ?? 0})`,
          });
        } else {
          result.push({
            cells: selectedColumns.map((columnId) =>
              String(getRowValue(row, columnId) ?? ""),
            ),
            isGroup: false,
            depth: row.depth,
          });
        }

        if (row.subRows?.length) {
          result.push(...collectRows(row.subRows));
        }
      });

      return result;
    };

    return { headers, rows: collectRows(rowModel.rows) };
  }, [getColumnHeader, getRowValue, getSelectedExportColumns, rowModel.rows]);

  const exportCsv = React.useCallback(() => {
    const { headers, rows } = buildExportRows();
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "customers.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [buildExportRows]);

  const exportPdf = React.useCallback(() => {
    const { headers, rows } = buildPdfRows();
    const html = `
      <html>
        <head>
          <title>Export</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            h1 { font-size: 18px; margin: 0 0 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            th { background-color: #eef2f7; }
            .group-row { font-weight: 600; }
            .group-0 { background-color: #e7effa; }
            .group-1 { background-color: #edf7f6; }
            .group-2 { background-color: #f6f3e9; }
            .group-label { padding-left: 8px; }
            @media print {
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <h1>Export</h1>
          <table>
            <thead>
              <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows
                .map((row) => {
                  if (row.isGroup) {
                    const level = Math.min(row.depth, 2);
                    const pad = 8 + row.depth * 12;
                    return `<tr class="group-row group-${level}">
                      <td class="group-label" style="padding-left:${pad}px;" colspan="${
                        headers.length
                      }">${row.label ?? ""}</td>
                    </tr>`;
                  }
                  return `<tr>${row.cells
                    .map((cell) => `<td>${cell}</td>`)
                    .join("")}</tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    const triggerPrint = () => {
      printWindow.focus();
      printWindow.print();
    };
    // Ensure styles are applied before printing
    if (printWindow.document.readyState === "complete") {
      setTimeout(triggerPrint, 50);
    } else {
      printWindow.onload = () => setTimeout(triggerPrint, 50);
    }
  }, [buildPdfRows]);

  const applyAdvancedFilter = () => {
    const validFilters = advancedFilters.filter(
      (filter) => filter.columnId && filter.value.trim() !== "",
    );
    if (!validFilters.length) {
      safeSetColumnFilters([]);
      return;
    }
    safeSetColumnFilters(
      validFilters.map((filter) => ({
        id: filter.columnId,
        value: filter,
      })),
    );
  };

  const clearAdvancedFilter = () => {
    safeSetAdvancedFilters((prev) =>
      prev.length ? prev.map((filter) => ({ ...filter, value: "" })) : prev,
    );
    safeSetColumnFilters([]);
  };

  const resetAll = () => {
    safeSetGlobalFilter("");
    clearAdvancedFilter();
    safeSetGrouping([]);
    safeSetColumnVisibility({});
    safeSetColumnPinning(DEFAULT_PINNING);
    safeSetPagination({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  };

  const getPinnedStyles = (column: Column<TData, unknown>) => {
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

  const ensureActionsLeft = React.useCallback((next: ColumnPinningState) => {
    return {
      left: ["actions", ...(next.left ?? []).filter((id) => id !== "actions")],
      right: (next.right ?? []).filter((id) => id !== "actions"),
    };
  }, []);

  const ColumnMenu = ({ column }: { column: Column<TData, unknown> }) => {
    const isActions = column.id === "actions";
    const pinLeft = () => {
      if (isActions) return;
      const current = table.getState().columnPinning.left ?? ["actions"];
      const withoutActions = current.filter((id) => id !== "actions");
      const next = withoutActions.includes(column.id)
        ? ["actions", ...withoutActions]
        : ["actions", ...withoutActions, column.id];
      table.setColumnPinning(
        ensureActionsLeft({
          left: next,
          right: table.getState().columnPinning.right ?? [],
        }),
      );
    };

    const pinRight = () => {
      if (isActions) return;
      const current = table.getState().columnPinning.right ?? [];
      const nextRight = current.includes(column.id) ? [] : [column.id];
      table.setColumnPinning(
        ensureActionsLeft({
          left: table.getState().columnPinning.left ?? ["actions"],
          right: nextRight,
        }),
      );
    };

    const unpin = () => {
      if (isActions) return;
      const left = (table.getState().columnPinning.left ?? ["actions"]).filter(
        (id) => id !== column.id,
      );
      const right = (table.getState().columnPinning.right ?? []).filter(
        (id) => id !== column.id,
      );
      table.setColumnPinning(ensureActionsLeft({ left, right }));
    };

    return (
      isActions ? (
        <span className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground">
          <GripVertical className="size-4" />
        </span>
      ) : (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => column.toggleSorting(false)}
            disabled={!column.getCanSort()}
          >
            <ArrowUpDown className="size-4" />
            Ordenar A-Z
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => column.toggleSorting(true)}
            disabled={!column.getCanSort()}
          >
            <ArrowUpDown className="size-4" />
            Ordenar Z-A
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={pinLeft} disabled={isActions}>
            <PinIcon className="size-4" />
            Fixar a esquerda
          </DropdownMenuItem>
          <DropdownMenuItem onClick={pinRight} disabled={isActions}>
            <PinIcon className="size-4" />
            Fixar a direita
          </DropdownMenuItem>
          <DropdownMenuItem onClick={unpin} disabled={isActions}>
            <PinOff className="size-4" />
            Soltar coluna
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      )
    );
  };

  const actionsNode = actions
    ? actions({
        visibleColumnIds,
        visibleColumns,
        rows: rowModel.rows,
        getRowValue,
        grouping,
        exportCsv,
        exportPdf,
      })
    : undefined;

  const exportMenuNode = showExportMenu ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={exportLabels?.title ?? "Exportar"}
          title={exportLabels?.title ?? "Exportar"}
        >
          <Printer className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={exportPdf}>
          {exportLabels?.pdf ?? "Baixar PDF"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={exportCsv}>
          {exportLabels?.csv ?? "Baixar CSV"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  const toolbarActions =
    exportMenuNode || actionsNode ? (
      <div className="flex flex-wrap items-center gap-2">
        {exportMenuNode}
        {actionsNode}
      </div>
    ) : undefined;

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-3">
      <DataTableToolbar
        globalFilter={globalFilter}
        searchPlaceholder={searchPlaceholder}
        onGlobalFilterChange={safeSetGlobalFilter}
        onOpenFilters={() => safeSetFiltersOpen((prev) => !prev)}
        actions={toolbarActions}
        rightContent={
          summaryCards ? (
            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded-md border border-border/40 bg-card/50 px-2.5 py-1.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {summaryCards.totalLabel ?? "Total"}
                </p>
                <p className="text-base font-semibold text-foreground">
                  {data.length}
                </p>
              </div>
              <div className="rounded-md border border-border/40 bg-card/50 px-2.5 py-1.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {summaryCards.filteredLabel ?? "Filtrados"}
                </p>
                <p className="text-base font-semibold text-foreground">
                  {filteredCount}
                </p>
              </div>
              <div className="rounded-md border border-border/40 bg-card/50 px-2.5 py-1.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {summaryCards.groupedLabel ?? "Grupos"}
                </p>
                <p
                  className="text-sm font-semibold text-foreground truncate"
                  title={groupLabels || undefined}
                >
                  {grouping.length > 0 ? groupCount : "-"}
                </p>
              </div>
            </div>
          ) : null
        }
      />


      <div className="space-y-2">
        <div className="rounded-xl border border-border/40 bg-card/40 max-w-full [&_[data-slot=table-container]]:max-h-[70vh] [&_[data-slot=table-container]]:max-w-full [&_[data-slot=table-container]]:overflow-auto">
          <Table className="min-w-[900px] sm:min-w-[1200px] md:min-w-[1600px] [&_th]:whitespace-normal [&_td]:whitespace-normal sm:[&_th]:whitespace-nowrap sm:[&_td]:whitespace-nowrap">
            <TableHeader className="bg-muted/20">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/20">
                  {headerGroup.headers.map((header) => {
                    const pinnedStyles = getPinnedStyles(header.column);
                    return (
                    <TableHead
                      key={header.id}
                      style={{
                        ...pinnedStyles,
                        top: 0,
                        position: "sticky",
                        zIndex: pinnedStyles ? 4 : 3,
                        background: pinnedStyles?.background ?? "var(--color-card)",
                      }}
                      className="relative"
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </span>
                          <ColumnMenu column={header.column} />
                        </div>
                      )}
                      {header.column.getCanResize() &&
                      header.column.id !== "actions" ? (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none"
                        />
                      ) : null}
                    </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/10"
                  >
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <TableCell
                          key={cell.id}
                          style={getPinnedStyles(cell.column)}
                        >
                          {cell.getIsGrouped() ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={row.getToggleExpandedHandler()}
                              >
                                {row.getIsExpanded() ? "-" : "+"}
                              </Button>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}{" "}
                              <span className="text-muted-foreground">
                                ({row.subRows.length})
                              </span>
                            </div>
                          ) : cell.getIsAggregated() ? (
                            flexRender(
                              cell.column.columnDef.aggregatedCell ??
                                cell.column.columnDef.cell,
                              cell.getContext(),
                            )
                          ) : cell.getIsPlaceholder() ? null : (
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="h-24 text-center"
                    colSpan={columns.length}
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>Click a header to sort the column.</p>
          {showPagination ? (
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
          ) : null}
        </div>
      </div>

      <DataTableFilterSheet
        open={filtersOpen}
        onOpenChange={safeSetFiltersOpen}
        onReset={resetAll}
        filterableColumns={filterableColumns}
        groupableColumns={groupable}
        visibleColumns={visibleColumns}
        chartRows={filteredRows}
        getRowValue={getRowValue}
        advancedFilters={advancedFilters}
        onAdvancedFiltersChange={safeSetAdvancedFilters}
        onApply={() => {
          applyAdvancedFilter();
          safeSetFiltersOpen(false);
        }}
        onClear={clearAdvancedFilter}
      />
    </div>
  );
}
