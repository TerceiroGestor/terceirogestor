"use client";

import * as React from "react";
import { TriangleAlert } from "lucide-react";
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
import { RichText } from "@/components/ui/richtext/RichText";
import { resolveMediaUrl } from "@/lib/api";
import type {
  ActionAttendanceSummaryItem,
  ApiMeeting,
  ApiActivity,
  ApiActivityType,
  ApiProjectActionPeopleParticipation,
  MeetingAttendancesListItem,
  ActivityInput,
  ActionStatus,
} from "@/modules/actions/api";
import { listActivityTypes } from "@/modules/actions/api";
import {
  ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS,
  ACTION_STATUS_LABELS,
  ACTION_STATUS_OPTIONS,
} from "@/modules/actions/shared/domain/actions.constants";
import { ActionCreateFormSection } from "@/modules/actions/features/create/ui/action-create-form-section";
import { ACTION_RELATION_TEXT } from "@/modules/actions/features/manage/config/action-relations.constants";
import { ActionOccurrencesSection } from "@/modules/actions/features/manage/ui/action-occurrences-section";
import { ActionReportPreview } from "@/modules/actions/features/manage/ui/action-report-preview";
import {
  QualityNotesDialog,
  buildQualityColumns,
  countAttendanceHighlights,
  type QualityDraft,
  type QualityNotesDialogState,
} from "@/modules/actions/features/manage/ui/action-operational-relations";
import {
  getProject,
  listProjectGoals,
  listProjectPeopleGroups,
  type ApiGoal,
  type ApiProjectPeopleGroup,
} from "@/modules/projects/api";
import { SectionCard } from "@/components/section-card";
import { MultiSelectBadges } from "@/web-client/ui/MultiSelectBadges";
import { DetailSectionField, DetailSectionHeading } from "@/web-client/detail/DetailFormSection";
import { StandardDetailMetadataSide } from "@/web-client/detail/StandardDetailMetadataSide";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import type {
  DetailHeaderActionConfig,
  DetailLayoutConfig,
} from "@/web-client/registry/types";

const AUTO_SAVE_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

const NONE_VALUE = "__none__";

const lineInputClassName =
  "h-10 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0";

const ACTION_DETAIL_SECTION_CLASS = "border-b border-border/60 bg-transparent px-0 py-4";

const ACTION_AUDIT_FIELD_LABELS = {
  title: "Título",
  description: "Descrição",
  pedagogicalPlanHtml: "Plano pedagógico",
  tags: "Tags",
  internalNotes: "Notas",
  planHtml: "Planejamento",
  executedHtml: "Execução",
  conclusionHtml: "Conclusão",
  completionPercent: "Progresso",
  photoPaths: "Fotos",
  status: "Status",
  plannedStartAt: "Início planejado",
  plannedEndAt: "Fim planejado",
  executedStartAt: "Início executado",
  executedEndAt: "Fim executado",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

const ACTION_COMMENT_AUDIT_FIELD_LABELS = {
  body: "Comentário",
  mentionUserIds: "Menções",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

const ACTION_ATTACHMENT_AUDIT_FIELD_LABELS = {
  label: "Anexo",
  filePath: "Arquivo",
  mimeType: "Tipo",
  fileSizeBytes: "Tamanho",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

function formatStatus(value: string | null | undefined) {
  if (!value) return "-";
  return ACTION_STATUS_LABELS[value as keyof typeof ACTION_STATUS_LABELS] ?? value;
}

function filterTeamRows(
  rows: ApiProjectActionPeopleParticipation[],
  query: string,
) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [
      row.person.fullName,
      row.person.status,
      ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS[row.role],
      row.enrollment?.role ?? null,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLocaleLowerCase("pt-BR"));
    return values.some((value) => value.includes(normalized));
  });
}

