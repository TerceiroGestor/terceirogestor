"use client";

import * as React from "react";
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
import { resolveMediaUrl } from "@/lib/api";
import type { ApiProject, ProjectStatus } from "@/modules/projects/api";
import type { ApiProjectEnrollment } from "@/modules/projects/api";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_OPTIONS } from "@/modules/projects/shared/domain/projects.constants";
import type { ApiProgram, ProgramStatus, ProgramType } from "@/modules/programs/api";
import {
  PROGRAM_TYPE_LABELS,
} from "@/modules/programs/shared/domain/programs.constants";
import type { ApiActivity, ActionStatus } from "@/modules/actions/api";
import { ACTION_STATUS_LABELS } from "@/modules/actions/shared/domain/actions.constants";
import { ProjectActionsSection } from "@/modules/projects/features/detail/ui/project-actions-section";
import { ProjectFundingSourcesSection } from "@/modules/projects/features/detail/ui/project-funding-sources-section";
import { ProjectGoalsSection } from "@/modules/projects/features/detail/ui/project-goals-section";
import { ProjectParticipantsSection } from "@/modules/projects/features/detail/ui/project-participants-section";
import { ProjectPeopleGroupsSection } from "@/modules/projects/features/detail/ui/project-people-groups-section";
import { ProjectTeamSection } from "@/modules/projects/features/detail/ui/project-team-section";
import {
  DetailSectionField,
  DETAIL_LINE_INPUT_CLASS_NAME,
  DETAIL_LINE_TEXTAREA_CLASS_NAME,
} from "@/web-client/detail/DetailFormSection";
import { cn } from "@/lib/utils";
import { StandardDetailMetadataSide } from "@/web-client/detail/StandardDetailMetadataSide";
import {
  buildGroupedAuditFeed,
  resolveAuditActionLabel,
  resolveAuditChangedFieldsSummary,
} from "@/web-client/detail/audit-feed-utils";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

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
  description: "Descrição",
  tags: "Tags",
  internalNotes: "Notas",
  startsAt: "Início",
  endsAt: "Fim",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

