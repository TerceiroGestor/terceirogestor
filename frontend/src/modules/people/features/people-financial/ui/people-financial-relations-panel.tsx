"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { useFamilyRelationsContext } from "@/modules/people/features/family-members/context/family-relations-context";
import { usePeopleFinancial } from "@/modules/people/features/people-financial/data/use-people-financial";
import { FinancialEntryQuickCreateDialog } from "@/modules/people/features/people-financial/ui/financial-entry-quick-create-dialog";
import { buildPeopleFinancialEntryPath } from "@/modules/people/shared/domain/people-relation-routes";
import type { PersonFinancialEntry } from "@/modules/people/shared/domain/types";
import { DetailRelationTablePanel } from "@/web-client/detail/DetailRelationTablePanel";
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";

const ENTRY_TYPE_LABELS: Record<PersonFinancialEntry["entryType"], string> = {
  INCOME: "Renda",
  EXPENSE: "Gasto",
  TRANSFER: "Transferencia",
  BENEFIT: "Beneficio",
};

export function PeopleFinancialRelationsPanel({ personId }: { personId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { data: familyData, loadDetailed, refresh: refreshFamily } =
    useFamilyRelationsContext();
  const { entries, isLoading, error, create, remove } = usePeopleFinancial(personId);
  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(() => {
    if (!familyData) void loadDetailed();
  }, [familyData, loadDetailed]);

  const householdLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    const currentId = familyData?.household?.id ?? null;
    if (currentId) {
      map.set(currentId, familyData?.household?.name ?? "Residencia atual");
    }
    (familyData?.relatedHouseholds ?? []).forEach((item) => {
      if (!item.householdId) return;
      map.set(
        item.householdId,
        item.householdName ?? `Residencia de ${item.personName}`,
      );
    });
    return map;
  }, [familyData]);

  const columns = React.useMemo<ColumnDef<PersonFinancialEntry, unknown>[]>(
    () => [
      {
        accessorKey: "entryType",
        header: "Tipo",
        cell: ({ row }) => ENTRY_TYPE_LABELS[row.original.entryType],
      },
      {
        accessorKey: "category",
        header: "Categoria",
        cell: ({ row }) => <TruncatedTextCell text={row.original.category} className="text-sm" />,
      },
      {
        accessorKey: "subcategory",
        header: "Subcategoria",
        cell: ({ row }) => <TruncatedTextCell text={row.original.subcategory} className="text-sm" />,
      },
      {
        accessorKey: "amount",
        header: "Valor",
        cell: ({ row }) =>
          row.original.amount == null ? "-" : row.original.amount.toLocaleString("pt-BR"),
      },
      {
        accessorKey: "frequency",
        header: "Frequencia",
      },
      {
        id: "flow",
        header: "Familia / Fluxo",
        cell: ({ row }) => {
          if (row.original.entryType === "TRANSFER") {
            const from = householdLabelById.get(row.original.fromHouseholdId ?? "") ?? "-";
            const to = householdLabelById.get(row.original.toHouseholdId ?? "") ?? "-";
            return <TruncatedTextCell text={`${from} -> ${to}`} className="text-sm" />;
          }
          return (
            <TruncatedTextCell
              text={householdLabelById.get(row.original.householdId ?? "") ?? "-"}
              className="text-sm"
            />
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <TruncatedTextCell text={row.original.status} className="text-sm" />,
      },
      {
        accessorKey: "notes",
        header: "Notas",
        cell: ({ row }) => <TruncatedTextCell text={row.original.notes} className="text-sm" />,
      },
      {
        id: "actions",
        header: "",
        size: 60,
        cell: ({ row }) => (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              void (async () => {
                await remove(row.original.id);
                await refreshFamily();
              })();
            }}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        ),
      },
    ],
    [householdLabelById, refreshFamily, remove],
  );

  const filterRow = React.useCallback((row: PersonFinancialEntry, query: string) => {
    const values = [
      row.entryType,
      row.category,
      row.subcategory,
      row.status,
      row.frequency,
      row.notes,
    ];
    return values.some((value) =>
      String(value ?? "").toLowerCase().includes(query),
    );
  }, []);

  return (
    <>
      <DetailRelationTablePanel
        data={entries}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={(row) =>
          router.push(
            withTenantPath(buildPeopleFinancialEntryPath(personId, row.id), tenantSlug),
          )
        }
        searchPlaceholder="Pesquisar financeiro"
        filterRow={filterRow}
        onAdd={() => setCreateOpen(true)}
        loading={isLoading}
        error={error}
        emptyMessage="Nenhum registro financeiro cadastrado."
        tableInitialColumnPinning={{ left: ["entryType"], right: ["actions"] }}
        filterFields={[
          {
            name: "tipo",
            label: "Tipo",
            type: "select",
            options: Object.entries(ENTRY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
          },
          { name: "categoria", label: "Categoria", type: "text" },
          { name: "status", label: "Status", type: "text" },
        ]}
        buildSearchRecord={(row) => ({
          tipo: ENTRY_TYPE_LABELS[row.entryType],
          categoria: row.category ?? null,
          status: row.status ?? null,
        })}
        searchActionId="people.financial-relations"
      />
      <FinancialEntryQuickCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (payload) => {
          await create({
            entryType: payload.entryType,
            category: payload.category,
            frequency: payload.frequency,
            amount: payload.amount ?? null,
            includeInHouseholdBudget: false,
          });
          await refreshFamily();
        }}
      />
    </>
  );
}
