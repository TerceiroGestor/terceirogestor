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
import { formatDateOnlyPtBR, formatDateTimePtBR } from "@/lib/date";
import type { ApiOccurrence, ApiOccurrencePerson, OccurrenceCaseStatus } from "@/modules/occurrences/api";
import {
  OCCURRENCE_AUDIT_FIELD_LABELS,
  OCCURRENCE_CASE_STATUS_LABELS,
  OCCURRENCE_CASE_STATUS_OPTIONS,
  OCCURRENCE_PERSON_ROLE_LABELS,
} from "@/modules/occurrences/shared/domain/occurrences.constants";
import { DetailSectionField, DetailSectionHeading } from "@/web-client/detail/DetailFormSection";
import { StandardDetailMetadataSide } from "@/web-client/detail/StandardDetailMetadataSide";
import {
  buildGroupedAuditFeed,
  resolveAuditActionLabel,
  resolveAuditChangedFieldsSummary,
} from "@/web-client/detail/audit-feed-utils";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

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

function resolveStatusBadge(status: OccurrenceCaseStatus) {
  const label = OCCURRENCE_CASE_STATUS_LABELS[status] ?? status;
  switch (status) {
    case "DESFECHO_DEFINIDO":
      return <Badge className="border-transparent bg-emerald-600 text-white">{label}</Badge>;
    case "EM_ANALISE":
      return <Badge className="border-transparent bg-amber-500 text-white">{label}</Badge>;
    default:
      return <Badge className="border-transparent bg-blue-600 text-white">{label}</Badge>;
  }
}

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

function peopleColumns({
  canEdit,
  onRemovePerson,
}: Pick<OccurrencesDetailLayoutContext, "canEdit" | "onRemovePerson">): ColumnDef<
  ApiOccurrencePerson,
  unknown
>[] {
  return [
    {
      accessorKey: "person.fullName",
      header: "Pessoa",
      cell: ({ row }) => <div className="font-medium text-foreground">{row.original.person.fullName}</div>,
    },
    {
      accessorKey: "role",
      header: "Papel",
      cell: ({ row }) => (
        <Badge variant="outline">{OCCURRENCE_PERSON_ROLE_LABELS[row.original.role] ?? row.original.role}</Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        canEdit ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                onRemovePerson(row.original);
              }}
            >
              Remover
            </Button>
          </div>
        ) : null,
    },
  ];
}

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

export const occurrencesDetailLayout: DetailLayoutConfig<OccurrencesDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  header: {
    title: ({ occurrence, draft, mode }) =>
      mode === "create" ? "Nova ocorrência" : (occurrence?.title ?? draft.title) || "Ocorrência",
    slot: ({ draft, occurrence, people }) => (
      <div className="border-y border-border/60 bg-transparent px-0 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Status</div>
            <div>{resolveStatusBadge(draft.status)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Origem</div>
            <div className="font-medium text-foreground">
              {resolveOriginLabel(occurrence?.meeting ?? null, draft.meetingId)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Envolvidos</div>
            <div className="font-medium text-foreground">{people.length}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Cadastro</div>
            <div className="font-medium text-foreground">
              {occurrence?.createdAt ? formatDateTimePtBR(occurrence.createdAt) : "-"}
            </div>
          </div>
        </div>
      </div>
    ),
  },
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
      relations: [
        {
          key: "occurrence.people",
          label: "Envolvidos",
          loading: ({ peopleLoading }) => peopleLoading,
          rows: ({ mode, people }) => (mode === "edit" ? people : []),
          columns: (context) => peopleColumns({ canEdit: context.canEdit, onRemovePerson: context.onRemovePerson }),
          getRowId: (row) => row.id,
          onRowClick: (row, context) => context.onOpenPerson(row.person.id),
          action: {
            label: "Adicionar pessoa",
            onClick: (context) => context.onAddPerson(),
            hidden: ({ readOnly, mode, canEdit }) => readOnly || mode !== "edit" || !canEdit,
          },
          searchPlaceholder: "Pesquisar",
          filterRows: (rows, query) => {
            const needle = query.trim().toLocaleLowerCase();
            if (!needle) return rows;
            return rows.filter((row) =>
              [row.person.fullName, OCCURRENCE_PERSON_ROLE_LABELS[row.role] ?? row.role]
                .join(" ")
                .toLocaleLowerCase()
                .includes(needle),
            );
          },
          emptyLabel: ({ mode }) =>
            mode === "create" ? "Salve a ocorrência para vincular pessoas." : "Nenhuma pessoa vinculada.",
        },
      ],
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
