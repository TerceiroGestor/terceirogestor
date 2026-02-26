"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/section-card";
import { SectionDialog } from "@/components/section-dialog";
import { FormEngine } from "@/components/FormEngine";
import type { FormField } from "@/components/FormEngine/types";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { usePathname, useRouter } from "next/navigation";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  createUser,
  deleteUser,
  listRoles,
  listUsers,
  updateUser,
  type AdminUser,
  type RoleSummary,
} from "@/features/admin/api";

type UserFormValues = {
  name: string;
  email: string;
  password?: string;
  roleIds?: string[];
  isActive?: boolean;
};

const normalizeUserValues = (values: UserFormValues) => {
  const name = values.name?.trim() ?? "";
  const email = values.email?.trim() ?? "";
  const password = values.password?.trim() || undefined;
  const roleIds = Array.isArray(values.roleIds)
    ? values.roleIds.map((id) => String(id)).filter(Boolean)
    : undefined;
  return { name, email, password, roleIds };
};

const buildUserFields = (
  roleOptions: { label: string; value: string }[],
  isEdit: boolean,
): FormField<UserFormValues>[] => [
  {
    name: "name",
    label: "Nome",
    type: "text",
    required: true,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    required: true,
  },
  {
    name: "password",
    label: "Senha",
    type: "text",
    required: !isEdit,
    helperText: isEdit
      ? "Deixe vazio para manter a senha atual"
      : "Minimo de 6 caracteres",
  },
  {
    name: "roleIds",
    label: "Perfis",
    type: "multiselect",
    options: roleOptions,
  },
  {
    name: "isActive",
    label: "Ativo",
    type: "boolean",
  },
];

export default function AdminUsersPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const [rows, setRows] = React.useState<AdminUser[]>([]);
  const [roles, setRoles] = React.useState<RoleSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const canReadUsers = permissions.includes("users.read");
  const canEditUsers = permissions.includes("users.update");
  const canCreateUsers = permissions.includes("users.create");

  const roleOptions = React.useMemo(
    () => roles.map((role) => ({ label: role.name, value: role.id })),
    [roles],
  );

  const columns = React.useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {row.original.name || "Sem nome"}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.email}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "roles",
        header: "Perfis",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.length ? (
              row.original.roles.map((role) => (
                <Badge key={role.id} variant="outline">
                  {role.name}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">Sem perfil</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "secondary" : "outline"}>
            {row.original.isActive ? "Ativo" : "Inativo"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Criado",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "short",
            }).format(new Date(row.original.createdAt))}
          </span>
        ),
      },
    ],
    [],
  );

  const loadData = React.useCallback(async () => {
    if (!token || !canReadUsers) return;
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        listUsers(token, {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          search: search.trim() || undefined,
        }),
        listRoles(token),
      ]);
      setRows(usersResponse.data);
      setTotalCount(usersResponse.pagination.total);
      setPageCount(usersResponse.pagination.pages);
      setRoles(rolesResponse);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar usuarios.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, canReadUsers, pagination.pageIndex, pagination.pageSize, search]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated) {
      setLoading(false);
      return;
    }
    loadData();
  }, [authLoading, token, isAuthenticated, loadData]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search]);

  const openCreate = () => {
    setEditingUser(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: UserFormValues) => {
    if (!token) return;
    const normalized = normalizeUserValues(values);
    setFormError(null);
    if (!editingUser) {
      if (!normalized.name || !normalized.email || !normalized.password) {
        setFormError("Preencha nome, email e senha antes de salvar.");
        return;
      }
    }
    const createPassword = normalized.password;
    try {
      if (editingUser) {
        const payload = {
          name: normalized.name || undefined,
          email: normalized.email || undefined,
          password: normalized.password,
          isActive: values.isActive ?? editingUser.isActive,
          roleIds: normalized.roleIds,
        };
        await updateUser(token, editingUser.id, payload);
      } else {
        if (!createPassword) {
          setFormError("Preencha nome, email e senha antes de salvar.");
          return;
        }
        await createUser(token, {
          name: normalized.name,
          email: normalized.email,
          password: createPassword,
          isActive: values.isActive ?? true,
          roleIds: normalized.roleIds,
        });
      }
      setDialogOpen(false);
      setEditingUser(null);
      await loadData();
    } catch (err) {
      const details =
        err && typeof err === "object" && "details" in err
          ? (err as { details?: unknown }).details
          : null;

      const detailsMessage =
        details && typeof details === "object" && "message" in details
          ? (details as { message?: unknown }).message
          : null;

      const message = Array.isArray(detailsMessage)
        ? detailsMessage.join(", ")
        : typeof detailsMessage === "string"
          ? detailsMessage
          : err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message)
            : "Falha ao salvar usuário.";
      setFormError(message);
    }
  };

  if (!canReadUsers) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <SectionCard
        title="Usuários"
        subtitle="Gerencie os usuários e seus perfis de acesso."
        actions={
          canCreateUsers ? (
            <Button onClick={openCreate}>Novo usuário</Button>
          ) : null
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
          onPaginationChange={setPagination}
          totalCount={totalCount}
          onGlobalFilterChange={setSearch}
          searchPlaceholder="Pesquisar usuários"
          summaryCards={{
            totalLabel: "Total",
            filteredLabel: "Filtrados",
          }}
          rowActions={
            canEditUsers
              ? [
                  {
                    id: "detail",
                    label: "Detalhes",
                    onSelect: (row) => {
                      const target = row as AdminUser;
                      router.push(
                        withTenantPath(`/admin/users/${target.id}`, tenantSlug),
                      );
                    },
                  },
                  {
                    id: "edit",
                    label: "Editar",
                    onSelect: (row) => openEdit(row as AdminUser),
                  },
                  {
                    id: "toggle",
                    label: "Ativar/Inativar",
                    onSelect: async (row) => {
                      const target = row as AdminUser;
                      if (!token) return;
                      await updateUser(token, target.id, {
                        isActive: !target.isActive,
                      });
                      await loadData();
                    },
                  },
                  {
                    id: "delete",
                    label: "Excluir",
                    destructive: true,
                    onSelect: async (row) => {
                      const target = row as AdminUser;
                      if (!token) return;
                      const confirmed = window.confirm(
                        `Excluir o usuario ${target.email}?`,
                      );
                      if (!confirmed) return;
                      await deleteUser(token, target.id);
                      await loadData();
                    },
                  },
                ]
              : []
          }
          showExportMenu={false}
        />

        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : null}
      </SectionCard>

      <SectionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingUser(null);
            setFormError(null);
          }
        }}
        title={editingUser ? "Editar usuário" : "Novo usuário"}
        description={
          editingUser
            ? "Atualize os dados e perfis de acesso."
            : "Cadastre um novo usuário para o sistema."
        }
      >
        {formError ? (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}
        <FormEngine<UserFormValues>
          fields={buildUserFields(roleOptions, Boolean(editingUser))}
          initialValues={
            editingUser
              ? {
                  name: editingUser.name ?? "",
                  email: editingUser.email,
                  roleIds: editingUser.roles.map((role) => role.id),
                  isActive: editingUser.isActive,
                }
              : {
                  isActive: true,
                }
          }
          onSubmit={handleSubmit}
          actions={{
            cancel: {
              label: "Cancelar",
              onClick: () => {
                setDialogOpen(false);
                setEditingUser(null);
              },
              variant: "ghost",
            },
            submit: {
              label: editingUser ? "Salvar alteracoes" : "Criar usuario",
            },
          }}
        />
      </SectionDialog>
    </div>
  );
}
