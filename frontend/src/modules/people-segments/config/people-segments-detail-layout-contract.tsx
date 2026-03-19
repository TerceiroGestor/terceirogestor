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
  ApiPeopleSegment,
  ApiPeopleSegmentMembership,
} from "@/modules/people-segments/api";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { DetailAuditFeed } from "@/web-client/detail/DetailAuditFeed";
import { DetailNotesPanel } from "@/web-client/detail/DetailNotesPanel";
import { DetailSideTabs } from "@/web-client/detail/DetailSideTabs";
import { buildGroupedAuditFeed } from "@/web-client/detail/audit-feed-utils";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

const PEOPLE_SEGMENT_DETAIL_INPUT_CLASS =
  "h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0";
const PEOPLE_SEGMENT_DETAIL_TEXTAREA_CLASS =
  "min-h-[180px] rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";
const PEOPLE_SEGMENT_DETAIL_SECTION_CLASS =
  "border-y border-border/60 bg-transparent px-0 py-4";

const AUTO_SAVE_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

const PEOPLE_SEGMENT_AUDIT_FIELD_LABELS = {
  name: "Nome",
  category: "Categoria",
  description: "Descricao",
  ageMin: "Idade minima",
  ageMax: "Idade maxima",
  isActive: "Status",
  internalNotes: "Notas internas",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

const PEOPLE_GROUP_CATEGORY_OPTIONS = [
  { value: "Ciclo", label: "Ciclo" },
  { value: "Publico", label: "Publico" },
  { value: "Equipe", label: "Equipe" },
  { value: "Relacionamento", label: "Relacionamento" },
  { value: "Rede", label: "Rede" },
  { value: "Outro", label: "Outro" },
] as const;

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

function formatMembershipStatus(row: ApiPeopleSegmentMembership) {
  return row.isActive && !row.deletedAt ? "Ativo" : "Encerrado";
}

function formatPeriod(startsAt: string | null | undefined, endsAt: string | null | undefined) {
  if (!startsAt && !endsAt) return "Nao informada";
  return `${startsAt ? formatDateOnlyPtBR(startsAt) : "-"} ate ${endsAt ? formatDateOnlyPtBR(endsAt) : "-"}`;
}

export type PeopleSegmentDetailDraft = {
  name: string;
  category: string;
  description: string;
  ageMin: string;
  ageMax: string;
  isActive: boolean;
  internalNotes: string | null;
};

export type PeopleSegmentsDetailLayoutContext = DetailShellAuditContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  canAudit: boolean;
  canEdit: boolean;
  canManageMemberships: boolean;
  tenantSlug: string;
  segment: ApiPeopleSegment | null;
  draft: PeopleSegmentDetailDraft;
  setDraft: React.Dispatch<React.SetStateAction<PeopleSegmentDetailDraft>>;
  memberships: ApiPeopleSegmentMembership[];
  historyMemberships: ApiPeopleSegmentMembership[];
  membershipsLoading: boolean;
  onCommitField: <K extends keyof PeopleSegmentDetailDraft>(
    field: K,
    nextValue?: PeopleSegmentDetailDraft[K],
  ) => void;
  onNotesChange: (next: string | null) => void;
  onNotesBlur: () => void;
  onOpenPerson: (personId: string) => void;
  onCreateMembership: () => void;
  onEndMembership: (membership: ApiPeopleSegmentMembership) => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

function membershipColumns({
  canManageMemberships,
  onEndMembership,
  tenantSlug,
}: Pick<
  PeopleSegmentsDetailLayoutContext,
  "canManageMemberships" | "onEndMembership" | "tenantSlug"
>): ColumnDef<ApiPeopleSegmentMembership, unknown>[] {
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
          <div className="text-foreground">{formatMembershipStatus(row.original)}</div>
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
        canManageMemberships && row.original.isActive ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                onEndMembership(row.original);
              }}
            >
              Encerrar vinculo
            </Button>
          </div>
        ) : null,
    },
  ];
}

