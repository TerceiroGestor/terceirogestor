"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { SectionDialog } from "@/components/section-dialog";
import { useToast } from "@/components/ui/use-toast";
import { listPeople, type ApiPerson } from "@/modules/people/api";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import {
  getAgeFromBirthDate,
  resolvePersonDisplayNames,
} from "@/modules/people/shared/domain/utils";
import { usePathname } from "next/navigation";
import { getTenantSlugFromPath } from "@/lib/tenant-path";
import {
  createProjectEnrollment,
} from "@/modules/projects/api";

type BulkEnrollmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  projectId: string;
  canReadPeople: boolean;
  onCompleted: () => void;
};

function resolveErrorMessage(err: unknown, fallback: string) {
  return err && typeof err === "object" && "message" in err
    ? String((err as { message?: string }).message)
    : fallback;
}

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  run: (item: T) => Promise<void>,
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.allSettled(batch.map((item) => run(item)));
  }
}

export function BulkEnrollmentDialog({
  open,
  onOpenChange,
  token,
  projectId,
  canReadPeople,
  onCompleted,
}: BulkEnrollmentDialogProps) {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { toast } = useToast();

  const [peopleRows, setPeopleRows] = React.useState<ApiPerson[]>([]);
  const [selectedPeople, setSelectedPeople] = React.useState<ApiPerson[]>([]);
  const [peopleLoading, setPeopleLoading] = React.useState(true);
  const [peopleError, setPeopleError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const columns = React.useMemo<ColumnDef<ApiPerson>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Pessoa",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <PersonIdentityAvatarTrigger
              personId={row.original.id}
              tenantSlug={tenantSlug}
              fullName={row.original.fullName}
              socialName={row.original.socialName}
              birthDate={row.original.birthDate ?? null}
              ageLabel={(() => {
                const age = getAgeFromBirthDate(row.original.birthDate);
                return age !== null ? `${age} anos` : null;
              })()}
              avatarUrl={row.original.avatarUrl}
              hasHealthCondition={row.original.hasHealthCondition ?? false}
              hasMedication={row.original.hasMedication ?? false}
              isBirthdayToday={false}
            />
            <div className="leading-tight">
              {(() => {
                const display = resolvePersonDisplayNames(
                  row.original.fullName,
                  row.original.socialName,
                );
                return (
                  <>
                    <p className="text-xs font-semibold text-foreground">
                      {display.primary}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {display.secondary ? `${display.secondary} • ` : ""}
                      {row.original.status ?? "-"}
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "personType",
        header: "Tipo",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.personType ?? "-"}
          </span>
        ),
      },
      {
        id: "age",
        header: "Idade",
        accessorFn: (person) => getAgeFromBirthDate(person.birthDate) ?? null,
        meta: { dataType: "number" },
        cell: ({ row }) => {
          const age = getAgeFromBirthDate(row.original.birthDate);
          return (
            <span className="text-xs text-muted-foreground">
              {age !== null ? `${age}` : "-"}
            </span>
          );
        },
      },
    ],
    [tenantSlug],
  );

  const loadPeople = React.useCallback(async () => {
    if (!open) return;
    if (!canReadPeople) {
      setPeopleLoading(false);
      setPeopleError("Você não tem permissão para listar pessoas.");
      setPeopleRows([]);
      setTotalCount(0);
      setPageCount(0);
      return;
    }
    setPeopleLoading(true);
    setPeopleError(null);
    try {
      const response = await listPeople(token, {
        q: search.trim() || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      setPeopleRows(response.data);
      setTotalCount(response.pagination.total);
      setPageCount(response.pagination.pages);
    } catch (err) {
      setPeopleError(resolveErrorMessage(err, "Falha ao carregar pessoas."));
      setPeopleRows([]);
      setTotalCount(0);
      setPageCount(0);
    } finally {
      setPeopleLoading(false);
    }
  }, [
    open,
    token,
    canReadPeople,
    search,
    pagination.pageIndex,
    pagination.pageSize,
  ]);

  React.useEffect(() => {
    if (!open) return;
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setSelectedPeople([]);
  }, [open, search]);

  React.useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  const handleBulkLink = React.useCallback(
    async (selectedPeople: ApiPerson[]) => {
      if (selectedPeople.length === 0) return;
      setSaving(true);
      setFormError(null);
      let created = 0;
      let alreadyLinked = 0;
      let failed = 0;

      const errors: string[] = [];

      try {
        const today = new Date().toISOString().slice(0, 10);
        await runInBatches(selectedPeople, 6, async (person) => {
          try {
            await createProjectEnrollment(token, projectId, {
              personId: person.id,
              startsAt: today,
              status: "ACTIVE",
            });
            created += 1;
          } catch (err) {
            const message = resolveErrorMessage(err, "Falha ao vincular pessoa.");
            if (message.toLowerCase().includes("já está vinculada")) {
              alreadyLinked += 1;
              return;
            }
            failed += 1;
            errors.push(`${person.fullName}: ${message}`);
          }
        });

        toast({
          title: "Vínculo em massa concluído",
          description: `Vinculadas: ${created} • Já vinculadas: ${alreadyLinked} • Erros: ${failed}`,
          variant: failed > 0 ? "destructive" : "default",
        });

        onCompleted();

        if (failed > 0) {
          setFormError(errors.slice(0, 5).join("\n"));
        } else {
          onOpenChange(false);
        }
      } finally {
        setSaving(false);
      }
    },
    [token, projectId, toast, onCompleted, onOpenChange],
  );

  return (
    <SectionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Vincular Pessoas"
      description="Selecione as pessoas para vincular ao projeto."
      contentClassName="max-w-[1100px]"
      headerSlot={
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Selecionados: <strong>{selectedPeople.length}</strong>
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={saving || selectedPeople.length === 0}
            onClick={() => handleBulkLink(selectedPeople)}
          >
            {saving ? "Vinculando..." : "Vincular selecionados"}
          </Button>
        </div>
      }
    >
      {formError ? (
        <div className="whitespace-pre-line rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      ) : null}

      {peopleError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {peopleError}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={peopleRows}
        manualPagination
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={(next) => setPagination(next)}
        totalCount={totalCount}
        onGlobalFilterChange={setSearch}
        searchPlaceholder="Pesquisar pessoas"
        showExportMenu={false}
        enableRowSelection
        onSelectedRowsChange={setSelectedPeople}
        tableClassName="w-full"
        summaryCards={{
          totalLabel: "Total",
          filteredLabel: "Filtrados",
        }}
      />

      {peopleLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : null}
    </SectionDialog>
  );
}
