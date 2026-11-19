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
import { resolveMediaUrl } from "@/lib/api";
import type { ApiProject, ProjectStatus } from "@/modules/projects/api";
import type { ApiProjectEnrollment } from "@/modules/projects/api";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_OPTIONS } from "@/modules/projects/shared/domain/projects.constants";
import { PROJECT_PARTICIPATION_ROLE_LABELS } from "@/modules/projects/shared/domain/projects.constants";
import type { ApiProgram, ProgramStatus, ProgramType } from "@/modules/programs/api";
import {
  PROGRAM_TYPE_LABELS,
} from "@/modules/programs/shared/domain/programs.constants";
import type { ApiActivity, ActionStatus } from "@/modules/actions/api";
import { ACTION_STATUS_LABELS } from "@/modules/actions/shared/domain/actions.constants";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { ProjectFundingSourcesSection } from "@/modules/projects/features/detail/ui/project-funding-sources-section";
import { ProjectGoalsSection } from "@/modules/projects/features/detail/ui/project-goals-section";
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
  peopleGroupId: "Grupo",
  participationKind: "Participação",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

const PROJECT_ACTION_AUDIT_FIELD_LABELS = {
  title: "Título",
  status: "Status",
  actionTypeId: "Tipo",
  groupId: "Grupo",
  peopleGroupId: "Grupo",
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

function formatActionStatus(value: ActionStatus | string | null | undefined) {
  if (!value) return "-";
  return ACTION_STATUS_LABELS[value as ActionStatus] ?? String(value);
}

function formatPeriod(startsAt: string | null | undefined, endsAt: string | null | undefined) {
  if (!startsAt && !endsAt) return "Não informada";
  return `${startsAt ? formatDateOnlyPtBR(startsAt) : "-"} até ${endsAt ? formatDateOnlyPtBR(endsAt) : "-"}`;
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
      accessorKey: "peopleGroups",
      header: "Grupo",
      cell: ({ row }) => {
        const label = row.original.peopleGroups.map((peopleGroup) => peopleGroup.name).join(", ");
        return <span>{label || "Sem Grupo"}</span>;
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
              Encerrar matrícula
            </Button>
          </div>
        ) : null,
    },
  ];
}

