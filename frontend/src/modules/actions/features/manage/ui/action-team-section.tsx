"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import type { ApiProjectActionPeopleParticipation } from "@/modules/actions/api";
import { ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS } from "@/modules/actions/shared/domain/actions.constants";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";

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
  const columns = React.useMemo(
    () => teamParticipationColumns({ canUpdate, onEndTeamParticipation }),
    [canUpdate, onEndTeamParticipation],
  );
  const filteredRows = React.useMemo(
    () => filterTeamRows(rows, searchText),
    [rows, searchText],
  );

  return (
    <RelationListHost<ApiProjectActionPeopleParticipation>
      flushToolbar
      data={filteredRows}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      domain={null}
      onDomainChange={() => undefined}
      searchPlaceholder="Pesquisar equipe"
      filteredCount={filteredRows.length}
      onAdd={canUpdate ? onOpenTeamPicker : undefined}
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
