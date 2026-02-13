"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { FormEngine } from "@/components/FormEngine";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { SectionCard } from "@/components/section-card";
import { SectionDialog } from "@/components/section-dialog";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  createPantryDonor,
  deletePantryDonor,
  listPantryDonors,
  updatePantryDonor,
  type ApiPantryDonor,
} from "@/features/pantry/api";
import { pantryDonorFormFields } from "@/features/pantry/config/pantry-donor-form-config";
import type { PantryDonorFormValues } from "@/features/pantry/domain/types";
import { PantrySubnav } from "@/features/pantry/ui/pantry-subnav";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { formatDateOnlyPtBR } from "@/lib/date";

function formatDate(value: string) {
  return formatDateOnlyPtBR(value);
}

function normalizeDonorValues(values: PantryDonorFormValues) {
  const name = values.name?.trim() ?? "";
  const type: "PERSON" | "COMPANY" =
    values.type === "COMPANY" ? "COMPANY" : "PERSON";
  const contact = values.contact?.trim() || null;
  return { name, type, contact };
}

export function PantryDonorsClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");
  const canUpdate = permissions.includes("pantry.update");
  const canDelete = permissions.includes("pantry.delete");

  const [rows, setRows] = React.useState<ApiPantryDonor[]>([]);
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
  const [editing, setEditing] = React.useState<ApiPantryDonor | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const columns = React.useMemo<ColumnDef<ApiPantryDonor>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Doador",
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-foreground">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.type === "COMPANY" ? "Empresa" : "Pessoa"}
          </Badge>
        ),
      },
      {
        accessorKey: "contact",
        header: "Contato",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.contact || "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Criado em",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const loadDonors = React.useCallback(async () => {
    if (!token || !canRead) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listPantryDonors(token, {
        q: search.trim() || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      setRows(response.data);
      setTotalCount(response.pagination.total);
      setPageCount(response.pagination.pages);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar doadores.";
      setError(message);
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
    } finally {
      setLoading(false);
    }
  }, [token, canRead, pagination.pageIndex, pagination.pageSize, search]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated || !canRead) {
      setLoading(false);
      return;
    }
    loadDonors();
  }, [authLoading, token, isAuthenticated, canRead, loadDonors]);

  const openCreate = React.useCallback(() => {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const openEdit = React.useCallback(
    (donor: ApiPantryDonor) => {
      if (!canUpdate) {
        setError("Você não tem permissão para editar doadores.");
        return;
      }
      setEditing(donor);
      setFormError(null);
      setDialogOpen(true);
    },
    [canUpdate],
  );

  const onDelete = React.useCallback(
    async (donor: ApiPantryDonor) => {
      if (!token) return;
      if (!canDelete) {
        setError("Você não tem permissão para excluir doadores.");
        return;
      }
      const confirmed = await confirm({
        title: "Excluir doador",
        description: `Excluir o doador "${donor.name}"?`,
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await deletePantryDonor(token, donor.id);
        await loadDonors();
        toast({ title: "Doador excluído", variant: "success" });
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao excluir doador.";
        setError(message);
        toast({ title: "Falha ao excluir", description: message, variant: "destructive" });
      }
    },
    [token, canDelete, loadDonors, confirm, toast],
  );

  const handleSubmit = React.useCallback(
    async (values: PantryDonorFormValues) => {
      if (!token) return;
      if (editing && !canUpdate) {
        setFormError("Você não tem permissão para editar doadores.");
        return;
      }
      if (!editing && !canCreate) {
        setFormError("Você não tem permissão para criar doadores.");
        return;
      }

      const payload = normalizeDonorValues(values);
      if (!payload.name) {
        setFormError("Preencha o nome.");
        return;
      }

      setSaving(true);
      setFormError(null);
      try {
        if (editing) {
          await updatePantryDonor(token, editing.id, payload);
        } else {
          await createPantryDonor(token, payload);
        }
        setDialogOpen(false);
        setEditing(null);
        await loadDonors();
        toast({
          title: editing ? "Doador atualizado" : "Doador criado",
          variant: "success",
        });
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao salvar doador.";
        setFormError(message);
        toast({ title: "Falha ao salvar", description: message, variant: "destructive" });
      } finally {
        setSaving(false);
      }
    },
    [token, editing, canUpdate, canCreate, loadDonors, toast],
  );

  if (!canRead) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title="Despensa · Doadores"
        items={[{ label: "Despensa", href: "/pantry" }, { label: "Doadores" }]}
      />

      <PantrySubnav />

      <SectionCard
        title="Doadores"
        subtitle="Cadastro rápido para vincular entradas."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadDonors}>
              Atualizar
            </Button>
            <Button onClick={openCreate} disabled={!canCreate}>
              Novo
            </Button>
          </div>
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
          searchPlaceholder="Pesquisar doadores"
          summaryCards={{
            totalLabel: "Total",
            filteredLabel: "Filtrados",
          }}
          showExportMenu
          exportLabels={{ title: "Relatório", pdf: "Imprimir (PDF)", csv: "Baixar CSV" }}
          exportMeta={{ title: "Despensa - Doadores" }}
          rowActions={[
            { id: "edit", label: "Editar", onSelect: openEdit },
            { id: "delete", label: "Excluir", destructive: true, onSelect: onDelete },
          ]}
        />
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : null}
      </SectionCard>

      <SectionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Editar doador" : "Novo doador"}
        description="Cadastro rápido para vincular entradas."
      >
        {formError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <FormEngine<PantryDonorFormValues>
          fields={pantryDonorFormFields}
          initialValues={
            editing
              ? {
                  name: editing.name,
                  type: editing.type,
                  contact: editing.contact ?? "",
                }
              : { type: "PERSON" }
          }
          disabled={saving}
          onSubmit={handleSubmit}
          actions={{
            submit: {
              label: saving ? "Salvando..." : "Salvar",
              variant: "primary",
            },
            cancel: {
              label: "Cancelar",
              variant: "ghost",
              onClick: () => setDialogOpen(false),
            },
          }}
        />
      </SectionDialog>
    </div>
  );
}