function actionRelationColumns(): ColumnDef<ApiActivity, unknown>[] {
  return [
    {
      accessorKey: "title",
      header: "Atividade",
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
      header: "Período",
      cell: ({ row }) => formatPeriod(row.original.plannedStartAt, row.original.plannedEndAt),
    },
  ];
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

function peopleGroupRelationColumns({
  canManageEnrollments,
  onSyncPeopleGroup,
}: Pick<ProjectsDetailLayoutContext, "canManageEnrollments" | "onSyncPeopleGroup">): ColumnDef<
  ProjectsDetailLayoutContext["publicPeopleGroupRows"][number],
  unknown
>[] {
  return [
    {
      accessorKey: "peopleGroup.name",
      header: "Grupo",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{row.original.peopleGroup.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.peopleGroup.description?.trim() ||
              row.original.peopleGroup.category?.trim() ||
              "Grupo institucional"}
          </div>
        </div>
      ),
    },
    {
      id: "category",
      header: "Categoria",
      cell: ({ row }) => row.original.peopleGroup.category?.trim() || "-",
    },
    {
      id: "ageRange",
      header: "Faixa etaria",
      cell: ({ row }) =>
        formatAgeRange(row.original.peopleGroup.ageMin ?? null, row.original.peopleGroup.ageMax ?? null),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        canManageEnrollments && row.original.participationKind === "PARTICIPANT" ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                onSyncPeopleGroup(row.original);
              }}
            >
              Matricular/revisar membros
            </Button>
          </div>
        ) : null,
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
  teamPeopleGroupRows: Array<{
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
  onCreateTeamPeopleGroup: () => void;
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
  teamPeopleGroupRows,
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
  | "teamPeopleGroupRows"
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
        { key: "publicPeopleGroups", label: "Grupos de Pessoas", value: publicPeopleGroupRows.length },
        { key: "teamPeopleGroups", label: "Grupos de Equipe", value: teamPeopleGroupRows.length },
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
    slot: ({ draft, selectedProgram }) => (
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
    project,
    draft,
    setDraft,
    selectedProgram,
    publicPeopleGroupRows,
    teamPeopleGroupRows,
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
      teamPeopleGroupRows={teamPeopleGroupRows}
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
      label: "Grupos de Pessoas",
      badge: ({ publicPeopleGroupRows }) => publicPeopleGroupRows.length,
      relations: [
        {
          key: "project.people-groups",
          label: "Grupos de Pessoas",
          loading: ({ relationsLoading }) => relationsLoading,
          rows: ({ mode, publicPeopleGroupRows }) => (mode === "edit" ? publicPeopleGroupRows : []),
          columns: (context) =>
            peopleGroupRelationColumns({
              canManageEnrollments: context.canManageEnrollments,
              onSyncPeopleGroup: context.onSyncPeopleGroup,
            }),
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
          onRowClick: (row, context) =>
            context.onOpenPeopleGroup(row.peopleGroupId),
          action: {
            label: "Vincular Grupo",
            onClick: (context) => context.onCreatePublicPeopleGroup(),
            hidden: ({ readOnly, mode, canManageStructure }) =>
              readOnly || mode !== "edit" || !canManageStructure,
          },
          emptyLabel: ({ mode }) =>
            mode === "create"
              ? "Indisponível."
              : "Nenhum vínculo.",
        },
      ],
    },
    {
      key: "teamPeopleGroups",
      label: "Grupos de Equipe",
      badge: ({ teamPeopleGroupRows }) => teamPeopleGroupRows.length,
      relations: [
        {
          key: "project.team-people-groups",
          label: "Grupos de Equipe",
          loading: ({ relationsLoading }) => relationsLoading,
          rows: ({ mode, teamPeopleGroupRows }) => (mode === "edit" ? teamPeopleGroupRows : []),
          columns: (context) =>
            peopleGroupRelationColumns({
              canManageEnrollments: context.canManageEnrollments,
              onSyncPeopleGroup: context.onSyncPeopleGroup,
            }),
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
          onRowClick: (row, context) => context.onOpenPeopleGroup(row.peopleGroupId),
          action: {
            label: "Vincular grupo de equipe",
            onClick: (context) => context.onCreateTeamPeopleGroup(),
            hidden: ({ readOnly, mode, canManageStructure }) =>
              readOnly || mode !== "edit" || !canManageStructure,
          },
          emptyLabel: ({ mode }) =>
            mode === "create"
              ? "Indisponível."
              : "Nenhum vínculo.",
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
          onRowClick: (row, context) => context.onOpenEnrollment(row.id),
          action: {
            label: "Vincular participante",
            onClick: (context) => context.onCreateEnrollment(),
            hidden: ({ readOnly, mode, canManageEnrollments }) =>
              readOnly || mode !== "edit" || !canManageEnrollments,
          },
          emptyLabel: ({ mode }) =>
            mode === "create"
              ? "Indisponível."
              : "Nenhum vínculo.",
        },
      ],
    },
    {
      key: "actions",
      label: "Atividades",
      badge: ({ actionRows }) => actionRows.length,
      relations: [
        {
          key: "project.actions",
          label: "Atividades",
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
                row.peopleGroup?.name ?? "",
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
            label: "Nova atividade",
            onClick: (context) => context.onCreateAction(),
            hidden: ({ readOnly, mode, canManageActions }) =>
              readOnly || mode !== "edit" || !canManageActions,
          },
          emptyLabel: ({ mode }) =>
            mode === "create" ? "Indisponível." : "Nenhum vínculo.",
        },
      ],
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
        label: "Grupo",
        fieldLabels: PROJECT_PEOPLE_GROUP_AUDIT_FIELD_LABELS,
        valueFormatters: {
          participationKind: (value) =>
            value === "TEAM" ? "Equipe" : "Público atendido",
        },
        resolveEntityIds: ({ publicPeopleGroupRows, teamPeopleGroupRows }) =>
          [...publicPeopleGroupRows, ...teamPeopleGroupRows].map((row) => row.id),
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
