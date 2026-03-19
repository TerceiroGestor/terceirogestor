"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateOnlyPtBR } from "@/lib/date";
import type { ApiProject, ProjectStatus } from "@/modules/projects/api";
import type {
  ApiProjectCycle,
  ApiProjectEnrollment,
  ApiProjectGroup,
} from "@/modules/projects/api";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_OPTIONS } from "@/modules/projects/shared/domain/projects.constants";
import { PROJECT_PARTICIPATION_ROLE_LABELS } from "@/modules/projects/shared/domain/projects.constants";
import type { ApiProgram, ProgramStatus, ProgramType } from "@/modules/programs/api";
import {
  PROGRAM_STATUS_LABELS,
  PROGRAM_TYPE_LABELS,
} from "@/modules/programs/shared/domain/programs.constants";
import type { ApiProjectAction, ActionStatus } from "@/modules/actions/api";
import { ACTION_STATUS_LABELS } from "@/modules/actions/shared/domain/actions.constants";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { DetailAuditFeed } from "@/web-client/detail/DetailAuditFeed";
import { DetailNotesPanel } from "@/web-client/detail/DetailNotesPanel";
import { DetailSideTabs } from "@/web-client/detail/DetailSideTabs";
import { buildGroupedAuditFeed } from "@/web-client/detail/audit-feed-utils";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

const PROJECT_DETAIL_INPUT_CLASS =
  "h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0";
const PROJECT_DETAIL_TEXTAREA_CLASS =
  "min-h-[180px] rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";
const PROJECT_DETAIL_SECTION_CLASS =
  "border-y border-border/60 bg-transparent px-0 py-4";

const AUTO_SAVE_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

const PROJECT_AUDIT_FIELD_LABELS = {
  programId: "Programa",
  name: "Nome",
  status: "Status",
  description: "Descricao",
  internalNotes: "Notas internas",
  startsAt: "Inicio",
  endsAt: "Fim",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

function formatProgramType(value: ProgramType | string | null | undefined) {
  if (!value) return "-";
  return PROGRAM_TYPE_LABELS[value as ProgramType] ?? String(value);
}

function formatProgramStatus(value: ProgramStatus | string | null | undefined) {
  if (!value) return "-";
  return PROGRAM_STATUS_LABELS[value as ProgramStatus] ?? String(value);
}

function formatProjectStatus(value: ProjectStatus | string | null | undefined) {
  if (!value) return "-";
  return PROJECT_STATUS_LABELS[value as ProjectStatus] ?? String(value);
}

function formatActionStatus(value: ActionStatus | string | null | undefined) {
  if (!value) return "-";
  return ACTION_STATUS_LABELS[value as ActionStatus] ?? String(value);
}

function formatPeriod(startsAt: string | null | undefined, endsAt: string | null | undefined) {
  if (!startsAt && !endsAt) return "Nao informada";
  return `${startsAt ? formatDateOnlyPtBR(startsAt) : "-"} ate ${endsAt ? formatDateOnlyPtBR(endsAt) : "-"}`;
}

function formatAgeRange(ageMin: number | string | null | undefined, ageMax: number | string | null | undefined) {
  const min = ageMin === "" || ageMin === undefined ? null : ageMin;
  const max = ageMax === "" || ageMax === undefined ? null : ageMax;
  if (min === null && max === null) return "Livre";
  return `${min ?? "-"} a ${max ?? "-"}`;
}

function resolveStatusBadge(status: ProjectStatus) {
  const label = formatProjectStatus(status);
  switch (status) {
    case "ACTIVE":
      return <Badge variant="secondary">{label}</Badge>;
    case "CLOSED":
      return <Badge variant="outline">{label}</Badge>;
    default:
      return <Badge className="border-transparent bg-blue-600 text-white">{label}</Badge>;
  }
}

function groupRelationColumns(): ColumnDef<ApiProjectGroup, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: "Grupo",
      cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
            {row.original.description?.trim() || "Grupo operacional"}
            </div>
          </div>
        ),
    },
  ];
}

