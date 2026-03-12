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
import { TagInput } from "@/components/ui/tag-input";
import { RichText } from "@/components/ui/richtext/RichText";
import { Tabs } from "@/components/ui/tabs";
import { FamilyRelationsProvider } from "@/modules/people/features/family-members/context/family-relations-context";
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  PERSON_TYPE_OPTIONS,
  RACE_COLOR_OPTIONS,
  SEX_OPTIONS,
  STATUS_OPTIONS,
} from "@/modules/people/shared/domain/people.constants";
import type { Person, PersonFormData } from "@/modules/people/shared/domain/types";
import { getAgeFromBirthDate, isBirthdayToday, resolvePersonDisplayNames } from "@/modules/people/shared/domain/utils";
import { personFormSteps } from "@/modules/people/shared/config/people-form-config";
import type { PeopleDetailTabValue } from "@/modules/people/shared/domain/people-relation-routes";
import { PeopleDetailContent } from "@/modules/people/shared/ui/people-detail-content";
import { PeopleDetailSidebar } from "@/modules/people/shared/ui/people-detail-sidebar";
import { PeopleDetailTabs } from "@/modules/people/shared/ui/people-detail-tabs";
import { DetailAuditFeed } from "@/web-client/detail/DetailAuditFeed";
import { DetailFormSteps, type DetailFormStep } from "@/web-client/detail/DetailFormSteps";
import { DetailIdentityMediaField } from "@/web-client/detail/DetailIdentityMediaField";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import { DetailSideTabs } from "@/web-client/detail/DetailSideTabs";
import { buildGroupedAuditFeed } from "@/web-client/detail/audit-feed-utils";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

