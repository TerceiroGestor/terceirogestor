"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resolveMediaUrl } from "@/lib/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  healthConditionSeverityOptions,
  healthConditionTypeOptions,
} from "@/modules/people/features/health-conditions/config/health-condition-form-config";
import { useHealthConditions } from "@/modules/people/features/health-conditions/data/use-health-conditions";
import { HealthConditionQuickCreateDialog } from "@/modules/people/features/health-conditions/ui/health-condition-quick-create-dialog";
import { buildPeopleHealthConditionPath } from "@/modules/people/shared/domain/people-relation-routes";
import type { HealthCondition } from "@/modules/people/shared/domain/types";
import { DetailRelationTablePanel } from "@/web-client/detail/DetailRelationTablePanel";
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";

export function HealthConditionsPanel({ personId }: { personId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { conditions, isLoading, error, create, remove } = useHealthConditions(personId);
  const [createOpen, setCreateOpen] = React.useState(false);

  const columns = React.useMemo<ColumnDef<HealthCondition, unknown>[]>(
    () => [
      {
        accessorKey: "type",
        header: "Condicao",
      },
      {
        accessorKey: "description",
        header: "Descricao",
        cell: ({ row }) => <TruncatedTextCell text={row.original.description} className="text-sm" />,
      },
      {
        accessorKey: "severity",
        header: "Gravidade",
        cell: ({ row }) => <TruncatedTextCell text={row.original.severity} className="text-sm" />,
      },
      {
        accessorKey: "diagnosisDate",
        header: "Diagnostico",
        cell: ({ row }) => (
          <span className="block truncate whitespace-nowrap">
            {row.original.diagnosisDate?.slice(0, 10) ?? "-"}
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

  const filterRow = React.useCallback((row: HealthCondition, query: string) => {
    const values = [row.type, row.description, row.severity, row.notes];
    return values.some((value) => String(value ?? "").toLowerCase().includes(query));
  }, []);

  return (
    <>
      <DetailRelationTablePanel
        data={conditions}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={(row) =>
          router.push(
            withTenantPath(buildPeopleHealthConditionPath(personId, row.id), tenantSlug),
          )
        }
        searchPlaceholder="Pesquisar condicoes"
        filterRow={filterRow}
        onAdd={() => setCreateOpen(true)}
        loading={isLoading}
        error={error}
        emptyMessage="Nenhuma condicao cadastrada."
        tableInitialColumnPinning={{ left: ["type"], right: ["actions"] }}
        filterFields={[
          { name: "condicao", label: "Condicao", type: "select", options: healthConditionTypeOptions },
          { name: "gravidade", label: "Gravidade", type: "select", options: healthConditionSeverityOptions },
          { name: "diagnostico", label: "Diagnostico", type: "date" },
        ]}
        buildSearchRecord={(row) => ({
          condicao: row.type,
          gravidade: row.severity ?? null,
          diagnostico: row.diagnosisDate ?? null,
        })}
        searchActionId="people.health-conditions"
      />
      <HealthConditionQuickCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (payload) => {
          await create({ type: payload.type, severity: payload.severity ?? null });
        }}
      />
    </>
  );
}
