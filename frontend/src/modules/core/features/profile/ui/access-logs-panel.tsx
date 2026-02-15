"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { getAccessLogs, type AccessLog, type AccessLogAction } from "@/features/auth/api";

type AccessLogRow = AccessLog & {
  actionLabel: string;
  createdAtLabel: string;
};

const actionLabels: Record<AccessLogAction, string> = {
  LOGIN: "Login",
  REFRESH: "Refresh",
  LOGOUT: "Logout",
};

export function AccessLogsPanel({ token }: { token: string }) {
  const [rows, setRows] = useState<AccessLogRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const columns = useMemo<ColumnDef<AccessLogRow>[]>(
    () => [
      {
        accessorKey: "actionLabel",
        header: "Ação",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">
            {row.original.actionLabel}
          </span>
        ),
      },
      {
        accessorKey: "ipAddress",
        header: "IP",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.ipAddress || "-"}
          </span>
        ),
      },
      {
        accessorKey: "userAgent",
        header: "Dispositivo",
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {row.original.userAgent || "-"}
          </span>
        ),
      },
      {
        accessorKey: "createdAtLabel",
        header: "Data",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.createdAtLabel}
          </span>
        ),
      },
    ],
    [],
  );

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAccessLogs(token, {
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
      }));
      setRows(mapped);
      setTotalCount(response.pagination.total);
      setPageCount(response.pagination.pages);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar acessos.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.pageIndex, pagination.pageSize, search]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search]);

  return (
    <section className="space-y-4">
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
        onPaginationChange={(next) => setPagination(next)}
        totalCount={totalCount}
        onGlobalFilterChange={setSearch}
        searchPlaceholder="Pesquisar acessos"
        summaryCards={{
          totalLabel: "Total",
          filteredLabel: "Filtrados",
        }}
        showExportMenu={false}
      />

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando acessos...</p>
      ) : null}
    </section>
  );
}

