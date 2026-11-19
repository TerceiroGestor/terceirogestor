"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  QualityNotesDialog,
  buildQualityColumns,
  type QualityAttendanceRow,
  type QualityDraft,
  type QualityNotesDialogState,
} from "@/modules/actions/features/manage/ui/action-operational-relations";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";
import { matchesDomainRecord } from "@/web-client/domain/evaluate";
import type { Domain } from "@/web-client/domain/types";
import type { SearchFieldDefinition } from "@/web-client/search/types";
import {
  RecordBrowserViewSwitcher,
  type RecordBrowserViewOption,
} from "@/components/record-browser/RecordBrowserViewSwitcher";
import { getStandardViewIcon } from "@/web-client/registry/view-icons";

const VIEW_OPTIONS: RecordBrowserViewOption<"list">[] = [
  { value: "list", label: "Lista", icon: getStandardViewIcon("list") },
];

const HIGHLIGHT_FILTER_OPTIONS = [
  { value: "true", label: "Destaque" },
  { value: "false", label: "Sem destaque" },
];

function formatOccurrenceLabel(scheduledDate: string) {
  return new Date(scheduledDate).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function qualityRowId(row: QualityAttendanceRow) {
  return `${row.occurrenceId}::${row.enrollment.id}`;
}

export function ActionQualitySection({
  rows,
  loading,
  error,
  canUpdate,
  canReadPeople,
  tenantSlug,
  qualityDrafts,
  qualitySaving,
  getQualityEffective,
  setQualityRowDraft,
  saveQualityDrafts,
  qualityNotesDialog,
  onQualityNotesDialogChange,
  applyQualityNotesDialog,
}: {
  rows: QualityAttendanceRow[];
  loading: boolean;
  error: string | null;
  canUpdate: boolean;
  canReadPeople: boolean;
  tenantSlug: string;
  qualityDrafts: Record<string, QualityDraft>;
  qualitySaving: boolean;
  getQualityEffective: (row: QualityAttendanceRow) => {
    qualityScore: number | null;
    qualityNotes: string | null;
    isHighlight: boolean;
  };
  setQualityRowDraft: (row: QualityAttendanceRow, patch: QualityDraft, prune?: boolean) => void;
  saveQualityDrafts: () => void;
  qualityNotesDialog: QualityNotesDialogState | null;
  onQualityNotesDialogChange: (state: QualityNotesDialogState | null) => void;
  applyQualityNotesDialog: (state: QualityNotesDialogState) => void;
}) {
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);
  const [groupBy, setGroupBy] = React.useState<string[]>([]);

  const columns = React.useMemo(
    () =>
      buildQualityColumns({
        canUpdate,
        canReadPeople,
        tenantSlug,
        getEffective: getQualityEffective,
        onSetRowDraft: setQualityRowDraft,
        onOpenNotesDialog: (row) =>
          onQualityNotesDialogChange({
            enrollmentId: row.enrollment.id,
            occurrenceId: row.occurrenceId,
            fullName: row.enrollment.person.fullName,
            qualityNotes: getQualityEffective(row).qualityNotes ?? "",
          }),
      }),
    [canUpdate, canReadPeople, tenantSlug, getQualityEffective, setQualityRowDraft, onQualityNotesDialogChange],
  );

  const occurrenceOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach((row) => seen.set(row.occurrenceId, row.scheduledDate));
    return Array.from(seen, ([value, scheduledDate]) => ({ value, label: formatOccurrenceLabel(scheduledDate) }))
      .sort((left, right) => right.label.localeCompare(left.label, "pt-BR"));
  }, [rows]);

  const groupOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach((row) => {
      row.enrollment.peopleGroups.forEach((group) => seen.set(group.id, group.name));
    });
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [rows]);

  const filterFields = React.useMemo<SearchFieldDefinition[]>(
    () => [
      { name: "occurrenceId", label: "Encontro", type: "select", options: occurrenceOptions },
      { name: "peopleGroups", label: "Grupo", type: "select", options: groupOptions },
      { name: "isHighlight", label: "Destaque", type: "select", options: HIGHLIGHT_FILTER_OPTIONS },
    ],
    [occurrenceOptions, groupOptions],
  );

  const buildSearchRecord = React.useCallback(
    (row: QualityAttendanceRow) => ({
      occurrenceId: row.occurrenceId,
      peopleGroups: row.enrollment.peopleGroups.map((group) => group.id),
      isHighlight: String(Boolean(row.attendance?.isHighlight)),
    }),
    [],
  );

  const resolveGroupValue = React.useCallback((field: string, row: QualityAttendanceRow): unknown => {
    if (field === "occurrenceId") return formatOccurrenceLabel(row.scheduledDate);
    if (field === "peopleGroups") return row.enrollment.peopleGroups.map((group) => group.name);
    return undefined;
  }, []);

  const resolveGroupLabel = React.useCallback((_field: string, value: unknown): string => {
    const label = String(value ?? "").trim();
    return label ? label : "Sem valor";
  }, []);

  const filteredRows = React.useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("pt-BR");
    return rows.filter((row) => {
      if (!matchesDomainRecord(buildSearchRecord(row), domain, (record, field) => record[field as keyof typeof record])) {
        return false;
      }
      if (!query) return true;
      return row.enrollment.person.fullName.toLocaleLowerCase("pt-BR").includes(query);
    });
  }, [rows, searchText, domain, buildSearchRecord]);

  const changedCount = Object.keys(qualityDrafts).length;

  return (
    <>
      <QualityNotesDialog
        state={qualityNotesDialog}
        canUpdate={canUpdate}
        onOpenChange={(open) => {
          if (!open) onQualityNotesDialogChange(null);
        }}
        onStateChange={onQualityNotesDialogChange}
        onConfirm={applyQualityNotesDialog}
      />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <RelationListHost<QualityAttendanceRow>
        flushToolbar
        data={filteredRows}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        domain={domain}
        onDomainChange={setDomain}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        groupByOptions={[
          { field: "occurrenceId", label: "Encontro" },
          { field: "peopleGroups", label: "Grupo" },
        ]}
        searchPlaceholder="Pesquisar participantes"
        filteredCount={filteredRows.length}
        filterFields={filterFields}
        buildSearchRecord={buildSearchRecord}
        searchActionId="activity.quality"
        columns={columns}
        // Nao ha fluxo de criacao aqui (a linha ja existe a partir da
        // presenca registrada em Encontros) - botao mantido so pra
        // bater com o padrao visual das outras relations enquanto isso
        // e testado; remover (ou ligar a um fluxo real) depois.
        onAdd={() => undefined}
        viewSwitcherSlot={
          <div className="flex items-center gap-2">
            <RecordBrowserViewSwitcher<"list"> value="list" options={VIEW_OPTIONS} onChange={() => undefined} />
            {canUpdate ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={saveQualityDrafts}
                disabled={qualitySaving || changedCount === 0}
              >
                {qualitySaving ? "Salvando..." : "Salvar"}
              </Button>
            ) : null}
          </div>
        }
      >
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Carregando...</p>
        ) : filteredRows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Nenhuma pessoa com presença registrada.
          </p>
        ) : (
          <ListView<QualityAttendanceRow>
            data={filteredRows}
            columns={columns}
            getRowId={qualityRowId}
            showColumnVisibilityButton={false}
            bordered={false}
            groupByFields={groupBy}
            resolveGroupValue={resolveGroupValue}
            resolveGroupLabel={resolveGroupLabel}
          />
        )}
      </RelationListHost>
    </>
  );
}
