"use client";

import * as React from "react";
import { resolveMediaUrl } from "@/lib/api";
import type { ApiProjectAction } from "@/modules/actions/api";
import { ACTION_STATUS_LABELS } from "@/modules/actions/shared/domain/actions.constants";
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

const ACTION_AUDIT_FIELD_LABELS = {
  title: "Titulo",
  description: "Descricao",
  tags: "Tags",
  internalNotes: "Notas internas",
  planHtml: "Planejamento",
  executedHtml: "Execucao",
  conclusionHtml: "Conclusao",
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

function formatStatus(value: string | null | undefined) {
  if (!value) return "-";
  return ACTION_STATUS_LABELS[value as keyof typeof ACTION_STATUS_LABELS] ?? value;
}

function formatPeriod(start: string | null | undefined, end: string | null | undefined) {
  const from = start ? start.slice(0, 10) : "-";
  const to = end ? end.slice(0, 10) : "-";
  if (!start && !end) return "Nao informado";
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

export type ActionMetadataDraft = {
  tags: string[];
  internalNotes: string | null;
};

export type ActionsDetailLayoutContext = DetailShellAuditContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  canAudit: boolean;
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
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

export const actionsDetailLayout: DetailLayoutConfig<ActionsDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
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
            ? "Salve a acao para habilitar comentarios."
            : "Nenhum comentario registrado para esta acao.",
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
        emptyLabel: mode === "create" ? "Adicione tags apos criar a acao." : "Nenhuma tag registrada.",
      }}
      attachments={{
        items: (action?.attachments ?? []).map((attachment) => ({
          id: attachment.id,
          label: attachment.label,
          href: resolveMediaUrl(attachment.filePath),
          description: attachment.uploadedBy?.name
            ? `Enviado por ${attachment.uploadedBy.name}`
            : "Anexo da acao",
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
            ? "Salve a acao para habilitar anexos."
            : attachmentUploading
              ? "Enviando anexo..."
              : "Nenhum anexo registrado para esta acao.",
      }}
      history={{
        items: buildActionHistoryItems(detailAudit?.logs ?? []),
        emptyLabel:
          mode === "create"
            ? "O historico aparece apos salvar a acao."
            : "Nenhum historico disponivel para esta acao.",
      }}
      contextItems={[
        { key: "status", label: "Status", value: formatStatus(action?.status) },
        { key: "type", label: "Tipo", value: action?.actionType?.name ?? "-" },
        { key: "scope", label: "Escopo", value: action?.group?.name ?? action?.cycle?.name ?? "Projeto" },
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
      label: "Acao",
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
        resolveEntityIds: ({ action }) =>
          (action?.attachments ?? []).map((attachment) => attachment.id),
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
