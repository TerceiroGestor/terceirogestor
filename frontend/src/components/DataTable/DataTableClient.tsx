"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Column,
  type ExpandedState,
  type FilterFn,
  type GroupingState,
  type SortingState,
  type VisibilityState,
  type ColumnPinningState,
  type PaginationState,
  type RowSelectionState,
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
import { Printer } from "lucide-react";
import clsx from "clsx";
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
import { DataTableColumnMenu } from "@/components/DataTable/DataTableColumnMenu";
import { DataTablePagination } from "@/components/DataTable/DataTablePagination";
import { DataTablePageSizeMenu } from "@/components/DataTable/DataTablePageSizeMenu";
import { Button } from "@/components/ui/button";
import { DataTableActionMenu } from "@/components/DataTable/DataTableActionMenu";
import type { AdvancedFilter } from "@/components/DataTable/DataTableFilterSheetFilters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSafeSetters } from "@/components/DataTable/hooks/useSafeSetters";
import { useDataTableExport } from "@/components/DataTable/hooks/useDataTableExport";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PINNING,
} from "@/components/DataTable/constants";
import {
  getInitialFilterColumnId,
  getPinnedStyles,
} from "@/components/DataTable/utils";
import { Checkbox } from "@/components/ui/checkbox";

export type DataTableClientProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  initialColumnPinning?: ColumnPinningState;
  searchPlaceholder?: string;
  groupableColumns?: string[];
  manualPagination?: boolean;
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: (next: PaginationState) => void;
  onGlobalFilterChange?: (value: string) => void;
  onAdvancedFiltersApply?: (filters: AdvancedFilter[]) => void;
  onGroupingChange?: (grouping: string[]) => void;
  onChartOpenChange?: (open: boolean) => void;
  totalCount?: number;
  tableClassName?: string;
  onSelectedRowsChange?: (rows: TData[]) => void;
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
  exportMeta?: {
    title?: string;
    subtitle?: string;
    tenant?: string;
    issuedBy?: string;
    issuedAt?: string;
  };
  enableRowSelection?: boolean;
  actions?: (ctx: {
    visibleColumnIds: string[];
    visibleColumns: Column<TData, unknown>[];
    rows: Row<TData>[];
    getRowValue: (row: Row<TData>, columnId: string) => unknown;
    grouping: string[];
    exportCsv: () => void;
    exportPdf: () => void;
  }) => React.ReactNode;
  onRowClick?: (row: TData) => void;
};


