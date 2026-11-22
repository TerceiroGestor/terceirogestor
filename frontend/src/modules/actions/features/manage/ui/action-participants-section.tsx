"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ActionAttendanceSummaryItem } from "@/modules/actions/api";
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
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";

function formatAttendanceRate(value: number | null) {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

function formatAverageQuality(value: number | null) {
  if (value === null) return "—";
  return value.toFixed(1);
}

function buildAttendanceSummaryColumns(): ColumnDef<ActionAttendanceSummaryItem>[] {
  return [
    {
      id: "person",
      header: "Participante",
      accessorFn: (row) => row.enrollment.person.fullName,
      cell: ({ row }) => (
        <div className="font-medium">{row.original.enrollment.person.fullName}</div>
      ),
    },
    {
      id: "peopleGroups",
      header: "Grupos",
      accessorFn: (row) => row.enrollment.peopleGroups.map((group) => group.name).join(", "),
      cell: ({ row }) => (
        <TruncatedTextCell
          text={row.original.enrollment.peopleGroups.map((group) => group.name).join(", ")}
        />
      ),
    },
    {
      id: "frequency",
      header: "Frequência",
      accessorFn: (row) => row.attendanceRate ?? -1,
      cell: ({ row }) => {
        const { attendanceRate, presentCount, totalMeetings } = row.original;
        return (
          <div className="space-y-0.5">
            <div className="font-medium">
              {formatAttendanceRate(attendanceRate)}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalMeetings > 0 ? `${presentCount}/${totalMeetings} encontros` : "Sem encontros"}
            </div>
          </div>
        );
      },
    },
    {
      id: "quality",
      header: "Média de avaliação",
      accessorFn: (row) => row.averageQuality ?? -1,
      cell: ({ row }) => formatAverageQuality(row.original.averageQuality),
    },
    {
      id: "occurrences",
      header: "Ocorrências",
      accessorFn: (row) => row.occurrencesCount,
      cell: ({ row }) => (
        <span title="Contagem direta de Ocorrencia (Fase 5) ainda nao existe aqui - ver docs/backlog.md">
          {row.original.occurrencesCount || "—"}
        </span>
      ),
    },
  ];
}

const VIEW_OPTIONS: RecordBrowserViewOption<"list">[] = [
  { value: "list", label: "Lista", icon: getStandardViewIcon("list") },
];

export function ActionParticipantsSection({
  rows,
  loading,
  error,
}: {
  rows: ActionAttendanceSummaryItem[];
  loading: boolean;
  error: string | null;
}) {
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);
  const [groupBy, setGroupBy] = React.useState<string[]>([]);
  const columns = React.useMemo(() => buildAttendanceSummaryColumns(), []);

  const groupOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach((row) => {
      row.enrollment.peopleGroups.forEach((group) => seen.set(group.id, group.name));
    });
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [rows]);

  const filterFields = React.useMemo<SearchFieldDefinition[]>(
    () => [
      { name: "peopleGroups", label: "Grupos", type: "select", options: groupOptions },
    ],
    [groupOptions],
  );

  const resolveGroupValue = React.useCallback(
    (field: string, row: ActionAttendanceSummaryItem): unknown => {
      if (field !== "peopleGroups") return undefined;
      return row.enrollment.peopleGroups.map((group) => group.name);
    },
    [],
  );

  const resolveGroupLabel = React.useCallback((_field: string, value: unknown): string => {
    const label = String(value ?? "").trim();
    return label ? label : "Sem Grupos";
  }, []);

  const buildSearchRecord = React.useCallback(
    (row: ActionAttendanceSummaryItem) => ({
      peopleGroups: row.enrollment.peopleGroups.map((group) => group.id),
    }),
    [],
  );

  const filteredRows = React.useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("pt-BR");
    return rows.filter((row) => {
      if (!matchesDomainRecord(buildSearchRecord(row), domain, (record, field) => record[field as keyof typeof record])) {
        return false;
      }
      if (!query) return true;
      const values = [
        row.enrollment.person.fullName,
        ...row.enrollment.peopleGroups.map((group) => group.name),
      ].map((value) => String(value).toLocaleLowerCase("pt-BR"));
      return values.some((value) => value.includes(query));
    });
  }, [rows, searchText, domain, buildSearchRecord]);

  return (
    <>
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <RelationListHost<ActionAttendanceSummaryItem>
        flushToolbar
        data={filteredRows}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        domain={domain}
        onDomainChange={setDomain}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        groupByOptions={[{ field: "peopleGroups", label: "Grupos" }]}
        searchPlaceholder="Pesquisar participante"
        filteredCount={filteredRows.length}
        filterFields={filterFields}
        buildSearchRecord={buildSearchRecord}
        searchActionId="activity.participants"
        columns={columns}
        // Ainda nao ha fluxo de criacao de participante por aqui (a
        // pessoa entra via matricula no projeto) - botao mantido so
        // pra bater com o padrao visual das outras relations enquanto
        // isso e testado; remover (ou ligar a um fluxo real) depois.
        onAdd={() => undefined}
        viewSwitcherSlot={
          <RecordBrowserViewSwitcher<"list"> value="list" options={VIEW_OPTIONS} onChange={() => undefined} />
        }
      >
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Carregando...</p>
        ) : filteredRows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Sem participantes elegíveis.
          </p>
        ) : (
          <ListView<ActionAttendanceSummaryItem>
            data={filteredRows}
            columns={columns}
            getRowId={(row) => row.enrollment.id}
            showColumnVisibilityButton={false}
            bordered={false}
            groupByFields={groupBy}
            resolveGroupValue={resolveGroupValue}
            resolveGroupLabel={resolveGroupLabel}
            // Abas (44px) + toolbar da relation (flushToolbar, ~73px com
            // py-4) ja ficam sticky acima, no mesmo contexto de scroll -
            // mesmo ajuste de Encontros (action-occurrences-section.tsx).
            stickyHeaderOffsetPx={117}
          />
        )}
      </RelationListHost>
    </>
  );
}
