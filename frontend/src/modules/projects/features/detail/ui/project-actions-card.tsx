"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { FormEngine } from "@/components/FormEngine";
import type { FormField } from "@/components/FormEngine/types";
import { SectionCard } from "@/components/section-card";
import { SectionDialog } from "@/components/section-dialog";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import {
  ACTION_STATUS_LABELS,
  ACTION_STATUS_OPTIONS,
  createProjectAction,
  deleteProjectAction,
  listActionTypes,
  listProjectActions,
  updateProjectAction,
  type ApiActionType,
  type ApiProjectAction,
  type ActionStatus,
} from "@/modules/actions";
import {
  listProjectCycles,
  listProjectGroups,
  type ApiProjectCycle,
  type ApiProjectGroup,
} from "@/modules/projects/api";
import { formatDateOnlyPtBR } from "@/lib/date";
import { ProjectActionManageDialog } from "./project-action-manage-dialog";
import { ProjectActionTypesDialog } from "./project-action-types-dialog";

type ActionFormValues = {
  actionTypeId: string;
  title: string;
  description: string;
  status: ActionStatus;
  groupId: string;
  cycleId: string;
  plannedStartAt: string;
  plannedEndAt: string;
  executedStartAt: string;
  executedEndAt: string;
};

const NONE_VALUE = "__none__";

function toDateOnly(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 10);
}

function formatDate(value: string | null) {
  return formatDateOnlyPtBR(value);
}

function formatPeriod(start: string | null, end: string | null) {
  if (!start && !end) return "—";
  if (start && end) return `${formatDate(start)} — ${formatDate(end)}`;
  return start ? `${formatDate(start)} —` : `— ${formatDate(end)}`;
}

function resolveStatusBadge(status: ActionStatus) {
  const label = ACTION_STATUS_LABELS[status] ?? status;
  switch (status) {
    case "CANCELED":
      return <Badge variant="outline">{label}</Badge>;
    case "EXECUTED":
      return <Badge variant="secondary">{label}</Badge>;
    case "PLANNED":
    default:
      return (
        <Badge className="border-transparent bg-blue-600 text-white">
          {label}
        </Badge>
      );
  }
}

type ProjectActionsCardProps = {
  token: string;
  projectId: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canReadStructure: boolean;
  canReadPeople: boolean;
  canReadPeopleIdentity: boolean;
};

