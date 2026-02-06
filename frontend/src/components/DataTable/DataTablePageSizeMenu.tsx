"use client";

import * as React from "react";
import { List } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PAGE_SIZE_OPTIONS } from "@/components/DataTable/constants";

type DataTablePageSizeMenuProps<TData> = {
  table: Table<TData>;
  disabled?: boolean;
};

export function DataTablePageSizeMenu<TData>({
  table,
  disabled = false,
}: DataTablePageSizeMenuProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          size="icon"
          aria-label="Linhas por pagina"
          title="Linhas por pagina"
          disabled={disabled}
        >
          <List className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Linhas por pagina</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={String(table.getState().pagination.pageSize)}
          onValueChange={(value) => {
            const nextSize = Number(value);
            table.setPageIndex(0);
            table.setPageSize(nextSize);
          }}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <DropdownMenuRadioItem key={size} value={String(size)}>
              {size}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

