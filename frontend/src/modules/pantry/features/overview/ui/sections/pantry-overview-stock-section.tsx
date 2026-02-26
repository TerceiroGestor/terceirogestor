"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { SectionCard } from "@/components/section-card";
import type { PantryDashboardResponse } from "@/modules/pantry/api";

type StockRow = PantryDashboardResponse["stockRows"][number];

type PantryOverviewStockSectionProps = {
  rows: StockRow[];
  columns: ColumnDef<StockRow>[];
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
  onlyLowStock,
  onToggleOnlyLowStock,
  headerActionsSlot,
  onRowClick,
  rowActions = [],
}: PantryOverviewStockSectionProps) {
  return (
    <SectionCard
      title="Estoque "
      subtitle="Visão física do estoque com alertas de mínimo."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={onlyLowStock ? "default" : "outline"}
            onClick={onToggleOnlyLowStock}
          >
            Baixo estoque
          </Button>
          {headerActionsSlot}
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={rows}
        initialColumnPinning={{
          left: ["actions", "name"],
          right: ["nextExpiryDate"],
        }}
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
    </SectionCard>
  );
}
