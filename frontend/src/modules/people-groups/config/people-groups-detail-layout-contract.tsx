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
import type {
  ApiPeopleGroup,
  ApiPeopleGroupParticipation,
} from "@/modules/people-groups/api";
import {
  PEOPLE_GROUP_AUDIT_FIELD_LABELS,
  PEOPLE_GROUP_CATEGORY_OPTIONS,
  PEOPLE_GROUP_PURPOSE_OPTIONS,
  PEOPLE_GROUP_TYPE_OPTIONS,
} from "@/modules/people-groups/shared/domain/people-groups.constants";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { DetailSectionField } from "@/web-client/detail/DetailFormSection";
import { StandardDetailMetadataSide } from "@/web-client/detail/StandardDetailMetadataSide";
import {
  buildGroupedAuditFeed,
  resolveAuditActionLabel,
  resolveAuditChangedFieldsSummary,
} from "@/web-client/detail/audit-feed-utils";
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

function resolveStatusBadge(isActive: boolean) {
  return isActive ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>;
}

function formatAgeRange(ageMin: string | number | null | undefined, ageMax: string | number | null | undefined) {
  const min = ageMin === "" || ageMin === undefined ? null : ageMin;
  const max = ageMax === "" || ageMax === undefined ? null : ageMax;
  if (min === null && max === null) return "Livre";
  return `${min ?? "-"} a ${max ?? "-"}`;
}

function resolveGroupTypeLabel(groupType: ApiPeopleGroup["groupType"] | undefined) {
  return PEOPLE_GROUP_TYPE_OPTIONS.find((option) => option.value === groupType)?.label ?? "-";
}

function formatParticipationStatus(row: ApiPeopleGroupParticipation) {
  return row.isActive && !row.deletedAt ? "Ativo" : "Encerrado";
}

function formatPeriod(startsAt: string | null | undefined, endsAt: string | null | undefined) {
  if (!startsAt && !endsAt) return "Não informada";
  return `${startsAt ? formatDateOnlyPtBR(startsAt) : "-"} até ${endsAt ? formatDateOnlyPtBR(endsAt) : "-"}`;
}

export type PeopleGroupDetailDraft = {
  name: string;
  groupType: ApiPeopleGroup["groupType"];
  purpose: "PUBLICO" | "EQUIPE";
  category: string;
  description: string;
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
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

function participationColumns({
  canManageParticipations,
  onEndParticipation,
  tenantSlug,
}: Pick<
  PeopleGroupsDetailLayoutContext,
  "canManageParticipations" | "onEndParticipation" | "tenantSlug"
>): ColumnDef<ApiPeopleGroupParticipation, unknown>[] {
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
            socialName={row.original.person.socialName}
            birthDate={row.original.person.birthDate ?? null}
            avatarUrl={row.original.person.avatarUrl}
            hasHealthCondition={row.original.person.hasHealthCondition ?? false}
            hasMedication={row.original.person.hasMedication ?? false}
          />
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">{row.original.person.fullName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.person.personType ?? "-"} - {row.original.person.status ?? "-"}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "person.personType",
      header: "Tipo",
      cell: ({ row }) => row.original.person.personType ?? "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="text-foreground">{formatParticipationStatus(row.original)}</div>
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
        canManageParticipations && row.original.isActive ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                onEndParticipation(row.original);
              }}
            >
              Encerrar vínculo
            </Button>
          </div>
        ) : null,
    },
  ];
}

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
            placeholder="Nome do Grupo"
            readOnly={readOnly}
          />
        </DetailSectionField>
        <DetailSectionField label="Tipo do grupo">
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
              <SelectValue placeholder="Tipo do grupo" />
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
            placeholder="Descrição do Grupo"
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>
    </div>
  );
}