function cycleRelationColumns(): ColumnDef<ApiProjectCycle, unknown>[] {
  return [
    {
      accessorKey: "name",
        header: "Grupo de pessoas",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">
            {row.original.segment?.name ?? row.original.catalogCycle?.name ?? row.original.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.segment?.category?.trim() ||
              row.original.catalogCycle?.audienceType?.trim() ||
              "Grupo de pessoas"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "startsAt",
      header: "Periodo",
      cell: ({ row }) => formatPeriod(row.original.startsAt, row.original.endsAt),
    },
  ];
}

function enrollmentRelationColumns({
  canDeleteEnrollments,
  onEndEnrollment,
  tenantSlug,
}: Pick<
  ProjectsDetailLayoutContext,
  "canDeleteEnrollments" | "onEndEnrollment" | "tenantSlug"
>): ColumnDef<ApiProjectEnrollment, unknown>[] {
  return [
    {
      accessorKey: "person.fullName",
      header: "Pessoa",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <PersonIdentityAvatarTrigger
            personId={row.original.person.id}
            tenantSlug={tenantSlug}
            fullName={row.original.person.fullName}
            birthDate={row.original.person.birthDate ?? null}
            avatarUrl={row.original.person.avatarUrl}
            hasHealthCondition={row.original.person.hasHealthCondition}
            hasMedication={row.original.person.hasMedication}
          />
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">{row.original.person.fullName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.person.status?.trim() || "Sem status"}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Papel",
      cell: ({ row }) => (
        <span>
          {PROJECT_PARTICIPATION_ROLE_LABELS[row.original.role] ?? row.original.role}
        </span>
      ),
    },
    {
      accessorKey: "groups",
      header: "Grupos",
      cell: ({ row }) => {
        const label = row.original.groups.map((group) => group.name).join(", ");
        return <span className="text-foreground">{label || "Sem grupo"}</span>;
      },
    },
    {
      accessorKey: "peopleGroups",
      header: "Grupo de pessoas",
      cell: ({ row }) => {
        const label = row.original.peopleGroups.map((peopleGroup) => peopleGroup.name).join(", ");
        return <span>{label || "Sem grupo de pessoas"}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="text-foreground">{row.original.status === "ACTIVE" ? "Ativa" : "Encerrada"}</div>
          <div className="text-xs text-muted-foreground">
            {formatPeriod(row.original.startsAt, row.original.endsAt)}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        canDeleteEnrollments && row.original.status !== "ENDED" ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                onEndEnrollment(row.original);
              }}
            >
              Encerrar matricula
            </Button>
          </div>
        ) : null,
    },
  ];
}

function actionRelationColumns(): ColumnDef<ApiProjectAction, unknown>[] {
  return [
    {
      accessorKey: "title",
      header: "Acao",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{row.original.title}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.actionType?.name || "Sem tipo"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => formatActionStatus(row.original.status),
    },
    {
      accessorKey: "plannedStartAt",
      header: "Periodo",
      cell: ({ row }) => formatPeriod(row.original.plannedStartAt, row.original.plannedEndAt),
    },
  ];
}

export type ProjectDetailDraft = {
  programId: string;
  name: string;
  status: ProjectStatus;
  startsAt: string;
  endsAt: string;
  description: string;
  internalNotes: string | null;
};

