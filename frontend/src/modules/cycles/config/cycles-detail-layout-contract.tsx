"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { resolveMediaUrl } from "@/lib/api";
import type { ApiCycle, CycleAudienceType } from "@/modules/cycles/api";
import {
  CYCLE_AUDIENCE_LABELS,
  CYCLE_AUDIENCE_OPTIONS,
  CYCLE_STATUS_OPTIONS,
} from "@/modules/cycles/shared/domain/cycles.constants";
import { StandardDetailMetadataSide } from "@/web-client/detail/StandardDetailMetadataSide";
import {
  buildGroupedAuditFeed,
  resolveAuditActionLabel,
  resolveAuditChangedFieldsSummary,
} from "@/web-client/detail/audit-feed-utils";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

const CYCLE_DETAIL_INPUT_CLASS =
  "h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0";
const CYCLE_DETAIL_TEXTAREA_CLASS =
  "min-h-[180px] rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";
const CYCLE_DETAIL_SECTION_CLASS =
  "border-y border-border/60 bg-transparent px-0 py-4";

const AUTO_SAVE_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

const CYCLE_AUDIT_FIELD_LABELS = {
  name: "Nome",
  description: "Descricao",
  audienceType: "Publico",
  ageMin: "Idade minima",
  ageMax: "Idade maxima",
  isActive: "Status",
  tags: "Tags",
  internalNotes: "Notas internas",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

const CYCLE_COMMENT_AUDIT_FIELD_LABELS = {
  body: "Comentario",
  mentionUserIds: "Mencoes",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

const CYCLE_ATTACHMENT_AUDIT_FIELD_LABELS = {
  label: "Anexo",
  filePath: "Arquivo",
  mimeType: "Tipo",
  fileSizeBytes: "Tamanho",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

function formatAudienceType(value: CycleAudienceType | string | null | undefined) {
  if (!value) return "-";
  return CYCLE_AUDIENCE_LABELS[value as CycleAudienceType] ?? String(value);
}

function formatStatus(isActive: boolean | null | undefined) {
  return isActive === false ? "Inativo" : "Ativo";
}

function formatAgeRange(ageMin: string | number | null | undefined, ageMax: string | number | null | undefined) {
  const min = ageMin === "" || ageMin === undefined ? null : ageMin;
  const max = ageMax === "" || ageMax === undefined ? null : ageMax;
  if (min === null && max === null) return "Livre";
  return `${min ?? "-"} a ${max ?? "-"}`;
}

function resolveStatusBadge(isActive: boolean) {
  return isActive ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>;
}

function buildCycleHistoryItems(logs: NonNullable<CyclesDetailLayoutContext["detailAudit"]>["logs"]) {
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

export type CycleDetailDraft = {
  name: string;
  description: string;
  audienceType: CycleAudienceType | "";
  ageMin: string;
  ageMax: string;
  isActive: boolean;
  tags: string[];
  internalNotes: string | null;
};

export type CyclesDetailLayoutContext = DetailShellAuditContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  canAudit: boolean;
  canEdit: boolean;
  cycle: ApiCycle | null;
  draft: CycleDetailDraft;
  setDraft: React.Dispatch<React.SetStateAction<CycleDetailDraft>>;
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
  onCommitField: <K extends keyof CycleDetailDraft>(
    field: K,
    nextValue?: CycleDetailDraft[K],
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

function CyclesDetailMain({
  draft,
  setDraft,
  readOnly,
  onCommitField,
}: Pick<CyclesDetailLayoutContext, "draft" | "setDraft" | "readOnly" | "onCommitField">) {
  return (
    <div className={CYCLE_DETAIL_SECTION_CLASS}>
      <div className="grid gap-3 md:grid-cols-[1.4fr_240px_180px] md:items-end">
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Nome</div>
          <Input
            value={draft.name}
            onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))}
            onBlur={() => onCommitField("name")}
            className={CYCLE_DETAIL_INPUT_CLASS}
            placeholder="Nome do ciclo"
            readOnly={readOnly}
          />
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Publico</div>
          <Select
            value={draft.audienceType || "__empty__"}
            onValueChange={(value) => {
              const nextValue = value === "__empty__" ? "" : (value as CycleAudienceType);
              setDraft((previous) => ({ ...previous, audienceType: nextValue }));
              onCommitField("audienceType", nextValue);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={CYCLE_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Publico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__empty__">Nao informado</SelectItem>
              {CYCLE_AUDIENCE_OPTIONS.map((option) => (
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
            value={draft.isActive ? "true" : "false"}
            onValueChange={(value) => {
              const nextValue = value === "true";
              setDraft((previous) => ({ ...previous, isActive: nextValue }));
              onCommitField("isActive", nextValue);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={CYCLE_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {CYCLE_STATUS_OPTIONS.map((option) => (
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
          <div className="mb-2 text-xs font-medium text-muted-foreground">Idade minima</div>
          <Input
            type="number"
            min={0}
            max={130}
            value={draft.ageMin}
            onChange={(event) => setDraft((previous) => ({ ...previous, ageMin: event.target.value }))}
            onBlur={() => onCommitField("ageMin")}
            className={CYCLE_DETAIL_INPUT_CLASS}
            placeholder="Ex.: 6"
            readOnly={readOnly}
          />
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Idade maxima</div>
          <Input
            type="number"
            min={0}
            max={130}
            value={draft.ageMax}
            onChange={(event) => setDraft((previous) => ({ ...previous, ageMax: event.target.value }))}
            onBlur={() => onCommitField("ageMax")}
            className={CYCLE_DETAIL_INPUT_CLASS}
            placeholder="Ex.: 14"
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
          className={CYCLE_DETAIL_TEXTAREA_CLASS}
          placeholder="Descricao do ciclo institucional"
          readOnly={readOnly}
        />
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-medium text-muted-foreground">Tags</div>
        <TagInput
          value={draft.tags}
          onChange={(tags) => {
            setDraft((previous) => ({ ...previous, tags }));
            onCommitField("tags", tags);
          }}
          disabled={readOnly}
        />
      </div>
    </div>
  );
}

export const cyclesDetailLayout: DetailLayoutConfig<CyclesDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  header: {
    title: ({ cycle, draft, mode }) =>
      mode === "create" ? "Novo ciclo" : ((cycle?.name ?? draft.name) || "Ciclo"),
    slot: ({ draft }) => (
      <div className="border-y border-border/60 bg-transparent px-0 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Status</div>
            <div>{resolveStatusBadge(draft.isActive)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Publico</div>
            <div className="font-medium text-foreground">{formatAudienceType(draft.audienceType)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Faixa etaria</div>
            <div className="font-medium text-foreground">{formatAgeRange(draft.ageMin, draft.ageMax)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Tags</div>
            <div className="font-medium text-foreground">{draft.tags.length}</div>
          </div>
        </div>
      </div>
    ),
  },
  main: ({ draft, setDraft, readOnly, onCommitField }) => (
    <CyclesDetailMain
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
    cycle,
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
        items: cycle?.comments ?? [],
        draft: commentDraft,
        users: mentionableUsers,
        onDraftChange: onCommentDraftChange,
        onSubmit: onSubmitComment,
        onDelete: mode === "edit" ? onDeleteComment : undefined,
        submitting: commentSubmitting,
        readOnly: readOnly || mode !== "edit",
        emptyLabel:
          mode === "create"
            ? "Salve o ciclo para habilitar comentarios."
            : "Nenhum comentario registrado para este ciclo.",
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
        emptyLabel: mode === "create" ? "Adicione tags ao ciclo." : "Nenhuma tag registrada.",
      }}
      attachments={{
        items: (cycle?.attachments ?? []).map((attachment) => ({
          id: attachment.id,
          label: attachment.label,
          href: resolveMediaUrl(attachment.filePath),
          description: attachment.uploadedBy?.name
            ? `Enviado por ${attachment.uploadedBy.name}`
            : "Anexo do ciclo",
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
            ? "Salve o ciclo para habilitar anexos."
            : attachmentUploading
              ? "Enviando anexo..."
              : "Nenhum anexo registrado para este ciclo.",
      }}
      history={{
        items: buildCycleHistoryItems(detailAudit?.logs ?? []),
        emptyLabel:
          mode === "create"
            ? "O historico aparece apos salvar o ciclo."
            : "Nenhum historico disponivel para este ciclo.",
      }}
      contextItems={[
        { key: "audience", label: "Publico", value: formatAudienceType(draft.audienceType) },
        { key: "status", label: "Status", value: formatStatus(draft.isActive) },
        { key: "ageRange", label: "Faixa etaria", value: formatAgeRange(draft.ageMin, draft.ageMax) },
        { key: "tags", label: "Tags", value: draft.tags.length },
      ]}
      defaultTab="activity"
    />
  ),
  auditSources: {
    primaryEntity: {
      key: "cycle",
      entity: "Cycle",
      model: "audit.logs",
      label: "Ciclo",
      fieldLabels: CYCLE_AUDIT_FIELD_LABELS,
      valueFormatters: {
        audienceType: (value) =>
          formatAudienceType(typeof value === "string" ? value : null),
        isActive: (value) => formatStatus(value === true),
      },
      resolveEntityId: ({ cycle }) => cycle?.id,
    },
    relatedEntities: [
      {
        key: "cycleComment",
        entity: "CycleComment",
        model: "audit.logs",
        label: "Comentario",
        fieldLabels: CYCLE_COMMENT_AUDIT_FIELD_LABELS,
        resolveEntityIds: ({ cycle }) => (cycle?.comments ?? []).map((comment) => comment.id),
      },
      {
        key: "cycleAttachment",
        entity: "CycleAttachment",
        model: "audit.logs",
        label: "Anexo",
        fieldLabels: CYCLE_ATTACHMENT_AUDIT_FIELD_LABELS,
        resolveEntityIds: ({ cycle }) =>
          (cycle?.attachments ?? []).map((attachment) => attachment.id),
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
