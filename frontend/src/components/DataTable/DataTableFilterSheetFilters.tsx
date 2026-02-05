"use client";

import * as React from "react";
import type { Column } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdvancedFilter = {
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

const FILTER_OPERATORS: { value: AdvancedFilter["operator"]; label: string }[] =
  [
    { value: "equals", label: "= Igual" },
    { value: "contains", label: "Contem" },
    { value: "starts", label: "Comeca com" },
    { value: "ends", label: "Termina com" },
    { value: "gt", label: "Maior que" },
    { value: "gte", label: "Maior ou igual" },
    { value: "lt", label: "Menor que" },
    { value: "lte", label: "Menor ou igual" },
  ];

type DataTableFilterSheetFiltersProps<TData> = {
  open: boolean;
  onToggle: () => void;
  columns: Column<TData, unknown>[];
  advancedFilters: AdvancedFilter[];
  onAdvancedFiltersChange: (next: AdvancedFilter[]) => void;
};

export function DataTableFilterSheetFilters<TData>({
  open,
  onToggle,
  columns,
  advancedFilters,
  onAdvancedFiltersChange,
}: DataTableFilterSheetFiltersProps<TData>) {
  const columnLabel = React.useCallback(
    (column: Column<TData, unknown>) =>
      String(column.columnDef.header ?? column.id),
    [],
  );
  const selectedFilterColumnId =
    advancedFilters[0]?.columnId ?? columns[0]?.id ?? "";

  const addFilter = () => {
    const nextColumn = columns[0]?.id ?? "";
    onAdvancedFiltersChange([
      ...advancedFilters,
      { columnId: nextColumn, operator: "equals", value: "" },
    ]);
  };

  const updateFilter = (index: number, next: Partial<AdvancedFilter>) => {
    onAdvancedFiltersChange(
      advancedFilters.map((filter, i) =>
        i === index ? { ...filter, ...next } : filter,
      ),
    );
  };

  const removeFilter = (index: number) => {
    onAdvancedFiltersChange(advancedFilters.filter((_, i) => i !== index));
  };

  return (
    <details className="rounded-md border border-border" open={open}>
      <summary
        className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-medium"
        onClick={(event) => {
          event.preventDefault();
          onToggle();
        }}
      >
        Filtros
        <span className="text-[11px] text-muted-foreground">
          {advancedFilters.length}
        </span>
      </summary>
      <div className="border-t border-border px-3 pt-3 pb-0 max-h-56 overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium text-muted-foreground">
            Coluna alvo
          </label>
          <select
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs"
            value={selectedFilterColumnId}
            onChange={(event) => {
              const value = event.target.value;
              if (!advancedFilters.length) {
                onAdvancedFiltersChange([
                  { columnId: value, operator: "equals", value: "" },
                ]);
              } else {
                updateFilter(0, { columnId: value });
              }
            }}
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {columnLabel(column)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2.5">
          {advancedFilters.map((filter, index) => (
            <div key={`${filter.columnId}-${index}`} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Filtro {index + 1}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => removeFilter(index)}
                >
                  Remover
                </Button>
              </div>
              <select
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs"
                value={filter.columnId}
                onChange={(event) =>
                  updateFilter(index, { columnId: event.target.value })
                }
              >
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {columnLabel(column)}
                  </option>
                ))}
              </select>

              <select
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs"
                value={filter.operator}
                onChange={(event) =>
                  updateFilter(index, {
                    operator: event.target
                      .value as AdvancedFilter["operator"],
                  })
                }
              >
                {FILTER_OPERATORS.map((operator) => (
                  <option key={operator.value} value={operator.value}>
                    {operator.label}
                  </option>
                ))}
              </select>

              <Input
                value={filter.value}
                onChange={(event) =>
                  updateFilter(index, { value: event.target.value })
                }
                placeholder="Digite o valor"
                className="h-8 text-xs"
              />
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 -mx-3 mt-2 border-t border-border bg-background/95 px-3 py-2 backdrop-blur">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs w-full"
            onClick={addFilter}
          >
            Adicionar filtro
          </Button>
        </div>
      </div>
    </details>
  );
}
