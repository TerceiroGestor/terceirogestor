"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { DataTable } from "@/components/DataTable";
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
  view?: "table" | "cards";
  onlyLowStock: boolean;
  onToggleOnlyLowStock: () => void;
  headerActionsSlot?: React.ReactNode;
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
  view = "table",
  onlyLowStock,
  onToggleOnlyLowStock,
  headerActionsSlot,
  onRowClick,
  rowActions = [],
}: PantryOverviewStockSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Estoque
          </div>
          <div className="text-[11px] text-muted-foreground">
            Visão física do estoque com alertas de mínimo.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={onlyLowStock ? "default" : "outline"}
            onClick={onToggleOnlyLowStock}
            className="h-8"
          >
            Baixo estoque
          </Button>
          {headerActionsSlot}
        </div>
      </div>

      {view === "table" ? (
        <DataTable
          columns={columns}
          data={rows}
          initialColumnPinning={{
            left: ["actions", "name"],
            right: ["nextExpiryDate"],
          }}
          toolbar={{ hideSearch: true }}
          searchPlaceholder="Pesquisar estoque"
          summaryCards={{
            totalLabel: "Total",
            filteredLabel: "Filtrados",
          }}
          showExportMenu
          exportLabels={{
            title: "Relatório",
            pdf: "Imprimir (PDF)",
            csv: "Baixar CSV",
          }}
          exportMeta={{ title: "Despensa - Estoque por setor" }}
          onRowClick={onRowClick}
          rowActions={rowActions}
        />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
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
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{row.name}</div>
                    <span
                      className={
                        row.isBelowMin
                          ? "rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive"
                          : "rounded bg-muted/40 px-1.5 py-0.5 text-[10px] font-semibold text-foreground"
                      }
                    >
                      {row.isBelowMin ? "BAIXO" : "OK"}
                    </span>
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
          ))}
        </div>
      )}
    </div>
  );
}

