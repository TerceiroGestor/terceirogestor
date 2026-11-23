"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { EDUCATION_STATUS_OPTIONS } from "@/modules/people/features/education/config/education.constants";
import { useEducation } from "@/modules/people/features/education/data/use-education";
import { EducationQuickCreateDialog } from "@/modules/people/features/education/ui/education-quick-create-dialog";
import { buildPeopleEducationPath } from "@/modules/people/shared/domain/people-relation-routes";
import type { EducationRecord } from "@/modules/people/shared/domain/types";
import { DetailRelationTablePanel } from "@/web-client/detail/DetailRelationTablePanel";
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";

export function EducationPanel({ personId }: { personId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { educations, isLoading, error, create, remove } = useEducation(personId);
  const [createOpen, setCreateOpen] = React.useState(false);

  const columns = React.useMemo<ColumnDef<EducationRecord, unknown>[]>(
    () => [
      {
        accessorKey: "level",
        header: "Nivel",
      },
      {
        accessorKey: "institution",
        header: "Instituicao",
        cell: ({ row }) => <TruncatedTextCell text={row.original.institution} className="text-sm" />,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <TruncatedTextCell text={row.original.status} className="text-sm" />,
      },
      {
        accessorKey: "grade",
        header: "Serie",
        cell: ({ row }) => <TruncatedTextCell text={row.original.grade} className="text-sm" />,
      },
      {
        accessorKey: "schoolYear",
        header: "Ano",
        cell: ({ row }) => <TruncatedTextCell text={row.original.schoolYear} className="text-sm" />,
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

  const filterRow = React.useCallback((row: EducationRecord, query: string) => {
    const values = [row.level, row.institution, row.status, row.grade, row.schoolYear, row.notes];
    return values.some((value) => String(value ?? "").toLowerCase().includes(query));
  }, []);

  return (
    <>
      <DetailRelationTablePanel
        data={educations}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={(row) =>
          router.push(
            withTenantPath(buildPeopleEducationPath(personId, row.id), tenantSlug),
          )
        }
        searchPlaceholder="Pesquisar escolaridade"
        filterRow={filterRow}
        onAdd={() => setCreateOpen(true)}
        loading={isLoading}
        error={error}
        emptyMessage="Nenhum registro de escolaridade."
        tableInitialColumnPinning={{ left: ["level"], right: ["actions"] }}
        filterFields={[
          { name: "instituicao", label: "Instituicao", type: "text" },
          { name: "status", label: "Status", type: "select", options: [...EDUCATION_STATUS_OPTIONS] },
        ]}
        buildSearchRecord={(row) => ({
          instituicao: row.institution ?? null,
          status: row.status ?? null,
        })}
        searchActionId="people.education"
      />
      <EducationQuickCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (payload) => {
          await create({ level: payload.level, status: payload.status ?? null, isCurrent: true });
        }}
      />
    </>
  );
}
