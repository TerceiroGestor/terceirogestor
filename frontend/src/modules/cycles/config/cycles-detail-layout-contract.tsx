"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ApiCycle, CycleAudienceType } from "@/modules/cycles/api";
import {
  CYCLE_AUDIENCE_LABELS,
  CYCLE_AUDIENCE_OPTIONS,
  CYCLE_STATUS_OPTIONS,
} from "@/modules/cycles/shared/domain/cycles.constants";
import { DetailAuditFeed } from "@/web-client/detail/DetailAuditFeed";
import { DetailNotesPanel } from "@/web-client/detail/DetailNotesPanel";
import { DetailSideTabs } from "@/web-client/detail/DetailSideTabs";
import { buildGroupedAuditFeed } from "@/web-client/detail/audit-feed-utils";
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
  internalNotes: "Notas internas",
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

export type CycleDetailDraft = {
  name: string;
  description: string;
  audienceType: CycleAudienceType | "";
  ageMin: string;
  ageMax: string;
  isActive: boolean;
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
  onCommitField: <K extends keyof CycleDetailDraft>(
    field: K,
    nextValue?: CycleDetailDraft[K],
  ) => void;
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
    </div>
  );
}

function CyclesDetailSide({
  mode,
  canAudit,
  readOnly,
  draft,
  detailAudit,
  auditVisibleCount,
  onAuditVisibleCountChange,
  onNotesChange,
  onNotesBlur,
}: Pick<
  CyclesDetailLayoutContext,
  | "mode"
  | "canAudit"
  | "readOnly"
  | "draft"
  | "detailAudit"
  | "auditVisibleCount"
  | "onAuditVisibleCountChange"
  | "onNotesChange"
  | "onNotesBlur"
>) {
  const auditCount = buildGroupedAuditFeed(detailAudit?.logs ?? []).length;

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
          value: "context",
          label: "Contexto",
          content: (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Publico</span>
                <span className="text-foreground">{formatAudienceType(draft.audienceType)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Status</span>
                <span className="text-foreground">{formatStatus(draft.isActive)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Faixa etaria</span>
                <span className="text-right text-foreground">
                  {formatAgeRange(draft.ageMin, draft.ageMax)}
                </span>
              </div>
            </div>
          ),
        },
      ]}
      defaultValue="activity"
    />
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
            <div className="font-medium text-foreground">
              {formatAgeRange(draft.ageMin, draft.ageMax)}
            </div>
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
    draft,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    onNotesChange,
    onNotesBlur,
  }) => (
    <CyclesDetailSide
      mode={mode}
      canAudit={canAudit}
      readOnly={readOnly}
      draft={draft}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      onNotesChange={onNotesChange}
      onNotesBlur={onNotesBlur}
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
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
