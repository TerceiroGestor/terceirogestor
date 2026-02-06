"use client";

import * as React from "react";
import type {
  Column,
  ColumnPinningState,
  Table,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  GripVertical,
  MoreHorizontal,
  PinIcon,
  PinOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdvancedFilter } from "@/components/DataTable/DataTableFilterSheetFilters";
import { ensureActionsLeft } from "@/components/DataTable/utils";

type QuickFilterOption = {
  value: string;
  label: string;
  count: number;
};

type DataTableColumnMenuProps<TData> = {
  column: Column<TData, unknown>;
  table: Table<TData>;
  advancedFilters: AdvancedFilter[];
  quickFilterOptions: QuickFilterOption[];
  onApplyQuickFilter: (columnId: string, value: string) => void;
  onClearQuickFilter: (columnId: string) => void;
};

export function DataTableColumnMenu<TData>({
  column,
  table,
  advancedFilters,
  quickFilterOptions,
  onApplyQuickFilter,
  onClearQuickFilter,
}: DataTableColumnMenuProps<TData>) {
  const isActions = column.id === "actions";
  const canGroup = !isActions && column.getCanGroup?.();
  const isGrouped = column.getIsGrouped();
  const activeQuickFilter = advancedFilters.find(
    (filter) => filter.columnId === column.id && filter.value.trim() !== "",
  );

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
      } as ColumnPinningState),
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
      } as ColumnPinningState),
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

  if (isActions) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground">
        <GripVertical className="size-4" />
      </span>
    );
  }

  return (
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
        {column.getCanFilter() && quickFilterOptions.length ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Filtro rapido</DropdownMenuSubTrigger>
              <DropdownMenuSubContent alignOffset={-4}>
                {quickFilterOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onApplyQuickFilter(column.id, option.value)}
                  >
                    {option.label}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {option.count}
                    </span>
                  </DropdownMenuItem>
                ))}
                {activeQuickFilter ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onClearQuickFilter(column.id)}>
                      Limpar filtro
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : null}
        {canGroup ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Agrupar rapido</DropdownMenuSubTrigger>
              <DropdownMenuSubContent alignOffset={-4}>
                <DropdownMenuItem onClick={() => column.toggleGrouping()}>
                  {isGrouped ? "Desagrupar coluna" : "Agrupar por esta coluna"}
                </DropdownMenuItem>
                {table.getState().grouping.length ? (
                  <DropdownMenuItem onClick={() => table.setGrouping([])}>
                    Limpar agrupamentos
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : null}
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
  );
}