export type ProjectsDetailLayoutContext = DetailShellAuditContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  canAudit: boolean;
  canEdit: boolean;
  canManageStructure: boolean;
  canManageActions: boolean;
  canManageEnrollments: boolean;
  canDeleteEnrollments: boolean;
  tenantSlug: string;
  project: ApiProject | null;
  draft: ProjectDetailDraft;
  setDraft: React.Dispatch<React.SetStateAction<ProjectDetailDraft>>;
  programOptions: Array<{
    value: string;
    label: string;
    type?: ProgramType;
    status?: ProgramStatus;
  }>;
  selectedProgram: ApiProgram | null;
  peopleGroupRows: Array<{
    id: string;
    peopleGroupId: string;
    participationKind: "PARTICIPANT" | "TEAM";
    peopleGroup: {
      id: string;
      name: string;
      category?: string | null;
      description?: string | null;
      ageMin?: number | null;
      ageMax?: number | null;
    };
  }>;
  groupRows: ApiProjectGroup[];
  enrollmentRows: ApiProjectEnrollment[];
  actionRows: ApiProjectAction[];
  relationsLoading: boolean;
  onCommitField: <K extends keyof ProjectDetailDraft>(
    field: K,
    nextValue?: ProjectDetailDraft[K],
  ) => void;
  onNotesChange: (next: string | null) => void;
  onNotesBlur: () => void;
  onOpenGroup: (groupId: string) => void;
  onCreateGroup: () => void;
  onOpenCycle: (cycleId: string) => void;
  onCreateCycle: () => void;
  onOpenEnrollment: (personId: string) => void;
  onCreateEnrollment: () => void;
  onEndEnrollment: (enrollment: ApiProjectEnrollment) => void;
  onOpenAction: (actionId: string) => void;
  onCreateAction: () => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

function ProjectsDetailMain({
  draft,
  setDraft,
  programOptions,
  readOnly,
  onCommitField,
}: Pick<
  ProjectsDetailLayoutContext,
  "draft" | "setDraft" | "programOptions" | "readOnly" | "onCommitField"
>) {
  return (
    <div className={PROJECT_DETAIL_SECTION_CLASS}>
      <div className="grid gap-3 md:grid-cols-[1.3fr_220px_220px] md:items-end">
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Nome</div>
          <Input
            value={draft.name}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, name: event.target.value }))
            }
            onBlur={() => onCommitField("name")}
            className={PROJECT_DETAIL_INPUT_CLASS}
            placeholder="Nome do projeto"
            readOnly={readOnly}
          />
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Programa</div>
          <Select
            value={draft.programId}
            onValueChange={(value) => {
              setDraft((previous) => ({ ...previous, programId: value }));
              onCommitField("programId", value);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={PROJECT_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Programa" />
            </SelectTrigger>
            <SelectContent>
              {programOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Status</div>
          <Select
            value={draft.status}
            onValueChange={(value) => {
              setDraft((previous) => ({ ...previous, status: value as ProjectStatus }));
              onCommitField("status", value as ProjectStatus);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={PROJECT_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 md:items-end">
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Inicio</div>
          <Input
            type="date"
            value={draft.startsAt}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, startsAt: event.target.value }))
            }
            onBlur={() => onCommitField("startsAt")}
            className={PROJECT_DETAIL_INPUT_CLASS}
            title="Inicio"
            readOnly={readOnly}
          />
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Fim</div>
          <Input
            type="date"
            value={draft.endsAt}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, endsAt: event.target.value }))
            }
            onBlur={() => onCommitField("endsAt")}
            className={PROJECT_DETAIL_INPUT_CLASS}
            title="Fim"
            readOnly={readOnly}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-medium text-muted-foreground">Descricao</div>
        <Textarea
          value={draft.description}
          onChange={(event) =>
            setDraft((previous) => ({ ...previous, description: event.target.value }))
          }
          onBlur={() => onCommitField("description")}
          className={PROJECT_DETAIL_TEXTAREA_CLASS}
          placeholder="Descricao, objetivo e contexto do projeto"
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

