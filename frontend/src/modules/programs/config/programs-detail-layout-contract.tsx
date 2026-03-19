"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateOnlyPtBR } from "@/lib/date";
import type { ApiProgram, ProgramStatus, ProgramType } from "@/modules/programs/api";
import {
  PROGRAM_STATUS_LABELS,
  PROGRAM_STATUS_OPTIONS,
  PROGRAM_TYPE_LABELS,
  PROGRAM_TYPE_OPTIONS,
} from "@/modules/programs/shared/domain/programs.constants";
import type { ApiProject } from "@/modules/projects/api/types/projects";
import { PROJECT_STATUS_LABELS } from "@/modules/projects/shared/domain/projects.constants";
import { DetailAuditFeed } from "@/web-client/detail/DetailAuditFeed";
import { DetailNotesPanel } from "@/web-client/detail/DetailNotesPanel";
import { DetailSideTabs } from "@/web-client/detail/DetailSideTabs";
import { buildGroupedAuditFeed } from "@/web-client/detail/audit-feed-utils";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

const PROGRAM_DETAIL_INPUT_CLASS =
  "h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0";
const PROGRAM_DETAIL_TEXTAREA_CLASS =
  "min-h-[180px] rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";
const PROGRAM_DETAIL_SECTION_CLASS =
  "border-y border-border/60 bg-transparent px-0 py-4";

const AUTO_SAVE_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

const PROGRAM_AUDIT_FIELD_LABELS = {
  name: "Nome",
  type: "Tipo",
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

function formatProjectStatus(value: string | null | undefined) {
  if (!value) return "-";
  return PROJECT_STATUS_LABELS[value as keyof typeof PROJECT_STATUS_LABELS] ?? value;
}

function formatPeriod(startsAt: string | null | undefined, endsAt: string | null | undefined) {
  if (!startsAt && !endsAt) return "Nao informada";
  return `${startsAt ? formatDateOnlyPtBR(startsAt) : "-"} ate ${endsAt ? formatDateOnlyPtBR(endsAt) : "-"}`;
}

function resolveStatusBadge(status: ProgramStatus) {
  const label = formatProgramStatus(status);
  switch (status) {
    case "ACTIVE":
      return <Badge variant="secondary">{label}</Badge>;
    case "CLOSED":
      return <Badge variant="outline">{label}</Badge>;
    default:
      return <Badge className="border-transparent bg-blue-600 text-white">{label}</Badge>;
  }
}

function projectRelationColumns(): ColumnDef<ApiProject, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: "Projeto",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.description?.trim() || "Sem descricao"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => formatProjectStatus(row.original.status),
    },
    {
      accessorKey: "startsAt",
      header: "Periodo",
      cell: ({ row }) => formatPeriod(row.original.startsAt, row.original.endsAt),
    },
  ];
}

export type ProgramDetailDraft = {
  name: string;
  type: ProgramType;
  status: ProgramStatus;
  startsAt: string;
  endsAt: string;
  description: string;
  internalNotes: string | null;
};

export type ProgramsDetailLayoutContext = DetailShellAuditContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  canAudit: boolean;
  canEdit: boolean;
  program: ApiProgram | null;
  draft: ProgramDetailDraft;
  setDraft: React.Dispatch<React.SetStateAction<ProgramDetailDraft>>;
  projectRows: ApiProject[];
  projectsLoading: boolean;
  onCommitField: <K extends keyof ProgramDetailDraft>(
    field: K,
    nextValue?: ProgramDetailDraft[K],
  ) => void;
  onNotesChange: (next: string | null) => void;
  onNotesBlur: () => void;
  onOpenProject: (projectId: string) => void;
  onCreateProject: () => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