function buildPeopleGroupsHistoryItems(
  logs: NonNullable<PeopleGroupsDetailLayoutContext["detailAudit"]>["logs"],
) {
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

export const peopleGroupsDetailLayout: DetailLayoutConfig<PeopleGroupsDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  header: {
    title: ({ group, draft, mode }) =>
      mode === "create"
        ? "Novo Grupo"
        : ((group?.name ?? draft.name) || "Grupo"),
    slot: ({ draft, participations }) => (
      <div className="border-y border-border/60 bg-transparent px-0 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Status</div>
            <div>{resolveStatusBadge(draft.isActive)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Tipo</div>
            <div className="font-medium text-foreground">{resolveGroupTypeLabel(draft.groupType)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Finalidade</div>
            <div className="font-medium text-foreground">
              {draft.purpose === "EQUIPE" ? "Equipe institucional" : "Público atendido"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Categoria</div>
            <div className="font-medium text-foreground">{draft.category.trim() || "-"}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Faixa etária</div>
            <div className="font-medium text-foreground">{formatAgeRange(draft.ageMin, draft.ageMax)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Participantes</div>
            <div className="font-medium text-foreground">
              {participations.filter((participation) => participation.isActive).length}
            </div>
          </div>
        </div>
      </div>
    ),
  },
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
    draft,
    participations,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    onNotesChange,
    onNotesBlur,
  }) => (
    <StandardDetailMetadataSide
      mode={mode}
      canAudit={canAudit}
      readOnly={readOnly}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      notes={{
        value: draft.internalNotes,
        onChange: onNotesChange,
        onBlur: onNotesBlur,
        readOnly,
      }}
      history={{
        items: buildPeopleGroupsHistoryItems(detailAudit?.logs ?? []),
        emptyLabel:
          mode === "create"
            ? "O histórico aparece após salvar o Grupo."
            : "Nenhum histórico disponível para este Grupo.",
      }}
      contextItems={[
        { key: "groupType", label: "Tipo", value: resolveGroupTypeLabel(draft.groupType) },
        {
          key: "purpose",
          label: "Finalidade",
          value: draft.purpose === "EQUIPE" ? "Equipe institucional" : "Público atendido",
        },
        { key: "category", label: "Categoria", value: draft.category.trim() || "-" },
        { key: "status", label: "Status", value: formatStatus(draft.isActive) },
        { key: "ageRange", label: "Faixa etária", value: formatAgeRange(draft.ageMin, draft.ageMax) },
        {
          key: "participants",
          label: "Participantes ativos",
          value: participations.filter((participation) => participation.isActive).length,
        },
      ]}
      defaultTab="activity"
    />
  ),
  tabTemplates: [
    {
      key: "participants",
      label: "Participantes",
      badge: ({ participations }) => participations.filter((participation) => participation.isActive).length,
      relations: [
        {
          key: "people-group.participations",
          label: "Participantes",
          loading: ({ participationsLoading }) => participationsLoading,
          rows: ({ mode, participations }) => (mode === "edit" ? participations : []),
          columns: (context) =>
            participationColumns({
              canManageParticipations: context.canManageParticipations,
              onEndParticipation: context.onEndParticipation,
              tenantSlug: context.tenantSlug,
            }),
          getRowId: (row) => row.id,
          onRowClick: (row, context) => context.onOpenPerson(row.person.id),
          action: {
            label: "Novo",
            onClick: (context) => context.onCreateParticipation(),
            hidden: ({ readOnly, mode, canManageParticipations }) =>
              readOnly || mode !== "edit" || !canManageParticipations,
          },
          searchPlaceholder: "Pesquisar",
          filterRows: (rows, query) => {
            const needle = query.trim().toLocaleLowerCase();
            if (!needle) return rows;
            return rows.filter((row) =>
              [
                row.person.fullName,
                row.person.socialName ?? "",
                row.person.personType ?? "",
                row.person.status ?? "",
                formatParticipationStatus(row),
                formatPeriod(row.startsAt, row.endsAt),
              ]
                .join(" ")
                .toLocaleLowerCase()
                .includes(needle),
            );
          },
          emptyLabel: ({ mode }) =>
            mode === "create"
              ? "Salve o Grupo para gerenciar participantes."
              : "Nenhuma pessoa vinculada.",
        },
      ],
    },
  ],
  auditSources: {
    primaryEntity: {
      key: "peopleGroup",
      entity: "PeopleGroup",
      model: "audit.logs",
      label: "Grupo",
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
