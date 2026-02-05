"use client";

import * as React from "react";
import type { Column } from "@tanstack/react-table";
import { GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type GroupItem<TData> = {
  label: string;
  columnId?: string;
  onSelect?: () => void;
};

type DataTableGroupMenuProps<TData> = {
  groupable: Column<TData, unknown>[];
  items?: GroupItem<TData>[];
};

export function DataTableGroupMenu<TData>({
  groupable,
  items = [],
}: DataTableGroupMenuProps<TData>) {
  const groupableMap = React.useMemo(
    () =>
      Object.fromEntries(
        groupable.map((column) => [column.id, column]),
      ) as Record<string, Column<TData, unknown>>,
    [groupable],
  );

  const normalizedItems: GroupItem<TData>[] = items.length
    ? items
    : groupable.map((column) => ({
        label: `Group by ${String(column.columnDef.header ?? column.id)}`,
        columnId: column.id,
      }));

  const clearItem: GroupItem<TData> = {
    label: "Clear grouping",
    onSelect: () => {
      groupable.forEach((column) => {
        if (column.getIsGrouped()) {
          column.toggleGrouping();
        }
      });
    },
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <GripVertical className="mr-2 size-4" />
          Group
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Group by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {groupable.length ? (
            normalizedItems.map((item) => {
              const column = item.columnId
                ? groupableMap[item.columnId]
                : undefined;
              if (item.columnId && !column) return null;
              const isGrouped = column ? column.getIsGrouped() : false;

              return (
                <DropdownMenuCheckboxItem
                  key={item.label}
                  checked={isGrouped}
                  onCheckedChange={() => {
                    if (item.onSelect) {
                      item.onSelect();
                      return;
                    }
                    if (column) {
                      column.toggleGrouping();
                    }
                  }}
                >
                  {item.label}
                </DropdownMenuCheckboxItem>
              );
            })
          ) : (
            <DropdownMenuCheckboxItem checked={false} disabled>
              No groupable columns
            </DropdownMenuCheckboxItem>
          )}
        </DropdownMenuGroup>
        {groupable.length ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={clearItem.onSelect}
            >
              {clearItem.label}
            </DropdownMenuCheckboxItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
