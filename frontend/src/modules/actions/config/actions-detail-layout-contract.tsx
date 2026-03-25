"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichText } from "@/components/ui/richtext/RichText";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resolveMediaUrl } from "@/lib/api";
import type {
  ApiProjectAction,
  ApiProjectActionPeopleParticipation,
  ActionStatus,
  ProjectActionAttendancesListItem,
  ProjectActionInput,
} from "@/modules/actions/api";
import {
  ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS,
  ACTION_STATUS_LABELS,
  ACTION_STATUS_OPTIONS,
} from "@/modules/actions/shared/domain/actions.constants";
import { ActionCreateFormSection } from "@/modules/actions/features/create/ui/action-create-form-section";
import { ActionReportPreview } from "@/modules/actions/features/manage/ui/action-report-preview";
import { ProjectActionAttendancesCard } from "@/modules/projects/features/detail/ui/project-action-attendances-card";
import { SectionCard } from "@/components/section-card";
import { StandardDetailMetadataSide } from "@/web-client/detail/StandardDetailMetadataSide";
import {
  buildGroupedAuditFeed,
  resolveAuditActionLabel,
  resolveAuditChangedFieldsSummary,
} from "@/web-client/detail/audit-feed-utils";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

const AUTO_SAVE_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

const lineInputClassName =
  "h-10 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0";
const fieldLabelClassName =
  "text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground";

