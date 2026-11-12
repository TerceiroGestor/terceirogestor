"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichText } from "@/components/ui/richtext/RichText";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Network } from "lucide-react";
import { resolveMediaUrl } from "@/lib/api";
import { formatDateOnlyPtBR, formatDateTimePtBR } from "@/lib/date";
import { FamilyRelationsProvider } from "@/modules/people/features/family-members/context/family-relations-context";
import { PersonContactsPanel } from "@/modules/people/features/contacts/ui/person-contacts-panel";
import { PersonSensitiveDocumentsPanel } from "@/modules/people/features/sensitive-documents/ui/person-sensitive-documents-panel";
import {
  GENDER_LABELS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  PERSON_TYPE_LABELS,
  PERSON_TYPE_OPTIONS,
  RACE_COLOR_LABELS,
  RACE_COLOR_OPTIONS,
  SEX_LABELS,
  SEX_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from "@/modules/people/shared/domain/people.constants";
import type {
  Person,
  PersonAttachment,
  PersonComment,
  PersonFormData,
  PersonMentionableUser,
} from "@/modules/people/shared/domain/types";
import {
  getAgeFromBirthDate,
  isBirthdayToday,
  resolveLabel,
  resolvePersonDisplayNames,
} from "@/modules/people/shared/domain/utils";
import {
  buildPeopleTreePath,
  type PeopleDetailTabValue,
} from "@/modules/people/shared/domain/people-relation-routes";
import { PeopleDetailContent } from "@/modules/people/shared/ui/people-detail-content";
import { PersonAddressSection } from "@/modules/people/shared/ui/person-address-section";
import { PersonFullRecordDialog } from "@/modules/people/shared/ui/people-detail-sidebar";
import { PeopleDetailTabs } from "@/modules/people/shared/ui/people-detail-tabs";
import { DetailIdentityMediaField } from "@/web-client/detail/DetailIdentityMediaField";
import { areTagsEqual } from "@/web-client/detail/tag-utils";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import {
  StandardDetailContextPanel,
  StandardDetailMetadataSide,
} from "@/web-client/detail/StandardDetailMetadataSide";
import {
  buildAuditHistoryItems,
} from "@/web-client/detail/audit-feed-utils";
import type {
  DetailContextItem,
  DetailHeaderActionConfig,
  DetailLayoutConfig,
} from "@/web-client/registry/types";

export type PeopleDetailLayoutContext = DetailShellAuditContext & {
  mode: "create" | "edit";
  person: Person;
  draft: PersonFormData;
  readOnly: boolean;
  avatarUploading: boolean;
  canAudit: boolean;
  mentionableUsers: PersonMentionableUser[];
  relatedAuditEntityIds: {
    financialEntryIds: string[];
    healthConditionIds: string[];
    medicationIds: string[];
    educationIds: string[];
    detentionIds: string[];
    relationIds: string[];
  };
  tagSuggestions: string[];
  onAvatarFileSelect?: (file: File) => Promise<void> | void;
  onDraftChange: React.Dispatch<React.SetStateAction<PersonFormData>>;
  onCommitField?: <K extends keyof PersonFormData>(
    field: K,
    nextValue?: PersonFormData[K],
  ) => void;
  onCommitDraft?: (nextDraft: PersonFormData) => void;
  tabValue: PeopleDetailTabValue;
  onTabChange: (value: PeopleDetailTabValue) => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
  commentDraft: {
    body: string;
    mentionUserIds: string[];
  };
  commentSubmitting: boolean;
  attachmentUploading: boolean;
  onCommentDraftChange: React.Dispatch<
    React.SetStateAction<{
      body: string;
      mentionUserIds: string[];
    }>
  >;
  onSubmitComment: () => void;
  onDeleteComment: (comment: PersonComment) => void;
  onUploadAttachment: () => void;
  onDeleteAttachment: (attachment: PersonAttachment) => void;
};

const lineInputClassName =
  "h-10 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0";
const lineTextareaClassName =
  "min-h-[120px] rounded-none border-0 border-b border-border/60 bg-transparent px-0 py-3 shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";
const fieldLabelClassName =
  "text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground";
const AUTO_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

function areMentionableUsersEqual(
  left: PersonMentionableUser[],
  right: PersonMentionableUser[],
) {
  if (left === right) return true;
  if (left.length !== right.length) return false;

  return left.every((entry, index) => {
    const candidate = right[index];
    return (
      candidate?.id === entry.id &&
      candidate?.name === entry.name &&
      candidate?.email === entry.email &&
      candidate?.avatarUrl === entry.avatarUrl
    );
  });
}

function getPersonStatusBadgeVariant(status?: string | null) {
  if (status === "Ativo") return "default" as const;
  if (status === "Desligado") return "destructive" as const;
  if (status === "Inativo") return "secondary" as const;
  return "outline" as const;
}

function SectionField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className={fieldLabelClassName}>{label}</div>
      {children}
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1 border-b border-border/60 pb-2">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function IdentificationFields({
  draft,
  readOnly,
  onDraftChange,
  onCommitField,
}: {
  draft: PersonFormData;
  readOnly: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<PersonFormData>>;
  onCommitField?: <K extends keyof PersonFormData>(field: K, nextValue?: PersonFormData[K]) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionField label="Nome">
        <Input
          value={draft.fullName}
          onChange={(event) => onDraftChange((previous) => ({ ...previous, fullName: event.target.value }))}
          onBlur={(event) => onCommitField?.("fullName", event.target.value)}
          className={lineInputClassName}
          readOnly={readOnly}
        />
      </SectionField>
      <SectionField label="Nome social">
        <Input
          value={draft.socialName ?? ""}
          onChange={(event) => onDraftChange((previous) => ({ ...previous, socialName: event.target.value }))}
          onBlur={(event) => onCommitField?.("socialName", event.target.value || null)}
          className={lineInputClassName}
          readOnly={readOnly}
        />
      </SectionField>
      <SectionField label="Email">
        <Input
          value={draft.email ?? ""}
          onChange={(event) => onDraftChange((previous) => ({ ...previous, email: event.target.value }))}
          onBlur={(event) => onCommitField?.("email", event.target.value || null)}
          className={lineInputClassName}
          readOnly={readOnly}
        />
      </SectionField>
      <SectionField label="Telefone">
        <Input
          value={draft.phone ?? ""}
          onChange={(event) => onDraftChange((previous) => ({ ...previous, phone: event.target.value }))}
          onBlur={(event) => onCommitField?.("phone", event.target.value || null)}
          className={lineInputClassName}
          readOnly={readOnly}
        />
      </SectionField>
      <SectionField label="Nascimento">
        <Input
          type="date"
          value={draft.birthDate ?? ""}
          onChange={(event) => {
            const nextValue = event.target.value || null;
            onDraftChange((previous) => ({ ...previous, birthDate: nextValue }));
            onCommitField?.("birthDate", nextValue);
          }}
          className={lineInputClassName}
          readOnly={readOnly}
        />
      </SectionField>
    </div>
  );
}

