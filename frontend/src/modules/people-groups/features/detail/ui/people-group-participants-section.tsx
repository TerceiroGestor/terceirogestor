"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { formatDateOnlyPtBR } from "@/lib/date";
import type { ApiPeopleGroupParticipation } from "@/modules/people-groups/api";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
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

function formatParticipationStatus(row: ApiPeopleGroupParticipation) {
  return row.isActive && !row.deletedAt ? "Ativo" : "Encerrado";
}

function formatPeriod(startsAt: string | null | undefined, endsAt: string | null | undefined) {
  if (!startsAt && !endsAt) return "Não informada";
  return `${startsAt ? formatDateOnlyPtBR(startsAt) : "-"} até ${endsAt ? formatDateOnlyPtBR(endsAt) : "-"}`;
}

function filterParticipationRows(rows: ApiPeopleGroupParticipation[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [
      row.person.fullName,
      row.person.socialName ?? "",
      row.person.personType ?? "",
      row.person.status ?? "",
      formatParticipationStatus(row),
      formatPeriod(row.startsAt, row.endsAt),
    ]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return values.includes(normalized);
  });
}

function participationColumns({
  canManageParticipations,
  onEndParticipation,
  tenantSlug,
}: {
  canManageParticipations: boolean;
  onEndParticipation: (participation: ApiPeopleGroupParticipation) => void;
  tenantSlug: string;
}): ColumnDef<ApiPeopleGroupParticipation, unknown>[] {
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
            <div className="font-medium">{row.original.person.fullName}</div>
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
          <div>{formatParticipationStatus(row.original)}</div>
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

const VIEW_OPTIONS: RecordBrowserViewOption<"list">[] = [
  { value: "list", label: "Lista", icon: getStandardViewIcon("list") },
];

const STATUS_FILTER_OPTIONS = [
  { value: "Ativo", label: "Ativo" },
  { value: "Encerrado", label: "Encerrado" },
];

export function PeopleGroupParticipantsSection({
  rows,
  loading,
  canManageParticipations,
  tenantSlug,
  onOpenPerson,
  onCreateParticipation,
  onEndParticipation,
  canAdd,
  emptyLabel = "Nenhuma pessoa vinculada.",
}: {
  rows: ApiPeopleGroupParticipation[];
  loading: boolean;
  canManageParticipations: boolean;
  tenantSlug: string;
  onOpenPerson: (personId: string) => void;
  onCreateParticipation: () => void;
  onEndParticipation: (participation: ApiPeopleGroupParticipation) => void;
  /** Controla só o botão "Novo" - separado de `canManageParticipations` (que também libera "Encerrar vínculo" por linha) porque a regra de quando pode adicionar é mais restrita (soma `readOnly`/`mode`). */
  canAdd: boolean;
  emptyLabel?: string;
}) {
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);

  const columns = React.useMemo(
    () => participationColumns({ canManageParticipations, onEndParticipation, tenantSlug }),
    [canManageParticipations, onEndParticipation, tenantSlug],
  );

  const filterFields = React.useMemo<SearchFieldDefinition[]>(
    () => [{ name: "status", label: "Status", type: "select", options: STATUS_FILTER_OPTIONS }],
    [],
  );

  const buildSearchRecord = React.useCallback(
    (row: ApiPeopleGroupParticipation) => ({ status: formatParticipationStatus(row) }),
    [],
  );

  const filteredRows = React.useMemo(() => {
    const matchedByDomain = rows.filter((row) =>
      matchesDomainRecord(buildSearchRecord(row), domain, (record, field) => record[field as keyof typeof record]),
    );
    return filterParticipationRows(matchedByDomain, searchText);
  }, [rows, searchText, domain, buildSearchRecord]);

  return (
    <RelationListHost<ApiPeopleGroupParticipation>
      flushToolbar
      data={filteredRows}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      domain={domain}
      onDomainChange={setDomain}
      searchPlaceholder="Pesquisar participantes"
      filteredCount={filteredRows.length}
      filterFields={filterFields}
      buildSearchRecord={buildSearchRecord}
      searchActionId="people-group.participants"
      columns={columns}
      onAdd={canAdd ? onCreateParticipation : undefined}
      viewSwitcherSlot={
        <RecordBrowserViewSwitcher<"list"> value="list" options={VIEW_OPTIONS} onChange={() => undefined} />
      }
    >
      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Carregando participantes...</p>
      ) : filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ListView<ApiPeopleGroupParticipation>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={(row) => onOpenPerson(row.person.id)}
          showColumnVisibilityButton={false}
          bordered={false}
          stickyHeaderOffsetPx={117}
        />
      )}
    </RelationListHost>
  );
}
