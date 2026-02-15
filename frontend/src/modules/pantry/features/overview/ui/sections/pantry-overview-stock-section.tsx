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
  onRowClick,
  rowActions = [],
}: PantryOverviewStockSectionProps) {
  return (
    <SectionCard
      title="Estoque por setor"
      subtitle="Visão física do estoque com alertas de mínimo."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant={onlyLowStock ? "default" : "outline"}
            onClick={onToggleOnlyLowStock}
          >
            {onlyLowStock ? "Mostrando somente alertas" : "Somente alertas"}
          </Button>
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={rows}
        initialColumnPinning={{ left: ["actions", "name"], right: ["nextExpiryDate"] }}
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
