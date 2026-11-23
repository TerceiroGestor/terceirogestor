"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ApiProject } from "@/modules/projects/api";
import { PROJECT_STATUS_OPTIONS } from "@/modules/projects/shared/domain/projects.constants";
import {
  formatPeriod,
  formatProjectStatus,
} from "@/modules/programs/config/programs-detail-layout-contract";
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

function filterProjectRows(rows: ApiProject[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [
      row.name,
      row.description ?? "",
      formatProjectStatus(row.status),
      formatPeriod(row.startsAt, row.endsAt),
      ...(row.tags ?? []),
    ]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return values.includes(normalized);
  });
}

function projectRelationColumns(): ColumnDef<ApiProject, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: "Projeto",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.description?.trim() || "Sem descrição"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => formatProjectStatus(row.original.status),
    },
    {
      accessorKey: "startsAt",
      header: "Período",
      cell: ({ row }) => formatPeriod(row.original.startsAt, row.original.endsAt),
    },
  ];
}

const VIEW_OPTIONS: RecordBrowserViewOption<"list">[] = [
  { value: "list", label: "Lista", icon: getStandardViewIcon("list") },
];

export function ProgramProjectsSection({
  rows,
  loading,
  canAdd,
  onOpenProject,
  onAddProject,
}: {
  rows: ApiProject[];
  loading: boolean;
  canAdd: boolean;
  onOpenProject: (projectId: string) => void;
  onAddProject: () => void;
}) {
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);

  const columns = React.useMemo(() => projectRelationColumns(), []);

  const filterFields = React.useMemo<SearchFieldDefinition[]>(
    () => [{ name: "status", label: "Status", type: "select", options: PROJECT_STATUS_OPTIONS }],
    [],
  );

  const buildSearchRecord = React.useCallback(
    (row: ApiProject) => ({ status: row.status }),
    [],
  );

  const filteredRows = React.useMemo(() => {
    const matchedByDomain = rows.filter((row) =>
      matchesDomainRecord(buildSearchRecord(row), domain, (record, field) => record[field as keyof typeof record]),
    );
    return filterProjectRows(matchedByDomain, searchText);
  }, [rows, searchText, domain, buildSearchRecord]);

  return (
    <RelationListHost<ApiProject>
      flushToolbar
      data={filteredRows}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      domain={domain}
      onDomainChange={setDomain}
      searchPlaceholder="Pesquisar projetos"
      filteredCount={filteredRows.length}
      filterFields={filterFields}
      buildSearchRecord={buildSearchRecord}
      searchActionId="program.projects"
      columns={columns}
      onAdd={canAdd ? onAddProject : undefined}
      viewSwitcherSlot={
        <RecordBrowserViewSwitcher<"list"> value="list" options={VIEW_OPTIONS} onChange={() => undefined} />
      }
    >
      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Carregando projetos...</p>
      ) : filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum projeto vinculado.</p>
      ) : (
        <ListView<ApiProject>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={(row) => onOpenProject(row.id)}
          showColumnVisibilityButton={false}
          bordered={false}
          stickyHeaderOffsetPx={117}
        />
      )}
    </RelationListHost>
  );
}
