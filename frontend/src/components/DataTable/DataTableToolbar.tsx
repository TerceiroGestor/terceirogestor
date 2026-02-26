"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings2 } from "lucide-react";

type DataTableToolbarProps = {
  globalFilter: string;
  searchPlaceholder: string;
  onGlobalFilterChange: (value: string) => void;
  onOpenFilters: () => void;
  actions?: ReactNode;
  rightContent?: ReactNode;
  hideSearch?: boolean;
  hideFiltersButton?: boolean;
};

export function DataTableToolbar({
  globalFilter,
  searchPlaceholder,
  onGlobalFilterChange,
  onOpenFilters,
  actions,
  rightContent,
  hideSearch = false,
  hideFiltersButton = false,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {hideFiltersButton ? null : (
          <Button variant="outline" size="icon" onClick={onOpenFilters}>
            <Settings2 className="size-4" />
          </Button>
        )}
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        {hideSearch ? null : (
          <Input
            value={globalFilter}
            onChange={(event) => onGlobalFilterChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full sm:w-[280px] lg:max-w-sm"
          />
        )}
      </div>
      {rightContent ? (
        <div className="flex items-center justify-end">{rightContent}</div>
      ) : null}
    </div>
  );
}
