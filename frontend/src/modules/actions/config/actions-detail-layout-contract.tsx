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
  ApiActivity,
  ApiActivityType,
  ApiProjectActionPeopleParticipation,
  ActionStatus,
} from "@/modules/actions/api";
import { listActivityTypes } from "@/modules/actions/api";
import {
  ACTION_STATUS_LABELS,
  ACTION_STATUS_OPTIONS,
} from "@/modules/actions/shared/domain/actions.constants";
import { ACTION_RELATION_TEXT } from "@/modules/actions/features/manage/config/action-relations.constants";
import { ActionOccurrencesSection } from "@/modules/actions/features/manage/ui/action-occurrences-section";
import { ActionParticipantsSection } from "@/modules/actions/features/manage/ui/action-participants-section";
import { ActionTeamSection } from "@/modules/actions/features/manage/ui/action-team-section";
import {
  getProject,
  listProjectGoals,
  listProjectPeopleGroups,
  listProjects,
  type ApiGoal,
  type ApiProject,
  type ApiProjectPeopleGroup,
} from "@/modules/projects/api";
import { MultiSelectBadges } from "@/web-client/ui/MultiSelectBadges";
import {
  DetailSectionField,
  DetailSectionHeading,
  DETAIL_LINE_INPUT_CLASS_NAME,
  DETAIL_LINE_TEXTAREA_CLASS_NAME,
} from "@/web-client/detail/DetailFormSection";
import { cn } from "@/lib/utils";
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


const ACTION_DETAIL_SECTION_CLASS = "border-b border-border/60 bg-transparent px-4 py-4";

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
  mode,
  action,
  projectId: contextProjectId,
  onProjectIdChange,
  draft,
  setDraft,
  readOnly,
  onCommitField,
  token,
}: Pick<
  ActionsDetailLayoutContext,
  "mode" | "action" | "projectId" | "onProjectIdChange" | "draft" | "setDraft" | "readOnly" | "onCommitField" | "token"