export function DataTableClient<TData>({
  columns,
  data,
  initialColumnPinning,
  searchPlaceholder = "Search...",
  groupableColumns = [],
  rowActions = [],
  summaryCards,
  showExportMenu = false,
  exportLabels,
  exportMeta,
  enableRowSelection = false,
  actions,
  onRowClick,
  manualPagination = false,
  pageCount,
  pagination: paginationProp,
  onPaginationChange,
  onGlobalFilterChange,
  onAdvancedFiltersApply,
  onGroupingChange,
  onChartOpenChange,
  totalCount,
  tableClassName,
  onSelectedRowsChange,
}: DataTableClientProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [grouping, setGrouping] = React.useState<GroupingState>([]);
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(
    initialColumnPinning ?? DEFAULT_PINNING,
  );
  const [pagination, setPagination] = React.useState<PaginationState>(
    paginationProp ?? {
      pageIndex: 0,
      pageSize: DEFAULT_PAGE_SIZE,
    },
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
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
    safeSetExpanded,
    safeSetColumnVisibility,
    safeSetColumnPinning,
    safeSetPagination,
    safeSetRowSelection,
    safeSetAdvancedFilters,
    safeSetFiltersOpen,
  } = useSafeSetters<AdvancedFilter>({
    setSorting,
    setGlobalFilter,
    setColumnFilters,
    setGrouping,
    setExpanded,
    setColumnVisibility,
    setColumnPinning,
    setPagination,
    setRowSelection,
    setAdvancedFilters,
    setFiltersOpen,
  });

  React.useEffect(() => {
    if (enableRowSelection) return;
    safeSetRowSelection({});
  }, [enableRowSelection, safeSetRowSelection]);

  React.useEffect(() => {
    if (!paginationProp) return;
    safeSetPagination(paginationProp);
  }, [paginationProp, safeSetPagination]);

  React.useEffect(() => {
    if (onGroupingChange) {
      onGroupingChange(grouping);
    }
  }, [grouping, onGroupingChange]);

  React.useEffect(() => {
    if (!mountedRef.current) return;
    if (manualPagination) return;
    if (grouping.length > 0) {
      const fullSize = Math.max(data.length, 1);
      if (pagination.pageSize !== fullSize || pagination.pageIndex !== 0) {
        safeSetPagination({ pageIndex: 0, pageSize: fullSize });
      }
      return;
    }
    if (
      pagination.pageSize !== DEFAULT_PAGE_SIZE &&
      data.length >= DEFAULT_PAGE_SIZE
    ) {
      safeSetPagination((prev) => ({ ...prev, pageSize: DEFAULT_PAGE_SIZE }));
    }
  }, [
    data.length,
    grouping.length,
    manualPagination,
    pagination.pageIndex,
    pagination.pageSize,
    safeSetPagination,
  ]);

  const filterFn = React.useCallback<FilterFn<TData>>(
    (row, columnId, filterValue) => {
      const typedFilter = filterValue as AdvancedFilter | undefined;
      if (!typedFilter) return true;
      const rawValue = row.getValue(columnId);
      const operator = typedFilter.operator;
      const filterRaw = typedFilter.value.trim();

      const parseDate = (value: unknown) => {
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          return value;
        }
        if (typeof value === "string") {
          if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
          const parsed = new Date(value);
          return Number.isNaN(parsed.getTime()) ? null : parsed;
        }
        return null;
      };

      const parseNumber = (value: unknown) => {
        if (typeof value === "number" && !Number.isNaN(value)) return value;
        if (typeof value === "string") {
          const parsed = Number(value);
          return Number.isNaN(parsed) ? null : parsed;
        }
        return null;
      };

      if (operator === "isEmpty") {
        if (Array.isArray(rawValue)) {
          return rawValue.length === 0;
        }
        return rawValue === undefined || rawValue === null || rawValue === "";
      }
      if (operator === "isNotEmpty") {
        if (Array.isArray(rawValue)) {
          return rawValue.length > 0;
        }
        return !(rawValue === undefined || rawValue === null || rawValue === "");
      }
      if (filterRaw === "") return true;
      if (rawValue === undefined || rawValue === null) return false;

      if (Array.isArray(rawValue)) {
        const normalizedValues = rawValue
          .map((item) => String(item).trim().toLowerCase())
          .filter(Boolean);
        const filterLower = filterRaw.toLowerCase();

        if (operator === "contains") {
          return normalizedValues.some((value) => value.includes(filterLower));
        }
        if (operator === "equals") {
          return normalizedValues.includes(filterLower);
        }
        if (operator === "in" || operator === "notIn") {
          const values = filterRaw
            .split(",")
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean);
          const match = normalizedValues.some((value) =>
            values.includes(value),
          );
          return operator === "in" ? match : !match;
        }
        if (operator === "starts") {
          return normalizedValues.some((value) =>
            value.startsWith(filterLower),
          );
        }
        if (operator === "ends") {
          return normalizedValues.some((value) =>
            value.endsWith(filterLower),
          );
        }

        return true;
      }

      const rowValue =
        typeof rawValue === "number"
          ? rawValue
          : String(rawValue).toLowerCase();

      if (operator === "contains") {
        return String(rowValue).includes(filterRaw.toLowerCase());
      }

      if (operator === "equals") {
        const rowDate = parseDate(rawValue);
        const filterDate = parseDate(filterRaw);
        if (rowDate && filterDate) {
          return rowDate.getTime() === filterDate.getTime();
        }
        const rowNumber = parseNumber(rawValue);
        const filterNumber = parseNumber(filterRaw);
        if (rowNumber !== null && filterNumber !== null) {
          return rowNumber === filterNumber;
        }
        return String(rowValue) === filterRaw.toLowerCase();
      }

      if (operator === "in" || operator === "notIn") {
        const values = filterRaw
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);
        const match = values.includes(String(rowValue).toLowerCase());
        return operator === "in" ? match : !match;
      }

      if (operator === "between") {
        const [startRaw, endRaw] = filterRaw
          .split("..")
          .flatMap((part) => part.split(","))
          .map((value) => value.trim())
          .filter(Boolean);
        if (!startRaw || !endRaw) return true;
        const rowDate = parseDate(rawValue);
        const startDate = parseDate(startRaw);
        const endDate = parseDate(endRaw);
        if (rowDate && startDate && endDate) {
          return (
            rowDate.getTime() >= startDate.getTime() &&
            rowDate.getTime() <= endDate.getTime()
          );
        }
        const rowNumber = parseNumber(rawValue);
        const startNumber = parseNumber(startRaw);
        const endNumber = parseNumber(endRaw);
        if (
          rowNumber === null ||
          startNumber === null ||
          endNumber === null
        ) {
          return true;
        }
        return rowNumber >= startNumber && rowNumber <= endNumber;
      }

      if (operator === "starts") {
        return String(rowValue).startsWith(filterRaw.toLowerCase());
      }

      if (operator === "ends") {
        return String(rowValue).endsWith(filterRaw.toLowerCase());
      }

      const rowDate = parseDate(rawValue);
      const filterDate = parseDate(filterRaw);
      if (rowDate && filterDate) {
        const rowTime = rowDate.getTime();
        const filterTime = filterDate.getTime();
        if (operator === "gt") return rowTime > filterTime;
        if (operator === "gte") return rowTime >= filterTime;
        if (operator === "lte") return rowTime <= filterTime;
        return rowTime < filterTime;
      }

      const rowNumber = parseNumber(rawValue);
      const filterNumber = parseNumber(filterRaw);
      if (rowNumber === null || filterNumber === null) {
        return false;
      }
      if (operator === "gt") return rowNumber > filterNumber;
      if (operator === "gte") return rowNumber >= filterNumber;
      if (operator === "lte") return rowNumber <= filterNumber;
      return rowNumber < filterNumber;
    },
    [],
  );

  const handleGlobalFilterChange = React.useCallback(
    (value: string) => {
      safeSetGlobalFilter(value);
      onGlobalFilterChange?.(value);
    },
    [onGlobalFilterChange, safeSetGlobalFilter],
  );

  const columnsWithFilter = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    const withFilter = columns.map((column) => ({
      ...column,
      filterFn,
    }));

    const withSelection =
      enableRowSelection && !withFilter.some((column) => column.id === "__select")
        ? ([
            {
              id: "__select",
              header: ({ table }) => (
                <Checkbox
                  checked={table.getIsAllPageRowsSelected()}
                  onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(Boolean(value))
                  }
                  aria-label="Selecionar todos"
                />
              ),
              cell: ({ row }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
                  aria-label="Selecionar linha"
                />
              ),
              enableSorting: false,
              enableHiding: false,
              size: 44,
              minSize: 44,
              maxSize: 44,
            } as ColumnDef<TData, unknown>,
            ...withFilter,
          ] as ColumnDef<TData, unknown>[])
        : withFilter;

    const hasActionsColumn = withFilter.some(
      (column) => column.id === "actions",
    );
    if (!rowActions.length || hasActionsColumn) return withSelection;

    return [
      ...withSelection,
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
      } as ColumnDef<TData, unknown>,
    ];
  }, [columns, filterFn, rowActions, enableRowSelection]);

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
      expanded,
      columnVisibility,
      columnPinning,
      pagination: paginationProp ?? pagination,
      rowSelection,
    },
    onSortingChange: safeSetSorting,
    onColumnFiltersChange: safeSetColumnFilters,
    onGroupingChange: safeSetGrouping,
    onExpandedChange: safeSetExpanded,
    onColumnVisibilityChange: safeSetColumnVisibility,
    onColumnPinningChange: safeSetColumnPinning,
    onRowSelectionChange: safeSetRowSelection,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater(paginationProp ?? pagination)
          : updater;
      safeSetPagination(next);
      onPaginationChange?.(next);
    },
    manualPagination,
    pageCount,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    enableRowSelection,
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel:
      grouping.length || manualPagination ? undefined : getPaginationRowModel(),
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
  const rowModel = grouping.length
    ? table.getExpandedRowModel()
    : table.getRowModel();
  const selectedRowModel = table.getSelectedRowModel();
  const exportRowModel =
    enableRowSelection && selectedRowModel.rows.length ? selectedRowModel : rowModel;

  React.useEffect(() => {
    if (!onSelectedRowsChange) return;
    if (!enableRowSelection) return;
    const selected = table
      .getSelectedRowModel()
      .rows.map((row) => row.original as TData);
    onSelectedRowsChange(selected);
  }, [enableRowSelection, onSelectedRowsChange, rowSelection, data]);
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

  const { exportCsv, exportPdf, getColumnHeader } = useDataTableExport({
    table,
    rowModel: exportRowModel,
    visibleColumnIds,
    getRowValue,
    exportMeta,
  });

  const groupLabels = React.useMemo(() => {
    if (grouping.length === 0) return "";
    return grouping
      .map((columnId) => getColumnHeader(columnId))
      .filter(Boolean)
      .join(", ");
  }, [grouping, getColumnHeader]);

  const applyAdvancedFilter = () => {
    const validFilters = advancedFilters.filter((filter) => {
      if (!filter.columnId) return false;
      if (filter.operator === "isEmpty" || filter.operator === "isNotEmpty") {
        return true;
      }
      if (filter.operator === "between") {
        const [startRaw, endRaw] = filter.value
          .split("..")
          .flatMap((part) => part.split(","))
          .map((value) => value.trim())
          .filter(Boolean);
        return Boolean(startRaw && endRaw);
      }
      return filter.value.trim() !== "";
    });
    if (!validFilters.length) {
      safeSetColumnFilters([]);
      onAdvancedFiltersApply?.([]);
      return;
    }
    safeSetColumnFilters(
      validFilters.map((filter) => ({
        id: filter.columnId,
        value: filter,
      })),
    );
    onAdvancedFiltersApply?.(validFilters);
  };

  const clearAdvancedFilter = () => {
    safeSetAdvancedFilters((prev) =>
      prev.length ? prev.map((filter) => ({ ...filter, value: "" })) : prev,
    );
    safeSetColumnFilters([]);
    onAdvancedFiltersApply?.([]);
  };

  const resetAll = () => {
    safeSetGlobalFilter("");
    onGlobalFilterChange?.("");
    clearAdvancedFilter();
    safeSetGrouping([]);
    safeSetExpanded({});
    safeSetColumnVisibility({});
    safeSetColumnPinning(DEFAULT_PINNING);
    safeSetPagination({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  };

  const buildQuickFilterOptions = React.useCallback(
    (columnId: string) => {
      const column = table.getColumn(columnId);
      const meta = column?.columnDef.meta as
        | { valueMap?: Record<string, string>; dataType?: string }
        | undefined;
      const labelFor = (value: string) => {
        if (meta?.dataType === "boolean") {
          if (value.toLowerCase() === "true") return "Sim";
          if (value.toLowerCase() === "false") return "Nao";
        }
        return meta?.valueMap?.[value] ?? value;
      };
      const counts = new Map<string, number>();
      let nonEmptyCount = 0;
      let emptyCount = 0;
      table.getPreFilteredRowModel().rows.forEach((row) => {
        const value = row.getValue(columnId);
        if (value === undefined || value === null || value === "") {
          emptyCount += 1;
          return;
        }
        if (Array.isArray(value)) {
          if (value.length) nonEmptyCount += 1;
          else emptyCount += 1;
          value
            .map((item) => String(item).trim())
            .filter(Boolean)
            .forEach((item) => {
              counts.set(item, (counts.get(item) ?? 0) + 1);
            });
          return;
        }
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
              const parsed = JSON.parse(trimmed);
               if (Array.isArray(parsed)) {
                 if (parsed.length) nonEmptyCount += 1;
                 else emptyCount += 1;
                 parsed
                   .map((item) => String(item).trim())
                   .filter(Boolean)
                   .forEach((item) => {
                     counts.set(item, (counts.get(item) ?? 0) + 1);
                  });
                return;
              }
            } catch {
              // fallthrough
            }
          }
          if (trimmed.includes(",")) {
            const parts = trimmed
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);
            if (parts.length) nonEmptyCount += 1;
            trimmed
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
              .forEach((item) => {
                counts.set(item, (counts.get(item) ?? 0) + 1);
              });
            return;
          }
        }
        nonEmptyCount += 1;
        const key = String(value);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
      const options = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([value, count]) => ({
          value,
          label: labelFor(value),
          count,
        }));
      if (nonEmptyCount > 0) {
        options.unshift({
          value: "__not_empty__",
          label: "Com valor",
          count: nonEmptyCount,
        });
      }
      if (emptyCount > 0) {
        options.unshift({
          value: "__empty__",
          label: "Sem valor",
          count: emptyCount,
        });
      }
      return options;
    },
    [table],
  );

  const applyQuickFilter = React.useCallback(
    (columnId: string, value: string) => {
      const nextFilters: AdvancedFilter[] = [
        ...advancedFilters.filter((filter) => filter.columnId !== columnId),
        value === "__not_empty__"
          ? { columnId, operator: "isNotEmpty", value: "1" }
          : value === "__empty__"
            ? { columnId, operator: "isEmpty", value: "1" }
            : { columnId, operator: "equals", value },
      ];
      const validFilters = nextFilters.filter(
        (filter) => filter.columnId && filter.value.trim() !== "",
      );
      safeSetAdvancedFilters(nextFilters);
      safeSetColumnFilters(
        validFilters.map((filter) => ({
          id: filter.columnId,
          value: filter,
        })),
      );
      onAdvancedFiltersApply?.(validFilters);
    },
    [
      advancedFilters,
      onAdvancedFiltersApply,
      safeSetAdvancedFilters,
      safeSetColumnFilters,
    ],
  );

  const clearQuickFilter = React.useCallback(
    (columnId: string) => {
      const nextFilters = advancedFilters.filter(
        (filter) => filter.columnId !== columnId,
      );
      const validFilters = nextFilters.filter(
        (filter) => filter.columnId && filter.value.trim() !== "",
      );
      safeSetAdvancedFilters(nextFilters);
      safeSetColumnFilters(
        validFilters.map((filter) => ({
          id: filter.columnId,
          value: filter,
        })),
      );
      onAdvancedFiltersApply?.(validFilters);
    },
    [
      advancedFilters,
      onAdvancedFiltersApply,
      safeSetAdvancedFilters,
      safeSetColumnFilters,
    ],
  );

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

  const handleRowClick = React.useCallback(
    (row: Row<TData>) => (event: React.MouseEvent<HTMLTableRowElement>) => {
      if (!onRowClick) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "button, a, input, textarea, select, [role='button'], [data-dt-stop-row-click]",
        )
      ) {
        return;
      }
      onRowClick(row.original as TData);
    },
    [onRowClick],
  );

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

  const pageSizeMenuNode = showPagination ? (
    <DataTablePageSizeMenu table={table} />
  ) : null;

  const toolbarActions =
    pageSizeMenuNode || exportMenuNode || actionsNode ? (
      <div className="flex flex-wrap items-center gap-2">
        {pageSizeMenuNode}
        {exportMenuNode}
        {actionsNode}
      </div>
    ) : undefined;

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-3">
      <DataTableToolbar
        globalFilter={globalFilter}
        searchPlaceholder={searchPlaceholder}
        onGlobalFilterChange={handleGlobalFilterChange}
        onOpenFilters={() => safeSetFiltersOpen((prev) => !prev)}
        actions={toolbarActions}
        rightContent={
          summaryCards ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-1.5">
              <div className="rounded-md border border-border/40 bg-card/50 px-2.5 py-1.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {summaryCards.totalLabel ?? "Total"}
                </p>
                <p className="text-base font-semibold text-foreground">
                  {totalCount ?? data.length}
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
          <Table
            className={clsx(
              "min-w-full [&_th]:whitespace-normal [&_td]:whitespace-normal sm:[&_th]:whitespace-nowrap sm:[&_td]:whitespace-nowrap",
              tableClassName,
            )}
          >
            <TableHeader className="bg-muted/20">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/20">
                  {headerGroup.headers.map((header) => {
                    const pinnedStyles = getPinnedStyles(header.column, table);
                    return (
                      <TableHead
                        key={header.id}
                        style={{
                          ...pinnedStyles,
                          top: 0,
                          position: "sticky",
                          zIndex: pinnedStyles ? 4 : 3,
                          background:
                            pinnedStyles?.background ?? "var(--color-card)",
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
                            <DataTableColumnMenu
                              column={header.column}
                              table={table}
                              advancedFilters={advancedFilters}
                              quickFilterOptions={buildQuickFilterOptions(
                                header.column.id,
                              )}
                              onApplyQuickFilter={applyQuickFilter}
                              onClearQuickFilter={clearQuickFilter}
                            />
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
                    className={`hover:bg-muted/10${onRowClick ? " cursor-pointer" : ""}`}
                    onClick={onRowClick ? handleRowClick(row) : undefined}
                  >
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <TableCell
                          key={cell.id}
                          style={getPinnedStyles(cell.column, table)}
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
                    colSpan={table.getVisibleLeafColumns().length}
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} showPagination={showPagination} />
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
        onChartOpenChange={onChartOpenChange}
      />
    </div>
  );
}
