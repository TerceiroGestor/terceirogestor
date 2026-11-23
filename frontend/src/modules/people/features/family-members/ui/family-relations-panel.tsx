"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { resolveMediaUrl } from "@/lib/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { useFamilyRelationsContext } from "@/modules/people/features/family-members/context/family-relations-context";
import { FamilyRelationQuickCreateDialog } from "@/modules/people/features/family-members/ui/family-relation-quick-create-dialog";
import { buildPeopleFamilyRelationPath } from "@/modules/people/shared/domain/people-relation-routes";
import type { HouseholdMember, PersonRelation } from "@/modules/people/shared/domain/types";
import { getInitials } from "@/modules/people/shared/domain/utils";
import { DetailRelationTablePanel } from "@/web-client/detail/DetailRelationTablePanel";
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";

type FamilyRelationRow = {
  id: string;
  relation: PersonRelation;
  householdMember?: HouseholdMember | null;
};

export function FamilyRelationsPanel({ personId }: { personId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const {
    data,
    peopleOptions,
    incomeSummary,
    detailedLoading,
    detailedError,
    create,
    remove,
    refresh,
    loadDetailed,
  } = useFamilyRelationsContext();
  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(() => {
    if (!data) {
      void loadDetailed();
    }
  }, [data, loadDetailed]);

  const rows = React.useMemo<FamilyRelationRow[]>(() => {
    const householdByPersonId = new Map(
      (data?.householdMembers ?? []).map((member) => [member.personId, member]),
    );

    return (data?.relations ?? []).map((relation) => ({
      id: relation.id,
      relation,
      householdMember: householdByPersonId.get(relation.relatedPersonId) ?? null,
    }));
  }, [data]);

  const contributionByPersonId = React.useMemo(() => {
    const map = new Map<string, number>();
    incomeSummary?.contributions?.forEach((item) => {
      map.set(item.personId, item.amount);
    });
    return map;
  }, [incomeSummary]);

  const columns = React.useMemo<ColumnDef<FamilyRelationRow, unknown>[]>(
    () => [
      {
        id: "person",
        header: "Familiar",
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-8 border border-border/60">
              <AvatarImage
                src={resolveMediaUrl(
                  row.original.relation.relatedPerson.avatarUrl || "/avatar.jpg",
                )}
                alt={row.original.relation.relatedPerson.fullName}
              />
              <AvatarFallback>
                {getInitials(row.original.relation.relatedPerson.fullName)}
              </AvatarFallback>
            </Avatar>
            <Link
              href={withTenantPath(
                `/people/${row.original.relation.relatedPerson.id}`,
                tenantSlug,
              )}
              onClick={(event) => event.stopPropagation()}
              className="block truncate whitespace-nowrap font-medium text-foreground transition hover:text-primary"
              title={`Abrir cadastro de ${row.original.relation.relatedPerson.fullName}`}
            >
              {row.original.relation.relatedPerson.fullName}
            </Link>
          </div>
        ),
      },
      {
        accessorFn: (row) => row.relation.type,
        header: "Vinculo",
        cell: ({ row }) => <TruncatedTextCell text={row.original.relation.type} className="text-sm" />,
      },
      {
        id: "household",
        header: "Convive",
        cell: ({ row }) => (
          <span className="block truncate whitespace-nowrap">
            {row.original.relation.livesTogether ? "Mora junto" : "Separado"}
          </span>
        ),
      },
      {
        id: "role",
        header: "Papel",
        cell: ({ row }) => (
          <TruncatedTextCell text={row.original.householdMember?.role ?? null} className="text-sm" />
        ),
      },
      {
        id: "flags",
        header: "Indicadores",
        cell: ({ row }) => {
          const labels = [
            row.original.relation.isLegalGuardian ? "Responsavel legal" : null,
            row.original.householdMember?.isHouseholdHead ? "Principal" : null,
            row.original.householdMember?.isProvider ? "Provedor" : null,
            row.original.householdMember?.isDependent ? "Dependente" : null,
            contributionByPersonId.get(row.original.relation.relatedPersonId)
              ? "Contribui renda"
              : row.original.householdMember?.isIncomeContributor
                ? "Contribui renda"
                : null,
          ].filter(Boolean);

          return <TruncatedTextCell text={labels.length ? labels.join(" | ") : null} className="text-sm" />;
        },
      },
      {
        accessorFn: (row) => row.relation.notes,
        header: "Notas",
        cell: ({ row }) => <TruncatedTextCell text={row.original.relation.notes} className="text-sm" />,
      },
      {
        id: "actions",
        header: "",
        size: 60,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                void (async () => {
                  await remove(row.original.relation.id);
                  await refresh();
                })();
              }}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [contributionByPersonId, refresh, remove, tenantSlug],
  );

  const filterRow = React.useCallback((row: FamilyRelationRow, query: string) => {
    const values = [
      row.relation.relatedPerson.fullName,
      row.relation.type,
      row.householdMember?.role,
      row.relation.notes,
    ];
    return values.some((value) => String(value ?? "").toLowerCase().includes(query));
  }, []);

  return (
    <>
      <DetailRelationTablePanel
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={(row) =>
          router.push(
            withTenantPath(
              buildPeopleFamilyRelationPath(personId, row.relation.id),
              tenantSlug,
            ),
          )
        }
        searchPlaceholder="Pesquisar familiares"
        filterRow={filterRow}
        onAdd={() => setCreateOpen(true)}
        loading={detailedLoading}
        error={detailedError}
        emptyMessage="Nenhum vinculo familiar cadastrado."
        tableInitialColumnPinning={{ left: ["person"], right: ["actions"] }}
        filterFields={[
          { name: "vinculo", label: "Vinculo", type: "text" },
          { name: "convive", label: "Convive", type: "text" },
        ]}
        buildSearchRecord={(row) => ({
          vinculo: row.relation.type,
          convive: row.relation.livesTogether ? "Mora junto" : "Separado",
        })}
        searchActionId="people.family-relations"
      />
      <FamilyRelationQuickCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        peopleOptions={peopleOptions}
        onSubmit={async (payload) => {
          await create({ relatedPersonId: payload.relatedPersonId, type: payload.type });
          await refresh();
        }}
      />
    </>
  );
}
