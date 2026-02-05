"use client";

import * as React from "react";
import type { Column, Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AdvancedFilter,
  DataTableFilterSheetFilters,
} from "@/components/DataTable/DataTableFilterSheetFilters";
import { DataTableFilterSheetColumns } from "@/components/DataTable/DataTableFilterSheetColumns";
import { DataTableFilterSheetGroups } from "@/components/DataTable/DataTableFilterSheetGroups";
import {
  DataTableChartDialog,
  DataTableFilterSheetChartSection,
  useChartState,
} from "@/components/DataTable/DataTableFilterSheetChart";

type DataTableFilterSheetProps<TData> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: () => void;
  filterableColumns: Column<TData, unknown>[];
  groupableColumns: Column<TData, unknown>[];
  visibleColumns: Column<TData, unknown>[];
  chartRows: Row<TData>[];
  getRowValue: (row: Row<TData>, columnId: string) => unknown;
  advancedFilters: AdvancedFilter[];
  onAdvancedFiltersChange: (next: AdvancedFilter[]) => void;
  onApply: () => void;
  onClear: () => void;
};

export function DataTableFilterSheet<TData>({
  open,
  onOpenChange,
  onReset,
  filterableColumns,
  groupableColumns,
  visibleColumns,
  chartRows,
  getRowValue,
  advancedFilters,
  onAdvancedFiltersChange,
  onApply,
  onClear,
}: DataTableFilterSheetProps<TData>) {
  const [openSection, setOpenSection] = React.useState<
    "columns" | "groups" | "filters" | "chart" | null
  >(null);
  const visibleColumnOptions = React.useMemo(
    () => visibleColumns.filter((column) => column.id !== "actions"),
    [visibleColumns],
  );
  const chart = useChartState({
    columns: filterableColumns,
    rows: chartRows,
    getRowValue,
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full max-w-sm p-0">
          <SheetHeader className="border-b border-border py-3">
            <SheetTitle className="text-base">Ferramentas</SheetTitle>
            <SheetDescription className="text-xs">
              Gerencie filtros, agrupamentos e colunas.
            </SheetDescription>
          </SheetHeader>

          <div className="p-3 overflow-y-auto max-h-[calc(100svh-120px)]">
            <div className="space-y-2">
              <DataTableFilterSheetColumns
                open={openSection === "columns"}
                onToggle={() =>
                  setOpenSection((prev) =>
                    prev === "columns" ? null : "columns",
                  )
                }
                columns={visibleColumnOptions}
              />

              <DataTableFilterSheetGroups
                open={openSection === "groups"}
                onToggle={() =>
                  setOpenSection((prev) =>
                    prev === "groups" ? null : "groups",
                  )
                }
                columns={groupableColumns}
              />

              <DataTableFilterSheetFilters
                open={openSection === "filters"}
                onToggle={() =>
                  setOpenSection((prev) =>
                    prev === "filters" ? null : "filters",
                  )
                }
                columns={filterableColumns}
                advancedFilters={advancedFilters}
                onAdvancedFiltersChange={onAdvancedFiltersChange}
              />

              <DataTableFilterSheetChartSection
                open={openSection === "chart"}
                onToggle={() =>
                  setOpenSection((prev) => (prev === "chart" ? null : "chart"))
                }
                chart={chart}
                onOpenChart={() => {
                  chart.setChartOpen(true);
                  onOpenChange(false);
                }}
              />
            </div>
          </div>

          <div className="border-t border-border px-3 py-2">
            <div className="flex w-full items-center gap-2">
              <Button className="flex-1 h-8 text-xs" onClick={onApply}>
                Aplicar filtros
              </Button>
              <Button
                className="flex-1 h-8 text-xs"
                variant="outline"
                onClick={onClear}
              >
                Limpar
              </Button>
              <Button
                className="flex-1 h-8 text-xs"
                variant="ghost"
                onClick={onReset}
              >
                Restaurar padrao
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <DataTableChartDialog chart={chart} />
    </>
  );
}
