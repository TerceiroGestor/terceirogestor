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
import {
  ClipboardList,
  FileLock2,
  GraduationCap,
  HeartPulse,
  IdCard,
  Lock,
  MapPin,
  Network,
  Phone,
  Pill,
  Users,
  Wallet,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/api";
import { PersonContactsPanel } from "@/modules/people/features/contacts/ui/person-contacts-panel";
import { DetentionsPanel } from "@/modules/people/features/detentions/ui/detentions-panel";
import { EducationPanel } from "@/modules/people/features/education/ui/education-panel";
import { FamilyRelationsPanel } from "@/modules/people/features/family-members/ui/family-relations-panel";
import { HealthConditionsPanel } from "@/modules/people/features/health-conditions/ui/health-conditions-panel";
import { MedicationsPanel } from "@/modules/people/features/medications/ui/medications-panel";
import { PeopleFinancialRelationsPanel } from "@/modules/people/features/people-financial/ui/people-financial-relations-panel";
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
  PersonFormData,
  PersonMentionableUser,
} from "@/modules/people/shared/domain/types";
import {
  getAgeFromBirthDate,
  isBirthdayToday,
  resolvePersonDisplayNames,
} from "@/modules/people/shared/domain/utils";
import { buildPeopleTreePath } from "@/modules/people/shared/domain/people-relation-routes";
import { PersonAddressSection } from "@/modules/people/shared/ui/person-address-section";
import { PersonFullRecordDialog } from "@/modules/people/shared/ui/people-detail-sidebar";
import { DetailIdentityMediaField } from "@/web-client/detail/DetailIdentityMediaField";
import { DetailSectionField, DetailSectionHeading } from "@/web-client/detail/DetailFormSection";
import { areTagsEqual } from "@/web-client/detail/tag-utils";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import { StandardDetailMetadataSide } from "@/web-client/detail/StandardDetailMetadataSide";
import type {
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
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
  attachmentUploading: boolean;
  onUploadAttachment: () => void;
  onDeleteAttachment: (attachment: PersonAttachment) => void;
};

const lineInputClassName =
  "h-10 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0";
const lineTextareaClassName =
  "min-h-[120px] rounded-none border-0 border-b border-border/60 bg-transparent px-0 py-3 shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";
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
      <DetailSectionField label="Nome">
        <Input
          value={draft.fullName}
          onChange={(event) => onDraftChange((previous) => ({ ...previous, fullName: event.target.value }))}
          onBlur={(event) => onCommitField?.("fullName", event.target.value)}
          className={lineInputClassName}
          readOnly={readOnly}
        />
      </DetailSectionField>
      <DetailSectionField label="Nome social">
        <Input
          value={draft.socialName ?? ""}
          onChange={(event) => onDraftChange((previous) => ({ ...previous, socialName: event.target.value }))}
          onBlur={(event) => onCommitField?.("socialName", event.target.value || null)}
          className={lineInputClassName}
          readOnly={readOnly}
        />
      </DetailSectionField>
      <DetailSectionField label="Email">
        <Input
          value={draft.email ?? ""}
          onChange={(event) => onDraftChange((previous) => ({ ...previous, email: event.target.value }))}
          onBlur={(event) => onCommitField?.("email", event.target.value || null)}
          className={lineInputClassName}
          readOnly={readOnly}
        />
      </DetailSectionField>
      <DetailSectionField label="Telefone">
        <Input
          value={draft.phone ?? ""}
          onChange={(event) => onDraftChange((previous) => ({ ...previous, phone: event.target.value }))}
          onBlur={(event) => onCommitField?.("phone", event.target.value || null)}
          className={lineInputClassName}
          readOnly={readOnly}
        />
      </DetailSectionField>
      <DetailSectionField label="Nascimento">
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
      </DetailSectionField>
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
      <DetailSectionField label="Tipo">
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
      </DetailSectionField>
      <DetailSectionField label="Sexo">
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
      </DetailSectionField>
      <DetailSectionField label="Gênero">
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
      </DetailSectionField>
      <DetailSectionField label="Raça/Cor">
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
      </DetailSectionField>
      <DetailSectionField label="Estado civil">
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
      </DetailSectionField>
      <DetailSectionField label="Nacionalidade">
        <Input
          value={draft.nationality ?? ""}
          onChange={(event) => onDraftChange((previous) => ({ ...previous, nationality: event.target.value }))}
          onBlur={(event) => onCommitField?.("nationality", event.target.value || null)}
          className={lineInputClassName}
          readOnly={readOnly}
        />
      </DetailSectionField>
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
        <DetailSectionField label="Status">
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
        </DetailSectionField>
      </div>

      {draft.status === "Desligado" ? (
        <DetailSectionField label="Motivo do desligamento">
          <Textarea
            value={draft.departureReason ?? ""}
            onChange={(event) => onDraftChange((previous) => ({ ...previous, departureReason: event.target.value }))}
            onBlur={(event) => onCommitField?.("departureReason", event.target.value || null)}
            className={lineTextareaClassName}
            readOnly={readOnly}
          />
        </DetailSectionField>
      ) : null}
    </div>
  );
}

