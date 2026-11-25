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
import type { ApiCase, ApiCasePerson, ApiCaseReport, CaseStatus } from "@/modules/cases/api";
import {
  CASE_AUDIT_FIELD_LABELS,
  CASE_STATUS_LABELS,
  CASE_STATUS_OPTIONS,
} from "@/modules/cases/shared/domain/cases.constants";
import { CasePeopleSection } from "@/modules/cases/features/detail/ui/case-people-section";
import { DetailSectionField } from "@/web-client/detail/DetailFormSection";
import { StandardDetailMetadataSide } from "@/web-client/detail/StandardDetailMetadataSide";
import { buildAuditHistoryItems } from "@/web-client/detail/audit-feed-utils";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

const CASE_DETAIL_INPUT_CLASS =
  "h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0";
const CASE_DETAIL_TEXTAREA_CLASS =
  "min-h-[120px] rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";
const CASE_DETAIL_SECTION_CLASS = "border-y border-border/60 bg-transparent px-0 py-4";

const AUTO_SAVE_EDITING = { saveMode: "auto", autoSave: { trigger: "field-commit" } } as const;

export type CaseDetailDraft = {
  title: string;
  summary: string;
  status: CaseStatus;
  closingNotes: string;
};

export type CasesDetailLayoutContext = DetailShellAuditContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  canAudit: boolean;
  canEdit: boolean;
  tenantSlug: string;
  caseItem: ApiCase | null;
  draft: CaseDetailDraft;
  setDraft: React.Dispatch<React.SetStateAction<CaseDetailDraft>>;
  onCommitField: <K extends keyof CaseDetailDraft>(field: K, nextValue?: CaseDetailDraft[K]) => void;
  people: ApiCasePerson[];
  onOpenPerson: (personId: string) => void;
  onAddPerson: () => void;
  onRemovePerson: (link: ApiCasePerson) => void;
  report: ApiCaseReport | null;
  reportLoading: boolean;
  onOpenOccurrence: (occurrenceId: string) => void;
  onOpenAttendance: (attendanceId: string) => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

