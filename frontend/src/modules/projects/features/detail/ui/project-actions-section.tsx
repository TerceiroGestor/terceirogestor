"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";
import { matchesDomainRecord } from "@/web-client/domain/evaluate";
import type { Domain } from "@/web-client/domain/types";
import type { SearchFieldDefinition } from "@/web-client/search/types";
import type { ApiActivity } from "@/modules/actions/api";
import { ACTION_STATUS_OPTIONS } from "@/modules/actions/shared/domain/actions.constants";
import {
  formatActionStatus,
  formatPeriod,
} from "@/modules/projects/config/projects-detail-layout-contract";

function filterActionRows(rows: ApiActivity[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [
      row.title,
      row.actionType?.name ?? "",
      row.peopleGroup?.name ?? "",
      formatActionStatus(row.status),
      formatPeriod(row.plannedStartAt, row.plannedEndAt),
    ]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return values.includes(normalized);
  });
}

function actionColumns(): ColumnDef<ApiActivity, unknown>[] {
  return [
    {
      accessorKey: "title",
      header: "Atividade",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{row.original.title}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.actionType?.name || "Sem tipo"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => formatActionStatus(row.original.status),
    },
    {
      accessorKey: "plannedStartAt",
      header: "Período",
      cell: ({ row }) => formatPeriod(row.original.plannedStartAt, row.original.plannedEndAt),
    },
  ];
}

export function ProjectActionsSection({
  rows,
  loading,
  canAdd,
  onOpenAction,
  onAddAction,
}: {
  rows: ApiActivity[];
  loading: boolean;
  canAdd: boolean;
  onOpenAction: (actionId: string) => void;
  onAddAction: () => void;
}) {
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);

  const columns = React.useMemo(() => actionColumns(), []);

  const filterFields = React.useMemo<SearchFieldDefinition[]>(
    () => [{ name: "status", label: "Status", type: "select", options: ACTION_STATUS_OPTIONS }],
    [],
  );

  const buildSearchRecord = React.useCallback((row: ApiActivity) => ({ status: row.status }), []);

  const filteredRows = React.useMemo(() => {
    const matchedByDomain = rows.filter((row) =>
      matchesDomainRecord(buildSearchRecord(row), domain, (record, field) => record[field as keyof typeof record]),
    );
    return filterActionRows(matchedByDomain, searchText);
  }, [rows, searchText, domain, buildSearchRecord]);

  return (
    <RelationListHost<ApiActivity>
      flushToolbar
      data={filteredRows}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      domain={domain}
      onDomainChange={setDomain}
      searchPlaceholder="Pesquisar atividades"
      filteredCount={filteredRows.length}
      filterFields={filterFields}
      buildSearchRecord={buildSearchRecord}
      searchActionId="project.actions"
      columns={columns}
      onAdd={canAdd ? onAddAction : undefined}
    >
      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Carregando atividades...</p>
      ) : filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum vínculo.</p>
      ) : (
        <ListView<ApiActivity>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={(row) => onOpenAction(row.id)}
          showColumnVisibilityButton={false}
          bordered={false}
          stickyHeaderOffsetPx={117}
        />
      )}
    </RelationListHost>
  );
}