function filterAttendanceSummaryRows(rows: ActionAttendanceSummaryItem[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [
      row.enrollment.person.fullName,
      ...row.enrollment.peopleGroups.map((group) => group.name),
    ].map((value) => String(value).toLocaleLowerCase("pt-BR"));
    return values.some((value) => value.includes(normalized));
  });
}

function formatAttendanceRate(value: number | null) {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

function formatAverageQuality(value: number | null) {
  if (value === null) return "—";
  return value.toFixed(1);
}

function buildAttendanceSummaryColumns(): import("@tanstack/react-table").ColumnDef<ActionAttendanceSummaryItem>[] {
  return [
    {
      id: "person",
      header: "Participante",
      accessorFn: (row) => row.enrollment.person.fullName,
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">
            {row.original.enrollment.person.fullName}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.enrollment.peopleGroups.map((group) => group.name).join(", ") || "—"}
          </div>
        </div>
      ),
    },
    {
      id: "frequency",
      header: "Frequência",
      accessorFn: (row) => row.attendanceRate ?? -1,
      cell: ({ row }) => {
        const { attendanceRate, presentCount, totalMeetings } = row.original;
        return (
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">
              {formatAttendanceRate(attendanceRate)}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalMeetings > 0 ? `${presentCount}/${totalMeetings} encontros` : "Sem encontros no período"}
            </div>
          </div>
        );
      },
    },
    {
      id: "quality",
      header: "Média de avaliação",
      accessorFn: (row) => row.averageQuality ?? -1,
      cell: ({ row }) => formatAverageQuality(row.original.averageQuality),
    },
    {
      id: "occurrences",
      header: "Ocorrências",
      accessorFn: (row) => row.occurrencesCount,
      cell: ({ row }) => (
        <span title="Contagem direta de Ocorrencia (Fase 5) ainda nao existe aqui - ver docs/backlog.md">
          {row.original.occurrencesCount || "—"}
        </span>
      ),
    },
  ];
}

function teamParticipationColumns({
  canUpdate,
  onEndTeamParticipation,
}: {
  canUpdate: boolean;
  onEndTeamParticipation: (participationId: string) => Promise<void>;
}): import("@tanstack/react-table").ColumnDef<ApiProjectActionPeopleParticipation>[] {
  return [
    {
      id: "person",
      header: "Pessoa",
      accessorFn: (row) => row.person.fullName,
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{row.original.person.fullName}</div>
          <div className="text-xs text-muted-foreground">{row.original.person.status ?? "-"}</div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Papel",
      accessorFn: (row) => ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS[row.role],
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS[row.original.role]}
        </span>
      ),
    },
    {
      id: "source",
      header: "Origem",
      accessorFn: (row) => row.enrollment?.role ?? "",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.enrollment?.role ?? "Sem participação ativa no projeto"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        canUpdate ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                void onEndTeamParticipation(row.original.id);
              }}
            >
              Encerrar
            </Button>
          </div>
        ) : null,
    },
  ];
}

export type ActivityDetailDraft = {
  actionTypeId: string;
  title: string;
  status: ActionStatus;
  peopleGroupIds: string[];
  goalId: string;
  description: string;
  plannedStartAt: string;
  plannedEndAt: string;
  pedagogicalPlanHtml: string;
  tags: string[];
  internalNotes: string | null;
};

