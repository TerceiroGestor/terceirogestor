"use client";

import * as React from "react";
import { HeartHandshake } from "lucide-react";
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
import type { ApiOccurrence, ApiOccurrencePerson, OccurrenceCaseStatus } from "@/modules/occurrences/api";
import {
  OCCURRENCE_AUDIT_FIELD_LABELS,
  OCCURRENCE_CASE_STATUS_LABELS,
  OCCURRENCE_CASE_STATUS_OPTIONS,
  OCCURRENCE_PERSON_ROLE_LABELS,
} from "@/modules/occurrences/shared/domain/occurrences.constants";
import { OccurrencePeopleSection } from "@/modules/occurrences/features/detail/ui/occurrence-people-section";
import { DetailSectionField, DetailSectionHeading } from "@/web-client/detail/DetailFormSection";
import { StandardDetailMetadataSide } from "@/web-client/detail/StandardDetailMetadataSide";
import {
  buildGroupedAuditFeed,
  resolveAuditActionLabel,
  resolveAuditChangedFieldsSummary,
} from "@/web-client/detail/audit-feed-utils";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import type { DetailHeaderActionConfig, DetailLayoutConfig } from "@/web-client/registry/types";

const OCCURRENCE_DETAIL_INPUT_CLASS =
  "h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0";
const OCCURRENCE_DETAIL_TEXTAREA_CLASS =
  "min-h-[120px] rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";
const OCCURRENCE_DETAIL_SECTION_CLASS = "border-y border-border/60 bg-transparent px-0 py-4";

const AUTO_SAVE_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

function resolveOriginLabel(meeting: ApiOccurrence["meeting"], meetingId?: string | null) {
  if (meeting) return `${meeting.action.title} - ${formatDateOnlyPtBR(meeting.scheduledDate)}`;
  if (meetingId) return "Vinculada a um encontro";
  return "Externa (sem encontro)";
}

export type OccurrenceDetailDraft = {
  meetingId: string | null;
  title: string;
  description: string;
  status: OccurrenceCaseStatus;
  outcomeNotes: string;
};

export type OccurrencesDetailLayoutContext = DetailShellAuditContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  canAudit: boolean;
  canEdit: boolean;
  tenantSlug: string;
  occurrence: ApiOccurrence | null;
  draft: OccurrenceDetailDraft;
  setDraft: React.Dispatch<React.SetStateAction<OccurrenceDetailDraft>>;
  people: ApiOccurrencePerson[];
  peopleLoading: boolean;
  onCommitField: <K extends keyof OccurrenceDetailDraft>(
    field: K,
    nextValue?: OccurrenceDetailDraft[K],
  ) => void;
  onOpenPerson: (personId: string) => void;
  onAddPerson: () => void;
  onRemovePerson: (link: ApiOccurrencePerson) => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

