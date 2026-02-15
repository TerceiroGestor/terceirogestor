"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { SectionCard } from "@/components/section-card";
import type { AdminAccessLog } from "@/features/admin/api";

export function AdminUserAccessLogsCard({
  columns,
  rows,
  loading,
  error,
  pageCount,
  totalCount,
  pagination,
  onPaginationChange,
  onSearchChange,
  onRefresh,
}: {
  columns: ColumnDef<AdminAccessLog>[];
  rows: AdminAccessLog[];
  loading: boolean;
  error: string | null;
  pageCount: number;
  totalCount: number;
  pagination: { pageIndex: number; pageSize: number };
  onPaginationChange: (next: { pageIndex: number; pageSize: number }) => void;
  onSearchChange: (next: string) => void;
  onRefresh: () => void;
}) {
  return (
    <SectionCard
      title="Histórico de acessos"
      subtitle="Acompanhamento de login, refresh e logout do usuário."
      actions={
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          Atualizar
        </Button>
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        manualPagination
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        totalCount={totalCount}
        onGlobalFilterChange={onSearchChange}
        searchPlaceholder="Pesquisar acessos"
        showExportMenu={false}
      />

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando acessos...</p>
      ) : null}
    </SectionCard>
  );
}

