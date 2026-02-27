"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { ListView } from "@/web-client/views/ListView";
import { KanbanView } from "@/web-client/views/KanbanView";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PantryDashboardResponse } from "@/modules/pantry/api";

type StockRow = PantryDashboardResponse["stockRows"][number];

type PantryOverviewStockSectionProps = {
  rows: StockRow[];
  columns: ColumnDef<StockRow>[];
  view?: "list" | "kanban";
  groupBy?: string[];
  onRowClick: (row: StockRow) => void;
  rowActions?: {
    id: string;
    label: string;
    destructive?: boolean;
    onSelect: (row: StockRow) => void;
  }[];
};

export function PantryOverviewStockSection({
  rows,
  columns,
  view = "list",
  groupBy = ["sector"],
  onRowClick,
  rowActions = [],
}: PantryOverviewStockSectionProps) {
  return (
    <div className="w-full">
      {view === "list" ? (
        <ListView
          data={rows}
          columns={columns}
          groupByFields={groupBy}
          resolveGroupLabel={(field, value) => {
            if (field === "isBelowMin") {
              return value ? "Abaixo do mínimo" : "OK";
            }
            if (field === "group") {
              const label = String(value ?? "").trim();
              return label ? label : "Sem grupo";
            }
            if (field === "sector") {
              const label = String(value ?? "").trim();
              return label ? label : "Geral";
            }
            if (field === "validityStatus") {
              const label = String(value ?? "").trim();
              return label ? label : "Sem validade";
            }
            const label = String(value ?? "").trim();
            return label ? label : "Sem valor";
          }}
          getRowId={(row) => `${row.itemId}:${row.sector}`}
          onRowClick={onRowClick}
        />
      ) : (
        <KanbanView
          items={rows}
          getColumnKey={(row) => {
            const field = groupBy[0] ?? null;
            if (!field) return "Todos";
            if (field === "group") return row.group?.trim() || "Sem grupo";
            if (field === "validityStatus") return row.validityStatus;
            if (field === "isBelowMin") return row.isBelowMin ? "Abaixo do mínimo" : "OK";
            return row.sector?.trim() || "Geral";
          }}
          renderCard={(row) => (
            <div
              key={`${row.itemId}:${row.sector}`}
              role="button"
              tabIndex={0}
              onClick={() => onRowClick(row)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                onRowClick(row);
              }}
              className="group rounded-md border border-border/60 bg-background px-3 py-2 text-left hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {row.name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {row.sector}
                    {row.group ? ` • ${row.group}` : ""}
                  </div>
                </div>

                {rowActions.length ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Ações"
                        title="Ações"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      {rowActions.map((action) => (
                        <DropdownMenuItem
                          key={action.id}
                          onSelect={() => action.onSelect(row)}
                          className="text-xs"
                        >
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Saldo setor
                  </div>
                  <div className="font-mono tabular-nums text-foreground">
                    {row.sectorStock} {row.unit}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Saldo total
                  </div>
                  <div className="font-mono tabular-nums text-foreground">
                    {row.itemStock} {row.unit}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Próx. validade
                  </div>
                  <div className="font-mono tabular-nums text-foreground">
                    {row.nextExpiryDate ?? "-"}
                  </div>
                </div>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}

