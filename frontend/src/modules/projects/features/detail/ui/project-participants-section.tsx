"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";
import { matchesDomainRecord } from "@/web-client/domain/evaluate";
import type { Domain } from "@/web-client/domain/types";
import type { SearchFieldDefinition } from "@/web-client/search/types";
import type { ApiProjectEnrollment } from "@/modules/projects/api";
import {
  PROJECT_PARTICIPATION_ROLE_LABELS,
  PROJECT_PARTICIPATION_ROLE_OPTIONS,
} from "@/modules/projects/shared/domain/projects.constants";
import { formatPeriod } from "@/modules/projects/config/projects-detail-layout-contract";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";

const ENROLLMENT_STATUS_OPTIONS = [
  { label: "Ativa", value: "ACTIVE" },
  { label: "Encerrada", value: "ENDED" },
];

function filterEnrollmentRows(rows: ApiProjectEnrollment[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [
      row.person.fullName,
      row.person.status ?? "",
      PROJECT_PARTICIPATION_ROLE_LABELS[row.role] ?? row.role,
      row.peopleGroups.map((peopleGroup) => peopleGroup.name).join(" "),
      row.status === "ACTIVE" ? "Ativa" : "Encerrada",
      formatPeriod(row.startsAt, row.endsAt),
    ]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return values.includes(normalized);
  });
}

function enrollmentColumns({
  canDeleteEnrollments,
  tenantSlug,
  onEndEnrollment,
}: {
  canDeleteEnrollments: boolean;
  tenantSlug: string;
  onEndEnrollment: (enrollment: ApiProjectEnrollment) => void;
}): ColumnDef<ApiProjectEnrollment, unknown>[] {
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
            birthDate={row.original.person.birthDate ?? null}
            avatarUrl={row.original.person.avatarUrl}
            hasHealthCondition={row.original.person.hasHealthCondition}
            hasMedication={row.original.person.hasMedication}
          />
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">{row.original.person.fullName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.person.status?.trim() || "Sem status"}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Papel",
      cell: ({ row }) => (
        <span>{PROJECT_PARTICIPATION_ROLE_LABELS[row.original.role] ?? row.original.role}</span>
      ),
    },
    {
      accessorKey: "peopleGroups",
      header: "Grupos",
      cell: ({ row }) => {
        const label = row.original.peopleGroups.map((peopleGroup) => peopleGroup.name).join(", ");
        return <span>{label || "Sem Grupos"}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="text-foreground">
            {row.original.status === "ACTIVE" ? "Ativa" : "Encerrada"}
          </div>
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
        canDeleteEnrollments && row.original.status !== "ENDED" ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                onEndEnrollment(row.original);
              }}
            >
              Encerrar matrícula
            </Button>
          </div>
        ) : null,
    },
  ];
}

export function ProjectParticipantsSection({
  rows,
  loading,
  canAdd,
  canDeleteEnrollments,
  tenantSlug,
  onOpenEnrollment,
  onAddEnrollment,
  onEndEnrollment,
}: {
  rows: ApiProjectEnrollment[];
  loading: boolean;
  canAdd: boolean;
  canDeleteEnrollments: boolean;
  tenantSlug: string;
  onOpenEnrollment: (enrollmentId: string) => void;
  onAddEnrollment: () => void;
  onEndEnrollment: (enrollment: ApiProjectEnrollment) => void;
}) {
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);

  const columns = React.useMemo(
    () => enrollmentColumns({ canDeleteEnrollments, tenantSlug, onEndEnrollment }),
    [canDeleteEnrollments, tenantSlug, onEndEnrollment],
  );

  const filterFields = React.useMemo<SearchFieldDefinition[]>(
    () => [
      { name: "role", label: "Papel", type: "select", options: PROJECT_PARTICIPATION_ROLE_OPTIONS },
      { name: "status", label: "Status", type: "select", options: ENROLLMENT_STATUS_OPTIONS },
    ],
    [],
  );

  const buildSearchRecord = React.useCallback(
    (row: ApiProjectEnrollment) => ({ role: row.role, status: row.status }),
    [],
  );

  const filteredRows = React.useMemo(() => {
    const matchedByDomain = rows.filter((row) =>
      matchesDomainRecord(buildSearchRecord(row), domain, (record, field) => record[field as keyof typeof record]),
    );
    return filterEnrollmentRows(matchedByDomain, searchText);
  }, [rows, searchText, domain, buildSearchRecord]);

  return (
    <RelationListHost<ApiProjectEnrollment>
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
      searchActionId="project.enrollments"
      columns={columns}
      onAdd={canAdd ? onAddEnrollment : undefined}
    >
      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Carregando participantes...</p>
      ) : filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum vínculo.</p>
      ) : (
        <ListView<ApiProjectEnrollment>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={(row) => onOpenEnrollment(row.id)}
          showColumnVisibilityButton={false}
          bordered={false}
          stickyHeaderOffsetPx={117}
        />
      )}
    </RelationListHost>
  );
}