function ActivityDetailMain({
  action,
  draft,
  setDraft,
  readOnly,
  onCommitField,
  token,
}: Pick<ActionsDetailLayoutContext, "action" | "draft" | "setDraft" | "readOnly" | "onCommitField" | "token">) {
  const [actionTypes, setActionTypes] = React.useState<ApiActivityType[]>([]);
  const [peopleGroups, setPeopleGroups] = React.useState<ApiProjectPeopleGroup[]>([]);
  const [goals, setGoals] = React.useState<ApiGoal[]>([]);
  const [projectName, setProjectName] = React.useState<string | null>(null);
  const projectId = action?.projectId ?? "";

  React.useEffect(() => {
    if (!token) return;
    listActivityTypes(token, { isActive: true })
      .then(setActionTypes)
      .catch(() => setActionTypes([]));
  }, [token]);

  React.useEffect(() => {
    if (!token || !projectId) {
      setPeopleGroups([]);
      setGoals([]);
      setProjectName(null);
      return;
    }
    Promise.all([
      listProjectPeopleGroups(token, projectId, { participationKind: "PARTICIPANT" }),
      listProjectGoals(token, projectId),
      getProject(token, projectId),
    ])
      .then(([nextPeopleGroups, nextGoals, project]) => {
        setPeopleGroups(nextPeopleGroups);
        setGoals(nextGoals);
        setProjectName(project.name);
      })
      .catch(() => {
        setPeopleGroups([]);
        setGoals([]);
        setProjectName(null);
      });
  }, [token, projectId]);

  const selectedType =
    actionTypes.find((type) => type.id === draft.actionTypeId) ?? action?.actionType ?? null;
  const isPeopleGroupTarget = selectedType?.target === "PEOPLE_GROUP";

  return (
    <div className={ACTION_DETAIL_SECTION_CLASS}>
      <div className="grid gap-6 md:grid-cols-[1.5fr_180px_200px_220px] md:items-end">
        <DetailSectionField label="Título">
          <Input
            value={draft.title}
            onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
            onBlur={() => onCommitField("title")}
            className={lineInputClassName}
            readOnly={readOnly}
          />
        </DetailSectionField>

        <DetailSectionField label="Status">
          <Select
            value={draft.status}
            onValueChange={(next) => {
              const nextValue = next as ActionStatus;
              setDraft((previous) => ({ ...previous, status: nextValue }));
              onCommitField("status", nextValue);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={lineInputClassName}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DetailSectionField>

        <DetailSectionField label="Tipo">
          <Select
            value={draft.actionTypeId}
            onValueChange={(next) => {
              setDraft((previous) => ({ ...previous, actionTypeId: next }));
              onCommitField("actionTypeId", next);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={lineInputClassName}>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {actionTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DetailSectionField>

        <DetailSectionField label="Projeto">
          <div className="flex h-10 items-center border-b border-border/60 text-sm text-muted-foreground">
            {projectName ?? "-"}
          </div>
        </DetailSectionField>
      </div>

      <div className="mt-6 space-y-4">
        <DetailSectionHeading title="Direcionamento" />
        <div className="grid gap-6 xl:grid-cols-2">
          <DetailSectionField label="Grupos de pessoas">
            {!isPeopleGroupTarget ? (
              <div className="flex h-10 items-center border-b border-border/60 text-sm text-muted-foreground">
                Esse tipo de atividade não usa grupo de pessoas.
              </div>
            ) : (
              <MultiSelectBadges
                options={peopleGroups.map((row) => ({
                  value: row.peopleGroupId,
                  label: row.peopleGroup?.name ?? "",
                }))}
                selectedValues={draft.peopleGroupIds}
                onChange={(next) => {
                  setDraft((previous) => ({ ...previous, peopleGroupIds: next }));
                  onCommitField("peopleGroupIds", next);
                }}
                disabled={readOnly}
                addLabel="Adicionar grupo"
                searchPlaceholder="Pesquisar grupo..."
                noOptionsLabel="Nenhum grupo disponível neste projeto."
                emptyLabel="Nenhum grupo selecionado."
              />
            )}
          </DetailSectionField>

          <DetailSectionField label="Meta (Plano de Trabalho)">
            <Select
              value={draft.goalId || NONE_VALUE}
              onValueChange={(next) => {
                const nextValue = next === NONE_VALUE ? "" : next;
                setDraft((previous) => ({ ...previous, goalId: nextValue }));
                onCommitField("goalId", nextValue);
              }}
              disabled={readOnly}
            >
              <SelectTrigger className={lineInputClassName}>
                <SelectValue placeholder="Sem meta vinculada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Sem meta vinculada</SelectItem>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DetailSectionField>
        </div>
      </div>

      <div className="mt-6">
        <DetailSectionField label="Descrição">
          <Textarea
            rows={3}
            value={draft.description}
            onChange={(event) => setDraft((previous) => ({ ...previous, description: event.target.value }))}
            onBlur={() => onCommitField("description")}
            readOnly={readOnly}
            placeholder="Resumo curto sobre a atividade."
          />
        </DetailSectionField>
      </div>

      <div className="mt-6">
        <ActivityPlanningSection
          draft={draft}
          setDraft={setDraft}
          readOnly={readOnly}
          onCommitField={onCommitField}
        />
      </div>
    </div>
  );
}

function ActivityPlanningSection({
  draft,
  setDraft,
  readOnly,
  onCommitField,
}: Pick<ActionsDetailLayoutContext, "draft" | "setDraft" | "readOnly" | "onCommitField">) {
  return (
    <div className="space-y-4">
      <DetailSectionHeading title="Planejamento" />
      <div className="grid gap-6 xl:grid-cols-2">
        <DetailSectionField label="Início planejado">
          <Input
            type="date"
            value={draft.plannedStartAt}
            onChange={(event) => setDraft((previous) => ({ ...previous, plannedStartAt: event.target.value }))}
            onBlur={() => onCommitField("plannedStartAt")}
            className={lineInputClassName}
            readOnly={readOnly}
          />
        </DetailSectionField>

        <DetailSectionField label="Fim planejado">
          <Input
            type="date"
            value={draft.plannedEndAt}
            onChange={(event) => setDraft((previous) => ({ ...previous, plannedEndAt: event.target.value }))}
            onBlur={() => onCommitField("plannedEndAt")}
            className={lineInputClassName}
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>

      <DetailSectionField label="Plano pedagógico">
        <RichText
          value={draft.pedagogicalPlanHtml}
          onChange={(next) => {
            setDraft((previous) => ({ ...previous, pedagogicalPlanHtml: next }));
          }}
          onBlur={() => onCommitField("pedagogicalPlanHtml")}
          disabled={readOnly}
        />
      </DetailSectionField>
    </div>
  );
}

function ActionProgressSection({
  action,
  readOnly,
  saving,
  onSave,
}: {
  action: ApiActivity | null;
  readOnly: boolean;
  saving: boolean;
  onSave: (patch: Partial<ActivityInput>) => Promise<void>;
}) {
  const [progressDraft, setProgressDraft] = React.useState({
    completionPercent:
      action?.completionPercent === null || action?.completionPercent === undefined
        ? ""
        : String(action.completionPercent),
  });

  React.useEffect(() => {
    setProgressDraft({
      completionPercent:
        action?.completionPercent === null || action?.completionPercent === undefined
          ? ""
          : String(action.completionPercent),
    });
  }, [action]);

  return (
    <div className="space-y-4">
      <DetailSectionHeading title="Progresso" />
      <div className="grid gap-6 xl:grid-cols-[240px_1fr]">
        <DetailSectionField label="% atingido">
          <Input
            type="number"
            min="0"
            max="100"
            value={progressDraft.completionPercent}
            onChange={(event) =>
              setProgressDraft((previous) => ({ ...previous, completionPercent: event.target.value }))
            }
            className={lineInputClassName}
            readOnly={readOnly || saving}
          />
        </DetailSectionField>
        <div />
      </div>

      {!readOnly ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() =>
              void onSave({
                completionPercent: progressDraft.completionPercent.trim()
                  ? Number(progressDraft.completionPercent)
                  : null,
              })
            }
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar progresso"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export type ActionsDetailLayoutContext = DetailShellAuditContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  canAudit: boolean;
  canUpdate: boolean;
  canReadStructure: boolean;
  canReadPeople: boolean;
  canReadPeopleIdentity: boolean;
  tenantSlug: string;
  token: string;
  projectId: string;
  action: ApiActivity | null;
  occurrences: ApiMeeting[];
  selectedOccurrence: ApiMeeting | null;
  draft: ActivityDetailDraft;
  setDraft: React.Dispatch<React.SetStateAction<ActivityDetailDraft>>;
  mentionableUsers: Array<{
    id: string;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
  }>;
  attachmentUploading: boolean;
  reportRows: MeetingAttendancesListItem[];
  reportPeopleRows: ApiProjectActionPeopleParticipation[];
  reportLoading: boolean;
  reportError: string | null;
  occurrenceId: string | null;
  occurrenceOptions: Array<{ label: string; value: string }>;
  onOccurrenceIdChange: (value: string) => void;
  attendanceGroupOptions: Array<{
    label: string;
    value: string;
  }>;
  qualityGroupId: string;
  qualityDrafts: Record<string, QualityDraft>;
  qualitySaving: boolean;
  qualityNotesDialog: QualityNotesDialogState | null;
  qualityRows: MeetingAttendancesListItem[];
  attendanceSummaryRows: ActionAttendanceSummaryItem[];
  attendanceSummaryLoading: boolean;
  attendanceSummaryError: string | null;
  attendanceSummaryFrom: string;
  attendanceSummaryTo: string;
  onAttendanceSummaryFromChange: (value: string) => void;
  onAttendanceSummaryToChange: (value: string) => void;
  onCommitField: <K extends keyof ActivityDetailDraft>(
    field: K,
    nextValue?: ActivityDetailDraft[K],
  ) => void;
  onUploadAttachment: () => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onSaveActionPatch: (patch: Partial<ActivityInput>) => Promise<void>;
  onActionLoaded: (action: ApiActivity) => void;
  onOpenTeamPicker: () => void;
  onEndTeamParticipation: (participationId: string) => Promise<void>;
  onQualityGroupChange: (value: string) => void;
  getQualityEffective: (row: MeetingAttendancesListItem) => {
    qualityScore: number | null;
    qualityNotes: string | null;
    isHighlight: boolean;
  };
  setQualityRowDraft: (
    row: MeetingAttendancesListItem,
    patch: QualityDraft,
    prune?: boolean,
  ) => void;
  saveQualityDrafts: () => void;
  onQualityNotesDialogChange: (state: QualityNotesDialogState | null) => void;
  applyQualityNotesDialog: (state: QualityNotesDialogState) => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

const ACTIVITY_DETAIL_HEADER_ACTIONS: DetailHeaderActionConfig<ActionsDetailLayoutContext>[] =
  [
    {
      key: "occurrence",
      label: "Registrar ocorrência",
      tooltip: "Registrar ocorrência vinculada a esta atividade",
      icon: <TriangleAlert className="h-4 w-4" />,
      variant: "outline",
      hidden: ({ mode }) => mode !== "edit",
      href: ({ projectId, action }) =>
        `/occurrences/new?projectId=${projectId}&actionId=${action?.id ?? ""}`,
    },
  ];

export const actionsDetailLayout: DetailLayoutConfig<ActionsDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  header: {
    actions: ACTIVITY_DETAIL_HEADER_ACTIONS,
  },
  mainTab: true,
  main: ({ mode, action, projectId, onActionLoaded, draft, setDraft, readOnly, onCommitField, token }) => {
    if (mode === "create") {
      return (
        <ActionCreateFormSection
          mode={mode}
          action={action}
          projectId={projectId}
          actionId={action?.id}
          onSaved={onActionLoaded}
        />
      );
    }
    return (
      <ActivityDetailMain
        action={action}
        draft={draft}
        setDraft={setDraft}
        readOnly={readOnly}
        onCommitField={onCommitField}
        token={token}
      />
    );
  },
  tabTemplates: [
    {
      key: "participants",
      label: ACTION_RELATION_TEXT.participants.tabLabel,
      visible: ({ mode }) => mode === "edit",
      badge: ({ attendanceSummaryRows }) => attendanceSummaryRows.length || undefined,
      relations: [
        {
          key: "participants-summary",
          label: "Resumo de participação (todos os encontros do período)",
          variant: "informational",
          loading: ({ attendanceSummaryLoading }) => attendanceSummaryLoading,
          error: ({ attendanceSummaryError }) => attendanceSummaryError,
          rows: ({ attendanceSummaryRows }) => attendanceSummaryRows,
          columns: () => buildAttendanceSummaryColumns(),
          getRowId: (row) => row.enrollment.id,
          searchable: true,
          searchPlaceholder: "Pesquisar participante",
          filterRows: (rows, query) => filterAttendanceSummaryRows(rows, query),
          filters: [
            {
              key: "period",
              label: "Período",
              type: "dateRange",
              value: ({ attendanceSummaryFrom, attendanceSummaryTo }) => ({
                from: attendanceSummaryFrom,
                to: attendanceSummaryTo,
              }),
              onChange: ({ onAttendanceSummaryFromChange, onAttendanceSummaryToChange }, range) => {
                onAttendanceSummaryFromChange(range.from);
                onAttendanceSummaryToChange(range.to);
              },
            },
          ],
          stats: [
            {
              key: "total",
              label: "Participantes",
              value: ({ attendanceSummaryRows }) => attendanceSummaryRows.length,
            },
            {
              key: "filtered",
              label: "Filtrados",
              value: (_context, rows) => rows.length,
            },
          ],
          emptyLabel: "Sem participantes elegíveis no período selecionado.",
        },
      ],
      emptyLabel: "Sem participantes.",
    },
    {
      key: "occurrences",
      label: "Encontros",
      visible: ({ mode }) => mode === "edit",
      badge: ({ occurrences }) => occurrences.length || undefined,
      content: ({ action, projectId, token, readOnly }) =>
        action ? (
          <ActionOccurrencesSection
            token={token}
            projectId={projectId}
            actionId={action.id}
            readOnly={readOnly}
          />
        ) : null,
      emptyLabel: "Sem encontros.",
    },
    {
      key: "quality",
      label: ACTION_RELATION_TEXT.quality.tabLabel,
      visible: ({ mode }) => mode === "edit",
      badge: ({ qualityRows }) => qualityRows.length || undefined,
      content: ({ qualityNotesDialog, canUpdate, onQualityNotesDialogChange, applyQualityNotesDialog }) => (
        <QualityNotesDialog
          state={qualityNotesDialog}
          canUpdate={canUpdate}
          onOpenChange={(open) => {
            if (!open) onQualityNotesDialogChange(null);
          }}
          onStateChange={onQualityNotesDialogChange}
          onConfirm={applyQualityNotesDialog}
        />
      ),
      relations: [
        {
          key: "participants-quality",
          label: ACTION_RELATION_TEXT.quality.relationLabel,
          variant: "operational",
          loading: ({ reportLoading }) => reportLoading,
          error: ({ reportError }) => reportError,
          rows: ({ qualityRows }) => qualityRows,
          columns: ({
            canUpdate,
            canReadPeople,
            tenantSlug,
            getQualityEffective,
            setQualityRowDraft,
            onQualityNotesDialogChange,
          }) =>
            buildQualityColumns({
              canUpdate,
              canReadPeople,
              tenantSlug,
              getEffective: getQualityEffective,
              onSetRowDraft: setQualityRowDraft,
              onOpenNotesDialog: (row) =>
                onQualityNotesDialogChange({
                  enrollmentId: row.enrollment.id,
                  fullName: row.enrollment.person.fullName,
                  qualityNotes: getQualityEffective(row).qualityNotes ?? "",
                }),
            }),
          getRowId: (row) => row.enrollment.id,
          searchable: true,
          searchPlaceholder: ACTION_RELATION_TEXT.quality.searchPlaceholder,
          filters: [
            {
              key: "occurrence",
              label: "Encontro",
              type: "select",
              value: ({ occurrenceId }) => occurrenceId ?? "",
              onChange: ({ onOccurrenceIdChange }, value) => onOccurrenceIdChange(value),
              options: ({ occurrenceOptions }) => occurrenceOptions,
            },
            {
              key: "group",
              label: ACTION_RELATION_TEXT.quality.groupFilterLabel,
              type: "select",
              value: ({ qualityGroupId }) => qualityGroupId,
              onChange: ({ onQualityGroupChange }, value) => onQualityGroupChange(value),
              options: ({ attendanceGroupOptions }) => attendanceGroupOptions,
            },
          ],
          stats: [
            {
              key: "tracked",
              label: ACTION_RELATION_TEXT.quality.stats.tracked,
              value: ({ reportRows }) => reportRows.filter((row) => row.attendance !== null).length,
            },
            {
              key: "filtered",
              label: ACTION_RELATION_TEXT.quality.stats.filtered,
              value: (_context, rows) => rows.length,
            },
            {
              key: "highlights",
              label: ACTION_RELATION_TEXT.quality.stats.highlights,
              value: (_context, rows) => countAttendanceHighlights(rows),
            },
            {
              key: "changed",
              label: ACTION_RELATION_TEXT.quality.stats.changed,
              value: ({ qualityDrafts }) => Object.keys(qualityDrafts).length,
            },
          ],
          primaryAction: {
            label: ACTION_RELATION_TEXT.quality.save,
            onClick: ({ saveQualityDrafts }) => saveQualityDrafts(),
            hidden: ({ canUpdate }) => !canUpdate,
            disabled: ({ qualityDrafts, qualitySaving }) =>
              qualitySaving || Object.keys(qualityDrafts).length === 0,
          },
          emptyLabel: "Nenhuma pessoa com presença registrada.",
        },
      ],
      emptyLabel: "Sem qualidade.",
    },
    {
      key: "team",
      label: "Equipe",
      visible: ({ mode }) => mode === "edit",
      badge: ({ reportPeopleRows }) => reportPeopleRows.length || undefined,
      content: () => null,
      relations: [
        {
          key: "team-people",
          label: "Equipe",
          rows: ({ reportPeopleRows }) => reportPeopleRows,
          columns: ({ canUpdate, onEndTeamParticipation }) =>
            teamParticipationColumns({ canUpdate, onEndTeamParticipation }),
          getRowId: (row) => row.id,
          searchable: true,
          searchPlaceholder: "Pesquisar equipe",
          filterRows: (rows, query) => filterTeamRows(rows, query),
          action: {
            label: "Nova pessoa",
            onClick: ({ onOpenTeamPicker }) => onOpenTeamPicker(),
            hidden: ({ canUpdate }) => !canUpdate,
          },
          emptyLabel: "Nenhuma pessoa de apoio registrada. Gestor e Educador/Executor também entram por aqui (papéis Responsável técnico e Facilitador).",
        },
      ],
      emptyLabel: "Sem equipe.",
    },
    {
      key: "progress",
      label: "Progresso e Relatório",
      visible: ({ mode }) => mode === "edit",
      content: ({
        action,
        readOnly,
        attachmentUploading,
        onSaveActionPatch,
        selectedOccurrence,
        reportRows,
        reportPeopleRows,
        reportLoading,
        reportError,
        canReadPeople,
      }) => (
        <div className="space-y-6">
          <ActionProgressSection
            action={action}
            readOnly={readOnly}
            saving={attachmentUploading}
            onSave={onSaveActionPatch}
          />
          <SectionCard title="Relatório">
            {reportError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {reportError}
              </div>
            ) : null}
            {reportLoading ? <p className="text-xs text-muted-foreground">Carregando...</p> : null}
            {!reportLoading && !selectedOccurrence ? (
              <p className="text-xs text-muted-foreground">
                Nenhum encontro agendado ainda — o relatório é gerado a partir de um Encontro.
              </p>
            ) : null}
            {action && selectedOccurrence ? (
              <ActionReportPreview
                action={action}
                occurrence={selectedOccurrence}
                rows={reportRows}
                peopleParticipations={reportPeopleRows}
                canShowPeople={canReadPeople}
              />
            ) : null}
          </SectionCard>
        </div>
      ),
      emptyLabel: "Sem progresso registrado.",
    },
  ],
  side: ({
    mode,
    canAudit,
    readOnly,
    action,
    draft,
    setDraft,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    mentionableUsers,
    attachmentUploading,
    onCommitField,
    onUploadAttachment,
    onDeleteAttachment,
  }) => (
    <StandardDetailMetadataSide
      mode={mode}
      readOnly={readOnly}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      canAudit={canAudit}
      notes={{
        value: draft.internalNotes,
        onChange: (next) => setDraft((previous) => ({ ...previous, internalNotes: next })),
        onBlur: () => onCommitField("internalNotes"),
        readOnly,
        placeholder: "Notas sobre esta atividade. Use @ para mencionar alguém.",
        richText: true,
        mentionUsers: mentionableUsers,
      }}
      tags={{
        value: draft.tags,
        onChange: (nextTags) => setDraft((previous) => ({ ...previous, tags: nextTags })),
        onCommit: (next) => onCommitField("tags", next),
        readOnly,
        emptyLabel: mode === "create" ? "Salve para habilitar tags." : "Nenhuma tag.",
      }}
      attachments={{
        items: (action?.attachments ?? []).map((attachment) => ({
          id: attachment.id,
          label: attachment.label,
          href: resolveMediaUrl(attachment.filePath),
          description: attachment.uploadedBy?.name
            ? `Enviado por ${attachment.uploadedBy.name}`
            : "Anexo da atividade",
          mimeType: attachment.mimeType ?? null,
          sizeLabel:
            typeof attachment.fileSizeBytes === "number" && attachment.fileSizeBytes > 0
              ? attachment.fileSizeBytes >= 1024 * 1024
                ? `${(attachment.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
                : attachment.fileSizeBytes >= 1024
                  ? `${Math.round(attachment.fileSizeBytes / 1024)} KB`
                  : `${attachment.fileSizeBytes} B`
              : null,
          statusLabel: attachment.createdAt ? attachment.createdAt.slice(0, 16).replace("T", ", ") : null,
        })),
        onUpload: mode === "edit" && !readOnly ? onUploadAttachment : undefined,
        onDelete: mode === "edit" && !readOnly ? onDeleteAttachment : undefined,
        readOnly: readOnly || mode !== "edit",
        emptyLabel:
          mode === "create"
            ? "Salve para habilitar anexos."
            : attachmentUploading
              ? "Enviando anexo..."
              : "Nenhum anexo.",
      }}
      tabOrder={["tags", "notes", "attachments", "activity"]}
      defaultTab="activity"
    />
  ),
  auditSources: {
    primaryEntity: {
      key: "action",
      entity: "Activity",
      model: "audit.logs",
      label: "Atividade",
      fieldLabels: ACTION_AUDIT_FIELD_LABELS,
      valueFormatters: {
        status: (value) => formatStatus(typeof value === "string" ? value : null),
      },
      resolveEntityId: ({ action }) => action?.id,
    },
    relatedEntities: [
      {
        key: "actionComment",
        entity: "ProjectActionComment",
        model: "audit.logs",
        label: "Comentário",
        fieldLabels: ACTION_COMMENT_AUDIT_FIELD_LABELS,
        resolveEntityIds: ({ action }) => (action?.comments ?? []).map((comment) => comment.id),
      },
      {
        key: "actionAttachment",
        entity: "ProjectActionAttachment",
        model: "audit.logs",
        label: "Anexo",
        fieldLabels: ACTION_ATTACHMENT_AUDIT_FIELD_LABELS,
        resolveEntityIds: ({ action }) => (action?.attachments ?? []).map((attachment) => attachment.id),
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