function ClassificationFields({
  draft,
  readOnly,
  onDraftChange,
  onCommitField,
}: {
  draft: PersonFormData;
  readOnly: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<PersonFormData>>;
  onCommitField?: <K extends keyof PersonFormData>(field: K, nextValue?: PersonFormData[K]) => void;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <SectionField label="Tipo">
        <Select
          value={draft.personType ?? "__empty__"}
          onValueChange={(next) => {
            const nextValue = next === "__empty__" ? null : (next as PersonFormData["personType"]);
            onDraftChange((previous) => ({ ...previous, personType: nextValue }));
            onCommitField?.("personType", nextValue);
          }}
          disabled={readOnly}
        >
          <SelectTrigger className={lineInputClassName}>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty__">Sem tipo</SelectItem>
            {PERSON_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {PERSON_TYPE_LABELS[option] ?? option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SectionField>
      <SectionField label="Sexo">
        <Select
          value={draft.sex ?? "__empty__"}
          onValueChange={(next) => {
            const nextValue = next === "__empty__" ? null : next;
            onDraftChange((previous) => ({ ...previous, sex: nextValue }));
            onCommitField?.("sex", nextValue);
          }}
          disabled={readOnly}
        >
          <SelectTrigger className={lineInputClassName}>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty__">Não informado</SelectItem>
            {SEX_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {SEX_LABELS[option] ?? option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SectionField>
      <SectionField label="Gênero">
        <Select
          value={draft.gender ?? "__empty__"}
          onValueChange={(next) => {
            const nextValue = next === "__empty__" ? null : next;
            onDraftChange((previous) => ({ ...previous, gender: nextValue }));
            onCommitField?.("gender", nextValue);
          }}
          disabled={readOnly}
        >
          <SelectTrigger className={lineInputClassName}>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty__">Não informado</SelectItem>
            {GENDER_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {GENDER_LABELS[option] ?? option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SectionField>
      <SectionField label="Raça/Cor">
        <Select
          value={draft.raceColor ?? "__empty__"}
          onValueChange={(next) => {
            const nextValue = next === "__empty__" ? null : next;
            onDraftChange((previous) => ({ ...previous, raceColor: nextValue }));
            onCommitField?.("raceColor", nextValue);
          }}
          disabled={readOnly}
        >
          <SelectTrigger className={lineInputClassName}>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty__">Não informado</SelectItem>
            {RACE_COLOR_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {RACE_COLOR_LABELS[option] ?? option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SectionField>
      <SectionField label="Estado civil">
        <Select
          value={draft.maritalStatus ?? "__empty__"}
          onValueChange={(next) => {
            const nextValue = next === "__empty__" ? null : next;
            onDraftChange((previous) => ({ ...previous, maritalStatus: nextValue }));
            onCommitField?.("maritalStatus", nextValue);
          }}
          disabled={readOnly}
        >
          <SelectTrigger className={lineInputClassName}>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty__">Não informado</SelectItem>
            {MARITAL_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SectionField>
      <SectionField label="Nacionalidade">
        <Input
          value={draft.nationality ?? ""}
          onChange={(event) => onDraftChange((previous) => ({ ...previous, nationality: event.target.value }))}
          onBlur={(event) => onCommitField?.("nationality", event.target.value || null)}
          className={lineInputClassName}
          readOnly={readOnly}
        />
      </SectionField>
    </div>
  );
}

function StatusFields({
  draft,
  readOnly,
  onDraftChange,
  onCommitField,
}: {
  draft: PersonFormData;
  readOnly: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<PersonFormData>>;
  onCommitField?: <K extends keyof PersonFormData>(field: K, nextValue?: PersonFormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionField label="Status">
          <Select
            value={draft.status ?? "__empty__"}
            onValueChange={(next) => {
              const nextValue = next === "__empty__" ? null : (next as PersonFormData["status"]);
              onDraftChange((previous) => ({ ...previous, status: nextValue }));
              onCommitField?.("status", nextValue);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={lineInputClassName}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__empty__">Sem status</SelectItem>
              {STATUS_OPTIONS.filter((option) => option !== "Em analise").map((option) => (
                <SelectItem key={option} value={option}>
                  {STATUS_LABELS[option] ?? option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SectionField>
      </div>

      {draft.status === "Desligado" ? (
        <SectionField label="Motivo do desligamento">
          <Textarea
            value={draft.departureReason ?? ""}
            onChange={(event) => onDraftChange((previous) => ({ ...previous, departureReason: event.target.value }))}
            onBlur={(event) => onCommitField?.("departureReason", event.target.value || null)}
            className={lineTextareaClassName}
            readOnly={readOnly}
          />
        </SectionField>
      ) : null}
    </div>
  );
}

function SummaryFields({
  draft,
  readOnly,
  onDraftChange,
  onCommitDraft,
}: {
  draft: PersonFormData;
  readOnly: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<PersonFormData>>;
  onCommitDraft?: (nextDraft: PersonFormData) => void;
}) {
  return (
    <SectionField label="Resumo">
      <RichText
        value={draft.profileSummary ?? ""}
        disabled={readOnly}
        onChange={(value) => onDraftChange((previous) => ({ ...previous, profileSummary: value }))}
        onBlur={() => onCommitDraft?.({ ...draft })}
      />
    </SectionField>
  );
}

function BasicDataSection({
  draft,
  readOnly,
  onDraftChange,
  onCommitField,
  onCommitDraft,
}: {
  draft: PersonFormData;
  readOnly: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<PersonFormData>>;
  onCommitField?: <K extends keyof PersonFormData>(field: K, nextValue?: PersonFormData[K]) => void;
  onCommitDraft?: (nextDraft: PersonFormData) => void;
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SectionHeading title="Identificação" />
        <IdentificationFields
          draft={draft}
          readOnly={readOnly}
          onDraftChange={onDraftChange}
          onCommitField={onCommitField}
        />
      </section>

      <section className="space-y-4">
        <SectionHeading title="Classificação" />
        <ClassificationFields
          draft={draft}
          readOnly={readOnly}
          onDraftChange={onDraftChange}
          onCommitField={onCommitField}
        />
      </section>

      <section className="space-y-4">
        <SectionHeading title="Status no cadastro" />
        <StatusFields
          draft={draft}
          readOnly={readOnly}
          onDraftChange={onDraftChange}
          onCommitField={onCommitField}
        />
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Resumo"
          description="Observações e histórico narrativo sobre o acompanhamento."
        />
        <SummaryFields
          draft={draft}
          readOnly={readOnly}
          onDraftChange={onDraftChange}
          onCommitDraft={onCommitDraft}
        />
      </section>
    </div>
  );
}

function PeopleDetailMain({
  mode,
  person,
  draft,
  readOnly,
  onDraftChange,
  onCommitField,
  onCommitDraft,
  tabValue,
  onTabChange,
}: {
  mode: "create" | "edit";
  person: Person;
  draft: PersonFormData;
  readOnly: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<PersonFormData>>;
  onCommitField?: <K extends keyof PersonFormData>(field: K, nextValue?: PersonFormData[K]) => void;
  onCommitDraft?: (nextDraft: PersonFormData) => void;
  tabValue: PeopleDetailTabValue;
  onTabChange: (value: PeopleDetailTabValue) => void;
}) {
  const unavailableBeforeSave = (
    <div className="border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
      Disponível após salvar o cadastro.
    </div>
  );
  return (
    <FamilyRelationsProvider personId={person.id} initialMode="summary">
      <Tabs
        value={tabValue}
        onValueChange={(value) => onTabChange(value as PeopleDetailTabValue)}
        className="flex h-full flex-col gap-4"
      >
        <div className="shrink-0">
          <PeopleDetailTabs onValueChange={onTabChange} />
        </div>
        <PeopleDetailContent
          person={person}
          basicDataSlot={
            <BasicDataSection
              draft={draft}
              readOnly={readOnly}
              onDraftChange={onDraftChange}
              onCommitField={onCommitField}
              onCommitDraft={onCommitDraft}
            />
          }
          contactsSlot={
            mode === "edit" ? (
              <PersonContactsPanel
                personId={person.id}
                seedEmail={person.email}
                seedPhone={person.phone}
                readOnly={readOnly}
              />
            ) : (
              unavailableBeforeSave
            )
          }
          addressSlot={
            mode === "edit" ? (
              <PersonAddressSection />
            ) : (
              unavailableBeforeSave
            )
          }
          sensitiveDocumentsSlot={
            mode === "edit" ? (
              <PersonSensitiveDocumentsPanel personId={person.id} />
            ) : (
              unavailableBeforeSave
            )
          }
        />
      </Tabs>
    </FamilyRelationsProvider>
  );
}

function PeopleDetailSide({
  mode,
  person,
  readOnly,
  canAudit,
  mentionableUsers,
  detailAudit,
  auditVisibleCount,
  onAuditVisibleCountChange,
  notesValue,
  onNotesChange,
  onNotesCommit,
  tagsValue,
  onTagsChange,
  onTagsCommit,
  commentDraft,
  commentSubmitting,
  attachmentUploading,
  onCommentDraftChange,
  onSubmitComment,
  onDeleteComment,
  onUploadAttachment,
  onDeleteAttachment,
}: {
  mode: "create" | "edit";
  person: Person;
  readOnly: boolean;
  canAudit: boolean;
  mentionableUsers: PersonMentionableUser[];
  detailAudit?: DetailShellAuditContext["detailAudit"];
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
  notesValue: string | null | undefined;
  onNotesChange: (next: string | null) => void;
  onNotesCommit: () => void;
  tagsValue: string[];
  onTagsChange: (next: string[]) => void;
  onTagsCommit: (next: string[]) => void;
  commentDraft: {
    body: string;
    mentionUserIds: string[];
  };
  commentSubmitting: boolean;
  attachmentUploading: boolean;
  onCommentDraftChange: React.Dispatch<
    React.SetStateAction<{
      body: string;
      mentionUserIds: string[];
    }>
  >;
  onSubmitComment: () => void;
  onDeleteComment: (comment: PersonComment) => void;
  onUploadAttachment: () => void;
  onDeleteAttachment: (attachment: PersonAttachment) => void;
}) {
  const ageValue = getAgeFromBirthDate(person.birthDate);
  const ageLabel = ageValue !== null ? `${ageValue} anos` : "-";
  const historyItems = React.useMemo(
    () => buildAuditHistoryItems(detailAudit?.logs ?? []),
    [detailAudit?.logs],
  );

  const contextItemsList = React.useMemo<DetailContextItem[]>(
    () => [
      { key: "status", label: "Status", value: person.status ?? "Sem status" },
      { key: "type", label: "Tipo", value: person.personType ?? "Sem tipo" },
      { key: "birthDate", label: "Nascimento", value: person.birthDate ?? "-" },
      { key: "age", label: "Idade", value: ageLabel },
      { key: "email", label: "Email", value: person.email ?? "-" },
      { key: "phone", label: "Telefone", value: person.phone ?? "-" },
      { key: "comments", label: "Comentários", value: (person.comments ?? []).length },
      { key: "attachments", label: "Anexos", value: (person.attachments ?? []).length },
      { key: "tags", label: "Tags", value: tagsValue.length },
    ],
    [ageLabel, person, tagsValue.length],
  );

  const contextPanel =
    mode === "edit" ? (
      <StandardDetailContextPanel items={contextItemsList} />
    ) : (
      <div className="space-y-4 border border-border/60 bg-background px-4 py-4">
        <div className="space-y-1 border-b border-border/50 pb-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Resumo
          </div>
          <div className="text-sm font-medium text-foreground">
            {resolvePersonDisplayNames(person.fullName, person.socialName).primary}
          </div>
          {person.socialName ? (
            <div className="text-xs text-muted-foreground">{person.socialName}</div>
          ) : null}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Status</span>
            <span className="text-foreground">{person.status ?? "Sem status"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Tipo</span>
            <span className="text-foreground">{person.personType ?? "Sem tipo"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Nascimento</span>
            <span className="text-foreground">{person.birthDate ?? "-"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground">{person.email ?? "-"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Telefone</span>
            <span className="text-foreground">{person.phone ?? "-"}</span>
          </div>
        </div>
      </div>
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
        items: person.comments ?? [],
        draft: commentDraft,
        users: mentionableUsers,
        onDraftChange: onCommentDraftChange,
        onSubmit: onSubmitComment,
        onDelete: readOnly
          ? undefined
          : (commentId) => {
              const comment = (person.comments ?? []).find((entry) => entry.id === commentId);
              if (comment) {
                onDeleteComment(comment);
              }
            },
        submitting: commentSubmitting,
        readOnly,
        emptyLabel:
          mode === "create"
            ? "Indisponível."
            : "Nenhum comentário.",
      }}
      notes={{
        value: notesValue,
        onChange: onNotesChange,
        onBlur: onNotesCommit,
        readOnly,
      }}
      tags={{
        value: tagsValue,
        onChange: onTagsChange,
        onCommit: onTagsCommit,
        readOnly,
        emptyLabel: mode === "create" ? "Indisponível." : "Nenhuma tag.",
      }}
      attachments={{
        items: (person.attachments ?? []).map((attachment) => ({
          id: attachment.id,
          label: attachment.label,
          href: resolveMediaUrl(attachment.filePath),
          description: attachment.uploadedBy?.name
            ? `Enviado por ${attachment.uploadedBy.name}`
            : "Anexo da pessoa",
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
        onUpload: readOnly ? undefined : onUploadAttachment,
        onDelete: readOnly
          ? undefined
          : (attachmentId) => {
              const attachment = (person.attachments ?? []).find((entry) => entry.id === attachmentId);
              if (attachment) {
                onDeleteAttachment(attachment);
              }
            },
        readOnly,
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
      contextPanel={contextPanel}
      defaultTab="activity"
    />
  );
}

const MemoizedPeopleDetailSide = React.memo(
  PeopleDetailSide,
  (previous, next) =>
    previous.mode === next.mode &&
    previous.person === next.person &&
    previous.readOnly === next.readOnly &&
    previous.canAudit === next.canAudit &&
    previous.detailAudit === next.detailAudit &&
    previous.auditVisibleCount === next.auditVisibleCount &&
    previous.onAuditVisibleCountChange === next.onAuditVisibleCountChange &&
    previous.notesValue === next.notesValue &&
    areTagsEqual(previous.tagsValue, next.tagsValue) &&
    areMentionableUsersEqual(previous.mentionableUsers, next.mentionableUsers) &&
    previous.commentDraft === next.commentDraft &&
    previous.commentSubmitting === next.commentSubmitting &&
    previous.attachmentUploading === next.attachmentUploading &&
    previous.onCommentDraftChange === next.onCommentDraftChange &&
    previous.onSubmitComment === next.onSubmitComment &&
    previous.onDeleteComment === next.onDeleteComment &&
    previous.onUploadAttachment === next.onUploadAttachment &&
    previous.onDeleteAttachment === next.onDeleteAttachment,
);

export const PEOPLE_AUDIT_FIELD_LABELS: Record<string, string> = {
  fullName: "Nome completo",
  socialName: "Nome social",
  birthDate: "Nascimento",
  sex: "Sexo",
  gender: "Gênero",
  raceColor: "Raça/Cor",
  maritalStatus: "Estado civil",
  nationality: "Nacionalidade",
  email: "Email",
  phone: "Telefone",
  status: "Status",
  personType: "Tipo",
  departureReason: "Motivo do desligamento",
  notes: "Notas",
  tags: "Tags",
  profileSummary: "Resumo",
  avatarUrl: "Foto",
};

const PEOPLE_DETAIL_HEADER_ACTIONS: DetailHeaderActionConfig<PeopleDetailLayoutContext>[] = [
  {
    key: "full-record",
    hidden: ({ mode }) => mode !== "edit",
    render: ({ person }) => {
      const ageValue = getAgeFromBirthDate(person.birthDate);
      const ageLabel = ageValue !== null ? `${ageValue} anos` : "-";
      return (
        <PersonFullRecordDialog
          person={person}
          ageLabel={ageLabel}
          isTodayBirthday={isBirthdayToday(person.birthDate)}
        />
      );
    },
  },
  {
    key: "family-tree",
    tooltip: "Árvore genealógica",
    icon: <Network className="h-4 w-4" />,
    variant: "action",
    hidden: ({ mode }) => mode !== "edit",
    href: ({ person }) => buildPeopleTreePath(person.id),
  },
];

export const peopleDetailLayout: DetailLayoutConfig<PeopleDetailLayoutContext> = {
  editing: AUTO_EDITING,
  header: {
    title: ({ person }) => resolvePersonDisplayNames(person.fullName, person.socialName).primary,
    actions: PEOPLE_DETAIL_HEADER_ACTIONS,
    leadingSlot: ({ person, readOnly, avatarUploading, onAvatarFileSelect }) => (
      <div className="mt-2">
        <DetailIdentityMediaField
          variant="header"
          name={resolvePersonDisplayNames(person.fullName, person.socialName).primary}
          value={person.avatarUrl ?? null}
          readOnly={readOnly}
          busy={avatarUploading}
          onFileSelect={onAvatarFileSelect}
        />
      </div>
    ),
    slot: ({ person }) => {
      const ageValue = getAgeFromBirthDate(person.birthDate);
      return (
        <div className="border-y border-border/60 bg-transparent px-0 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground">Status</div>
              <Badge variant={getPersonStatusBadgeVariant(person.status)}>
                {person.status ?? "Sem status"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground">Tipo</div>
              <div className="font-medium text-foreground">
                {person.personType ? resolveLabel(person.personType, PERSON_TYPE_LABELS) : "Sem tipo"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground">Nascimento</div>
              <div className="font-medium text-foreground">
                {formatDateOnlyPtBR(person.birthDate)}
                {ageValue !== null ? ` (${ageValue} anos)` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground">Cadastro</div>
              <div className="font-medium text-foreground">
                {formatDateTimePtBR(person.createdAt)}
              </div>
            </div>
          </div>
        </div>
      );
    },
  },
  main: ({
    mode,
    person,
    draft,
    readOnly,
    onDraftChange,
    onCommitField,
    onCommitDraft,
    tabValue,
    onTabChange,
  }) => (
    <PeopleDetailMain
      mode={mode}
      person={person}
      draft={draft}
      readOnly={readOnly}
      onDraftChange={onDraftChange}
      onCommitField={onCommitField}
      onCommitDraft={onCommitDraft}
      tabValue={tabValue}
      onTabChange={onTabChange}
    />
  ),
  side: ({
    mode,
    person,
    draft,
    readOnly,
    onDraftChange,
    onCommitField,
    canAudit,
    mentionableUsers,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    commentDraft,
    commentSubmitting,
    attachmentUploading,
    onCommentDraftChange,
    onSubmitComment,
    onDeleteComment,
    onUploadAttachment,
    onDeleteAttachment,
  }) => (
    <MemoizedPeopleDetailSide
      mode={mode}
      person={person}
      readOnly={readOnly}
      canAudit={canAudit}
      mentionableUsers={mentionableUsers}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      notesValue={draft.notes}
      onNotesChange={(next) => {
        onDraftChange((previous) => ({ ...previous, notes: next }));
      }}
      onNotesCommit={() => onCommitField?.("notes", draft.notes ?? null)}
      tagsValue={draft.tags ?? []}
      onTagsChange={(nextTags) => {
        onDraftChange((previous) => ({ ...previous, tags: nextTags }));
      }}
      onTagsCommit={(nextTags) => onCommitField?.("tags", nextTags)}
      commentDraft={commentDraft}
      commentSubmitting={commentSubmitting}
      attachmentUploading={attachmentUploading}
      onCommentDraftChange={onCommentDraftChange}
      onSubmitComment={onSubmitComment}
      onDeleteComment={onDeleteComment}
      onUploadAttachment={onUploadAttachment}
      onDeleteAttachment={onDeleteAttachment}
    />
  ),
  auditSources: {
    primaryEntity: {
      key: "person",
      entity: "Person",
      model: "audit.logs",
      label: "Pessoa",
      fieldLabels: PEOPLE_AUDIT_FIELD_LABELS,
      valueFormatters: {
        avatarUrl: (value) =>
          typeof value === "string" && value.trim() ? "Foto definida" : "Sem foto",
      },
      resolveEntityId: ({ person }) => person.id,
    },
    relatedEntities: [
      {
        key: "comment",
        entity: "PersonComment",
        model: "audit.logs",
        label: "Comentario",
        resolveEntityIds: ({ person }) => (person.comments ?? []).map((item) => item.id),
      },
      {
        key: "attachment",
        entity: "PersonAttachment",
        model: "audit.logs",
        label: "Anexo",
        resolveEntityIds: ({ person }) => (person.attachments ?? []).map((item) => item.id),
      },
      {
        key: "financialEntry",
        entity: "PersonFinancialEntry",
        model: "audit.logs",
        label: "Financeiro",
        resolveEntityIds: ({ relatedAuditEntityIds }) => relatedAuditEntityIds.financialEntryIds,
      },
      {
        key: "healthCondition",
        entity: "PersonHealthCondition",
        model: "audit.logs",
        label: "Saúde",
        resolveEntityIds: ({ relatedAuditEntityIds }) => relatedAuditEntityIds.healthConditionIds,
      },
      {
        key: "medication",
        entity: "PersonMedication",
        model: "audit.logs",
        label: "Medicação",
        resolveEntityIds: ({ relatedAuditEntityIds }) => relatedAuditEntityIds.medicationIds,
      },
      {
        key: "education",
        entity: "PersonEducation",
        model: "audit.logs",
        label: "Escolaridade",
        resolveEntityIds: ({ relatedAuditEntityIds }) => relatedAuditEntityIds.educationIds,
      },
      {
        key: "detention",
        entity: "PersonDetention",
        model: "audit.logs",
        label: "Reclusão",
        resolveEntityIds: ({ relatedAuditEntityIds }) => relatedAuditEntityIds.detentionIds,
      },
      {
        key: "relation",
        entity: "PersonRelation",
        model: "audit.logs",
        label: "Familia",
        resolveEntityIds: ({ relatedAuditEntityIds }) => relatedAuditEntityIds.relationIds,
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