export function ProjectActionsCard({
  token,
  projectId,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  canReadStructure,
  canReadPeople,
  canReadPeopleIdentity,
}: ProjectActionsCardProps) {
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const [rows, setRows] = React.useState<ApiProjectAction[]>([]);
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
  const [editing, setEditing] = React.useState<ApiProjectAction | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [manageOpen, setManageOpen] = React.useState(false);
  const [manageActionId, setManageActionId] = React.useState<string | null>(null);
  const [typesOpen, setTypesOpen] = React.useState(false);

  const [actionTypes, setActionTypes] = React.useState<ApiActionType[]>([]);
  const [groups, setGroups] = React.useState<ApiProjectGroup[]>([]);
  const [cycles, setCycles] = React.useState<ApiProjectCycle[]>([]);

  const loadLookups = React.useCallback(async () => {
    try {
      const [types, projectGroups, projectCycles] = await Promise.all([
        listActionTypes(token, { isActive: true }),
        canReadStructure ? listProjectGroups(token, projectId) : Promise.resolve([]),
        canReadStructure ? listProjectCycles(token, projectId) : Promise.resolve([]),
      ]);
      setActionTypes(types);
      setGroups(projectGroups);
      setCycles(projectCycles);
    } catch {
      setActionTypes([]);
      setGroups([]);
      setCycles([]);
    }
  }, [token, projectId, canReadStructure]);

  React.useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const loadActions = React.useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listProjectActions(token, projectId, {
        q: search.trim() ? search.trim() : undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      setRows(response.data);
      const total = response.pagination?.total ?? 0;
      setTotalCount(total);
      const computedPageCount =
        response.pagination?.pages ??
        Math.ceil(total / Math.max(1, pagination.pageSize));
      setPageCount(computedPageCount);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar ações.";
      setError(message);
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
    } finally {
      setLoading(false);
    }
  }, [token, projectId, canRead, search, pagination.pageIndex, pagination.pageSize]);

  React.useEffect(() => {
    loadActions();
  }, [loadActions]);

  const cycleOptions = React.useMemo(
    () => [
      { label: "Sem ciclo", value: NONE_VALUE },
      ...cycles.map((cycle) => ({ label: cycle.name, value: cycle.id })),
    ],
    [cycles],
  );

  const groupOptions = React.useMemo(
    () => [
      { label: "Sem grupo", value: NONE_VALUE },
      ...groups.map((group) => ({ label: group.name, value: group.id })),
    ],
    [groups],
  );

  const actionTypeOptions = React.useMemo(
    () => actionTypes.map((type) => ({ label: type.name, value: type.id })),
    [actionTypes],
  );

  const fields = React.useMemo<FormField<ActionFormValues>[]>(() => {
    return [
      {
        name: "actionTypeId",
        label: "Tipo",
        type: "select",
        required: true,
        options: actionTypeOptions,
        helperText:
          actionTypeOptions.length === 0
            ? "Cadastre um tipo de ação antes de criar ações."
            : undefined,
      },
      { name: "title", label: "Título", type: "text", required: true },
      {
        name: "description",
        label: "Descrição",
        type: "textarea",
        rows: 3,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: ACTION_STATUS_OPTIONS,
      },
      {
        name: "groupId",
        label: "Grupo",
        type: "select",
        options: groupOptions,
        helperText: canReadStructure
          ? "Use apenas quando o tipo de aÃ§Ã£o for voltado para Grupo."
          : "VocÃª nÃ£o tem permissÃ£o para listar grupos.",
      },
      {
        name: "cycleId",
        label: "Ciclo",
        type: "select",
        options: cycleOptions,
        helperText: canReadStructure
          ? "Opcional. Use para vincular a ação a um ciclo."
          : "Você não tem permissão para listar ciclos.",
      },
      { name: "plannedStartAt", label: "Início planejado", type: "date" },
      { name: "plannedEndAt", label: "Término planejado", type: "date" },
      { name: "executedStartAt", label: "Início executado", type: "date" },
      { name: "executedEndAt", label: "Término executado", type: "date" },
    ];
  }, [actionTypeOptions, groupOptions, cycleOptions, canReadStructure]);

  const initialValues = React.useMemo<Partial<ActionFormValues>>(() => {
    if (!editing) {
      return {
        actionTypeId: actionTypeOptions[0]?.value ?? "",
        title: "",
        description: "",
        status: "PLANNED",
        groupId: NONE_VALUE,
        cycleId: NONE_VALUE,
        plannedStartAt: "",
        plannedEndAt: "",
        executedStartAt: "",
        executedEndAt: "",
      };
    }
    return {
      actionTypeId: editing.actionTypeId,
      title: editing.title ?? "",
      description: editing.description ?? "",
      status: editing.status ?? "PLANNED",
      groupId: editing.groupId ?? NONE_VALUE,
      cycleId: editing.cycleId ?? NONE_VALUE,
      plannedStartAt: toDateOnly(editing.plannedStartAt),
      plannedEndAt: toDateOnly(editing.plannedEndAt),
      executedStartAt: toDateOnly(editing.executedStartAt),
      executedEndAt: toDateOnly(editing.executedEndAt),
    };
  }, [editing, actionTypeOptions]);

  const columns = React.useMemo<ColumnDef<ApiProjectAction>[]>(() => {
    return [
      {
        id: "title",
        header: "Ação",
        accessorFn: (item) => item.title,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.title}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.actionType?.name ?? "—"}
              {row.original.group?.name ? ` • ${row.original.group.name}` : ""}
              {row.original.cycle?.name ? ` • ${row.original.cycle.name}` : ""}
            </span>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (item) => item.status,
        cell: ({ row }) => resolveStatusBadge(row.original.status),
      },
      {
        id: "planned",
        header: "Planejamento",
        accessorFn: (item) =>
          `${item.plannedStartAt ?? ""}-${item.plannedEndAt ?? ""}`,
        cell: ({ row }) =>
          formatPeriod(row.original.plannedStartAt, row.original.plannedEndAt),
      },
      {
        id: "executed",
        header: "Execução",
        accessorFn: (item) =>
          `${item.executedStartAt ?? ""}-${item.executedEndAt ?? ""}`,
        cell: ({ row }) =>
          formatPeriod(
            row.original.executedStartAt,
            row.original.executedEndAt,
          ),
      },
    ];
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (row: ApiProjectAction) => {
    setEditing(row);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleDelete = React.useCallback(
    async (row: ApiProjectAction) => {
      if (!canDelete) return;
      const confirmed = await confirm({
        title: "Excluir ação",
        description: `Excluir a ação "${row.title}"?`,
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await deleteProjectAction(token, projectId, row.id);
        toast({ title: "Ação excluída" });
        loadActions();
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
    [token, projectId, canDelete, confirm, toast, loadActions],
  );

  const handleSubmit = async (values: ActionFormValues) => {
    if (!canCreate && !editing) return;
    if (!canUpdate && editing) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        actionTypeId: values.actionTypeId,
        title: values.title.trim(),
        description: values.description.trim() ? values.description.trim() : null,
        status: values.status,
        groupId: values.groupId === NONE_VALUE ? null : values.groupId,
        cycleId: values.cycleId === NONE_VALUE ? null : values.cycleId,
        plannedStartAt: values.plannedStartAt.trim() ? values.plannedStartAt : null,
        plannedEndAt: values.plannedEndAt.trim() ? values.plannedEndAt : null,
        executedStartAt: values.executedStartAt.trim() ? values.executedStartAt : null,
        executedEndAt: values.executedEndAt.trim() ? values.executedEndAt : null,
      };

      if (editing) {
        await updateProjectAction(token, projectId, editing.id, payload);
        toast({ title: "Ação atualizada" });
      } else {
        await createProjectAction(token, projectId, payload);
        toast({ title: "Ação criada" });
      }
      setDialogOpen(false);
      setEditing(null);
      loadActions();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao salvar ação.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!canRead) {
    return (
      <SectionCard
        title="Ações"
        subtitle="Você não tem permissão para visualizar ações."
      >
        <p className="text-xs text-muted-foreground">
          Solicite acesso ao administrador do sistema.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Ações"
      subtitle="Planeje e registre ações do projeto."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setTypesOpen(true)}
          >
            Tipos de ação
          </Button>
          {canCreate ? (
            <Button
              type="button"
              onClick={openCreate}
              disabled={actionTypes.length === 0}
            >
              <Plus className="mr-2 size-4" />
              Nova ação
            </Button>
          ) : null}
        </div>
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <DataTable<ApiProjectAction>
        data={rows}
        columns={columns}
        manualPagination
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={(next) => setPagination(next)}
        totalCount={totalCount}
        onGlobalFilterChange={setSearch}
        searchPlaceholder="Pesquisar ações"
        showExportMenu={false}
        onRowClick={(row) => {
          setManageActionId((row as ApiProjectAction).id);
          setManageOpen(true);
        }}
        rowActions={[
          ...(canUpdate
            ? [
                {
                  id: "edit",
                  label: "Editar",
                  onSelect: (row: ApiProjectAction) => openEdit(row),
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  id: "delete",
                  label: "Excluir",
                  destructive: true,
                  onSelect: (row: ApiProjectAction) => handleDelete(row),
                },
              ]
            : []),
        ]}
        summaryCards={{
          totalLabel: "Total",
          filteredLabel: "Filtrados",
        }}
      />

      <ProjectActionManageDialog
        open={manageOpen}
        onOpenChange={(open) => {
          setManageOpen(open);
          if (!open) setManageActionId(null);
        }}
        token={token}
        projectId={projectId}
        actionId={manageActionId}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canReadStructure={canReadStructure}
        canReadPeople={canReadPeople}
        canReadPeopleIdentity={canReadPeopleIdentity}
        onEditRequested={(action) => openEdit(action)}
        onDeleted={() => loadActions()}
      />

      <ProjectActionTypesDialog
        token={token}
        open={typesOpen}
        onOpenChange={setTypesOpen}
        onChanged={() => loadLookups()}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      <SectionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Editar ação" : "Nova ação"}
        description={
          editing ? "Atualize os dados da ação." : "Crie uma ação para o projeto."
        }
        contentClassName="max-w-[860px]"
      >
        {formError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <FormEngine<ActionFormValues>
          fields={fields}
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
  );
}
