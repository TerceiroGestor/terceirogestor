"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { useFamilyRelationsContext } from "@/modules/people/features/family-members/context/family-relations-context";
import { buildPeopleAddressPath } from "@/modules/people/shared/domain/people-relation-routes";
import type { HouseholdProfile } from "@/modules/people/shared/domain/types";
import { DetailRelationTablePanel } from "@/web-client/detail/DetailRelationTablePanel";

type HouseholdAddressRow = {
  id: string;
  profile: HouseholdProfile;
};

function formatAddress(profile: HouseholdProfile) {
  const parts = [profile.street, profile.number, profile.neighborhood].filter(Boolean);
  return parts.length ? parts.join(", ") : "-";
}

function formatCityState(profile: HouseholdProfile) {
  const city = profile.city?.trim();
  const state = profile.state?.trim();
  if (city && state) return `${city}/${state}`;
  return city || state || "-";
}

export function HouseholdAddressListPanel({ personId }: { personId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { householdProfile, summaryLoading, summaryError, loadSummary } = useFamilyRelationsContext();

  React.useEffect(() => {
    if (!householdProfile) {
      void loadSummary();
    }
  }, [householdProfile, loadSummary]);

  const rows = React.useMemo<HouseholdAddressRow[]>(
    () => (householdProfile ? [{ id: householdProfile.id, profile: householdProfile }] : []),
    [householdProfile],
  );

  const columns = React.useMemo<ColumnDef<HouseholdAddressRow, unknown>[]>(
    () => [
      {
        id: "cep",
        header: "CEP",
        cell: ({ row }) => <span className="block truncate whitespace-nowrap">{row.original.profile.cep || "-"}</span>,
      },
      {
        id: "address",
        header: "Endereco",
        cell: ({ row }) => (
          <span className="block truncate whitespace-nowrap">{formatAddress(row.original.profile)}</span>
        ),
      },
      {
        id: "cityState",
        header: "Cidade/UF",
        cell: ({ row }) => (
          <span className="block truncate whitespace-nowrap">{formatCityState(row.original.profile)}</span>
        ),
      },
      {
        id: "reference",
        header: "Referencia",
        cell: ({ row }) => (
          <span className="block truncate whitespace-nowrap">{row.original.profile.reference || "-"}</span>
        ),
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
                router.push(
                  withTenantPath(
                    buildPeopleAddressPath(personId, row.original.profile.id),
                    tenantSlug,
                  ),
                );
              }}
            >
              <Pencil className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [personId, router, tenantSlug],
  );

  const filterRow = React.useCallback((row: HouseholdAddressRow, query: string) => {
    const values = [
      row.profile.cep,
      row.profile.street,
      row.profile.number,
      row.profile.neighborhood,
      row.profile.city,
      row.profile.state,
      row.profile.reference,
    ];
    return values.some((value) => String(value ?? "").toLowerCase().includes(query));
  }, []);

  return (
    <DetailRelationTablePanel
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(row) =>
        router.push(
          withTenantPath(buildPeopleAddressPath(personId, row.profile.id), tenantSlug),
        )
      }
      searchPlaceholder="Pesquisar endereco"
      filterRow={filterRow}
      addHref={withTenantPath(buildPeopleAddressPath(personId), tenantSlug)}
      addLabel="Novo endereco"
      loading={summaryLoading}
      error={summaryError}
      emptyMessage="Nenhum endereco cadastrado."
      tableMinWidthClassName="min-w-[760px]"
      tableInitialColumnPinning={{ right: ["actions"] }}
      filterFields={[
        { name: "cep", label: "CEP", type: "text" },
        { name: "endereco", label: "Endereco", type: "text" },
        { name: "cidadeUf", label: "Cidade/UF", type: "text" },
      ]}
      buildSearchRecord={(row) => ({
        cep: row.profile.cep ?? null,
        endereco: formatAddress(row.profile),
        cidadeUf: formatCityState(row.profile),
      })}
      searchActionId="people.address"
    />
  );
}
