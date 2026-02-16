"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { PantryDashboardResponse } from "@/modules/pantry/api";
import { formatDate } from "@/modules/pantry/features/overview/domain/overview.helpers";

type StockRow = PantryDashboardResponse["stockRows"][number];

export const pantryOverviewStockColumns: ColumnDef<StockRow>[] = [
  {
    accessorKey: "name",
    header: "Alimento",
    cell: ({ row }) => (
      <span className="text-xs font-semibold text-foreground">
        {row.original.name}
      </span>
    ),
  },
  {
    id: "group",
    header: "Grupo",
    accessorFn: (row) => row.group ?? "Sem grupo",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.group || "Sem grupo"}
      </span>
    ),
  },
  {
    accessorKey: "sector",
    header: "Setor",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.original.sector}</span>
    ),
  },
  {
    accessorKey: "sectorStock",
    header: "Saldo setor",
    cell: ({ row }) => (
      <span className="text-xs font-mono tabular-nums text-foreground">
        {Number(row.original.sectorStock).toLocaleString("pt-BR")} {row.original.unit}
      </span>
    ),
  },
  {
    accessorKey: "itemStock",
    header: "Saldo total",
    cell: ({ row }) => (
      <span className="text-xs font-mono tabular-nums text-foreground">
        {Number(row.original.itemStock).toLocaleString("pt-BR")} {row.original.unit}
      </span>
    ),
  },
  {
    id: "alerts",
    header: "Alertas",
    accessorFn: (row) => (row.isBelowMin ? "Abaixo do mínimo" : "OK"),
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center gap-2">
        {row.original.isBelowMin ? (
          <Badge variant="destructive">Abaixo do mínimo</Badge>
        ) : (
          <Badge variant="secondary">OK</Badge>
        )}
        <span className="text-[11px] text-muted-foreground">
          Mínimo: {Number(row.original.minStock).toLocaleString("pt-BR")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "nextExpiryDate",
    header: "Próx. validade",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatDate(row.original.nextExpiryDate)}
      </span>
    ),
  },
];