const PROJECT_ENROLLMENT_AUDIT_FIELD_LABELS = {
  personId: "Pessoa",
  role: "Papel",
  status: "Status",
  startsAt: "Início",
  endsAt: "Fim",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

const PROJECT_PEOPLE_GROUP_AUDIT_FIELD_LABELS = {
  peopleGroupId: "Grupos",
  participationKind: "Participação",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

const PROJECT_ACTION_AUDIT_FIELD_LABELS = {
  title: "Título",
  status: "Status",
  actionTypeId: "Tipo",
  groupId: "Grupos",
  peopleGroupId: "Grupos",
  plannedStartAt: "Início planejado",
  plannedEndAt: "Fim planejado",
  executedAt: "Executada em",
  internalNotes: "Notas",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

function formatProgramType(value: ProgramType | string | null | undefined) {
  if (!value) return "-";
  return PROGRAM_TYPE_LABELS[value as ProgramType] ?? String(value);
}

function formatProjectStatus(value: ProjectStatus | string | null | undefined) {
  if (!value) return "-";
  return PROJECT_STATUS_LABELS[value as ProjectStatus] ?? String(value);
}

export function formatActionStatus(value: ActionStatus | string | null | undefined) {
  if (!value) return "-";
  return ACTION_STATUS_LABELS[value as ActionStatus] ?? String(value);
}

export function formatPeriod(startsAt: string | null | undefined, endsAt: string | null | undefined) {
  if (!startsAt && !endsAt) return "Não informada";
  return `${startsAt ? formatDateOnlyPtBR(startsAt) : "-"} até ${endsAt ? formatDateOnlyPtBR(endsAt) : "-"}`;
}

function resolveProjectHistoryTitle(sourceLabel: string, action: "CREATE" | "UPDATE" | "DELETE") {
  const normalized = sourceLabel.trim() || "Registro";
  if (action === "CREATE") {
    return `${normalized} criado`;
  }
  if (action === "DELETE") {
    return `${normalized} removido`;
  }
  return `${normalized} atualizado`;
}

function buildProjectHistoryItems(logs: NonNullable<ProjectsDetailLayoutContext["detailAudit"]>["logs"]) {
  return buildGroupedAuditFeed(logs).map((group) => {
    const primarySource = group.sourceLabels[0] ?? "Registro";
    const actorName =
      group.logs[0]?.user?.name?.trim() ||
      group.logs[0]?.user?.email?.trim() ||
      "Sistema";
    const changedFields = resolveAuditChangedFieldsSummary(group.rows, 3);
    const changedLabel = changedFields.labels.length
      ? changedFields.hiddenCount > 0
        ? `${changedFields.labels.join(", ")} e +${changedFields.hiddenCount}`
        : changedFields.labels.join(", ")
      : null;

    return {
      id: group.id,
      title: resolveProjectHistoryTitle(primarySource, group.action),
      description: changedLabel
        ? `${primarySource}: ${changedLabel}`
        : group.sourceLabels.join(", "),
      meta: `${resolveAuditActionLabel(group.action)} por ${actorName}`,
      createdAt: group.createdAt,
    };
  });
}

export type ProjectDetailDraft = {
  programId: string;
  name: string;
  status: ProjectStatus;
  startsAt: string;
  endsAt: string;
  description: string;
  tags: string[];
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
  publicPeopleGroupRows: Array<{
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
  enrollmentRows: ApiProjectEnrollment[];
  actionRows: ApiActivity[];
  relationsLoading: boolean;
  mentionableUsers: Array<{
    id: string;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
  }>;
  commentDraft: {
    body: string;
    mentionUserIds: string[];
  };
  commentSubmitting: boolean;
  attachmentUploading: boolean;
  onCommitField: <K extends keyof ProjectDetailDraft>(
    field: K,
    nextValue?: ProjectDetailDraft[K],
  ) => void;
  onCommentDraftChange: React.Dispatch<
    React.SetStateAction<{
      body: string;
      mentionUserIds: string[];
    }>
  >;
  onSubmitComment: () => void;
  onDeleteComment: (commentId: string) => void;
  onUploadAttachment: () => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onNotesChange: (next: string | null) => void;
  onNotesBlur: () => void;
  onOpenPeopleGroup: (peopleGroupId: string) => void;
  onCreatePublicPeopleGroup: () => void;
  onSyncPeopleGroup: (row: { peopleGroupId: string; peopleGroup: { name: string } }) => void;
  onOpenEnrollment: (enrollmentId: string) => void;
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
      <div className="grid gap-6 md:grid-cols-[1.3fr_220px_220px] md:items-end">
        <DetailSectionField label="Nome">
          <Input
            value={draft.name}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, name: event.target.value }))
            }
            onBlur={() => onCommitField("name")}
            className={DETAIL_LINE_INPUT_CLASS_NAME}
            placeholder="Nome do projeto"
            readOnly={readOnly}
          />
        </DetailSectionField>

        <DetailSectionField label="Programa">
          <Select
            value={draft.programId}
            onValueChange={(value) => {
              setDraft((previous) => ({ ...previous, programId: value }));
              onCommitField("programId", value);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={DETAIL_LINE_INPUT_CLASS_NAME}>
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
        </DetailSectionField>

        <DetailSectionField label="Status">
          <Select
            value={draft.status}
            onValueChange={(value) => {
              setDraft((previous) => ({ ...previous, status: value as ProjectStatus }));
              onCommitField("status", value as ProjectStatus);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={DETAIL_LINE_INPUT_CLASS_NAME}>
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
        </DetailSectionField>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-end">
        <DetailSectionField label="Início">
          <Input
            type="date"
            value={draft.startsAt}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, startsAt: event.target.value }))
            }
            onBlur={() => onCommitField("startsAt")}
            className={DETAIL_LINE_INPUT_CLASS_NAME}
            title="Início"
            readOnly={readOnly}
          />
        </DetailSectionField>

        <DetailSectionField label="Fim">
          <Input
            type="date"
            value={draft.endsAt}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, endsAt: event.target.value }))
            }
            onBlur={() => onCommitField("endsAt")}
            className={DETAIL_LINE_INPUT_CLASS_NAME}
            title="Fim"
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>

      <div className="mt-6">
        <DetailSectionField label="Descrição">
          <Textarea
            value={draft.description}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, description: event.target.value }))
            }
            onBlur={() => onCommitField("description")}
            className={cn(DETAIL_LINE_TEXTAREA_CLASS_NAME, "min-h-[180px]")}
            placeholder="Descrição"
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>

    </div>
  );
}