function CaseDetailMain({
  draft,
  setDraft,
  readOnly,
  onCommitField,
}: Pick<CasesDetailLayoutContext, "draft" | "setDraft" | "readOnly" | "onCommitField">) {
  return (
    <div className={CASE_DETAIL_SECTION_CLASS}>
      <DetailSectionField label="Título" required>
        <Input
          value={draft.title}
          onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
          onBlur={() => onCommitField("title")}
          className={CASE_DETAIL_INPUT_CLASS}
          placeholder="Ex.: Situação de vulnerabilidade da família Silva"
          readOnly={readOnly}
        />
      </DetailSectionField>

      <div className="mt-6">
        <DetailSectionField label="Resumo">
          <Textarea
            value={draft.summary}
            onChange={(event) => setDraft((previous) => ({ ...previous, summary: event.target.value }))}
            onBlur={() => onCommitField("summary")}
            className={CASE_DETAIL_TEXTAREA_CLASS}
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-end">
        <DetailSectionField label="Status">
          <Select
            value={draft.status}
            onValueChange={(value) => {
              const nextValue = value as CaseStatus;
              setDraft((previous) => ({ ...previous, status: nextValue }));
              onCommitField("status", nextValue);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={CASE_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {CASE_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DetailSectionField>
      </div>

      <div className="mt-6">
        <DetailSectionField label="Parecer de encerramento">
          <Textarea
            value={draft.closingNotes}
            onChange={(event) => setDraft((previous) => ({ ...previous, closingNotes: event.target.value }))}
            onBlur={() => onCommitField("closingNotes")}
            className={CASE_DETAIL_TEXTAREA_CLASS}
            placeholder="Obrigatório para marcar como 'Encerrado'"
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>
    </div>
  );
}

function CaseReportTab({
  caseItem,
  report,
  reportLoading,
  onOpenOccurrence,
  onOpenAttendance,
}: Pick<CasesDetailLayoutContext, "caseItem" | "report" | "reportLoading" | "onOpenOccurrence" | "onOpenAttendance">) {
  if (reportLoading || !report) {
    return (
      <div className={CASE_DETAIL_SECTION_CLASS}>
        <p className="text-sm text-muted-foreground">Carregando relatório...</p>
      </div>
    );
  }

  return (
    <div className={CASE_DETAIL_SECTION_CLASS}>
      <p className="text-sm text-foreground">
        Este caso gerou <strong>{report.attendancesCount}</strong> atendimento(s),{" "}
        <strong>{report.occurrencesCount}</strong> ocorrência(s), <strong>{report.evolutionsCount}</strong>{" "}
        evolução(ões), <strong>{report.referralsCount}</strong> encaminhamento(s) e{" "}
        <strong>{report.benefitsCount}</strong> benefício(s).
      </p>
      {report.status === "ENCERRADO" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Desfecho: </span>
          {report.closingNotes || "—"}
        </p>
      ) : null}

      {caseItem?.occurrences.length ? (
        <div className="mt-6">
          <p className="text-xs font-medium text-muted-foreground">Ocorrências vinculadas</p>
          <ul className="mt-2 space-y-1">
            {caseItem.occurrences.map((occurrence) => (
              <li key={occurrence.id}>
                <button
                  type="button"
                  className="text-sm text-primary underline-offset-2 hover:underline"
                  onClick={() => onOpenOccurrence(occurrence.id)}
                >
                  {occurrence.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {caseItem?.attendances.length ? (
        <div className="mt-6">
          <p className="text-xs font-medium text-muted-foreground">Atendimentos vinculados</p>
          <ul className="mt-2 space-y-1">
            {caseItem.attendances.map((attendance) => (
              <li key={attendance.id}>
                <button
                  type="button"
                  className="text-sm text-primary underline-offset-2 hover:underline"
                  onClick={() => onOpenAttendance(attendance.id)}
                >
                  {attendance.type === "SOCIAL" ? "Social" : "Psicológico"} —{" "}
                  {new Date(attendance.scheduledDate).toLocaleDateString("pt-BR")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export const casesDetailLayout: DetailLayoutConfig<CasesDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  mainTab: true,
  header: {
    title: ({ caseItem, draft, mode }) =>
      mode === "create" ? "Novo caso" : (caseItem?.title ?? draft.title) || "Caso",
  },
  main: (context) => (
    <CaseDetailMain
      draft={context.draft}
      setDraft={context.setDraft}
      readOnly={context.readOnly}
      onCommitField={context.onCommitField}
    />
  ),
  side: ({ mode, canAudit, readOnly, detailAudit, auditVisibleCount, onAuditVisibleCountChange }) => (
    <StandardDetailMetadataSide
      mode={mode}
      canAudit={canAudit}
      readOnly={readOnly}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      history={{
        items: buildAuditHistoryItems(detailAudit?.logs ?? []),
        emptyLabel: mode === "create" ? "O histórico aparece após salvar o caso." : "Nenhum histórico disponível.",
      }}
      tabOrder={["activity"]}
      defaultTab="activity"
    />
  ),
  tabTemplates: [
    {
      key: "people",
      label: "Pessoas",
      badge: ({ people }) => people.length,
      flushContent: true,
      content: (context) => (
        <CasePeopleSection
          rows={context.mode === "edit" ? context.people : []}
          canEdit={context.canEdit}
          canAdd={!context.readOnly && context.canEdit && context.mode === "edit"}
          onOpenPerson={context.onOpenPerson}
          onAddPerson={context.onAddPerson}
          onRemovePerson={context.onRemovePerson}
        />
      ),
      emptyLabel: "Salve o caso para vincular pessoas.",
    },
    {
      key: "report",
      label: "Relatório",
      content: (context) => (
        <CaseReportTab
          caseItem={context.caseItem}
          report={context.report}
          reportLoading={context.reportLoading}
          onOpenOccurrence={context.onOpenOccurrence}
          onOpenAttendance={context.onOpenAttendance}
        />
      ),
    },
  ],
  auditSources: {
    primaryEntity: {
      key: "case",
      entity: "Case",
      model: "audit.logs",
      label: "Caso",
      fieldLabels: CASE_AUDIT_FIELD_LABELS,
      valueFormatters: {
        status: (value) => CASE_STATUS_LABELS[value as string] ?? String(value),
      },
      resolveEntityId: ({ caseItem }) => caseItem?.id,
    },
    relatedEntities: [
      {
        key: "casePeople",
        entity: "CasePeople",
        model: "audit.logs",
        label: "Vínculo",
        fieldLabels: {},
        resolveEntityIds: ({ people }) => people.map((person) => person.id),
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