function BasicDataSection({
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
    <div className="space-y-8">
      <section className="space-y-4">
        <DetailSectionHeading title="Identificação" />
        <IdentificationFields
          draft={draft}
          readOnly={readOnly}
          onDraftChange={onDraftChange}
          onCommitField={onCommitField}
        />
      </section>

      <section className="space-y-4">
        <DetailSectionHeading title="Classificação" />
        <ClassificationFields
          draft={draft}
          readOnly={readOnly}
          onDraftChange={onDraftChange}
          onCommitField={onCommitField}
        />
      </section>

      <section className="space-y-4">
        <DetailSectionHeading title="Status no cadastro" />
        <StatusFields
          draft={draft}
          readOnly={readOnly}
          onDraftChange={onDraftChange}
          onCommitField={onCommitField}
        />
      </section>
    </div>
  );
}

const UNAVAILABLE_BEFORE_SAVE = (
  <div className="border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
    Disponível após salvar o cadastro.
  </div>
);

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
  attachmentUploading,
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
  attachmentUploading: boolean;
  onUploadAttachment: () => void;
  onDeleteAttachment: (attachment: PersonAttachment) => void;
}) {
  return (
    <StandardDetailMetadataSide
      mode={mode}
      readOnly={readOnly}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      canAudit={canAudit}
      notes={{
        value: notesValue,
        onChange: onNotesChange,
        onBlur: onNotesCommit,
        readOnly,
        placeholder: "Notas sobre esta pessoa. Use @ para mencionar alguém.",
        richText: true,
        mentionUsers: mentionableUsers,
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
      tabOrder={["tags", "notes", "attachments", "activity"]}
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
    previous.attachmentUploading === next.attachmentUploading &&
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
  },
  mainTab: { key: "dados-basicos", label: "Dados básicos", icon: <IdCard className="size-4" /> },
  main: ({ draft, readOnly, onDraftChange, onCommitField }) => (
    <BasicDataSection
      draft={draft}
      readOnly={readOnly}
      onDraftChange={onDraftChange}
      onCommitField={onCommitField}
    />
  ),
  tabTemplates: [
    {
      key: "contatos",
      label: "Contatos",
      icon: <Phone className="size-4" />,
      flushContent: true,
      content: ({ mode, person, readOnly }) =>
        mode === "edit" ? (
          <PersonContactsPanel
            personId={person.id}
            seedEmail={person.email}
            seedPhone={person.phone}
            readOnly={readOnly}
          />
        ) : (
          UNAVAILABLE_BEFORE_SAVE
        ),
    },
    {
      key: "endereco",
      label: "Endereço",
      icon: <MapPin className="size-4" />,
      content: ({ mode }) => (mode === "edit" ? <PersonAddressSection /> : UNAVAILABLE_BEFORE_SAVE),
    },
    {
      key: "documentos",
      label: "Documentos sensíveis",
      icon: <FileLock2 className="size-4" />,
      content: ({ mode, person }) =>
        mode === "edit" ? (
          <PersonSensitiveDocumentsPanel personId={person.id} />
        ) : (
          UNAVAILABLE_BEFORE_SAVE
        ),
    },
    {
      key: "familia",
      label: "Família",
      icon: <Users className="size-4" />,
      flushContent: true,
      content: ({ mode, person }) =>
        mode === "edit" ? <FamilyRelationsPanel personId={person.id} /> : UNAVAILABLE_BEFORE_SAVE,
    },
    {
      key: "financeiro",
      label: "Financeiro",
      icon: <Wallet className="size-4" />,
      flushContent: true,
      content: ({ mode, person }) =>
        mode === "edit" ? <PeopleFinancialRelationsPanel personId={person.id} /> : UNAVAILABLE_BEFORE_SAVE,
    },
    {
      key: "saude",
      label: "Saúde",
      icon: <HeartPulse className="size-4" />,
      flushContent: true,
      content: ({ mode, person }) =>
        mode === "edit" ? <HealthConditionsPanel personId={person.id} /> : UNAVAILABLE_BEFORE_SAVE,
    },
    {
      key: "medicacoes",
      label: "Medicação",
      icon: <Pill className="size-4" />,
      flushContent: true,
      content: ({ mode, person }) =>
        mode === "edit" ? <MedicationsPanel personId={person.id} /> : UNAVAILABLE_BEFORE_SAVE,
    },
    {
      key: "escolaridade",
      label: "Escolaridade",
      icon: <GraduationCap className="size-4" />,
      flushContent: true,
      content: ({ mode, person }) =>
        mode === "edit" ? <EducationPanel personId={person.id} /> : UNAVAILABLE_BEFORE_SAVE,
    },
    {
      key: "reclusao",
      label: "Reclusão",
      icon: <Lock className="size-4" />,
      flushContent: true,
      content: ({ mode, person }) =>
        mode === "edit" ? <DetentionsPanel personId={person.id} /> : UNAVAILABLE_BEFORE_SAVE,
    },
    {
      key: "atendimentos",
      label: "Atendimentos",
      icon: <ClipboardList className="size-4" />,
      disabled: true,
      content: () => (
        <div className="px-4 py-6 text-sm text-muted-foreground">Em breve.</div>
      ),
    },
  ],
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
    attachmentUploading,
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
      attachmentUploading={attachmentUploading}
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
