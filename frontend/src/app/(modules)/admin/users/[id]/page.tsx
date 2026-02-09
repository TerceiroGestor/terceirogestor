"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  getUserAccessLogs,
  getUserById,
  type AdminAccessLog,
  type AdminUser,
} from "@/features/admin/api";

type LogRow = AdminAccessLog;

export default function AdminUserDetailPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const userId = typeof params?.id === "string" ? params.id : "";

  const [user, setUser] = React.useState<AdminUser | null>(null);
  const [logs, setLogs] = React.useState<LogRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [logLoading, setLogLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [logError, setLogError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = React.useState("");

  const canReadUsers = permissions.includes("users.read");

  const columns = React.useMemo<ColumnDef<LogRow>[]>(
    () => [
      {
        accessorKey: "action",
        header: "Acao",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.action}</Badge>
        ),
      },
      {
        accessorKey: "ipAddress",
        header: "IP",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.ipAddress ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "userAgent",
        header: "User Agent",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.userAgent ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Data",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            }).format(new Date(row.original.createdAt))}
          </span>
        ),
      },
    ],
    [],
  );

  const loadUser = React.useCallback(async () => {
    if (!token || !userId || !canReadUsers) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getUserById(token, userId);
      setUser(response);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar usuario.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, userId, canReadUsers]);

  const loadLogs = React.useCallback(async () => {
    if (!token || !userId || !canReadUsers) return;
    setLogLoading(true);
    setLogError(null);
    try {
      const response = await getUserAccessLogs(token, userId, {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: search.trim() || undefined,
      });
      setLogs(response.data);
      setTotalCount(response.pagination.total);
      setPageCount(response.pagination.pages);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar acessos.";
      setLogError(message);
    } finally {
      setLogLoading(false);
    }
  }, [token, userId, canReadUsers, pagination.pageIndex, pagination.pageSize, search]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated || !canReadUsers) {
      setLoading(false);
      setLogLoading(false);
      return;
    }
    loadUser();
    loadLogs();
  }, [authLoading, token, isAuthenticated, canReadUsers, loadUser, loadLogs]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search]);

  if (!canReadUsers) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Voce nao tem permissao para acessar esta area.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title="Detalhes do usuario"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Configuracoes", href: "/settings" },
          { label: "Usuarios", href: "/admin/users" },
        ]}
        action={{
          label: "Voltar",
          onClick: () => router.push("/admin/users"),
        }}
      />

      <SectionCard
        title={user?.name || "Usuario"}
        subtitle={user?.email ?? ""}
      >
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : null}

        {user ? (
          <SectionList>
            <SectionListItem
              title="Status"
              subtitle={user.isActive ? "Ativo" : "Inativo"}
              meta={
                <Badge variant={user.isActive ? "secondary" : "outline"}>
                  {user.isActive ? "Ativo" : "Inativo"}
                </Badge>
              }
            />
            <SectionListItem
              title="Perfis"
              subtitle="Perfis vinculados ao usuario"
              meta={
                <div className="flex flex-wrap gap-1">
                  {user.roles.length ? (
                    user.roles.map((role) => (
                      <Badge key={role.id} variant="outline">
                        {role.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Sem perfil
                    </span>
                  )}
                </div>
              }
            />
            <SectionListItem
              title="Criado em"
              subtitle={new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(user.createdAt))}
            />
          </SectionList>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Historico de acessos"
        subtitle="Acompanhamento de login, refresh e logout do usuario."
        actions={<Button variant="outline" onClick={loadLogs}>Atualizar</Button>}
      >
        {logError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {logError}
          </div>
        ) : null}
        <DataTable
          columns={columns}
          data={logs}
          manualPagination
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          totalCount={totalCount}
          onGlobalFilterChange={setSearch}
          searchPlaceholder="Pesquisar acessos"
          showExportMenu={false}
        />
        {logLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : null}
      </SectionCard>
    </div>
  );
}
