"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
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
  createProject,
  deleteProject,
  listProjects,
  updateProject,
  type ApiProject,
} from "@/modules/projects/api";
import { listPrograms, type ApiProgram } from "@/modules/programs/api";
import { PROGRAM_TYPE_LABELS } from "@/modules/programs/shared/domain/programs.constants";
import {
  PROJECT_STATUS_LABELS,
} from "@/modules/projects/shared/domain/projects.constants";
import { buildProjectFormFields, type ProjectFormValues } from "@/modules/projects/features/list/config/project-form-config";
import type { SelectOption } from "@/components/FormEngine/types";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";

function formatDate(value: string | null) {
  return formatDateOnlyPtBR(value);
}

function resolveStatusBadge(status: ApiProject["status"]) {
  const label = PROJECT_STATUS_LABELS[status] ?? status;
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

function normalizeProjectValues(values: ProjectFormValues) {
  const name = values.name?.trim() ?? "";
  const description = values.description?.trim() ?? "";
  const startsAt = values.startsAt?.trim() ?? "";
  const endsAt = values.endsAt?.trim() ?? "";

  return {
    programId: values.programId,
    name,
    status: values.status,
    description: description ? description : null,
    startsAt: startsAt ? startsAt : null,
    endsAt: endsAt ? endsAt : null,
  };
}

export function ProjectsClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const canRead = permissions.includes("projects.read");
  const canCreate = permissions.includes("projects.create");
  const canUpdate = permissions.includes("projects.update");
  const canDelete = permissions.includes("projects.delete");

  const [rows, setRows] = React.useState<ApiProject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = React.useState("");

  const [programOptions, setProgramOptions] = React.useState<SelectOption[]>([]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiProject | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const columns = React.useMemo<ColumnDef<ApiProject>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Projeto",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              {row.original.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.program?.name ?? "-"}
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
        accessorKey: "program",
        header: "Tipo",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.program?.type
              ? PROGRAM_TYPE_LABELS[row.original.program.type] ?? row.original.program.type
              : "-"}
          </span>
        ),
      },
    ],
    [],
  );

  const loadProgramsForSelect = React.useCallback(async () => {
    if (!token) return;
    try {
      const response = await listPrograms(token, { all: true });
      const options = (response.data as ApiProgram[]).map((program) => ({
        value: program.id,
        label: program.name,
      }));
      setProgramOptions(options);
    } catch {
      setProgramOptions([]);
    }
  }, [token]);

  const loadProjects = React.useCallback(async () => {
    if (!token || !canRead) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listProjects(token, {
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
          : "Falha ao carregar projetos.";
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
    loadProgramsForSelect();
    loadProjects();
  }, [authLoading, token, isAuthenticated, canRead, loadProgramsForSelect, loadProjects]);

  const openCreate = React.useCallback(() => {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const openView = React.useCallback(
    (item: ApiProject) => {
      router.push(withTenantPath(`/projects/${item.id}`, tenantSlug));
    },
    [router, tenantSlug],
  );

  const openEdit = React.useCallback(
    (item: ApiProject) => {
      if (!canUpdate) {
        setError("Você não tem permissão para editar projetos.");
        return;
      }
      setEditing(item);
      setFormError(null);
      setDialogOpen(true);
    },
    [canUpdate],
  );

  const onDelete = React.useCallback(
    async (item: ApiProject) => {
      if (!token) return;
      if (!canDelete) {
        setError("Você não tem permissão para remover projetos.");
        return;
      }
      const confirmed = await confirm({
        title: "Excluir projeto",
        description: `Excluir o projeto "${item.name}"?`,
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await deleteProject(token, item.id);
        toast({ title: "Projeto excluído" });
        loadProjects();
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
    [token, canDelete, confirm, toast, loadProjects],
  );

  const initialValues = React.useMemo<Partial<ProjectFormValues>>(() => {
    if (!editing) {
      return {
        programId: programOptions[0]?.value ?? "",
        name: "",
        status: "PLANNED",
        startsAt: "",
        endsAt: "",
        description: "",
      };
    }
    return {
      programId: editing.programId,
      name: editing.name ?? "",
      status: editing.status,
      startsAt: editing.startsAt ? editing.startsAt.slice(0, 10) : "",
      endsAt: editing.endsAt ? editing.endsAt.slice(0, 10) : "",
      description: editing.description ?? "",
    };
  }, [editing, programOptions]);

  const fields = React.useMemo(
    () => buildProjectFormFields(programOptions),
    [programOptions],
  );

  const handleSubmit = async (values: ProjectFormValues) => {
    if (!token) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = normalizeProjectValues(values);
      if (editing) {
        await updateProject(token, editing.id, payload);
        toast({ title: "Projeto atualizado" });
      } else {
        await createProject(token, payload);
        toast({ title: "Projeto criado" });
      }
      setDialogOpen(false);
      setEditing(null);
      loadProjects();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao salvar projeto.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!canRead) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar Projetos.
      </div>
    );
  }

  const programHelper =
    programOptions.length === 0
      ? "Cadastre um programa antes de criar projetos."
      : "Projetos operacionais vinculados a um programa.";

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title="Projetos"
        items={[{ label: "Projetos", href: "/projects" }]}
      />

      <SectionCard
        title="Projetos"
        subtitle={programHelper}
        actions={
          canCreate ? (
            <Button onClick={openCreate} disabled={programOptions.length === 0}>
              Novo projeto
            </Button>
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
          onPaginationChange={(next) => setPagination(next)}
          totalCount={totalCount}
          onGlobalFilterChange={setSearch}
          searchPlaceholder="Pesquisar projetos"
          showExportMenu={false}
          onRowClick={(row) => openView(row as ApiProject)}
          rowActions={[
            {
              id: "view",
              label: "Visualizar",
              onSelect: (row: unknown) => openView(row as ApiProject),
            },
            ...(canUpdate
              ? [
                  {
                    id: "edit",
                    label: "Editar",
                    onSelect: (row: unknown) => openEdit(row as ApiProject),
                  },
                ]
              : []),
            ...(canDelete
              ? [
                  {
                    id: "delete",
                    label: "Excluir",
                    destructive: true,
                    onSelect: (row: unknown) => onDelete(row as ApiProject),
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
          title={editing ? "Editar projeto" : "Novo projeto"}
          description={
            editing
              ? "Atualize os dados do projeto."
              : "Cadastre um projeto vinculado a um programa."
          }
          contentClassName="max-w-[920px]"
        >
          {formError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          ) : null}
          <FormEngine<ProjectFormValues>
            fields={fields}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            disabled={saving || programOptions.length === 0}
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
