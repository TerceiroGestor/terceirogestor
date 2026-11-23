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
import { resolveMediaUrl } from "@/lib/api";
import type {
  ApiPeopleGroup,
  ApiPeopleGroupAttachment,
  ApiPeopleGroupParticipation,
} from "@/modules/people-groups/api";
import {
  PEOPLE_GROUP_AUDIT_FIELD_LABELS,
  PEOPLE_GROUP_CATEGORY_OPTIONS,
  PEOPLE_GROUP_PURPOSE_OPTIONS,
  PEOPLE_GROUP_TYPE_OPTIONS,
} from "@/modules/people-groups/shared/domain/people-groups.constants";
import { PeopleGroupParticipantsSection } from "@/modules/people-groups/features/detail/ui/people-group-participants-section";
import { DetailSectionField } from "@/web-client/detail/DetailFormSection";
import { StandardDetailMetadataSide } from "@/web-client/detail/StandardDetailMetadataSide";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

const PEOPLE_GROUP_DETAIL_INPUT_CLASS =
  "h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0";
const PEOPLE_GROUP_DETAIL_TEXTAREA_CLASS =
  "min-h-[180px] rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";
const PEOPLE_GROUP_DETAIL_SECTION_CLASS =
  "border-y border-border/60 bg-transparent px-0 py-4";

const AUTO_SAVE_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

const PEOPLE_GROUP_STATUS_OPTIONS = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
] as const;

function formatStatus(isActive: boolean | null | undefined) {
  return isActive === false ? "Inativo" : "Ativo";
}

function resolveGroupTypeLabel(groupType: ApiPeopleGroup["groupType"] | undefined) {
  return PEOPLE_GROUP_TYPE_OPTIONS.find((option) => option.value === groupType)?.label ?? "-";
}

function buildPeopleGroupAttachmentItems(attachments: ApiPeopleGroupAttachment[]) {
  return attachments.map((attachment) => ({
    id: attachment.id,
    label: attachment.label,
    href: resolveMediaUrl(attachment.filePath),
    description: attachment.uploadedBy?.name
      ? `Enviado por ${attachment.uploadedBy.name}`
      : "Anexo do Grupos",
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
  }));
}

export type PeopleGroupDetailDraft = {
  name: string;
  groupType: ApiPeopleGroup["groupType"];
  purpose: "PUBLICO" | "EQUIPE";
  category: string;
  description: string;
  tags: string[];
  ageMin: string;
  ageMax: string;
  isActive: boolean;
  internalNotes: string | null;
};

export type PeopleGroupsDetailLayoutContext = DetailShellAuditContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  canAudit: boolean;
  canEdit: boolean;
  canManageParticipations: boolean;
  tenantSlug: string;
  group: ApiPeopleGroup | null;
  draft: PeopleGroupDetailDraft;
  setDraft: React.Dispatch<React.SetStateAction<PeopleGroupDetailDraft>>;
  participations: ApiPeopleGroupParticipation[];
  historyParticipations: ApiPeopleGroupParticipation[];
  participationsLoading: boolean;
  onCommitField: <K extends keyof PeopleGroupDetailDraft>(
    field: K,
    nextValue?: PeopleGroupDetailDraft[K],
  ) => void;
  onNotesChange: (next: string | null) => void;
  onNotesBlur: () => void;
  onOpenPerson: (personId: string) => void;
  onCreateParticipation: () => void;
  onEndParticipation: (participation: ApiPeopleGroupParticipation) => void;
  attachmentUploading: boolean;
  onUploadAttachment: () => void;
  onDeleteAttachment: (attachmentId: string) => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

