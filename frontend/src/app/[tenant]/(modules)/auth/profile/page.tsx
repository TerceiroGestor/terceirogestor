"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  getAccessLogs,
  type AccessLog,
  type AccessLogAction,
} from "@/features/auth/api";

type AccessLogRow = AccessLog & {
  actionLabel: string;
  createdAtLabel: string;
};

const actionLabels: Record<AccessLogAction, string> = {
  LOGIN: "Login",
  REFRESH: "Refresh",
  LOGOUT: "Logout",
};

export default function ProfilePage() {
  const { token } = useAuth();
  const { user } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
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
        header: "Acao",
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
    if (!token) return;
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
    if (authLoading) return;
    if (!token || !isAuthenticated) {
      setLoading(false);
      return;
    }
    loadLogs();
  }, [token, isAuthenticated, authLoading, loadLogs]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search]);

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 space-y-1">
            <p className="text-sm font-semibold">
              {user?.name ?? "Usuario"}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            {user?.roles?.length ? (
              <div className="flex flex-wrap gap-1 pt-2">
                {user.roles.map((role) => (
                  <span
                    key={role.id}
                    className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {role.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Conta
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/60 px-3 py-2 text-left font-medium text-foreground"
            >
              Historico de acessos
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg border border-dashed border-border/70 px-3 py-2 text-left text-muted-foreground"
              disabled
            >
              Seguranca (em breve)
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg border border-dashed border-border/70 px-3 py-2 text-left text-muted-foreground"
              disabled
            >
              Preferencias (em breve)
            </button>
          </div>
        </aside>

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
      </div>
    </div>
  );
}