const ACTION_AUDIT_FIELD_LABELS = {
  title: "Título",
  description: "Descrição",
  tags: "Tags",
  internalNotes: "Notas internas",
  planHtml: "Planejamento",
  executedHtml: "Execução",
  conclusionHtml: "Conclusão",
  completionPercent: "Progresso",
  photoPaths: "Fotos",
  status: "Status",
  plannedStartAt: "Inicio planejado",
  plannedEndAt: "Fim planejado",
  executedStartAt: "Inicio executado",
  executedEndAt: "Fim executado",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

const ACTION_COMMENT_AUDIT_FIELD_LABELS = {
  body: "Comentario",
  mentionUserIds: "Mencoes",
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

function SectionField({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className={fieldLabelClassName}>{label}</div>
      {children}
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function toDateOnly(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function formatStatus(value: string | null | undefined) {
  if (!value) return "-";
  return ACTION_STATUS_LABELS[value as keyof typeof ACTION_STATUS_LABELS] ?? value;
}

function formatPeriod(start: string | null | undefined, end: string | null | undefined) {
  const from = start ? start.slice(0, 10) : "-";
  const to = end ? end.slice(0, 10) : "-";
  if (!start && !end) return "Não informado";
  return `${from} ate ${to}`;
}

function buildActionHistoryItems(logs: NonNullable<ActionsDetailLayoutContext["detailAudit"]>["logs"]) {
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
      title:
        group.action === "CREATE"
          ? `${primarySource} criado`
          : group.action === "DELETE"
            ? `${primarySource} removido`
            : `${primarySource} atualizado`,
      description: changedLabel ? `${primarySource}: ${changedLabel}` : group.sourceLabels.join(", "),
      meta: `${resolveAuditActionLabel(group.action)} por ${actorName}`,
      createdAt: group.createdAt,
    };
  });
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

function ActionPlanSection({
  action,
  readOnly,
  saving,
  onSave,
}: {
  action: ApiProjectAction | null;
  readOnly: boolean;
  saving: boolean;
  onSave: (patch: Partial<ProjectActionInput>) => Promise<void>;
}) {
  const [draft, setDraft] = React.useState({
    title: action?.title ?? "",
    status: action?.status ?? ("PLANNED" as ActionStatus),
    plannedStartAt: toDateOnly(action?.plannedStartAt),
    plannedEndAt: toDateOnly(action?.plannedEndAt),
    planHtml: action?.planHtml ?? "",
  });

  React.useEffect(() => {
    setDraft({
      title: action?.title ?? "",
      status: action?.status ?? "PLANNED",
      plannedStartAt: toDateOnly(action?.plannedStartAt),
      plannedEndAt: toDateOnly(action?.plannedEndAt),
      planHtml: action?.planHtml ?? "",
    });
  }, [action]);

  if (!action) return null;

  return (
    <div className="space-y-6 border-y border-border/60 bg-transparent px-0 py-4">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_240px_240px]">
        <SectionField label="Título">
          <Input
            value={draft.title}
            onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
            className={lineInputClassName}
            readOnly={readOnly || saving}
          />
        </SectionField>
        <SectionField label="Status">
          <Select
            value={draft.status}
            onValueChange={(value) =>
              setDraft((previous) => ({ ...previous, status: value as ActionStatus }))
            }
            disabled={readOnly || saving}
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
        </SectionField>
        <SectionField label="Periodo planejado" helper={formatPeriod(action.plannedStartAt, action.plannedEndAt)}>
          <div className="h-10 border-b border-border/60" />
        </SectionField>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionField label="Inicio planejado">
          <Input
            type="date"
            value={draft.plannedStartAt}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, plannedStartAt: event.target.value }))
            }
            className={lineInputClassName}
            readOnly={readOnly || saving}
          />
        </SectionField>
        <SectionField label="Fim planejado">
          <Input
            type="date"
            value={draft.plannedEndAt}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, plannedEndAt: event.target.value }))
            }
            className={lineInputClassName}
            readOnly={readOnly || saving}
          />
        </SectionField>
      </div>

      <SectionField label="Planejamento">
        <RichText
          value={draft.planHtml}
          disabled={readOnly || saving}
          onChange={(value) => setDraft((previous) => ({ ...previous, planHtml: value }))}
        />
      </SectionField>

      {!readOnly ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() =>
              void onSave({
                title: draft.title.trim(),
                status: draft.status,
                plannedStartAt: draft.plannedStartAt.trim() || null,
                plannedEndAt: draft.plannedEndAt.trim() || null,
                planHtml: draft.planHtml.trim() || null,
              })
            }
            disabled={saving || !draft.title.trim()}
          >
            {saving ? "Salvando..." : "Salvar planejamento"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ActionExecutedSection({
  action,
  readOnly,
  saving,
  onSave,
}: {
  action: ApiProjectAction | null;
  readOnly: boolean;
  saving: boolean;
  onSave: (patch: Partial<ProjectActionInput>) => Promise<void>;
}) {
  const [draft, setDraft] = React.useState({
    executedStartAt: toDateOnly(action?.executedStartAt),
    executedEndAt: toDateOnly(action?.executedEndAt),
    executedHtml: action?.executedHtml ?? "",
  });

  React.useEffect(() => {
    setDraft({
      executedStartAt: toDateOnly(action?.executedStartAt),
      executedEndAt: toDateOnly(action?.executedEndAt),
      executedHtml: action?.executedHtml ?? "",
    });
  }, [action]);

  if (!action) return null;

  return (
    <div className="space-y-6 border-y border-border/60 bg-transparent px-0 py-4">
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1.2fr]">
        <SectionField label="Inicio executado">
          <Input
            type="date"
            value={draft.executedStartAt}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, executedStartAt: event.target.value }))
            }
            className={lineInputClassName}
            readOnly={readOnly || saving}
          />
        </SectionField>
        <SectionField label="Fim executado">
          <Input
            type="date"
            value={draft.executedEndAt}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, executedEndAt: event.target.value }))
            }
            className={lineInputClassName}
            readOnly={readOnly || saving}
          />
        </SectionField>
        <SectionField label="Periodo executado" helper={formatPeriod(action.executedStartAt, action.executedEndAt)}>
          <div className="h-10 border-b border-border/60" />
        </SectionField>
      </div>

      <SectionField label="Relato da execucao">
        <RichText
          value={draft.executedHtml}
          disabled={readOnly || saving}
          onChange={(value) => setDraft((previous) => ({ ...previous, executedHtml: value }))}
        />
      </SectionField>

      {!readOnly ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() =>
              void onSave({
                executedStartAt: draft.executedStartAt.trim() || null,
                executedEndAt: draft.executedEndAt.trim() || null,
                executedHtml: draft.executedHtml.trim() || null,
              })
            }
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar execucao"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ActionConclusionSection({
  action,
  readOnly,
  saving,
  onSave,
}: {
  action: ApiProjectAction | null;
  readOnly: boolean;
  saving: boolean;
  onSave: (patch: Partial<ProjectActionInput>) => Promise<void>;
}) {
  const [draft, setDraft] = React.useState({
    completionPercent:
      action?.completionPercent === null || action?.completionPercent === undefined
        ? ""
        : String(action.completionPercent),
    conclusionHtml: action?.conclusionHtml ?? "",
  });

  React.useEffect(() => {
    setDraft({
      completionPercent:
        action?.completionPercent === null || action?.completionPercent === undefined
          ? ""
          : String(action.completionPercent),
      conclusionHtml: action?.conclusionHtml ?? "",
    });
  }, [action]);

  return (
    <div className="space-y-6 border-y border-border/60 bg-transparent px-0 py-4">
      <div className="grid gap-6 xl:grid-cols-[240px_1fr]">
        <SectionField label="% atingida" helper="Estimativa do quanto foi atingido em relacao ao planejado.">
          <Input
            type="number"
            min="0"
            max="100"
            value={draft.completionPercent}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, completionPercent: event.target.value }))
            }
            className={lineInputClassName}
            readOnly={readOnly || saving}
          />
        </SectionField>
        <div />
      </div>

      <SectionField label="Conclusão">
        <RichText
          value={draft.conclusionHtml}
          disabled={readOnly || saving}
          onChange={(value) => setDraft((previous) => ({ ...previous, conclusionHtml: value }))}
        />
      </SectionField>

      {!readOnly ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() =>
              void onSave({
                completionPercent: draft.completionPercent.trim()
                  ? Number(draft.completionPercent)
                  : null,
                conclusionHtml: draft.conclusionHtml.trim() || null,
              })
            }
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar conclusao"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ActionPhotosSection({
  action,
  readOnly,
  saving,
  onUploadPhoto,
  onDeletePhoto,
}: {
  action: ApiProjectAction | null;
  readOnly: boolean;
  saving: boolean;
  onUploadPhoto: (file: File) => Promise<void>;
  onDeletePhoto: (path: string) => Promise<void>;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const photoPaths = action?.photoPaths ?? [];

  return (
    <SectionCard title="Fotos" subtitle="Adicione até 5 fotos desta ação.">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            void onUploadPhoto(file);
          }
        }}
      />

      {!readOnly ? (
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
          <div className="text-sm text-muted-foreground">
            {photoPaths.length >= 5 ? "Limite de 5 fotos atingido." : "Adicione registros visuais da ação."}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={saving || photoPaths.length >= 5}
          >
            {saving ? "Enviando..." : "Enviar foto"}
          </Button>
        </div>
      ) : null}

      {photoPaths.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma foto adicionada.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {photoPaths.map((path) => (
            <div
              key={path}
              className="group relative overflow-hidden rounded-lg border border-border/60 bg-muted/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveMediaUrl(path)} alt="Foto da ação" className="h-40 w-full object-cover" />
              {!readOnly ? (
                <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/40 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => void onDeletePhoto(path)}
                    disabled={saving}
                  >
                    Remover
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export type ActionMetadataDraft = {
  tags: string[];
  internalNotes: string | null;
};

export type ActionsDetailLayoutContext = DetailShellAuditContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  canAudit: boolean;
  canUpdate: boolean;
  canReadStructure: boolean;
  canReadPeople: boolean;
  canReadPeopleIdentity: boolean;
  token: string;
  projectId: string;
  action: ApiProjectAction | null;
  draft: ActionMetadataDraft;
  setDraft: React.Dispatch<React.SetStateAction<ActionMetadataDraft>>;
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
  photoUploading: boolean;
  reportRows: ProjectActionAttendancesListItem[];
  reportPeopleRows: ApiProjectActionPeopleParticipation[];
  reportLoading: boolean;
  reportError: string | null;
  onCommitField: <K extends keyof ActionMetadataDraft>(
    field: K,
    nextValue?: ActionMetadataDraft[K],
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
  onSaveActionPatch: (patch: Partial<ProjectActionInput>) => Promise<void>;
  onActionLoaded: (action: ApiProjectAction) => void;
  onUploadPhoto: (file: File) => Promise<void>;
  onDeletePhoto: (path: string) => Promise<void>;
  onOpenTeamPicker: () => void;
  onEndTeamParticipation: (participationId: string) => Promise<void>;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

export const actionsDetailLayout: DetailLayoutConfig<ActionsDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  main: ({ mode, action, projectId, onActionLoaded }) => {
    return (
      <ActionCreateFormSection
        mode={mode}
        action={action}
        projectId={projectId}
        actionId={action?.id}
        onSaved={onActionLoaded}
      />
    );
  },
  tabTemplates: [
    {
      key: "participants",
      label: "Participantes",
      visible: ({ mode }) => mode === "edit",
      content: ({
        token,
        projectId,
        action,
        canUpdate,
        canReadStructure,
        canReadPeople,
        canReadPeopleIdentity,
      }) =>
        action ? (
          <ProjectActionAttendancesCard
            token={token}
            projectId={projectId}
            actionId={action.id}
            canUpdate={canUpdate}
            canReadStructure={canReadStructure}
            canReadPeople={canReadPeople}
            canReadPeopleIdentity={canReadPeopleIdentity}
          />
        ) : null,
      emptyLabel: "Sem participantes.",
    },
    {
      key: "team",
      label: "Equipe",
      visible: ({ mode }) => mode === "edit",
      content: () => (
        <div className="text-sm text-muted-foreground">
          Pessoas de apoio e equipe envolvidas na execução da ação.
        </div>
      ),
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
          emptyLabel: "Nenhuma pessoa de apoio registrada.",
        },
      ],
      emptyLabel: "Sem equipe.",
    },
    {
      key: "executed",
      label: "Execução",
      visible: ({ mode }) => mode === "edit",
      content: ({ action, readOnly, attachmentUploading, photoUploading, onSaveActionPatch }) => (
        <ActionExecutedSection
          action={action}
          readOnly={readOnly}
          saving={attachmentUploading || photoUploading}
          onSave={onSaveActionPatch}
        />
      ),
      emptyLabel: "Sem execucao.",
    },
    {
      key: "conclusion",
      label: "Conclusão",
      visible: ({ mode }) => mode === "edit",
      content: ({ action, readOnly, attachmentUploading, photoUploading, onSaveActionPatch }) => (
        <ActionConclusionSection
          action={action}
          readOnly={readOnly}
          saving={attachmentUploading || photoUploading}
          onSave={onSaveActionPatch}
        />
      ),
      emptyLabel: "Sem conclusao.",
    },
    {
      key: "photos",
      label: "Fotos",
      visible: ({ mode }) => mode === "edit",
      content: ({ action, readOnly, photoUploading, onUploadPhoto, onDeletePhoto }) => (
        <ActionPhotosSection
          action={action}
          readOnly={readOnly}
          saving={photoUploading}
          onUploadPhoto={onUploadPhoto}
          onDeletePhoto={onDeletePhoto}
        />
      ),
      emptyLabel: "Sem fotos.",
    },
    {
      key: "report",
      label: "Relatório",
      visible: ({ mode }) => mode === "edit",
      content: ({ action, reportRows, reportPeopleRows, reportLoading, reportError, canReadPeople }) => (
        <SectionCard title="Relatório" subtitle="Prévia do relatório completo da ação.">
          {reportError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {reportError}
            </div>
          ) : null}
          {reportLoading ? <p className="text-xs text-muted-foreground">Carregando...</p> : null}
          {action ? (
            <ActionReportPreview
              action={action}
              rows={reportRows}
              peopleParticipations={reportPeopleRows}
              photoPaths={action.photoPaths ?? []}
              canShowPeople={canReadPeople}
            />
          ) : null}
        </SectionCard>
      ),
      emptyLabel: "Sem relatorio.",
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
    <StandardDetailMetadataSide
      mode={mode}
      readOnly={readOnly}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      canAudit={canAudit}
      comments={{
        items: action?.comments ?? [],
        draft: commentDraft,
        users: mentionableUsers,
        onDraftChange: onCommentDraftChange,
        onSubmit: onSubmitComment,
        onDelete: mode === "edit" ? onDeleteComment : undefined,
        submitting: commentSubmitting,
        readOnly: readOnly || mode !== "edit",
        emptyLabel:
          mode === "create"
            ? "Salve a ação para habilitar comentários."
            : "Nenhum comentário registrado para esta ação.",
      }}
      notes={{
        value: draft.internalNotes,
        onChange: onNotesChange,
        onBlur: onNotesBlur,
        readOnly,
      }}
      tags={{
        value: draft.tags,
        onChange: (nextTags) => setDraft((previous) => ({ ...previous, tags: nextTags })),
        onCommit: (next) => onCommitField("tags", next),
        readOnly,
        emptyLabel: mode === "create" ? "Adicione tags após criar a ação." : "Nenhuma tag registrada.",
      }}
      attachments={{
        items: (action?.attachments ?? []).map((attachment) => ({
          id: attachment.id,
          label: attachment.label,
          href: resolveMediaUrl(attachment.filePath),
          description: attachment.uploadedBy?.name
            ? `Enviado por ${attachment.uploadedBy.name}`
            : "Anexo da ação",
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
            ? "Salve a ação para habilitar anexos."
            : attachmentUploading
              ? "Enviando anexo..."
              : "Nenhum anexo registrado para esta ação.",
      }}
      history={{
        items: buildActionHistoryItems(detailAudit?.logs ?? []),
        emptyLabel:
          mode === "create"
            ? "O histórico aparece após salvar a ação."
            : "Nenhum histórico disponível para esta ação.",
      }}
      contextItems={[
        { key: "status", label: "Status", value: formatStatus(action?.status) },
        { key: "type", label: "Tipo", value: action?.actionType?.name ?? "-" },
        {
          key: "scope",
          label: "Escopo",
          value:
            action?.projectGroup?.name ??
            action?.peopleGroup?.segment?.name ??
            action?.peopleGroup?.name ??
            action?.targetEnrollment?.person?.fullName ??
            "Projeto",
        },
        { key: "period", label: "Periodo", value: formatPeriod(action?.plannedStartAt, action?.plannedEndAt) },
        { key: "tags", label: "Tags", value: draft.tags.length },
      ]}
      defaultTab="activity"
    />
  ),
  auditSources: {
    primaryEntity: {
      key: "action",
      entity: "ProjectAction",
      model: "audit.logs",
      label: "Ação",
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
        label: "Comentario",
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
