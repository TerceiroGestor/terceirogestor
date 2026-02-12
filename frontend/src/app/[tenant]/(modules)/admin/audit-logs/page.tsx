"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { SectionCard } from "@/components/section-card";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  getAuditLogs,
  type AdminAuditLog,
  type AdminAuditLogAction,
} from "@/features/admin/api";

const actionLabels: Record<AdminAuditLogAction, string> = {
  CREATE: "Criacao",
  UPDATE: "Atualizacao",
  DELETE: "Exclusao",
};

type AuditRow = AdminAuditLog & {
  actionLabel: string;
  createdAtLabel: string;
  userLabel: string;
};

export default function AuditLogsPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [rows, setRows] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<AuditRow | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = React.useState("");

  const canReadAudit = permissions.includes("audit.read");

  const columns = React.useMemo<ColumnDef<AuditRow>[]>(
    () => [
      {
        accessorKey: "actionLabel",
        header: "Acao",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.actionLabel}</Badge>
        ),
      },
      {
        accessorKey: "entity",
        header: "Entidade",
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-foreground">
            {row.original.entity}
          </span>
        ),
      },
      {
        accessorKey: "entityId",
        header: "Registro",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.entityId ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "userLabel",
        header: "Usuario",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.userLabel}
          </span>
        ),
      },
      {
        accessorKey: "createdAtLabel",
        header: "Data",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.createdAtLabel}
          </span>
        ),
      },
    ],
    [],
  );

  const loadLogs = React.useCallback(async () => {
    if (!token || !canReadAudit) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getAuditLogs(token, {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: search.trim() || undefined,
      });
      const mapped = response.data.map((log) => ({
        ...log,
        actionLabel: actionLabels[log.action],
        createdAtLabel: new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(log.createdAt)),
        userLabel:
          log.user?.name ||
          log.user?.email ||
          log.userId ||
          "Sistema",
      }));
      setRows(mapped);
      setSelected((current) =>
        current ? mapped.find((row) => row.id === current.id) ?? null : null,
      );
      setTotalCount(response.pagination.total);
      setPageCount(response.pagination.pages);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar auditoria.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, canReadAudit, pagination.pageIndex, pagination.pageSize, search]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated || !canReadAudit) {
      setLoading(false);
      return;
    }
    loadLogs();
  }, [authLoading, token, isAuthenticated, canReadAudit, loadLogs]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search]);

  if (!canReadAudit) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Voce nao tem permissao para acessar esta area.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title="Auditoria de dados"
        items={[
          { label: "Configuracoes", href: "/settings" },
          { label: "Auditoria", href: "/admin/audit-logs" },
        ]}
      />

      <SectionCard
        title="Auditoria"
        subtitle="Registro de criacao, atualizacao e exclusao de dados."
        actions={
          <Button variant="outline" onClick={loadLogs}>
            Atualizar
          </Button>
        }
      >
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <div className="rounded-xl border border-border/50 bg-card/60">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Detalhes da alteracao
              </p>
              <p className="text-xs text-muted-foreground">
                Clique em um registro para visualizar o before/after.
              </p>
            </div>
            {selected ? (
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Limpar selecao
              </Button>
            ) : null}
          </div>
          {selected ? (
            <div className="space-y-4 px-4 py-4">
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/60 px-2 py-0.5">
                  {selected.actionLabel}
                </span>
                <span className="rounded-full border border-border/60 px-2 py-0.5">
                  {selected.entity}
                </span>
                {selected.entityId ? (
                  <span className="rounded-full border border-border/60 px-2 py-0.5">
                    {selected.entityId}
                  </span>
                ) : null}
                <span className="rounded-full border border-border/60 px-2 py-0.5">
                  {selected.userLabel}
                </span>
                <span className="rounded-full border border-border/60 px-2 py-0.5">
                  {selected.createdAtLabel}
                </span>
                {selected.requestId ? (
                  <span className="rounded-full border border-border/60 px-2 py-0.5">
                    Req {selected.requestId}
                  </span>
                ) : null}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Antes
                  </p>
                  <pre className="max-h-[360px] overflow-auto rounded-lg border border-border/40 bg-muted/30 p-3 text-[11px] leading-relaxed text-foreground/80">
                    {selected.before
                      ? JSON.stringify(selected.before, null, 2)
                      : "Sem dados"}
                  </pre>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Depois
                  </p>
                  <pre className="max-h-[360px] overflow-auto rounded-lg border border-border/40 bg-muted/30 p-3 text-[11px] leading-relaxed text-foreground/80">
                    {selected.after
                      ? JSON.stringify(selected.after, null, 2)
                      : "Sem dados"}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              Selecione um registro da tabela para ver os detalhes.
            </div>
          )}
        </div>
        <DataTable
          columns={columns}
          data={rows}
          manualPagination
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          totalCount={totalCount}
          onGlobalFilterChange={setSearch}
          searchPlaceholder="Pesquisar auditoria"
          summaryCards={{
            totalLabel: "Total",
            filteredLabel: "Filtrados",
          }}
          showExportMenu
          exportLabels={{ title: "Relatorio", pdf: "Imprimir (PDF)", csv: "Baixar CSV" }}
          exportMeta={{ title: "Auditoria de dados" }}
          enableRowSelection
          onRowClick={(row) => setSelected(row)}
        />
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando auditoria...</p>
        ) : null}
      </SectionCard>
    </div>
  );
}
