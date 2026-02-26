"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PaginationBar({
  pageIndex,
  pageCount,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  disabled = false,
}: {
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  onPageIndexChange: (next: number) => void;
  onPageSizeChange: (next: number) => void;
  disabled?: boolean;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/10 px-3 py-2 text-xs">
      <div className="text-muted-foreground">
        Página{" "}
        <span className="font-mono tabular-nums text-foreground">{pageIndex + 1}</span>{" "}
        de <span className="font-mono tabular-nums text-foreground">{pageCount}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onPageIndexChange(Math.max(0, pageIndex - 1))}
          disabled={disabled || pageIndex <= 0}
        >
          Anterior
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onPageIndexChange(Math.min(pageCount - 1, pageIndex + 1))}
          disabled={disabled || pageIndex + 1 >= pageCount}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}

