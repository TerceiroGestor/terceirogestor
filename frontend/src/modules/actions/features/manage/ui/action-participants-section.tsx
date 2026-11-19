"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ActionAttendanceSummaryItem } from "@/modules/actions/api";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";
import {
  DateRangeFilterButton,
  type DateRangeValue,
} from "@/web-client/ui/DateRangeFilterButton";

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
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">
            {row.original.enrollment.person.fullName}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.enrollment.peopleGroups.map((group) => group.name).join(", ") || "—"}
          </div>
        </div>
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
            <div className="font-medium text-foreground">
              {formatAttendanceRate(attendanceRate)}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalMeetings > 0 ? `${presentCount}/${totalMeetings} encontros` : "Sem encontros no período"}
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

export function ActionParticipantsSection({
  rows,
  loading,
  error,
  from,
  to,
  onFromChange,
  onToChange,
}: {
  rows: ActionAttendanceSummaryItem[];
  loading: boolean;
  error: string | null;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  const [searchText, setSearchText] = React.useState("");
  const columns = React.useMemo(() => buildAttendanceSummaryColumns(), []);

  const filteredRows = React.useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("pt-BR");
    if (!query) return rows;
    return rows.filter((row) => {
      const values = [
        row.enrollment.person.fullName,
        ...row.enrollment.peopleGroups.map((group) => group.name),
      ].map((value) => String(value).toLocaleLowerCase("pt-BR"));
      return values.some((value) => value.includes(query));
    });
  }, [rows, searchText]);

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
        domain={null}
        onDomainChange={() => undefined}
        searchPlaceholder="Pesquisar participante"
        filteredCount={filteredRows.length}
        viewSwitcherSlot={
          <DateRangeFilterButton
            value={{ from, to } satisfies DateRangeValue}
            onChange={(range) => {
              onFromChange(range.from);
              onToChange(range.to);
            }}
            placeholder="Período"
          />
        }
      >
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Carregando...</p>
        ) : filteredRows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Sem participantes elegíveis no período selecionado.
          </p>
        ) : (
          <ListView<ActionAttendanceSummaryItem>
            data={filteredRows}
            columns={columns}
            getRowId={(row) => row.enrollment.id}
            showColumnVisibilityButton={false}
            bordered={false}
          />
        )}
      </RelationListHost>
    </>
  );
}