function ProjectsDetailSide({
  mode,
  canAudit,
  readOnly,
  draft,
  selectedProgram,
  peopleGroupRows,
  groupRows,
  enrollmentRows,
  actionRows,
  detailAudit,
  auditVisibleCount,
  onAuditVisibleCountChange,
  onNotesChange,
  onNotesBlur,
}: Pick<
  ProjectsDetailLayoutContext,
  | "mode"
  | "canAudit"
  | "readOnly"
  | "draft"
      | "selectedProgram"
      | "peopleGroupRows"
  | "groupRows"
  | "enrollmentRows"
  | "actionRows"
  | "detailAudit"
  | "auditVisibleCount"
  | "onAuditVisibleCountChange"
  | "onNotesChange"
  | "onNotesBlur"
>) {
  const auditCount = buildGroupedAuditFeed(detailAudit?.logs ?? []).length;

  return (
    <DetailSideTabs
      tabs={[
        {
          value: "activity",
          label: "Auditoria",
          badge: canAudit && auditCount ? auditCount : undefined,
          content: canAudit ? (
            <DetailAuditFeed
              mode={mode}
              auditState={detailAudit}
              auditVisibleCount={auditVisibleCount}
              onAuditVisibleCountChange={onAuditVisibleCountChange}
            />
          ) : (
            <div className="text-sm text-muted-foreground">Sem permissao para auditoria.</div>
          ),
        },
        {
          value: "notes",
          label: "Anotacoes",
          content: (
            <DetailNotesPanel
              value={draft.internalNotes}
              onChange={onNotesChange}
              onBlur={onNotesBlur}
              readOnly={readOnly}
            />
          ),
        },
        {
          value: "context",
          label: "Contexto",
          content: (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Programa</span>
                <span className="text-right text-foreground">{selectedProgram?.name ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Tipo do programa</span>
                <span className="text-foreground">
                  {formatProgramType(selectedProgram?.type ?? null)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Status</span>
                <span className="text-foreground">{formatProjectStatus(draft.status)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Participantes</span>
                <span className="text-foreground">{enrollmentRows.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Grupos</span>
                <span className="text-foreground">{groupRows.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Grupos de Pessoas</span>
                <span className="text-foreground">{peopleGroupRows.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Acoes</span>
                <span className="text-foreground">{actionRows.length}</span>
              </div>
            </div>
          ),
        },
      ]}
      defaultValue="activity"
    />
  );
}

export const projectsDetailLayout: DetailLayoutConfig<ProjectsDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  header: {
    title: ({ project, draft, mode }) =>
      mode === "create" ? "Novo projeto" : ((project?.name ?? draft.name) || "Projeto"),
    slot: ({ draft, selectedProgram, peopleGroupRows, groupRows, actionRows, enrollmentRows }) => (
      <div className="border-y border-border/60 bg-transparent px-0 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Status</div>
            <div>{resolveStatusBadge(draft.status)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Programa</div>
            <div className="font-medium text-foreground">{selectedProgram?.name ?? "-"}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Tipo</div>
            <div className="font-medium text-foreground">
              {formatProgramType(selectedProgram?.type ?? null)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Participantes</div>
            <div className="font-medium text-foreground">{enrollmentRows.length}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Grupos</div>
            <div className="font-medium text-foreground">{groupRows.length}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Grupos de Pessoas</div>
            <div className="font-medium text-foreground">{peopleGroupRows.length}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Acoes</div>
            <div className="font-medium text-foreground">{actionRows.length}</div>
          </div>
        </div>
      </div>
    ),
  },
  main: ({ draft, setDraft, programOptions, readOnly, onCommitField }) => (
    <ProjectsDetailMain
      draft={draft}
      setDraft={setDraft}
      programOptions={programOptions}
      readOnly={readOnly}
      onCommitField={onCommitField}
    />
  ),
  side: ({
    mode,
    canAudit,
    readOnly,
    draft,
    selectedProgram,
    peopleGroupRows,
    groupRows,
    enrollmentRows,
    actionRows,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    onNotesChange,
    onNotesBlur,
  }) => (
    <ProjectsDetailSide
      mode={mode}
      canAudit={canAudit}
      readOnly={readOnly}
      draft={draft}
      selectedProgram={selectedProgram}
      peopleGroupRows={peopleGroupRows}
      groupRows={groupRows}
      enrollmentRows={enrollmentRows}
      actionRows={actionRows}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      onNotesChange={onNotesChange}
      onNotesBlur={onNotesBlur}
    />
  ),
  tabTemplates: [
    {
      key: "peopleGroups",
      label: "Grupos de Pessoas",
      badge: ({ peopleGroupRows }) => peopleGroupRows.length,
      relations: [
        {
          key: "project.people-groups",
          label: "Grupos de Pessoas",
          loading: ({ relationsLoading }) => relationsLoading,
          rows: ({ mode, peopleGroupRows }) => (mode === "edit" ? peopleGroupRows : []),
          columns: [
            {
              accessorKey: "peopleGroup.name",
              header: "Grupo de Pessoas",
              cell: ({ row }: { row: { original: ProjectsDetailLayoutContext["peopleGroupRows"][number] } }) => (
                <div className="space-y-0.5">
                  <div className="font-medium text-foreground">{row.original.peopleGroup.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.original.peopleGroup.description?.trim() || row.original.peopleGroup.category?.trim() || "Grupo de pessoas"}
                  </div>
                </div>
              ),
            },
            {
              id: "category",
              header: "Categoria",
              cell: ({ row }: { row: { original: ProjectsDetailLayoutContext["peopleGroupRows"][number] } }) =>
                row.original.peopleGroup.category?.trim() || "-",
            },
            {
              id: "ageRange",
              header: "Faixa etaria",
              cell: ({ row }: { row: { original: ProjectsDetailLayoutContext["peopleGroupRows"][number] } }) =>
                formatAgeRange(
                  row.original.peopleGroup.ageMin ?? null,
                  row.original.peopleGroup.ageMax ?? null,
                ),
            },
          ] as ColumnDef<ProjectsDetailLayoutContext["peopleGroupRows"][number], unknown>[],
          getRowId: (row) => row.id,
          filterRows: (rows, query) => {
            const needle = query.trim().toLocaleLowerCase();
            if (!needle) return rows;
            return rows.filter((row) =>
              [
                row.peopleGroup.name,
                row.peopleGroup.category ?? "",
                row.peopleGroup.description ?? "",
                formatAgeRange(row.peopleGroup.ageMin ?? null, row.peopleGroup.ageMax ?? null),
              ]
                .join(" ")
                .toLocaleLowerCase()
                .includes(needle),
            );
          },
          searchPlaceholder: "Pesquisar",
          onRowClick: () => undefined,
          action: {
            label: "Adicionar grupo de pessoas",
            onClick: (context) => context.onCreateCycle(),
            hidden: ({ readOnly, mode, canManageStructure }) =>
              readOnly || mode !== "edit" || !canManageStructure,
          },
          emptyLabel: ({ mode }) =>
            mode === "create"
              ? "Salve o projeto para gerenciar grupos de pessoas."
              : "Nenhum grupo de pessoas vinculado.",
        },
      ],
    },
    {
      key: "participants",
      label: "Participantes",
      badge: ({ enrollmentRows }) => enrollmentRows.length,
      relations: [
        {
          key: "project.enrollments",
          label: "Participantes",
          loading: ({ relationsLoading }) => relationsLoading,
          rows: ({ mode, enrollmentRows }) => (mode === "edit" ? enrollmentRows : []),
          columns: (context) =>
            enrollmentRelationColumns({
              canDeleteEnrollments: context.canDeleteEnrollments,
              onEndEnrollment: context.onEndEnrollment,
              tenantSlug: context.tenantSlug,
            }),
          getRowId: (row) => row.id,
          filterRows: (rows, query) => {
            const needle = query.trim().toLocaleLowerCase();
            if (!needle) return rows;
            return rows.filter((row) => {
              const haystack = [
                row.person.fullName,
                row.person.status ?? "",
                PROJECT_PARTICIPATION_ROLE_LABELS[
                  row.role as keyof typeof PROJECT_PARTICIPATION_ROLE_LABELS
                ] ?? row.role,
                row.groups.map((group: { id: string; name: string }) => group.name).join(" "),
                row.peopleGroups
                  .map((peopleGroup: { id: string; name: string; category?: string | null }) =>
                    [peopleGroup.name, peopleGroup.category ?? ""].join(" "),
                  )
                  .join(" "),
                row.status === "ACTIVE" ? "Ativa" : "Encerrada",
                formatPeriod(row.startsAt, row.endsAt),
              ]
                .join(" ")
                .toLocaleLowerCase();
              return haystack.includes(needle);
            });
          },
          searchPlaceholder: "Pesquisar",
          onRowClick: (row, context) => context.onOpenEnrollment(row.person.id),
          action: {
            label: "Nova matricula",
            onClick: (context) => context.onCreateEnrollment(),
            hidden: ({ readOnly, mode, canManageEnrollments }) =>
              readOnly || mode !== "edit" || !canManageEnrollments,
          },
          emptyLabel: ({ mode }) =>
            mode === "create"
              ? "Salve o projeto para gerenciar participantes."
              : "Nenhum participante vinculado.",
        },
      ],
    },
    {
      key: "groups",
      label: "Grupos de Participantes",
      badge: ({ groupRows }) => groupRows.length,
      relations: [
        {
          key: "project.groups",
          label: "Grupos",
          loading: ({ relationsLoading }) => relationsLoading,
          rows: ({ mode, groupRows }) => (mode === "edit" ? groupRows : []),
          columns: groupRelationColumns(),
          getRowId: (row) => row.id,
          filterRows: (rows, query) => {
            const needle = query.trim().toLocaleLowerCase();
            if (!needle) return rows;
            return rows.filter((row) =>
              [row.name, row.description ?? ""].join(" ").toLocaleLowerCase().includes(needle),
            );
          },
          searchPlaceholder: "Pesquisar",
          onRowClick: (row, context) => context.onOpenGroup(row.id),
          action: {
            label: "Novo grupo",
            onClick: (context) => context.onCreateGroup(),
            hidden: ({ readOnly, mode, canManageStructure }) =>
              readOnly || mode !== "edit" || !canManageStructure,
          },
          emptyLabel: ({ mode }) =>
            mode === "create" ? "Salve o projeto para gerenciar grupos." : "Nenhum grupo vinculado.",
        },
      ],
    },
    {
      key: "actions",
      label: "Acoes",
      badge: ({ actionRows }) => actionRows.length,
      relations: [
        {
          key: "project.actions",
          label: "Acoes",
          loading: ({ relationsLoading }) => relationsLoading,
          rows: ({ mode, actionRows }) => (mode === "edit" ? actionRows : []),
          columns: actionRelationColumns(),
          getRowId: (row) => row.id,
          filterRows: (rows, query) => {
            const needle = query.trim().toLocaleLowerCase();
            if (!needle) return rows;
            return rows.filter((row) => {
              const haystack = [
                row.title,
                row.actionType?.name ?? "",
                row.group?.name ?? "",
                row.cycle?.name ?? "",
                formatActionStatus(row.status),
                formatPeriod(row.plannedStartAt, row.plannedEndAt),
              ]
                .join(" ")
                .toLocaleLowerCase();
              return haystack.includes(needle);
            });
          },
          searchPlaceholder: "Pesquisar",
          onRowClick: (row, context) => context.onOpenAction(row.id),
          action: {
            label: "Nova acao",
            onClick: (context) => context.onCreateAction(),
            hidden: ({ readOnly, mode, canManageActions }) =>
              readOnly || mode !== "edit" || !canManageActions,
          },
          emptyLabel: ({ mode }) =>
            mode === "create" ? "Salve o projeto para gerenciar acoes." : "Nenhuma acao vinculada.",
        },
      ],
    },
  ],
  auditSources: {
    primaryEntity: {
      key: "project",
      entity: "Project",
      model: "audit.logs",
      label: "Projeto",
      fieldLabels: PROJECT_AUDIT_FIELD_LABELS,
      valueFormatters: {
        programId: (_, options) => options.context.selectedProgram?.name ?? "-",
        status: (value) => formatProjectStatus(typeof value === "string" ? value : null),
        startsAt: (value) => (typeof value === "string" && value ? formatDateOnlyPtBR(value) : "-"),
        endsAt: (value) => (typeof value === "string" && value ? formatDateOnlyPtBR(value) : "-"),
      },
      resolveEntityId: ({ project }) => project?.id,
    },
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