export type PeopleDetailLayoutContext = DetailShellAuditContext & {
  person: Person;
  draft: PersonFormData;
  readOnly: boolean;
  avatarUploading: boolean;
  canAudit: boolean;
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

function IdentificationStep({
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
                {option}
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
            <SelectItem value="__empty__">Nao informado</SelectItem>
            {SEX_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SectionField>
      <SectionField label="Genero">
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
            <SelectItem value="__empty__">Nao informado</SelectItem>
            {GENDER_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SectionField>
      <SectionField label="Raca/Cor">
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
            <SelectItem value="__empty__">Nao informado</SelectItem>
            {RACE_COLOR_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
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
            <SelectItem value="__empty__">Nao informado</SelectItem>
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

function OrganizationStep({
  draft,
  readOnly,
  tagSuggestions,
  onDraftChange,
  onCommitField,
  onCommitDraft,
}: {
  draft: PersonFormData;
  readOnly: boolean;
  tagSuggestions: string[];
  onDraftChange: React.Dispatch<React.SetStateAction<PersonFormData>>;
  onCommitField?: <K extends keyof PersonFormData>(field: K, nextValue?: PersonFormData[K]) => void;
  onCommitDraft?: (nextDraft: PersonFormData) => void;
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
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SectionField>
      </div>

      <SectionField label="Tags">
        <TagInput
          value={draft.tags ?? []}
          onChange={(tags) => {
            const nextDraft = { ...draft, tags };
            onDraftChange(() => nextDraft);
            onCommitDraft?.(nextDraft);
          }}
          suggestions={tagSuggestions}
          disabled={readOnly}
        />
      </SectionField>

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

function NotesStep({
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

function PeopleInlineForm({
  step,
  draft,
  readOnly,
  tagSuggestions,
  onDraftChange,
  onCommitField,
  onCommitDraft,
}: {
  step: string;
  draft: PersonFormData;
  readOnly: boolean;
  tagSuggestions: string[];
  onDraftChange: React.Dispatch<React.SetStateAction<PersonFormData>>;
  onCommitField?: <K extends keyof PersonFormData>(field: K, nextValue?: PersonFormData[K]) => void;
  onCommitDraft?: (nextDraft: PersonFormData) => void;
}) {
  if (step === "organization") {
    return (
      <OrganizationStep
        draft={draft}
        readOnly={readOnly}
        tagSuggestions={tagSuggestions}
        onDraftChange={onDraftChange}
        onCommitField={onCommitField}
        onCommitDraft={onCommitDraft}
      />
    );
  }

  if (step === "notes") {
    return (
      <NotesStep
        draft={draft}
        readOnly={readOnly}
        onDraftChange={onDraftChange}
        onCommitDraft={onCommitDraft}
      />
    );
  }

  return (
    <IdentificationStep
      draft={draft}
      readOnly={readOnly}
      onDraftChange={onDraftChange}
      onCommitField={onCommitField}
    />
  );
}

function PeopleDetailMain({
  person,
  draft,
  readOnly,
  tagSuggestions,
  onDraftChange,
  onCommitField,
  onCommitDraft,
  tabValue,
  onTabChange,
}: {
  person: Person;
  draft: PersonFormData;
  readOnly: boolean;
  tagSuggestions: string[];
  onDraftChange: React.Dispatch<React.SetStateAction<PersonFormData>>;
  onCommitField?: <K extends keyof PersonFormData>(field: K, nextValue?: PersonFormData[K]) => void;
  onCommitDraft?: (nextDraft: PersonFormData) => void;
  tabValue: PeopleDetailTabValue;
  onTabChange: (value: PeopleDetailTabValue) => void;
}) {
  const steps = React.useMemo<DetailFormStep[]>(
    () =>
      personFormSteps.map((step, index) => ({
        key: index === 0 ? "identification" : index === 1 ? "organization" : "notes",
        title: step.title,
        description: typeof step.description === "string" ? step.description : undefined,
      })),
    [],
  );
  const [formStep, setFormStep] = React.useState<string>("identification");

  return (
    <FamilyRelationsProvider personId={person.id} initialMode="summary">
      <div className="space-y-6">
        <DetailFormSteps steps={steps} value={formStep} onValueChange={setFormStep} />

        <PeopleInlineForm
          step={formStep}
          draft={draft}
          readOnly={readOnly}
          tagSuggestions={tagSuggestions}
          onDraftChange={onDraftChange}
          onCommitField={onCommitField}
          onCommitDraft={onCommitDraft}
        />

        <Tabs
          value={tabValue}
          onValueChange={(value) => onTabChange(value as PeopleDetailTabValue)}
          className="flex flex-col gap-4"
        >
          <div className="shrink-0">
            <PeopleDetailTabs value={tabValue} onValueChange={onTabChange} />
          </div>
          <PeopleDetailContent person={person} />
        </Tabs>
      </div>
    </FamilyRelationsProvider>
  );
}

function PeopleDetailSide({
  person,
  canAudit,
  detailAudit,
  auditVisibleCount,
  onAuditVisibleCountChange,
}: {
  person: Person;
  canAudit: boolean;
  detailAudit?: DetailShellAuditContext["detailAudit"];
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
}) {
  const ageValue = getAgeFromBirthDate(person.birthDate);
  const ageLabel = ageValue !== null ? `${ageValue} anos` : "-";
  const isTodayBirthdayValue = isBirthdayToday(person.birthDate);
  const auditCount = buildGroupedAuditFeed(detailAudit?.logs ?? []).length;

  const handleCopy = React.useCallback((value: string) => {
    if (!value || !navigator?.clipboard?.writeText) return;
    void navigator.clipboard.writeText(value);
  }, []);

  return (
    <FamilyRelationsProvider personId={person.id} initialMode="summary">
      <DetailSideTabs
        tabs={[
          {
            value: "profile",
            label: "Perfil",
            content: (
              <PeopleDetailSidebar
                person={person}
                ageLabel={ageLabel}
                isTodayBirthday={isTodayBirthdayValue}
                onCopy={handleCopy}
              />
            ),
          },
          {
            value: "activity",
            label: "Atividade",
            badge: canAudit && auditCount ? auditCount : undefined,
            content: canAudit ? (
              <DetailAuditFeed
                mode="edit"
                auditState={detailAudit}
                auditVisibleCount={auditVisibleCount}
                onAuditVisibleCountChange={onAuditVisibleCountChange}
              />
            ) : (
              <div className="border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
                Sem permissao para auditoria.
              </div>
            ),
          },
        ]}
        defaultValue="profile"
      />
    </FamilyRelationsProvider>
  );
}

export const PEOPLE_AUDIT_FIELD_LABELS: Record<string, string> = {
  fullName: "Nome completo",
  socialName: "Nome social",
  birthDate: "Nascimento",
  sex: "Sexo",
  gender: "Genero",
  raceColor: "Raca/Cor",
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

export const peopleDetailLayout: DetailLayoutConfig<PeopleDetailLayoutContext> = {
  editing: AUTO_EDITING,
  header: {
    title: ({ person }) => resolvePersonDisplayNames(person.fullName, person.socialName).primary,
    leadingSlot: ({ person, readOnly, avatarUploading, onAvatarFileSelect }) => (
      <DetailIdentityMediaField
        variant="header"
        name={resolvePersonDisplayNames(person.fullName, person.socialName).primary}
        value={person.avatarUrl ?? null}
        readOnly={readOnly}
        busy={avatarUploading}
        onFileSelect={onAvatarFileSelect}
      />
    ),
    slot: ({ person }) => (
      <div className="border-y border-border/60 bg-transparent px-0 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Status</div>
            <div className="font-medium text-foreground">{person.status ?? "Sem status"}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Tipo</div>
            <div className="font-medium text-foreground">{person.personType ?? "Sem tipo"}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Nascimento</div>
            <div className="font-medium text-foreground">{person.birthDate ?? "-"}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Cadastro</div>
            <div className="font-medium text-foreground">{person.createdAt ?? "-"}</div>
          </div>
        </div>
      </div>
    ),
  },
  main: ({
    person,
    draft,
    readOnly,
    tagSuggestions,
    onDraftChange,
    onCommitField,
    onCommitDraft,
    tabValue,
    onTabChange,
  }) => (
    <PeopleDetailMain
      person={person}
      draft={draft}
      readOnly={readOnly}
      tagSuggestions={tagSuggestions}
      onDraftChange={onDraftChange}
      onCommitField={onCommitField}
      onCommitDraft={onCommitDraft}
      tabValue={tabValue}
      onTabChange={onTabChange}
    />
  ),
  side: ({
    person,
    canAudit,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
  }) => (
    <PeopleDetailSide
      person={person}
      canAudit={canAudit}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
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
    filters: () => ({ entity: "Person" }),
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