function PeopleSegmentsDetailMain({
  draft,
  setDraft,
  readOnly,
  onCommitField,
}: Pick<
  PeopleSegmentsDetailLayoutContext,
  "draft" | "setDraft" | "readOnly" | "onCommitField"
>) {
  return (
    <div className={PEOPLE_SEGMENT_DETAIL_SECTION_CLASS}>
      <div className="grid gap-3 md:grid-cols-[1.4fr_240px_180px] md:items-end">
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Nome</div>
          <Input
            value={draft.name}
            onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))}
            onBlur={() => onCommitField("name")}
            className={PEOPLE_SEGMENT_DETAIL_INPUT_CLASS}
            placeholder="Nome do grupo de pessoas"
            readOnly={readOnly}
          />
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Categoria</div>
          <Select
            value={draft.category}
            onValueChange={(value) => {
              setDraft((previous) => ({ ...previous, category: value }));
              onCommitField("category", value);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={PEOPLE_SEGMENT_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {PEOPLE_GROUP_CATEGORY_OPTIONS.map((option) => (
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
            value={draft.isActive ? "active" : "inactive"}
            onValueChange={(value) => {
              const nextValue = value === "active";
              setDraft((previous) => ({ ...previous, isActive: nextValue }));
              onCommitField("isActive", nextValue);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={PEOPLE_SEGMENT_DETAIL_INPUT_CLASS}>
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
            className={PEOPLE_SEGMENT_DETAIL_INPUT_CLASS}
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
            className={PEOPLE_SEGMENT_DETAIL_INPUT_CLASS}
            placeholder="Ex.: 14"
            readOnly={readOnly}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-medium text-muted-foreground">Descricao</div>
        <Textarea
          value={draft.description}
          onChange={(event) => setDraft((previous) => ({ ...previous, description: event.target.value }))}
          onBlur={() => onCommitField("description")}
          className={PEOPLE_SEGMENT_DETAIL_TEXTAREA_CLASS}
          placeholder="Descricao do grupo de pessoas"
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

function PeopleSegmentsDetailSide({
  mode,
  canAudit,
  readOnly,
  draft,
  memberships,
  historyMemberships,
  detailAudit,
  auditVisibleCount,
  onAuditVisibleCountChange,
  onNotesChange,
  onNotesBlur,
}: Pick<
  PeopleSegmentsDetailLayoutContext,
  | "mode"
  | "canAudit"
  | "readOnly"
  | "draft"
  | "memberships"
  | "historyMemberships"
  | "detailAudit"
  | "auditVisibleCount"
  | "onAuditVisibleCountChange"
  | "onNotesChange"
  | "onNotesBlur"
>) {
  const auditCount = buildGroupedAuditFeed(detailAudit?.logs ?? []).length;
  const activeCount = memberships.filter((membership) => membership.isActive).length;

  return (
    <DetailSideTabs
      tabs={[
        {
          value: "activity",
          label: "Auditoria",
          badge: canAudit && auditCount ? auditCount : undefined,
          content: canAudit ? (
            <DetailAuditFeed
              mode={mode}
              auditState={detailAudit}
              auditVisibleCount={auditVisibleCount}
              onAuditVisibleCountChange={onAuditVisibleCountChange}
            />
          ) : (
            <div className="text-sm text-muted-foreground">Sem permissao para auditoria.</div>
          ),
        },
        {
          value: "notes",
          label: "Anotacoes",
          content: (
            <DetailNotesPanel
              value={draft.internalNotes}
              onChange={onNotesChange}
              onBlur={onNotesBlur}
              readOnly={readOnly}
            />
          ),
        },
        {
          value: "history",
          label: "Historico",
          badge: historyMemberships.length || undefined,
          content: historyMemberships.length ? (
            <div className="space-y-4">
              {historyMemberships.map((membership) => (
                <div
                  key={membership.id}
                  className="space-y-1 border-b border-border/50 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="font-medium text-foreground">
                    {membership.person.fullName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {membership.person.personType ?? "-"} - {membership.person.status ?? "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPeriod(membership.startsAt, membership.endsAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Nenhuma participacao encerrada.
            </div>
          ),
        },
        {
          value: "context",
          label: "Contexto",
          content: (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Categoria</span>
                <span className="text-foreground">{draft.category.trim() || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Status</span>
                <span className="text-foreground">{formatStatus(draft.isActive)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Faixa etaria</span>
                <span className="text-right text-foreground">{formatAgeRange(draft.ageMin, draft.ageMax)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Ativos</span>
                <span className="text-foreground">{activeCount}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Historico</span>
                <span className="text-foreground">{memberships.length}</span>
              </div>
            </div>
          ),
        },
      ]}
      defaultValue="activity"
    />
  );
}

export const peopleSegmentsDetailLayout: DetailLayoutConfig<PeopleSegmentsDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  header: {
    title: ({ segment, draft, mode }) =>
      mode === "create"
        ? "Novo grupo de pessoas"
        : ((segment?.name ?? draft.name) || "Grupo de Pessoas"),
    slot: ({ draft, memberships }) => (
      <div className="border-y border-border/60 bg-transparent px-0 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Status</div>
            <div>{resolveStatusBadge(draft.isActive)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Categoria</div>
            <div className="font-medium text-foreground">{draft.category.trim() || "-"}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Faixa etaria</div>
            <div className="font-medium text-foreground">{formatAgeRange(draft.ageMin, draft.ageMax)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">People</div>
            <div className="font-medium text-foreground">
              {memberships.filter((membership) => membership.isActive).length}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  main: ({ draft, setDraft, readOnly, onCommitField }) => (
    <PeopleSegmentsDetailMain
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
    memberships,
    historyMemberships,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    onNotesChange,
    onNotesBlur,
  }) => (
    <PeopleSegmentsDetailSide
      mode={mode}
      canAudit={canAudit}
      readOnly={readOnly}
      draft={draft}
      memberships={memberships}
      historyMemberships={historyMemberships}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      onNotesChange={onNotesChange}
      onNotesBlur={onNotesBlur}
    />
  ),
  tabTemplates: [
    {
      key: "participants",
      label: "People",
      badge: ({ memberships }) => memberships.filter((membership) => membership.isActive).length,
      relations: [
        {
      key: "people-segment.memberships",
          label: "People",
          loading: ({ membershipsLoading }) => membershipsLoading,
          rows: ({ mode, memberships }) => (mode === "edit" ? memberships : []),
          columns: (context) =>
            membershipColumns({
              canManageMemberships: context.canManageMemberships,
              onEndMembership: context.onEndMembership,
              tenantSlug: context.tenantSlug,
            }),
          getRowId: (row) => row.id,
          onRowClick: (row, context) => context.onOpenPerson(row.person.id),
          action: {
            label: "Adicionar people",
            onClick: (context) => context.onCreateMembership(),
            hidden: ({ readOnly, mode, canManageMemberships }) =>
              readOnly || mode !== "edit" || !canManageMemberships,
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
                formatMembershipStatus(row),
                formatPeriod(row.startsAt, row.endsAt),
              ]
                .join(" ")
                .toLocaleLowerCase()
                .includes(needle),
            );
          },
          emptyLabel: ({ mode }) =>
            mode === "create"
              ? "Salve o grupo de pessoas para gerenciar people."
              : "Nenhuma pessoa vinculada.",
        },
      ],
    },
  ],
  auditSources: {
    primaryEntity: {
      key: "peopleSegment",
      entity: "PeopleGroup",
      model: "audit.logs",
      label: "Grupo de Pessoas",
      fieldLabels: PEOPLE_SEGMENT_AUDIT_FIELD_LABELS,
      valueFormatters: {
        isActive: (value) => formatStatus(value === true),
      },
      resolveEntityId: ({ segment }) => segment?.id,
    },
    relatedEntities: [
      {
        key: "peopleSegmentMembership",
        entity: "PeopleGroupParticipation",
        model: "audit.logs",
        label: "Vinculo",
        fieldLabels: {
          startsAt: "Inicio",
          endsAt: "Fim",
          isActive: "Status",
          internalNotes: "Notas internas",
          deletedAt: "Encerrado em",
        },
        valueFormatters: {
          isActive: (value) => formatStatus(value === true),
        },
        resolveEntityIds: ({ memberships }) => memberships.map((membership) => membership.id),
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
