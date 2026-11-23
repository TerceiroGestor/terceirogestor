"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resolveMediaUrl } from "@/lib/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { medicationReasonOptions } from "@/modules/people/features/medications/config/medication-form-config";
import { useMedications } from "@/modules/people/features/medications/data/use-medications";
import { MedicationQuickCreateDialog } from "@/modules/people/features/medications/ui/medication-quick-create-dialog";
import { buildPeopleMedicationPath } from "@/modules/people/shared/domain/people-relation-routes";
import type { Medication } from "@/modules/people/shared/domain/types";
import { DetailRelationTablePanel } from "@/web-client/detail/DetailRelationTablePanel";
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";

export function MedicationsPanel({ personId }: { personId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { medications, isLoading, error, create, remove } = useMedications(personId);
  const [createOpen, setCreateOpen] = React.useState(false);

  const columns = React.useMemo<ColumnDef<Medication, unknown>[]>(
    () => [
      {
        accessorKey: "medication",
        header: "Medicacao",
      },
      {
        accessorKey: "reason",
        header: "Motivo",
        cell: ({ row }) => <TruncatedTextCell text={row.original.reason} className="text-sm" />,
      },
      {
        accessorKey: "dosage",
        header: "Dosagem",
        cell: ({ row }) => <TruncatedTextCell text={row.original.dosage} className="text-sm" />,
      },
      {
        accessorKey: "schedule",
        header: "Frequencia",
        cell: ({ row }) => <TruncatedTextCell text={row.original.schedule} className="text-sm" />,
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
        id: "document",
        header: "Documento",
        cell: ({ row }) =>
          !row.original.documentUrl ? (
            <span className="text-muted-foreground">-</span>
          ) : (
            <a
              href={resolveMediaUrl(row.original.documentUrl)}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-primary hover:underline"
            >
              Abrir
              <ExternalLink className="size-3" />
            </a>
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

  const filterRow = React.useCallback((row: Medication, query: string) => {
    const values = [row.medication, row.reason, row.dosage, row.schedule, row.notes];
    return values.some((value) => String(value ?? "").toLowerCase().includes(query));
  }, []);

  return (
    <>
      <DetailRelationTablePanel
        data={medications}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={(row) =>
          router.push(
            withTenantPath(buildPeopleMedicationPath(personId, row.id), tenantSlug),
          )
        }
        searchPlaceholder="Pesquisar medicacoes"
        filterRow={filterRow}
        onAdd={() => setCreateOpen(true)}
        loading={isLoading}
        error={error}
        emptyMessage="Nenhuma medicacao cadastrada."
        tableInitialColumnPinning={{ left: ["medication"], right: ["actions"] }}
        filterFields={[
          { name: "motivo", label: "Motivo", type: "select", options: medicationReasonOptions },
          { name: "inicio", label: "Inicio", type: "date" },
        ]}
        buildSearchRecord={(row) => ({
          motivo: row.reason ?? null,
          inicio: row.startDate ?? null,
        })}
        searchActionId="people.medications"
      />
      <MedicationQuickCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (payload) => {
          await create({
            medication: payload.medication,
            reason: payload.reason ?? null,
            dosage: payload.dosage ?? null,
          });
        }}
      />
    </>
  );
}
