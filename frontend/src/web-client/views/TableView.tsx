"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { ListView } from "@/web-client/views/ListView";

export function TableView<TData>({
  data,
  columns,
  onRowClick,
  className,
  getRowId,
}: {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  onRowClick?: (row: TData) => void;
  className?: string;
  getRowId?: (row: TData, index: number) => string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="min-w-[860px]">
        <ListView
          data={data}
          columns={columns}
          onRowClick={onRowClick}
          getRowId={getRowId}
        />
      </div>
    </div>
  );
}

