"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { useDetentions } from "@/modules/people/features/detentions/data/use-detentions";
import { DetentionQuickCreateDialog } from "@/modules/people/features/detentions/ui/detention-quick-create-dialog";
import { buildPeopleDetentionPath } from "@/modules/people/shared/domain/people-relation-routes";
import type { PersonDetention } from "@/modules/people/shared/domain/types";
import { DetailRelationTablePanel } from "@/web-client/detail/DetailRelationTablePanel";
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";

export function DetentionsPanel({ personId }: { personId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { detentions, isLoading, error, create, remove } = useDetentions(personId);
  const [createOpen, setCreateOpen] = React.useState(false);

  const columns = React.useMemo<ColumnDef<PersonDetention, unknown>[]>(
    () => [
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        accessorKey: "unit",
        header: "Unidade",
        cell: ({ row }) => <TruncatedTextCell text={row.original.unit} className="text-sm" />,
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => <TruncatedTextCell text={row.original.type} className="text-sm" />,
      },
      {
        accessorKey: "startDate",
        header: "Inicio",
        cell: ({ row }) => (
          <span className="block truncate whitespace-nowrap">
            {row.original.startDate?.slice(0, 10) ?? "-"}
          </span>
        ),
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
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                void remove(row.original.id);
              }}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [remove],
  );

  const filterRow = React.useCallback((row: PersonDetention, query: string) => {
    const values = [row.status, row.type, row.unit, row.notes];
    return values.some((value) => String(value ?? "").toLowerCase().includes(query));
  }, []);

  return (
    <>
      <DetailRelationTablePanel
        data={detentions}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={(row) =>
          router.push(
            withTenantPath(buildPeopleDetentionPath(personId, row.id), tenantSlug),
          )
        }
        searchPlaceholder="Pesquisar registros"
        filterRow={filterRow}
        onAdd={() => setCreateOpen(true)}
        loading={isLoading}
        error={error}
        emptyMessage="Nenhum registro de reclusao."
        tableInitialColumnPinning={{ left: ["status"], right: ["actions"] }}
        filterFields={[
          { name: "unidade", label: "Unidade", type: "text" },
          { name: "tipo", label: "Tipo", type: "text" },
          { name: "inicio", label: "Inicio", type: "date" },
        ]}
        buildSearchRecord={(row) => ({
          unidade: row.unit ?? null,
          tipo: row.type ?? null,
          inicio: row.startDate ?? null,
        })}
        searchActionId="people.detentions"
      />
      <DetentionQuickCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (payload) => {
          await create({ status: payload.status, type: payload.type ?? null });
        }}
      />
    </>
  );
}