function OccurrenceDetailMain({
  draft,
  setDraft,
  readOnly,
  onCommitField,
  occurrence,
}: Pick<OccurrencesDetailLayoutContext, "draft" | "setDraft" | "readOnly" | "onCommitField" | "occurrence">) {
  return (
    <div className={OCCURRENCE_DETAIL_SECTION_CLASS}>
      <DetailSectionField label="Título">
        <Input
          value={draft.title}
          onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
          onBlur={() => onCommitField("title")}
          className={OCCURRENCE_DETAIL_INPUT_CLASS}
          placeholder="Ex.: Desentendimento entre participantes"
          readOnly={readOnly}
        />
      </DetailSectionField>

      <div className="mt-6 space-y-4">
        <DetailSectionHeading title="Classificação" />
        <div className="grid gap-6 md:grid-cols-2 md:items-end">
          <DetailSectionField label="Status">
            <Select
              value={draft.status}
              onValueChange={(value) => {
                const nextValue = value as OccurrenceCaseStatus;
                setDraft((previous) => ({ ...previous, status: nextValue }));
                onCommitField("status", nextValue);
              }}
              disabled={readOnly}
            >
              <SelectTrigger className={OCCURRENCE_DETAIL_INPUT_CLASS}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {OCCURRENCE_CASE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DetailSectionField>
          <DetailSectionField label="Origem">
            <div className="flex h-10 items-center border-b border-border/70 text-sm text-muted-foreground">
              {resolveOriginLabel(occurrence?.meeting ?? null, draft.meetingId)}
            </div>
          </DetailSectionField>
        </div>
      </div>

      <div className="mt-6">
        <DetailSectionField label="Descrição">
          <Textarea
            value={draft.description}
            onChange={(event) => setDraft((previous) => ({ ...previous, description: event.target.value }))}
            onBlur={() => onCommitField("description")}
            className={OCCURRENCE_DETAIL_TEXTAREA_CLASS}
            placeholder="O que aconteceu"
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>

      <div className="mt-6">
        <DetailSectionField label="Desfecho">
          <Textarea
            value={draft.outcomeNotes}
            onChange={(event) => setDraft((previous) => ({ ...previous, outcomeNotes: event.target.value }))}
            onBlur={() => onCommitField("outcomeNotes")}
            className={OCCURRENCE_DETAIL_TEXTAREA_CLASS}
            placeholder="Obrigatório para marcar como 'Desfecho definido'"
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>
    </div>
  );
}

function buildOccurrenceHistoryItems(logs: NonNullable<OccurrencesDetailLayoutContext["detailAudit"]>["logs"]) {
  return buildGroupedAuditFeed(logs).map((group) => {
    const primarySource = group.sourceLabels[0] ?? "Registro";
    const actorName = group.logs[0]?.user?.name?.trim() || group.logs[0]?.user?.email?.trim() || "Sistema";
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

const OCCURRENCE_DETAIL_HEADER_ACTIONS: DetailHeaderActionConfig<OccurrencesDetailLayoutContext>[] = [
  {
    key: "attendance",
    label: "",
    tooltip: "Registrar atendimento a partir desta ocorrência",
    icon: <HeartHandshake className="h-4 w-4" />,
    variant: "default",
    hidden: ({ mode }) => mode !== "edit",
    href: ({ occurrence }) => `/attendances/new?occurrenceId=${occurrence?.id ?? ""}`,
  },
];

export const occurrencesDetailLayout: DetailLayoutConfig<OccurrencesDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  header: {
    actions: OCCURRENCE_DETAIL_HEADER_ACTIONS,
    title: ({ occurrence, draft, mode }) =>
      mode === "create" ? "Nova ocorrência" : (occurrence?.title ?? draft.title) || "Ocorrência",
  },
  mainTab: true,
  main: ({ draft, setDraft, readOnly, onCommitField, occurrence }) => (
    <OccurrenceDetailMain
      draft={draft}
      setDraft={setDraft}
      readOnly={readOnly}
      onCommitField={onCommitField}
      occurrence={occurrence}
    />
  ),
  side: ({
    mode,
    canAudit,
    readOnly,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
  }) => (
    <StandardDetailMetadataSide
      mode={mode}
      canAudit={canAudit}
      readOnly={readOnly}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      history={{
        items: buildOccurrenceHistoryItems(detailAudit?.logs ?? []),
        emptyLabel:
          mode === "create" ? "O histórico aparece após salvar a ocorrência." : "Nenhum histórico disponível.",
      }}
      defaultTab="activity"
    />
  ),
  tabTemplates: [
    {
      key: "people",
      label: "Envolvidos",
      badge: ({ people }) => people.length,
      flushContent: true,
      content: ({ mode, readOnly, canEdit, people, peopleLoading, onOpenPerson, onAddPerson, onRemovePerson }) => (
        <OccurrencePeopleSection
          rows={mode === "edit" ? people : []}
          loading={peopleLoading}
          canEdit={canEdit}
          canAdd={!readOnly && canEdit && mode === "edit"}
          onOpenPerson={onOpenPerson}
          onAddPerson={onAddPerson}
          onRemovePerson={onRemovePerson}
        />
      ),
      emptyLabel: "Salve a ocorrência para vincular pessoas.",
    },
  ],
  auditSources: {
    primaryEntity: {
      key: "occurrence",
      entity: "Occurrence",
      model: "audit.logs",
      label: "Ocorrência",
      fieldLabels: OCCURRENCE_AUDIT_FIELD_LABELS,
      valueFormatters: {
        status: (value) => OCCURRENCE_CASE_STATUS_LABELS[value as string] ?? String(value),
      },
      resolveEntityId: ({ occurrence }) => occurrence?.id,
    },
    relatedEntities: [
      {
        key: "occurrencePeople",
        entity: "OccurrencePeople",
        model: "audit.logs",
        label: "Vínculo",
        fieldLabels: { role: "Papel" },
        valueFormatters: {
          role: (value) => OCCURRENCE_PERSON_ROLE_LABELS[value as string] ?? String(value),
        },
        resolveEntityIds: ({ people }) => people.map((person) => person.id),
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