>) {
  const [actionTypes, setActionTypes] = React.useState<ApiActivityType[]>([]);
  const [peopleGroups, setPeopleGroups] = React.useState<ApiProjectPeopleGroup[]>([]);
  const [goals, setGoals] = React.useState<ApiGoal[]>([]);
  const [projectName, setProjectName] = React.useState<string | null>(null);
  const [projects, setProjects] = React.useState<ApiProject[]>([]);
  const projectId = action?.projectId ?? contextProjectId;
  const canChooseProject = mode === "create";

  React.useEffect(() => {
    if (!token) return;
    listActivityTypes(token, { isActive: true })
      .then(setActionTypes)
      .catch(() => setActionTypes([]));
  }, [token]);

  React.useEffect(() => {
    if (!token || !canChooseProject) return;
    listProjects(token, { all: true, limit: 200 })
      .then((response) => setProjects(response.data ?? []))
      .catch(() => setProjects([]));
  }, [token, canChooseProject]);

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

  return (
    <div className={ACTION_DETAIL_SECTION_CLASS}>
      <div className="grid gap-6 md:grid-cols-[1.5fr_180px_200px_220px] md:items-end">
        <DetailSectionField label="Título" required>
          <Input
            value={draft.title}
            onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
            onBlur={() => onCommitField("title")}
            className={DETAIL_LINE_INPUT_CLASS_NAME}
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
            <SelectTrigger className={DETAIL_LINE_INPUT_CLASS_NAME}>
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

        <DetailSectionField label="Tipo" required>
          <Select
            value={draft.actionTypeId}
            onValueChange={(next) => {
              setDraft((previous) => ({ ...previous, actionTypeId: next }));
              onCommitField("actionTypeId", next);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={DETAIL_LINE_INPUT_CLASS_NAME}>
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

        <DetailSectionField label="Projeto" required={canChooseProject}>
          {canChooseProject ? (
            <Select
              value={projectId || NONE_VALUE}
              onValueChange={(next) => onProjectIdChange?.(next === NONE_VALUE ? "" : next)}
              disabled={readOnly}
            >
              <SelectTrigger className={DETAIL_LINE_INPUT_CLASS_NAME}>
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Selecione um projeto</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex h-10 items-center border-b border-border/60 text-sm text-muted-foreground">
              {projectName ?? "-"}
            </div>
          )}
        </DetailSectionField>
      </div>

      <div className="mt-6 space-y-4">
        <DetailSectionHeading title="Direcionamento" />
        <div className="grid gap-6 xl:grid-cols-2">
          <DetailSectionField label="Grupos">
            {/* Disponível em todo tipo de Atividade (revisão da estrutura de
                Projetos, 2026-11-24) - adicionar um Grupo aqui já vincula
                cada membro como participante direto (ver aba
                "Participantes"), sem exigência por `actionType.target`. */}
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
              addLabel="Adicionar Grupos"
              searchPlaceholder="Pesquisar Grupos..."
              noOptionsLabel="Nenhum Grupos disponível neste projeto."
              emptyLabel="Nenhum Grupos selecionado."
            />
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
              <SelectTrigger className={DETAIL_LINE_INPUT_CLASS_NAME}>
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
            className={cn(DETAIL_LINE_TEXTAREA_CLASS_NAME, "min-h-[80px]")}
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
            className={DETAIL_LINE_INPUT_CLASS_NAME}
            readOnly={readOnly}
          />
        </DetailSectionField>

        <DetailSectionField label="Fim planejado">
          <Input
            type="date"
            value={draft.plannedEndAt}
            onChange={(event) => setDraft((previous) => ({ ...previous, plannedEndAt: event.target.value }))}
            onBlur={() => onCommitField("plannedEndAt")}
            className={DETAIL_LINE_INPUT_CLASS_NAME}
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
  onProjectIdChange?: (projectId: string) => void;
  action: ApiActivity | null;
  draft: ActivityDetailDraft;
  setDraft: React.Dispatch<React.SetStateAction<ActivityDetailDraft>>;
  mentionableUsers: Array<{
    id: string;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
  }>;
  attachmentUploading: boolean;
  reportPeopleRows: ApiProjectActionPeopleParticipation[];
  attendanceSummaryRows: ActionAttendanceSummaryItem[];
  attendanceSummaryLoading: boolean;
  attendanceSummaryError: string | null;
  onOpenParticipantPicker: () => void;
  onRemoveParticipant: (participationId: string) => Promise<void>;
  onCommitField: <K extends keyof ActivityDetailDraft>(
    field: K,
    nextValue?: ActivityDetailDraft[K],
  ) => void;
  onUploadAttachment: () => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onActionLoaded: (action: ApiActivity) => void;
  onOpenTeamPicker: () => void;
  onEndTeamParticipation: (participationId: string) => Promise<void>;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

const ACTIVITY_DETAIL_HEADER_ACTIONS: DetailHeaderActionConfig<ActionsDetailLayoutContext>[] =
  [
    {
      key: "occurrence",
      label: "",
      tooltip: "Registrar ocorrência vinculada a esta atividade",
      icon: <TriangleAlert className="h-4 w-4" />,
      variant: "default",
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
  main: ({ mode, action, projectId, onProjectIdChange, draft, setDraft, readOnly, onCommitField, token }) => (
    <ActivityDetailMain
      mode={mode}
      action={action}
      projectId={projectId}
      onProjectIdChange={onProjectIdChange}
      draft={draft}
      setDraft={setDraft}
      readOnly={readOnly}
      onCommitField={onCommitField}
      token={token}
    />
  ),
  tabTemplates: [
    {
      key: "participants",
      label: ACTION_RELATION_TEXT.participants.tabLabel,
      visible: ({ mode }) => mode === "edit",
      badge: ({ attendanceSummaryRows }) => attendanceSummaryRows.length || undefined,
      flushContent: true,
      content: ({
        attendanceSummaryRows,
        attendanceSummaryLoading,
        attendanceSummaryError,
        canUpdate,
        onOpenParticipantPicker,
        onRemoveParticipant,
      }) => (
        <ActionParticipantsSection
          rows={attendanceSummaryRows}
          loading={attendanceSummaryLoading}
          error={attendanceSummaryError}
          canUpdate={canUpdate}
          onOpenParticipantPicker={onOpenParticipantPicker}
          onRemoveParticipant={onRemoveParticipant}
        />
      ),
      emptyLabel: "Sem participantes.",
    },
    {
      key: "occurrences",
      label: "Encontros",
      visible: ({ mode }) => mode === "edit",
      flushContent: true,
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
      key: "team",
      label: "Equipe",
      visible: ({ mode }) => mode === "edit",
      badge: ({ reportPeopleRows }) => reportPeopleRows.length || undefined,
      flushContent: true,
      content: ({ reportPeopleRows, canUpdate, onEndTeamParticipation, onOpenTeamPicker }) => (
        <ActionTeamSection
          rows={reportPeopleRows}
          canUpdate={canUpdate}
          onEndTeamParticipation={onEndTeamParticipation}
          onOpenTeamPicker={onOpenTeamPicker}
        />
      ),
      emptyLabel: "Sem equipe.",
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