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
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  createProgram,
  deleteProgram,
  listPrograms,
  updateProgram,
  type ApiProgram,
} from "@/modules/programs/api";
import {
  PROGRAM_STATUS_LABELS,
  PROGRAM_TYPE_LABELS,
} from "@/modules/programs/shared/domain/programs.constants";
import {
  programFormFields,
  type ProgramFormValues,
} from "@/modules/programs/features/list/config/program-form-config";
import { formatDateOnlyPtBR } from "@/lib/date";

function formatDate(value: string | null) {
  return formatDateOnlyPtBR(value);
}

function resolveStatusBadge(status: ApiProgram["status"]) {
  const label = PROGRAM_STATUS_LABELS[status] ?? status;
  switch (status) {
    case "ACTIVE":
      return <Badge variant="secondary">{label}</Badge>;
    case "CLOSED":
      return <Badge variant="outline">{label}</Badge>;
    case "PLANNED":
    default:
      return <Badge className="border-transparent bg-blue-600 text-white">{label}</Badge>;
  }
}

function normalizeProgramValues(values: ProgramFormValues) {
  const name = values.name?.trim() ?? "";
  const description = values.description?.trim() ?? "";
  const startsAt = values.startsAt?.trim() ?? "";
  const endsAt = values.endsAt?.trim() ?? "";

  return {
    name,
    type: values.type,
    status: values.status,
    description: description ? description : null,
    startsAt: startsAt ? startsAt : null,
    endsAt: endsAt ? endsAt : null,
  };
}

export function ProgramsClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const canRead = permissions.includes("programs.read");
  const canCreate = permissions.includes("programs.create");
  const canUpdate = permissions.includes("programs.update");
  const canDelete = permissions.includes("programs.delete");

  const [rows, setRows] = React.useState<ApiProgram[]>([]);
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
  const [editing, setEditing] = React.useState<ApiProgram | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const columns = React.useMemo<ColumnDef<ApiProgram>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Programa",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              {row.original.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {PROGRAM_TYPE_LABELS[row.original.type] ?? row.original.type}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="space-y-1">
            {resolveStatusBadge(row.original.status)}
            <p className="text-[11px] text-muted-foreground">
              {row.original.startsAt || row.original.endsAt
                ? `${formatDate(row.original.startsAt)} — ${formatDate(row.original.endsAt)}`
                : "Vigência não informada"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Criado em",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
              new Date(row.original.createdAt),
            )}
          </span>
        ),
      },
    ],
    [],
  );

  const loadPrograms = React.useCallback(async () => {
    if (!token || !canRead) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listPrograms(token, {
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
          : "Falha ao carregar programas.";
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
    loadPrograms();
  }, [authLoading, token, isAuthenticated, canRead, loadPrograms]);

  const openCreate = React.useCallback(() => {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const openEdit = React.useCallback(
    (item: ApiProgram) => {
      if (!canUpdate) {
        setError("Você não tem permissão para editar programas.");
        return;
      }
      setEditing(item);
      setFormError(null);
      setDialogOpen(true);
    },
    [canUpdate],
  );

  const onDelete = React.useCallback(
    async (item: ApiProgram) => {
      if (!token) return;
      if (!canDelete) {
        setError("Você não tem permissão para remover programas.");
        return;
      }
      const confirmed = await confirm({
        title: "Excluir programa",
        description: `Excluir o programa "${item.name}"?`,
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await deleteProgram(token, item.id);
        toast({ title: "Programa excluído" });
        loadPrograms();
      } catch (err) {
        toast({
          title: "Falha ao excluir",
          description:
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: string }).message)
              : "Tente novamente.",
          variant: "destructive",
        });
      }
    },
    [token, canDelete, confirm, toast, loadPrograms],
  );

  const initialValues = React.useMemo<Partial<ProgramFormValues>>(() => {
    if (!editing) {
      return {
        name: "",
        type: "SCFV",
        status: "PLANNED",
        startsAt: "",
        endsAt: "",
        description: "",
      };
    }
    return {
      name: editing.name ?? "",
      type: editing.type,
      status: editing.status,
      startsAt: editing.startsAt ? editing.startsAt.slice(0, 10) : "",
      endsAt: editing.endsAt ? editing.endsAt.slice(0, 10) : "",
      description: editing.description ?? "",
    };
  }, [editing]);

  const handleSubmit = async (values: ProgramFormValues) => {
    if (!token) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = normalizeProgramValues(values);
      if (editing) {
        await updateProgram(token, editing.id, payload);
        toast({ title: "Programa atualizado" });
      } else {
        await createProgram(token, payload);
        toast({ title: "Programa criado" });
      }
      setDialogOpen(false);
      setEditing(null);
      loadPrograms();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao salvar programa.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!canRead) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar Programas.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title="Programas"
        items={[{ label: "Programas", href: "/programs" }]}
      />

      <SectionCard
        title="Programas"
        subtitle="Camada estratégica (SUAS): organiza projetos e consolida indicadores."
        actions={
          canCreate ? <Button onClick={openCreate}>Novo programa</Button> : null
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
          onPaginationChange={(next) => setPagination(next)}
          totalCount={totalCount}
          onGlobalFilterChange={setSearch}
          searchPlaceholder="Pesquisar programas"
          showExportMenu={false}
          onRowClick={(row) => openEdit(row as ApiProgram)}
          rowActions={[
            ...(canUpdate
              ? [
                  {
                    id: "edit",
                    label: "Editar",
                    onSelect: (row: unknown) => openEdit(row as ApiProgram),
                  },
                ]
              : []),
            ...(canDelete
              ? [
                  {
                    id: "delete",
                    label: "Excluir",
                    destructive: true,
                    onSelect: (row: unknown) => onDelete(row as ApiProgram),
                  },
                ]
              : []),
          ]}
          summaryCards={{
            totalLabel: "Total",
            filteredLabel: "Filtrados",
          }}
        />

        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : null}

        <SectionDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          title={editing ? "Editar programa" : "Novo programa"}
          description={
            editing
              ? "Atualize os dados estratégicos do programa."
              : "Cadastre um programa para organizar os projetos."
          }
          contentClassName="max-w-[920px]"
        >
          {formError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          ) : null}
          <FormEngine<ProgramFormValues>
            fields={programFormFields}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            disabled={saving}
            actions={{
              submit: {
                label: saving ? "Salvando..." : editing ? "Salvar" : "Criar",
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
      </SectionCard>
    </div>
  );
}