function ProjectsDetailSide({
  mode,
  canAudit,
  readOnly,
  project,
  draft,
  setDraft,
  selectedProgram,
  publicPeopleGroupRows,
  enrollmentRows,
  actionRows,
  detailAudit,
  auditVisibleCount,
  onAuditVisibleCountChange,
  mentionableUsers,
  commentDraft,
  commentSubmitting,
  attachmentUploading,
  onCommitField,
  onCommentDraftChange,
  onSubmitComment,
  onDeleteComment,
  onUploadAttachment,
  onDeleteAttachment,
  onNotesChange,
  onNotesBlur,
}: Pick<
  ProjectsDetailLayoutContext,
  | "mode"
  | "canAudit"
  | "readOnly"
  | "project"
  | "draft"
  | "setDraft"
  | "selectedProgram"
  | "publicPeopleGroupRows"
  | "enrollmentRows"
  | "actionRows"
  | "detailAudit"
  | "auditVisibleCount"
  | "onAuditVisibleCountChange"
  | "mentionableUsers"
  | "commentDraft"
  | "commentSubmitting"
  | "attachmentUploading"
  | "onCommitField"
  | "onCommentDraftChange"
  | "onSubmitComment"
  | "onDeleteComment"
  | "onUploadAttachment"
  | "onDeleteAttachment"
  | "onNotesChange"
  | "onNotesBlur"
>) {
  const historyItems = React.useMemo(
    () => buildProjectHistoryItems(detailAudit?.logs ?? []),
    [detailAudit?.logs],
  );

  return (
    <StandardDetailMetadataSide
      mode={mode}
      readOnly={readOnly}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      canAudit={canAudit}
      tabOrder={["tags", "notes", "attachments", "activity"]}
      comments={{
        items: project?.comments ?? [],
        draft: commentDraft,
        users: mentionableUsers,
        onDraftChange: onCommentDraftChange,
        onSubmit: onSubmitComment,
        onDelete: mode === "edit" ? onDeleteComment : undefined,
        submitting: commentSubmitting,
        readOnly: readOnly || mode !== "edit",
        emptyLabel:
          mode === "create"
            ? "Indisponível."
            : "Nenhum comentário.",
      }}
      notes={{
        value: draft.internalNotes,
        onChange: onNotesChange,
        onBlur: onNotesBlur,
        readOnly,
      }}
      tags={{
        value: draft.tags,
        onChange: (nextTags) =>
          setDraft((previous) => ({ ...previous, tags: nextTags })),
        onCommit: (next) => onCommitField("tags", next),
        readOnly,
        emptyLabel: mode === "create" ? "Indisponível." : "Nenhuma tag.",
      }}
      attachments={{
        items: (project?.attachments ?? []).map((attachment) => ({
          id: attachment.id,
          label: attachment.label,
          href: resolveMediaUrl(attachment.filePath),
          description: attachment.uploadedBy?.name
            ? `Enviado por ${attachment.uploadedBy.name}`
            : "Anexo do projeto",
          mimeType: attachment.mimeType ?? null,
          sizeLabel:
            typeof attachment.fileSizeBytes === "number" && attachment.fileSizeBytes > 0
              ? attachment.fileSizeBytes >= 1024 * 1024
                ? `${(attachment.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
                : attachment.fileSizeBytes >= 1024
                  ? `${Math.round(attachment.fileSizeBytes / 1024)} KB`
                  : `${attachment.fileSizeBytes} B`
              : null,
          statusLabel: attachment.createdAt
            ? attachment.createdAt.slice(0, 16).replace("T", ", ")
            : null,
        })),
        onUpload: mode === "edit" && !readOnly ? onUploadAttachment : undefined,
        onDelete: mode === "edit" && !readOnly ? onDeleteAttachment : undefined,
        readOnly: readOnly || mode !== "edit",
        emptyLabel:
          mode === "create"
            ? "Indisponível."
            : attachmentUploading
              ? "Enviando..."
              : "Nenhum anexo.",
      }}
      history={{
        items: historyItems,
        emptyLabel:
          mode === "create"
            ? "Sem histórico."
            : "Nenhum histórico.",
      }}
      contextItems={[
        { key: "program", label: "Programa", value: selectedProgram?.name ?? "-" },
        { key: "programType", label: "Tipo do programa", value: formatProgramType(selectedProgram?.type ?? null) },
        { key: "status", label: "Status", value: formatProjectStatus(draft.status) },
        { key: "participants", label: "Participantes", value: enrollmentRows.length },
        { key: "publicPeopleGroups", label: "Grupos", value: publicPeopleGroupRows.length },
        { key: "actions", label: "Atividades", value: actionRows.length },
        { key: "tags", label: "Tags", value: draft.tags.length },
      ]}
      defaultTab="activity"
    />
  );
}

export const projectsDetailLayout: DetailLayoutConfig<ProjectsDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  header: {
    title: ({ project, draft, mode }) =>
      mode === "create" ? "Novo projeto" : ((project?.name ?? draft.name) || "Projeto"),
  },
  mainTab: true,
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
    project,
    draft,
    setDraft,
    selectedProgram,
    publicPeopleGroupRows,
    enrollmentRows,
    actionRows,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    mentionableUsers,
    commentDraft,
    commentSubmitting,
    attachmentUploading,
    onCommitField,
    onCommentDraftChange,
    onSubmitComment,
    onDeleteComment,
    onUploadAttachment,
    onDeleteAttachment,
    onNotesChange,
    onNotesBlur,
  }) => (
    <ProjectsDetailSide
      mode={mode}
      canAudit={canAudit}
      readOnly={readOnly}
      project={project}
      draft={draft}
      setDraft={setDraft}
      selectedProgram={selectedProgram}
      publicPeopleGroupRows={publicPeopleGroupRows}
      enrollmentRows={enrollmentRows}
      actionRows={actionRows}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      mentionableUsers={mentionableUsers}
      commentDraft={commentDraft}
      commentSubmitting={commentSubmitting}
      attachmentUploading={attachmentUploading}
      onCommitField={onCommitField}
      onCommentDraftChange={onCommentDraftChange}
      onSubmitComment={onSubmitComment}
      onDeleteComment={onDeleteComment}
      onUploadAttachment={onUploadAttachment}
      onDeleteAttachment={onDeleteAttachment}
      onNotesChange={onNotesChange}
      onNotesBlur={onNotesBlur}
    />
  ),
  tabTemplates: [
    {
      key: "peopleGroups",
      label: "Grupos",
      badge: ({ publicPeopleGroupRows }) => publicPeopleGroupRows.length,
      content: ({
        publicPeopleGroupRows,
        relationsLoading,
        mode,
        readOnly,
        canManageStructure,
        canManageEnrollments,
        onOpenPeopleGroup,
        onCreatePublicPeopleGroup,
        onSyncPeopleGroup,
      }) => (
        <ProjectPeopleGroupsSection
          rows={mode === "edit" ? publicPeopleGroupRows : []}
          loading={relationsLoading}
          canAdd={!readOnly && mode === "edit" && canManageStructure}
          canManageEnrollments={canManageEnrollments}
          onOpenPeopleGroup={onOpenPeopleGroup}
          onAddPeopleGroup={onCreatePublicPeopleGroup}
          onSyncPeopleGroup={onSyncPeopleGroup}
        />
      ),
      flushContent: true,
    },
    {
      key: "teamParticipations",
      label: "Equipe",
      visible: ({ mode }) => mode === "edit",
      content: ({ project, readOnly }) =>
        project ? (
          <ProjectTeamSection projectId={project.id} readOnly={readOnly} />
        ) : null,
      emptyLabel: "Sem equipe.",
    },
    {
      key: "participants",
      label: "Participantes",
      badge: ({ enrollmentRows }) => enrollmentRows.length,
      content: ({
        enrollmentRows,
        relationsLoading,
        mode,
        readOnly,
        canManageEnrollments,
        canDeleteEnrollments,
        tenantSlug,
        onOpenEnrollment,
        onCreateEnrollment,
        onEndEnrollment,
      }) => (
        <ProjectParticipantsSection
          rows={mode === "edit" ? enrollmentRows : []}
          loading={relationsLoading}
          canAdd={!readOnly && mode === "edit" && canManageEnrollments}
          canDeleteEnrollments={canDeleteEnrollments}
          tenantSlug={tenantSlug}
          onOpenEnrollment={onOpenEnrollment}
          onAddEnrollment={onCreateEnrollment}
          onEndEnrollment={onEndEnrollment}
        />
      ),
      flushContent: true,
    },
    {
      key: "actions",
      label: "Atividades",
      badge: ({ actionRows }) => actionRows.length,
      content: ({
        actionRows,
        relationsLoading,
        mode,
        readOnly,
        canManageActions,
        onOpenAction,
        onCreateAction,
      }) => (
        <ProjectActionsSection
          rows={mode === "edit" ? actionRows : []}
          loading={relationsLoading}
          canAdd={!readOnly && mode === "edit" && canManageActions}
          onOpenAction={onOpenAction}
          onAddAction={onCreateAction}
        />
      ),
      flushContent: true,
    },
    {
      key: "goals",
      label: "Metas",
      visible: ({ mode }) => mode === "edit",
      content: ({ project, readOnly }) =>
        project ? (
          <ProjectGoalsSection projectId={project.id} readOnly={readOnly} />
        ) : null,
      emptyLabel: "Sem metas.",
    },
    {
      key: "fundingSources",
      label: "Financiamento",
      visible: ({ mode }) => mode === "edit",
      content: ({ project, readOnly }) =>
        project ? (
          <ProjectFundingSourcesSection projectId={project.id} readOnly={readOnly} />
        ) : null,
      emptyLabel: "Sem fontes de financiamento.",
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
    relatedEntities: [
      {
        key: "projectEnrollment",
        entity: "ProjectEnrollment",
        model: "audit.logs",
        label: "Participante",
        fieldLabels: PROJECT_ENROLLMENT_AUDIT_FIELD_LABELS,
        resolveEntityIds: ({ enrollmentRows }) => enrollmentRows.map((row) => row.id),
      },
      {
        key: "projectPeopleGroup",
        entity: "ProjectPeopleGroup",
        model: "audit.logs",
        label: "Grupos",
        fieldLabels: PROJECT_PEOPLE_GROUP_AUDIT_FIELD_LABELS,
        valueFormatters: {
          participationKind: (value) =>
            value === "TEAM" ? "Equipe" : "Público atendido",
        },
        resolveEntityIds: ({ publicPeopleGroupRows }) =>
          publicPeopleGroupRows.map((row) => row.id),
      },
      {
        key: "projectAction",
        entity: "ProjectAction",
        model: "audit.logs",
        label: "Atividade",
        fieldLabels: PROJECT_ACTION_AUDIT_FIELD_LABELS,
        valueFormatters: {
          status: (value) => formatActionStatus(typeof value === "string" ? value : null),
          plannedStartAt: (value) =>
            typeof value === "string" && value ? formatDateOnlyPtBR(value.slice(0, 10)) : "-",
          plannedEndAt: (value) =>
            typeof value === "string" && value ? formatDateOnlyPtBR(value.slice(0, 10)) : "-",
          executedAt: (value) =>
            typeof value === "string" && value ? formatDateOnlyPtBR(value.slice(0, 10)) : "-",
        },
        resolveEntityIds: ({ actionRows }) => actionRows.map((row) => row.id),
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