function ProgramsDetailMain({
  draft,
  setDraft,
  readOnly,
  onCommitField,
}: Pick<
  ProgramsDetailLayoutContext,
  "draft" | "setDraft" | "readOnly" | "onCommitField"
>) {
  return (
    <div className={PROGRAM_DETAIL_SECTION_CLASS}>
      <div className="grid gap-3 md:grid-cols-[1.3fr_220px_220px] md:items-end">
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Nome</div>
          <Input
            value={draft.name}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, name: event.target.value }))
            }
            onBlur={() => onCommitField("name")}
            className={PROGRAM_DETAIL_INPUT_CLASS}
            placeholder="Nome do programa"
            readOnly={readOnly}
          />
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Tipo</div>
          <Select
            value={draft.type}
            onValueChange={(value) => {
              setDraft((previous) => ({ ...previous, type: value as ProgramType }));
              onCommitField("type", value as ProgramType);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={PROGRAM_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {PROGRAM_TYPE_OPTIONS.map((option) => (
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
              setDraft((previous) => ({ ...previous, status: value as ProgramStatus }));
              onCommitField("status", value as ProgramStatus);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={PROGRAM_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {PROGRAM_STATUS_OPTIONS.map((option) => (
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
            className={PROGRAM_DETAIL_INPUT_CLASS}
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
            className={PROGRAM_DETAIL_INPUT_CLASS}
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
          className={PROGRAM_DETAIL_TEXTAREA_CLASS}
          placeholder="Descricao, objetivo e contexto do programa"
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

function ProgramsDetailSide({
  mode,
  canAudit,
  readOnly,
  draft,
  projectRows,
  detailAudit,
  auditVisibleCount,
  onAuditVisibleCountChange,
  onNotesChange,
  onNotesBlur,
}: Pick<
  ProgramsDetailLayoutContext,
  | "mode"
  | "canAudit"
  | "readOnly"
  | "draft"
  | "projectRows"
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
                <span className="text-muted-foreground">Tipo</span>
                <span className="text-foreground">{formatProgramType(draft.type)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Status</span>
                <span className="text-foreground">{formatProgramStatus(draft.status)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Projetos</span>
                <span className="text-foreground">{projectRows.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Vigencia</span>
                <span className="text-right text-foreground">
                  {formatPeriod(draft.startsAt || null, draft.endsAt || null)}
                </span>
              </div>
            </div>
          ),
        },
      ]}
      defaultValue="activity"
    />
  );
}

export const programsDetailLayout: DetailLayoutConfig<ProgramsDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  header: {
    title: ({ program, draft, mode }) =>
      mode === "create" ? "Novo programa" : ((program?.name ?? draft.name) || "Programa"),
    slot: ({ draft, projectRows }) => (
      <div className="border-y border-border/60 bg-transparent px-0 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Status</div>
            <div>{resolveStatusBadge(draft.status)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Tipo</div>
            <div className="font-medium text-foreground">{formatProgramType(draft.type)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Projetos</div>
            <div className="font-medium text-foreground">{projectRows.length}</div>
          </div>
        </div>
      </div>
    ),
  },
  main: ({ draft, setDraft, readOnly, onCommitField }) => (
    <ProgramsDetailMain
      draft={draft}
      setDraft={setDraft}
      readOnly={readOnly}
      onCommitField={onCommitField}
    />
  ),
  side: ({
    mode,
    canAudit,
    readOnly,
    draft,
    projectRows,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    onNotesChange,
    onNotesBlur,
  }) => (
    <ProgramsDetailSide
      mode={mode}
      canAudit={canAudit}
      readOnly={readOnly}
      draft={draft}
      projectRows={projectRows}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      onNotesChange={onNotesChange}
      onNotesBlur={onNotesBlur}
    />
  ),
  tabTemplates: [
    {
      key: "projects",
      label: "Projetos",
      badge: ({ projectRows }) => projectRows.length,
      relations: [
        {
          key: "program.projects",
          label: "Projetos vinculados",
          loading: ({ projectsLoading }) => projectsLoading,
          rows: ({ mode, projectRows }) => (mode === "edit" ? projectRows : []),
          columns: projectRelationColumns(),
          getRowId: (row) => row.id,
          filterRows: (rows, query) => {
            const needle = query.trim().toLocaleLowerCase();
            if (!needle) return rows;
            return rows.filter((row) => {
              const haystack = [
                row.name,
                row.description ?? "",
                formatProjectStatus(row.status),
                formatPeriod(row.startsAt, row.endsAt),
              ]
                .join(" ")
                .toLocaleLowerCase();
              return haystack.includes(needle);
            });
          },
          searchPlaceholder: "Pesquisar",
          onRowClick: (row, context) => context.onOpenProject(row.id),
          action: {
            label: "Novo projeto",
            onClick: (context) => context.onCreateProject(),
            hidden: ({ readOnly, mode }) => readOnly || mode !== "edit",
          },
          emptyLabel: ({ mode }) =>
            mode === "create"
              ? "Salve o programa para vincular projetos."
              : "Nenhum projeto vinculado.",
        },
      ],
    },
  ],
  auditSources: {
    primaryEntity: {
      key: "program",
      entity: "Program",
      model: "audit.logs",
      label: "Programa",
      fieldLabels: PROGRAM_AUDIT_FIELD_LABELS,
      valueFormatters: {
        type: (value) => formatProgramType(typeof value === "string" ? value : null),
        status: (value) => formatProgramStatus(typeof value === "string" ? value : null),
        startsAt: (value) => (typeof value === "string" && value ? formatDateOnlyPtBR(value) : "-"),
        endsAt: (value) => (typeof value === "string" && value ? formatDateOnlyPtBR(value) : "-"),
      },
      resolveEntityId: ({ program }) => program?.id,
    },
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