function PeopleGroupsDetailMain({
  draft,
  setDraft,
  readOnly,
  onCommitField,
}: Pick<
  PeopleGroupsDetailLayoutContext,
  "draft" | "setDraft" | "readOnly" | "onCommitField"
>) {
  return (
    <div className={PEOPLE_GROUP_DETAIL_SECTION_CLASS}>
      <div className="grid gap-6 md:grid-cols-[1.4fr_200px_200px_180px] md:items-end">
        <DetailSectionField label="Nome">
          <Input
            value={draft.name}
            onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))}
            onBlur={() => onCommitField("name")}
            className={PEOPLE_GROUP_DETAIL_INPUT_CLASS}
            placeholder="Nome do Grupos"
            readOnly={readOnly}
          />
        </DetailSectionField>
        <DetailSectionField label="Tipo do Grupos">
          <Select
            value={draft.groupType}
            onValueChange={(value) => {
              const nextValue = value as PeopleGroupDetailDraft["groupType"];
              setDraft((previous) => ({ ...previous, groupType: nextValue }));
              onCommitField("groupType", nextValue);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={PEOPLE_GROUP_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Tipo do Grupos" />
            </SelectTrigger>
            <SelectContent>
              {PEOPLE_GROUP_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DetailSectionField>
        <DetailSectionField label="Finalidade">
          <Select
            value={draft.purpose}
            onValueChange={(value) => {
              const nextValue = value as PeopleGroupDetailDraft["purpose"];
              setDraft((previous) => ({ ...previous, purpose: nextValue }));
              onCommitField("purpose", nextValue);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={PEOPLE_GROUP_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Finalidade" />
            </SelectTrigger>
            <SelectContent>
              {PEOPLE_GROUP_PURPOSE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DetailSectionField>
        <DetailSectionField label="Status">
          <Select
            value={draft.isActive ? "active" : "inactive"}
            onValueChange={(value) => {
              const nextValue = value === "active";
              setDraft((previous) => ({ ...previous, isActive: nextValue }));
              onCommitField("isActive", nextValue);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={PEOPLE_GROUP_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {PEOPLE_GROUP_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DetailSectionField>
      </div>

      <div className="mt-6">
        <DetailSectionField label="Categoria">
          <Select
            value={draft.category || "__empty__"}
            onValueChange={(value) => {
              const nextValue = value === "__empty__" ? "" : value;
              setDraft((previous) => ({ ...previous, category: nextValue }));
              onCommitField("category", nextValue);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={PEOPLE_GROUP_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__empty__">Não informada</SelectItem>
              {PEOPLE_GROUP_CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DetailSectionField>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-end">
        <DetailSectionField label="Idade mínima">
          <Input
            type="number"
            min={0}
            max={130}
            value={draft.ageMin}
            onChange={(event) => setDraft((previous) => ({ ...previous, ageMin: event.target.value }))}
            onBlur={() => onCommitField("ageMin")}
            className={PEOPLE_GROUP_DETAIL_INPUT_CLASS}
            placeholder="Ex.: 6"
            readOnly={readOnly}
          />
        </DetailSectionField>
        <DetailSectionField label="Idade máxima">
          <Input
            type="number"
            min={0}
            max={130}
            value={draft.ageMax}
            onChange={(event) => setDraft((previous) => ({ ...previous, ageMax: event.target.value }))}
            onBlur={() => onCommitField("ageMax")}
            className={PEOPLE_GROUP_DETAIL_INPUT_CLASS}
            placeholder="Ex.: 14"
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>

      <div className="mt-6">
        <DetailSectionField label="Descrição">
          <Textarea
            value={draft.description}
            onChange={(event) => setDraft((previous) => ({ ...previous, description: event.target.value }))}
            onBlur={() => onCommitField("description")}
            className={PEOPLE_GROUP_DETAIL_TEXTAREA_CLASS}
            placeholder="Descrição do Grupos"
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>
    </div>
  );
}

export const peopleGroupsDetailLayout: DetailLayoutConfig<PeopleGroupsDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  header: {
    title: ({ group, draft, mode }) =>
      mode === "create"
        ? "Novo Grupos"
        : ((group?.name ?? draft.name) || "Grupos"),
  },
  mainTab: true,
  main: ({ draft, setDraft, readOnly, onCommitField }) => (
    <PeopleGroupsDetailMain
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
    group,
    draft,
    setDraft,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    onCommitField,
    onNotesChange,
    onNotesBlur,
    attachmentUploading,
    onUploadAttachment,
    onDeleteAttachment,
  }) => (
    <StandardDetailMetadataSide
      mode={mode}
      canAudit={canAudit}
      readOnly={readOnly}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      tabOrder={["tags", "notes", "attachments", "activity"]}
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
        emptyLabel: mode === "create" ? "Adicione tags ao Grupos." : "Nenhuma tag registrada.",
      }}
      attachments={{
        items: buildPeopleGroupAttachmentItems(group?.attachments ?? []),
        onUpload: mode === "edit" && !readOnly ? onUploadAttachment : undefined,
        onDelete: mode === "edit" && !readOnly ? onDeleteAttachment : undefined,
        readOnly: readOnly || mode !== "edit",
        emptyLabel:
          mode === "create"
            ? "Salve o Grupos para habilitar anexos."
            : attachmentUploading
              ? "Enviando anexo..."
              : "Nenhum anexo registrado para este Grupos.",
      }}
      defaultTab="activity"
    />
  ),
  tabTemplates: [
    {
      key: "participants",
      label: "Participantes",
      badge: ({ participations }) => participations.filter((participation) => participation.isActive).length,
      flushContent: true,
      content: ({
        mode,
        readOnly,
        participations,
        participationsLoading,
        canManageParticipations,
        tenantSlug,
        onOpenPerson,
        onCreateParticipation,
        onEndParticipation,
      }) => (
        <PeopleGroupParticipantsSection
          rows={mode === "edit" ? participations : []}
          loading={participationsLoading}
          canManageParticipations={canManageParticipations}
          canAdd={!readOnly && mode === "edit" && canManageParticipations}
          tenantSlug={tenantSlug}
          onOpenPerson={onOpenPerson}
          onCreateParticipation={onCreateParticipation}
          onEndParticipation={onEndParticipation}
          emptyLabel={
            mode === "create"
              ? "Salve o Grupos para gerenciar participantes."
              : "Nenhuma pessoa vinculada."
          }
        />
      ),
    },
  ],
  auditSources: {
    primaryEntity: {
      key: "peopleGroup",
      entity: "PeopleGroup",
      model: "audit.logs",
      label: "Grupos",
      fieldLabels: PEOPLE_GROUP_AUDIT_FIELD_LABELS,
      valueFormatters: {
        groupType: (value) => resolveGroupTypeLabel(value as ApiPeopleGroup["groupType"]),
        purpose: (value) => (value === "EQUIPE" ? "Equipe institucional" : "Público atendido"),
        isActive: (value) => formatStatus(value === true),
      },
      resolveEntityId: ({ group }) => group?.id,
    },
    relatedEntities: [
      {
        key: "peopleGroupParticipation",
        entity: "PeopleGroupParticipation",
        model: "audit.logs",
        label: "Vínculo",
        fieldLabels: {
          startsAt: "Início",
          endsAt: "Fim",
          isActive: "Status",
          internalNotes: "Notas",
          deletedAt: "Encerrado em",
        },
        valueFormatters: {
          isActive: (value) => formatStatus(value === true),
        },
        resolveEntityIds: ({ participations }) => participations.map((participation) => participation.id),
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
