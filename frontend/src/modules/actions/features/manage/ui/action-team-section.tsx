"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import type { ApiProjectActionPeopleParticipation } from "@/modules/actions/api";
import { ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS } from "@/modules/actions/shared/domain/actions.constants";
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

function filterTeamRows(rows: ApiProjectActionPeopleParticipation[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [
      row.person.fullName,
      row.person.status,
      ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS[row.role],
      row.enrollment?.role ?? null,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLocaleLowerCase("pt-BR"));
    return values.some((value) => value.includes(normalized));
  });
}

function teamParticipationColumns({
  canUpdate,
  onEndTeamParticipation,
}: {
  canUpdate: boolean;
  onEndTeamParticipation: (participationId: string) => Promise<void>;
}): ColumnDef<ApiProjectActionPeopleParticipation>[] {
  return [
    {
      id: "person",
      header: "Pessoa",
      accessorFn: (row) => row.person.fullName,
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{row.original.person.fullName}</div>
          <div className="text-xs text-muted-foreground">{row.original.person.status ?? "-"}</div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Papel",
      accessorFn: (row) => ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS[row.role],
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS[row.original.role]}
        </span>
      ),
    },
    {
      id: "source",
      header: "Origem",
      accessorFn: (row) => row.enrollment?.role ?? "",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.enrollment?.role ?? "Sem participação ativa no projeto"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        canUpdate ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                void onEndTeamParticipation(row.original.id);
              }}
            >
              Encerrar
            </Button>
          </div>
        ) : null,
    },
  ];
}

const VIEW_OPTIONS: RecordBrowserViewOption<"list">[] = [
  { value: "list", label: "Lista", icon: getStandardViewIcon("list") },
];

const ROLE_FILTER_OPTIONS = Object.entries(ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export function ActionTeamSection({
  rows,
  canUpdate,
  onEndTeamParticipation,
  onOpenTeamPicker,
}: {
  rows: ApiProjectActionPeopleParticipation[];
  canUpdate: boolean;
  onEndTeamParticipation: (participationId: string) => Promise<void>;
  onOpenTeamPicker: () => void;
}) {
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);
  const columns = React.useMemo(
    () => teamParticipationColumns({ canUpdate, onEndTeamParticipation }),
    [canUpdate, onEndTeamParticipation],
  );

  const filterFields = React.useMemo<SearchFieldDefinition[]>(
    () => [{ name: "role", label: "Papel", type: "select", options: ROLE_FILTER_OPTIONS }],
    [],
  );

  const buildSearchRecord = React.useCallback(
    (row: ApiProjectActionPeopleParticipation) => ({ role: row.role }),
    [],
  );

  const filteredRows = React.useMemo(() => {
    const matchedByDomain = rows.filter((row) =>
      matchesDomainRecord(buildSearchRecord(row), domain, (record, field) => record[field as keyof typeof record]),
    );
    return filterTeamRows(matchedByDomain, searchText);
  }, [rows, searchText, domain, buildSearchRecord]);

  return (
    <RelationListHost<ApiProjectActionPeopleParticipation>
      flushToolbar
      data={filteredRows}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      domain={domain}
      onDomainChange={setDomain}
      searchPlaceholder="Pesquisar equipe"
      filteredCount={filteredRows.length}
      filterFields={filterFields}
      buildSearchRecord={buildSearchRecord}
      searchActionId="activity.team"
      columns={columns}
      onAdd={canUpdate ? onOpenTeamPicker : undefined}
      viewSwitcherSlot={
        <RecordBrowserViewSwitcher<"list"> value="list" options={VIEW_OPTIONS} onChange={() => undefined} />
      }
    >
      {filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          Nenhuma pessoa de apoio registrada. Gestor e Educador/Executor também entram por aqui
          (papéis Responsável técnico e Facilitador).
        </p>
      ) : (
        <ListView<ApiProjectActionPeopleParticipation>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          showColumnVisibilityButton={false}
          bordered={false}
        />
      )}
    </RelationListHost>
  );
}
